import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionState {
  plan: string;
  status: string;
  loading: boolean;
  isStarter: boolean;
  isPro: boolean;
  isFree: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

const PLAN_LIMITS: Record<string, { meetings: number; scenarios: number; channels: number }> = {
  free: { meetings: 2, scenarios: 0, channels: 1 },
  starter: { meetings: 5, scenarios: 1, channels: 2 },
  pro: { meetings: Infinity, scenarios: 10, channels: 5 },
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    status: "inactive",
    loading: true,
    isStarter: false,
    isPro: false,
    isFree: true,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });

  useEffect(() => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const plan = data?.plan || "free";
      setState({
        plan,
        status: data?.status || "inactive",
        loading: false,
        isStarter: plan === "starter",
        isPro: plan === "pro",
        isFree: plan === "free",
        currentPeriodEnd: data?.current_period_end || null,
        cancelAtPeriodEnd: data?.cancel_at_period_end || false,
      });
    };

    fetch();

    const channel = supabase
      .channel("subscription-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const limits = PLAN_LIMITS[state.plan] || PLAN_LIMITS.free;

  const canUseFeature = (feature: "meetings" | "scenarios" | "channels", currentCount: number) => {
    return currentCount < limits[feature];
  };

  return { ...state, limits, canUseFeature };
};
