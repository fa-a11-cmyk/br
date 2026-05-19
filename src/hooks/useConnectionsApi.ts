import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ConnectionInfo {
  id: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  account_label: string | null;
  metadata: Record<string, unknown>;
  connected_at: string;
}

/**
 * Hook for managing integration connections via Edge Functions.
 * All secrets are stored server-side (Supabase Vault) — never client-side.
 */
export function useConnectionsApi() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Non authentifié");
    return session.access_token;
  }, []);

  const callFunction = useCallback(async (fnName: string, body: Record<string, unknown>) => {
    const token = await getToken();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  }, [getToken]);

  // Fetch all connections for current user
  const fetchConnections = useCallback(async () => {
    if (!user) { setConnections([]); setLoading(false); return; }
    try {
      const data = await callFunction("connections-api", { action: "list" });
      setConnections(data.connections || []);
    } catch (e) {
      console.error("Failed to fetch connections:", e);
    } finally {
      setLoading(false);
    }
  }, [user, callFunction]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  // Build a map for quick lookup
  const connectionMap = connections.reduce<Record<string, ConnectionInfo>>((map, c) => {
    map[c.provider] = c;
    return map;
  }, {});

  /**
   * Start OAuth flow — redirects user to Google consent screen via Edge Function.
   * No secrets are exposed client-side.
   */
  const startOAuthConnect = useCallback(async (provider: string) => {
    setConnecting(provider);
    try {
      const data = await callFunction("connections-api", {
        action: "oauth_start",
        provider,
        redirect_uri: `${window.location.origin}/oauth/${provider}/callback`,
      });
      if (data.url) {
        // Store state for CSRF verification on return
        sessionStorage.setItem("oauth_state", data.state);
        sessionStorage.setItem("oauth_provider", provider);
        window.location.href = data.url;
      }
    } catch (e: any) {
      toast({ title: "Erreur OAuth", description: e.message, variant: "destructive" });
    } finally {
      setConnecting(null);
    }
  }, [callFunction]);

  /**
   * Connect API-key based providers (Telegram, Notion, Slack, etc.).
   * Credentials are sent to the Edge Function which stores them in Vault.
   * The frontend MUST clear input fields after calling this.
   */
  const connectWithCredentials = useCallback(async (
    provider: string,
    credentials: Record<string, string>,
    accountLabel?: string,
  ) => {
    setConnecting(provider);
    try {
      await callFunction("connections-api", {
        action: "connect",
        provider,
        credentials,
        account_label: accountLabel || null,
      });
      toast({ title: "Connecté !", description: `${provider} connecté avec succès.` });
      await fetchConnections();
      return true;
    } catch (e: any) {
      toast({ title: "Erreur de connexion", description: e.message, variant: "destructive" });
      return false;
    } finally {
      setConnecting(null);
    }
  }, [callFunction, fetchConnections]);

  /**
   * Disconnect a provider — removes server-side secrets.
   */
  const disconnect = useCallback(async (connectionId: string) => {
    try {
      await callFunction("connections-api", {
        action: "disconnect",
        connection_id: connectionId,
      });
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast({ title: "Déconnecté", description: "Intégration supprimée." });
      return true;
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
      return false;
    }
  }, [callFunction]);

  /**
   * Test a connection — verifies server-side that the stored credentials work.
   */
  const testConnection = useCallback(async (connectionId: string) => {
    try {
      const data = await callFunction("connections-api", {
        action: "test",
        connection_id: connectionId,
      });
      if (data.ok) {
        toast({ title: "Connexion valide ✓" });
      } else {
        toast({ title: "Connexion invalide", description: data.error, variant: "destructive" });
      }
      return data.ok;
    } catch (e: any) {
      toast({ title: "Erreur de test", description: e.message, variant: "destructive" });
      return false;
    }
  }, [callFunction]);

  const isConnected = useCallback((provider: string) => {
    return connectionMap[provider]?.status === "connected";
  }, [connectionMap]);

  return {
    connections,
    connectionMap,
    loading,
    connecting,
    fetchConnections,
    startOAuthConnect,
    connectWithCredentials,
    disconnect,
    testConnection,
    isConnected,
  };
}
