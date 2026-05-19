
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id text,
  status text DEFAULT 'open' CHECK (status IN ('open','pending','resolved','spam')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  subject text,
  channel text DEFAULT 'widget' CHECK (channel IN ('widget','email','api')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  first_response_at timestamptz,
  resolved_at timestamptz,
  satisfaction_score integer CHECK (satisfaction_score BETWEEN 1 AND 5),
  satisfaction_comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own support conversations" ON public.support_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all support conversations" ON public.support_conversations FOR ALL USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
CREATE POLICY "Public can insert support conversations" ON public.support_conversations FOR INSERT WITH CHECK (true);

CREATE INDEX idx_support_conv_user ON public.support_conversations(user_id, status);
CREATE INDEX idx_support_conv_status ON public.support_conversations(status, created_at DESC);

-- support_messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user','agent','bot','system')),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  content_type text DEFAULT 'text' CHECK (content_type IN ('text','html','markdown','quick_replies','card')),
  payload jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see non-internal support messages" ON public.support_messages FOR SELECT USING (is_internal = false AND conversation_id IN (SELECT id FROM support_conversations WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage all support messages" ON public.support_messages FOR ALL USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
CREATE POLICY "Service role manages support messages" ON public.support_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_support_msg_conv ON public.support_messages(conversation_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;

-- support_articles (knowledge base)
CREATE TABLE IF NOT EXISTS public.support_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  is_published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.support_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published support articles" ON public.support_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage support articles" ON public.support_articles FOR ALL USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

INSERT INTO public.support_articles (title, content, category, tags) VALUES
('Comment importer un fichier audio ?', 'Pour importer un fichier audio : 1. Allez sur /app/reunions/nouvelle 2. Sélectionnez Importer un fichier audio 3. Glissez votre fichier MP3/WAV/M4A (max 500MB selon votre plan) 4. Remplissez le titre et le type 5. Cliquez sur Créer. La transcription démarre automatiquement.', 'transcription', ARRAY['audio','import','transcription']),
('Quels formats audio sont supportés ?', 'RapidoMeet accepte : MP3, WAV, M4A, WEBM, OGG, MP4. Taille maximale : Free=50MB, Starter=200MB, Pro=500MB. Durée maximale : Free=30min, Starter=120min, Pro=illimité.', 'transcription', ARRAY['formats','audio','limites']),
('Comment changer de plan ?', 'Pour changer de plan : 1. Allez sur /app/billing 2. Cliquez sur le plan souhaité 3. Vous serez redirigé vers Stripe pour le paiement sécurisé. Plans disponibles : Starter 9.90€/mois (30 réunions), Pro 24.90€/mois (illimité).', 'facturation', ARRAY['plan','upgrade','stripe','paiement']),
('Comment partager un rapport ?', 'Pour partager un rapport : 1. Ouvrez une réunion analysée 2. Allez dans l onglet Rapport 3. Cliquez sur Partager 4. Choisissez la durée du lien 5. Copiez le lien généré. Le destinataire n a pas besoin de compte.', 'rapports', ARRAY['partage','rapport','lien']),
('Mes données sont-elles sécurisées ?', 'Oui. RapidoMeet respecte le RGPD : Hébergement EU (Supabase Frankfurt, AWS Paris), chiffrement AES-256, TLS 1.3, Row-Level Security. Vos données audio sont supprimées après transcription.', 'securite', ARRAY['rgpd','securite','donnees']),
('Comment utiliser les scénarios ?', 'Les scénarios automatisent des actions après chaque réunion. 1. Allez sur /app/scenarios 2. Cliquez sur + Nouveau scénario 3. Choisissez le déclencheur 4. Ajoutez les actions (email, Slack, N8N...) 5. Activez le scénario.', 'scenarios', ARRAY['n8n','scenarios','automatisation'])
ON CONFLICT DO NOTHING;

-- Stats view
CREATE OR REPLACE VIEW support_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at >= CURRENT_DATE) as resolved_today,
  ROUND(AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60) FILTER (WHERE first_response_at IS NOT NULL)) as avg_first_response_minutes,
  ROUND(AVG(satisfaction_score) FILTER (WHERE satisfaction_score IS NOT NULL), 1) as avg_satisfaction,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_today
FROM support_conversations;

-- Trigger notify admin
CREATE OR REPLACE FUNCTION notify_admin_new_support_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.sender_type IN ('user','bot') THEN
    INSERT INTO app_logs (level, source, message, metadata)
    VALUES ('info', 'support-chat', 'Nouveau message support reçu',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'content_preview', substring(NEW.content, 1, 100)));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_support_message_notify
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_support_message();
