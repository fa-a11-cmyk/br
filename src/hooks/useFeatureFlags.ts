import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_FLAGS: Record<string, boolean> = {
  email_builder: true,
  pdf_builder: true,
  openclaw: true,
  skills_marketplace: false,
  live_transcription: true,
  export_comptable: true,
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("admin_config" as any)
          .select("config_value")
          .eq("config_key", "feature_flags")
          .maybeSingle();
        if ((data as any)?.config_value) {
          setFlags({ ...DEFAULT_FLAGS, ...((data as any).config_value as Record<string, boolean>) });
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const isEnabled = (key: string) => flags[key] ?? true;

  return { flags, isEnabled, loading };
}
