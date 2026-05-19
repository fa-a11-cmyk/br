import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";

type MeetingType = "commercial" | "tech" | "retro" | "onboarding" | "rh" | "marketing" | "autre";
type MeetingStatus = "pending" | "transcribing" | "analyzing" | "completed" | "failed" | "partial";

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  channel: string | null;
  language: string | null;
  duration_seconds: number | null;
  participants: any[];
  audio_url: string | null;
  summary: string | null;
  sentiment_score: number | null;
  precision_percent: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  efficiency_score: number | null;
  efficiency_breakdown: Record<string, number> | null;
}

export interface ExtractedTask {
  id: string;
  meeting_id: string;
  title: string;
  assignee: string | null;
  deadline: string | null;
  priority: string;
  status: string;
  source_timestamp: string | null;
  created_at: string;
}

export interface ExtractedDecision {
  id: string;
  meeting_id: string;
  content: string;
  source_timestamp: string | null;
  created_at: string;
}

export interface DetectedContact {
  id: string;
  meeting_id: string;
  name: string;
  company: string | null;
  email: string | null;
  score: number;
  interest_signals: string | null;
  created_at: string;
}

export interface Transcription {
  id: string;
  meeting_id: string;
  full_text: string;
  segments: any[];
  word_count: number;
  language: string;
  created_at: string;
}

export function useMeetings() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createMeeting = useCallback(async (data: {
    title: string;
    meeting_type: MeetingType;
    channel?: string;
    language?: string;
    participants?: string[];
  }) => {
    // Left empty: Backend creates the session as part of POST /upload-meeting
    return null;
  }, []);

  const uploadAndTranscribe = useCallback(async (
    meetingId: string, 
    file: File, 
    metadata?: { 
      title?: string; 
      meeting_type?: MeetingType; 
      language?: string; 
      participants?: string[];
      user_instructions?: string;
    }
  ) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("meeting_title", metadata?.title || "Nouvelle Réunion");
      formData.append("meeting_type", metadata?.meeting_type || "commercial");
      formData.append("language", metadata?.language || "fr");
      if (metadata?.participants?.length) {
        formData.append("participants", metadata.participants.join(","));
      }
      if (metadata?.user_instructions) {
         formData.append("user_instructions", metadata.user_instructions);
      }

      // Calls backend `POST /upload-meeting` endpoint handling storage, transcription, routing, etc.
      const data = await apiFetch<any>("/upload-meeting", {
        method: "POST",
        body: formData as any // Use raw FormData, fetch automatically sets multipart/form-data
      });

      toast({ title: "Pipeline MeetMind terminé", description: `Session ${data.session_id} traitée avec succès.` });
      return data;
    } catch (e: any) {
      toast({ title: "Erreur lors du traitement", description: e.message, variant: "destructive" });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Use the backend generic `GET /session/:id` to fetch the status/report
  const fetchReport = useCallback(async (meetingId: string) => {
    try {
       const data = await apiFetch<any>(`/session/${meetingId}`);
       return data;
    } catch (e: any) {
       console.error("fetchReport:", e);
       return null;
    }
  }, []);

  const analyzeTranscript = useCallback(async (meetingId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-transcript", {
        body: { meetingId },
      });

      if (error) throw error;

      toast({
        title: "Analyse terminée",
        description: `${data.tasksCount} tâches, ${data.decisionsCount} décisions, ${data.contactsCount} contacts`,
      });
      return data;
    } catch (e: any) {
      toast({ title: "Erreur d'analyse", description: e.message, variant: "destructive" });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const triggerWebhook = useCallback(async (meetingId: string, webhookUrl: string) => {
    // Obsolete if your pipeline automatically triggers webhooks. Placed behind stub to prevent crash in old UI.
    console.warn("triggerWebhook is obsolete via direct fetch. Backend handles workflows automatically on upload-meeting.");
    return null;
  }, []);

  // Use the backend endpoints for confirm and refuse actions instead of invoking older transcript logic
  const confirmAction = useCallback(async (sessionId: string, actionId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/sessions/${sessionId}/actions/${actionId}/confirm`, {
        method: "POST"
      });
      return data;
    } catch (e: any) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const refuseAction = useCallback(async (sessionId: string, actionId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/sessions/${sessionId}/actions/${actionId}/refuse`, {
        method: "POST"
      });
      return data;
    } catch (e: any) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    // If backend doesn't implement fetchMeetings yet, fall back directly to DB
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Meeting[];
  }, []);

  const fetchMeeting = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Meeting;
  }, []);

  const fetchTranscription = useCallback(async (meetingId: string) => {
    const { data, error } = await supabase
      .from("transcriptions")
      .select("*")
      .eq("meeting_id", meetingId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as Transcription | null;
  }, []);

  const fetchTasks = useCallback(async (meetingId?: string) => {
    let query = supabase.from("extracted_tasks").select("*").order("created_at", { ascending: false });
    if (meetingId) query = query.eq("meeting_id", meetingId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ExtractedTask[];
  }, []);

  const fetchDecisions = useCallback(async (meetingId: string) => {
    const { data, error } = await supabase
      .from("extracted_decisions")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at");

    if (error) throw error;
    return (data || []) as ExtractedDecision[];
  }, []);

  const fetchContacts = useCallback(async (meetingId?: string) => {
    let query = supabase.from("detected_contacts").select("*").order("created_at", { ascending: false });
    if (meetingId) query = query.eq("meeting_id", meetingId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as DetectedContact[];
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    const { error } = await supabase
      .from("extracted_tasks")
      .update({ status: status as any })
      .eq("id", taskId);
    if (error) throw error;
  }, []);

  return {
    loading,
    createMeeting,
    uploadAndTranscribe,
    analyzeTranscript,
    triggerWebhook,
    fetchMeetings,
    fetchMeeting,
    fetchTranscription,
    fetchTasks,
    fetchDecisions,
    fetchContacts,
    fetchReport,
    updateTaskStatus,
    confirmAction,
    refuseAction,
  };
}
