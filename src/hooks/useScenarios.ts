import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Scenario {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  filter_meeting_type: string[] | null;
  filter_min_duration: number | null;
  filter_sentiment_min: number | null;
  actions: any[];
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  last_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScenarioExecution {
  id: string;
  scenario_id: string;
  user_id: string;
  meeting_id: string | null;
  trigger_type: string;
  status: string;
  actions_results: any[];
  error_message: string | null;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
  scenarios?: { name: string } | null;
}

export function useScenarios() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const fetchScenarios = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("scenarios")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as Scenario[];
  }, []);

  const fetchExecutions = useCallback(async (scenarioId?: string) => {
    let query = (supabase as any)
      .from("scenario_executions")
      .select("*, scenarios(name)")
      .order("started_at", { ascending: false })
      .limit(50);
    if (scenarioId) query = query.eq("scenario_id", scenarioId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ScenarioExecution[];
  }, []);

  const createScenario = useCallback(async (scenario: Partial<Scenario>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");
    const { data, error } = await (supabase as any)
      .from("scenarios")
      .insert({ ...scenario, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    toast({ title: "Scénario créé ✓" });
    return data as Scenario;
  }, [toast]);

  const updateScenario = useCallback(async (id: string, updates: Partial<Scenario>) => {
    const { error } = await (supabase as any)
      .from("scenarios")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    toast({ title: "Scénario mis à jour ✓" });
  }, [toast]);

  const toggleScenario = useCallback(async (id: string, isActive: boolean) => {
    const { error } = await (supabase as any)
      .from("scenarios")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    toast({ title: isActive ? "Scénario activé" : "Scénario désactivé" });
  }, [toast]);

  const deleteScenario = useCallback(async (id: string) => {
    const { error } = await (supabase as any)
      .from("scenarios").delete().eq("id", id);
    if (error) throw error;
    toast({ title: "Scénario supprimé" });
  }, [toast]);

  const executeScenario = useCallback(async (scenarioId: string, meetingId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("execute-scenario", {
        body: { scenarioId, meetingId, triggerType: "manual" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: data.status === "success" ? "Scénario exécuté ✓" : "Exécution partielle ⚠️",
        description: `${data.actionsResults?.length || 0} action(s) en ${data.durationMs}ms`,
        variant: data.status === "success" ? "default" : "destructive",
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    fetchScenarios,
    fetchExecutions,
    createScenario,
    updateScenario,
    toggleScenario,
    deleteScenario,
    executeScenario,
  };
}
