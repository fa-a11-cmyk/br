-- Table api_keys pour CRUD réel
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  prefix text NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own api keys" ON public.api_keys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS manquantes sur detected_contacts
CREATE POLICY "Users can update own contacts" ON public.detected_contacts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON public.detected_contacts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS manquantes sur extracted_decisions
CREATE POLICY "Users can update own decisions" ON public.extracted_decisions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions" ON public.extracted_decisions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS manquantes sur transcriptions
CREATE POLICY "Users can update own transcriptions" ON public.transcriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions" ON public.transcriptions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS manquantes sur chat_messages
CREATE POLICY "Users can update own messages" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);