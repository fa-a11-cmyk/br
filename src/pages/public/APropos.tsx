import { Link } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import avatarMichael from "@/assets/avatar-michael.png";
import avatarFares from "@/assets/avatar-fares.png";
import avatarHaroun from "@/assets/avatar-haroun.png";
import braindcodeOffice from "@/assets/braindcode-office.jpg";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHead from "@/components/PageHead";

const S3 = "https://rapido-software.s3.eu-west-3.amazonaws.com/rapidosoftware/bibliotheque/";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { setStarted(true); obs.disconnect(); } }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    let curr = 0;
    const inc = target / 50;
    const t = setInterval(() => {
      curr += inc;
      if (curr >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(curr));
    }, 30);
    return () => clearInterval(t);
  }, [started, target]);
  return <span ref={ref}>{val.toLocaleString("fr-FR")}{suffix}</span>;
}

const team = [
  {
    name: "Michael Kebail-Ali", role: "CEO & Chef de Projet",
    photo: avatarMichael,
    desc: "Chef de projet et architecte de l'écosystème BraindCode. Pilote la vision produit, la stratégie et la coordination des équipes depuis 2021.",
    tags: ["Chef de Projet", "IA & SaaS", "Product", "Stratégie"],
  },
  {
    name: "Fares Khiari", role: "Co-fondateur · DevOps & AWS",
    photo: avatarFares,
    desc: "Responsable DevOps, hébergement et infrastructure AWS. Gère les déploiements, la scalabilité et la fiabilité de la stack BraindCode.",
    tags: ["DevOps", "AWS", "Hébergement", "CI/CD"],
  },
  {
    name: "Haroun Khmiri", role: "Développeur · MCP & N8N",
    photo: avatarHaroun,
    desc: "Réalise le projet RapidoMeet, développe les MCP (Model Context Protocol) et construit les scénarios N8N d'automatisation post-réunion.",
    tags: ["MCP", "N8N", "Backend", "Automatisation"],
  },
];

const rapidoProducts = [
  { name: "RapidoCRM", desc: "CRM intelligent pour équipes commerciales francophones.", logo: S3 + "CGuynobcv7eF4yFZLvARq1GU0KLqA5bVlcfYxJgx.png", link: "https://rapidosoftware.com/solutions/crm", app: "https://crm.rapidosoftware.com" },
  { name: "RapidoCMS", desc: "Gestionnaire de contenu headless pour sites et apps.", logo: S3 + "Xzu3D6aqmouslq55LYhOR5iAPnmKxqoQJ6UuvG0P.png", link: "https://rapidosoftware.com/solutions/cms", app: "https://cms.rapidosoftware.com" },
  { name: "RapidoRH", desc: "Module RH complet : paie, congés, entretiens, formation.", logo: S3 + "VOlevQVkp7sfjObvcYfRtCMsqKb1oW4ujuo1vt9a.png", link: "https://rapidosoftware.com/solutions/rh", app: "https://rh.rapidosoftware.com" },
];

const partners = [
  { src: S3 + "JMzZgY9lbAiOa2SfQXpiO0AajMMTaCkR0S6QynP4.jpg", alt: "French Tech Tremplin" },
  { src: S3 + "wLXRcv6E1GJlg0mxLlL8s5xvy5qrAt7hPNbgAIa0.png", alt: "France 2030" },
  { src: S3 + "Eqy95dSJ9bu4zdWBADzVYEMakLGi0TvYLSmIcgDB.jpg", alt: "L'Escalator — Banque des Territoires" },
  { src: S3 + "XZy3c9z4VdXOiIc8WPHkIabqxPqL69saPsI6YD88.png", alt: "BPI France" },
];

const APropos = () => (
  <div className="min-h-screen bg-background">
    <PageHead title="À propos" description="Découvrez l'équipe BraindCode derrière RapidoMeet, notre mission et notre vision pour transformer vos réunions en actions automatiques." path="/a-propos" />
    <Navbar />

    {/* Hero */}
    <section className="pt-[140px] pb-10 px-5 md:px-[60px] text-center">
      <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">L'équipe derrière RapidoMeet</p>
      <h1 className="font-display font-extrabold text-foreground leading-[1.05] tracking-tight mb-5" style={{ fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-2px" }}>
        Construit par <span className="text-gradient">BraindCode</span>,
        <br />pour les équipes qui bougent vite.
      </h1>
      <p className="font-body text-lg text-muted-foreground max-w-[600px] mx-auto mb-10">
        BraindCode est un studio IA & SaaS français basé à Aubervilliers. Nous construisons des outils qui automatisent l'invisible — les tâches répétitives qui ralentissent les équipes ambitieuses.
      </p>
      <img
        src={braindcodeOffice}
        alt="BraindCode Studio"
        className="max-w-[1000px] mx-auto h-[300px] md:h-[360px] rounded-2xl object-cover w-full"
      />
    </section>

    {/* Stats */}
    <section className="px-5 md:px-[60px] py-16">
      <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { val: 2021, label: "Fondée · Aubervilliers", suffix: "" },
          { val: 135000, label: "Financés (BPI, French Tech)", suffix: "€+" },
          { val: 50, label: "Produits SaaS interconnectés", suffix: "+" },
          { val: 8, label: "Personnes + stagiaires PFE", suffix: "" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="font-display font-extrabold text-3xl md:text-4xl text-gradient mb-2">
              {s.val > 100 ? <CountUp target={s.val} suffix={s.suffix} /> : <>{s.val}{s.suffix}</>}
            </p>
            <p className="font-body text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>

    {/* About */}
    <section className="px-5 md:px-[60px] py-16">
      <div className="max-w-[1000px] mx-auto grid md:grid-cols-[1fr_280px] gap-12 items-start">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-foreground mb-6">Qui sommes-nous</h2>
          <div className="font-body text-base text-muted-foreground leading-[1.8] space-y-4">
            <p>BraindCode est un studio français spécialisé dans le développement de solutions IA et SaaS depuis 2021.</p>
            <p>Notre mission est simple : construire des logiciels qui pensent et agissent à la place de vos équipes, pour qu'elles puissent se concentrer sur ce qui compte vraiment.</p>
            <p>Nous opérons sous 2 entités :<br />• BraindCode / CO CUISINAGE (SIREN 910767193) — Aubervilliers, France<br />• PrendsTaPart SARL — Le Bardo, Tunis (filiale R&D)</p>
          </div>
        </div>
        <div className="rounded-2xl shadow-2xl h-[200px] md:h-[280px] w-full bg-gradient-to-br from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="10" fill="white" opacity="0.9"/><circle cx="18" cy="18" r="5" fill="white" opacity="0.5"/><path d="M8 18 Q8 12 13 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" /><path d="M28 18 Q28 24 23 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" /></svg>
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="px-5 md:px-[60px] py-16">
      <div className="max-w-[1000px] mx-auto">
        <h2 className="font-display font-extrabold text-2xl text-foreground text-center mb-12">L'équipe fondatrice</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {team.map((m) => (
            <div key={m.name} className="bg-card border border-border rounded-2xl p-8 text-center">
              <img src={m.photo} alt={m.name} loading="lazy" className="w-[120px] h-[120px] rounded-full object-cover border-[3px] border-primary mx-auto mb-4" />
              <h3 className="font-display font-extrabold text-lg text-foreground">{m.name}</h3>
              <p className="font-mono text-[11px] uppercase tracking-[1px] text-primary mt-1">{m.role}</p>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mt-3">{m.desc}</p>
              <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                {m.tags.map((t) => (
                  <span key={t} className="bg-secondary text-muted-foreground font-mono text-[10px] px-2.5 py-1 rounded">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Ecosystem */}
    <section className="bg-card py-20 px-5 md:px-[60px]">
      <div className="max-w-[1000px] mx-auto text-center">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-foreground mb-3">
          La suite <span className="text-gradient">RapidoSoftware</span>
        </h2>
        <p className="font-body text-muted-foreground mb-3">RapidoMeet fait partie d'un écosystème de 50+ outils SaaS interconnectés via OpenClaw.</p>
        <a href="https://rapidosoftware.com" target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-primary hover:text-primary/80 transition-colors inline-block mb-10">
          Découvrir RapidoSoftware → rapidosoftware.com ↗
        </a>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {rapidoProducts.map((p) => (
            <a key={p.name} href={p.link} target="_blank" rel="noopener noreferrer" className="bg-background border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group">
              <img src={p.logo} alt={p.name} loading="lazy" className="w-14 h-14 rounded-xl object-contain mb-4" />
              <h3 className="font-display font-bold text-base text-foreground">{p.name}</h3>
              <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
              <p className="font-mono text-[11px] text-primary mt-3 group-hover:underline">{new URL(p.app).hostname} ↗</p>
            </a>
          ))}
          <div className="bg-background border border-border rounded-2xl p-6 border-primary/30">
            <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="6" fill="white" opacity="0.9"/><circle cx="18" cy="18" r="3" fill="white"/></svg>
            </div>
            <h3 className="font-display font-bold text-base text-foreground">RapidoMeet <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono ml-1">Nouveau ✨</span></h3>
            <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">Agent IA de transcription et orchestration post-réunion.</p>
            <p className="font-mono text-[11px] text-primary mt-3">rapidomeet.io</p>
          </div>
        </div>

        {/* SVG ecosystem illustration removed per visual guidelines */}
      </div>
    </section>

    {/* Partners */}
    <section className="py-16 px-5 md:px-[60px]">
      <div className="max-w-[1000px] mx-auto text-center">
        <h2 className="font-display font-extrabold text-2xl text-foreground mb-3">Ils nous ont fait confiance</h2>
        <p className="font-body text-muted-foreground mb-10">BraindCode est financé et soutenu par les institutions françaises de l'innovation.</p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-10">
          {partners.map((p) => (
            <img key={p.alt} src={p.src} alt={p.alt} loading="lazy" className="h-12 md:h-14 object-contain opacity-70 hover:opacity-100 transition-opacity grayscale-[30%] hover:grayscale-0" />
          ))}
          <span className="font-mono text-sm text-muted-foreground font-medium">Initiative France</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 max-w-[600px] mx-auto text-left">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground mb-4">💰 Financements obtenus</p>
          <div className="space-y-2 font-mono text-sm">
            {[
              ["Initiative France", "Prêt d'honneur"],
              ["French Tech Tremplin", "Programme d'accélération"],
              ["BPI France Innovation", "Aide à l'innovation"],
              ["Crédit d'Impôt CII", "FoodEatUpAI approuvé"],
              ["Prêt bancaire", "Financement complémentaire"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground">{val}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4">
            <span className="font-display font-bold text-lg text-gradient">Total levé : ~135 000€</span>
          </div>
        </div>
      </div>
    </section>

    {/* VivaTech */}
    <section id="vivatech" className="py-16 px-5 md:px-[60px] bg-card">
      <div className="max-w-[800px] mx-auto">
        <div className="bg-background border-[1.5px] border-primary rounded-2xl p-8 md:p-10">
          <p className="text-2xl mb-2">🎪</p>
          <h3 className="font-display font-extrabold text-xl text-foreground mb-1">Nous retrouver à VivaTech 2026</h3>
          <p className="font-body text-sm text-muted-foreground mb-6">VivaTech Paris · 17 – 20 juin 2026 · Porte de Versailles</p>
          <ul className="space-y-2 mb-8">
            {["Demo live RapidoMeet (transcription + rapport en 3 min)", "OpenClaw — orchestration 200 agents + 230 Skills", "StartupForge OS — plateforme d'incubation IA", "La suite RapidoSoftware complète"].map((item) => (
              <li key={item} className="font-body text-sm text-muted-foreground flex gap-2"><span className="text-primary">✦</span>{item}</li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/demo" className="bg-gradient-primary text-white font-display font-bold text-sm py-3 px-7 rounded-xl shadow-fuchsia text-center">Réserver une démo sur place →</Link>
            <a href="https://vivatechnology.com" target="_blank" rel="noopener noreferrer" className="border border-border text-muted-foreground hover:text-foreground font-body text-sm py-3 px-7 rounded-xl transition-colors text-center">S'inscrire à VivaTech ↗</a>
          </div>
        </div>

        <div className="mt-8 bg-background border border-border rounded-xl p-6">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground mb-4">📅 À venir</p>
          <div className="space-y-2 font-body text-sm">
            <div className="flex gap-4"><span className="text-muted-foreground font-mono text-xs w-[140px] shrink-0">15-16 avril 2026</span><span className="text-foreground">Go Entrepreneurs Paris — Porte de Versailles</span></div>
            <div className="flex gap-4"><span className="text-muted-foreground font-mono text-xs w-[140px] shrink-0">17-20 juin 2026</span><span className="text-foreground">VivaTech Paris — Porte de Versailles</span></div>
          </div>
        </div>
      </div>
    </section>

    {/* Contact */}
    <section className="py-16 px-5 md:px-[60px]">
      <div className="max-w-[600px] mx-auto">
        <h2 className="font-display font-extrabold text-xl text-foreground mb-6">Contact</h2>
        <div className="space-y-5 font-body text-sm text-muted-foreground">
          <div><p className="text-foreground font-medium mb-1">📍 Adresse</p><p>BraindCode / CO CUISINAGE<br />Aubervilliers, Île-de-France, France<br />SIREN : 910 767 193</p></div>
          <div><p className="text-foreground font-medium mb-1">📧 Email</p><a href="mailto:hello@braindcode.com" className="hover:text-primary">hello@braindcode.com</a><br /><a href="mailto:support@rapidomeet.io" className="hover:text-primary">support@rapidomeet.io</a></div>
          <div><p className="text-foreground font-medium mb-1">🌐 Sites web</p>
            {["braindcode.com", "rapidosoftware.com", "rapidomeet.io", "foodeatup.com"].map((s) => (
              <a key={s} href={`https://${s}`} target="_blank" rel="noopener noreferrer" className="block hover:text-primary">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* CTA Final */}
    <section className="bg-card py-20 px-5 md:px-[60px] text-center">
      <h2 className="font-display font-extrabold text-2xl md:text-3xl text-foreground mb-4">
        Rejoignez l'écosystème <span className="text-gradient">BraindCode</span>.
      </h2>
      <p className="font-body text-muted-foreground max-w-[500px] mx-auto mb-8">
        Que vous soyez une PME, une startup ou une équipe commerciale, RapidoMeet et la suite RapidoSoftware sont faits pour vous.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/inscription" className="bg-gradient-primary text-white font-display font-bold text-sm py-3.5 px-8 rounded-xl shadow-fuchsia hover:-translate-y-0.5 transition-transform">
          Essayer RapidoMeet →
        </Link>
        <a href="https://rapidosoftware.com" target="_blank" rel="noopener noreferrer" className="border border-[hsl(var(--violet))] text-[hsl(var(--violet-l))] hover:text-[hsl(var(--violet))] font-body text-sm py-3 px-7 rounded-xl transition-colors">
          Découvrir RapidoSoftware ↗
        </a>
        <a href="https://braindcode.com" target="_blank" rel="noopener noreferrer" className="border border-border text-muted-foreground hover:text-foreground font-body text-sm py-3 px-7 rounded-xl transition-colors">
          Contacter BraindCode ↗
        </a>
      </div>
    </section>

    <Footer />
  </div>
);

export default APropos;
