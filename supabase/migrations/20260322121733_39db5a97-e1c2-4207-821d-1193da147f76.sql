
-- Table for persisting feature flags and global announcements
CREATE TABLE IF NOT EXISTS public.admin_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage admin config
CREATE POLICY "Service role manages admin config"
  ON public.admin_config FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read (for feature flags / announcements)
CREATE POLICY "Authenticated users can read config"
  ON public.admin_config FOR SELECT
  TO authenticated
  USING (true);

-- Seed default feature flags
INSERT INTO public.admin_config (config_key, config_value)
VALUES 
  ('feature_flags', '{"email_builder": true, "pdf_builder": true, "openclaw": true, "skills_marketplace": false, "live_transcription": true, "export_comptable": true}'::jsonb),
  ('global_announcement', '{"message": "", "active": false}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- Table for webhook delivery history
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id uuid NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  response_status integer,
  response_body text,
  success boolean DEFAULT false,
  attempted_at timestamptz DEFAULT now(),
  duration_ms integer
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own deliveries"
  ON public.webhook_deliveries FOR SELECT
  TO authenticated
  USING (
    webhook_id IN (SELECT id FROM webhooks WHERE user_id = auth.uid())
  );

CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_time ON public.webhook_deliveries(attempted_at DESC);
