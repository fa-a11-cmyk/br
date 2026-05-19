-- Create secure function for kanban board stats
CREATE OR REPLACE FUNCTION public.get_kanban_board_stats(p_board_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'board_id', p_board_id,
    'total_cards', COUNT(c.id),
    'active_cards', COUNT(c.id) FILTER (WHERE c.is_archived = false),
    'done_count', COUNT(c.id) FILTER (WHERE col.is_done_column = true AND c.is_archived = false),
    'overdue_count', COUNT(c.id) FILTER (WHERE c.due_date < CURRENT_DATE AND c.is_archived = false AND col.is_done_column = false)
  )
  FROM kanban_cards c
  LEFT JOIN kanban_columns col ON col.id = c.column_id
  WHERE c.board_id = p_board_id
    AND c.user_id = auth.uid();
$$;