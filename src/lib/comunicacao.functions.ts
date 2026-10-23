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
  empresaId?: string;
  empresaNome?: string;
  gatewayTipo?: "web_link" | "evolution_api" | "custom_webhook" | "zapi";
  // Evolution API
  evolutionUrl?: string;
  evolutionInstance?: string;
  evolutionApiKey?: string;
  evolutionFallbackNativo?: boolean;
  // Legado / Genérico
  apiUrl?: string;
  apiKey?: string;
}

export interface DisparoWhatsAppResult {
  sucesso: boolean;
  modo: "evolution_api" | "gateway_api" | "web_link";
  mensagemId?: string;
  detalhes?: string;
  erro?: string;
  directUrl?: string;
  fallbackAcionado?: boolean;
}

export const dispararWhatsApp_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: DisparoWhatsAppInput) => data)
  .handler(async ({ data }): Promise<DisparoWhatsAppResult> => {
    const rawNumber = data.numero.replace(/\D/g, "");
    // Sanitização para padrão internacional WhatsApp (DDI Brasil 55)
    let formattedNumber = rawNumber;
    if (rawNumber.length === 10 || rawNumber.length === 11) {
      formattedNumber = `55${rawNumber}`;
    }

    const directWebUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(data.mensagem)}`;

    if (rawNumber.length < 10) {
      return {
        sucesso: false,
        modo: "web_link",
        erro: "Número de telefone / WhatsApp inválido (mínimo de 10 dígitos com DDD).",
      };
    }

    // MODO 1: EVOLUTION API (v2)
    if (data.gatewayTipo === "evolution_api" && data.evolutionUrl && data.evolutionInstance) {
      try {
        const baseUrl = data.evolutionUrl.replace(/\/+$/, "");
        const instance = encodeURIComponent(data.evolutionInstance.trim());
        const endpoint = `${baseUrl}/message/sendText/${instance}`;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (data.evolutionApiKey) {
          headers["apikey"] = data.evolutionApiKey.trim();
        }

        const bodyPayload = JSON.stringify({
          number: formattedNumber,
          text: data.mensagem,
          linkPreview: true,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        const resp = await fetch(endpoint, {
          method: "POST",
          headers,
          body: bodyPayload,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const respData = await resp.json().catch(() => ({}));
          const msgId = respData?.key?.id || respData?.messageId || respData?.id;
          return {
            sucesso: true,
            modo: "evolution_api",
            mensagemId: msgId,
            detalhes: `Mensagem enviada com sucesso em segundo plano via Evolution API (Instância: ${data.evolutionInstance})!`,
          };
        } else {
          const errText = await resp.text().catch(() => "Sem detalhes");
          const fallback = data.evolutionFallbackNativo !== false;
          return {
            sucesso: false,
            modo: "evolution_api",
            erro: `Evolution API retornou status ${resp.status}: ${errText.slice(0, 150)}`,
            directUrl: fallback ? directWebUrl : undefined,
            fallbackAcionado: fallback,
            detalhes: fallback
              ? "Evolution API indisponível. Abrindo contingência no WhatsApp Web Oficial..."
              : undefined,
          };
        }
      } catch (err: any) {
        const fallback = data.evolutionFallbackNativo !== false;
        return {
          sucesso: false,
          modo: "evolution_api",
          erro: `Falha ao conectar no servidor da Evolution API: ${err.message || "Timeout ou Conexão Recusada"}`,
          directUrl: fallback ? directWebUrl : undefined,
          fallbackAcionado: fallback,
          detalhes: fallback
            ? "Servidor Evolution API offline. Abrindo contingência no WhatsApp Web Oficial..."
            : undefined,
        };
      }
    }

    // MODO LEGADO (Webhook Customizado / Z-API)
    if (data.gatewayTipo && data.gatewayTipo !== "web_link" && data.gatewayTipo !== "evolution_api" && data.apiUrl) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
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
          empresaId: data.empresaId,
          empresaNome: data.empresaNome,
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
            detalhes: `Mensagem enviada com sucesso para ${formattedNumber} via Gateway!`,
          };
        } else {
          const errText = await resp.text().catch(() => "");
          return {
            sucesso: false,
            modo: "gateway_api",
            erro: `Gateway retornou erro HTTP ${resp.status}: ${errText.slice(0, 120)}`,
            directUrl: directWebUrl,
          };
        }
      } catch (err: any) {
        return {
          sucesso: false,
          modo: "gateway_api",
          erro: `Falha na requisição ao gateway: ${err.message}`,
          directUrl: directWebUrl,
        };
      }
    }

    // MODO PADRÃO: WHATSAPP WEB OFICIAL (NATIVO)
    return {
      sucesso: true,
      modo: "web_link",
      directUrl: directWebUrl,
      detalhes: "Link oficial do WhatsApp Web/Desktop gerado para envio imediato.",
    };
  });

export interface TesteConexaoEvolutionInput {
  evolutionUrl: string;
  evolutionInstance: string;
  evolutionApiKey: string;
}

export interface TesteConexaoEvolutionResult {
  conectado: boolean;
  state: "open" | "connecting" | "close" | "offline";
  detalhes: string;
  instanciaNome?: string;
  profileName?: string;
}

export const testarConexaoEvolution_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: TesteConexaoEvolutionInput) => data)
  .handler(async ({ data }): Promise<TesteConexaoEvolutionResult> => {
    if (!data.evolutionUrl || !data.evolutionInstance) {
      return {
        conectado: false,
        state: "offline",
        detalhes: "Informe a URL da Evolution API e o Nome da Instância.",
      };
    }

    try {
      const baseUrl = data.evolutionUrl.replace(/\/+$/, "");
      const instance = encodeURIComponent(data.evolutionInstance.trim());
      const endpoint = `${baseUrl}/instance/connectionState/${instance}`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (data.evolutionApiKey) {
        headers["apikey"] = data.evolutionApiKey.trim();
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(endpoint, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = await resp.json().catch(() => ({}));
        const stateRaw = String(json?.instance?.state || json?.state || "").toLowerCase();

        if (stateRaw === "open") {
          return {
            conectado: true,
            state: "open",
            instanciaNome: data.evolutionInstance,
            detalhes: `Instância "${data.evolutionInstance}" conectada com sucesso ao WhatsApp! Sessão ativa e pronta para envios.`,
          };
        } else if (stateRaw === "connecting") {
          return {
            conectado: false,
            state: "connecting",
            instanciaNome: data.evolutionInstance,
            detalhes: `Instância "${data.evolutionInstance}" está conectando ou aguardando leitura do QR Code.`,
          };
        } else {
          return {
            conectado: false,
            state: "close",
            instanciaNome: data.evolutionInstance,
            detalhes: `Instância "${data.evolutionInstance}" encontrada, mas o WhatsApp está desconectado (${stateRaw || "close"}). Abra o painel da Evolution e escaneie o QR Code.`,
          };
        }
      } else {
        const errText = await resp.text().catch(() => "");
        return {
          conectado: false,
          state: "offline",
          detalhes: `O servidor respondeu com status ${resp.status}: ${errText.slice(0, 100) || "Instância não encontrada ou API Key incorreta."}`,
        };
      }
    } catch (err: any) {
      return {
        conectado: false,
        state: "offline",
        detalhes: `Não foi possível conectar ao servidor (${err.message || "Timeout"}). Verifique se a URL está correta e com HTTPS acessível.`,
      };
    }
  });
