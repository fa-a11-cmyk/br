import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const actions = [
  { icon: "🔄", label: "Rapport généré", done: true },
  { icon: "💬", label: "WhatsApp envoyé (3 dest.)", done: true },
  { icon: "📊", label: "RapidoCRM mis à jour", done: true },
  { icon: "🔁", label: "N8N Scénario N2 déclenché", done: true },
  { icon: "📅", label: "Google Calendar mis à jour", done: true },
  { icon: "📧", label: "Email HTML envoyé", done: true },
];

const OpenClawBanner = () => {
  const ref = useScrollReveal();
  const [visibleActions, setVisibleActions] = useState(0);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const el = (ref as any).current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !triggered) {
        setTriggered(true);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [triggered]);

  useEffect(() => {
    if (!triggered) return;
    if (visibleActions >= actions.length) return;
    const t = setTimeout(() => setVisibleActions(v => v + 1), 400);
    return () => clearTimeout(t);
  }, [triggered, visibleActions]);

  return (
    <section ref={ref} className="py-[80px] px-5 md:px-[60px]">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
        {/* Left col - 3/5 */}
        <div className="lg:col-span-3">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-[hsl(var(--violet-l))] mb-4">
            ⚡ OpenClaw · Propulsé par BraindCode
          </p>
          <h2 className="font-display font-extrabold text-foreground mb-4" style={{ fontSize: "clamp(28px, 4vw, 46px)", lineHeight: 1.08, letterSpacing: "-1.5px" }}>
            Votre agent IA
            <br />
            tourne 24h/24.
            <br />
            <span className="text-gradient">Sans vous.</span>
          </h2>
          <p className="font-body text-[16px] text-muted-foreground max-w-[480px] leading-relaxed mb-8">
            OpenClaw est l'agent IA open-source le plus rapide du monde.
            BraindCode le déploie, le sécurise et le connecte à vos outils
            sur AWS — pour que chaque réunion déclenche des actions
            en moins de 3 minutes, même quand vous dormez.
          </p>
          <div className="flex flex-col gap-3 mb-8">
            {[
              { icon: "🔌", text: "Compatible 13 000+ serveurs MCP" },
              { icon: "🔁", text: "Intégration native N8N" },
              { icon: "📈", text: "S'améliore à chaque réunion" },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="font-body text-sm text-foreground">{f.text}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/openclaw" className="border border-[hsl(var(--violet))] text-[hsl(var(--violet-l))] font-body font-semibold text-sm py-3 px-6 rounded-[10px] hover:bg-violet-d transition-colors">
              En savoir plus sur OpenClaw →
            </Link>
            <a href="#tarifs" className="bg-gradient-primary text-white font-display font-bold text-sm py-3 px-6 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform">
              Voir les tarifs →
            </a>
          </div>
        </div>

        {/* Right col - 2/5: Mini dashboard */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-primary" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="font-display font-bold text-sm text-foreground">OpenClaw</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                <span className="font-mono text-[10px] text-[hsl(var(--success))]">Actif · 18ms</span>
              </div>
            </div>
            <p className="font-body text-[13px] text-muted-foreground mb-4">Réunion terminée il y a 2 min...</p>
            <div className="space-y-2.5">
              {actions.map((a, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i < visibleActions ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}>
                  <span className="text-sm">{a.icon}</span>
                  <span className="font-mono text-[12px] text-muted-foreground flex-1">{a.label}</span>
                  <span className="font-mono text-[11px] text-[hsl(var(--success))]">✅</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <span className="font-mono text-[11px] text-foreground">6 actions · 2min 14sec · 0 erreur</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground/50 bg-secondary px-2.5 py-1 rounded-full">🧠 47 contextes</span>
              <span className="font-mono text-[10px] text-muted-foreground/50 bg-secondary px-2.5 py-1 rounded-full">📚 RAG 38Mo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OpenClawBanner;
