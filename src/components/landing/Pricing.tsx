import { useState } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const Check = () => <span className="text-[hsl(var(--success))] mr-2">✓</span>;
const Cross = () => <span className="text-muted-foreground/40 mr-2">✗</span>;

const Pricing = () => {
  const ref = useScrollReveal();
  const [annual, setAnnual] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: "DÉCOUVERTE",
      price: annual ? 39 : 49,
      desc: "Idéal pour les indépendants et les petites équipes qui démarrent avec l'automatisation post-réunion.",
      border: "border-border",
      cta: "Démarrer en Découverte →",
      ctaStyle: "bg-secondary border border-border text-muted-foreground hover:border-primary hover:text-foreground",
      badge: null,
      features: [
        { t: "10 transcriptions / mois", ok: true },
        { t: "Whisper + Deepgram (FR/EN)", ok: true },
        { t: "Rapport WhatsApp + Telegram + Email", ok: true },
        { t: "4 templates N8N (N1-N4)", ok: true },
        { t: "1 serveur MCP personnalisé", ok: true },
        { t: "Instance OpenClaw AWS dédiée", ok: true },
        { t: "Skills de base", ok: true },
        { t: "Support email", ok: true },
      ],
      extra: "99€/mois hébergement · ~10-15€ API",
      total: "~158-163€/mois",
    },
    {
      name: "MEDIUM",
      price: annual ? 79 : 99,
      desc: "Pour les équipes qui veulent automatiser l'essentiel de leurs processus post-réunion.",
      border: "border-[1.5px] border-primary",
      cta: "Démarrer en Medium →",
      ctaStyle: "bg-gradient-primary text-white shadow-fuchsia hover:-translate-y-0.5",
      badge: "⭐ Le plus populaire",
      features: [
        { t: "50 transcriptions / mois", ok: true },
        { t: "FR / EN / AR (3 langues)", ok: true },
        { t: "Tous les canaux (WA, TG, Discord, Email)", ok: true },
        { t: "8 templates N8N (N1-N8)", ok: true },
        { t: "2 serveurs MCP personnalisés", ok: true },
        { t: "RAG Entreprise (50 docs)", ok: true },
        { t: "Mémoire contextuelle avancée", ok: true },
        { t: "Email builder + PDF builder", ok: true },
        { t: "Scoring prospect auto (1-10)", ok: true },
        { t: "Support email + chat (24h)", ok: true },
      ],
      extra: "99€/mois hébergement · ~15-25€ API",
      total: "~213-223€/mois",
    },
    {
      name: "PREMIUM",
      price: annual ? 119 : 149,
      desc: "Pour les entreprises qui veulent la suite RapidoSoftware complète + l'agent IA.",
      border: "border-[1.5px] border-[hsl(var(--violet))]",
      cta: "Démarrer en Premium →",
      ctaStyle: "bg-secondary border border-[hsl(var(--violet))] text-[hsl(var(--violet-l))] hover:bg-violet-d",
      badge: null,
      features: [
        { t: "Transcriptions illimitées", ok: true },
        { t: "Suite RapidoSoftware (RH + CMS + CRM)", ok: true },
        { t: "Skills illimités + 2 sur mesure/an", ok: true },
        { t: "RAG Entreprise illimité", ok: true },
        { t: "Multi-workspace (5 équipes)", ok: true },
        { t: "Membres illimités", ok: true },
        { t: "Support prioritaire (4h)", ok: true },
        { t: "Onboarding dédié (2h)", ok: true },
        { t: "Accès anticipé nouvelles fonctionnalités", ok: true },
      ],
      extra: "99€/mois hébergement · ~20-30€ API",
      total: "~268-278€/mois",
    },
  ];

  const faqs = [
    { q: "Pourquoi des frais d'hébergement OpenClaw séparés (99€) ?", a: "OpenClaw est open-source mais nécessite une infrastructure dédiée : instance AWS ECS Fargate, sécurité hardened, monitoring, backups. BraindCode ne prend aucune marge — vous payez l'infra au prix coûtant." },
    { q: "Les coûts API Anthropic sont-ils imprévisibles ?", a: "Non. Pour 1-3 réunions/jour (30-60 min), la facture se stabilise entre 10 et 30€/mois. Le cache Anthropic est activé. Vous pouvez configurer un budget max mensuel." },
    { q: "Puis-je changer de plan à tout moment ?", a: "Oui. Upgrade immédiat. Downgrade à la fin du cycle. Les frais d'hébergement OpenClaw restent à 99€/mois quel que soit le plan." },
    { q: "Que se passe-t-il si je dépasse mon quota ?", a: "Découverte : transcriptions supplémentaires à 3€. Medium : 1,50€. Premium : illimité, aucune surprise." },
    { q: "Le plan Découverte inclut-il une vraie instance OpenClaw ?", a: "Oui. Chaque plan inclut une instance AWS dédiée, sécurisée et isolée. La différence porte sur les quotas et fonctionnalités." },
    { q: "Puis-je tester avant de payer ?", a: "Oui. 14 jours d'essai gratuit sur le plan Medium. Instance temporaire créée. Aucune carte bancaire requise." },
  ];

  return (
    <section id="tarifs" className="bg-card py-[100px] px-5 md:px-[60px]">
      <div ref={ref} className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">Tarifs transparents</p>
        <h2 className="font-display font-extrabold text-foreground mb-4" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}>
          Un abonnement.
          <br />
          Une instance OpenClaw.
          <br />
          <span className="text-gradient">Des actions illimitées.</span>
        </h2>
        <p className="font-body text-muted-foreground mb-4 max-w-[620px]" style={{ fontSize: "clamp(15px, 2vw, 17px)", lineHeight: 1.65 }}>
          Tous les plans incluent votre instance OpenClaw hébergée sur AWS par BraindCode.
          Tarifs hors frais d'hébergement (99€/mois) et coûts API Anthropic.
        </p>
        <div className="inline-flex items-center gap-1.5 bg-[rgba(16,185,129,0.08)] border border-[hsl(var(--success))]/30 rounded-full px-4 py-1.5 mb-8">
          <span className="font-mono text-[11px] text-[hsl(var(--success))]">🇫🇷 Données en France · AWS Paris eu-west-3 · RGPD</span>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-secondary border border-border rounded-full p-1 flex">
            <button onClick={() => setAnnual(false)} className={`font-body text-sm px-5 py-2 rounded-full transition-colors ${!annual ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Mensuel</button>
            <button onClick={() => setAnnual(true)} className={`font-body text-sm px-5 py-2 rounded-full transition-colors ${annual ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Annuel — 2 mois offerts</button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mb-8">
          {plans.map((plan, i) => (
            <div key={plan.name} className={`bg-background ${plan.border} rounded-[20px] p-8 relative ${i === 1 ? "md:scale-[1.02] shadow-lg" : "shadow-sm"}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary font-mono text-[10px] uppercase py-1 px-4 rounded-full text-white tracking-wider whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              <p className="font-display font-bold text-sm text-muted-foreground uppercase tracking-[1px] mb-4">{plan.name}</p>
              <p className={`font-display font-extrabold text-5xl tracking-[-2px] mb-1 ${i === 1 ? "text-gradient" : "text-foreground"}`}>{plan.price}€</p>
              <p className="font-body text-[13px] text-muted-foreground mb-4">/ mois{annual ? " (facturé annuellement)" : ""}</p>
              <p className="font-body text-sm text-muted-foreground mb-6">{plan.desc}</p>
              <ul className="font-body text-sm space-y-2.5 mb-6 text-muted-foreground">
                {plan.features.map(f => (
                  <li key={f.t}>{f.ok ? <Check /> : <Cross />}{f.t}</li>
                ))}
              </ul>
              <div className="border-t border-border pt-4 mb-6">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Frais additionnels</p>
                <p className="font-mono text-[11px] text-muted-foreground">{plan.extra}</p>
                <p className="font-display font-bold text-sm text-foreground mt-2">Total estimé : {plan.total}</p>
              </div>
              <Link to="/inscription" className={`block w-full font-display font-bold text-sm py-3 rounded-[10px] transition-all text-center ${plan.ctaStyle}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Custom dev card */}
        <div className="bg-gradient-primary rounded-[20px] p-8 md:p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="font-display font-bold text-xl text-white mb-2">🛠 Scénarios N8N et MCPs sur mesure</p>
              <p className="font-body text-[15px] text-white/80">À partir de 499€ · En partenariat avec BraindCode</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/demo" className="bg-white text-black font-display font-bold text-sm py-3 px-6 rounded-[10px] hover:bg-white/90 transition-colors">
                Demander un devis →
              </Link>
              <Link to="/openclaw" className="border border-white/30 text-white font-body text-sm py-3 px-6 rounded-[10px] hover:bg-white/10 transition-colors">
                En savoir plus
              </Link>
            </div>
          </div>
        </div>

        {/* Comparison toggle */}
        <button onClick={() => setShowTable(!showTable)} className="w-full bg-secondary border border-border rounded-xl px-6 py-4 text-left mb-4 hover:bg-muted/50 transition-colors">
          <span className="font-display font-bold text-sm text-foreground">{showTable ? "▼" : "▶"} Voir le tableau comparatif complet</span>
        </button>
        {showTable && (
          <div className="bg-background border border-border rounded-2xl overflow-x-auto mb-8">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary">
                  <th className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-3">Fonctionnalité</th>
                  <th className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-3 text-center">Découverte</th>
                  <th className="font-mono text-[10px] uppercase tracking-wider text-primary px-5 py-3 text-center">Medium</th>
                  <th className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--violet-l))] px-5 py-3 text-center">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: "TRANSCRIPTION" },
                  { label: "Transcriptions / mois", d: "10", m: "50", p: "Illimitées" },
                  { label: "Langues", d: "FR/EN", m: "FR/EN/AR", p: "FR/EN/AR" },
                  { label: "Durée max", d: "2h", m: "4h", p: "Illimitée" },
                  { cat: "OPENCLAW & AGENT" },
                  { label: "Instance AWS", d: "✅", m: "✅", p: "✅" },
                  { label: "Hébergement", d: "99€/mois", m: "99€/mois", p: "99€/mois" },
                  { label: "Canaux", d: "WA+TG+Email", m: "Tous (6)", p: "Tous (6)" },
                  { label: "Mémoire", d: "Basique", m: "Avancée", p: "Illimitée" },
                  { label: "RAG Entreprise", d: "❌", m: "50 docs", p: "Illimité" },
                  { label: "Skills actifs", d: "3", m: "8", p: "Illimités" },
                  { cat: "SCÉNARIOS N8N" },
                  { label: "Templates inclus", d: "4", m: "8", p: "8 + custom" },
                  { label: "Scénarios personnalisés", d: "Sur devis", m: "Sur devis", p: "Sur devis" },
                  { cat: "SERVEURS MCP" },
                  { label: "MCPs inclus", d: "1", m: "2", p: "2 + custom" },
                  { label: "MCPs personnalisés", d: "Sur devis", m: "Sur devis", p: "Inclus (2/an)" },
                  { cat: "SUITE RAPIDOSOFTWARE" },
                  { label: "RapidoCRM", d: "❌", m: "❌", p: "✅" },
                  { label: "RapidoRH", d: "❌", m: "❌", p: "✅" },
                  { label: "RapidoCMS", d: "❌", m: "❌", p: "✅" },
                  { cat: "SUPPORT" },
                  { label: "Support", d: "Email", m: "Email+Chat", p: "Prioritaire" },
                  { label: "Temps de réponse", d: "48h", m: "24h", p: "4h" },
                  { label: "Onboarding", d: "Auto", m: "Guide", p: "Dédié 2h" },
                  { label: "SLA uptime", d: "99%", m: "99.5%", p: "99.9%" },
                ].map((row, i) => {
                  if ('cat' in row && row.cat) {
                    return (
                      <tr key={i} className="bg-muted/30">
                        <td colSpan={4} className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground px-5 py-2 font-bold">{row.cat}</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={i} className="border-t border-border/30">
                      <td className="font-body text-[13px] text-foreground px-5 py-2.5">{row.label}</td>
                      <td className="font-mono text-[12px] text-muted-foreground px-5 py-2.5 text-center">{row.d}</td>
                      <td className="font-mono text-[12px] text-foreground px-5 py-2.5 text-center">{row.m}</td>
                      <td className="font-mono text-[12px] text-[hsl(var(--violet-l))] px-5 py-2.5 text-center">{row.p}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FAQ */}
        <div className="space-y-2 mb-8">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-background border border-border rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                <span className="font-body text-sm text-foreground font-medium">{faq.q}</span>
                <span className="text-muted-foreground shrink-0 ml-4">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className="font-body text-[13px] text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="bg-secondary border border-border rounded-[12px] py-4 px-6 flex flex-wrap justify-center gap-6 md:gap-10 text-center">
          {["🛡 Satisfait ou remboursé 30 jours", "📊 Données en France (AWS Paris)", "🔒 RGPD compliant", "🇫🇷 Support en français", "⚡ Instance active en 24h"].map(g => (
            <span key={g} className="font-body text-sm text-muted-foreground">{g}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
