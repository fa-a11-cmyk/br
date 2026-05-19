-- Trigger: create default kanban board on new profile
CREATE OR REPLACE FUNCTION create_default_kanban_board()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_board_id uuid;
BEGIN
  INSERT INTO public.kanban_boards (user_id, name, is_default, color)
  VALUES (NEW.user_id, 'Mon Tableau', true, '#6366f1')
  RETURNING id INTO v_board_id;

  INSERT INTO public.kanban_columns (board_id, name, color, icon, position, is_done_column)
  VALUES
    (v_board_id, 'À faire', '#6b7280', '📋', 0, false),
    (v_board_id, 'En cours', '#6366f1', '⚡', 1, false),
    (v_board_id, 'En révision', '#f59e0b', '👁', 2, false),
    (v_board_id, 'Terminé', '#22c55e', '✅', 3, true);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_create_kanban
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_kanban_board();

-- Trigger: sync extracted_tasks to kanban_cards
CREATE OR REPLACE FUNCTION sync_task_to_kanban()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_board_id uuid;
  v_column_id uuid;
  v_max_pos integer;
BEGIN
  SELECT id INTO v_board_id FROM kanban_boards
  WHERE user_id = NEW.user_id AND is_default = true LIMIT 1;

  IF v_board_id IS NULL THEN RETURN NEW; END IF;

  SELECT id INTO v_column_id FROM kanban_columns
  WHERE board_id = v_board_id AND position = 0 LIMIT 1;

  IF v_column_id IS NULL THEN RETURN NEW; END IF;

  SELECT COALESCE(MAX(position), -1) INTO v_max_pos
  FROM kanban_cards WHERE column_id = v_column_id AND is_archived = false;

  INSERT INTO public.kanban_cards (
    column_id, board_id, user_id, extracted_task_id, meeting_id,
    title, priority, assignee, due_date, position
  ) VALUES (
    v_column_id, v_board_id, NEW.user_id, NEW.id, NEW.meeting_id,
    NEW.title, COALESCE(NEW.priority::text, 'medium'), NEW.assignee,
    NEW.deadline::date, v_max_pos + 1
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_extracted_sync_kanban
  AFTER INSERT ON public.extracted_tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_task_to_kanban();

-- Updated_at trigger for kanban_cards
CREATE TRIGGER kanban_cards_updated_at
  BEFORE UPDATE ON public.kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Shift positions helper
CREATE OR REPLACE FUNCTION shift_kanban_positions(
  p_column_id uuid, p_from_position integer, p_exclude_card_id uuid
) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = 'public' AS $$
  UPDATE kanban_cards SET position = position + 1
  WHERE column_id = p_column_id AND position >= p_from_position
    AND id != p_exclude_card_id AND is_archived = false;
$$;

-- Board stats view
CREATE OR REPLACE VIEW kanban_board_stats AS
SELECT
  b.id as board_id, b.user_id, b.name,
  COUNT(c.id) as total_cards,
  COUNT(c.id) FILTER (WHERE c.is_archived = false) as active_cards,
  COUNT(c.id) FILTER (WHERE c.priority = 'critical' AND c.is_archived = false) as critical_count,
  COUNT(c.id) FILTER (WHERE c.due_date < CURRENT_DATE AND c.is_archived = false AND col.is_done_column = false) as overdue_count,
  COUNT(c.id) FILTER (WHERE col.is_done_column = true AND c.is_archived = false) as done_count
FROM kanban_boards b
LEFT JOIN kanban_cards c ON c.board_id = b.id
LEFT JOIN kanban_columns col ON col.id = c.column_id
GROUP BY b.id, b.user_id, b.name;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE kanban_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE kanban_columns;