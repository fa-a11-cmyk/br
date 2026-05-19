import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Zap, Plus } from "lucide-react";
import ScenarioEditDialog from "./components/ScenarioEditDialog";
import { useScenarios, Scenario } from "@/hooks/useScenarios";

const TRIGGER_LABELS: Record<string, { label: string; icon: string }> = {
  meeting_completed: { label: "Réunion terminée", icon: "✅" },
  meeting_failed: { label: "Échec transcription", icon: "❌" },
  task_created: { label: "Nouvelle tâche", icon: "📋" },
  decision_created: { label: "Nouvelle décision", icon: "🎯" },
  contact_detected: { label: "Contact détecté", icon: "👤" },
  manual: { label: "Manuel", icon: "▶️" },
};

interface Template {
  name: string;
  description: string;
  category: string;
  icon: string;
  trigger: string;
  actions: any[];
  filter_meeting_type?: string[];
  filter_sentiment_min?: number;
}

const TEMPLATES: Template[] = [
  {
    name: "Weekly Digest", description: "Résumé hebdomadaire automatique envoyé chaque lundi.",
    category: "Reporting", icon: "📊", trigger: "meeting_completed",
    actions: [{ type: "send_email", label: "Email résumé", config: { subject: "Résumé hebdo : {{meeting_title}}" } }],
  },
  {
    name: "Prospect Auto-Capture", description: "Détecte et enregistre les prospects mentionnés en réunion.",
    category: "CRM", icon: "🎯", trigger: "contact_detected",
    actions: [{ type: "trigger_n8n", label: "N8N CRM sync", config: { workflow: "prospect-capture" } }],
  },
  {
    name: "Slack Report Post-Meeting", description: "Rapport automatique dans votre channel Slack.",
    category: "Distribution", icon: "💬", trigger: "meeting_completed",
    actions: [{ type: "send_slack", label: "Slack rapport", config: { channel: "#general", message: "📋 {{meeting_title}} terminée" } }],
  },
  {
    name: "Telegram Report", description: "Rapport envoyé via bot Telegram.",
    category: "Distribution", icon: "📱", trigger: "meeting_completed",
    actions: [{ type: "send_telegram", label: "Telegram", config: {} }],
  },
  {
    name: "Email Follow-up J+1", description: "Séquence email de follow-up après réunion commerciale.",
    category: "Email", icon: "📧", trigger: "meeting_completed",
    actions: [{ type: "send_email", label: "Email follow-up", config: { subject: "Suite à notre réunion : {{meeting_title}}" } }],
    filter_meeting_type: ["commercial"],
  },
  {
    name: "Alerte Sentiment Négatif", description: "Notification quand le sentiment est négatif (< 40%).",
    category: "Alertes", icon: "⚠️", trigger: "meeting_completed",
    actions: [{ type: "send_email", label: "Alerte email", config: { subject: "⚠️ Sentiment négatif : {{meeting_title}}" } }],
    filter_sentiment_min: 40,
  },
  {
    name: "WhatsApp Résumé Court", description: "Résumé ultra-court envoyé par WhatsApp.",
    category: "Distribution", icon: "📲", trigger: "meeting_completed",
    actions: [{ type: "send_whatsapp", label: "WhatsApp", config: {} }],
  },
  {
    name: "Webhook N8N Commercial", description: "Déclenche un workflow N8N pour les réunions commerciales.",
    category: "Automatisation", icon: "🔗", trigger: "meeting_completed",
    actions: [{ type: "trigger_n8n", label: "N8N workflow", config: { workflow: "commercial-followup" } }],
    filter_meeting_type: ["commercial"],
  },
  {
    name: "Webhook Personnalisé", description: "Envoie les données vers votre propre endpoint.",
    category: "Développeur", icon: "🌐", trigger: "meeting_completed",
    actions: [{ type: "webhook", label: "Custom webhook", config: { url: "" } }],
  },
];

const CATEGORIES = [...new Set(TEMPLATES.map(t => t.category))];

const ScenarioCatalogue = () => {
  const { createScenario } = useScenarios();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; template?: Template }>({ open: false });

  const filtered = TEMPLATES.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || t.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleSave = async (data: Partial<Scenario>) => {
    await createScenario(data);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1200px]">
      <p className="font-mono text-[11px] uppercase tracking-[2px] text-muted-foreground/60 mb-4">RapidoMeet › Automatisation</p>
      <h1 className="font-display font-extrabold text-[28px] md:text-[32px] tracking-tight text-foreground mb-1">Catalogue de scénarios</h1>
      <p className="font-body text-[15px] text-muted-foreground mb-6">Templates prêts à l'emploi. Personnalisez et sauvegardez.</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un template..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>
            Tous ({TEMPLATES.length})
          </Button>
          {CATEGORIES.map(cat => (
            <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t, i) => {
          const trigger = TRIGGER_LABELS[t.trigger] || { label: t.trigger, icon: "⚡" };
          return (
            <Card key={i} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <CardTitle className="font-display text-sm">{t.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] mt-1">{t.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="font-body text-xs text-muted-foreground">{t.description}</p>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-[10px]">{trigger.icon} {trigger.label}</Badge>
                  {t.actions.map((a, j) => (
                    <p key={j} className="font-mono text-[10px] text-muted-foreground">→ {a.label || a.type}</p>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1"
                  onClick={() => setEditDialog({
                    open: true,
                    template: t,
                  })}
                >
                  <Plus className="h-3 w-3" /> Utiliser ce template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Aucun template trouvé</p>
        </div>
      )}

      <ScenarioEditDialog
        open={editDialog.open}
        onOpenChange={open => setEditDialog({ open })}
        onSave={handleSave}
        initialData={editDialog.template ? {
          name: editDialog.template.name,
          description: editDialog.template.description,
          trigger_type: editDialog.template.trigger,
          actions: editDialog.template.actions,
          is_active: true,
          filter_meeting_type: editDialog.template.filter_meeting_type || null,
          filter_sentiment_min: editDialog.template.filter_sentiment_min || null,
        } as any : undefined}
        mode="create"
      />
    </div>
  );
};

export default ScenarioCatalogue;
