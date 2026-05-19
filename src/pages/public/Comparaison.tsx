import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Check, X, ArrowRight } from "lucide-react";
import PageHead from "@/components/PageHead";

type Competitor = {
  name: string;
  tagline: string;
  features: { name: string; competitor: boolean | string; rapidomeet: boolean | string }[];
  gaps: string[];
  pricing: { competitor: string; rapidomeet: string };
};

const competitors: Record<string, Competitor> = {
  "otter-ai": {
    name: "Otter.ai",
    tagline: "Otter transcrit. RapidoMeet agit.",
    features: [
      { name: "Transcription FR/EN", competitor: true, rapidomeet: true },
      { name: "Diarisation (identification voix)", competitor: true, rapidomeet: true },
      { name: "Résumé automatique", competitor: true, rapidomeet: true },
      { name: "Tâches extraites automatiquement", competitor: false, rapidomeet: true },
      { name: "CRM mis à jour automatiquement", competitor: false, rapidomeet: true },
      { name: "Rapport WhatsApp instantané", competitor: false, rapidomeet: true },
      { name: "Scénarios N8N post-réunion", competitor: false, rapidomeet: true },
      { name: "Mémoire contextuelle (agent)", competitor: false, rapidomeet: true },
      { name: "Skills personnalisables (Markdown)", competitor: false, rapidomeet: true },
      { name: "OpenClaw gateway (200+ agents)", competitor: false, rapidomeet: true },
      { name: "Enrichissement LinkedIn auto", competitor: false, rapidomeet: true },
      { name: "Score prospect IA (1-10)", competitor: false, rapidomeet: true },
    ],
    gaps: [
      "Otter.ai ne crée aucune tâche après la réunion — vous devez tout saisir manuellement.",
      "Pas d'intégration CRM native — vos contacts ne sont jamais mis à jour automatiquement.",
      "Aucun rapport distribué — pas de WhatsApp, pas de Telegram, pas d'email automatique.",
      "Pas de scénarios d'automatisation — impossible de connecter Jira, Slack ou Stripe.",
      "Pas de mémoire contextuelle — chaque réunion repart de zéro, sans historique.",
    ],
    pricing: { competitor: "~20$/mois (Pro)", rapidomeet: "79€/mois (Pro) — 50+ actions automatiques incluses" },
  },
  fireflies: {
    name: "Fireflies.ai",
    tagline: "Fireflies enregistre. RapidoMeet orchestre.",
    features: [
      { name: "Transcription multilingue", competitor: true, rapidomeet: true },
      { name: "Diarisation", competitor: true, rapidomeet: true },
      { name: "Résumé IA", competitor: true, rapidomeet: true },
      { name: "Intégration CRM (Salesforce/HubSpot)", competitor: "Basique", rapidomeet: true },
      { name: "Extraction de tâches automatique", competitor: "Limité", rapidomeet: true },
      { name: "Rapport WhatsApp/Telegram", competitor: false, rapidomeet: true },
      { name: "Workflows N8N personnalisés", competitor: false, rapidomeet: true },
      { name: "Skills Markdown configurables", competitor: false, rapidomeet: true },
      { name: "Score prospect IA", competitor: false, rapidomeet: true },
      { name: "Facturation Stripe automatique", competitor: false, rapidomeet: true },
      { name: "Enrichissement prospect (LinkedIn)", competitor: false, rapidomeet: true },
      { name: "Orchestration multi-agents (OpenClaw)", competitor: false, rapidomeet: true },
    ],
    gaps: [
      "Fireflies se limite à la transcription et au résumé — aucune action concrète déclenchée.",
      "L'intégration CRM est basique : un log d'activité, pas de création de contact ou scoring.",
      "Aucun canal de distribution instantané (WhatsApp, Telegram, Discord).",
      "Pas de scénarios d'automatisation personnalisables.",
      "Pas de mémoire conversationnelle entre les réunions.",
    ],
    pricing: { competitor: "~19$/mois (Pro)", rapidomeet: "79€/mois (Pro) — 50+ actions automatiques incluses" },
  },
};

const FeatureCell = ({ value }: { value: boolean | string }) => {
  if (value === true) return <Check className="w-5 h-5 text-rm-success mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-destructive/60 mx-auto" />;
  return <span className="font-mono text-xs text-rm-warning">{value}</span>;
};

const Comparaison = () => {
  const { slug } = useParams<{ slug: string }>();
  const data = competitors[slug || ""] || competitors["otter-ai"];

  return (
    <div className="min-h-screen bg-background">
      <PageHead title={`RapidoMeet vs ${data.name}`} description={`${data.tagline} Comparez RapidoMeet avec ${data.name} : fonctionnalités, prix et avantages.`} path={`/comparer/${slug}`} />
      <Navbar />

      {/* Hero */}
      <section className="pt-[140px] pb-12 px-4 md:px-[60px] text-center">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">Comparaison</p>
        <h1 className="font-display font-extrabold text-foreground leading-[1.05] tracking-tight mb-5" style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-2px" }}>
          RapidoMeet vs <span className="text-gradient">{data.name}</span>
        </h1>
        <p className="font-body text-lg text-muted-foreground max-w-[500px] mx-auto">{data.tagline}</p>
      </section>

      {/* Table */}
      <section className="px-4 md:px-[60px] pb-16">
        <div className="max-w-[800px] mx-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-display font-bold text-foreground py-4 pr-4">Fonctionnalité</th>
                <th className="text-center font-display font-bold text-muted-foreground py-4 px-4 w-[120px]">{data.name}</th>
                <th className="text-center font-display font-bold py-4 px-4 w-[120px]">
                  <span className="text-gradient">RapidoMeet</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.features.map((f) => (
                <tr key={f.name} className="border-b border-border/50">
                  <td className="font-body text-muted-foreground py-3 pr-4">{f.name}</td>
                  <td className="text-center py-3 px-4"><FeatureCell value={f.competitor} /></td>
                  <td className="text-center py-3 px-4"><FeatureCell value={f.rapidomeet} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gaps */}
      <section className="px-4 md:px-[60px] pb-16 bg-rm-dark-1">
        <div className="max-w-[700px] mx-auto py-16">
          <h2 className="font-display font-extrabold text-xl text-foreground mb-8 text-center">
            Ce que {data.name} <span className="text-destructive">ne fait pas</span>
          </h2>
          <div className="space-y-4">
            {data.gaps.map((gap, i) => (
              <div key={i} className="flex gap-3 bg-card border border-border rounded-xl p-4">
                <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="font-body text-sm text-muted-foreground">{gap}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 md:px-[60px] py-16">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display font-extrabold text-xl text-foreground mb-6 text-center">Comparaison prix</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="font-display font-bold text-foreground mb-2">{data.name}</p>
              <p className="font-mono text-sm text-muted-foreground">{data.pricing.competitor}</p>
            </div>
            <div className="bg-card border border-primary/30 rounded-xl p-6 text-center">
              <p className="font-display font-bold text-gradient mb-2">RapidoMeet</p>
              <p className="font-mono text-sm text-muted-foreground">{data.pricing.rapidomeet}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-[60px] py-16 bg-rm-dark-1 text-center">
        <h2 className="font-display font-extrabold text-2xl text-foreground mb-4">
          Prêt à passer de la transcription à <span className="text-gradient">l'action</span> ?
        </h2>
        <p className="font-body text-muted-foreground max-w-[400px] mx-auto mb-8">
          14 jours gratuits. Sans carte bancaire. Premier rapport en 3 minutes.
        </p>
        <Link to="/inscription" className="inline-flex items-center gap-2 bg-gradient-primary text-white font-display font-bold text-sm py-3.5 px-8 rounded-xl shadow-fuchsia">
          Essayer gratuitement <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default Comparaison;
