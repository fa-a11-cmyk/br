
CREATE TABLE IF NOT EXISTS public.scenarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL DEFAULT 'meeting_completed'
    CHECK (trigger_type IN (
      'meeting_completed',
      'meeting_failed',
      'task_created',
      'decision_created',
      'contact_detected',
      'manual'
    )),
  filter_meeting_type text[],
  filter_min_duration integer,
  filter_sentiment_min integer,
  actions jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  execution_count integer DEFAULT 0,
  last_executed_at timestamptz,
  last_status text CHECK (last_status IN ('success', 'failed', 'pending') OR last_status IS NULL),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scenarios"
  ON public.scenarios FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_scenarios_user_id ON public.scenarios(user_id);
CREATE INDEX idx_scenarios_active ON public.scenarios(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.scenario_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  trigger_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'success', 'failed')),
  actions_results jsonb DEFAULT '[]',
  error_message text,
  duration_ms integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.scenario_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own executions"
  ON public.scenario_executions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_executions_scenario_id ON public.scenario_executions(scenario_id);
CREATE INDEX idx_executions_user_id ON public.scenario_executions(user_id);
CREATE INDEX idx_executions_meeting_id ON public.scenario_executions(meeting_id);

-- Function to create default scenarios for new users
CREATE OR REPLACE FUNCTION create_default_scenarios(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.scenarios
    (user_id, name, description, trigger_type, actions, is_active)
  VALUES
  (
    p_user_id,
    'Rapport par email après réunion',
    'Envoie automatiquement le rapport par email dès que la réunion est analysée.',
    'meeting_completed',
    '[{"type": "send_email", "label": "Envoyer rapport par email", "config": {"to": "me", "subject": "Rapport : {{meeting_title}}"}}]'::jsonb,
    false
  ),
  (
    p_user_id,
    'Notification Slack sur tâche critique',
    'Alerte Slack dès qu''une tâche de priorité critique est extraite.',
    'task_created',
    '[{"type": "send_slack", "label": "Alerter sur Slack", "config": {"channel": "#alerts", "message": "🚨 Tâche critique : {{task_title}}"}}]'::jsonb,
    false
  ),
  (
    p_user_id,
    'Webhook N8N après réunion commerciale',
    'Déclenche un workflow N8N pour les réunions de type commercial.',
    'meeting_completed',
    '[{"type": "trigger_n8n", "label": "Déclencher workflow N8N", "config": {"workflow": "commercial-followup"}}]'::jsonb,
    false
  );
END;
$$;

-- Trigger for new profiles
CREATE OR REPLACE FUNCTION handle_new_user_scenarios()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM create_default_scenarios(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_profile_create_scenarios ON public.profiles;
CREATE TRIGGER on_new_profile_create_scenarios
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_scenarios();
