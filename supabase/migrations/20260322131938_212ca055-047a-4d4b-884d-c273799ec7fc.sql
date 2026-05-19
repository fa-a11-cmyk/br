
CREATE TABLE IF NOT EXISTS public.api_key_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  response_status integer,
  duration_ms integer,
  called_at timestamptz DEFAULT now()
);

ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own api usage" ON public.api_key_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages api usage" ON public.api_key_usage FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_api_key_usage_key ON public.api_key_usage(api_key_id, called_at DESC);
CREATE INDEX idx_api_key_usage_user ON public.api_key_usage(user_id, called_at DESC);

ALTER TABLE public.plan_limits ADD COLUMN IF NOT EXISTS api_calls_per_hour integer DEFAULT 60;
ALTER TABLE public.plan_limits ADD COLUMN IF NOT EXISTS api_calls_per_day integer DEFAULT 1000;
