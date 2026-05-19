
ALTER TABLE public.landing_pages
ADD COLUMN IF NOT EXISTS subdomain text UNIQUE,
ADD COLUMN IF NOT EXISTS domain_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS domain_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS ssl_provisioned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS domain_txt_record text,
ADD COLUMN IF NOT EXISTS subdomain_active boolean DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_subdomain
  ON public.landing_pages(subdomain) WHERE subdomain IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_custom_domain
  ON public.landing_pages(custom_domain) WHERE custom_domain IS NOT NULL;

CREATE OR REPLACE FUNCTION is_subdomain_available(p_slug text)
RETURNS boolean LANGUAGE sql AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM landing_pages WHERE subdomain = lower(p_slug)
  )
  AND p_slug ~ '^[a-z0-9][a-z0-9\-]{2,30}[a-z0-9]$'
  AND p_slug NOT IN (
    'www','api','app','admin','mail','ftp','smtp','imap','pop','blog',
    'docs','help','support','status','rapidomeet','meet','visio'
  );
$$;

CREATE TABLE IF NOT EXISTS public.domain_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id uuid NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL,
  domain_type text NOT NULL CHECK (domain_type IN ('subdomain','custom')),
  verification_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text DEFAULT 'pending' CHECK (status IN ('pending','verified','failed')),
  attempts integer DEFAULT 0,
  last_check_at timestamptz,
  verified_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.domain_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own verifications"
  ON public.domain_verifications FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_domain_verif_page
  ON public.domain_verifications(landing_page_id, status);
