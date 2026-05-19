import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, HelpCircle, Zap, Shield, CreditCard, Code2, Users, Globe, Brain, Plug } from "lucide-react";
import PageHead from "@/components/PageHead";


interface FaqItem { q: string; a: string }
interface FaqCategory { id: string; label: string; icon: React.ElementType; items: FaqItem[] }

const faqData: FaqCategory[] = [
  {
    id: "general", label: "Général", icon: HelpCircle,
    items: [
      { q: "Qu'est-ce que RapidoMeet ?", a: "RapidoMeet est un agent IA qui transcrit vos réunions en temps réel, extrait les tâches, décisions et prospects, puis distribue automatiquement les comptes-rendus sur WhatsApp, Slack, email, etc." },
      { q: "Comment fonctionne RapidoMeet ?", a: "RapidoMeet utilise un pipeline IA : 1) Capture audio (bot visioconférence ou import fichier), 2) Transcription STT avec diarisation, 3) Analyse NLP (tâches, décisions, sentiment), 4) Distribution automatique via OpenClaw." },
      { q: "En quoi RapidoMeet est différent d'Otter.ai ?", a: "Contrairement à Otter.ai, RapidoMeet ne se limite pas à la transcription. Il orchestre les actions post-réunion : CRM, tâches, emails, workflows N8N. C'est un agent IA, pas un simple transcripteur." },
      { q: "RapidoMeet fonctionne-t-il en français ?", a: "Oui, RapidoMeet est optimisé pour le français, l'anglais et l'arabe. La détection de langue est automatique si vous ne la spécifiez pas." },
      { q: "Puis-je utiliser RapidoMeet gratuitement ?", a: "Oui, le plan Starter est gratuit et inclut 3 réunions/mois, 30 min max par réunion, et les rapports WhatsApp." },
      { q: "Quels formats audio sont supportés ?", a: "MP3, WAV, M4A, FLAC, OGG, WebM. Taille max : 500 Mo. Durée min : 30 secondes." },
      { q: "RapidoMeet remplace-t-il un assistant humain ?", a: "Pour la prise de notes et le suivi des tâches, oui. Pour les décisions stratégiques et la gestion d'équipe, non. RapidoMeet automatise le travail post-réunion répétitif." },
      { q: "Quelle est la précision de la transcription ?", a: "En conditions optimales (bon micro, peu de bruit), la précision dépasse 95%. En conditions réelles, elle est généralement entre 85% et 95%." },
      { q: "Combien de langues sont supportées ?", a: "Actuellement français, anglais et arabe. D'autres langues (espagnol, allemand, portugais) sont prévues pour 2026." },
      { q: "RapidoMeet fonctionne-t-il hors connexion ?", a: "Non, RapidoMeet nécessite une connexion internet pour la transcription et l'analyse IA. Vous pouvez cependant importer des fichiers audio enregistrés hors ligne." },
    ],
  },
  {
    id: "fonctionnalites", label: "Fonctionnalités", icon: Zap,
    items: [
      { q: "Comment RapidoMeet extrait-il les tâches ?", a: "Le moteur NLP analyse la transcription pour détecter les engagements verbaux : 'Michael s'en occupe', 'à faire avant jeudi', etc. Il identifie l'assigné, la deadline et la priorité." },
      { q: "Qu'est-ce que la diarisation ?", a: "La diarisation identifie qui parle à quel moment. RapidoMeet attribue chaque segment de la transcription au bon locuteur." },
      { q: "Comment fonctionne le scoring prospect ?", a: "L'IA analyse les signaux d'intérêt : questions posées, engagement dans la conversation, mots-clés commerciaux. Le score va de 1 (froid) à 10 (très chaud)." },
      { q: "Qu'est-ce qu'OpenClaw ?", a: "OpenClaw est le moteur d'orchestration IA de RapidoMeet. Il décide quelles actions exécuter après l'analyse d'une réunion : envoyer le rapport, créer des tâches, notifier le CRM, etc." },
      { q: "Qu'est-ce qu'un Skill OpenClaw ?", a: "Un Skill est un fichier Markdown qui définit le comportement de l'agent pour un type de réunion. Vous pouvez créer des Skills personnalisés pour adapter l'IA à votre métier." },
      { q: "RapidoMeet peut-il créer des factures ?", a: "Pas directement, mais via les workflows N8N, vous pouvez déclencher la création de factures dans Stripe, Pennylane ou votre outil de facturation quand un closing est détecté." },
      { q: "La transcription est-elle disponible en temps réel ?", a: "Oui, avec le plan Medium ou Premium. Le streaming WebSocket affiche les mots au fur et à mesure avec identification du locuteur." },
      { q: "Puis-je personnaliser les rapports ?", a: "Oui, via le PDF Builder et l'Email Builder dans l'app. Vous pouvez intégrer votre logo, vos couleurs et votre charte graphique." },
      { q: "Comment fonctionne l'analyse de sentiment ?", a: "L'IA évalue le ton émotionnel de chaque intervention (positif, neutre, négatif) et calcule un score global de 0 à 100 pour la réunion." },
      { q: "RapidoMeet peut-il gérer des réunions de plus de 2 heures ?", a: "Oui. Le plan Medium supporte 2h max, le plan Premium jusqu'à 4h. Au-delà, contactez-nous pour un plan Enterprise." },
    ],
  },
  {
    id: "integrations", label: "Intégrations", icon: Plug,
    items: [
      { q: "Quelles plateformes de visioconférence sont supportées ?", a: "Google Meet, Microsoft Teams, et Zoom. Le bot rejoint automatiquement vos réunions si vous connectez votre calendrier." },
      { q: "RapidoMeet s'intègre-t-il avec Slack ?", a: "Oui. Les rapports peuvent être envoyés dans un channel Slack. Vous pouvez aussi recevoir des notifications pour les tâches et les prospects." },
      { q: "Comment connecter mon CRM ?", a: "Via les workflows N8N ou l'API. RapidoCRM, HubSpot, Salesforce et Pipedrive sont supportés nativement." },
      { q: "RapidoMeet fonctionne-t-il avec Notion ?", a: "Oui, via le workflow N3 (Action Items Tracker). Les tâches extraites sont automatiquement créées dans votre database Notion." },
      { q: "Puis-je recevoir les rapports par email ?", a: "Oui, les rapports PDF ou HTML peuvent être envoyés par email aux participants ou à une liste de destinataires." },
      { q: "RapidoMeet supporte-t-il WhatsApp Business ?", a: "Oui, WhatsApp et WhatsApp Business fonctionnent de la même manière." },
      { q: "Comment fonctionne l'intégration N8N ?", a: "Connectez votre instance N8N (cloud ou self-hosted) à RapidoMeet. 4 templates de workflows sont inclus, et vous pouvez créer des workflows sur mesure." },
      { q: "Puis-je utiliser Zapier au lieu de N8N ?", a: "Pas encore nativement, mais vous pouvez utiliser les webhooks de RapidoMeet pour connecter Zapier manuellement." },
      { q: "L'intégration Google Drive est-elle incluse ?", a: "Oui, les transcriptions et rapports peuvent être sauvegardés automatiquement dans votre Google Drive." },
      { q: "RapidoMeet supporte-t-il Jira ?", a: "Oui, via le workflow N3. Les tâches extraites sont créées comme issues Jira avec assigné, deadline et priorité." },
    ],
  },
  {
    id: "securite", label: "Sécurité & Confidentialité", icon: Shield,
    items: [
      { q: "Mes données sont-elles chiffrées ?", a: "Oui. Chiffrement AES-256 au repos et TLS 1.3 en transit. Les clés sont gérées par un HSM dédié." },
      { q: "Où sont hébergées mes données ?", a: "En Europe (France, région eu-west-3). Nous sommes conformes au RGPD." },
      { q: "RapidoMeet est-il conforme au RGPD ?", a: "Oui. Nous sommes DPO-ready avec un registre de traitement à jour. Vous pouvez demander la suppression de vos données à tout moment." },
      { q: "Les transcriptions sont-elles utilisées pour entraîner l'IA ?", a: "Non. Vos données ne sont jamais utilisées pour l'entraînement. Elles sont exclusivement utilisées pour fournir le service." },
      { q: "Combien de temps les données sont-elles conservées ?", a: "90 jours par défaut. Configurable jusqu'à 365 jours en Premium. Vous pouvez supprimer manuellement à tout moment." },
      { q: "Comment supprimer toutes mes données ?", a: "Dans Configuration → Mon compte → 'Supprimer mon compte et mes données'. Irréversible sous 30 jours." },
      { q: "RapidoMeet a-t-il des certifications de sécurité ?", a: "SOC 2 Type II en cours. ISO 27001 prévu pour 2027. Pentest annuel par un tiers indépendant." },
      { q: "Comment sont gérées les clés API ?", a: "Les clés sont hashées en base. Vous pouvez les révoquer à tout moment dans /app/api-keys. Les clés sandbox (rm_test_) n'accèdent jamais aux données de production." },
    ],
  },
  {
    id: "tarifs", label: "Tarifs & Facturation", icon: CreditCard,
    items: [
      { q: "Quels sont les plans disponibles ?", a: "Starter (gratuit, 3 réunions/mois), Medium (29€/mois, 30 réunions), Premium (79€/mois, illimité). Tous les plans incluent WhatsApp, email et Slack." },
      { q: "Y a-t-il un essai gratuit ?", a: "Oui, le plan Starter est gratuit sans limite de temps. Vous pouvez aussi tester le plan Premium pendant 14 jours." },
      { q: "Puis-je changer de plan à tout moment ?", a: "Oui, les upgrades sont immédiats et les downgrades prennent effet au prochain cycle de facturation." },
      { q: "Quels moyens de paiement acceptez-vous ?", a: "Carte bancaire (Visa, Mastercard), SEPA, et virement bancaire pour les plans Enterprise." },
      { q: "Proposez-vous des réductions annuelles ?", a: "Oui, -20% sur le paiement annuel. Medium : 278€/an au lieu de 348€. Premium : 758€/an au lieu de 948€." },
      { q: "Que se passe-t-il si je dépasse mon quota ?", a: "Vous recevez une alerte à 80% du quota. Au-delà, les nouvelles réunions sont en file d'attente jusqu'au prochain cycle ou un upgrade." },
      { q: "Puis-je obtenir une facture ?", a: "Oui, les factures sont générées automatiquement et disponibles dans /app/billing. Export Pennylane disponible." },
      { q: "Y a-t-il une offre pour les startups ?", a: "Oui, le programme 'RapidoMeet for Startups' offre le plan Premium gratuit pendant 6 mois pour les startups éligibles." },
    ],
  },
  {
    id: "api", label: "API & Développeurs", icon: Code2,
    items: [
      { q: "Comment obtenir une clé API ?", a: "Créez un compte RapidoMeet, puis allez dans /app/api-keys. Vous pouvez créer des clés de production (rm_live_) et de test (rm_test_)." },
      { q: "Y a-t-il un SDK JavaScript ?", a: "Oui : npm install @rapidomeet/sdk. Documentation complète sur /docs." },
      { q: "Y a-t-il un SDK Python ?", a: "Oui, depuis mars 2026 : pip install rapidomeet." },
      { q: "Quelle est la limite de requêtes API ?", a: "120 requêtes/minute/clé API. Les headers de réponse indiquent le quota restant." },
      { q: "L'API supporte-t-elle le streaming ?", a: "Oui, via WebSocket pour la transcription en temps réel. Voir /docs#streaming." },
      { q: "Comment tester l'API sans frais ?", a: "Utilisez l'environnement Sandbox avec une clé rm_test_. Les transcriptions sont simulées et instantanées." },
      { q: "Existe-t-il un playground API ?", a: "Oui, sur /docs/playground. Testez tous les endpoints directement depuis votre navigateur." },
      { q: "Comment vérifier la signature des webhooks ?", a: "Utilisez HMAC-SHA256 avec votre webhook secret. Voir /docs#webhooks-guide pour le code de vérification." },
      { q: "L'API est-elle RESTful ?", a: "Oui, API REST avec pagination cursor-based, filtres et tri. Spécification OpenAPI 3.1.0 disponible." },
      { q: "Puis-je utiliser GraphQL ?", a: "Pas encore. L'API est exclusivement REST pour le moment. GraphQL est sur la roadmap 2027." },
    ],
  },
  {
    id: "equipe", label: "Équipe & Collaboration", icon: Users,
    items: [
      { q: "Combien de membres par workspace ?", a: "Starter : 1, Medium : 5, Premium : illimité. Chaque membre peut avoir des rôles différents." },
      { q: "Puis-je partager un rapport avec quelqu'un qui n'a pas de compte ?", a: "Oui, via les liens publics (partage en lecture seule avec un token unique)." },
      { q: "Comment gérer les permissions ?", a: "Les rôles sont : Admin (tout), Manager (réunions + rapports), Membre (voir seulement). Configurables dans /app/workspace." },
      { q: "Puis-je avoir plusieurs workspaces ?", a: "Oui, en plan Premium. Utile pour séparer les équipes ou les clients." },
      { q: "Les membres reçoivent-ils tous les rapports ?", a: "Par défaut, seuls les participants de la réunion reçoivent le rapport. Vous pouvez ajouter des destinataires supplémentaires." },
    ],
  },
  {
    id: "technique", label: "Technique & Dépannage", icon: Brain,
    items: [
      { q: "Le bot ne rejoint pas ma réunion", a: "Vérifiez : 1) Plan Medium+ requis, 2) Calendrier connecté, 3) Réunion ≥ 15 min, 4) Bot pas dans la liste noire." },
      { q: "La transcription est de mauvaise qualité", a: "Améliorez : 1) Utilisez un bon micro, 2) Réduisez le bruit de fond, 3) Ajoutez du vocabulaire dans le glossaire métier." },
      { q: "Le rapport n'arrive pas sur WhatsApp", a: "Vérifiez : 1) WhatsApp connecté (Configuration → Connexions), 2) Numéro au format international, 3) Bot pas bloqué." },
      { q: "Le workflow N8N ne se déclenche pas", a: "Vérifiez : 1) N8N connecté, 2) Workflow actif, 3) Webhook URL accessible, 4) Événement correct configuré." },
      { q: "Comment améliorer la précision STT ?", a: "1) Ajoutez votre vocabulaire métier dans le glossaire, 2) Utilisez un bon micro, 3) Spécifiez la langue au lieu de 'auto', 4) Indiquez le nombre de locuteurs." },
      { q: "Puis-je ré-analyser une réunion ?", a: "Oui, dans /app/reunions → détail → 'Ré-analyser'. Utile après avoir mis à jour votre glossaire." },
      { q: "Pourquoi mon fichier audio est refusé ?", a: "Vérifiez : format supporté (MP3/WAV/M4A/FLAC), taille < 500 Mo, durée ≥ 30 secondes, voix détectable." },
      { q: "Comment contacter le support ?", a: "Email : support@rapidomeet.io. Chat in-app dans /app/aide. Temps de réponse : < 4h en jours ouvrés." },
    ],
  },
];

// Generate Schema.org FAQPage JSON-LD
const generateFAQSchema = () => {
  const allQuestions = faqData.flatMap((cat) => cat.items);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allQuestions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
};

const FAQPage = () => {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>("general");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = faqData.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return item.q.toLowerCase().includes(s) || item.a.toLowerCase().includes(s);
    }),
  })).filter((cat) => cat.items.length > 0);

  const totalQuestions = faqData.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-background font-body">
      <PageHead title="FAQ" description="Réponses aux questions fréquentes sur RapidoMeet : fonctionnalités, tarifs, sécurité, intégrations et API." path="/faq" />
      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema()) }} />

      {/* Header */}
      <div className="border-b border-border/30 bg-[hsl(var(--dark-2))]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-10 py-3 flex items-center gap-3">
          <Link to="/" className="font-display font-extrabold text-gradient text-lg">RapidoMeet</Link>
          <span className="text-[10px] font-mono text-muted-foreground">FAQ</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 sm:px-10 py-10">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-2 bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] bg-clip-text text-transparent">
          Foire aux questions
        </h1>
        <p className="text-sm text-muted-foreground mb-6">{totalQuestions} questions organisées par catégorie</p>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une question..."
            className="w-full bg-[hsl(var(--dark-2))] border border-border/30 rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--fuchsia))]/50"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {faqData.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setOpenCategory(cat.id === openCategory ? null : cat.id); setSearch(""); }}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all ${
                openCategory === cat.id || search
                  ? openCategory === cat.id
                    ? "border-[hsl(var(--fuchsia))]/40 bg-[hsl(var(--fuchsia))]/10 text-foreground"
                    : "border-border/30 text-muted-foreground"
                  : "border-border/30 text-muted-foreground hover:border-border/50 hover:text-foreground"
              }`}
            >
              <cat.icon className="w-3 h-3" /> {cat.label}
              <span className="text-[9px] text-muted-foreground">({cat.items.length})</span>
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {filtered.map((cat) => {
            if (!search && openCategory && cat.id !== openCategory) return null;
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-3">
                  <cat.icon className="w-4 h-4 text-[hsl(var(--fuchsia-l))]" />
                  <h2 className="font-display font-bold text-base text-foreground">{cat.label}</h2>
                  <span className="text-[9px] text-muted-foreground">({cat.items.length})</span>
                </div>

                <div className="space-y-1">
                  {cat.items.map((item, i) => {
                    const key = `${cat.id}-${i}`;
                    const isOpen = openItems.has(key) || !!search;
                    return (
                      <div key={key} className="border border-border/20 rounded-xl overflow-hidden">
                        <button onClick={() => toggleItem(key)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[hsl(var(--dark-2))]/50 transition-colors">
                          <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                          <span className="text-xs font-medium text-foreground">{item.q}</span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pl-11">
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 p-6 rounded-2xl border border-border/30 bg-[hsl(var(--dark-2))] text-center">
          <h3 className="font-display font-bold text-lg text-foreground mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-xs text-muted-foreground mb-4">Notre équipe répond en moins de 4 heures.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/app/aide" className="text-xs font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] text-white">Contacter le support</Link>
            <Link to="/docs" className="text-xs font-medium px-4 py-2 rounded-lg border border-border/30 text-foreground hover:bg-muted/20">Voir la documentation</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
