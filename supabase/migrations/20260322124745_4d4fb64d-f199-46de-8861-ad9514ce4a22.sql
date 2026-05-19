CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  email_type text NOT NULL DEFAULT 'notification',
  status text DEFAULT 'sent',
  resend_id text,
  error_message text,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own email logs" ON public.email_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages email logs" ON public.email_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_email_logs_user ON public.email_logs(user_id, sent_at DESC);
CREATE INDEX idx_email_logs_meeting ON public.email_logs(meeting_id);