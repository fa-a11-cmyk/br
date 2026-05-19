
CREATE TABLE public.tutorial_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_slug TEXT NOT NULL,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 3,
  quiz_score INTEGER DEFAULT NULL,
  quiz_passed BOOLEAN DEFAULT FALSE,
  badge_earned BOOLEAN DEFAULT FALSE,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, tutorial_slug)
);

ALTER TABLE public.tutorial_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tutorial progress" ON public.tutorial_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tutorial progress" ON public.tutorial_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutorial progress" ON public.tutorial_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_tutorial_progress_updated_at
  BEFORE UPDATE ON public.tutorial_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
