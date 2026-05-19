
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  completed_steps text[] DEFAULT '{}',
  current_step text DEFAULT 'profile',
  is_completed boolean DEFAULT false,
  skipped boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own onboarding"
  ON public.onboarding_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_onboarding_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.onboarding_progress (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_create_onboarding
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_onboarding_progress();
