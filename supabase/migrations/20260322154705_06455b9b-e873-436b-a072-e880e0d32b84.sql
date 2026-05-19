-- Security events log
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN (
    'rate_limit_exceeded','invalid_token','unauthorized_access',
    'suspicious_input','sql_injection_attempt','xss_attempt',
    'brute_force','api_abuse','data_export','admin_action',
    'auth_failure','privilege_escalation'
  )),
  severity text DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  path text,
  method text,
  request_body_hash text,
  details jsonb DEFAULT '{}',
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins see security events" ON public.security_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert events" ON public.security_events FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address, created_at DESC) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Rate limit rules
CREATE TABLE IF NOT EXISTS public.rate_limit_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL UNIQUE,
  max_requests integer NOT NULL DEFAULT 60,
  window_seconds integer NOT NULL DEFAULT 60,
  block_duration_seconds integer DEFAULT 300,
  is_active boolean DEFAULT true,
  apply_to text DEFAULT 'ip' CHECK (apply_to IN ('ip','user','both')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rate_limit_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rate rules" ON public.rate_limit_rules FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage rate rules" ON public.rate_limit_rules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.rate_limit_rules (rule_name, max_requests, window_seconds, block_duration_seconds, apply_to)
VALUES
  ('api_anonymous', 20, 60, 300, 'ip'),
  ('api_authenticated', 100, 60, 60, 'user'),
  ('auth_login', 5, 300, 900, 'ip'),
  ('booking_create', 3, 3600, 3600, 'ip'),
  ('support_message', 10, 60, 120, 'ip'),
  ('landing_view', 60, 60, 0, 'ip'),
  ('ai_generate', 5, 3600, 1800, 'user'),
  ('twilio_send', 10, 3600, 3600, 'user')
ON CONFLICT (rule_name) DO NOTHING;

-- Blocked IPs
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  ip_address text PRIMARY KEY,
  reason text,
  blocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked_until timestamptz,
  event_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage blocked ips" ON public.blocked_ips FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service insert blocked ips" ON public.blocked_ips FOR INSERT
  WITH CHECK (true);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_meetings_user_created ON public.meetings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_tasks_meeting ON public.extracted_tasks(meeting_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_support_conv_visitor ON public.support_conversations(visitor_id) WHERE visitor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_landing_bookings_date_status ON public.landing_bookings(booked_date, status) WHERE status IN ('pending','confirmed');

-- RLS check function
CREATE OR REPLACE FUNCTION public.check_rls_status()
RETURNS TABLE(tablename text, has_rls boolean)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.tablename::text, t.rowsecurity as has_rls
  FROM pg_tables t
  WHERE t.schemaname = 'public' AND t.rowsecurity = false
  ORDER BY t.tablename;
$$;