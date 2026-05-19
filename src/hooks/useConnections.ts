import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface UserConnection {
  id: string;
  user_id: string;
  integration_id: string;
  status: string;
  connection_type: string;
  credentials: Record<string, unknown>;
  config: Record<string, unknown>;
  account_label: string | null;
  connected_at: string;
  updated_at: string;
}

export function useConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user) { setConnections([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("user_connections" as any)
      .select("*")
      .eq("user_id", user.id);
    if (error) { console.error(error); }
    else { setConnections((data as any) || []); }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const connectionMap = useMemo(() => {
    const map: Record<string, UserConnection> = {};
    connections.forEach(c => { map[c.integration_id] = c; });
    return map;
  }, [connections]);

  const connectApp = useCallback(async (
    integrationId: string,
    connectionType: string,
    credentials: Record<string, unknown> = {},
    config: Record<string, unknown> = {},
    accountLabel?: string,
  ) => {
    if (!user) return;
    // First upsert the connection
    const { error } = await supabase
      .from("user_connections" as any)
      .upsert({
        user_id: user.id,
        integration_id: integrationId,
        status: "connected",
        connection_type: connectionType,
        credentials: {},
        config,
        account_label: accountLabel || null,
      } as any, { onConflict: "user_id,integration_id" });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder la connexion.", variant: "destructive" });
      return false;
    }
    // Encrypt credentials server-side if any were provided
    if (Object.keys(credentials).length > 0) {
      try {
        await supabase.functions.invoke("encrypt-credentials", {
          body: { action: "encrypt", credentials, integrationId },
        });
      } catch (e) {
        console.error("Encryption failed, credentials stored empty:", e);
      }
    }
    toast({ title: "Connecté !", description: `Intégration connectée avec succès.` });
    await fetchConnections();
    // Auto-complete onboarding step
    try {
      const { data: ob } = await supabase
        .from("onboarding_progress" as any)
        .select("completed_steps")
        .eq("user_id", user.id)
        .maybeSingle();
      if (ob && !(ob as any).completed_steps?.includes("configure_integration")) {
        const newSteps = [...((ob as any).completed_steps || []), "configure_integration"];
        await supabase.from("onboarding_progress" as any).update({
          completed_steps: newSteps,
          current_step: newSteps.length >= 4 ? "done" : undefined,
          is_completed: newSteps.length >= 4,
          updated_at: new Date().toISOString(),
        } as any).eq("user_id", user.id);
      }
    } catch {}
    return true;
  }, [user, fetchConnections]);

  const disconnectApp = useCallback(async (integrationId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_connections" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("integration_id", integrationId);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de déconnecter.", variant: "destructive" });
      return false;
    }
    toast({ title: "Déconnecté", description: "Intégration déconnectée." });
    await fetchConnections();
    return true;
  }, [user, fetchConnections]);

  const updateConfig = useCallback(async (integrationId: string, config: Record<string, unknown>) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_connections" as any)
      .update({ config } as any)
      .eq("user_id", user.id)
      .eq("integration_id", integrationId);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour la configuration.", variant: "destructive" });
      return false;
    }
    await fetchConnections();
    return true;
  }, [user, fetchConnections]);

  return { connections, connectionMap, loading, connectApp, disconnectApp, updateConfig, refetch: fetchConnections };
}
