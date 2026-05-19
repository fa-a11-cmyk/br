
-- Create user_connections table
CREATE TABLE public.user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  connection_type TEXT NOT NULL DEFAULT 'api_key',
  credentials JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  account_label TEXT,
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_id)
);

-- Enable RLS
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own connections"
  ON public.user_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON public.user_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON public.user_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON public.user_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_connections_updated_at
  BEFORE UPDATE ON public.user_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
