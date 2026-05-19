import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { expressFetch, getExpressApiBaseUrl, getSupabaseAccessToken } from "@/lib/expressApi";

export interface SessionStatus {
  session_id: string;
  status: "processing" | "awaiting_confirmation" | "complete" | "error";
  actions?: SessionAction[];
  results?: unknown[];
  error_message?: string;
}

export interface SessionAction {
  id: string;
  action_type: string;
  title: string;
  summary: string;
  destination: string;
  status: "pending" | "confirmed" | "executing" | "executed" | "refused" | "error";
  requiresConfirmation: boolean;
  error_message?: string;
  payload?: Record<string, unknown>;
}

interface UploadResult {
  session_id: string;
  status: string;
  meeting_id?: string;
}

/**
 * Hook for uploading meetings to the Express backend (RapidoMeet_System).
 * Includes Supabase JWT bearer token for authentication.
 * Falls back to Edge Functions if VITE_EXPRESS_API_BASE_URL is not set.
 */
export function useMeetingUpload() {
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  /**
   * Upload meeting to Express backend with JWT auth.
   * Falls back to Supabase Edge Functions if Express URL is not configured.
   */
  const uploadMeeting = useCallback(async (
    meetingId: string,
    file: File,
    metadata: {
      title: string;
      meeting_type: string;
      language: string;
      participants?: string[];
    }
  ): Promise<UploadResult> => {
    setUploading(true);
    setUploadStatus("uploading");
    try {
      const apiBase = getExpressApiBaseUrl();

      if (apiBase) {
        // Express backend path (primary)
        const formData = new FormData();
        formData.append("audio", file);
        formData.append("meeting_id", meetingId);
        formData.append("meeting_title", metadata.title);
        formData.append("meeting_type", metadata.meeting_type);
        formData.append("language", metadata.language);
        if (metadata.participants?.length) {
          formData.append("participants", metadata.participants.join(","));
        }

        const data = await expressFetch<UploadResult>("/upload-meeting", {
          method: "POST",
          body: formData,
        });

        setSessionId(data.session_id);
        setUploadStatus(data.status || "processing");
        return data;
      } else {
        // Fallback: use Supabase Edge Functions (existing flow)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Non authentifié");

        const filePath = `${user.id}/${meetingId}/audio`;
        await supabase.storage
          .from("meeting-audio")
          .upload(filePath, file, { contentType: file.type, upsert: true });

        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { meetingId, fileName: file.name },
        });
        if (error) throw error;

        setSessionId(meetingId);
        setUploadStatus("processing");
        return { session_id: meetingId, status: "processing", meeting_id: meetingId };
      }
    } catch (e: any) {
      setUploadStatus("error");
      toast({ title: "Erreur d'upload", description: e.message, variant: "destructive" });
      throw e;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * Poll session status from Express (GET /sessions/:id).
   * Falls back to Supabase meetings table if Express is not configured.
   */
  const pollSessionStatus = useCallback(async (sid: string): Promise<SessionStatus | null> => {
    try {
      const apiBase = getExpressApiBaseUrl();
      if (apiBase) {
        return await expressFetch<SessionStatus>(`/sessions/${sid}`);
      } else {
        // Read from Supabase meetings table directly (RLS-protected)
        const { data } = await supabase
          .from("meetings")
          .select("id, status, error_message")
          .eq("id", sid)
          .single();
        if (!data) return null;
        return {
          session_id: data.id,
          status: data.status === "completed" ? "complete" : data.status === "failed" ? "error" : "processing",
          error_message: data.error_message ?? undefined,
        };
      }
    } catch {
      return null;
    }
  }, []);

  return {
    uploading,
    sessionId,
    uploadStatus,
    uploadMeeting,
    pollSessionStatus,
  };
}
