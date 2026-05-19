-- Table for pending actions (Confirmation Gate)
CREATE TABLE public.pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  session_id TEXT,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  destination TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_pending_actions_meeting ON public.pending_actions(meeting_id);
CREATE INDEX idx_pending_actions_user_status ON public.pending_actions(user_id, status);

-- RLS
ALTER TABLE public.pending_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pending actions"
  ON public.pending_actions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own pending actions"
  ON public.pending_actions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Table for OAuth state verification
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  redirect_uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-cleanup old states (> 10 min)
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own oauth states"
  ON public.oauth_states FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
