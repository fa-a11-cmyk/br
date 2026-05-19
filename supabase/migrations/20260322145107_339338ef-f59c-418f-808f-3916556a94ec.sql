
CREATE TABLE IF NOT EXISTS public.oauth_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google_meet','zoom','microsoft_teams','google_calendar')),
  provider_user_id text,
  provider_email text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own oauth connections" ON public.oauth_connections FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_oauth_user_provider ON public.oauth_connections(user_id, provider, is_active);

CREATE TABLE IF NOT EXISTS public.meeting_recordings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  oauth_connection_id uuid REFERENCES oauth_connections(id) ON DELETE SET NULL,
  provider text NOT NULL,
  provider_meeting_id text NOT NULL,
  provider_recording_id text,
  title text NOT NULL,
  start_time timestamptz,
  end_time timestamptz,
  duration_seconds integer,
  participants jsonb DEFAULT '[]',
  recording_url text,
  download_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','downloading','downloaded','processing','completed','failed')),
  rapidomeet_meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own recordings" ON public.meeting_recordings FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_recordings_user ON public.meeting_recordings(user_id, status, created_at DESC);
CREATE INDEX idx_recordings_provider ON public.meeting_recordings(user_id, provider, provider_meeting_id);
