import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useOAuth() {
  const [connections, setConnections] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadConnections(); }, []);

  const callOAuth = async (action: string, payload: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/oauth-handler`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const loadConnections = useCallback(async () => {
    try {
      const data = await callOAuth("get_connections", {});
      setConnections(data.connections || []);
    } catch {}
  }, []);

  const connectProvider = async (provider: string) => {
    setLoading(true);
    try {
      const data = await callOAuth("get_auth_url", { provider });
      if (data.url) {
        sessionStorage.setItem("oauth_state", data.state);
        sessionStorage.setItem("oauth_provider", provider);
        window.location.href = data.url;
      }
    } catch (e: any) {
      toast({ title: "Erreur de connexion", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const disconnectProvider = async (provider: string) => {
    try {
      await callOAuth("disconnect", { provider });
      setConnections(prev => prev.filter(c => c.provider !== provider));
      toast({ title: `${provider} déconnecté ✓` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const syncRecordings = async (provider: string) => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/sync-recordings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ provider, days_back: 14 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `${data.new} nouvel(s) enregistrement(s) trouvé(s)` });
      await loadRecordings();
    } catch (e: any) {
      toast({ title: "Erreur de synchronisation", description: e.message, variant: "destructive" });
    } finally { setSyncing(false); }
  };

  const loadRecordings = useCallback(async () => {
    const { data } = await supabase.from("meeting_recordings" as any).select("*").neq("status", "completed").order("start_time", { ascending: false }).limit(50);
    setRecordings((data as any[]) || []);
  }, []);

  const importRecording = async (recordingId: string) => {
    setImporting(recordingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/import-recording`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ recording_id: recordingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Import lancé ✓", description: "La transcription démarre..." });
      setRecordings(prev => prev.map(r => r.id === recordingId ? { ...r, status: "processing" } : r));
      return data;
    } catch (e: any) {
      toast({ title: "Erreur d'import", description: e.message, variant: "destructive" });
    } finally { setImporting(null); }
  };

  const isConnected = (provider: string) => connections.some(c => c.provider === provider);
  const getConnection = (provider: string) => connections.find(c => c.provider === provider);

  return { connections, recordings, loading, syncing, importing, connectProvider, disconnectProvider, syncRecordings, loadRecordings, importRecording, isConnected, getConnection };
}
