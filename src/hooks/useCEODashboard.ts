import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCEODashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSection = useCallback(async (section: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/ceo-dashboard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ section }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, tr, eng, rev] = await Promise.all([
        fetchSection("overview"),
        fetchSection("trends"),
        fetchSection("engagement"),
        fetchSection("revenue"),
      ]);
      setOverview(ov);
      setTrends(tr);
      setEngagement(eng);
      setRevenue(rev);
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error("CEO dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }, [fetchSection]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 5 * 60000);
    return () => clearInterval(interval);
  }, [loadAll]);

  return { overview, trends, engagement, revenue, loading, lastUpdated, refresh: loadAll };
}
