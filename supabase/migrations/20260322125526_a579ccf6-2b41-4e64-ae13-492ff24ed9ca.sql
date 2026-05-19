
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan text NOT NULL UNIQUE CHECK (plan IN ('free', 'starter', 'pro')),
  meetings_per_month integer,
  audio_max_duration_minutes integer,
  audio_max_size_mb integer,
  api_keys_max integer,
  scenarios_max integer,
  storage_gb numeric(5,2)
);

INSERT INTO public.plan_limits
  (plan, meetings_per_month, audio_max_duration_minutes, audio_max_size_mb, api_keys_max, scenarios_max, storage_gb)
VALUES
  ('free',    3,   30,  50,  1,  2,  0.5),
  ('starter', 30,  120, 200, 5,  10, 5.0),
  ('pro',     NULL, NULL, 500, 20, NULL, 50.0)
ON CONFLICT (plan) DO UPDATE SET
  meetings_per_month = EXCLUDED.meetings_per_month,
  audio_max_duration_minutes = EXCLUDED.audio_max_duration_minutes,
  audio_max_size_mb = EXCLUDED.audio_max_size_mb,
  api_keys_max = EXCLUDED.api_keys_max,
  scenarios_max = EXCLUDED.scenarios_max,
  storage_gb = EXCLUDED.storage_gb;

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read plan limits"
  ON public.plan_limits FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION check_meeting_quota(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_plan text;
  v_limit integer;
  v_count integer;
  v_month_start date;
BEGIN
  SELECT COALESCE(s.plan, 'free')
  INTO v_plan
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active'
  LIMIT 1;

  IF v_plan IS NULL THEN v_plan := 'free'; END IF;

  SELECT meetings_per_month INTO v_limit FROM plan_limits WHERE plan = v_plan;

  IF v_limit IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'plan', v_plan, 'limit', null, 'used', 0, 'remaining', null);
  END IF;

  v_month_start := date_trunc('month', CURRENT_DATE);
  SELECT COUNT(*) INTO v_count FROM meetings WHERE user_id = p_user_id AND created_at >= v_month_start AND status != 'failed';

  RETURN jsonb_build_object('allowed', v_count < v_limit, 'plan', v_plan, 'limit', v_limit, 'used', v_count, 'remaining', GREATEST(0, v_limit - v_count));
END;
$$;
