import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHead from "@/components/PageHead";

const categories = [
  { id: "all", label: "Tous", icon: "" },
  { id: "commercial", label: "💼 Commercial", icon: "💼" },
  { id: "tech", label: "💻 Tech", icon: "💻" },
  { id: "rh", label: "👥 RH", icon: "👥" },
  { id: "marketing", label: "📣 Marketing", icon: "📣" },
  { id: "management", label: "🏛 Management", icon: "🏛" },
];

interface TimelineStep {
  title: string;
  details: string[];
  time: string;
}

interface UseCase {
  id: number;
  category: string;
  icon: string;
  title: string;
  context: string;
  steps: TimelineStep[];
  result: string;
}

const useCases: UseCase[] = [
  {
    id: 1, category: "commercial", icon: "🎯", title: "Appel de découverte prospect",
    context: "Vous présentez RapidoMeet à un nouveau prospect. Pendant l'appel, il mentionne son équipe, ses outils actuels, ses douleurs et son budget approximatif.",
    steps: [
      { title: "Transcription & identification", details: ["Transcrit l'appel · Identifie Thomas Dupont (CEO, StartupX)", "Détecte : budget ~5 000€, équipe 8 personnes, utilise HubSpot", "→ Skill commercial activé"], time: "~30 sec" },
      { title: "Création contact CRM automatique", details: ["MCP RapidoCRM → create_contact", "Fiche créée : Thomas Dupont · CEO · StartupX", "Score prospect : 8/10 · Pipeline : Stade \"Découverte\""], time: "+45 sec" },
      { title: "Enrichissement du prospect", details: ["MCP LinkedIn → get_profile", "MCP Firecrawl → scrape site web", "Secteur : Tech SaaS · Taille : 8 salariés · Fondée 2022"], time: "+60 sec" },
      { title: "Email de suivi personnalisé", details: ["MCP Gmail → send_email", "Objet : \"Suite à notre échange — RapidoMeet pour StartupX\"", "Envoyé automatiquement 10 min après l'appel"], time: "+10 min" },
      { title: "Rapport WhatsApp", details: ["🎯 Score : 8/10 · 👤 Thomas Dupont (CEO)", "💰 Budget : ~5 000€/an · 🔧 Douleur : HubSpot trop cher", "✅ Contact CRM créé · Email envoyé"], time: "+3 min" },
      { title: "Séquence follow-up planifiée", details: ["J+1 : \"Avez-vous pu consulter notre proposition ?\"", "J+7 : \"Retour sur notre échange ?\"", "J+14 : \"Dernière relance\""], time: "Auto" },
    ],
    result: "1 contact CRM créé · Score 8/10 · Email de suivi envoyé · Séquence 3 emails planifiée · Rapport WhatsApp reçu · Zéro saisie manuelle.",
  },
  {
    id: 2, category: "commercial", icon: "🤝", title: "Réunion de closing commercial",
    context: "Thomas Dupont revalide après 3 semaines d'échanges : \"OK on y va, on commence avec le plan Pro.\"",
    steps: [
      { title: "Détection de validation d'achat", details: ["Skill commercial → \"accord commercial\" détecté", "Mots-clés : \"on y va\", \"on commence\"", "Confiance : 94%"], time: "Instant" },
      { title: "Création facture Stripe", details: ["MCP Stripe → create_invoice", "Client : Thomas Dupont · 79€/mois · Plan Pro"], time: "+30 sec" },
      { title: "Pipeline CRM → Stade \"Gagné\"", details: ["MCP RapidoCRM → update_pipeline_stage", "Opportunité passée en \"Gagné\" · 79€/mois"], time: "+45 sec" },
      { title: "Onboarding planifié", details: ["MCP Google Calendar → create_event", "\"Session onboarding StartupX\" · Dans 3 jours"], time: "+60 sec" },
      { title: "Alerte WhatsApp équipe", details: ["🎉 DEAL SIGNÉ · Thomas Dupont · StartupX", "💰 79€/mois · Plan Pro", "📄 Facture envoyée · Onboarding planifié J+3"], time: "+2 min" },
    ],
    result: "Deal signé · Facture Stripe envoyée · CRM mis à jour · Onboarding planifié · Équipe notifiée.",
  },
  {
    id: 3, category: "commercial", icon: "🎤", title: "Réunion de présentation pitch",
    context: "Vous pitchez devant 3 décideurs d'une PME de 50 personnes. Questions techniques, objections sécurité, intérêt pour la démo.",
    steps: [
      { title: "Analyse des objections", details: ["3 objections détectées et classifiées", "→ Skill commercial → objections_list créée"], time: "+30 sec" },
      { title: "3 contacts CRM créés", details: ["Sarah M. (DRH) · Jean-Luc T. (DSI) · Marie P. (CEO)", "Tous reliés à l'opportunité \"PME 50 pers. · 390€/mois\""], time: "+45 sec" },
      { title: "Email récapitulatif sur mesure", details: ["Répond aux 3 objections point par point", "Inclut : FAQ sécurité RGPD + guide intégration"], time: "+5 min" },
      { title: "Démo planifiée", details: ["\"On se revoit pour une démo ?\" → Google Calendar", "Event créé avec lien Meet + agenda pré-rempli"], time: "+60 sec" },
      { title: "Rapport PDF envoyé", details: ["Envoyé aux 3 participants · Charte BraindCode"], time: "+10 min" },
    ],
    result: "3 contacts créés · Objections adressées · Démo planifiée · Rapport PDF envoyé.",
  },
  {
    id: 4, category: "tech", icon: "⚡", title: "Daily standup équipe dev",
    context: "Daily 15 min avec Ahmed, Souhail, Raja. Chacun dit ce qu'il a fait, ce qu'il fait, ses blockers.",
    steps: [
      { title: "Extraction des tâches par personne", details: ["Ahmed : PR Docker done → Fix Redis en cours", "Souhail : Bloqué sur OpenClaw v2.4 → demande doc", "Raja : 2 PRs reviewées → Tests E2E démarrés"], time: "+30 sec" },
      { title: "Issues GitHub créées", details: ["MCP GitHub → create_issue pour chaque tâche/blocker", "Labels : bug, testing, urgent selon contexte"], time: "+45 sec" },
      { title: "Sprint board mis à jour", details: ["MCP Jira → update_issue", "Tickets passés en \"In Progress\" ou \"Done\""], time: "+60 sec" },
      { title: "Résumé Slack envoyé", details: ["Canal #dev-team : résumé 5 lignes", "✅ Ahmed : PR Docker done · 🔨 Fix Redis"], time: "+2 min" },
      { title: "Alert blocker à Michael", details: ["WhatsApp : ⚠️ Souhail bloqué sur OpenClaw v2.4", "→ Action requise"], time: "Immédiat" },
    ],
    result: "Issues GitHub créées · Sprint board à jour · Équipe notifiée · Blockers remontés.",
  },
  {
    id: 5, category: "tech", icon: "🏗", title: "Code review & décisions d'architecture",
    context: "Réunion tech 1h. Débat architecture : Redis vs PostgreSQL. Refacto MCP N8N. 3 bugs critiques identifiés.",
    steps: [
      { title: "Extraction décisions architecture", details: ["Redis pour mémoire courte durée, PostgreSQL pour historique", "→ Décision archivée avec contexte + timestamp"], time: "+30 sec" },
      { title: "3 bugs → Issues GitHub", details: ["Critical : Memory leak worker transcription", "High : Race condition MCP Calendar", "Medium : Timeout Deepgram > 2 min"], time: "+45 sec" },
      { title: "Page Confluence créée", details: ["ADR : Redis + PostgreSQL", "Contexte, alternatives rejetées, conséquences"], time: "+60 sec" },
      { title: "PR créée pour refacto", details: ["MCP GitHub → create_pr", "\"refactor: MCP N8N v2 avec gestion retry\""], time: "+2 min" },
    ],
    result: "Décisions archivées · 3 bugs trackés · ADR Confluence · PR refacto ouverte.",
  },
  {
    id: 6, category: "tech", icon: "📋", title: "Sprint planning",
    context: "Sprint planning 2h. Estimation des stories, engagement vélocité, dépendances et risques.",
    steps: [
      { title: "Stories engagées extraites", details: ["8 stories listées avec points et assignation"], time: "+30 sec" },
      { title: "Sprint Jira créé", details: ["Sprint 13 · 24/03 → 07/04 · Vélocité : 34 pts"], time: "+45 sec" },
      { title: "Risques identifiés", details: ["\"Dépendance OpenClaw v2.4 non livré\"", "\"Ahmed absent jeu-ven semaine 2\""], time: "+60 sec" },
      { title: "Résumé sprint envoyé", details: ["Email + Slack : stories, vélocité, dates"], time: "+3 min" },
      { title: "Événements récurrents créés", details: ["Daily 9h30 · Revue vendredi 16h · Rétro S+2"], time: "+5 min" },
    ],
    result: "Sprint Jira configuré · 8 stories trackées · Risques flaggés · Rituels planifiés.",
  },
  {
    id: 7, category: "rh", icon: "🎓", title: "Entretien de recrutement",
    context: "Entretien avec Amine Alibi pour le PFE. 45 minutes. Questions techniques et validation.",
    steps: [
      { title: "Analyse entretien IA", details: ["Points forts : Node.js avancé, Docker maîtrisé", "À vérifier : Expérience LLM/MCP limitée", "Score : 8.5/10 → Recommandé"], time: "+30 sec" },
      { title: "Fiche candidat RapidoRH", details: ["Amine Alibi · PFE Bac+5 · Node.js/TypeScript"], time: "+45 sec" },
      { title: "Feedback structuré", details: ["Email candidat : prochaines étapes", "Email interne : grille de notation"], time: "+3 min" },
      { title: "Convention de stage préparée", details: ["Template rempli avec données détectées"], time: "+5 min" },
      { title: "Calendrier onboarding créé", details: ["Semaine 1 : Setup env · Semaine 2 : Formation MCP", "4 semaines planifiées automatiquement"], time: "+10 min" },
    ],
    result: "Candidat validé · Fiche RH créée · Convention préparée · Onboarding planifié.",
  },
  {
    id: 8, category: "rh", icon: "💬", title: "One-on-one manager / collaborateur",
    context: "1-on-1 hebdo Michael / Lilia (30 min). Avancement CDC RapidoRH, blockers, objectifs semaine suivante.",
    steps: [
      { title: "Engagements extraits", details: ["\"Je livre le CDC RapidoRH v2 vendredi\"", "→ Tâche créée · Assignée Lilia · Deadline vendredi"], time: "+30 sec" },
      { title: "Dépendances identifiées", details: ["\"J'ai besoin des maquettes de Raja\"", "→ Notification Raja envoyée"], time: "+45 sec" },
      { title: "Objectifs semaine N+1 créés", details: ["3 objectifs extraits dans RapidoRH"], time: "+60 sec" },
      { title: "Note 1-on-1 archivée", details: ["Google Drive → dossier \"1-on-1 Lilia F.\"", "Format : Réalisé / En cours / Blockers"], time: "+3 min" },
    ],
    result: "Engagements trackés · Dépendances notifiées · Note archivée · Objectifs définis.",
  },
  {
    id: 9, category: "management", icon: "📊", title: "Réunion d'équipe hebdomadaire",
    context: "Weekly BraindCode · 1h. Tour de table, priorités, décisions produit, annonces.",
    steps: [
      { title: "Compte-rendu structuré", details: ["Format : Présents · Décisions · Tâches · Annonces"], time: "+30 sec" },
      { title: "Weekly Digest envoyé", details: ["Email à toute l'équipe : résumé + tâches par personne"], time: "+5 min" },
      { title: "Tâches assignées", details: ["Chaque membre reçoit ses tâches par email + WhatsApp"], time: "+3 min" },
      { title: "Archive Google Drive", details: ["Dossier \"Weekly BraindCode\" → CR 18/03/2026.pdf"], time: "+10 min" },
    ],
    result: "CR automatique · Tâches distribuées · Archive organisée · Prochaine réunion planifiée.",
  },
  {
    id: 10, category: "marketing", icon: "📣", title: "Brief campagne marketing",
    context: "Brief avec l'agence pour la campagne VivaTech. Budget, angles créatifs, planning, KPIs.",
    steps: [
      { title: "Brief structuré extrait", details: ["Objectif · Budget · Cible · Messages clés · KPIs"], time: "+30 sec" },
      { title: "Brief PDF généré", details: ["PDF charte BraindCode → envoyé agence + interne", "Google Drive → \"Campagne VivaTech 2026\""], time: "+5 min" },
      { title: "Tâches par département", details: ["Marketing : Valider visuels avant 25/03", "Dev : Landing page ready pour 10/06", "Direction : Budget en attente signature"], time: "+3 min" },
      { title: "Rappels jalons planifiés", details: ["Google Calendar → rappels J-7 de chaque deadline"], time: "+5 min" },
    ],
    result: "Brief PDF distribué · Tâches créées · Deadlines dans l'agenda · Tracking configuré.",
  },
  {
    id: 11, category: "marketing", icon: "🚀", title: "Réunion de lancement produit",
    context: "Go/No-Go pour le lancement de RapidoMeet. Décision finale : GO pour VivaTech le 17 juin.",
    steps: [
      { title: "Détection décision Go/No-Go", details: ["\"C'est validé, on lance à VivaTech\"", "→ Décision majeure flaggée"], time: "Instant" },
      { title: "Plan de lancement généré", details: ["8 tâches critiques avec deadlines rétro-planifiées"], time: "+2 min" },
      { title: "Notifications équipe", details: ["WhatsApp + Email : \"🚀 GO POUR VIVATECH\"", "Chaque membre reçoit ses responsabilités"], time: "+3 min" },
      { title: "Weekly launch check planifié", details: ["Chaque lundi : bilan d'avancement vers le 17 juin"], time: "+5 min" },
    ],
    result: "GO validé · Plan de lancement créé · Équipe mobilisée · Suivi hebdo configuré.",
  },
  {
    id: 12, category: "management", icon: "🤝", title: "Réunion de suivi client",
    context: "Suivi mensuel avec le client Djiby (Camicourse). Avancement, points bloquants, validation phase 2.",
    steps: [
      { title: "Analyse satisfaction", details: ["Sentiment : 78% positif", "Points négatifs : module livreur encore lent"], time: "+30 sec" },
      { title: "Nouvelles demandes loguées", details: ["3 features requests dans RapidoCRM", "Reliées à l'opportunité \"Camicourse Phase 3\""], time: "+45 sec" },
      { title: "Phase 2 validée", details: ["Log CRM + email de confirmation", "Facture Stripe déclenchée"], time: "+60 sec" },
      { title: "Rapport client envoyé", details: ["PDF : avancement · validations · prochaines étapes"], time: "+10 min" },
    ],
    result: "Satisfaction analysée · Features loguées · Facture envoyée · Rapport client distribué.",
  },
  {
    id: 13, category: "management", icon: "🏁", title: "Réunion de kick-off projet",
    context: "Kick-off avec un nouveau client. Présentation équipes, cadrage projet, planning, accès outils.",
    steps: [
      { title: "Fiche projet CRM créée", details: ["Contacts clients créés · Pipeline \"Projet actif\""], time: "+30 sec" },
      { title: "Checklist onboarding générée", details: ["12 étapes · Assignées aux bonnes personnes"], time: "+45 sec" },
      { title: "Accès organisés", details: ["Google Drive → dossier client créé + partagé", "Email aux clients avec les accès"], time: "+3 min" },
      { title: "Premier jalon planifié", details: ["\"Livraison maquettes dans 2 semaines\"", "→ Google Calendar avec participants"], time: "+5 min" },
      { title: "Rapport kick-off PDF", details: ["Envoyé au client en < 30 min après la réunion"], time: "+15 min" },
    ],
    result: "Projet créé · Onboarding lancé · Accès distribués · Premier jalon planifié.",
  },
];

const actionCategories = [
  {
    title: "CRM & VENTE", icon: "📊", borderColor: "border-l-rm-fuchsia",
    actions: ["Créer un contact prospect", "Créer une opportunité pipeline", "Mettre à jour le stade commercial", "Logger l'activité réunion", "Scorer le prospect (1-10)", "Enrichir via LinkedIn + Firecrawl", "Déclencher séquence nurturing"],
  },
  {
    title: "EMAIL & COMMUNICATION", icon: "📧", borderColor: "border-l-rm-violet",
    actions: ["Envoyer email de suivi personnalisé", "Email récapitulatif participants", "Séquence J+1 / J+7 / J+14", "Rapport PDF en pièce jointe", "Répondre aux objections par email"],
  },
  {
    title: "AGENDA & PLANNING", icon: "📅", borderColor: "border-l-rm-success",
    actions: ["Créer événement depuis une décision", "Planifier la prochaine réunion", "Rappels pour chaque deadline", "Réunions récurrentes (daily, weekly)", "Détection des disponibilités"],
  },
  {
    title: "GESTION DE PROJET", icon: "✅", borderColor: "border-l-yellow-500",
    actions: ["Créer issue GitHub avec label", "Créer ticket Jira avec estimation", "Page Confluence / Notion auto", "PR GitHub avec assignation", "ADR (Architecture Decision Record)"],
  },
  {
    title: "NOTIFICATIONS", icon: "💬", borderColor: "border-l-rm-fuchsia",
    actions: ["Rapport WhatsApp < 300 mots", "Broadcast Slack canal de projet", "Alerte sentiment négatif", "Alert blocker immédiate", "Notification \"Deal signé\""],
  },
  {
    title: "FINANCE", icon: "💳", borderColor: "border-l-rm-success",
    actions: ["Créer facture Stripe", "Lien de paiement automatique", "Export comptable Pennylane/Qonto", "Récapitulatif financier mensuel"],
  },
  {
    title: "STOCKAGE & DOCUMENTS", icon: "📁", borderColor: "border-l-rm-violet",
    actions: ["PDF rapport avec charte graphique", "Sauvegarde transcription Google Drive", "Archive automatique par projet/date", "Brief marketing PDF structuré"],
  },
];

function TimelineCard({ step, index }: { step: TimelineStep; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative pl-8 pb-6 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5"}`} style={{ transitionDelay: `${index * 80}ms` }}>
      <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center text-[10px] font-mono text-white font-bold">{index + 1}</div>
      <div className="absolute left-[9px] top-6 bottom-0 w-[2px] bg-gradient-to-b from-rm-fuchsia/40 to-rm-violet/20" />
      <h4 className="font-display font-bold text-sm text-foreground mb-1.5">{step.title}</h4>
      <div className="space-y-0.5">
        {step.details.map((d, i) => (
          <p key={i} className="font-body text-xs text-muted-foreground leading-relaxed">{d}</p>
        ))}
      </div>
      <span className="font-mono text-[10px] text-rm-fuchsia mt-1.5 inline-block">{step.time}</span>
    </div>
  );
}

function UseCaseCard({ useCase }: { useCase: UseCase }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="bg-card border border-border rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: "rgba(233,30,140,0.12)" }}>{useCase.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-extrabold text-lg md:text-xl text-foreground">{useCase.title}</h3>
          <p className="font-body text-sm text-muted-foreground mt-1 leading-relaxed">{useCase.context}</p>
        </div>
      </div>

      <button onClick={() => setExpanded(!expanded)} className="font-mono text-xs text-rm-fuchsia hover:text-rm-fuchsia-l transition-colors mb-4">
        {expanded ? "Réduire ▲" : "Voir les déclenchements automatiques ▼"}
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-muted-foreground mb-4">Ce que RapidoMeet déclenche :</p>
          <div className="space-y-0">
            {useCase.steps.map((step, i) => (
              <TimelineCard key={i} step={step} index={i} />
            ))}
          </div>
          <div className="mt-4 border-l-[3px] border-l-rm-success rounded-r-xl bg-secondary p-4">
            <p className="font-body text-sm text-foreground">
              <span className="text-rm-success font-bold">✅ En 3 minutes :</span> {useCase.result}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

const CasDUsage = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const filtered = activeFilter === "all" ? useCases : useCases.filter((u) => u.category === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      <PageHead title="Cas d'usage" description="Découvrez comment RapidoMeet transforme vos réunions commerciales, tech, RH et marketing en actions concrètes." path="/cas-usage" />
      <Navbar />

      {/* Hero */}
      <section className="pt-[140px] pb-16 px-5 md:px-[60px] text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, hsl(var(--fuchsia)), transparent 70%)" }} />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-rm-fuchsia mb-4 relative">Cas d'usage · RapidoMeet</p>
        <h1 className="font-display font-extrabold text-foreground leading-[1.05] tracking-tight mb-5 relative" style={{ fontSize: "clamp(40px, 6vw, 72px)", letterSpacing: "-2px" }}>
          Chaque réunion a sa recette.
          <br />
          <span className="text-gradient">RapidoMeet l'exécute.</span>
        </h1>
        <p className="font-body text-lg text-muted-foreground max-w-[580px] mx-auto relative">
          Découvrez comment RapidoMeet transforme chaque type de réunion en une séquence d'actions automatiques adaptées à votre contexte.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-10 relative">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`font-mono text-[11px] px-5 py-2 rounded-full border transition-all cursor-pointer ${
                activeFilter === cat.id
                  ? "bg-gradient-primary text-white border-transparent"
                  : "bg-secondary text-muted-foreground border-border hover:border-primary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-5 md:px-[60px] pb-20 max-w-[900px] mx-auto">
        <div className="space-y-6">
          {filtered.map((uc) => (
            <UseCaseCard key={uc.id} useCase={uc} />
          ))}
        </div>
      </section>

      {/* Actions Table */}
      <section className="bg-rm-dark-1 py-20 px-5 md:px-[60px]">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display font-extrabold text-2xl md:text-4xl text-foreground text-center mb-3 tracking-tight">
            Toutes les actions que RapidoMeet
            <br />
            <span className="text-gradient">peut déclencher pour vous.</span>
          </h2>
          <p className="text-center font-body text-muted-foreground mb-12">Plus de 50 actions automatiques, classées par catégorie.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {actionCategories.map((cat) => (
              <div key={cat.title} className={`bg-card border border-border rounded-2xl p-6 border-l-[3px] ${cat.borderColor}`}>
                <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground mb-4">{cat.icon} {cat.title}</p>
                <ul className="space-y-2">
                  {cat.actions.map((a) => (
                    <li key={a} className="font-body text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-rm-fuchsia mt-0.5">✦</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-rm-dark-1 pb-20 px-5 md:px-[60px] text-center">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-foreground mb-4 tracking-tight">
          Votre <span className="text-gradient">cas d'usage</span> n'est pas dans la liste ?
        </h2>
        <p className="font-body text-muted-foreground max-w-[500px] mx-auto mb-8">
          RapidoMeet s'adapte à votre secteur, votre équipe et vos outils grâce aux Skills Markdown personnalisables. Sans coder.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/inscription" className="bg-gradient-primary text-white font-display font-bold text-sm py-3 px-7 rounded-xl shadow-fuchsia hover:-translate-y-0.5 transition-transform">
            Essayer gratuitement →
          </Link>
          <a href="mailto:hello@rapidomeet.io" className="border border-border text-muted-foreground hover:text-foreground font-body text-sm py-3 px-7 rounded-xl transition-colors">
            Nous décrire votre cas d'usage
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CasDUsage;
