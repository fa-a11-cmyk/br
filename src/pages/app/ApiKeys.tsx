import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Plus, Eye, EyeOff, Trash2, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, RefreshCw, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  full_key?: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: string;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  success: boolean | null;
  attempted_at: string | null;
  duration_ms: number | null;
}

const EVENTS = [
  "meeting.started", "meeting.completed", "meeting.failed",
  "task.created", "task.updated", "task.completed",
  "report.generated", "report.sent", "contact.created",
  "scenario.triggered", "scenario.failed",
];

const ApiKeys = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("app");
  const { limits } = usePlanLimits();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("Nouvelle clé");
  const [newKeyEnv, setNewKeyEnv] = useState("test");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | "success" | "failed">("all");

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    setKeys((data as any[]) || []);
    setLoading(false);
  }, [user]);

  const fetchWebhooks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("webhooks" as any).select("*").order("created_at", { ascending: false });
    setWebhooks((data as any[]) || []);
    setWebhooksLoading(false);
  }, [user]);

  const fetchDeliveries = useCallback(async () => {
    if (!user) return;
    setDeliveriesLoading(true);
    const { data } = await supabase
      .from("webhook_deliveries")
      .select("*")
      .order("attempted_at", { ascending: false })
      .limit(50);
    setDeliveries((data as any[]) || []);
    setDeliveriesLoading(false);
  }, [user]);

  useEffect(() => { fetchKeys(); fetchWebhooks(); fetchDeliveries(); }, [fetchKeys, fetchWebhooks, fetchDeliveries]);

  const createKey = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-api-key", { body: { name: newKeyName, environment: newKeyEnv } });
      if (error) throw error;
      setRevealedKeys(prev => ({ ...prev, [data.id]: data.full_key }));
      setShowKey(prev => ({ ...prev, [data.id]: true }));
      toast({ title: t("apiKeys.keyCreated"), description: t("apiKeys.keyCreatedDesc") });
      setDialogOpen(false);
      setNewKeyName("Nouvelle clé");
      fetchKeys();
    } catch (e: any) {
      toast({ title: t("apiKeys.error"), description: e.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const deleteKey = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) toast({ title: t("apiKeys.error"), description: error.message, variant: "destructive" });
    else { toast({ title: t("apiKeys.keyDeleted") }); fetchKeys(); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t("apiKeys.copied") });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");
  const formatTime = (d: string) => new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const webhookUrlMap = webhooks.reduce<Record<string, string>>((acc, w) => { acc[w.id] = w.url; return acc; }, {});

  const filteredDeliveries = deliveries.filter(d => {
    if (deliveryFilter === "success") return d.success === true;
    if (deliveryFilter === "failed") return d.success === false;
    return true;
  });

  return (
    <div className="p-6 md:p-10 max-w-[1000px]">
      <p className="font-mono text-[11px] uppercase tracking-[2px] text-muted-foreground/60 mb-4">{t("apiKeys.breadcrumb")}</p>
      <h1 className="font-display font-extrabold text-[28px] md:text-[32px] tracking-tight text-foreground mb-1">{t("apiKeys.title")}</h1>
      <p className="font-body text-[15px] text-muted-foreground mb-8">{t("apiKeys.subtitle")}</p>

      <Tabs defaultValue="keys">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="keys">{t("apiKeys.tabKeys")}</TabsTrigger>
          <TabsTrigger value="webhooks">{t("apiKeys.tabWebhooks")}</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="events">{t("apiKeys.tabEvents")}</TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <Card className="border-border/30 mb-4">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : keys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="font-body text-sm text-muted-foreground">{t("apiKeys.noKeys")}</p>
                  <p className="font-body text-xs text-muted-foreground/60 mt-1">{t("apiKeys.noKeysDesc")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {keys.map((k) => (
                    <div key={k.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-body text-sm text-foreground font-medium">{k.name}</p>
                          <Badge variant="outline" className="text-[10px]">{k.prefix.includes("live") ? "Live" : "Test"}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="font-mono text-xs text-muted-foreground">
                            {showKey[k.id] && revealedKeys[k.id] ? revealedKeys[k.id] : `${k.prefix}${"●".repeat(12)}`}
                          </code>
                          {revealedKeys[k.id] && (
                            <button onClick={() => setShowKey((p) => ({ ...p, [k.id]: !p[k.id] }))} className="text-muted-foreground hover:text-foreground">
                              {showKey[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          {revealedKeys[k.id] && (
                            <button onClick={() => copyToClipboard(revealedKeys[k.id])} className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-[10px] text-muted-foreground">{t("apiKeys.created", { date: formatDate(k.created_at) })}</p>
                        {k.last_used_at && <p className="font-mono text-[10px] text-muted-foreground">{t("apiKeys.lastUsed", { date: formatDate(k.last_used_at) })}</p>}
                      </div>
                      <button onClick={() => deleteKey(k.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan limit warning */}
          {limits && limits.api_keys_max && keys.length >= limits.api_keys_max && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-4">
              <p className="font-body text-sm text-foreground">Limite de {limits.api_keys_max} clés atteinte pour le plan <span className="font-bold capitalize">{limits.plan}</span>.</p>
              <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => navigate("/app/billing")}>Passer à un plan supérieur →</Button>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-primary text-white shadow-fuchsia"
                  disabled={!!(limits && limits.api_keys_max && keys.length >= limits.api_keys_max)}
                >
                  <Plus className="h-4 w-4 mr-1" /> {t("apiKeys.createKey")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">{t("apiKeys.newKeyTitle")}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("apiKeys.keyName")}</label>
                    <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="bg-muted/30 border-border/30" />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("apiKeys.environment")}</label>
                    <Select value={newKeyEnv} onValueChange={setNewKeyEnv}>
                      <SelectTrigger className="bg-muted/30 border-border/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">Test (rm_test_)</SelectItem>
                        <SelectItem value="live">Production (rm_live_)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createKey} disabled={creating} className="w-full bg-gradient-primary text-white shadow-fuchsia">
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{t("apiKeys.generateKey")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Playground link */}
          <div className="rounded-lg border border-border/30 p-4 mt-6">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="h-4 w-4 text-primary" />
              <h3 className="font-display font-medium text-sm">Tester vos clés API</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Utilisez le Playground interactif pour tester vos appels API en temps réel avec vos vraies données.
            </p>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/docs/playground")}>
              Ouvrir le Playground →
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="border-border/30 mb-4">
            <CardContent className="p-0">
              {webhooksLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : webhooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="font-body text-sm text-muted-foreground">{t("apiKeys.noWebhooks")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {webhooks.map((w) => (
                    <div key={w.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <code className="font-mono text-xs text-foreground truncate block">{w.url}</code>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {w.events.map((e) => <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}
                          <Badge className="text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-0">
                            {w.status === "active" ? t("apiKeys.active") : t("apiKeys.inactive")}
                          </Badge>
                        </div>
                      </div>
                      <button onClick={async () => {
                        await supabase.from("webhooks" as any).delete().eq("id", w.id);
                        toast({ title: t("apiKeys.webhookDeleted") });
                        fetchWebhooks();
                      }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-white shadow-fuchsia"><Plus className="h-4 w-4 mr-1" /> {t("apiKeys.addWebhook")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">{t("apiKeys.newWebhookTitle")}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("apiKeys.webhookUrl")}</label>
                  <Input value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} placeholder="https://example.com/webhook" className="bg-muted/30 border-border/30" />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("apiKeys.webhookEvents")}</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                    {EVENTS.map((e) => (
                      <label key={e} className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/20 cursor-pointer hover:bg-muted/30 text-xs">
                        <input type="checkbox" checked={newWebhookEvents.includes(e)} onChange={(ev) => {
                          if (ev.target.checked) setNewWebhookEvents((p) => [...p, e]);
                          else setNewWebhookEvents((p) => p.filter((x) => x !== e));
                        }} className="rounded" />
                        <code className="font-mono text-[11px]">{e}</code>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={async () => {
                  if (!newWebhookUrl || !user) return;
                  const { error } = await supabase.from("webhooks" as any).insert({ user_id: user.id, url: newWebhookUrl, events: newWebhookEvents, status: "active" } as any);
                  if (error) toast({ title: t("apiKeys.error"), description: error.message, variant: "destructive" });
                  else { toast({ title: t("apiKeys.webhookCreated") }); setWebhookDialogOpen(false); setNewWebhookUrl(""); setNewWebhookEvents([]); fetchWebhooks(); }
                }} disabled={!newWebhookUrl || newWebhookEvents.length === 0} className="w-full bg-gradient-primary text-white shadow-fuchsia">
                  {t("apiKeys.createWebhook")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="history">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={deliveryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setDeliveryFilter("all")}
                className="text-xs"
              >
                Tous
              </Button>
              <Button
                variant={deliveryFilter === "success" ? "default" : "outline"}
                size="sm"
                onClick={() => setDeliveryFilter("success")}
                className="text-xs"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> Succès
              </Button>
              <Button
                variant={deliveryFilter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setDeliveryFilter("failed")}
                className="text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" /> Échecs
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchDeliveries} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Rafraîchir
            </Button>
          </div>

          <Card className="border-border/30">
            <CardContent className="p-0">
              {deliveriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDeliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="font-body text-sm text-muted-foreground">Aucun appel webhook enregistré</p>
                  <p className="font-body text-xs text-muted-foreground/60 mt-1">
                    Les deliveries apparaîtront ici quand vos webhooks seront déclenchés.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {filteredDeliveries.map((d) => (
                    <details key={d.id} className="group">
                      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors">
                        {d.success ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] font-mono">{d.event_type}</Badge>
                            {d.response_status && (
                              <Badge
                                className={`text-[10px] border-0 ${
                                  d.response_status < 300
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : d.response_status < 500
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {d.response_status}
                              </Badge>
                            )}
                            {d.duration_ms != null && (
                              <span className="text-[10px] text-muted-foreground font-mono">{d.duration_ms}ms</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                            {webhookUrlMap[d.webhook_id] || d.webhook_id.slice(0, 8) + "…"}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {d.attempted_at ? formatTime(d.attempted_at) : "—"}
                        </span>
                      </summary>
                      <div className="px-4 pb-3 pt-1 space-y-2 bg-muted/10">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Payload envoyé</p>
                          <pre className="text-xs font-mono bg-background/50 rounded p-2 overflow-x-auto max-h-[200px] border border-border/20">
                            {JSON.stringify(d.payload, null, 2)}
                          </pre>
                        </div>
                        {d.response_body && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Réponse</p>
                            <pre className="text-xs font-mono bg-background/50 rounded p-2 overflow-x-auto max-h-[150px] border border-border/20">
                              {d.response_body}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="events">
          <Card className="border-border/30">
            <CardHeader><CardTitle className="font-display text-sm">{t("apiKeys.availableEvents")}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EVENTS.map((e) => (
                  <div key={e} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20">
                    <code className="font-mono text-xs text-foreground">{e}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border border-border/30 p-4 mt-6">
        <h3 className="font-medium mb-1 text-sm">🧪 {t("apiKeys.testPlaygroundTitle", "Tester vos clés API")}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {t("apiKeys.testPlaygroundDesc", "Utilisez le Playground interactif pour tester vos appels API en temps réel avec vos vraies données.")}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate("/docs/playground")}>
          {t("apiKeys.openPlayground", "Ouvrir le Playground →")}
        </Button>
      </div>
    </div>
  );
};

export default ApiKeys;
