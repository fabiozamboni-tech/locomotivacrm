-- =============================================================================
-- LOCOMOTIVA CRM - ESQUEMA DE BANCO DE DADOS POSTGRESQL / SUPABASE
-- =============================================================================

-- 1. Tabela: empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    cidade TEXT,
    bairro TEXT,
    segmento TEXT,
    site TEXT,
    instagram TEXT,
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    status_site TEXT DEFAULT 'pendente',
    status_instagram TEXT DEFAULT 'pendente',
    score INTEGER DEFAULT 0,
    crm_stage TEXT DEFAULT 'prospeccao',
    area_atuacao TEXT,
    publico_alvo TEXT,
    buscas_partida TEXT,
    termos_encontrados TEXT,
    busca_google_maps TEXT,
    site_gerado_html TEXT,
    site_gerado_data TEXT,
    observacoes TEXT,
    historico JSONB DEFAULT '[]'::jsonb,
    detalhes_analise JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empresas_cidade ON public.empresas (cidade);
CREATE INDEX IF NOT EXISTS idx_empresas_segmento ON public.empresas (segmento);
CREATE INDEX IF NOT EXISTS idx_empresas_crm_stage ON public.empresas (crm_stage);
CREATE INDEX IF NOT EXISTS idx_empresas_score ON public.empresas (score DESC);

-- 2. Tabela: empresas_excluidas (Blacklist de Prospecção)
CREATE TABLE IF NOT EXISTS public.empresas_excluidas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    cidade TEXT,
    estado TEXT,
    segmento TEXT,
    site TEXT,
    telefone TEXT,
    place_id TEXT,
    origem TEXT,
    excluido_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_excluidas_cnpj ON public.empresas_excluidas (cnpj);
CREATE INDEX IF NOT EXISTS idx_excluidas_place_id ON public.empresas_excluidas (place_id);

-- 3. Tabela: instagram_profiles (Leads minerados do Instagram)
CREATE TABLE IF NOT EXISTS public.instagram_profiles (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    handle TEXT NOT NULL,
    instagram_url TEXT NOT NULL,
    bio TEXT,
    segmento TEXT,
    cidade TEXT NOT NULL,
    estado TEXT,
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    site TEXT,
    seguidores TEXT,
    salvo_em TIMESTAMPTZ DEFAULT NOW(),
    origem_busca TEXT
);

CREATE INDEX IF NOT EXISTS idx_insta_handle ON public.instagram_profiles (handle);
CREATE INDEX IF NOT EXISTS idx_insta_cidade ON public.instagram_profiles (cidade);

-- 4. Tabela: comunicacao_settings (Configurações SMTP e WhatsApp)
CREATE TABLE IF NOT EXISTS public.comunicacao_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    email_config JSONB NOT NULL,
    whatsapp_config JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela: score_weights (Pesos da fórmula de qualificação do Radar)
CREATE TABLE IF NOT EXISTS public.score_weights (
    id TEXT PRIMARY KEY DEFAULT 'default',
    weights JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela: api_settings (Configurações de chaves de API)
CREATE TABLE IF NOT EXISTS public.api_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    settings JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas_excluidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso irrestrito para anon e authenticated (CRM operacional da agência)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Acesso total empresas" ON public.empresas;
    CREATE POLICY "Acesso total empresas" ON public.empresas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso total empresas excluidas" ON public.empresas_excluidas;
    CREATE POLICY "Acesso total empresas excluidas" ON public.empresas_excluidas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso total instagram profiles" ON public.instagram_profiles;
    CREATE POLICY "Acesso total instagram profiles" ON public.instagram_profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso total comunicacao settings" ON public.comunicacao_settings;
    CREATE POLICY "Acesso total comunicacao settings" ON public.comunicacao_settings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso total score weights" ON public.score_weights;
    CREATE POLICY "Acesso total score weights" ON public.score_weights FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso total api settings" ON public.api_settings;
    CREATE POLICY "Acesso total api settings" ON public.api_settings FOR ALL USING (true) WITH CHECK (true);
END $$;
