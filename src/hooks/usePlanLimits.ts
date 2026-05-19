import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlanLimits {
  plan: string;
  meetings_per_month: number | null;
  audio_max_duration_minutes: number | null;
  audio_max_size_mb: number;
  api_keys_max: number;
  scenarios_max: number | null;
  storage_gb: number;
}

interface MeetingQuota {
  allowed: boolean;
  plan: string;
  limit: number | null;
  used: number;
  remaining: number | null;
}

let limitsCache: { limits: PlanLimits; quota: MeetingQuota } | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 3 * 60 * 1000;

export function usePlanLimits() {
  const [limits, setLimits] = useState<PlanLimits | null>(limitsCache?.limits || null);
  const [quota, setQuota] = useState<MeetingQuota | null>(limitsCache?.quota || null);
  const [loading, setLoading] = useState(!limitsCache);

  const loadLimits = useCallback(async () => {
    if (limitsCache && Date.now() < cacheExpiry) {
      setLimits(limitsCache.limits);
      setQuota(limitsCache.quota);
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      const plan = sub?.plan || "free";

      const { data: planData } = await supabase
        .from("plan_limits" as any)
        .select("*")
        .eq("plan", plan)
        .single();

      const { data: quotaData } = await supabase
        .rpc("check_meeting_quota", { p_user_id: user.id });

      const l = planData as unknown as PlanLimits | null;
      const q = quotaData as unknown as MeetingQuota | null;

      if (l) setLimits(l);
      if (q) setQuota(q);

      if (l && q) {
        limitsCache = { limits: l, quota: q };
        cacheExpiry = Date.now() + CACHE_TTL;
      }
    } catch (e) {
      console.error("usePlanLimits error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLimits(); }, [loadLimits]);

  const checkAudioFile = useCallback((file: File): { allowed: boolean; reason?: string } => {
    if (!limits) return { allowed: true };
    const sizeMb = file.size / (1024 * 1024);
    if (limits.audio_max_size_mb && sizeMb > limits.audio_max_size_mb) {
      return {
        allowed: false,
        reason: `Fichier trop volumineux. Limite ${limits.plan} : ${limits.audio_max_size_mb}MB. Votre fichier : ${sizeMb.toFixed(0)}MB.`,
      };
    }
    return { allowed: true };
  }, [limits]);

  const canCreateMeeting = quota?.allowed ?? true;

  const upgradeMessage = quota && !quota.allowed
    ? `Vous avez utilisé ${quota.used}/${quota.limit} réunions ce mois. Passez à un plan supérieur pour continuer.`
    : null;

  return {
    limits, quota, loading,
    canCreateMeeting, upgradeMessage,
    checkAudioFile,
    reload: loadLimits,
  };
}
