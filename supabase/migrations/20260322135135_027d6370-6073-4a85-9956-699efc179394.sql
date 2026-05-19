
-- Table blog_articles
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content_html text,
  content_gjs jsonb DEFAULT '{}',
  seo_title text,
  seo_description text,
  seo_keywords text[] DEFAULT '{}',
  seo_canonical_url text,
  og_image_url text,
  schema_markup jsonb DEFAULT '{}',
  author_id uuid,
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean DEFAULT false,
  reading_time_minutes integer DEFAULT 5,
  has_lead_magnet boolean DEFAULT false,
  lead_magnet_id uuid,
  view_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published articles"
  ON public.blog_articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins manage articles"
  ON public.blog_articles FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE INDEX idx_blog_slug ON public.blog_articles(slug) WHERE status = 'published';
CREATE INDEX idx_blog_status ON public.blog_articles(status, published_at DESC);
CREATE INDEX idx_blog_category ON public.blog_articles(category, status);

-- Table blog_images
CREATE TABLE IF NOT EXISTS public.blog_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES blog_articles(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  caption text,
  prompt_used text,
  generated_by_ai boolean DEFAULT false,
  width integer,
  height integer,
  file_size_bytes integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.blog_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read blog images"
  ON public.blog_images FOR SELECT USING (true);

CREATE POLICY "Admins manage blog images"
  ON public.blog_images FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Table leads_magnets
CREATE TABLE IF NOT EXISTS public.leads_magnets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN (
    'pdf_guide','checklist','template_meeting',
    'template_tasks','template_decisions',
    'ebook','toolkit','swipe_file',
    'calculator','script','framework'
  )),
  content_html text,
  content_json jsonb DEFAULT '{}',
  file_url text,
  thumbnail_url text,
  download_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  requires_form boolean DEFAULT true,
  form_fields jsonb DEFAULT '["name","email"]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads_magnets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active magnets"
  ON public.leads_magnets FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage magnets"
  ON public.leads_magnets FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Table leads_captures
CREATE TABLE IF NOT EXISTS public.leads_captures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_magnet_id uuid REFERENCES leads_magnets(id) ON DELETE SET NULL,
  article_id uuid REFERENCES blog_articles(id) ON DELETE SET NULL,
  first_name text,
  company_name text,
  email text NOT NULL,
  phone text,
  source text DEFAULT 'blog',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read leads"
  ON public.leads_captures FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE POLICY "Public can insert leads"
  ON public.leads_captures FOR INSERT WITH CHECK (true);

CREATE INDEX idx_leads_email ON public.leads_captures(email);
CREATE INDEX idx_leads_article ON public.leads_captures(article_id);
CREATE INDEX idx_leads_magnet ON public.leads_captures(lead_magnet_id);
