
-- Table tutorial_courses
CREATE TABLE IF NOT EXISTS public.tutorial_courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  category text DEFAULT 'getting_started',
  difficulty text DEFAULT 'debutant',
  duration_minutes integer DEFAULT 10,
  chapters_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  required_plan text DEFAULT 'free',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tutorial_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published courses" ON public.tutorial_courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage courses" ON public.tutorial_courses FOR ALL USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_courses_category ON public.tutorial_courses(category, order_index) WHERE is_published = true;

-- Table tutorial_chapters
CREATE TABLE IF NOT EXISTS public.tutorial_chapters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES tutorial_courses(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  video_provider text DEFAULT 'youtube',
  video_duration_seconds integer DEFAULT 0,
  thumbnail_url text,
  content_markdown text,
  has_quiz boolean DEFAULT false,
  quiz_questions jsonb DEFAULT '[]',
  quiz_pass_score integer DEFAULT 70,
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean DEFAULT true,
  is_free boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tutorial_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published chapters" ON public.tutorial_chapters FOR SELECT USING (is_published = true AND course_id IN (SELECT id FROM tutorial_courses WHERE is_published = true));
CREATE POLICY "Admins manage chapters" ON public.tutorial_chapters FOR ALL USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_chapters_course ON public.tutorial_chapters(course_id, order_index) WHERE is_published = true;

-- Enrich tutorial_progress
ALTER TABLE public.tutorial_progress ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES tutorial_courses(id) ON DELETE CASCADE;
ALTER TABLE public.tutorial_progress ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES tutorial_chapters(id) ON DELETE CASCADE;
ALTER TABLE public.tutorial_progress ADD COLUMN IF NOT EXISTS completed_chapters uuid[] DEFAULT '{}';
ALTER TABLE public.tutorial_progress ADD COLUMN IF NOT EXISTS quiz_results jsonb DEFAULT '{}';
ALTER TABLE public.tutorial_progress ADD COLUMN IF NOT EXISTS course_completed boolean DEFAULT false;
ALTER TABLE public.tutorial_progress ADD COLUMN IF NOT EXISTS course_completed_at timestamptz;
ALTER TABLE public.tutorial_progress ADD COLUMN IF NOT EXISTS certificate_id text UNIQUE;

-- Table tutorial_certificates
CREATE TABLE IF NOT EXISTS public.tutorial_certificates (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES tutorial_courses(id) ON DELETE CASCADE,
  course_title text NOT NULL,
  user_name text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  valid_until timestamptz,
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE public.tutorial_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read certificates" ON public.tutorial_certificates FOR SELECT USING (true);
CREATE POLICY "Users see own certificates" ON public.tutorial_certificates FOR ALL USING (auth.uid() = user_id);

-- Function to generate certificate ID
CREATE OR REPLACE FUNCTION generate_certificate_id()
RETURNS text LANGUAGE sql AS $$
  SELECT 'RMEET-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || UPPER(substring(md5(random()::text), 1, 5));
$$;

-- View tutorial_stats
CREATE OR REPLACE VIEW tutorial_stats AS
SELECT
  c.id, c.slug, c.title, c.category,
  COUNT(DISTINCT p.user_id) as total_started,
  COUNT(DISTINCT p.user_id) FILTER (WHERE p.course_completed = true) as total_completed,
  ROUND(COUNT(DISTINCT p.user_id) FILTER (WHERE p.course_completed = true)::float / NULLIF(COUNT(DISTINCT p.user_id), 0) * 100) as completion_rate,
  AVG(array_length(p.completed_chapters, 1)) as avg_chapters_done
FROM tutorial_courses c
LEFT JOIN tutorial_progress p ON p.course_id = c.id
GROUP BY c.id, c.slug, c.title, c.category;

-- Seed courses
INSERT INTO public.tutorial_courses (slug, title, description, category, difficulty, duration_minutes, is_published, is_featured, order_index)
VALUES
  ('premiers-pas', 'Premiers pas avec RapidoMeet', 'Apprenez à créer votre première réunion et à comprendre votre rapport en 10 minutes.', 'getting_started', 'debutant', 10, true, true, 0),
  ('transcription-audio', 'Maîtriser la transcription audio', 'Optimisez vos imports audio pour des transcriptions parfaites.', 'transcription', 'debutant', 15, true, false, 1),
  ('lire-rapport', 'Lire et exploiter vos rapports', 'Décryptez chaque section de votre rapport et agissez sur les insights.', 'rapports', 'intermediaire', 12, true, false, 2),
  ('scenarios-automatisation', 'Automatiser avec les scénarios', 'Créez des workflows automatiques pour distribuer vos rapports.', 'scenarios', 'intermediaire', 20, true, false, 3),
  ('openclaw-avance', 'OpenClaw : votre assistant IA', 'Exploitez la puissance des Skills MCP pour analyser vos réunions.', 'openclaw', 'avance', 25, true, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed chapters for premiers-pas
INSERT INTO public.tutorial_chapters (course_id, slug, title, description, video_url, video_provider, video_duration_seconds, content_markdown, has_quiz, quiz_questions, order_index)
SELECT c.id, v.slug, v.title, v.description, v.video_url, 'youtube', v.duration, v.content, v.has_quiz, v.quiz::jsonb, v.idx
FROM tutorial_courses c
CROSS JOIN (VALUES
  ('intro', 'Introduction à RapidoMeet', 'Découvrez comment RapidoMeet transforme vos réunions en actions concrètes.', 'https://youtube.com/embed/placeholder1', 180,
   E'## Bienvenue sur RapidoMeet\n\nRapidoMeet est une plateforme d''intelligence post-réunion qui automatise :\n\n- 🎙 La **transcription** de vos réunions audio\n- 🧠 L''**analyse IA** pour extraire tâches, décisions et contacts\n- 📊 La **génération de rapports** automatiques\n- 📤 La **distribution** multi-canal\n\n### Prérequis\n\n- Un compte RapidoMeet (gratuit)\n- Un fichier audio MP3/WAV de réunion\n- 10 minutes pour ce tutoriel',
   false, '[]', 0),
  ('creer-reunion', 'Créer votre première réunion', 'Importez votre premier fichier audio et lancez le pipeline d''analyse.', 'https://youtube.com/embed/placeholder2', 240,
   E'## Créer votre première réunion\n\n### Étape 1 : Aller sur Nouvelle Réunion\nCliquez sur **+ Nouvelle réunion** dans la sidebar.\n\n### Étape 2 : Remplir les informations\n- **Titre** : Donnez un nom descriptif\n- **Type** : Choisissez le type de réunion\n- **Langue** : Français, Anglais ou Auto\n\n### Étape 3 : Importer votre audio\nGlissez votre fichier ou cliquez sur "Parcourir".\n\n**Formats acceptés** : MP3, WAV, M4A, WEBM\n\n### Étape 4 : Lancer l''analyse\nCliquez sur **Créer** et attendez 1-2 minutes.',
   true, '[{"id":"q1","question":"Quel format audio n''est PAS supporté par RapidoMeet ?","type":"qcm","options":[{"label":"MP3","value":"mp3","correct":false},{"label":"WAV","value":"wav","correct":false},{"label":"FLAC","value":"flac","correct":true},{"label":"M4A","value":"m4a","correct":false}],"explanation":"RapidoMeet accepte MP3, WAV, M4A, WEBM et OGG. Le format FLAC n''est pas encore supporté."},{"id":"q2","question":"La transcription démarre automatiquement après l''import.","type":"true_false","options":[{"label":"Vrai","value":"true","correct":true},{"label":"Faux","value":"false","correct":false}],"explanation":"Oui ! Dès que vous cliquez sur Créer, le pipeline démarre automatiquement."}]', 1),
  ('lire-resultats', 'Comprendre vos résultats', 'Découvrez les 5 onglets de votre rapport et comment les exploiter.', 'https://youtube.com/embed/placeholder3', 300,
   E'## Comprendre vos résultats\n\n### Les 5 onglets de votre rapport\n\n#### 📋 Résumé\nLe résumé exécutif généré par l''IA.\n\n#### ✅ Tâches\nToutes les actions extraites automatiquement.\n\n#### 🎯 Décisions\nLes décisions formelles prises pendant la réunion.\n\n#### 👥 Contacts\nLes personnes et entreprises mentionnées.\n\n#### 📊 Rapport\nLe rapport HTML complet téléchargeable.',
   true, '[{"id":"q3","question":"Combien d''onglets contient une page de réunion analysée ?","type":"qcm","options":[{"label":"3","value":"3","correct":false},{"label":"5","value":"5","correct":true},{"label":"7","value":"7","correct":false},{"label":"4","value":"4","correct":false}],"explanation":"Les 5 onglets sont : Résumé, Tâches, Décisions, Contacts et Rapport."}]', 2)
) AS v(slug, title, description, video_url, duration, content, has_quiz, quiz, idx)
WHERE c.slug = 'premiers-pas'
ON CONFLICT DO NOTHING;

-- Update chapters_count
UPDATE tutorial_courses SET chapters_count = (SELECT COUNT(*) FROM tutorial_chapters WHERE course_id = tutorial_courses.id AND is_published = true);
