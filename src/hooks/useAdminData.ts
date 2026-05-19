import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdminData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSection = useCallback(async (section: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("admin-data", {
        body: { section },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (e: any) {
      setError(e.message || "Erreur");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchSection, loading, error };
}
