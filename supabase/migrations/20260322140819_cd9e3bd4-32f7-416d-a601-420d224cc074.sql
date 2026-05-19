-- Fix security definer view
DROP VIEW IF EXISTS kanban_board_stats;
CREATE OR REPLACE VIEW kanban_board_stats WITH (security_invoker = true) AS
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