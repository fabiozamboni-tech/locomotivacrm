export interface EmailSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  headerHtml: string;
  signatureHtml: string;
}

export interface RespostaAutomaticaItem {
  id: string;
  titulo: string;
  gatilho: string;
  texto: string;
}

export interface WhatsAppConfig {
  numeroAgencia: string;
  gatewayTipo: "web_link" | "zapi" | "evolution_api" | "custom_webhook";
  apiUrl?: string;
  apiKey?: string;
  respostasAutomaticas: RespostaAutomaticaItem[];
}

export interface ComunicacaoSettings {
  email: EmailSmtpConfig;
  whatsapp: WhatsAppConfig;
}

const STORAGE_KEY = "locomotiva_comunicacao_settings_v1";

export const DEFAULT_EMAIL_SETTINGS: EmailSmtpConfig = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  user: "",
  pass: "",
  fromName: "Locomotiva Comunicação",
  fromEmail: "contato@locomotivacomunicacao.com.br",
  headerHtml: `<div style="padding: 18px 24px; background: #0f172a; border-radius: 8px 8px 0 0; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 3px solid #3b82f6;">
  <div style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">LOCOMOTIVA <span style="color: #38bdf8;">COMUNICAÇÃO</span></div>
  <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">Comunicação 360 · Branding · Performance · Sistemas</div>
</div>`,
  signatureHtml: `<div style="margin-top: 30px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-family: 'Segoe UI', Arial, sans-serif; color: #334155; font-size: 13px; line-height: 1.5;">
  <div style="font-weight: 700; color: #0f172a; font-size: 14px;">Equipe Comercial · Locomotiva Comunicação</div>
  <div style="color: #64748b; font-size: 12px;">Comunicação 360 & Sistemas de Gestão</div>
  <div style="margin-top: 6px; color: #3b82f6;">
    <a href="https://locomotivacomunicacao.com.br" style="color: #3b82f6; text-decoration: none; font-weight: 600;">locomotivacomunicacao.com.br</a> · Serra Gaúcha / RS
  </div>
</div>`,
};

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppConfig = {
  numeroAgencia: "54999990000",
  gatewayTipo: "web_link",
  apiUrl: "",
  apiKey: "",
  respostasAutomaticas: [
    {
      id: "resp_apresentacao",
      titulo: "Apresentação Consultiva Locomotiva",
      gatilho: "Primeiro contato",
      texto: "Olá! Sou da Locomotiva Comunicação. Mapeamos oportunidades de captação e processos na sua empresa e estruturamos uma micro-auditoria prática de 2 minutos. Posso enviar o link?",
    },
    {
      id: "resp_valores",
      titulo: "Esclarecimento sobre Investimento & ROI",
      gatilho: "Preço / Quanto custa",
      texto: "Nossos projetos são desenhados sob medida para se pagarem rapidamente com aumento no volume e ticket dos seus orçamentos. Podemos fazer uma simulação de 10 minutos?",
    },
    {
      id: "resp_sistemas",
      titulo: "Sistemas de Gestão & Automação",
      gatilho: "Falta de tempo / Processos",
      texto: "Além da comunicação visual e marketing, nós entregamos o CRM e automações 100% configurados para que sua equipe não perca tempo e receba os orçamentos prontos.",
    },
    {
      id: "resp_auditoria",
      titulo: "Envio do Link de Auditoria Pública",
      gatilho: "Envio de link",
      texto: "Conforme conversamos, segue o link da sua Micro-Auditoria Interativa exclusiva: [LinkAuditoria]. Fico à disposição para esclarecer qualquer ponto!",
    },
  ],
};

export function getComunicacaoSettings(): ComunicacaoSettings {
  if (typeof window === "undefined") {
    return {
      email: DEFAULT_EMAIL_SETTINGS,
      whatsapp: DEFAULT_WHATSAPP_SETTINGS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        email: DEFAULT_EMAIL_SETTINGS,
        whatsapp: DEFAULT_WHATSAPP_SETTINGS,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      email: { ...DEFAULT_EMAIL_SETTINGS, ...parsed.email },
      whatsapp: {
        ...DEFAULT_WHATSAPP_SETTINGS,
        ...parsed.whatsapp,
        respostasAutomaticas: parsed.whatsapp?.respostasAutomaticas || DEFAULT_WHATSAPP_SETTINGS.respostasAutomaticas,
      },
    };
  } catch {
    return {
      email: DEFAULT_EMAIL_SETTINGS,
      whatsapp: DEFAULT_WHATSAPP_SETTINGS,
    };
  }
}

export function saveComunicacaoSettings(settings: Partial<ComunicacaoSettings>): ComunicacaoSettings {
  const current = getComunicacaoSettings();
  const updated: ComunicacaoSettings = {
    email: { ...current.email, ...(settings.email || {}) },
    whatsapp: {
      ...current.whatsapp,
      ...(settings.whatsapp || {}),
      respostasAutomaticas:
        settings.whatsapp?.respostasAutomaticas || current.whatsapp.respostasAutomaticas,
    },
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Erro ao salvar comunicacao settings:", e);
    }
  }

  return updated;
}
