import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContactSettings {
  calendly_url: string;
  whatsapp_number: string;
  contact_name: string;
  contact_role: string;
}

const DEFAULTS: ContactSettings = {
  calendly_url: "https://calendly.com/sncf-braindcode/30min",
  whatsapp_number: "33614189225",
  contact_name: "Michael K.",
  contact_role: "CEO & Co-fondateur",
};

export function useContactSettings() {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULTS);

  useEffect(() => {
    supabase
      .from("admin_config" as any)
      .select("config_value")
      .eq("config_key", "contact_settings")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const cv = (data as any).config_value as any;
          setSettings({
            calendly_url: cv.calendly_url || DEFAULTS.calendly_url,
            whatsapp_number: cv.whatsapp_number || DEFAULTS.whatsapp_number,
            contact_name: cv.contact_name || DEFAULTS.contact_name,
            contact_role: cv.contact_role || DEFAULTS.contact_role,
          });
        }
      });
  }, []);

  return settings;
}
