import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_STEPS = [
  {
    id: "profile",
    title: "Complétez votre profil",
    description: "Ajoutez votre nom et votre entreprise",
    icon: "👤",
    path: "/app/configuration",
    action: "Compléter",
  },
  {
    id: "first_meeting",
    title: "Créez votre première réunion",
    description: "Importez un audio ou démarrez un enregistrement",
    icon: "🎙",
    path: "/app/reunions/nouvelle",
    action: "Créer",
  },
  {
    id: "view_report",
    title: "Découvrez votre rapport",
    description: "Consultez les tâches, décisions et contacts extraits",
    icon: "📊",
    path: "/app/rapports",
    action: "Voir",
  },
  {
    id: "configure_integration",
    title: "Connectez un canal de distribution",
    description: "Email, Slack, WhatsApp ou Telegram",
    icon: "🔗",
    path: "/app/integrations",
    action: "Connecter",
  },
] as const;

interface OnboardingProgress {
  id: string;
  user_id: string;
  completed_steps: string[];
  current_step: string;
  is_completed: boolean;
  skipped: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useOnboarding() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        const { data: created } = await supabase
          .from("onboarding_progress")
          .insert({ user_id: user.id })
          .select()
          .single();
        if (created) setProgress(created as unknown as OnboardingProgress);
      } else {
        setProgress(data as unknown as OnboardingProgress);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const completeStep = useCallback(async (stepId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !progress) return;

    // Idempotent
    if (progress.completed_steps?.includes(stepId)) return;

    const newCompleted = [...new Set([...(progress.completed_steps || []), stepId])];
    const allDone = ONBOARDING_STEPS.every(s => newCompleted.includes(s.id));
    const nextStep = ONBOARDING_STEPS.find(s => !newCompleted.includes(s.id))?.id || "done";

    const updates = {
      completed_steps: newCompleted,
      current_step: nextStep,
      is_completed: allDone,
      completed_at: allDone ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("onboarding_progress")
      .update(updates)
      .eq("user_id", user.id);

    setProgress(prev => prev ? { ...prev, ...updates } : null);
  }, [progress]);

  const skipOnboarding = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("onboarding_progress")
      .update({ skipped: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    setProgress(prev => prev ? { ...prev, skipped: true } : null);
  }, []);

  const shouldShow = progress && !progress.is_completed && !progress.skipped;

  const completionPercent = progress
    ? Math.round(((progress.completed_steps?.length || 0) / ONBOARDING_STEPS.length) * 100)
    : 0;

  return {
    progress, loading, steps: ONBOARDING_STEPS,
    completeStep, skipOnboarding,
    shouldShow, completionPercent,
  };
}
