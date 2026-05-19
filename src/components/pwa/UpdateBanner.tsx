import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
  });

  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed top-[76px] left-1/2 -translate-x-1/2 z-[9998] bg-card border border-primary/40 rounded-xl px-5 py-3 flex items-center gap-4 shadow-fuchsia-lg animate-in slide-in-from-top whitespace-nowrap">
      <span className="text-sm text-foreground">
        🚀 Mise à jour RapidoMeet disponible
      </span>
      <Button
        size="sm"
        className="bg-gradient-primary text-xs"
        onClick={() => updateServiceWorker(true)}
      >
        Mettre à jour →
      </Button>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
