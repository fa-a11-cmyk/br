
-- Table calendly_connections
CREATE TABLE IF NOT EXISTS public.calendly_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  token_type text DEFAULT 'personal' CHECK (token_type IN ('personal','oauth')),
  refresh_token text,
  token_expires_at timestamptz,
  calendly_user_uri text NOT NULL,
  calendly_org_uri text,
  user_name text,
  user_email text,
  user_slug text,
  scheduling_url text,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.calendly_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calendly connection" ON public.calendly_connections FOR ALL USING (auth.uid() = user_id);

-- Table calendly_events
CREATE TABLE IF NOT EXISTS public.calendly_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendly_uri text NOT NULL UNIQUE,
  event_type_uri text,
  name text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','canceled','completed')),
  start_time timestamptz,
  end_time timestamptz,
  location jsonb DEFAULT '{}',
  invitees_count integer DEFAULT 0,
  invitees jsonb DEFAULT '[]',
  cancellation jsonb,
  meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.calendly_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own calendly events" ON public.calendly_events FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_calendly_events_user ON public.calendly_events(user_id, start_time DESC);

-- Table calendly_scheduling_links
CREATE TABLE IF NOT EXISTS public.calendly_scheduling_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  calendly_link_uri text UNIQUE,
  booking_url text NOT NULL,
  event_type_uri text,
  max_event_count integer DEFAULT 1,
  owner_type text DEFAULT 'EventType',
  status text DEFAULT 'active',
  context text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.calendly_scheduling_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calendly links" ON public.calendly_scheduling_links FOR ALL USING (auth.uid() = user_id);

-- Add Calendly skill to OpenClaw
INSERT INTO public.openclaw_skills (slug, name, description, category, icon, mcp_tool_name, mcp_tool_description, mcp_input_schema)
VALUES (
  'calendly-agenda',
  'Agenda Calendly',
  'Consultez vos réunions planifiées et créez des liens de réservation.',
  'integration',
  '📅',
  'calendly_schedule',
  'Interact with Calendly to get upcoming meetings or create scheduling links',
  '{"type":"object","properties":{"sub_action":{"type":"string","enum":["get_upcoming","create_link"],"description":"get_upcoming: list next meetings, create_link: generate a booking link"},"event_type_slug":{"type":"string","description":"Slug of the event type (optional for create_link)"},"context":{"type":"string","description":"Context note for the link"}},"required":["sub_action"]}'
) ON CONFLICT (slug) DO NOTHING;
