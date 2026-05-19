
-- Table resend_audiences
CREATE TABLE IF NOT EXISTS public.resend_audiences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  resend_audience_id text NOT NULL UNIQUE,
  segment text NOT NULL UNIQUE,
  description text,
  contact_count integer DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.resend_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage audiences"
  ON public.resend_audiences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Table resend_broadcasts_log
CREATE TABLE IF NOT EXISTS public.resend_broadcasts_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  broadcast_type text NOT NULL CHECK (broadcast_type IN (
    'newsletter','feature_announcement','new_skill','new_template',
    'openclaw_update','tutorial','api_docs','nurturing',
    'reengagement','upsell','onboarding_sequence','custom'
  )),
  resend_broadcast_id text,
  resend_audience_id text NOT NULL,
  audience_segment text NOT NULL,
  content_html text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','sent','scheduled','failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  error_message text,
  recipients_count integer DEFAULT 0,
  opens_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,
  unsubscribes_count integer DEFAULT 0,
  bounces_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.resend_broadcasts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broadcasts log"
  ON public.resend_broadcasts_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_broadcasts_log_status
  ON public.resend_broadcasts_log(status, created_at DESC);

-- Table onboarding_email_queue
CREATE TABLE IF NOT EXISTS public.onboarding_email_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text DEFAULT '',
  step integer NOT NULL DEFAULT 1,
  step_name text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending','sent','skipped','failed')),
  skip_if_meeting boolean DEFAULT false,
  skip_if_paid boolean DEFAULT false,
  resend_email_id text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.onboarding_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage queue"
  ON public.onboarding_email_queue FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service insert queue"
  ON public.onboarding_email_queue FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_onboarding_queue_scheduled
  ON public.onboarding_email_queue(scheduled_at, status)
  WHERE status = 'pending';

-- Drop old trigger if exists, then create new one
DROP TRIGGER IF EXISTS on_profile_created_onboarding ON public.profiles;

CREATE OR REPLACE FUNCTION queue_onboarding_emails()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email text;
  v_first_name text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  v_first_name := COALESCE(NEW.first_name, '');

  INSERT INTO onboarding_email_queue (user_id, email, first_name, step, step_name, scheduled_at, skip_if_meeting, skip_if_paid)
  VALUES
    (NEW.user_id, v_email, v_first_name, 1, 'welcome', NOW(), false, false),
    (NEW.user_id, v_email, v_first_name, 2, 'first_meeting', NOW() + INTERVAL '3 days', true, false),
    (NEW.user_id, v_email, v_first_name, 3, 'features', NOW() + INTERVAL '7 days', false, false),
    (NEW.user_id, v_email, v_first_name, 4, 'upsell', NOW() + INTERVAL '14 days', false, true);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_onboarding
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION queue_onboarding_emails();
