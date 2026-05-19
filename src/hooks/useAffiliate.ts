import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAffiliate() {
  const [affiliate, setAffiliate] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [clicks, setClicks] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: aff } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setAffiliate(aff);

    if (!aff) { setLoading(false); return; }

    const [{ data: statsData }, { data: clicksData }, { data: referralsData }, { data: commissionsData }] = await Promise.all([
      supabase.from("affiliate_stats").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("affiliate_clicks").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("affiliate_referrals").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }),
      supabase.from("affiliate_commissions").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }).limit(50),
    ]);

    setStats(statsData);
    setClicks(clicksData || []);
    setReferrals(referralsData || []);
    setCommissions(commissionsData || []);
    setLoading(false);
  };

  const applyAsAffiliate = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/affiliate-tracker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action: "apply_as_affiliate", payload: {} }),
    });
    const data = await res.json();
    if (data.success) {
      toast({ title: "Bienvenue dans le programme ! 🎉", description: `Votre code : ${data.code}` });
      await load();
    }
    return data;
  };

  const copyLink = () => {
    if (!affiliate?.code) return;
    navigator.clipboard.writeText(`https://rapidomeet.io?ref=${affiliate.code}`);
    toast({ title: "Lien copié ! 📋" });
  };

  const copyCode = () => {
    if (!affiliate?.code) return;
    navigator.clipboard.writeText(affiliate.code);
    toast({ title: "Code copié ! 📋" });
  };

  return { affiliate, stats, clicks, referrals, commissions, loading, applyAsAffiliate, copyLink, copyCode, reload: load };
}
