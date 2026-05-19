-- Table kanban_boards
CREATE TABLE IF NOT EXISTS public.kanban_boards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Mon Kanban',
  description text,
  color text DEFAULT '#6366f1',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own boards" ON public.kanban_boards FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_kanban_boards_user ON public.kanban_boards(user_id);

-- Table kanban_columns
CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id uuid NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6b7280',
  icon text DEFAULT '📋',
  position integer NOT NULL DEFAULT 0,
  wip_limit integer,
  is_done_column boolean DEFAULT false,
  auto_archive_days integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage columns via board" ON public.kanban_columns FOR ALL
  USING (board_id IN (SELECT id FROM kanban_boards WHERE user_id = auth.uid()));

CREATE INDEX idx_kanban_columns_board ON public.kanban_columns(board_id, position);

-- Table kanban_cards
CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id uuid NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extracted_task_id uuid REFERENCES extracted_tasks(id) ON DELETE SET NULL,
  meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  labels text[] DEFAULT '{}',
  assignee text,
  assignee_avatar_url text,
  due_date date,
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2),
  position integer NOT NULL DEFAULT 0,
  is_archived boolean DEFAULT false,
  archived_at timestamptz,
  completed_at timestamptz,
  checklist jsonb DEFAULT '[]',
  attachments jsonb DEFAULT '[]',
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cards" ON public.kanban_cards FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_kanban_cards_column ON public.kanban_cards(column_id, position, is_archived);
CREATE INDEX idx_kanban_cards_board ON public.kanban_cards(board_id);
CREATE INDEX idx_kanban_cards_due ON public.kanban_cards(due_date) WHERE due_date IS NOT NULL AND is_archived = false;
CREATE INDEX idx_kanban_cards_task ON public.kanban_cards(extracted_task_id) WHERE extracted_task_id IS NOT NULL;

-- Table kanban_comments
CREATE TABLE IF NOT EXISTS public.kanban_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.kanban_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own comments" ON public.kanban_comments FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_kanban_comments_card ON public.kanban_comments(card_id, created_at);

-- Table kanban_activity
CREATE TABLE IF NOT EXISTS public.kanban_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id uuid NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  card_id uuid REFERENCES kanban_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.kanban_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own board activity" ON public.kanban_activity FOR SELECT
  USING (board_id IN (SELECT id FROM kanban_boards WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages activity" ON public.kanban_activity FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_kanban_activity_board ON public.kanban_activity(board_id, created_at DESC);