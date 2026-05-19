import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BROADCAST_TYPES = [
  { value: "newsletter", label: "📰 Newsletter" },
  { value: "feature_announcement", label: "🆕 Nouvelle feature" },
  { value: "new_skill", label: "⚡ Nouveau Skill" },
  { value: "new_template", label: "🎨 Nouveau Template" },
  { value: "openclaw_update", label: "🤖 Update OpenClaw" },
  { value: "tutorial", label: "🎓 Tutoriel" },
  { value: "api_docs", label: "📚 Docs API" },
  { value: "nurturing", label: "💧 Nurturing" },
  { value: "reengagement", label: "🔄 Réactivation" },
  { value: "upsell", label: "💎 Upsell" },
  { value: "custom", label: "✏️ Custom" },
];

const SEGMENTS = [
  { value: "all", label: "👥 Tous les utilisateurs" },
  { value: "free", label: "🆓 Plan Free" },
  { value: "pro", label: "💎 Plan Pro" },
  { value: "new_7d", label: "🆕 Nouveaux (7j)" },
];

export default function AdminEmailMarketing() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    subject: "",
    broadcast_type: "newsletter",
    audience_segment: "all",
    content_html: "",
    scheduled_at: "",
  });

  const [aiParams, setAiParams] = useState({
    topic: "",
    key_points: ["", "", ""],
    cta_label: "Découvrir →",
    cta_url: "https://app.rapidomeet.io",
    tone: "professionnel",
  });

  useEffect(() => { loadStats(); }, []);

  const callMarketing = async (action: string, payload: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-marketing`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await callMarketing("get_stats");
      setStats(data);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const syncAudience = async (segment: string, audienceId: string) => {
    setSyncing(segment);
    try {
      const data = await callMarketing("sync_contacts", { segment, audience_id: audienceId });
      toast({ title: `${data.synced} contacts synchronisés ✓` });
      await loadStats();
    } catch (e: any) {
      toast({ title: "Erreur sync", description: e.message, variant: "destructive" });
    }
    setSyncing(null);
  };

  const handleGenerateAI = async () => {
    if (!aiParams.topic) {
      toast({ title: "Entrez un sujet pour l'IA" });
      return;
    }
    setAiLoading(true);
    try {
      const result = await callMarketing("generate_ai", {
        broadcast_type: form.broadcast_type,
        topic: aiParams.topic,
        audience_segment: form.audience_segment,
        key_points: aiParams.key_points.filter(Boolean),
        cta_label: aiParams.cta_label,
        cta_url: aiParams.cta_url,
        tone: aiParams.tone,
      });
      setForm(p => ({ ...p, content_html: result.html, subject: p.subject || aiParams.topic }));
      setPreviewHtml(result.html);
      toast({ title: "Email généré par l'IA ✓" });
    } catch (e: any) {
      toast({ title: "Erreur IA", description: e.message, variant: "destructive" });
    }
    setAiLoading(false);
  };

  const handleSend = async () => {
    if (!form.name || !form.subject || !form.content_html) {
      toast({ title: "Nom, sujet et contenu requis", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const result = await callMarketing("send_broadcast", {
        name: form.name,
        subject: form.subject,
        html: form.content_html,
        audience_segment: form.audience_segment,
        broadcast_type: form.broadcast_type,
        scheduled_at: form.scheduled_at || undefined,
      });
      toast({ title: result.status === "scheduled" ? "Broadcast planifié ✓" : "Broadcast envoyé ✓" });
      setShowCompose(false);
      setForm({ name: "", subject: "", broadcast_type: "newsletter", audience_segment: "all", content_html: "", scheduled_at: "" });
      setPreviewHtml("");
      await loadStats();
    } catch (e: any) {
      toast({ title: "Erreur d'envoi", description: e.message, variant: "destructive" });
    }
    setSending(false);
  };

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-green-500/10 text-green-600",
    scheduled: "bg-blue-500/10 text-blue-600",
    failed: "bg-red-500/10 text-red-500",
    pending: "bg-amber-500/10 text-amber-600",
    skipped: "bg-muted text-muted-foreground",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">✉️ Email Marketing</h2>
          <p className="text-sm text-muted-foreground">Propulsé par Resend Broadcasts · mail.rapidomeet.io</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => syncAudience("all", "")} disabled={syncing === "all"}>
            {syncing === "all" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "🔄"} Sync contacts
          </Button>
          <Button size="sm" onClick={() => setShowCompose(true)}>+ Nouveau broadcast</Button>
        </div>
      </div>

      <Tabs defaultValue="broadcasts">
        <TabsList>
          <TabsTrigger value="broadcasts">📨 Broadcasts</TabsTrigger>
          <TabsTrigger value="onboarding">🚀 Onboarding</TabsTrigger>
          <TabsTrigger value="audiences">👥 Audiences</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcasts" className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Envoyés", value: stats?.broadcasts?.filter((b: any) => b.status === "sent").length || 0, icon: "📤" },
              { label: "Destinataires", value: (stats?.broadcasts || []).reduce((s: number, b: any) => s + (b.recipients_count || 0), 0).toLocaleString(), icon: "👥" },
              { label: "Taux ouverture", value: (() => {
                const sent = (stats?.broadcasts || []).filter((b: any) => b.recipients_count > 0);
                if (!sent.length) return "—";
                const avg = sent.reduce((s: number, b: any) => s + (b.opens_count || 0) / b.recipients_count, 0) / sent.length;
                return `${Math.round(avg * 100)}%`;
              })(), icon: "👁" },
              { label: "Planifiés", value: stats?.broadcasts?.filter((b: any) => b.status === "scheduled").length || 0, icon: "🗓" },
            ].map(kpi => (
              <Card key={kpi.label} className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  <span>{kpi.icon}</span>
                </div>
                <p className="font-bold text-lg mt-0.5">{kpi.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-4 border-primary/20 bg-primary/5">
            <h4 className="text-sm font-semibold mb-2">⚙️ Configuration requise</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
              <li><strong>Sous-domaine :</strong> ajouter mail.rapidomeet.io dans Resend Console → Domains</li>
              <li><strong>Audiences :</strong> créer 4 audiences dans Resend Console → Audiences</li>
              <li><strong>Secrets :</strong> RESEND_AUDIENCE_ID_ALL/FREE/PRO/NEW dans les secrets backend</li>
              <li><strong>Onboarding :</strong> actif automatiquement via cron à chaque inscription</li>
            </ol>
          </Card>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border/30">
                <tr>
                  {["Nom", "Type", "Segment", "Stats", "Statut", "Date"].map(h => (
                    <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.broadcasts || []).length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucun broadcast envoyé</td></tr>
                ) : (stats?.broadcasts || []).map((b: any) => (
                  <tr key={b.id} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.broadcast_type}</td>
                    <td className="px-4 py-3 text-xs">{b.audience_segment}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {b.status === "sent" && (
                        <span>📤{b.recipients_count || 0} · 👁{b.opens_count || 0} · 🖱{b.clicks_count || 0}</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${STATUS_COLORS[b.status]}`}>{b.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(b.sent_at || b.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "En attente", value: stats?.onboarding_queue?.pending || 0, color: "text-amber-600" },
              { label: "Envoyés", value: stats?.onboarding_queue?.sent || 0, color: "text-green-600" },
              { label: "Skippés", value: stats?.onboarding_queue?.skipped || 0, color: "text-muted-foreground" },
              { label: "Échoués", value: stats?.onboarding_queue?.failed || 0, color: "text-red-500" },
            ].map(kpi => (
              <Card key={kpi.label} className="p-3">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`font-bold text-lg mt-0.5 ${kpi.color}`}>{kpi.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">📋 Séquence d'onboarding automatique</h3>
            <div className="space-y-3">
              {[
                { step: 1, name: "Bienvenue", delay: "Immédiat", icon: "👋" },
                { step: 2, name: "Première réunion", delay: "J+3", icon: "🎙", skip: "si réunion créée" },
                { step: 3, name: "Découvrir les features", delay: "J+7", icon: "⚡" },
                { step: 4, name: "Upsell Pro", delay: "J+14", icon: "💎", skip: "si déjà payant" },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3 p-3 rounded-xl border border-border/30">
                  <span className="text-xl">{s.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Étape {s.step} — {s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.delay}{s.skip ? ` · Skip ${s.skip}` : ""}</p>
                  </div>
                  <Badge className="text-xs bg-green-500/10 text-green-600">Actif</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">⏱ Le cron s'exécute toutes les 30 minutes pour traiter la file.</p>
          </Card>
        </TabsContent>

        <TabsContent value="audiences" className="space-y-4">
          {(stats?.audiences || []).length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm mb-3">
                Aucune audience configurée. Créez vos audiences dans Resend Console, puis ajoutez les IDs dans les secrets.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {(stats?.audiences || []).map((a: any) => (
                <Card key={a.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{a.name}</h3>
                    <Badge className="text-xs bg-primary/10 text-primary">{a.segment}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{a.contact_count || 0}</p>
                  <p className="text-xs text-muted-foreground">contacts</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      {a.last_synced_at ? `Sync: ${new Date(a.last_synced_at).toLocaleDateString("fr-FR")}` : "Jamais synchronisé"}
                    </p>
                    <Button size="sm" variant="outline" className="text-xs"
                      disabled={syncing === a.segment}
                      onClick={() => syncAudience(a.segment, a.resend_audience_id)}>
                      {syncing === a.segment ? <Loader2 className="w-3 h-3 animate-spin" /> : "🔄"} Sync
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✉️ Nouveau Broadcast</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Left: params + AI */}
            <div className="space-y-4">
              <Card className="p-4 space-y-3">
                <h4 className="text-sm font-semibold">Paramètres</h4>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nom interne *</label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Newsletter Mars 2026" className="text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sujet *</label>
                  <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Les nouveautés RapidoMeet ⚡" className="text-sm mt-1" />
                  <p className="text-xs text-muted-foreground mt-0.5 text-right">{form.subject.length}/60</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <Select value={form.broadcast_type} onValueChange={v => setForm(p => ({ ...p, broadcast_type: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{BROADCAST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Audience</label>
                    <Select value={form.audience_segment} onValueChange={v => setForm(p => ({ ...p, audience_segment: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{SEGMENTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Planifier (optionnel)</label>
                  <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} className="text-xs h-8 mt-1" />
                  <p className="text-xs text-muted-foreground mt-0.5">Vide = envoi immédiat</p>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <h4 className="text-sm font-semibold">🤖 Générer avec l'IA</h4>
                <Input value={aiParams.topic} onChange={e => setAiParams(p => ({ ...p, topic: e.target.value }))} placeholder="Sujet: Annonce du Skills Marketplace" className="text-sm" />
                {aiParams.key_points.map((pt, i) => (
                  <Input key={i} value={pt} onChange={e => {
                    const pts = [...aiParams.key_points]; pts[i] = e.target.value;
                    setAiParams(p => ({ ...p, key_points: pts }));
                  }} placeholder={`Point clé ${i + 1}...`} className="text-sm" />
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <Input value={aiParams.cta_label} onChange={e => setAiParams(p => ({ ...p, cta_label: e.target.value }))} placeholder="Label CTA" className="text-sm" />
                  <Input value={aiParams.cta_url} onChange={e => setAiParams(p => ({ ...p, cta_url: e.target.value }))} placeholder="URL CTA" className="text-sm" />
                </div>
                <Button className="w-full" variant="outline" onClick={handleGenerateAI} disabled={aiLoading || !aiParams.topic}>
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "✨"} {aiLoading ? "Génération..." : "Générer l'email"}
                </Button>
              </Card>
            </div>

            {/* Right: HTML + preview */}
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">💻 Contenu HTML</h4>
                  <div className="flex gap-1 text-xs text-muted-foreground">
                    <code className="px-1 bg-muted rounded">{"{{{FIRST_NAME|vous}}}"}</code>
                    <code className="px-1 bg-muted rounded">{"{{{RESEND_UNSUBSCRIBE_URL}}}"}</code>
                  </div>
                </div>
                <Textarea value={form.content_html} onChange={e => setForm(p => ({ ...p, content_html: e.target.value }))} placeholder="Collez votre HTML ici ou utilisez le générateur IA..." rows={10} className="text-xs font-mono" />
              </Card>

              {(previewHtml || form.content_html) && (
                <Card className="overflow-hidden">
                  <div className="p-3 border-b border-border/30 flex items-center justify-between">
                    <h4 className="font-medium text-sm">👁 Prévisualisation</h4>
                    {previewHtml && <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setPreviewHtml("")}>✕</Button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-4 bg-background">
                    <div style={{ maxWidth: 600, margin: "0 auto" }}
                      dangerouslySetInnerHTML={{
                        __html: (previewHtml || form.content_html)
                          .replace(/\{\{\{FIRST_NAME\|([^}]+)\}\}\}/g, "$1")
                          .replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, "#"),
                      }}
                    />
                  </div>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompose(false)}>Annuler</Button>
            <Button onClick={handleSend} disabled={sending || !form.name || !form.subject || !form.content_html}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "📨"}
              {sending ? "Envoi..." : form.scheduled_at ? "Planifier" : "Envoyer maintenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
