import { createServerFn } from "@tanstack/react-start";
import nodemailer from "nodemailer";
import type { EmailSmtpConfig } from "./comunicacao-settings";

export interface EnvioEmailInput {
  para: string;
  assunto: string;
  corpoTexto: string;
  corpoHtml?: string;
  nomeDestinatario?: string;
  config?: Partial<EmailSmtpConfig>;
}

export interface EnvioEmailResult {
  sucesso: boolean;
  mensagemId?: string;
  erro?: string;
  modo: "smtp_real" | "simulado";
  detalhes?: string;
}

export const enviarEmailDireto_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: EnvioEmailInput) => data)
  .handler(async ({ data }): Promise<EnvioEmailResult> => {
    const smtpHost = data.config?.host || process.env.SMTP_HOST;
    const smtpPort = Number(data.config?.port || process.env.SMTP_PORT || 587);
    const smtpUser = data.config?.user || process.env.SMTP_USER;
    const smtpPass = data.config?.pass || process.env.SMTP_PASS;
    const fromName = data.config?.fromName || "Locomotiva Comunicação";
    const fromEmail = data.config?.fromEmail || smtpUser || "contato@locomotivacomunicacao.com.br";
    const secure = data.config?.secure ?? (smtpPort === 465);

    if (!data.para || !data.para.includes("@")) {
      return {
        sucesso: false,
        modo: "smtp_real",
        erro: "Endereço de e-mail do destinatário inválido.",
      };
    }

    // Se tiver credenciais SMTP completas, envia via nodemailer
    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        // Monta HTML completo com Header e Assinatura se fornecidos
        const header = data.config?.headerHtml || "";
        const signature = data.config?.signatureHtml || "";
        const corpoFormatado = data.corpoHtml || `<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; padding: 16px 0;">${data.corpoTexto}</div>`;

        const fullHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    ${header}
    <div style="padding: 24px;">
      ${corpoFormatado}
      ${signature}
    </div>
  </div>
</body>
</html>
`;

        const info = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: data.para,
          subject: data.assunto,
          text: data.corpoTexto,
          html: fullHtml,
        });

        return {
          sucesso: true,
          modo: "smtp_real",
          mensagemId: info.messageId,
          detalhes: `E-mail enviado com sucesso para ${data.para} através do servidor ${smtpHost}!`,
        };
      } catch (err: any) {
        console.error("Erro no envio SMTP real:", err);
        return {
          sucesso: false,
          modo: "smtp_real",
          erro: `Falha na conexão SMTP (${err.message || "Erro desconhecido"}). Verifique Host, Porta e Senha de App.`,
        };
      }
    }

    // Caso não haja SMTP configurado, retorna aviso de simulação com payload
    return {
      sucesso: true,
      modo: "simulado",
      detalhes: `SMTP não configurado. Para envio automático direto pelo servidor, preencha o Host e Senha em Configurações > E-mail. Você também pode disparar via seu cliente de e-mail padrão.`,
    };
  });

export interface DisparoWhatsAppInput {
  numero: string;
  mensagem: string;
  gatewayTipo?: "web_link" | "zapi" | "evolution_api" | "custom_webhook";
  apiUrl?: string;
  apiKey?: string;
}

export interface DisparoWhatsAppResult {
  sucesso: boolean;
  modo: "gateway_api" | "web_link";
  detalhes?: string;
  erro?: string;
  directUrl?: string;
}

export const dispararWhatsApp_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: DisparoWhatsAppInput) => data)
  .handler(async ({ data }): Promise<DisparoWhatsAppResult> => {
    const rawNumber = data.numero.replace(/\D/g, "");
    const formattedNumber = rawNumber.startsWith("55") ? rawNumber : `55${rawNumber}`;

    if (rawNumber.length < 10) {
      return {
        sucesso: false,
        modo: "web_link",
        erro: "Número de telefone / WhatsApp inválido.",
      };
    }

    // Se estiver configurado com API de Gateway (Z-API / Evolution / Webhook)
    if (data.gatewayTipo && data.gatewayTipo !== "web_link" && data.apiUrl) {
      try {
        let headers: Record<string, string> = { "Content-Type": "application/json" };
        if (data.apiKey) {
          headers["apikey"] = data.apiKey;
          headers["Authorization"] = `Bearer ${data.apiKey}`;
          headers["Client-Token"] = data.apiKey;
        }

        const bodyPayload = JSON.stringify({
          phone: formattedNumber,
          number: formattedNumber,
          message: data.mensagem,
          text: data.mensagem,
        });

        const resp = await fetch(data.apiUrl, {
          method: "POST",
          headers,
          body: bodyPayload,
        });

        if (resp.ok) {
          return {
            sucesso: true,
            modo: "gateway_api",
            detalhes: `Mensagem enviada com sucesso para ${formattedNumber} via Gateway WhatsApp!`,
          };
        } else {
          const errText = await resp.text();
          return {
            sucesso: false,
            modo: "gateway_api",
            erro: `O gateway retornou erro HTTP ${resp.status}: ${errText.slice(0, 100)}`,
            directUrl: `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(data.mensagem)}`,
          };
        }
      } catch (err: any) {
        return {
          sucesso: false,
          modo: "gateway_api",
          erro: `Falha ao conectar no gateway: ${err.message}`,
          directUrl: `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(data.mensagem)}`,
        };
      }
    }

    // Fallback padrão web link oficial
    return {
      sucesso: true,
      modo: "web_link",
      directUrl: `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(data.mensagem)}`,
      detalhes: "Link direto oficial do WhatsApp gerado para envio instantâneo.",
    };
  });
