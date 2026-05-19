
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN (
    'meeting_completed', 'meeting_failed',
    'task_assigned', 'task_due_soon',
    'subscription_expiring', 'subscription_renewed',
    'quota_warning', 'quota_exceeded',
    'report_shared', 'system'
  )),
  title text NOT NULL,
  message text,
  link text,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
