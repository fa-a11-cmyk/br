
-- Create meeting status enum
CREATE TYPE public.meeting_status AS ENUM ('pending', 'transcribing', 'analyzing', 'completed', 'failed', 'partial');

-- Create meeting type enum
CREATE TYPE public.meeting_type AS ENUM ('commercial', 'tech', 'retro', 'onboarding', 'rh', 'marketing', 'autre');

-- Create priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'done', 'ignored');

-- Meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  meeting_type public.meeting_type NOT NULL DEFAULT 'autre',
  status public.meeting_status NOT NULL DEFAULT 'pending',
  channel TEXT DEFAULT 'import',
  language TEXT DEFAULT 'fr',
  duration_seconds INTEGER,
  participants JSONB DEFAULT '[]'::jsonb,
  audio_url TEXT,
  webhook_url TEXT,
  summary TEXT,
  sentiment_score INTEGER,
  precision_percent INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings" ON public.meetings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meetings" ON public.meetings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meetings" ON public.meetings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Transcriptions table
CREATE TABLE public.transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  full_text TEXT NOT NULL DEFAULT '',
  segments JSONB DEFAULT '[]'::jsonb,
  word_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcriptions" ON public.transcriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transcriptions" ON public.transcriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Extracted tasks table
CREATE TABLE public.extracted_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  assignee TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'pending',
  source_timestamp TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extracted_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.extracted_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.extracted_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.extracted_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.extracted_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Extracted decisions table
CREATE TABLE public.extracted_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  source_timestamp TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extracted_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own decisions" ON public.extracted_decisions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decisions" ON public.extracted_decisions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Detected contacts table
CREATE TABLE public.detected_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  score INTEGER DEFAULT 0,
  interest_signals TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.detected_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts" ON public.detected_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON public.detected_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_extracted_tasks_updated_at BEFORE UPDATE ON public.extracted_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('meeting-audio', 'meeting-audio', false, 524288000);

-- Storage RLS policies
CREATE POLICY "Users can upload audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'meeting-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own audio" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'meeting-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own audio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'meeting-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
