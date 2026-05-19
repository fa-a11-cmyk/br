import { useState, useEffect } from "react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justCameBack, setJustCameBack] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setJustCameBack(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setJustCameBack(true);
      setTimeout(() => setJustCameBack(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !justCameBack) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[10000] px-5 py-2.5 flex items-center justify-center gap-3 backdrop-blur-sm transition-colors duration-300 ${
        isOffline ? "bg-yellow-500/95" : "bg-emerald-500/95"
      }`}
    >
      <span className="font-body text-sm font-medium text-white">
        {isOffline
          ? "📴 Hors ligne — Vos données locales restent accessibles"
          : "✅ Connexion rétablie — Synchronisation en cours..."}
      </span>
    </div>
  );
}
