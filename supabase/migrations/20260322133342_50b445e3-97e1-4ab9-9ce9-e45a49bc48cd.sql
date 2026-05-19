
-- Create workspace_role enum
DO $$ BEGIN
  CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Table workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  owner_id uuid NOT NULL,
  plan text DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  max_members integer DEFAULT 5,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table workspace_members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role workspace_role DEFAULT 'member',
  status text DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  invited_by uuid,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Table workspace_invitations
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role workspace_role DEFAULT 'member',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

-- Table shared_meetings
CREATE TABLE IF NOT EXISTS public.shared_meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  permissions text DEFAULT 'view' CHECK (permissions IN ('view','comment','edit')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, workspace_id)
);

-- RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_meetings ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id, status);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id, status);
CREATE INDEX idx_invitations_token ON public.workspace_invitations(token);
CREATE INDEX idx_invitations_email ON public.workspace_invitations(email);
CREATE INDEX idx_shared_meetings_workspace ON public.shared_meetings(workspace_id);

-- Helper functions (created BEFORE policies that reference workspace_members)
CREATE OR REPLACE FUNCTION public.get_user_workspace_role(p_user_id uuid, p_workspace_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT role::text FROM workspace_members
  WHERE user_id = p_user_id AND workspace_id = p_workspace_id AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_user_id uuid, p_workspace_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE user_id = p_user_id AND workspace_id = p_workspace_id AND status = 'active'
  );
$$;

-- RLS Policies for workspaces
CREATE POLICY "Members can read their workspace" ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Owners can update workspace" ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- RLS Policies for workspace_members
CREATE POLICY "Members see workspace members" ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Service role manages members" ON public.workspace_members FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- RLS Policies for workspace_invitations
CREATE POLICY "Service role manages invitations" ON public.workspace_invitations FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins read invitations" ON public.workspace_invitations FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner','admin') AND wm.status = 'active'
    )
  );

-- RLS Policies for shared_meetings
CREATE POLICY "Workspace members see shared meetings" ON public.shared_meetings FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Service role manages shared meetings" ON public.shared_meetings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Trigger: create personal workspace on profile creation
CREATE OR REPLACE FUNCTION public.create_personal_workspace()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_workspace_id uuid;
  v_slug text;
BEGIN
  v_slug := lower(regexp_replace(
    COALESCE(NEW.first_name, 'user') || '-' || substring(NEW.user_id::text, 1, 8),
    '[^a-z0-9-]', '-', 'g'
  ));

  INSERT INTO public.workspaces (name, slug, owner_id, plan)
  VALUES (
    COALESCE(NEW.first_name || '''s workspace', 'Mon workspace'),
    v_slug,
    NEW.user_id,
    'free'
  )
  RETURNING id INTO v_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (v_workspace_id, NEW.user_id, 'owner', 'active');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_profile_create_workspace ON public.profiles;
CREATE TRIGGER on_new_profile_create_workspace
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_personal_workspace();
