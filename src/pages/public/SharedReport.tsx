import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SharedReport = () => {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/get-shared-report?token=${token}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">{error.includes("expiré") ? "⏰" : "🔒"}</div>
        <h1 className="text-xl font-bold mb-2 text-foreground">{error.includes("expiré") ? "Ce lien a expiré" : "Lien invalide"}</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link to="/" className="text-primary hover:underline">← Retour à RapidoMeet</Link>
      </div>
    </div>
  );

  const { meeting, tasks, decisions, contacts, transcription, shared } = data;
  const priorityStyle: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive", high: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
    medium: "bg-violet-d text-[hsl(var(--violet-l))]", low: "bg-secondary text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 px-4 py-3 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">⚡ RapidoMeet</span>
          <Badge variant="outline" className="text-xs">Rapport partagé</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">👁 {shared.viewCount} vue(s)</span>
          <Link to="/inscription" className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90">Essayer gratuitement →</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-foreground">{meeting.title}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>📅 {new Date(meeting.created_at).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            <span>·</span>
            <span>🏷 {meeting.meeting_type}</span>
            {meeting.duration_seconds && (<><span>·</span><span>⏱ {Math.round(meeting.duration_seconds / 60)} min</span></>)}
          </div>
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="summary">📋 Résumé</TabsTrigger>
            <TabsTrigger value="tasks">✅ Tâches ({tasks.length})</TabsTrigger>
            <TabsTrigger value="decisions">🎯 Décisions ({decisions.length})</TabsTrigger>
            {shared.showContacts && contacts.length > 0 && <TabsTrigger value="contacts">👥 Contacts ({contacts.length})</TabsTrigger>}
            {shared.showTranscription && transcription && <TabsTrigger value="transcription">🎙 Transcription</TabsTrigger>}
          </TabsList>

          <TabsContent value="summary">
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-foreground leading-relaxed">{meeting.summary || "Aucun résumé disponible."}</p>
              {meeting.sentiment_score && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sentiment :</span>
                  <Badge className={meeting.sentiment_score >= 70 ? "bg-success-d text-[hsl(var(--success))]" : meeting.sentiment_score >= 40 ? "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]" : "bg-destructive/20 text-destructive"}>
                    {meeting.sentiment_score}/100
                  </Badge>
                </div>
              )}
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                <span>✅ {tasks.length} tâches</span>
                <span>🎯 {decisions.length} décisions</span>
                <span>👥 {contacts.length} contacts</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="space-y-2">
              {tasks.map((t: any) => (
                <div key={t.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                      {t.status === "done" ? "✓" : ""}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm ${t.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</p>
                      <div className="flex gap-2 mt-1.5">
                        {t.assignee && <span className="text-xs text-muted-foreground">👤 {t.assignee}</span>}
                        <Badge variant="outline" className={`text-[9px] ${priorityStyle[t.priority] || ""}`}>{t.priority}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center mt-4">✨ Tâches extraites automatiquement par RapidoMeet</p>
            </div>
          </TabsContent>

          <TabsContent value="decisions">
            <div className="space-y-2">
              {decisions.map((d: any) => (
                <div key={d.id} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-sm text-foreground">✓ {d.content}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {shared.showContacts && (
            <TabsContent value="contacts">
              <div className="space-y-2">
                {contacts.map((c: any) => (
                  <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                    </div>
                    <Badge variant="outline">{c.score}%</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          {shared.showTranscription && transcription && (
            <TabsContent value="transcription">
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{transcription.full_text}</p>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="font-bold text-lg mb-2 text-foreground">⚡ Créez des rapports comme celui-ci automatiquement</h3>
          <p className="text-muted-foreground mb-4">RapidoMeet analyse vos réunions et extrait tâches, décisions et contacts en 2 minutes.</p>
          <Link to="/inscription" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90">
            Essayer gratuitement — 3 réunions offertes
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SharedReport;
