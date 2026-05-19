
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text DEFAULT NULL,
  p_link text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.notifications
    (user_id, type, title, message, link, metadata)
  VALUES
    (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE TABLE IF NOT EXISTS public.shared_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz,
  view_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  show_transcription boolean DEFAULT false,
  show_contacts boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shared reports"
  ON public.shared_reports FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public read via token"
  ON public.shared_reports FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON public.shared_reports(token);
CREATE INDEX IF NOT EXISTS idx_shared_reports_meeting ON public.shared_reports(meeting_id);
