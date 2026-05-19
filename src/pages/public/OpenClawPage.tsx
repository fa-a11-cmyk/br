import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const Check = () => <span className="text-[hsl(var(--success))]">✅</span>;
const Cross = () => <span className="text-destructive">❌</span>;
const Dash = () => <span className="text-muted-foreground">—</span>;

const OpenClawPage = () => {
  const [showTable, setShowTable] = useState(false);
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const ref4 = useScrollReveal();
  const ref5 = useScrollReveal();
  const ref6 = useScrollReveal();
  const ref7 = useScrollReveal();

  const timelineSteps = [
    { icon: "⚡", bg: "bg-violet-d", title: "OpenClaw reçoit le rapport consolidé", desc: "Quand RapidoMeet termine l'analyse d'une réunion, il envoie un rapport structuré (JSON) à votre instance OpenClaw hébergée sur AWS par BraindCode. OpenClaw devient le point de coordination central : il sait quoi faire, pour qui, sur quel canal et dans quel ordre.", note: "Temps : < 1 seconde après la fin de l'analyse NLP" },
    { icon: "🧠", bg: "bg-fuchsia-d", title: "OpenClaw sélectionne les Skills adaptés", desc: "OpenClaw est piloté par des fichiers Markdown appelés \"Skills\" ou \"SOUL.md\". Chaque Skill définit un comportement spécifique : comment formater un rapport commercial, quand déclencher une alerte sentiment, comment enrichir un prospect dans le CRM.", note: "RapidoMeet déploie 4 à 8 Skills personnalisés selon votre plan." },
    { icon: "🔌", bg: "bg-violet-d", title: "OpenClaw appelle les serveurs MCP", desc: "Via le Model Context Protocol (MCP), OpenClaw appelle les outils connectés : RapidoCRM, Gmail, Google Calendar, Google Drive, WhatsApp, Telegram, N8N... Chaque appel MCP est structuré, typé et tracé. OpenClaw gère la file d'attente, les retries et les erreurs. Jusqu'à 12 appels MCP en parallèle.", note: "13 000+ serveurs MCP publics + vos MCPs personnalisés." },
    { icon: "🔁", bg: "bg-fuchsia-d", title: "OpenClaw + N8N : automatisation totale", desc: "OpenClaw s'intègre nativement avec N8N via des nœuds d'intégration dédiés. Weekly Digest le lundi, séquence email prospect J+1/J+7/J+14, alerte sentiment négatif immédiate, facture Stripe créée automatiquement après un deal signé.", note: "Scénarios N8N exécutés sur votre instance auto-hébergée." },
    { icon: "📈", bg: "bg-violet-d", title: "OpenClaw apprend au fur et à mesure", desc: "À chaque tâche exécutée, OpenClaw améliore sa compréhension : il mémorise vos projets et clients, apprend votre vocabulaire métier, affine ses décisions de routing MCP et optimise les formats de rapport selon vos feedbacks.", note: "Mémoire persistante stockée sur votre instance AWS." },
  ];

  const comparisonRows = [
    { label: "Open Source", oc: true, alt: false, none: null },
    { label: "Canaux messagerie", oc: "6+ (WA, TG…)", alt: "Limité", none: "0" },
    { label: "Intégration MCP (13 000+)", oc: true, alt: false, none: "0" },
    { label: "Intégration N8N native", oc: true, alt: false, none: "0" },
    { label: "Mémoire persistante", oc: true, alt: "Partielle", none: "0" },
    { label: "Self-hosted / AWS", oc: "AWS", alt: "Cloud seul.", none: "0" },
    { label: "Apprentissage continu", oc: true, alt: false, none: "0" },
    { label: "Sécurité Enterprise", oc: "Hardened", alt: "Variable", none: null },
    { label: "Hébergement BraindCode", oc: "99€/mois", alt: "N/A", none: "0" },
  ];

  const renderCell = (v: boolean | string | null) => {
    if (v === true) return <Check />;
    if (v === false) return <Cross />;
    if (v === null) return <Dash />;
    return <span className="font-mono text-[12px] text-foreground">{v}</span>;
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-[140px] pb-[100px] px-5 md:px-[60px] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(var(--violet))] opacity-[0.08] blur-[120px]" />
        <div className="relative max-w-[900px] mx-auto text-center">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-[hsl(var(--violet-l))] mb-6">
            ⚡ Propulsé par OpenClaw · Open-Source · 217 000+ étoiles GitHub
          </p>
          <h1 className="font-display font-extrabold tracking-[-2px] mb-6" style={{ fontSize: "clamp(44px, 7vw, 78px)", lineHeight: 1.05 }}>
            OpenClaw.
            <br />
            L'intelligence qui
            <br />
            <span className="text-gradient">ne s'arrête jamais.</span>
          </h1>
          <p className="font-body text-[18px] text-muted-foreground max-w-[580px] mx-auto leading-relaxed mb-10">
            OpenClaw est l'agent IA open-source le plus rapide du monde.
            BraindCode l'héberge, le sécurise et le connecte à RapidoMeet
            pour que vos réunions déclenchent des actions 24h/24, 7j/7.
          </p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-[40px]">
            {[
              { value: "217 000+", label: "Étoiles GitHub" },
              { value: "13 000+", label: "Serveurs MCP" },
              { value: "24/7", label: "Toujours actif" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-display font-extrabold text-[36px] tracking-[-1px] text-gradient">{s.value}</p>
                <p className="font-body text-[13px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            <Link to="/inscription" className="bg-gradient-primary text-white font-display font-bold text-sm py-3 px-7 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform">
              Essayer gratuitement →
            </Link>
            <a href="#tarifs" className="border border-[hsl(var(--violet))] text-[hsl(var(--violet-l))] font-body font-semibold text-sm py-3 px-7 rounded-[10px] hover:bg-violet-d transition-colors">
              Voir les tarifs
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 1 — QU'EST-CE QU'OPENCLAW ? */}
      <section ref={ref1} className="py-[80px] px-5 md:px-[60px]">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-[hsl(var(--violet-l))] mb-4">OpenClaw · La technologie</p>
          <h2 className="font-display font-extrabold text-foreground mb-10" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}>
            L'agent IA open-source
            <br />
            qui <span className="text-gradient">agit à votre place.</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="font-body text-[15px] text-muted-foreground leading-[1.8] space-y-4">
              <p>OpenClaw est un agent IA autonome open-source créé en novembre 2025 par Peter Steinberger. En quelques mois, il est devenu la plateforme d'agents IA à la croissance la plus rapide au monde avec plus de 217 000 étoiles sur GitHub.</p>
              <p>Contrairement aux assistants IA classiques qui répondent à vos questions, OpenClaw <strong className="text-foreground">agit</strong>. Il accède à vos emails, votre calendrier, votre CRM, vos plateformes de messagerie — et exécute des tâches complexes de manière autonome, 24 heures sur 24.</p>
              <p>OpenClaw utilise le Model Context Protocol (MCP) — le standard adopté par Anthropic, OpenAI et Google DeepMind — pour se connecter à plus de 13 000 outils et services différents.</p>
              <p>Dans RapidoMeet, OpenClaw est le moteur de distribution intelligent : il reçoit vos rapports de réunion et les distribue automatiquement sur WhatsApp, Telegram, Discord et par email — en moins de 3 minutes.</p>
            </div>
            {/* SVG Illustration */}
            <div className="flex justify-center">
              <svg width="400" height="400" viewBox="0 0 480 480" className="w-full max-w-[400px]">
                <defs>
                  <linearGradient id="ocg1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--fuchsia))" />
                    <stop offset="100%" stopColor="hsl(var(--violet))" />
                  </linearGradient>
                  <radialGradient id="ocGlow">
                    <stop offset="0%" stopColor="rgba(124,58,237,0.25)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
                <circle cx="240" cy="240" r="140" fill="url(#ocGlow)" />
                <circle cx="240" cy="240" r="52" fill="url(#ocg1)" opacity="0.95" />
                <text x="240" y="234" textAnchor="middle" fontSize="22" fill="white">⚡</text>
                <text x="240" y="256" textAnchor="middle" fontFamily="monospace" fontSize="10" fill="rgba(255,255,255,0.8)">OpenClaw</text>
                {[
                  { cx: 240, cy: 80, emoji: "💬", label: "WhatsApp", stroke: "hsl(var(--success))" },
                  { cx: 400, cy: 160, emoji: "📊", label: "CRM", stroke: "hsl(var(--violet))" },
                  { cx: 400, cy: 320, emoji: "🔁", label: "N8N", stroke: "hsl(var(--fuchsia))" },
                  { cx: 240, cy: 400, emoji: "✈️", label: "Telegram", stroke: "#60A5FA" },
                  { cx: 80, cy: 320, emoji: "📧", label: "Email", stroke: "#FBB55A" },
                  { cx: 80, cy: 160, emoji: "📅", label: "Agenda", stroke: "hsl(var(--success))" },
                ].map((n, i) => (
                  <g key={i}>
                    <line x1="240" y1="240" x2={n.cx} y2={n.cy} stroke="url(#ocg1)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
                    <circle cx={n.cx} cy={n.cy} r="32" fill="hsl(var(--dark-2))" stroke={n.stroke} strokeWidth="1.5" />
                    <text x={n.cx} y={n.cy + 2} textAnchor="middle" fontSize="18">{n.emoji}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — TIMELINE */}
      <section ref={ref2} className="py-[80px] px-5 md:px-[60px] bg-card">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display font-extrabold text-foreground mb-4 text-center" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}>
            OpenClaw dans RapidoMeet :
            <br />
            <span className="text-gradient">le chef d'orchestre de vos actions.</span>
          </h2>
          <div className="relative mt-12">
            <div className="absolute left-[28px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))]" />
            <div className="space-y-10">
              {timelineSteps.map((step, i) => (
                <div key={i} className="flex gap-5 relative">
                  <div className={`w-[56px] h-[56px] rounded-2xl ${step.bg} flex items-center justify-center text-2xl shrink-0 z-10`}>
                    {step.icon}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-display font-bold text-[17px] text-foreground mb-2">{step.title}</h3>
                    <p className="font-body text-[14px] text-muted-foreground leading-relaxed mb-2">{step.desc}</p>
                    <p className="font-mono text-[11px] text-[hsl(var(--violet-l))]">{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — COMPARISON TABLE */}
      <section ref={ref3} className="py-[80px] px-5 md:px-[60px]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display font-extrabold text-foreground mb-10 text-center" style={{ fontSize: "clamp(24px, 3vw, 38px)", lineHeight: 1.1 }}>
            Pourquoi OpenClaw et pas une autre solution ?
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 bg-secondary px-5 py-3">
              <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider">Critère</span>
              <span className="font-mono text-[10px] uppercase text-[hsl(var(--violet-l))] tracking-wider text-center">OpenClaw</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider text-center">Alternatives</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider text-center">Sans agent</span>
            </div>
            {comparisonRows.map((row, i) => (
              <div key={i} className={`grid grid-cols-4 px-5 py-3 ${i % 2 === 0 ? "" : "bg-secondary/50"} border-t border-border/30`}>
                <span className="font-body text-[13px] text-foreground">{row.label}</span>
                <span className="text-center">{renderCell(row.oc)}</span>
                <span className="text-center">{renderCell(row.alt)}</span>
                <span className="text-center">{renderCell(row.none)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — AWS HOSTING */}
      <section ref={ref4} className="py-[80px] px-5 md:px-[60px] bg-card">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="font-display font-extrabold text-foreground mb-3" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}>
            Votre instance OpenClaw,
            <br />
            <span className="text-gradient">sécurisée et gérée par BraindCode.</span>
          </h2>
          <p className="font-body text-muted-foreground mb-12 max-w-[580px] mx-auto text-[16px] leading-relaxed">
            OpenClaw est gratuit et open-source. Mais le déployer, le sécuriser et le maintenir demande expertise et infrastructure. BraindCode prend tout ça en charge.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: "☁️", title: "Hébergement AWS Premium", items: ["Isolation totale : votre instance, vos données", "Uptime garanti 99.9% (SLA contractuel)", "Auto-scaling selon votre volume", "Backup quotidien mémoire & Skills", "Monitoring 24/7 avec alertes"], note: "Données RGPD : stockées en France, jamais partagées." },
              { icon: "🔒", title: "Sécurité Enterprise", items: ["Binding localhost uniquement (CVE patchée)", "Interface Control UI désactivée", "Authentification par code d'appairage", "Scanner de Skills statique", "Audit log de toutes les actions", "Variables chiffrées (AWS Secrets Manager)", "Isolation réseau (VPC privé)"], note: "217 000+ étoiles → sécurité auditée en permanence." },
              { icon: "⚙️", title: "Configuration & MCPs", items: ["Installation et connexion à RapidoMeet", "Déploiement de vos Skills Markdown", "Configuration des MCPs connectés", "Intégration N8N", "Canaux de distribution (WA, TG, Email)", "Test complet de bout en bout"], note: "MCPs sur mesure à partir de 499€." },
            ].map(card => (
              <div key={card.title} className="bg-background border border-border rounded-2xl p-7 text-left">
                <span className="text-3xl">{card.icon}</span>
                <h3 className="font-display font-bold text-[17px] text-foreground mt-4 mb-4">{card.title}</h3>
                <ul className="space-y-2 mb-4">
                  {card.items.map(item => (
                    <li key={item} className="font-body text-[13px] text-muted-foreground flex items-start gap-2">
                      <span className="text-[hsl(var(--success))] shrink-0 mt-0.5">→</span> {item}
                    </li>
                  ))}
                </ul>
                <p className="font-mono text-[11px] text-[hsl(var(--violet-l))]">{card.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — LEARNING */}
      <section ref={ref5} className="py-[80px] px-5 md:px-[60px]">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="font-display font-extrabold text-foreground mb-10" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}>
            Un agent qui <span className="text-gradient">grandit avec votre entreprise.</span>
          </h2>
          {/* Learning curve */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-10 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground mb-4">Courbe d'apprentissage</p>
            <div className="space-y-3">
              {[
                { week: "Semaine 1", desc: "Apprentissage vocabulaire métier", pct: 20 },
                { week: "Semaine 2", desc: "Optimisation routing MCPs", pct: 40 },
                { week: "Semaine 4", desc: "Précision extraction +12%", pct: 60 },
                { week: "Semaine 8", desc: "Formats rapports affinés", pct: 80 },
                { week: "Semaine 12", desc: "Agent expert de votre contexte", pct: 100 },
              ].map(s => (
                <div key={s.week} className="flex items-center gap-4">
                  <span className="font-mono text-[11px] text-[hsl(var(--violet-l))] w-[90px] shrink-0">{s.week}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full transition-all" style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="font-body text-[12px] text-muted-foreground min-w-[180px]">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: "🧠", title: "Mémoire par projet et par client", desc: "OpenClaw mémorise chaque réunion : qui était présent, quelles décisions, quels prospects. La prochaine réunion bénéficie du contexte complet des précédentes." },
              { icon: "📚", title: "Base de connaissance enrichie (RAG)", desc: "Vos documents (glossaire, processus, clients) sont indexés dans le RAG de votre instance. Vos noms propres, codes projets et jargon métier sont reconnus avec précision croissante." },
              { icon: "⚡", title: "Skills affinés par le feedback", desc: "Chaque 👍/👎 sur un rapport améliore les Skills. BraindCode met à jour vos fichiers SOUL.md et les redéploie sans interruption. Votre agent s'améliore chaque semaine." },
              { icon: "📈", title: "Optimisation des workflows N8N", desc: "OpenClaw analyse les taux de succès de chaque scénario N8N et ajuste automatiquement les triggers, les délais et les conditions d'exécution." },
            ].map(card => (
              <div key={card.title} className="bg-card border border-border rounded-2xl p-6 text-left">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="font-display font-bold text-[15px] text-foreground mt-3 mb-2">{card.title}</h3>
                <p className="font-body text-[13px] text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — PRICING BREAKDOWN */}
      <section ref={ref6} id="tarifs" className="py-[80px] px-5 md:px-[60px] bg-card">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display font-extrabold text-foreground mb-10" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}>
            Les frais d'intégration OpenClaw
            <br />
            <span className="text-gradient">expliqués simplement.</span>
          </h2>
          <div className="bg-background border-[1.5px] border-[hsl(var(--violet))] rounded-[20px] p-8 md:p-10 text-left">
            <h3 className="font-display font-bold text-lg text-foreground mb-6">Les 3 composantes du coût OpenClaw</h3>
            {[
              { num: "1️⃣", title: "Abonnement RapidoMeet", desc: "Votre plan mensuel (Découverte 49€ / Medium 99€ / Premium 149€). Inclut l'interface, les transcriptions, les Skills de base et l'accès à votre instance." },
              { num: "2️⃣", title: "Frais d'hébergement OpenClaw — 99€/mois", desc: "Instance AWS ECS Fargate dédiée (région Paris). Uptime 99.9% · Backup quotidien · Monitoring 24/7 · Sécurité hardened · Mises à jour automatiques · Support configuration inclus." },
              { num: "3️⃣", title: "Coûts API (variables)", desc: "Payés directement à Anthropic (Claude API). Estimés : ~10-30€/mois pour une utilisation normale. 1 réunion 45 min ≈ 0,08-0,15€ en tokens Claude. Cache Anthropic activé." },
            ].map((item, i) => (
              <div key={i} className={`py-5 ${i < 2 ? "border-b border-border" : ""}`}>
                <p className="font-display font-bold text-[15px] text-foreground mb-1">{item.num} {item.title}</p>
                <p className="font-body text-[13px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
            <div className="mt-6 bg-secondary rounded-xl p-5">
              <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground mb-3">Total mensuel estimé</p>
              {[
                { plan: "Plan Découverte", total: "~158-163€/mois" },
                { plan: "Plan Medium", total: "~213-223€/mois" },
                { plan: "Plan Premium", total: "~268-278€/mois" },
              ].map(p => (
                <div key={p.plan} className="flex justify-between items-center py-1.5">
                  <span className="font-body text-[13px] text-muted-foreground">{p.plan}</span>
                  <span className="font-display font-bold text-[15px] text-foreground">{p.total}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Warning note */}
          <div className="mt-5 bg-[rgba(245,158,11,0.08)] border border-[hsl(var(--warning))] rounded-[10px] px-5 py-4 text-left">
            <p className="font-body text-[13px] text-foreground">
              <span className="font-display font-bold">⚠️ Transparence totale</span> — Les frais d'hébergement (99€/mois) et les coûts API sont séparés de votre abonnement car ils correspondent à des coûts d'infrastructure réels. BraindCode ne prend aucune marge — vous payez l'infrastructure au prix coûtant.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 — CUSTOM DEV */}
      <section ref={ref7} className="py-[80px] px-5 md:px-[60px]">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display font-extrabold text-foreground mb-10" style={{ fontSize: "clamp(26px, 3.5vw, 38px)", lineHeight: 1.1 }}>
            Besoin d'un agent <span className="text-gradient">ultra-personnalisé ?</span>
          </h2>
          <div className="bg-card border border-border rounded-[20px] p-8 md:p-10 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-primary" />
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-[hsl(var(--violet-l))] mb-4">À partir de 499€ · Création sur mesure avec BraindCode</p>
            <p className="font-body text-[15px] text-muted-foreground leading-relaxed mb-6">
              BraindCode développe pour vous des scénarios N8N et des serveurs MCP entièrement personnalisés.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-display font-bold text-sm text-foreground mb-3">Ce qui est inclus :</h4>
                <ul className="space-y-2">
                  {["Audit de vos processus métier", "Conception du workflow sur mesure", "Développement N8N (code, tests, docs)", "Développement serveur MCP (Node.js/TS)", "Déploiement dans votre instance", "Formation de votre équipe (2h)", "Support 30 jours post-livraison"].map(item => (
                    <li key={item} className="font-body text-[13px] text-muted-foreground flex items-start gap-2">
                      <span className="text-primary shrink-0">✦</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-foreground mb-3">Exemples de réalisations :</h4>
                <ul className="space-y-2">
                  {[
                    { label: "MCP Salesforce sur mesure", price: "699€" },
                    { label: "Scénario N8N \"Invoice auto + Qonto\"", price: "499€" },
                    { label: "MCP interne (logiciel métier)", price: "à partir de 899€" },
                    { label: "Pack complet 3 MCPs + 5 scénarios", price: "2 499€" },
                  ].map(ex => (
                    <li key={ex.label} className="font-body text-[13px] text-muted-foreground flex justify-between gap-2">
                      <span>→ {ex.label}</span>
                      <span className="font-mono text-foreground shrink-0">{ex.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/demo" className="bg-gradient-primary text-white font-display font-bold text-sm py-3 px-7 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform">
                Demander un devis gratuit →
              </Link>
              <button className="border border-border text-muted-foreground font-body text-sm py-3 px-7 rounded-[10px] hover:text-foreground hover:border-muted-foreground transition-colors">
                Voir les exemples
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OpenClawPage;
