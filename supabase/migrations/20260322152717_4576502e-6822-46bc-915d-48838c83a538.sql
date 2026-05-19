
-- Table reminder_schedules
CREATE TABLE IF NOT EXISTS public.reminder_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES landing_bookings(id) ON DELETE CASCADE,
  landing_page_id uuid NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('sms','whatsapp','voice','email')),
  reminder_type text NOT NULL CHECK (reminder_type IN ('confirmation','reminder_24h','reminder_1h','reminder_15min','followup_2h','followup_24h','no_show')),
  scheduled_at timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped','canceled')),
  to_phone text,
  to_email text,
  message_content text,
  twilio_sid text,
  attempts integer DEFAULT 0,
  error_message text,
  sent_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.reminder_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reminders" ON public.reminder_schedules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages reminders" ON public.reminder_schedules FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_reminders_booking ON public.reminder_schedules(booking_id, reminder_type);
CREATE INDEX idx_reminders_pending ON public.reminder_schedules(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_reminders_user ON public.reminder_schedules(user_id, status);

-- Table reminder_templates
CREATE TABLE IF NOT EXISTS public.reminder_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_type text NOT NULL,
  channel text NOT NULL,
  template_name text NOT NULL,
  subject text,
  body_template text NOT NULL,
  variables text[] DEFAULT '{}',
  is_default boolean DEFAULT false,
  language text DEFAULT 'fr',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reminder_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read templates" ON public.reminder_templates FOR SELECT USING (true);

INSERT INTO public.reminder_templates (reminder_type, channel, template_name, subject, body_template, variables, is_default) VALUES
('confirmation', 'sms', 'Confirmation SMS', NULL, '✅ RDV confirmé avec {{owner_name}} le {{date}} à {{time}}. Lien visio : {{jitsi_url}}', ARRAY['owner_name','date','time','jitsi_url'], true),
('confirmation', 'email', 'Confirmation Email', '✅ Votre RDV est confirmé', 'Bonjour {{prospect_name}}, votre RDV avec {{owner_name}} est confirmé pour le {{date}} à {{time}}. Lien visio : {{jitsi_url}}', ARRAY['prospect_name','owner_name','date','time','jitsi_url'], true),
('reminder_24h', 'sms', 'Rappel J-1 SMS', NULL, '📅 Rappel : votre RDV avec {{owner_name}} est demain à {{time}}. Lien visio : {{jitsi_url}}', ARRAY['owner_name','time','jitsi_url'], true),
('reminder_1h', 'sms', 'Rappel H-1 SMS', NULL, '⏰ Votre RDV avec {{owner_name}} commence dans 1h ! Lien : {{jitsi_url}}', ARRAY['owner_name','jitsi_url'], true),
('reminder_15min', 'sms', 'Rappel 15min SMS', NULL, '🔔 RDV dans 15 minutes ! Rejoignez : {{jitsi_url}}', ARRAY['jitsi_url'], true),
('followup_2h', 'sms', 'Suivi 2h SMS', NULL, '🙏 Merci pour notre échange ! N''hésitez pas à me recontacter. — {{owner_name}}', ARRAY['owner_name'], true),
('no_show', 'sms', 'No-show SMS', NULL, '😔 Nous ne nous sommes pas retrouvés. Souhaitez-vous reprogrammer ? {{booking_url}}', ARRAY['booking_url'], true)
ON CONFLICT DO NOTHING;

-- Trigger to auto-create reminders on booking
CREATE OR REPLACE FUNCTION auto_schedule_reminders()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  booking_datetime timestamptz;
  page_config jsonb;
BEGIN
  IF NEW.status != 'confirmed' THEN RETURN NEW; END IF;
  
  booking_datetime := (NEW.booked_date::text || ' ' || NEW.booked_time || ':00')::timestamptz;
  
  SELECT reminder_config INTO page_config FROM landing_pages WHERE id = NEW.landing_page_id;
  IF page_config IS NULL THEN page_config := '{}'::jsonb; END IF;

  -- Confirmation immédiate par email
  INSERT INTO reminder_schedules (booking_id, landing_page_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
  VALUES (NEW.id, NEW.landing_page_id, NEW.user_id, 'email', 'confirmation', now(), NEW.prospect_phone, NEW.prospect_email);

  -- Rappel J-1 si activé
  IF COALESCE((page_config->>'reminder_24h')::boolean, true) THEN
    INSERT INTO reminder_schedules (booking_id, landing_page_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
    VALUES (NEW.id, NEW.landing_page_id, NEW.user_id,
      CASE WHEN COALESCE((page_config->>'sms_enabled')::boolean, false) THEN 'sms' ELSE 'email' END,
      'reminder_24h', booking_datetime - interval '24 hours', NEW.prospect_phone, NEW.prospect_email);
  END IF;

  -- Rappel H-1
  IF COALESCE((page_config->>'reminder_1h')::boolean, true) THEN
    INSERT INTO reminder_schedules (booking_id, landing_page_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
    VALUES (NEW.id, NEW.landing_page_id, NEW.user_id,
      CASE WHEN COALESCE((page_config->>'sms_enabled')::boolean, false) THEN 'sms' ELSE 'email' END,
      'reminder_1h', booking_datetime - interval '1 hour', NEW.prospect_phone, NEW.prospect_email);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_schedule_reminders
  AFTER INSERT ON public.landing_bookings
  FOR EACH ROW EXECUTE FUNCTION auto_schedule_reminders();

-- Add reminder_config column to landing_pages
ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS reminder_config jsonb DEFAULT '{}';
