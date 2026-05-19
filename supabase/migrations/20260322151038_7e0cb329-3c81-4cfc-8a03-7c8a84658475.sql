
-- Table landing_pages
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  content_html text,
  content_gjs jsonb DEFAULT '{}',
  seo_title text,
  seo_description text,
  og_image_url text,
  primary_color text DEFAULT '#6366f1',
  logo_url text,
  background_type text DEFAULT 'color' CHECK (background_type IN ('color','gradient','image')),
  background_value text DEFAULT '#ffffff',
  font_family text DEFAULT 'Inter',
  has_booking_form boolean DEFAULT true,
  has_video_room boolean DEFAULT false,
  has_countdown boolean DEFAULT false,
  has_testimonials boolean DEFAULT false,
  booking_config jsonb DEFAULT '{}',
  jitsi_config jsonb DEFAULT '{}',
  countdown_target timestamptz,
  countdown_label text,
  view_count integer DEFAULT 0,
  booking_count integer DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at timestamptz,
  custom_domain text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published landing pages" ON public.landing_pages FOR SELECT USING (status = 'published');
CREATE POLICY "Users manage own landing pages" ON public.landing_pages FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_landing_slug ON public.landing_pages(slug) WHERE status = 'published';
CREATE INDEX idx_landing_user ON public.landing_pages(user_id, status);

-- Table landing_bookings
CREATE TABLE IF NOT EXISTS public.landing_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id uuid NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_name text NOT NULL,
  prospect_email text NOT NULL,
  prospect_phone text,
  prospect_company text,
  prospect_message text,
  booked_date date NOT NULL,
  booked_time text NOT NULL,
  duration_minutes integer DEFAULT 30,
  timezone text DEFAULT 'Europe/Paris',
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','canceled','completed','no_show')),
  jitsi_room_name text,
  jitsi_room_url text,
  rapidomeet_meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  owner_notes text,
  confirmation_sent_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.landing_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners see own landing bookings" ON public.landing_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can book landing" ON public.landing_bookings FOR INSERT WITH CHECK (true);

CREATE INDEX idx_bookings_landing ON public.landing_bookings(landing_page_id, booked_date);
CREATE INDEX idx_bookings_user_landing ON public.landing_bookings(user_id, status, booked_date);
CREATE INDEX idx_bookings_date_landing ON public.landing_bookings(booked_date, booked_time) WHERE status IN ('pending','confirmed');

-- Table landing_templates
CREATE TABLE IF NOT EXISTS public.landing_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text DEFAULT 'general' CHECK (category IN ('general','consultant','agence','coach','saas','freelance','startup')),
  thumbnail_url text,
  content_html text NOT NULL,
  content_gjs jsonb DEFAULT '{}',
  default_config jsonb DEFAULT '{}',
  is_published boolean DEFAULT true,
  is_premium boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.landing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read landing templates" ON public.landing_templates FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage landing templates" ON public.landing_templates FOR ALL USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Seed templates
INSERT INTO public.landing_templates (name, description, category, content_html, default_config, order_index)
VALUES
(
  'Consultant Solo',
  'Landing page épurée pour consultant indépendant avec formulaire de RDV.',
  'consultant',
  '<div style="max-width:800px;margin:0 auto;padding:60px 20px;text-align:center"><h1 style="font-size:42px;font-weight:900">[Votre Nom]</h1><p style="font-size:20px;color:#6b7280">[Votre Spécialité]</p><a href="#booking" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#6366f1;color:white;border-radius:12px;text-decoration:none;font-weight:600">📅 Réserver un appel gratuit</a><div style="display:flex;justify-content:center;gap:40px;margin-top:48px"><div><div style="font-size:36px;font-weight:900;color:#6366f1">10+</div><div style="color:#6b7280">Années d''expérience</div></div><div><div style="font-size:36px;font-weight:900;color:#6366f1">50+</div><div style="color:#6b7280">Clients accompagnés</div></div><div><div style="font-size:36px;font-weight:900;color:#6366f1">98%</div><div style="color:#6b7280">Satisfaction client</div></div></div></div>',
  '{"primary_color":"#6366f1","has_booking_form":true,"has_video_room":true,"booking_config":{"title":"Réserver un appel découverte","duration_options":[30,60],"available_days":[1,2,3,4,5],"available_hours":{"start":"09:00","end":"18:00"}}}',
  0
),
(
  'Agence Digitale',
  'Landing page moderne pour agence avec section services et RDV.',
  'agence',
  '<div style="max-width:900px;margin:0 auto;padding:60px 20px;text-align:center"><h1 style="font-size:48px;font-weight:900">[Nom de votre Agence]</h1><p style="font-size:22px;color:#6b7280;margin-top:12px">[Votre proposition de valeur]</p><a href="#booking" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#8b5cf6;color:white;border-radius:12px;text-decoration:none;font-weight:600">Démarrer votre projet →</a><h2 style="margin-top:60px;font-size:28px">Nos services</h2><div style="display:flex;gap:24px;margin-top:24px;justify-content:center"><div style="flex:1;max-width:300px;padding:24px;border:1px solid #e5e7eb;border-radius:16px"><div style="font-size:36px">🎨</div><h3>Design</h3><p style="color:#6b7280">UI/UX, Identité visuelle, Prototypage</p></div><div style="flex:1;max-width:300px;padding:24px;border:1px solid #e5e7eb;border-radius:16px"><div style="font-size:36px">⚡</div><h3>Développement</h3><p style="color:#6b7280">Web, Mobile, SaaS, IA</p></div></div></div>',
  '{"primary_color":"#8b5cf6","has_booking_form":true,"has_video_room":true,"booking_config":{"title":"Discutons de votre projet","duration_options":[30,45,60],"available_days":[1,2,3,4,5],"available_hours":{"start":"10:00","end":"17:00"}}}',
  1
)
ON CONFLICT DO NOTHING;
