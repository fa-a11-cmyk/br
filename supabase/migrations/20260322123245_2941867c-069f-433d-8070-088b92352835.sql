
-- Add new columns to email_templates
ALTER TABLE public.email_templates
ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false;

ALTER TABLE public.email_templates
ADD COLUMN IF NOT EXISTS preview_text text;

ALTER TABLE public.email_templates
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0;

-- Update category default and drop old constraint if any
ALTER TABLE public.email_templates
ALTER COLUMN category SET DEFAULT 'general';

-- Index for global templates
CREATE INDEX IF NOT EXISTS idx_email_templates_global
  ON public.email_templates(is_global)
  WHERE is_global = true;

-- Drop existing SELECT policy and create new one that includes global
DROP POLICY IF EXISTS "Users can manage own templates" ON public.email_templates;

CREATE POLICY "Users can manage own templates"
  ON public.email_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read global templates"
  ON public.email_templates FOR SELECT
  USING (is_global = true);

-- template_variables table
CREATE TABLE IF NOT EXISTS public.template_variables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  variable_key text NOT NULL,
  label text NOT NULL,
  description text,
  example_value text
);

ALTER TABLE public.template_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read variables"
  ON public.template_variables FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.template_variables
  (category, variable_key, label, description, example_value)
VALUES
  ('rapport', '{{meeting_title}}', 'Titre de la réunion', 'Titre de la réunion analysée', 'Réunion commerciale Q2'),
  ('rapport', '{{meeting_date}}', 'Date de la réunion', 'Date formatée en français', '15 mars 2026'),
  ('rapport', '{{meeting_type}}', 'Type de réunion', 'commercial / tech / rh / etc.', 'commercial'),
  ('rapport', '{{meeting_duration}}', 'Durée', 'Durée en minutes', '45 min'),
  ('rapport', '{{summary}}', 'Résumé', 'Résumé exécutif généré par l''IA', 'La réunion a porté sur...'),
  ('rapport', '{{tasks_count}}', 'Nombre de tâches', 'Nombre de tâches extraites', '5'),
  ('rapport', '{{decisions_count}}', 'Nombre de décisions', 'Nombre de décisions prises', '3'),
  ('rapport', '{{sentiment_label}}', 'Sentiment', 'Positif / Neutre / Négatif', 'Positif'),
  ('rapport', '{{report_url}}', 'Lien rapport', 'URL vers le rapport complet', 'https://app.rapidomeet.io/app/reunions/xxx'),
  ('tache', '{{task_title}}', 'Titre de la tâche', 'Titre de la tâche extraite', 'Préparer la présentation'),
  ('tache', '{{task_priority}}', 'Priorité', 'low / medium / high / critical', 'high'),
  ('tache', '{{task_assignee}}', 'Assigné à', 'Nom de la personne assignée', 'Sophie Martin'),
  ('tache', '{{task_deadline}}', 'Deadline', 'Date limite formatée', '20 mars 2026'),
  ('general', '{{user_name}}', 'Nom utilisateur', 'Prénom + Nom de l''utilisateur', 'Jean Dupont'),
  ('general', '{{company_name}}', 'Entreprise', 'Nom de l''entreprise', 'Acme Corp'),
  ('general', '{{app_name}}', 'Nom app', 'Nom de l''application', 'RapidoMeet'),
  ('general', '{{current_date}}', 'Date du jour', 'Date actuelle formatée', '22 mars 2026')
ON CONFLICT DO NOTHING;

-- template_sends table
CREATE TABLE IF NOT EXISTS public.template_sends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  recipient_email text,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE public.template_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own sends"
  ON public.template_sends FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_template_sends_template
  ON public.template_sends(template_id);

-- RPC for incrementing usage
CREATE OR REPLACE FUNCTION public.increment_template_usage(p_template_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE email_templates
  SET usage_count = COALESCE(usage_count, 0) + 1,
      updated_at = now()
  WHERE id = p_template_id;
$$;

-- Seed 3 global templates for admin user
INSERT INTO public.email_templates
  (user_id, name, category, preview_text, is_global, html_content)
VALUES
(
  'ccd2e64c-71a3-4012-bc19-cd32606318b9',
  'Rapport de réunion standard',
  'rapport',
  'Voici le résumé de votre réunion {{meeting_title}}',
  true,
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#6d28d9;padding:24px;text-align:center;border-radius:8px 8px 0 0;"><h1 style="color:#fff;margin:0;font-size:20px;">⚡ RapidoMeet</h1><h2 style="color:#e9d5ff;margin:8px 0 0;font-size:16px;">{{meeting_title}}</h2><p style="color:#c4b5fd;margin:4px 0 0;font-size:12px;">{{meeting_date}} · {{meeting_type}}</p></div><div style="padding:24px;background:#fafafa;"><p>Bonjour {{user_name}},</p><p>Votre réunion a été analysée avec succès.</p><p><strong>Résumé :</strong> {{summary}}</p><div style="display:flex;gap:16px;margin:16px 0;"><div style="text-align:center;flex:1;"><strong>{{tasks_count}}</strong><br/><small>Tâches</small></div><div style="text-align:center;flex:1;"><strong>{{decisions_count}}</strong><br/><small>Décisions</small></div><div style="text-align:center;flex:1;"><strong>{{sentiment_label}}</strong><br/><small>Sentiment</small></div></div><div style="text-align:center;margin:24px 0;"><a href="{{report_url}}" style="background:#6d28d9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Voir le rapport complet →</a></div></div><div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">Généré par RapidoMeet · {{current_date}}</div></div>'
),
(
  'ccd2e64c-71a3-4012-bc19-cd32606318b9',
  'Alerte tâche critique',
  'tache',
  'Nouvelle tâche critique : {{task_title}}',
  true,
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h1 style="color:#dc2626;">🚨 Tâche critique détectée</h1><div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;"><span style="background:#dc2626;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">CRITIQUE</span><h2 style="margin:8px 0;">{{task_title}}</h2><p>👤 Assigné à : {{task_assignee}}</p><p>📅 Deadline : {{task_deadline}}</p></div><p style="color:#6b7280;margin-top:16px;">Cette tâche a été extraite automatiquement de votre réunion par RapidoMeet.</p></div>'
),
(
  'ccd2e64c-71a3-4012-bc19-cd32606318b9',
  'Notification décision prise',
  'decision',
  'Décision importante enregistrée dans votre réunion',
  true,
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h1 style="color:#059669;">🎯 Décision enregistrée</h1><p>Lors de votre réunion <strong>{{meeting_title}}</strong>, la décision suivante a été enregistrée :</p><blockquote style="border-left:4px solid #059669;padding:12px 16px;background:#f0fdf4;margin:16px 0;">{{summary}}</blockquote><p style="color:#9ca3af;font-size:12px;">{{meeting_date}} · RapidoMeet</p></div>'
)
ON CONFLICT DO NOTHING;
