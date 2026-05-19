import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useScenarios, Scenario, ScenarioExecution } from "@/hooks/useScenarios";
import UpgradeBanner from "@/components/app/UpgradeBanner";
import ScenarioEditDialog from "./components/ScenarioEditDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Play, Settings, Trash2, Edit, Loader2, Zap, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const TRIGGER_LABELS: Record<string, { label: string; icon: string }> = {
  meeting_completed: { label: "Réunion terminée", icon: "✅" },
  meeting_failed: { label: "Échec transcription", icon: "❌" },
  task_created: { label: "Nouvelle tâche", icon: "📋" },
  decision_created: { label: "Nouvelle décision", icon: "🎯" },
  contact_detected: { label: "Contact détecté", icon: "👤" },
  manual: { label: "Manuel", icon: "▶️" },
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-500/15 text-green-600 dark:text-green-400",
  failed: "bg-destructive/15 text-destructive",
  running: "bg-blue-500/15 text-blue-600 dark:text-blue-400 animate-pulse",
  pending: "bg-muted text-muted-foreground",
};

const Scenarios = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFree, limits } = useSubscription();
  const { fetchScenarios, fetchExecutions, toggleScenario, deleteScenario, executeScenario, createScenario, updateScenario, loading: execLoading } = useScenarios();

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [executions, setExecutions] = useState<ScenarioExecution[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [loadingExecs, setLoadingExecs] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Scenario | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; scenario?: Scenario }>({ open: false });
  const [detailSheet, setDetailSheet] = useState<ScenarioExecution | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadScenarios = useCallback(async () => {
    try {
      const data = await fetchScenarios();
      setScenarios(data);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoadingScenarios(false);
    }
  }, [fetchScenarios, toast]);

  const loadExecutions = useCallback(async () => {
    setLoadingExecs(true);
    try {
      const data = await fetchExecutions();
      setExecutions(data);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoadingExecs(false);
    }
  }, [fetchExecutions, toast]);

  useEffect(() => { loadScenarios(); }, [loadScenarios]);

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleScenario(id, isActive);
      setScenarios(prev => prev.map(s => s.id === id ? { ...s, is_active: isActive } : s));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteScenario(deleteConfirm.id);
      setScenarios(prev => prev.filter(s => s.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch {}
  };

  const handleExecute = async (id: string) => {
    setExecutingId(id);
    try {
      await executeScenario(id);
      await loadScenarios();
    } catch {} finally {
      setExecutingId(null);
    }
  };

  const handleSave = async (data: Partial<Scenario>) => {
    if (editDialog.scenario) {
      await updateScenario(editDialog.scenario.id, data);
    } else {
      await createScenario(data);
    }
    await loadScenarios();
  };

  const activeCount = scenarios.filter(s => s.is_active).length;
  const totalExecs = scenarios.reduce((a, s) => a + (s.execution_count || 0), 0);

  const filteredExecs = statusFilter === "all"
    ? executions
    : executions.filter(e => e.status === statusFilter);

  return (
    <div>
      <div className="px-3 sm:px-4 md:px-12 pt-4">
        {isFree && <UpgradeBanner feature="scenarios" currentCount={activeCount} limit={limits.scenarios} />}
      </div>

      {/* Header */}
      <div className="sticky top-[60px] z-20 backdrop-blur-xl bg-background/80 border-b border-border px-3 sm:px-4 md:px-12 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl md:text-[28px] tracking-tight text-foreground">Scénarios d'automatisation</h1>
            <p className="font-body text-xs sm:text-sm text-muted-foreground">Automatisez vos workflows post-réunion.</p>
          </div>
          <Button onClick={() => setEditDialog({ open: true })} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nouveau scénario
          </Button>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-12 py-4 sm:py-6 max-w-[1200px]">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
          {[
            { value: `${activeCount}`, sub: `/ ${scenarios.length}`, label: "Actifs" },
            { value: `${totalExecs}`, sub: "total", label: "Exécutions" },
            { value: scenarios.length > 0 ? `${Math.round((scenarios.filter(s => s.last_status === "success").length / Math.max(scenarios.filter(s => s.last_status).length, 1)) * 100)}%` : "—", sub: "dernière exec", label: "Taux succès" },
            { value: scenarios.length > 0 && scenarios.some(s => s.last_executed_at) ? formatDistanceToNow(new Date(scenarios.filter(s => s.last_executed_at).sort((a, b) => new Date(b.last_executed_at!).getTime() - new Date(a.last_executed_at!).getTime())[0]?.last_executed_at || Date.now()), { locale: fr, addSuffix: true }) : "—", sub: "", label: "Dernière exécution" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-3 sm:p-4">
                <p className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-foreground">{s.value}</p>
                <p className="font-body text-[10px] sm:text-xs text-muted-foreground">{s.sub} {s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="scenarios" onValueChange={(v) => { if (v === "history") loadExecutions(); }}>
          <TabsList className="mb-4">
            <TabsTrigger value="scenarios">Mes scénarios</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
          </TabsList>

          {/* Tab: Mes scénarios */}
          <TabsContent value="scenarios">
            {loadingScenarios ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : scenarios.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">Aucun scénario. Créez votre premier !</p>
                <Button onClick={() => setEditDialog({ open: true })} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Créer mon premier scénario
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {scenarios.map(s => {
                  const trigger = TRIGGER_LABELS[s.trigger_type] || { label: s.trigger_type, icon: "⚡" };
                  return (
                    <Card key={s.id} className={`transition-all ${s.is_active ? "border-primary/25" : "opacity-70"}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="font-display text-sm truncate">{s.name}</CardTitle>
                            {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Switch checked={s.is_active} onCheckedChange={v => handleToggle(s.id, v)} />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  {executingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExecute(s.id)} disabled={executingId === s.id}>
                                  <Play className="h-3 w-3 mr-2" /> Exécuter maintenant
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditDialog({ open: true, scenario: s })}>
                                  <Edit className="h-3 w-3 mr-2" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteConfirm(s)} className="text-destructive">
                                  <Trash2 className="h-3 w-3 mr-2" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-[10px]">{trigger.icon} {trigger.label}</Badge>
                          {s.last_status && (
                            <Badge className={`text-[10px] ${STATUS_COLORS[s.last_status] || ""}`}>
                              {s.last_status === "success" ? "✓ Succès" : s.last_status === "failed" ? "✗ Échec" : s.last_status}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">{s.execution_count || 0} exec</Badge>
                        </div>
                        {s.last_executed_at && (
                          <p className="text-[11px] text-muted-foreground">
                            Dernière : {formatDistanceToNow(new Date(s.last_executed_at), { locale: fr, addSuffix: true })}
                          </p>
                        )}
                        {Array.isArray(s.actions) && s.actions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {s.actions.map((a: any, i: number) => (
                              <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{a.label || a.type}</span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Historique */}
          <TabsContent value="history">
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { value: "all", label: "Tous" },
                { value: "success", label: "Succès" },
                { value: "failed", label: "Échecs" },
                { value: "running", label: "En cours" },
              ].map(f => (
                <Button key={f.value} variant={statusFilter === f.value ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f.value)} className="text-xs">
                  {f.label}
                </Button>
              ))}
            </div>

            {loadingExecs ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredExecs.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune exécution</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExecs.map(e => (
                  <Card key={e.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setDetailSheet(e)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      {e.status === "success" ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        : e.status === "failed" ? <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        : e.status === "running" ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                        : <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{(e as any).scenarios?.name || "Scénario"}</p>
                        <p className="text-[11px] text-muted-foreground">{TRIGGER_LABELS[e.trigger_type]?.icon} {TRIGGER_LABELS[e.trigger_type]?.label || e.trigger_type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={`text-[10px] ${STATUS_COLORS[e.status] || ""}`}>{e.status}</Badge>
                        {e.duration_ms != null && <p className="text-[10px] text-muted-foreground mt-0.5">{(e.duration_ms / 1000).toFixed(1)}s</p>}
                      </div>
                      <p className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(e.started_at), { locale: fr, addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Catalogue */}
          <TabsContent value="catalogue">
            <p className="text-sm text-muted-foreground mb-4">Templates prêts à l'emploi. Cliquez pour personnaliser et sauvegarder.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "Rapport email automatique", desc: "Envoie le rapport par email après chaque réunion.", trigger: "meeting_completed", actions: [{ type: "send_email", label: "Email rapport", config: { subject: "Rapport : {{meeting_title}}" } }] },
                { name: "Alerte Slack tâche critique", desc: "Notification Slack quand une tâche critique est détectée.", trigger: "task_created", actions: [{ type: "send_slack", label: "Slack alerte", config: { channel: "#alerts", message: "🚨 {{task_title}}" } }] },
                { name: "Workflow N8N commercial", desc: "Déclenche un workflow N8N pour les réunions commerciales.", trigger: "meeting_completed", actions: [{ type: "trigger_n8n", label: "N8N", config: { workflow: "commercial-followup" } }] },
                { name: "Résumé WhatsApp", desc: "Résumé court envoyé par WhatsApp.", trigger: "meeting_completed", actions: [{ type: "send_whatsapp", label: "WhatsApp", config: {} }] },
                { name: "Alerte sentiment négatif", desc: "Notification quand le sentiment est < 40%.", trigger: "meeting_completed", actions: [{ type: "send_email", label: "Email alerte", config: { subject: "⚠️ Sentiment négatif : {{meeting_title}}" } }], filter_sentiment_min: 40 },
                { name: "Webhook personnalisé", desc: "Envoie les données à votre endpoint.", trigger: "meeting_completed", actions: [{ type: "webhook", label: "Webhook", config: { url: "" } }] },
              ].map((template, i) => (
                <Card key={i} className="hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground">{template.desc}</p>
                    <Badge variant="outline" className="text-[10px]">{TRIGGER_LABELS[template.trigger]?.icon} {TRIGGER_LABELS[template.trigger]?.label}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setEditDialog({
                        open: true,
                        scenario: {
                          name: template.name,
                          description: template.desc,
                          trigger_type: template.trigger,
                          actions: template.actions,
                          is_active: true,
                        } as any,
                      })}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Utiliser ce template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <ScenarioEditDialog
        open={editDialog.open}
        onOpenChange={open => setEditDialog({ open })}
        onSave={handleSave}
        initialData={editDialog.scenario}
        mode={editDialog.scenario?.id ? "edit" : "create"}
      />

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer "{deleteConfirm?.name}" ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. L'historique d'exécution sera aussi supprimé.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Detail Sheet */}
      <Sheet open={!!detailSheet} onOpenChange={() => setDetailSheet(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Détail de l'exécution</SheetTitle>
          </SheetHeader>
          {detailSheet && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Statut</p>
                  <Badge className={STATUS_COLORS[detailSheet.status]}>{detailSheet.status}</Badge>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Durée</p>
                  <p className="text-sm font-medium">{detailSheet.duration_ms ? `${(detailSheet.duration_ms / 1000).toFixed(1)}s` : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Déclencheur</p>
                  <p className="text-sm">{TRIGGER_LABELS[detailSheet.trigger_type]?.label || detailSheet.trigger_type}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Date</p>
                  <p className="text-sm">{new Date(detailSheet.started_at).toLocaleString("fr-FR")}</p>
                </div>
              </div>
              {detailSheet.error_message && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-destructive">Erreur</p>
                  <p className="text-xs text-destructive/80 mt-1">{detailSheet.error_message}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold mb-2">Résultats des actions</p>
                <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-[300px]">
                  {JSON.stringify(detailSheet.actions_results, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Scenarios;
