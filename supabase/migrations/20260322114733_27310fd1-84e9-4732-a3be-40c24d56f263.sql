CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content_html text,
  content_json jsonb DEFAULT '{}',
  report_type text DEFAULT 'standard',
  distributed_to jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own reports"
  ON public.reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reports_meeting_id ON public.reports(meeting_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);