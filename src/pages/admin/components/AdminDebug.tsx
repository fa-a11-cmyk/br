import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bug, Key } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { useAdminActions } from "../hooks/useAdminActions";

export default function AdminDebug() {
  const { fetchSection, loading } = useAdminData();
  const { executeAction } = useAdminActions();
  const [sessions, setSessions] = useState<any[]>([]);
  const [envCheck, setEnvCheck] = useState<{ key: string; configured: boolean }[]>([]);

  const loadSessions = useCallback(async () => {
    const d = await fetchSection("impersonation_sessions");
    if (d) setSessions(d.sessions || []);
  }, [fetchSection]);

  const loadEnv = useCallback(async () => {
    const d = await fetchSection("env_check");
    if (d) setEnvCheck(d.envCheck || []);
  }, [fetchSection]);

  useEffect(() => { loadSessions(); loadEnv(); }, [loadSessions, loadEnv]);

  const getSessionStatus = (s: any) => {
    if (!s.is_active) return { label: "Terminée", color: "bg-muted text-muted-foreground" };
    if (new Date(s.expires_at) < new Date()) return { label: "Expirée", color: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]" };
    return { label: "Active", color: "bg-emerald-500/15 text-emerald-400 animate-pulse" };
  };

  const handleEndSession = async (sessionId: string) => {
    await executeAction("end_impersonation", "system", { sessionId });
    loadSessions();
  };

  return (
    <div>
      <h1 className="font-display font-extrabold text-xl md:text-2xl text-foreground mb-4 md:mb-6">
        <Bug className="inline h-5 w-5 md:h-6 md:w-6 mr-2" />
        Debug & Sessions
      </h1>

      <Tabs defaultValue="sessions">
        <TabsList className="mb-4 md:mb-6 w-full overflow-x-auto flex-nowrap justify-start md:justify-center">
          <TabsTrigger value="sessions" className="gap-1.5 whitespace-nowrap text-xs md:text-sm"><Bug className="h-3.5 w-3.5" />Sessions</TabsTrigger>
          <TabsTrigger value="env" className="gap-1.5 whitespace-nowrap text-xs md:text-sm"><Key className="h-3.5 w-3.5" />Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Chargement…</p>
            ) : sessions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Aucune session</p>
            ) : sessions.map(s => {
              const status = getSessionStatus(s);
              return (
                <Card key={s.id} className="border-border/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={`text-[9px] ${status.color}`}>{status.label}</Badge>
                      {s.is_active && new Date(s.expires_at) >= new Date() && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleEndSession(s.id)}>Terminer</Button>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p><span className="text-foreground">Admin:</span> {s.admin_id?.slice(0, 8)}…</p>
                      <p><span className="text-foreground">Cible:</span> {s.target_user_id?.slice(0, 8)}…</p>
                      <p>{new Date(s.started_at).toLocaleString("fr-FR")}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop table */}
          <Card className="border-border/30 hidden md:block">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20">
                    {["Admin ID", "Cible ID", "Début", "Fin", "Statut", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</td></tr>
                  ) : sessions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucune session</td></tr>
                  ) : sessions.map(s => {
                    const status = getSessionStatus(s);
                    return (
                      <tr key={s.id} className="border-b border-border/10 hover:bg-muted/10">
                        <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{s.admin_id?.slice(0, 8)}…</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{s.target_user_id?.slice(0, 8)}…</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{new Date(s.started_at).toLocaleString("fr-FR")}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{s.ended_at ? new Date(s.ended_at).toLocaleString("fr-FR") : "—"}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-[9px] ${status.color}`}>{status.label}</Badge></td>
                        <td className="px-4 py-3">
                          {s.is_active && new Date(s.expires_at) >= new Date() && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleEndSession(s.id)}>Terminer</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="env">
          <Card className="border-border/30">
            <CardContent className="p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-4">Les valeurs ne sont jamais exposées, uniquement leur présence.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {envCheck.map(v => (
                  <div key={v.key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${v.configured ? "bg-emerald-400" : "bg-destructive"}`} />
                    <code className="font-mono text-xs text-foreground truncate flex-1">{v.key}</code>
                    <span className="text-[10px] text-muted-foreground shrink-0">{v.configured ? "✅" : "❌"}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
