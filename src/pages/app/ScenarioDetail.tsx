import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useScenarios, Scenario, ScenarioExecution } from "@/hooks/useScenarios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import ScenarioEditDialog from "./components/ScenarioEditDialog";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const TRIGGER_LABELS: Record<string, string> = {
  meeting_completed: "✅ Réunion terminée",
  meeting_failed: "❌ Échec transcription",
  task_created: "📋 Nouvelle tâche",
  decision_created: "🎯 Nouvelle décision",
  contact_detected: "👤 Contact détecté",
  manual: "▶️ Manuel",
};

const ScenarioDetail = () => {
  const { id } = useParams();
  const { fetchScenarios, fetchExecutions, toggleScenario, executeScenario, updateScenario } = useScenarios();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [executions, setExecutions] = useState<ScenarioExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const all = await fetchScenarios();
        const found = all.find(s => s.id === id);
        setScenario(found || null);
        if (found) {
          const execs = await fetchExecutions(found.id);
          setExecutions(execs);
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [id, fetchScenarios, fetchExecutions]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!scenario) {
    return (
      <div className="p-6 md:p-10 max-w-[1100px]">
        <p className="text-muted-foreground">Scénario introuvable.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/app/scenarios">← Retour</Link></Button>
      </div>
    );
  }

  const handleExecute = async () => {
    setExecuting(true);
    try {
      await executeScenario(scenario.id);
      const execs = await fetchExecutions(scenario.id);
      setExecutions(execs);
      const all = await fetchScenarios();
      setScenario(all.find(s => s.id === id) || scenario);
    } catch {} finally {
      setExecuting(false);
    }
  };

  const handleToggle = async (v: boolean) => {
    await toggleScenario(scenario.id, v);
    setScenario({ ...scenario, is_active: v });
  };

  const handleSave = async (data: Partial<Scenario>) => {
    await updateScenario(scenario.id, data);
    const all = await fetchScenarios();
    setScenario(all.find(s => s.id === id) || scenario);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1100px]">
      <Link to="/app/scenarios" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3 w-3" /> Retour aux scénarios
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-foreground">{scenario.name}</h1>
          {scenario.description && <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Modifier</Button>
          <Button size="sm" onClick={handleExecute} disabled={executing} className="gap-1.5">
            {executing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Exécuter
          </Button>
          <Switch checked={scenario.is_active} onCheckedChange={handleToggle} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Statut", value: scenario.is_active ? "● Actif" : "○ Inactif", color: scenario.is_active ? "text-green-500" : "text-muted-foreground" },
          { label: "Exécutions", value: `${scenario.execution_count || 0}`, color: "text-foreground" },
          { label: "Dernier statut", value: scenario.last_status || "—", color: scenario.last_status === "success" ? "text-green-500" : scenario.last_status === "failed" ? "text-destructive" : "text-muted-foreground" },
          { label: "Déclencheur", value: TRIGGER_LABELS[scenario.trigger_type] || scenario.trigger_type, color: "text-foreground" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-display font-bold text-sm ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="executions">
        <TabsList>
          <TabsTrigger value="executions">Exécutions ({executions.length})</TabsTrigger>
          <TabsTrigger value="actions">Actions configurées</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="mt-4">
          {executions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune exécution encore.</p>
          ) : (
            <div className="space-y-2">
              {executions.map(e => (
                <Card key={e.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    {e.status === "success" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    <div className="flex-1">
                      <p className="text-sm">{e.trigger_type}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(e.started_at).toLocaleString("fr-FR")}</p>
                    </div>
                    <Badge variant={e.status === "success" ? "default" : "destructive"} className="text-[10px]">{e.status}</Badge>
                    {e.duration_ms && <span className="text-[10px] text-muted-foreground">{(e.duration_ms / 1000).toFixed(1)}s</span>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <div className="space-y-2">
            {Array.isArray(scenario.actions) && scenario.actions.map((a: any, i: number) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.label || a.type}</p>
                    {a.config && Object.keys(a.config).length > 0 && (
                      <p className="text-[10px] text-muted-foreground">{Object.entries(a.config).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                </CardContent>
              </Card>
            ))}
            {(!scenario.actions || scenario.actions.length === 0) && (
              <p className="text-center text-muted-foreground py-4">Aucune action configurée.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ScenarioEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSave}
        initialData={scenario}
        mode="edit"
      />
    </div>
  );
};

export default ScenarioDetail;
