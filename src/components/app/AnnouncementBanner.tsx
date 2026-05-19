import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Megaphone } from "lucide-react";

export default function AnnouncementBanner() {
  const [message, setMessage] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from("admin_config" as any)
        .select("config_value")
        .eq("config_key", "global_announcement")
        .maybeSingle();

      const val = (data as any)?.config_value;
      if (val?.active && val?.message) {
        const dismissedKey = `announcement_dismissed_${btoa(val.message).slice(0, 20)}`;
        if (!sessionStorage.getItem(dismissedKey)) {
          setMessage(val.message);
        }
      }
    };
    fetchAnnouncement();
  }, []);

  if (!message || dismissed) return null;

  const dismiss = () => {
    const dismissedKey = `announcement_dismissed_${btoa(message).slice(0, 20)}`;
    sessionStorage.setItem(dismissedKey, "1");
    setDismissed(true);
  };

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center gap-3 text-sm">
      <Megaphone className="h-4 w-4 text-primary shrink-0" />
      <p className="flex-1 text-foreground font-body">{message}</p>
      <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
