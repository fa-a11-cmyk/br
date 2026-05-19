import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RefreshCw, AlertTriangle, Activity, Heart, Loader2, Mail } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { useAdminActions } from "../hooks/useAdminActions";

export default function AdminMonitoring() {
  const { fetchSection, loading } = useAdminData();
  const { executeAction } = useAdminActions();

  const [failedMeetings, setFailedMeetings] = useState<any[]>([]);
  const [meetingProfiles, setMeetingProfiles] = useState<any[]>([]);
  const [retryDialog, setRetryDialog] = useState<{ open: boolean; meeting: any }>({ open: false, meeting: null });
  const [detailSheet, setDetailSheet] = useState<{ open: boolean; meeting: any }>({ open: false, meeting: null });

  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<string | null>(null);
  const logIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const [health, setHealth] = useState<{ name: string; ok: boolean; status: number; configured?: boolean; message?: string }[]>([]);
  const [healthCheckedAt, setHealthCheckedAt] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);

  const loadFailed = useCallback(async () => {
    const d = await fetchSection("failed_meetings");
    if (d) { setFailedMeetings(d.failedMeetings || []); setMeetingProfiles(d.profiles || []); }
  }, [fetchSection]);

  const loadLogs = useCallback(async () => {
    const d = await fetchSection("logs");
    if (d) setLogs(d.logs || []);
  }, [fetchSection]);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    const d = await fetchSection("health");
    if (d) { setHealth(d.health || []); setHealthCheckedAt(d.checkedAt || null); }
    setHealthLoading(false);
  }, [fetchSection]);

  const loadEmailLogs = useCallback(async () => {
    setEmailLogsLoading(true);
    const d = await fetchSection("email_logs");
    if (d) setEmailLogs(d.emailLogs || []);
    setEmailLogsLoading(false);
  }, [fetchSection]);

  useEffect(() => { loadFailed(); }, [loadFailed]);

  const [activeTab, setActiveTab] = useState("failed");
  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
      logIntervalRef.current = setInterval(() => loadLogs(), 30000);
      return () => clearInterval(logIntervalRef.current);
    }
    if (activeTab === "health") loadHealth();
    if (activeTab === "emails") loadEmailLogs();
  }, [activeTab, logFilter, loadLogs, loadHealth, loadEmailLogs]);

  const getProfile = (userId: string) => meetingProfiles.find((p: any) => p.user_id === userId);

  const handleRetry = async (meetingId: string) => {
    await executeAction("retry_meeting", "system", { meetingId });
    setRetryDialog({ open: false, meeting: null });
    loadFailed();
  };

  const levelColors: Record<string, string> = {
    info: "bg-primary/15 text-primary",
    warn: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]",
    error: "bg-destructive/15 text-destructive",
    critical: "bg-destructive/20 text-destructive animate-pulse",
  };

  const statusBadge = (status: string) => {
    if (status === "failed") return <Badge variant="destructive" className="text-[9px]">failed</Badge>;
    return <Badge className="text-[9px] bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[#F59E0B]/30">partial</Badge>;
  };

  const filteredLogs = logFilter ? logs.filter(l => l.level === logFilter) : logs;

  return (
    <div>
      <h1 className="font-display font-extrabold text-xl md:text-2xl text-foreground mb-4 md:mb-6">
        <Activity className="inline h-5 w-5 md:h-6 md:w-6 mr-2" />
        Monitoring
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 md:mb-6 w-full overflow-x-auto flex-nowrap justify-start md:justify-center">
          <TabsTrigger value="failed" className="gap-1.5 whitespace-nowrap text-xs md:text-sm"><AlertTriangle className="h-3.5 w-3.5" />Échouées</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5 whitespace-nowrap text-xs md:text-sm"><Activity className="h-3.5 w-3.5" />Logs</TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5 whitespace-nowrap text-xs md:text-sm"><Heart className="h-3.5 w-3.5" />Santé</TabsTrigger>
          <TabsTrigger value="emails" className="gap-1.5 whitespace-nowrap text-xs md:text-sm"><Mail className="h-3.5 w-3.5" />Emails</TabsTrigger>
        </TabsList>

        {/* Failed Meetings */}
        <TabsContent value="failed">
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Chargement…</p>
            ) : failedMeetings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">🎉 Aucune réunion échouée</p>
            ) : failedMeetings.map(m => {
              const profile = getProfile(m.user_id);
              return (
                <Card key={m.id} className="border-border/30">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium truncate flex-1 mr-2">{m.title}</p>
                      {statusBadge(m.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || m.user_id.slice(0, 8) : m.user_id.slice(0, 8)}
                      {" · "}{new Date(m.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setRetryDialog({ open: true, meeting: m })}>🔄 Relancer</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetailSheet({ open: true, meeting: m })}>👁 Détail</Button>
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
                    {["Titre", "Utilisateur", "Statut", "Date", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Chargement…</td></tr>
                  ) : failedMeetings.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">🎉 Aucune réunion échouée</td></tr>
                  ) : failedMeetings.map(m => {
                    const profile = getProfile(m.user_id);
                    return (
                      <tr key={m.id} className="border-b border-border/10 hover:bg-muted/10">
                        <td className="px-4 py-3 text-xs text-foreground">{m.title}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || m.user_id.slice(0, 8) : m.user_id.slice(0, 8)}
                          {profile?.company && <span className="text-muted-foreground/50 ml-1">({profile.company})</span>}
                        </td>
                        <td className="px-4 py-3">{statusBadge(m.status)}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3 flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setRetryDialog({ open: true, meeting: m })}>🔄 Relancer</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setDetailSheet({ open: true, meeting: m })}>👁 Détail</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs">
          <div className="flex items-center gap-1.5 md:gap-2 mb-4 flex-wrap">
            {[null, "info", "warn", "error", "critical"].map(level => (
              <Button key={level || "all"} variant={logFilter === level ? "default" : "outline"} size="sm" className={`text-xs ${level === "critical" ? "text-destructive" : ""}`} onClick={() => setLogFilter(level)}>
                {level ? level.charAt(0).toUpperCase() + level.slice(1) : "Tous"}
              </Button>
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground hidden sm:inline">Auto-refresh 30s</span>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {filteredLogs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Aucun log</p>
            ) : filteredLogs.map(l => (
              <div key={l.id} className="p-3 rounded-lg bg-muted/20 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[9px] ${levelColors[l.level] || ""}`}>{l.level}</Badge>
                  <span className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleTimeString("fr-FR")}</span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground">{l.source}</p>
                <p className="text-xs text-foreground">{l.message}</p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="border-border/30 hidden md:block">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20">
                    {["Niveau", "Source", "Message", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Aucun log</td></tr>
                  ) : filteredLogs.map(l => (
                    <tr key={l.id} className="border-b border-border/10 hover:bg-muted/10">
                      <td className="px-4 py-3"><Badge variant="outline" className={`text-[9px] ${levelColors[l.level] || ""}`}>{l.level}</Badge></td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{l.source}</td>
                      <td className="px-4 py-3 text-xs text-foreground max-w-xs truncate">{l.message}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health */}
        <TabsContent value="health">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={loadHealth} disabled={healthLoading}>
              {healthLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Vérifier
            </Button>
            {healthCheckedAt && (
              <span className="text-[10px] text-muted-foreground">{new Date(healthCheckedAt).toLocaleString("fr-FR")}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {health.map(service => (
              <Card key={service.name} className="border-border/30">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full shrink-0 ${service.configured === false ? "bg-muted-foreground/40" : service.ok ? "bg-emerald-400" : "bg-destructive"} ${healthLoading ? "animate-pulse" : ""}`} />
                    <span className="font-display font-bold text-sm text-foreground truncate">{service.name}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {service.configured === false ? (
                      <>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">⚙️ Non configuré</Badge>
                        <span className="text-[10px] text-muted-foreground truncate">{service.message || "Clé API manquante"}</span>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className={`text-[10px] ${service.ok ? "text-emerald-400" : "text-destructive"}`}>HTTP {service.status}</Badge>
                        <span className="text-[10px] text-muted-foreground">{service.ok ? "Opérationnel" : "Indisponible"}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Emails */}
        <TabsContent value="emails">
          {(() => {
            const totalEmails = emailLogs.length;
            const sentCount = emailLogs.filter((e: any) => e.status === "sent").length;
            const failedCount = emailLogs.filter((e: any) => e.status === "failed").length;
            const successRate = totalEmails > 0 ? Math.round((sentCount / totalEmails) * 100) : 0;

            const typeBadgeColors: Record<string, string> = {
              report: "bg-primary/15 text-primary",
              welcome: "bg-emerald-500/15 text-emerald-500",
              test: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]",
              notification: "bg-blue-500/15 text-blue-500",
            };

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Card className="border-border/30"><CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Total</p>
                    <p className="text-xl font-bold text-foreground">{totalEmails}</p>
                  </CardContent></Card>
                  <Card className="border-border/30"><CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Envoyés</p>
                    <p className="text-xl font-bold text-emerald-500">{sentCount}</p>
                  </CardContent></Card>
                  <Card className="border-border/30"><CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Échoués</p>
                    <p className="text-xl font-bold text-destructive">{failedCount}</p>
                  </CardContent></Card>
                  <Card className="border-border/30"><CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Taux succès</p>
                    <p className="text-xl font-bold text-foreground">{successRate}%</p>
                  </CardContent></Card>
                </div>

                <div className="flex justify-end mb-3">
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={loadEmailLogs} disabled={emailLogsLoading}>
                    {emailLogsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Rafraîchir
                  </Button>
                </div>

                {/* Mobile cards */}
                <div className="space-y-2 md:hidden">
                  {emailLogsLoading ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">Chargement…</p>
                  ) : emailLogs.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">📧 Aucun email envoyé</p>
                  ) : emailLogs.map((e: any) => (
                    <Card key={e.id} className="border-border/30">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className={`text-[9px] ${typeBadgeColors[e.email_type] || ""}`}>{e.email_type}</Badge>
                          <Badge variant="outline" className={`text-[9px] ${e.status === "sent" ? "text-emerald-500" : "text-destructive"}`}>{e.status}</Badge>
                        </div>
                        <p className="text-xs text-foreground truncate">{e.subject}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{e.recipient_email}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(e.sent_at).toLocaleString("fr-FR")}</p>
                        {e.error_message && <p className="text-[10px] text-destructive mt-1 truncate">{e.error_message}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop table */}
                <Card className="border-border/30 hidden md:block">
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/20">
                          {["Type", "Destinataire", "Sujet", "Statut", "Resend ID", "Date"].map(h => (
                            <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {emailLogsLoading ? (
                          <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</td></tr>
                        ) : emailLogs.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">📧 Aucun email envoyé</td></tr>
                        ) : emailLogs.map((e: any) => (
                          <tr key={e.id} className="border-b border-border/10 hover:bg-muted/10">
                            <td className="px-4 py-3"><Badge variant="outline" className={`text-[9px] ${typeBadgeColors[e.email_type] || ""}`}>{e.email_type}</Badge></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{e.recipient_email}</td>
                            <td className="px-4 py-3 text-xs text-foreground max-w-[200px] truncate">{e.subject}</td>
                            <td className="px-4 py-3"><Badge variant="outline" className={`text-[9px] ${e.status === "sent" ? "text-emerald-500" : e.status === "failed" ? "text-destructive" : "text-[#F59E0B]"}`}>{e.status}</Badge></td>
                            <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{e.resend_id ? e.resend_id.slice(0, 12) + "…" : "—"}</td>
                            <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{new Date(e.sent_at).toLocaleString("fr-FR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Retry Dialog */}
      <Dialog open={retryDialog.open} onOpenChange={(o) => setRetryDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">🔄 Relancer la transcription</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Relancer la transcription de « {retryDialog.meeting?.title} » ?</p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setRetryDialog({ open: false, meeting: null })}>Annuler</Button>
            <Button onClick={() => retryDialog.meeting && handleRetry(retryDialog.meeting.id)} className="bg-gradient-primary text-white">Relancer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={detailSheet.open} onOpenChange={(o) => setDetailSheet(p => ({ ...p, open: o }))}>
        <SheetContent className="bg-card border-border w-full sm:max-w-lg">
          <SheetHeader><SheetTitle className="font-display">Détail de la réunion</SheetTitle></SheetHeader>
          <div className="mt-4">
            <pre className="text-xs font-mono bg-muted/30 p-4 rounded-lg overflow-auto max-h-[70vh] text-foreground">{JSON.stringify(detailSheet.meeting, null, 2)}</pre>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
