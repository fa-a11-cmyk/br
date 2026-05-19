import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { expressFetch, getExpressApiBaseUrl } from "@/lib/expressApi";
import type { SessionAction, SessionStatus } from "@/hooks/useMeetingUpload";

export type ActionStatus = "pending" | "confirmed" | "refused" | "executing" | "executed" | "error";

export interface PendingAction {
  id: string;
  session_id: string;
  action_type: string;
  title: string;
  summary: string;
  destination: string;
  payload: Record<string, unknown>;
  status: ActionStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for the Confirmation Gate — fetches pending actions from Express sessions
 * and allows user to approve/reject individual or bulk actions.
 *
 * Uses Express as source of truth: GET /sessions/:id, POST /sessions/:id/actions/:aid/confirm|refuse
 */
export function usePendingActions(sessionId?: string) {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mapSessionActions = (sessionActions: SessionAction[], sid: string): PendingAction[] => {
    return (sessionActions || []).map(a => ({
      id: a.id,
      session_id: sid,
      action_type: a.action_type,
      title: a.title,
      summary: a.summary,
      destination: a.destination,
      payload: a.payload || {},
      status: a.status as ActionStatus,
      error_message: a.error_message,
      created_at: "",
      updated_at: "",
    }));
  };

  const fetchActions = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const apiBase = getExpressApiBaseUrl();
      if (apiBase) {
        const session = await expressFetch<SessionStatus>(`/sessions/${sessionId}`);
        setActions(mapSessionActions(session.actions || [], sessionId));
      }
      // No Supabase fallback — Express is the source of truth for actions
    } catch (e) {
      console.error("Failed to fetch session actions:", e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // Poll for status updates when there are active actions
  useEffect(() => {
    const hasActive = actions.some(a =>
      a.status === "pending" || a.status === "confirmed" || a.status === "executing"
    );
    if (hasActive) {
      pollRef.current = setInterval(fetchActions, 4000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [actions, fetchActions]);

  const confirmAction = useCallback(async (actionId: string) => {
    if (!sessionId) return;
    setProcessing(actionId);
    try {
      await expressFetch(`/sessions/${sessionId}/actions/${actionId}/confirm`, { method: "POST" });
      // Optimistic update
      setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: "confirmed" as ActionStatus } : a));
      toast({ title: "Action approuvée ✓" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  }, [sessionId]);

  const refuseAction = useCallback(async (actionId: string) => {
    if (!sessionId) return;
    setProcessing(actionId);
    try {
      await expressFetch(`/sessions/${sessionId}/actions/${actionId}/refuse`, { method: "POST" });
      setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: "refused" as ActionStatus } : a));
      toast({ title: "Action refusée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  }, [sessionId]);

  const confirmAll = useCallback(async () => {
    if (!sessionId) return;
    setProcessing("all");
    try {
      const pendingActions = actions.filter(a => a.status === "pending");
      await Promise.all(
        pendingActions.map(a =>
          expressFetch(`/sessions/${sessionId}/actions/${a.id}/confirm`, { method: "POST" })
        )
      );
      setActions(prev => prev.map(a => a.status === "pending" ? { ...a, status: "confirmed" as ActionStatus } : a));
      toast({ title: `${pendingActions.length} action(s) approuvée(s) ✓` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  }, [actions, sessionId]);

  const refuseAll = useCallback(async () => {
    if (!sessionId) return;
    setProcessing("all");
    try {
      const pendingActions = actions.filter(a => a.status === "pending");
      await Promise.all(
        pendingActions.map(a =>
          expressFetch(`/sessions/${sessionId}/actions/${a.id}/refuse`, { method: "POST" })
        )
      );
      setActions(prev => prev.map(a => a.status === "pending" ? { ...a, status: "refused" as ActionStatus } : a));
      toast({ title: "Toutes les actions refusées" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  }, [actions, sessionId]);

  const pendingCount = actions.filter(a => a.status === "pending").length;
  const executedCount = actions.filter(a => a.status === "executed").length;
  const errorCount = actions.filter(a => a.status === "error").length;

  return {
    actions,
    loading,
    processing,
    pendingCount,
    executedCount,
    errorCount,
    fetchActions,
    confirmAction,
    refuseAction,
    confirmAll,
    refuseAll,
  };
}
