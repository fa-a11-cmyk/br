import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Plus, X, Mail, MessageSquare, Smartphone, Send, Webhook, Link2 } from "lucide-react";
import type { Scenario } from "@/hooks/useScenarios";

const TRIGGER_OPTIONS = [
  { value: "meeting_completed", label: "Après analyse d'une réunion", icon: "✅" },
  { value: "meeting_failed", label: "Après échec de transcription", icon: "❌" },
  { value: "task_created", label: "Après extraction d'une tâche", icon: "📋" },
  { value: "decision_created", label: "Après extraction d'une décision", icon: "🎯" },
  { value: "contact_detected", label: "Après détection d'un contact", icon: "👤" },
  { value: "manual", label: "Déclenchement manuel uniquement", icon: "▶️" },
];

const MEETING_TYPES = [
  { value: "commercial", label: "Commercial" },
  { value: "tech", label: "Tech" },
  { value: "retro", label: "Retro" },
  { value: "onboarding", label: "Onboarding" },
  { value: "rh", label: "RH" },
  { value: "marketing", label: "Marketing" },
  { value: "autre", label: "Autre" },
];

const ACTION_TYPES = [
  { type: "send_email", label: "Envoyer rapport par email", icon: Mail, config: { subject: "Rapport : {{meeting_title}}" } },
  { type: "send_slack", label: "Notification Slack", icon: MessageSquare, config: { channel: "#general", message: "Réunion terminée : {{meeting_title}}" } },
  { type: "send_whatsapp", label: "Message WhatsApp", icon: Smartphone, config: {} },
  { type: "send_telegram", label: "Message Telegram", icon: Send, config: {} },
  { type: "trigger_n8n", label: "Webhook N8N", icon: Webhook, config: { workflow: "default" } },
  { type: "webhook", label: "Webhook personnalisé", icon: Link2, config: { url: "" } },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Scenario>) => Promise<void>;
  initialData?: Partial<Scenario>;
  mode?: "create" | "edit";
}

export default function ScenarioEditDialog({ open, onOpenChange, onSave, initialData, mode = "create" }: Props) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [triggerType, setTriggerType] = useState(initialData?.trigger_type || "meeting_completed");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [filterMeetingType, setFilterMeetingType] = useState<string[]>(initialData?.filter_meeting_type || []);
  const [filterMinDuration, setFilterMinDuration] = useState(initialData?.filter_min_duration ? initialData.filter_min_duration / 60 : 0);
  const [filterSentimentMin, setFilterSentimentMin] = useState(initialData?.filter_sentiment_min || 0);
  const [actions, setActions] = useState<any[]>(
    Array.isArray(initialData?.actions) && initialData.actions.length > 0
      ? initialData.actions
      : []
  );
  const [saving, setSaving] = useState(false);

  const addAction = (actionType: typeof ACTION_TYPES[0]) => {
    setActions([...actions, { type: actionType.type, label: actionType.label, config: { ...actionType.config } }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateActionConfig = (index: number, key: string, value: string) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], config: { ...updated[index].config, [key]: value } };
    setActions(updated);
  };

  const toggleMeetingType = (type: string) => {
    setFilterMeetingType(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        trigger_type: triggerType,
        is_active: isActive,
        filter_meeting_type: filterMeetingType.length > 0 ? filterMeetingType : null,
        filter_min_duration: filterMinDuration > 0 ? filterMinDuration * 60 : null,
        filter_sentiment_min: filterSentimentMin > 0 ? filterSentimentMin : null,
        actions,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "create" ? "Nouveau scénario" : "Modifier le scénario"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section 1 - Info */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informations</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du scénario *" />
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnel)" rows={2} />
            <div className="flex items-center justify-between">
              <Label className="text-sm">Actif dès la création</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Section 2 - Trigger */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Déclencheur</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {triggerType === "meeting_completed" && (
              <div className="space-y-3 border border-border rounded-lg p-3">
                <Label className="text-xs text-muted-foreground">Filtres optionnels</Label>
                <div>
                  <Label className="text-xs mb-1.5 block">Types de réunion</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {MEETING_TYPES.map(mt => (
                      <Badge
                        key={mt.value}
                        variant={filterMeetingType.includes(mt.value) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleMeetingType(mt.value)}
                      >
                        {mt.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Durée minimale : {filterMinDuration} min</Label>
                  <Slider value={[filterMinDuration]} onValueChange={v => setFilterMinDuration(v[0])} min={0} max={120} step={5} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Sentiment minimum : {filterSentimentMin}%</Label>
                  <Slider value={[filterSentimentMin]} onValueChange={v => setFilterSentimentMin(v[0])} min={0} max={100} step={5} />
                </div>
              </div>
            )}
          </div>

          {/* Section 3 - Actions */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions ({actions.length})</Label>
            {actions.map((action, i) => {
              const def = ACTION_TYPES.find(a => a.type === action.type);
              const Icon = def?.icon || Webhook;
              return (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{action.label || def?.label}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeAction(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {action.type === "send_email" && (
                    <Input
                      value={action.config?.subject || ""}
                      onChange={e => updateActionConfig(i, "subject", e.target.value)}
                      placeholder="Sujet de l'email"
                      className="text-xs"
                    />
                  )}
                  {action.type === "send_slack" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={action.config?.channel || ""}
                        onChange={e => updateActionConfig(i, "channel", e.target.value)}
                        placeholder="Canal (#general)"
                        className="text-xs"
                      />
                      <Input
                        value={action.config?.message || ""}
                        onChange={e => updateActionConfig(i, "message", e.target.value)}
                        placeholder="Message"
                        className="text-xs"
                      />
                    </div>
                  )}
                  {action.type === "trigger_n8n" && (
                    <Input
                      value={action.config?.workflow || ""}
                      onChange={e => updateActionConfig(i, "workflow", e.target.value)}
                      placeholder="Nom du workflow"
                      className="text-xs"
                    />
                  )}
                  {action.type === "webhook" && (
                    <Input
                      value={action.config?.url || ""}
                      onChange={e => updateActionConfig(i, "url", e.target.value)}
                      placeholder="https://..."
                      className="text-xs"
                    />
                  )}
                </div>
              );
            })}
            <div className="flex flex-wrap gap-1.5">
              {ACTION_TYPES.map(at => (
                <Button key={at.type} variant="outline" size="sm" className="text-xs gap-1" onClick={() => addAction(at)}>
                  <Plus className="h-3 w-3" />
                  {at.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
