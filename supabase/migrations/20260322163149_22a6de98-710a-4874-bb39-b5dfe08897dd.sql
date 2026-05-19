-- Drop old category constraint and add expanded one
ALTER TABLE public.openclaw_skills DROP CONSTRAINT IF EXISTS openclaw_skills_category_check;
ALTER TABLE public.openclaw_skills ADD CONSTRAINT openclaw_skills_category_check 
  CHECK (category IN ('analyse','rapport','tache','contact','planning','coaching','integration','productivity','crm','analytics','communication','automation','finance','hr','marketing','custom'));

-- Add new columns
ALTER TABLE public.openclaw_skills
ADD COLUMN IF NOT EXISTS version text DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS author text DEFAULT 'RapidoMeet',
ADD COLUMN IF NOT EXISTS author_url text,
ADD COLUMN IF NOT EXISTS readme text,
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS required_plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS install_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS screenshots jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS config_schema jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS changelog jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- === SKILL_INSTALLATIONS ===
CREATE TABLE IF NOT EXISTS public.skill_installations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES openclaw_skills(id) ON DELETE CASCADE,
  skill_slug text NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  installed_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  use_count integer DEFAULT 0,
  UNIQUE(user_id, skill_id)
);

ALTER TABLE public.skill_installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own installs" ON public.skill_installations FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_skill_installs_user ON public.skill_installations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_skill_installs_skill ON public.skill_installations(skill_id);

-- === SKILL_RATINGS ===
CREATE TABLE IF NOT EXISTS public.skill_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES openclaw_skills(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE public.skill_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ratings" ON public.skill_ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read ratings" ON public.skill_ratings FOR SELECT USING (true);

-- Triggers
CREATE OR REPLACE FUNCTION update_skill_rating()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE openclaw_skills SET
    rating_avg = (SELECT ROUND(AVG(rating)::numeric, 2) FROM skill_ratings WHERE skill_id = NEW.skill_id),
    rating_count = (SELECT COUNT(*) FROM skill_ratings WHERE skill_id = NEW.skill_id),
    updated_at = now()
  WHERE id = NEW.skill_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_skill_rating ON public.skill_ratings;
CREATE TRIGGER on_skill_rating AFTER INSERT OR UPDATE ON skill_ratings FOR EACH ROW EXECUTE FUNCTION update_skill_rating();

CREATE OR REPLACE FUNCTION update_skill_install_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE openclaw_skills SET
    install_count = (SELECT COUNT(*) FROM skill_installations WHERE skill_id = NEW.skill_id AND is_active = true),
    updated_at = now()
  WHERE id = NEW.skill_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_skill_install ON public.skill_installations;
CREATE TRIGGER on_skill_install AFTER INSERT OR UPDATE ON skill_installations FOR EACH ROW EXECUTE FUNCTION update_skill_install_count();

-- === SEED OFFICIAL SKILLS ===
INSERT INTO public.openclaw_skills
  (slug, name, description, category, icon, mcp_tool_name, mcp_tool_description, mcp_input_schema, is_published, is_featured, required_plan, author, tags, readme)
VALUES
('meeting-analyzer', 'Analyseur de Réunions', 'Analyse vos réunions et extrait tâches, décisions et contacts.', 'productivity', '🎙', 'get_meeting_analysis', 'Analyze a RapidoMeet meeting by ID', '{"type":"object","properties":{"meeting_id":{"type":"string"},"detail_level":{"type":"string","enum":["summary","full"]}},"required":["meeting_id"]}', true, true, 'free', 'RapidoMeet', ARRAY['réunions','analyse','ia'], '## Analyseur de Réunions\n\nAnalyse vos réunions et fournit résumé, tâches, décisions et contacts.\n\n### Utilisation\n"Analyse ma dernière réunion"'),
('weekly-digest', 'Digest Hebdomadaire', 'Résumé hebdomadaire de toutes vos réunions avec actions prioritaires.', 'productivity', '📊', 'get_weekly_summary', 'Generate weekly meeting digest', '{"type":"object","properties":{"week_offset":{"type":"integer","default":0}}}', true, true, 'starter', 'RapidoMeet', ARRAY['hebdomadaire','résumé','rapport'], '## Digest Hebdomadaire\n\nRésumé hebdomadaire de toutes vos réunions.'),
('task-tracker', 'Suivi des Tâches', 'Monitore vos tâches critiques non résolues issues de vos réunions.', 'productivity', '🎯', 'get_critical_tasks', 'Get all critical unresolved tasks', '{"type":"object","properties":{"priority":{"type":"string","enum":["all","critical","high"]}}}', true, false, 'free', 'RapidoMeet', ARRAY['tâches','suivi','priorités'], '## Suivi des Tâches\n\nNe laissez plus aucune tâche passer.'),
('contact-intelligence', 'Intelligence Contacts', 'Identifie les contacts stratégiques mentionnés dans vos réunions.', 'crm', '👥', 'get_top_contacts', 'Get strategic contacts from meetings', '{"type":"object","properties":{"min_mentions":{"type":"integer","default":2}}}', true, false, 'starter', 'RapidoMeet', ARRAY['crm','contacts','prospection'], '## Intelligence Contacts\n\nTransformez vos réunions en opportunités.'),
('coaching-insights', 'Coach Réunions IA', 'Analyse votre style de réunion et propose des améliorations.', 'productivity', '🏆', 'get_coaching_insights', 'Get AI coaching insights', '{"type":"object","properties":{"focus":{"type":"string","enum":["efficiency","participation","decisions"]}}}', true, true, 'pro', 'RapidoMeet', ARRAY['coaching','ia','efficacité'], '## Coach Réunions IA\n\nDevenez un expert des réunions efficaces.'),
('decision-tracker', 'Registre des Décisions', 'Registre complet de toutes vos décisions stratégiques.', 'productivity', '📋', 'track_decisions', 'Track strategic decisions', '{"type":"object","properties":{"category":{"type":"string"}}}', true, false, 'free', 'RapidoMeet', ARRAY['décisions','registre','stratégie'], '## Registre des Décisions\n\nNe perdez plus le fil de vos décisions.'),
('n8n-automations', 'Automatisations N8N', 'Déclenche vos workflows N8N depuis OpenClaw en langage naturel.', 'automation', '⚡', 'trigger_n8n_workflow', 'Trigger N8N workflow', '{"type":"object","properties":{"workflow_name":{"type":"string"},"payload":{"type":"object"}},"required":["workflow_name"]}', true, false, 'pro', 'RapidoMeet', ARRAY['n8n','automation','workflow'], '## Automatisations N8N\n\nConnectez vos workflows N8N à OpenClaw.'),
('calendly-agenda', 'Agenda Calendly', 'Consultez vos RDV Calendly et créez des liens de réservation.', 'productivity', '📅', 'calendly_schedule', 'Manage Calendly calendar', '{"type":"object","properties":{"sub_action":{"type":"string","enum":["get_upcoming","create_link"]}},"required":["sub_action"]}', true, false, 'starter', 'RapidoMeet', ARRAY['calendly','agenda','rdv'], '## Agenda Calendly\n\nGérez votre agenda Calendly depuis OpenClaw.')
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  is_published = EXCLUDED.is_published,
  is_featured = EXCLUDED.is_featured,
  required_plan = EXCLUDED.required_plan,
  tags = EXCLUDED.tags,
  readme = EXCLUDED.readme,
  author = EXCLUDED.author,
  category = EXCLUDED.category,
  updated_at = now();