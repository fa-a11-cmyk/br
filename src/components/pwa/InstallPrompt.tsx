import { useState, useEffect } from "react";
import { X, Smartphone, Zap, Bell, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");
    else setPlatform("desktop");

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      const dismissedAt = dismissed ? parseInt(dismissed) : 0;
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (dismissedAt < oneWeekAgo) {
        setTimeout(() => setIsVisible(true), 30000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setIsVisible(false);
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      else localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    } catch (e) {
      console.error("[PWA] Install error:", e);
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!isVisible || isInstalled) return null;

  const isMobile = platform === "ios" || platform === "android";

  return (
    <div
      className={`fixed z-[9999] bg-card border border-border shadow-2xl animate-in slide-in-from-bottom duration-300 ${
        isMobile
          ? "bottom-0 left-0 right-0 rounded-t-2xl p-5 pb-9"
          : "bottom-6 right-6 rounded-2xl p-5 max-w-[360px]"
      }`}
    >
      {isMobile && (
        <div className="w-9 h-1 bg-muted rounded-full mx-auto mb-5" />
      )}

      <button onClick={handleDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3.5 mb-3">
        <img src="/pwa/icons/icon-192.png" alt="RapidoMeet" className="w-13 h-13 rounded-xl" />
        <div>
          <div className="font-display font-extrabold text-base text-foreground">
            Installer RapidoMeet
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Accès rapide depuis votre écran d&apos;accueil
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-5">
        {[
          { icon: Zap, text: "Démarrer une réunion en 1 tap" },
          { icon: Bell, text: "Notifications push en temps réel" },
          { icon: WifiOff, text: "Accès hors ligne à vos rapports" },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className="w-3.5 h-3.5 text-primary" />
            {text}
          </div>
        ))}
      </div>

      {platform === "ios" && (
        <div className="bg-secondary rounded-xl p-3 mb-4 text-xs text-muted-foreground leading-relaxed">
          Appuyez sur <strong className="text-foreground">Partager</strong> (⬆️)
          puis <strong className="text-foreground">&quot;Sur l&apos;écran d&apos;accueil&quot;</strong>
        </div>
      )}

      <div className="flex gap-2.5">
        <Button onClick={handleInstall} className="flex-1 bg-gradient-primary shadow-fuchsia">
          {platform === "ios" ? "Compris !" : "Installer l'app"}
        </Button>
        <Button variant="outline" onClick={handleDismiss} className="text-muted-foreground">
          Plus tard
        </Button>
      </div>
    </div>
  );
}
