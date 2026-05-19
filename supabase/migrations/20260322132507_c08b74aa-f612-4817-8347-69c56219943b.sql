
CREATE TABLE IF NOT EXISTS public.openclaw_skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'analyse','rapport','tache','contact',
    'planning','coaching','integration'
  )),
  is_active boolean DEFAULT true,
  icon text DEFAULT '🤖',
  mcp_tool_name text NOT NULL,
  mcp_tool_description text NOT NULL,
  mcp_input_schema jsonb NOT NULL DEFAULT '{}',
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.openclaw_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read skills"
  ON public.openclaw_skills FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Service role manages skills"
  ON public.openclaw_skills FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO public.openclaw_skills
  (slug, name, description, category, icon,
   mcp_tool_name, mcp_tool_description, mcp_input_schema)
VALUES
(
  'analyse-reunion',
  'Analyser une réunion',
  'Pose des questions sur une réunion spécifique.',
  'analyse','🎙',
  'get_meeting_analysis',
  'Retrieve complete analysis of a meeting including summary, tasks, decisions, contacts and scores',
  '{"type":"object","properties":{"meeting_id":{"type":"string","description":"UUID of the meeting"}},"required":["meeting_id"]}'::jsonb
),
(
  'resume-semaine',
  'Résumé de la semaine',
  'Synthèse des réunions des 7 derniers jours.',
  'analyse','📊',
  'get_weekly_summary',
  'Get a summary of all meetings from the last N days with key decisions and pending tasks',
  '{"type":"object","properties":{"days":{"type":"integer","default":7}}}'::jsonb
),
(
  'taches-critiques',
  'Tâches critiques',
  'Liste les tâches critiques non complétées.',
  'tache','🚨',
  'get_critical_tasks',
  'Get all critical and high priority tasks still pending or in progress',
  '{"type":"object","properties":{"priority":{"type":"string","enum":["critical","high","medium","low"],"default":"high"},"limit":{"type":"integer","default":20}}}'::jsonb
),
(
  'contacts-prospects',
  'Prospects détectés',
  'Identifie les prospects à fort potentiel.',
  'contact','👥',
  'get_top_contacts',
  'Get contacts detected in meetings ordered by interest score',
  '{"type":"object","properties":{"min_score":{"type":"integer","default":70},"limit":{"type":"integer","default":10}}}'::jsonb
),
(
  'coaching-reunion',
  'Coach Réunion',
  'Conseils personnalisés basés sur vos scores.',
  'coaching','🏆',
  'get_coaching_insights',
  'Analyze meeting efficiency patterns and provide personalized coaching recommendations',
  '{"type":"object","properties":{"period_days":{"type":"integer","default":30}}}'::jsonb
),
(
  'suivi-decisions',
  'Suivi des Décisions',
  'Vérifie quelles décisions ont été suivies.',
  'planning','🎯',
  'track_decisions',
  'Track all decisions made in meetings and correlate with task completion status',
  '{"type":"object","properties":{"period_days":{"type":"integer","default":30}}}'::jsonb
),
(
  'n8n-trigger',
  'Déclencher N8N',
  'Lance un workflow N8N depuis la conversation.',
  'integration','⚡',
  'trigger_n8n_workflow',
  'Trigger a specific N8N workflow with payload',
  '{"type":"object","properties":{"workflow_name":{"type":"string"},"payload":{"type":"object"}},"required":["workflow_name"]}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.openclaw_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'Nouvelle conversation',
  model text DEFAULT 'claude-sonnet-4-5',
  messages jsonb DEFAULT '[]',
  skills_used text[] DEFAULT '{}',
  token_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.openclaw_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations"
  ON public.openclaw_conversations FOR ALL
  USING (auth.uid() = user_id);
CREATE INDEX idx_openclaw_conv_user
  ON public.openclaw_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.openclaw_skill_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES openclaw_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_slug text NOT NULL,
  input_params jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  duration_ms integer,
  success boolean DEFAULT true,
  error_message text,
  executed_at timestamptz DEFAULT now()
);

ALTER TABLE public.openclaw_skill_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own executions"
  ON public.openclaw_skill_executions FOR ALL
  USING (auth.uid() = user_id);
