
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS efficiency_score integer;

ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS efficiency_breakdown jsonb DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.rapidocrm_syncs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES detected_contacts(id) ON DELETE SET NULL,
  rapidocrm_contact_id text,
  action text CHECK (action IN ('created', 'updated', 'skipped', 'failed')),
  error_message text,
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE public.rapidocrm_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own syncs" ON public.rapidocrm_syncs FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rapidocrm_syncs_user ON public.rapidocrm_syncs(user_id, synced_at DESC);

CREATE OR REPLACE FUNCTION calculate_efficiency_score(p_meeting_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_meeting record;
  v_tasks_total integer;
  v_tasks_done integer;
  v_decisions_count integer;
  v_score_decisions integer := 0;
  v_score_tasks integer := 0;
  v_score_sentiment integer := 0;
  v_score_duration integer := 0;
  v_total integer;
  v_breakdown jsonb;
BEGIN
  SELECT * INTO v_meeting FROM meetings WHERE id = p_meeting_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COUNT(*) INTO v_decisions_count FROM extracted_decisions WHERE meeting_id = p_meeting_id;
  v_score_decisions := LEAST(ROUND((v_decisions_count::float / 3) * 25), 25);

  SELECT COUNT(*) INTO v_tasks_total FROM extracted_tasks WHERE meeting_id = p_meeting_id;
  SELECT COUNT(*) INTO v_tasks_done FROM extracted_tasks WHERE meeting_id = p_meeting_id AND status = 'done';
  IF v_tasks_total > 0 THEN
    v_score_tasks := ROUND((v_tasks_done::float / v_tasks_total) * 25);
  ELSE
    v_score_tasks := 0;
  END IF;

  IF v_meeting.sentiment_score IS NOT NULL THEN
    v_score_sentiment := ROUND((v_meeting.sentiment_score::float / 100) * 25);
  ELSE
    v_score_sentiment := 12;
  END IF;

  IF v_meeting.duration_seconds IS NOT NULL THEN
    IF v_meeting.duration_seconds < 900 THEN v_score_duration := 5;
    ELSIF v_meeting.duration_seconds < 1800 THEN v_score_duration := 20;
    ELSIF v_meeting.duration_seconds < 2700 THEN v_score_duration := 25;
    ELSIF v_meeting.duration_seconds < 3600 THEN v_score_duration := 18;
    ELSIF v_meeting.duration_seconds < 5400 THEN v_score_duration := 12;
    ELSE v_score_duration := 5;
    END IF;
  ELSE
    v_score_duration := 15;
  END IF;

  v_total := v_score_decisions + v_score_tasks + v_score_sentiment + v_score_duration;
  v_breakdown := jsonb_build_object('decisions', v_score_decisions, 'tasks_completion', v_score_tasks, 'sentiment', v_score_sentiment, 'duration', v_score_duration);

  UPDATE meetings SET efficiency_score = v_total, efficiency_breakdown = v_breakdown, updated_at = now() WHERE id = p_meeting_id;

  RETURN v_total;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_efficiency_score()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM calculate_efficiency_score(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_meeting_completed_calc_score ON public.meetings;
CREATE TRIGGER on_meeting_completed_calc_score
  AFTER UPDATE ON public.meetings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION trigger_efficiency_score();

SELECT calculate_efficiency_score(id) FROM meetings WHERE status = 'completed' AND efficiency_score IS NULL;
