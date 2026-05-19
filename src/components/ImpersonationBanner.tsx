import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/contexts/ImpersonationContext";

export function ImpersonationBanner() {
  const { isImpersonating, targetUserId, expiresAt, endImpersonation } = useImpersonation();
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (!isImpersonating || !expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { endImpersonation(); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
      setUrgent(diff < 5 * 60 * 1000);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isImpersonating, expiresAt, endImpersonation]);

  if (!isImpersonating) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between ${urgent ? "animate-pulse" : ""}`}>
      <span className="text-sm font-medium">
        ⚠️ MODE IMPERSONATION — Vous agissez en tant que {targetUserId?.slice(0, 8)}… — Expire dans {remaining}
      </span>
      <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs" onClick={endImpersonation}>
        Quitter l'impersonation
      </Button>
    </div>
  );
}
