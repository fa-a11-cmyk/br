
-- Table mrr_snapshots for caching MRR data
CREATE TABLE IF NOT EXISTS public.mrr_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date date NOT NULL UNIQUE,
  mrr_euros numeric(10,2) DEFAULT 0,
  new_subscribers integer DEFAULT 0,
  churned_subscribers integer DEFAULT 0,
  total_active integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mrr_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages mrr snapshots"
  ON public.mrr_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Table app_logs for system logging
CREATE TABLE IF NOT EXISTS public.app_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level text NOT NULL,
  source text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  user_id uuid,
  meeting_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_app_logs_level ON public.app_logs(level);
CREATE INDEX idx_app_logs_created_at ON public.app_logs(created_at DESC);
CREATE INDEX idx_app_logs_source ON public.app_logs(source);

ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages logs"
  ON public.app_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Table impersonation_sessions
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  expires_at timestamptz DEFAULT now() + interval '30 minutes',
  is_active boolean DEFAULT true
);

CREATE INDEX idx_impersonation_active ON public.impersonation_sessions(is_active, expires_at);

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages impersonation"
  ON public.impersonation_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Purge function for old logs
CREATE OR REPLACE FUNCTION public.purge_old_logs()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM app_logs WHERE created_at < now() - interval '30 days';
$$;
