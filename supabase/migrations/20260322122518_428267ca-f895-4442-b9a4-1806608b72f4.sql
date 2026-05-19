CREATE TABLE IF NOT EXISTS public.playground_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  params jsonb DEFAULT '{}',
  response_status integer,
  response_body jsonb,
  duration_ms integer,
  used_api_key boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.playground_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own playground history"
  ON public.playground_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_playground_history_user
  ON public.playground_history(user_id, created_at DESC);