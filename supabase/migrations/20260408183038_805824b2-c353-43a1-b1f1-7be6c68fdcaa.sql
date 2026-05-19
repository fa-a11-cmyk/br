
-- Add session_id column to meetings table to map to Express session
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS session_id text;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_meetings_session_id ON public.meetings (session_id) WHERE session_id IS NOT NULL;
