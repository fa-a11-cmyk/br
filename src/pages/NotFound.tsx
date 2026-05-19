import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => { console.error("404:", location.pathname); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display font-extrabold text-[160px] leading-none tracking-tighter text-gradient opacity-15" style={{ animation: "flicker 3s infinite" }}>404</h1>
      <h2 className="font-display font-bold text-[28px] text-foreground mt-2 mb-3">Oups, cette page n'existe pas.</h2>
      <p className="font-body text-base text-muted-foreground mb-8">Le lien est cassé ou la page a été déplacée.</p>
      <div className="flex gap-3">
        <Link to="/app/dashboard" className="font-display font-bold text-sm text-white bg-gradient-primary px-8 py-3.5 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform">
          ← Retour au tableau de bord
        </Link>
        <Link to="/app/aide" className="font-body text-sm text-muted-foreground border border-border px-6 py-3.5 rounded-[10px] hover:text-foreground hover:border-muted-foreground/30 transition-all">
          Contacter le support
        </Link>
      </div>
      <style>{`@keyframes flicker { 0%,100% { opacity:0.15 } 50% { opacity:0.25 } }`}</style>
    </div>
  );
};

export default NotFound;
