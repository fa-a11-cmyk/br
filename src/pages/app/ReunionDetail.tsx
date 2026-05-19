import { useState, useEffect, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { downloadTranscriptionPDF, downloadReportPDF } from "@/lib/pdfExport";
import { PDFReportGenerator } from "@/components/PDFReportGenerator";
import { ShareReportDialog } from "@/components/ShareReportDialog";
import { EfficiencyScore } from "@/components/app/EfficiencyScore";
import { ImprovementTips } from "@/components/app/ImprovementTips";
import { ConfirmationGate } from "@/components/app/ConfirmationGate";
import { useMeetings, Meeting, Transcription, ExtractedTask, ExtractedDecision, DetectedContact } from "@/hooks/useMeetings";
import { useMeetingRealtime } from "@/hooks/useMeetingRealtime";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useWorkspace } from "@/hooks/useWorkspace";

const ReunionDetail = () => {
  const { t, i18n } = useTranslation("app");
  const dateFnsLocale = i18n.language === "en" ? enUS : fr;

  const tabs = [
    { id: "transcription", label: t("meetingDetail.tabTranscription") },
    { id: "analyse", label: t("meetingDetail.tabAnalysis") },
    { id: "taches", label: t("meetingDetail.tabTasks") },
    { id: "actions", label: "Actions" },
    { id: "rapport", label: t("meetingDetail.tabReport") },
    { id: "historique", label: t("meetingDetail.tabHistory") },
  ];

/* ── Speaker colors ── */
const SPEAKER_COLORS = [
  { bar: "bg-[hsl(var(--fuchsia))]", text: "text-[hsl(var(--fuchsia-l))]", gradient: "from-[#E91E8C] to-[#C2177A]" },
  { bar: "bg-[hsl(var(--violet-l))]", text: "text-[hsl(var(--violet-l))]", gradient: "from-[#7C3AED] to-[#5B21B6]" },
  { bar: "bg-[hsl(var(--success))]", text: "text-[hsl(var(--success))]", gradient: "from-[#10B981] to-[#059669]" },
  { bar: "bg-[#F59E0B]", text: "text-[#F59E0B]", gradient: "from-[#F59E0B] to-[#D97706]" },
  { bar: "bg-[#60A5FA]", text: "text-[#60A5FA]", gradient: "from-[#60A5FA] to-[#3B82F6]" },
];

const statusBadge: Record<string, { label: string; cls: string }> = {
  pending: { label: t("meetingDetail.todo"), cls: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]" },
  in_progress: { label: t("meetingDetail.inProgress"), cls: "bg-violet-d text-[hsl(var(--violet-l))]" },
  done: { label: t("meetingDetail.completed"), cls: "bg-success-d text-[hsl(var(--success))]" },
  ignored: { label: t("tasks.statusIgnored"), cls: "bg-[hsl(var(--dark-4))] text-muted-foreground" },
};

const priorityStyle: Record<string, string> = {
  high: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
  critical: "bg-destructive/20 text-destructive",
  medium: "bg-violet-d text-[hsl(var(--violet-l))]",
  low: "bg-[hsl(var(--dark-4))] text-muted-foreground",
};

const priorityLabel: Record<string, string> = {
  critical: t("tasks.priorityCritical"), high: t("tasks.priorityHigh"), medium: t("tasks.priorityMedium"), low: t("tasks.priorityLow"),
};

const meetingTypeLabel: Record<string, string> = {
  commercial: "commercial", tech: "tech", retro: "retro", onboarding: "onboarding", rh: "RH", marketing: "marketing", autre: t("meetings.types.other"),
};

  /* remove standalone declaration - moved into component */
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchMeeting, fetchTranscription, fetchTasks, fetchDecisions, fetchContacts, fetchReport, updateTaskStatus } = useMeetings();
  const { meeting: realtimeMeeting } = useMeetingRealtime(id);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [decisions, setDecisions] = useState<ExtractedDecision[]>([]);
  const [contacts, setContacts] = useState<DetectedContact[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [activeTab, setActiveTab] = useState("transcription");
  const [showPanel, setShowPanel] = useState(false);
  const [taskView, setTaskView] = useState<"list" | "kanban">("list");
  const [transcriptionSearch, setTranscriptionSearch] = useState("");
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const { completeStep } = useOnboarding();

  // Auto-complete onboarding step when viewing a completed report
  useEffect(() => {
    if (activeTab === "rapport" && meeting?.status === "completed") {
      completeStep("view_report");
    }
  }, [activeTab, meeting?.status]);

  // Update from realtime
  useEffect(() => {
    if (realtimeMeeting) {
      setMeeting(realtimeMeeting);
      // Reload data when status changes to completed
      if (realtimeMeeting.status === "completed") {
        loadData();
      }
    }
  }, [realtimeMeeting]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [m, t, tk, d, c, r] = await Promise.all([
        fetchMeeting(id),
        fetchTranscription(id).catch(() => null),
        fetchTasks(id),
        fetchDecisions(id),
        fetchContacts(id),
        fetchReport(id).catch(() => null),
      ]);
      setMeeting(m);
      setTranscription(t);
      setTasks(tk);
      setDecisions(d);
      setContacts(c);
      setReport(r);
      setCheckedTasks(new Set(tk.filter(t => t.status === "done").map(t => t.id)));
    } catch (e: any) {
      setError(e.message || t("meetingDetail.loading"));
    } finally {
      setLoading(false);
    }
  };

  const retryTranscription = async () => {
    if (!id) return;
    try {
      await supabase.functions.invoke("transcribe-audio", { body: { meetingId: id } });
    } catch {}
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "done" ? "pending" : "done";
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      setCheckedTasks(prev => {
        const n = new Set(prev);
        newStatus === "done" ? n.add(taskId) : n.delete(taskId);
        return n;
      });
    } catch { }
  };

  const isInProgress = meeting?.status === "pending" || meeting?.status === "transcribing" || meeting?.status === "analyzing";

  // Parse segments from transcription
  const segments: Array<{ time: string; speaker: string; text: string }> = [];
  if (transcription?.segments && Array.isArray(transcription.segments)) {
    for (const seg of transcription.segments as any[]) {
      segments.push({
        time: seg.timestamp || seg.time || "00:00:00",
        speaker: (seg.speaker || "Intervenant").toUpperCase(),
        text: seg.text || seg.content || "",
      });
    }
  } else if (transcription?.full_text) {
    // Fallback: show full text as single segment
    segments.push({ time: "00:00:00", speaker: "TRANSCRIPTION", text: transcription.full_text });
  }

  // Build speaker map for colors
  const speakerNames = [...new Set(segments.map(s => s.speaker))];
  const speakerColorMap: Record<string, typeof SPEAKER_COLORS[0]> = {};
  speakerNames.forEach((name, i) => {
    speakerColorMap[name] = SPEAKER_COLORS[i % SPEAKER_COLORS.length];
  });

  // Participants from meeting
  const participants: Array<{ name: string }> = Array.isArray(meeting?.participants) ? meeting.participants as any[] : [];

  const formatDate = (d: string) => {
    try { return format(new Date(d), "EEEE d MMMM yyyy", { locale: dateFnsLocale }); } catch { return d; }
  };
  const formatTime = (d: string) => {
    try { return format(new Date(d), "HH:mm"); } catch { return ""; }
  };
  const formatDuration = (s: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    return `${m} min`;
  };

  /* Sentiment gauge SVG */
  const SentimentGauge = ({ value }: { value: number }) => {
    const r = 60;
    const cx = 80, cy = 75;
    const startAngle = -180 * (Math.PI / 180);
    const endAngle = 0;
    const valAngle = (-180 + (value / 100) * 180) * (Math.PI / 180);
    const arcPath = (a1: number, a2: number) => {
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
    };
    return (
      <svg width={160} height={100} viewBox="0 0 160 100" className="mx-auto">
        <defs>
          <linearGradient id="gaugeGrad"><stop offset="0%" stopColor="#E91E8C" /><stop offset="100%" stopColor="#10B981" /></linearGradient>
        </defs>
        <path d={arcPath(startAngle, endAngle)} fill="none" stroke="hsl(var(--dark-4))" strokeWidth={8} strokeLinecap="round" />
        <path d={arcPath(startAngle, valAngle)} fill="none" stroke="url(#gaugeGrad)" strokeWidth={8} strokeLinecap="round" />
        <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize={28} fontFamily="Syne" fontWeight={800}>{value}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#10B981" fontSize={12} fontFamily="DM Sans">{value >= 60 ? t("meetingDetail.positive") : value >= 40 ? t("meetingDetail.neutral") : t("meetingDetail.negative")}</text>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[hsl(var(--fuchsia))] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-body text-sm text-muted-foreground">{t("meetingDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-4xl">😕</p>
          <p className="font-body text-muted-foreground">{error || t("meetingDetail.notFound")}</p>
          <Link to="/app/reunions" className="font-body text-sm text-[hsl(var(--fuchsia-l))] hover:underline">{t("meetingDetail.backLink")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* STICKY HEADER */}
      <div className="sticky top-[60px] z-20 backdrop-blur-xl bg-background/80 border-b border-border px-4 sm:px-6 md:px-12 pt-6 pb-0">
        <p className="font-mono text-[11px] text-muted-foreground mb-3">
          <Link to="/app/reunions" className="hover:text-[hsl(var(--fuchsia-l))] transition-colors">{t("meetingDetail.backToMeetings")}</Link>
          <span className="mx-2">›</span>{meeting.title}
        </p>

        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[rgba(66,133,244,0.15)] flex items-center justify-center text-lg shrink-0">🎙</div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-xl sm:text-[26px] tracking-tight text-foreground truncate">{meeting.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-[12px] sm:text-[13px] text-muted-foreground font-body">
                <span>📅 {formatDate(meeting.created_at)}</span>
                <span>⏱ {formatDuration(meeting.duration_seconds)}</span>
                <span>👥 {participants.length || "—"} {t("meetingDetail.participants")}</span>
                {meeting.channel && <span>📹 {meeting.channel}</span>}
                <span className="font-mono text-[10px] uppercase bg-fuchsia-d text-[hsl(var(--fuchsia-l))] px-2 py-0.5 rounded-full">{meetingTypeLabel[meeting.meeting_type] || meeting.meeting_type}</span>
                {meeting.precision_percent && (
                  <span className="font-mono text-[10px] bg-success-d text-[hsl(var(--success))] px-2 py-0.5 rounded-full">{t("meetingDetail.precision", { pct: meeting.precision_percent })}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <PDFReportGenerator
              data={{
                meeting: {
                  id: meeting.id,
                  title: meeting.title,
                  created_at: meeting.created_at,
                  duration_seconds: meeting.duration_seconds,
                  participants: participants.map(p => p.name),
                  meeting_type: meeting.meeting_type,
                },
                report: {
                  summary: meeting.summary,
                  key_decisions: decisions.map(d => d.content),
                  meeting_score: meeting.efficiency_score,
                },
                tasks: tasks.map(tk => ({
                  title: tk.title,
                  assignee: tk.assignee,
                  priority: tk.priority,
                  status: tk.status,
                  due_date: tk.deadline,
                })),
                transcription: transcription ? { content: transcription.full_text, language: meeting.language } : null,
                contacts: contacts.map(c => ({ name: c.name, company: c.company })),
              }}
              trigger={
                <button className="font-body text-xs text-muted-foreground bg-secondary border border-[hsl(var(--dark-5))] px-3.5 py-2 rounded-lg hover:text-foreground hover:border-[hsl(var(--fuchsia))]/40 transition-all">
                  📄 PDF Premium
                </button>
              }
            />
            <button
              onClick={() => {
                if (activeTab === "rapport") {
                  downloadReportPDF({
                    title: meeting.title,
                    date: formatDate(meeting.created_at),
                    duration: formatDuration(meeting.duration_seconds),
                    participants: participants.map(p => p.name),
                    summary: meeting.summary || "Aucun résumé disponible.",
                    decisions: decisions.map(d => d.content),
                    tasks: tasks.map(t => ({ text: t.title, assignee: t.assignee || "—", deadline: t.deadline ? format(new Date(t.deadline), "dd/MM/yyyy") : "—", priority: priorityLabel[t.priority] || t.priority })),
                    sentiment: meeting.sentiment_score || 0,
                  });
                } else if (transcription) {
                  downloadTranscriptionPDF(
                    meeting.title,
                    `${formatDate(meeting.created_at)} · ${formatDuration(meeting.duration_seconds)}`,
                    segments.map(s => ({ time: s.time, speaker: s.speaker, text: s.text }))
                  );
                }
              }}
              className="font-body text-xs text-muted-foreground bg-secondary border border-[hsl(var(--dark-5))] px-3.5 py-2 rounded-lg hover:text-foreground hover:border-[hsl(var(--fuchsia))]/40 transition-all"
            >
              📥 {activeTab === "rapport" ? t("meetingDetail.pdfReport") : t("meetingDetail.pdfTranscription")}
            </button>
            {meeting.status === "completed" && (
              <>
                <button
                  onClick={async () => {
                    if (!user) return;
                    setSendingEmail(true);
                    try {
                      const { error: sendErr } = await supabase.functions.invoke("send-email-report", {
                        body: { meetingId: id, userId: user.id },
                      });
                      if (sendErr) throw sendErr;
                      toast({ title: "Rapport envoyé ✓", description: "Envoyé à votre adresse email" });
                    } catch (e: any) {
                      toast({ title: "Erreur d'envoi", description: e.message, variant: "destructive" });
                    } finally {
                      setSendingEmail(false);
                    }
                  }}
                  disabled={sendingEmail}
                  className="font-body text-xs text-muted-foreground bg-secondary border border-[hsl(var(--dark-5))] px-3.5 py-2 rounded-lg hover:text-foreground hover:border-[hsl(var(--fuchsia))]/40 transition-all disabled:opacity-50"
                >
                  {sendingEmail ? "⏳ Envoi…" : "📧 Envoyer par email"}
                </button>
                <ShareReportDialog
                  meetingId={id!}
                  reportId={report?.id}
                  meetingTitle={meeting.title}
                >
                  <button className="font-body text-xs text-muted-foreground bg-secondary border border-[hsl(var(--dark-5))] px-3.5 py-2 rounded-lg hover:text-foreground hover:border-[hsl(var(--fuchsia))]/40 transition-all">
                    🔗 Partager
                  </button>
                </ShareReportDialog>
              </>
            )}
          </div>
        </div>

        {isInProgress && (
          <div className="flex items-center gap-3 px-5 py-3 bg-[hsl(var(--fuchsia))]/10 rounded-t-lg mb-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--fuchsia))] animate-pulse" />
            <div className="flex-1">
              <span className="font-mono text-[11px] text-[hsl(var(--fuchsia-l))] font-medium">
                {meeting.status === "pending" && `⏳ ${t("status.pending")}…`}
                {meeting.status === "transcribing" && `🎙 ${t("status.transcribing")}…`}
                {meeting.status === "analyzing" && `🧠 ${t("status.analyzing")}…`}
              </span>
              <div className="w-full bg-muted/30 rounded-full h-1.5 mt-1.5">
                <div className={`h-1.5 rounded-full bg-gradient-primary transition-all duration-1000 ${
                  meeting.status === "pending" ? "w-[10%]" : meeting.status === "transcribing" ? "w-[40%]" : "w-[75%]"
                }`} />
              </div>
            </div>
          </div>
        )}
        {meeting.status === "failed" && (
          <div className="flex items-center gap-3 px-5 py-3 bg-destructive/10 rounded-t-lg mb-0">
            <span className="text-destructive">❌</span>
            <span className="font-mono text-[11px] text-destructive flex-1">
              {t("status.failed")}{meeting.error_message ? ` : ${meeting.error_message}` : ""}
            </span>
            <button onClick={retryTranscription} className="font-body text-xs text-destructive bg-destructive/10 border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/20 transition-colors">🔄</button>
          </div>
        )}
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map(t => {
            const disabled = isInProgress && t.id !== "transcription" && t.id !== "historique";
            return (
              <button key={t.id}
                onClick={() => !disabled && setActiveTab(t.id)}
                disabled={disabled}
                className={`font-body text-sm px-5 py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                  disabled
                    ? "text-muted-foreground/20 border-transparent cursor-not-allowed"
                    : activeTab === t.id
                      ? "text-foreground border-[hsl(var(--fuchsia))]"
                      : "text-muted-foreground/50 border-transparent hover:text-muted-foreground"
                }`}>
                {t.label} {disabled && "🔒"}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="px-4 sm:px-6 md:px-12 py-6 max-w-[1200px]" key={activeTab}>

        {/* ── TRANSCRIPTION ── */}
        {activeTab === "transcription" && (
          <div className="flex gap-0">
            <div className={`flex-1 ${showPanel ? "mr-0 lg:mr-[280px]" : ""}`}>
              <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <input
                    value={transcriptionSearch}
                    onChange={e => setTranscriptionSearch(e.target.value)}
                    placeholder={t("meetingDetail.searchTranscription")}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 font-mono text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-[hsl(var(--fuchsia))]"
                  />
                </div>
                <button onClick={() => setShowPanel(!showPanel)} className="font-body text-[12px] text-[hsl(var(--fuchsia-l))] bg-fuchsia-d px-3 py-2 rounded-lg">
                  {showPanel ? t("meetingDetail.hideEntities") : t("meetingDetail.showEntities")}
                </button>
              </div>

              {segments.length === 0 ? (
                <div className="bg-secondary rounded-xl p-12 text-center">
                  <p className="text-3xl mb-3">📝</p>
                  <p className="font-body text-muted-foreground">{t("meetingDetail.noTranscription")}</p>
                  {isInProgress && <p className="font-mono text-[12px] text-[hsl(var(--fuchsia-l))] mt-2 animate-pulse">{t("meetingDetail.transcriptionInProgress")}</p>}
                </div>
              ) : (
                <div className="bg-secondary rounded-xl p-4 sm:p-6 max-h-[calc(100vh-320px)] overflow-y-auto space-y-5">
                  <div className="text-center font-mono text-[10px] text-muted-foreground/40 border-t border-dashed border-[hsl(var(--dark-5))] pt-3">
                    —————————————— {t("meetingDetail.meetingStart")} ——————————————
                  </div>
                  {segments
                    .filter(s => !transcriptionSearch || s.text.toLowerCase().includes(transcriptionSearch.toLowerCase()) || s.speaker.toLowerCase().includes(transcriptionSearch.toLowerCase()))
                    .map((s, i) => {
                    const sc = speakerColorMap[s.speaker] || SPEAKER_COLORS[0];
                    return (
                      <div key={i} className="flex gap-2 sm:gap-3">
                        <span className="font-mono text-[11px] text-muted-foreground/40 min-w-[60px] sm:min-w-[75px] shrink-0 pt-0.5">[{s.time}]</span>
                        <div className="flex gap-2.5 min-w-0">
                          <div className={`w-[6px] rounded-sm shrink-0 ${sc.bar}`} />
                          <div className="min-w-0">
                            <span className={`font-mono text-[11px] uppercase ${sc.text} block mb-1`}>{s.speaker}</span>
                            <p className="font-mono text-[13px] text-foreground leading-[1.9] break-words">{s.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {transcription && (
                    <div className="text-center font-mono text-[10px] text-muted-foreground/40 border-t border-dashed border-[hsl(var(--dark-5))] pt-3 mt-4">
                      {transcription.word_count} mots · {transcription.language?.toUpperCase() || "FR"}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Entity panel */}
            {showPanel && (
              <div className="hidden lg:block fixed right-0 top-[60px] bottom-0 w-[280px] bg-card border-l border-border p-5 overflow-y-auto z-10">
                <h3 className="font-display font-bold text-sm text-foreground mb-4">{t("meetingDetail.extractedEntities")}</h3>
                <div className="mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[hsl(var(--fuchsia-l))] mb-2">{t("meetingDetail.tasksCount", { count: tasks.length })}</p>
                  {tasks.filter(t => t.status !== "done").map(t => (
                    <div key={t.id} className="bg-secondary rounded-md p-2 mb-1.5 font-body text-[12px] text-foreground">{t.title}</div>
                  ))}
                </div>
                <div className="mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[hsl(var(--violet-l))] mb-2">{t("meetingDetail.decisionsCount", { count: decisions.length })}</p>
                  {decisions.map(d => (
                    <div key={d.id} className="bg-secondary rounded-md p-2 mb-1.5 font-body text-[12px] text-foreground">{d.content}</div>
                  ))}
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[hsl(var(--success))] mb-2">{t("meetingDetail.prospectsCount", { count: contacts.length })}</p>
                  {contacts.map(c => (
                    <div key={c.id} className="bg-secondary rounded-md p-2 mb-1.5 font-body text-[12px] text-foreground">{c.name}{c.company ? ` — ${c.company}` : ""}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSE ── */}
        {activeTab === "analyse" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            <div className="space-y-4">
              {/* Executive summary */}
              <div className="bg-card border border-border rounded-[14px] p-5 sm:p-7">
               <h3 className="font-display font-bold text-base text-foreground mb-3">{t("meetingDetail.executiveSummary")}</h3>
                <p className="font-body text-[15px] text-muted-foreground leading-[1.8]">
                  {meeting.summary || t("meetingDetail.noSummary")}
                </p>
              </div>

              {/* Speakers */}
              {speakerNames.length > 0 && (
                <div className="bg-card border border-border rounded-[14px] p-5 sm:p-7">
                  <h3 className="font-display font-bold text-base text-foreground mb-5">{t("meetingDetail.speakers")}</h3>
                  <div className="space-y-3">
                    {speakerNames.map((name, i) => {
                      const count = segments.filter(s => s.speaker === name).length;
                      const totalWords = segments.filter(s => s.speaker === name).reduce((sum, s) => sum + s.text.split(/\s+/).length, 0);
                      const totalAllWords = segments.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0);
                      const pct = totalAllWords > 0 ? Math.round((totalWords / totalAllWords) * 100) : 0;
                      const sc = SPEAKER_COLORS[i % SPEAKER_COLORS.length];
                      const initials = name.split(/\s+/).map(w => w[0]).join("").slice(0, 2);
                      return (
                        <div key={name} className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${sc.gradient} flex items-center justify-center font-display font-extrabold text-[10px] text-white shrink-0`}>{initials}</div>
                          <span className="font-body text-sm text-foreground w-28 shrink-0 truncate">{name}</span>
                          <div className="flex-1 h-1.5 bg-[hsl(var(--dark-4))] rounded-full">
                            <div className="h-1.5 bg-gradient-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-[12px] text-muted-foreground w-10 text-right">{pct}%</span>
                          <span className="font-mono text-[10px] text-muted-foreground/50 w-14 text-right">{count} int.</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Sentiment */}
              {meeting.sentiment_score != null && (
                <div className="bg-card border border-border rounded-[14px] p-5 sm:p-7">
                  <h3 className="font-display font-bold text-base text-foreground mb-4">{t("meetingDetail.sentimentAnalysis")}</h3>
                  <SentimentGauge value={meeting.sentiment_score} />
                </div>
              )}

              {/* Efficiency Score */}
              {meeting.efficiency_score != null && (
                <div className="bg-card border border-primary/20 rounded-[14px] p-5 sm:p-7">
                  <h3 className="font-display font-bold text-base text-foreground mb-4">⚡ {t("meetingDetail.efficiencyScore", "Score d'efficacité")}</h3>
                  <EfficiencyScore
                    score={meeting.efficiency_score}
                    breakdown={meeting.efficiency_breakdown as any}
                    size="md"
                  />
                  <div className="mt-4">
                    <ImprovementTips
                      score={meeting.efficiency_score}
                      breakdown={meeting.efficiency_breakdown as any}
                    />
                  </div>
                </div>
              )}

              {/* Decisions */}
              <div className="bg-card border border-border rounded-[14px] p-5 sm:p-7">
                <h3 className="font-display font-bold text-base text-foreground mb-4">{t("meetingDetail.decisionsTaken", { count: decisions.length })}</h3>
                {decisions.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground">{t("meetingDetail.noDecisions")}</p>
                ) : (
                  <div className="space-y-3">
                    {decisions.map((d, i) => (
                      <div key={d.id}>
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-[11px] text-[hsl(var(--violet-l))] font-bold shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                          <p className="font-body text-sm text-foreground leading-relaxed">{d.content}</p>
                        </div>
                        {d.source_timestamp && (
                          <p className="font-mono text-[10px] text-muted-foreground/50 ml-6 mt-0.5">[{d.source_timestamp}]</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prospects */}
              {contacts.length > 0 && (
                <div className="bg-card border border-[rgba(16,185,129,0.2)] rounded-[14px] p-5 sm:p-7">
                  <h3 className="font-display font-bold text-base text-foreground mb-4">{t("meetingDetail.prospects", { count: contacts.length })}</h3>
                  {contacts.map(c => {
                    const initials = c.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div key={c.id} className="flex items-start gap-3 mb-4 last:mb-0">
                        <div className="w-9 h-9 rounded-full bg-success-d flex items-center justify-center font-mono text-[10px] text-[hsl(var(--success))] shrink-0">{initials}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-foreground">{c.name}{c.company ? ` · ${c.company}` : ""}</p>
                          {c.interest_signals && <p className="font-body text-[13px] text-muted-foreground italic mt-0.5">"{c.interest_signals}"</p>}
                          {c.score != null && <p className="font-mono text-[11px] text-[hsl(var(--success))] mt-1">{t("meetingDetail.score", { score: c.score })}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TÂCHES ── */}
        {activeTab === "taches" && (
          <div>
            <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[11px] bg-[hsl(var(--dark-4))] text-muted-foreground px-3 py-1 rounded-full">{t("meetingDetail.totalTasks", { count: tasks.length })}</span>
                <span className="font-mono text-[11px] bg-success-d text-[hsl(var(--success))] px-3 py-1 rounded-full">{t("meetingDetail.validated", { count: checkedTasks.size })}</span>
                <span className="font-mono text-[11px] bg-fuchsia-d text-[hsl(var(--fuchsia-l))] px-3 py-1 rounded-full">{t("meetingDetail.pendingTasks", { count: tasks.length - checkedTasks.size })}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-secondary border border-border rounded-lg p-1">
                  <button onClick={() => setTaskView("list")} className={`px-3 py-1 rounded-md font-body text-[12px] ${taskView === "list" ? "bg-[hsl(var(--dark-5))] text-foreground" : "text-muted-foreground"}`}>{t("meetingDetail.list")}</button>
                  <button onClick={() => setTaskView("kanban")} className={`px-3 py-1 rounded-md font-body text-[12px] ${taskView === "kanban" ? "bg-[hsl(var(--dark-5))] text-foreground" : "text-muted-foreground"}`}>{t("meetingDetail.kanban")}</button>
                </div>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-card border border-border rounded-[14px] p-12 text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="font-body text-muted-foreground">{t("meetingDetail.noTasksExtracted")}</p>
              </div>
            ) : taskView === "list" ? (
              <div className="bg-card border border-border rounded-[14px] overflow-x-auto">
                <div className="hidden sm:grid grid-cols-[auto_1fr_120px_100px_80px_90px] gap-3 px-5 py-3 bg-secondary font-mono text-[10px] uppercase tracking-wide text-muted-foreground/50 min-w-[600px]">
                  <span>☐</span><span>{t("meetingDetail.task")}</span><span>{t("meetingDetail.responsible")}</span><span>{t("meetingDetail.deadline")}</span><span>{t("meetingDetail.priority")}</span><span>{t("meetingDetail.statusLabel")}</span>
                </div>
                {tasks.map(t => {
                  const sb = statusBadge[t.status] || statusBadge.pending;
                  const checked = checkedTasks.has(t.id);
                  return (
                    <div key={t.id} className="flex flex-col sm:grid sm:grid-cols-[auto_1fr_120px_100px_80px_90px] gap-2 sm:gap-3 px-5 py-3.5 border-t border-border/40 items-start sm:items-center hover:bg-secondary/50 transition-colors">
                      <button onClick={() => toggleTask(t.id)}
                        className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center transition-all shrink-0 ${checked ? "bg-gradient-primary border-transparent" : "border-[hsl(var(--dark-5))] hover:border-[hsl(var(--fuchsia))]"}`}>
                        {checked && <span className="text-white text-[9px]">✓</span>}
                      </button>
                      <span className={`font-body text-[13px] ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</span>
                      <span className="font-body text-xs text-muted-foreground">{t.assignee || "—"}</span>
                      <span className="font-mono text-[11px] text-muted-foreground/50">{t.deadline ? format(new Date(t.deadline), "dd/MM/yyyy") : "—"}</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${priorityStyle[t.priority]}`}>{priorityLabel[t.priority]}</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${sb.cls}`}>{sb.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-h-[400px]">
                {[
                  { title: t("meetingDetail.todo"), status: "pending", badge: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]" },
                  { title: t("meetingDetail.inProgress"), status: "in_progress", badge: "bg-violet-d text-[hsl(var(--violet-l))]" },
                  { title: t("meetingDetail.completed"), status: "done", badge: "bg-success-d text-[hsl(var(--success))]" },
                ].map(col => {
                  const colTasks = tasks.filter(t => t.status === col.status);
                  return (
                    <div key={col.status}>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-display font-bold text-sm text-foreground">{col.title}</h4>
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${col.badge}`}>{colTasks.length}</span>
                      </div>
                      <div className="space-y-2">
                        {colTasks.map(t => (
                          <div key={t.id} className="bg-secondary border border-[hsl(var(--dark-5))] rounded-[10px] p-3.5">
                            <p className="font-body text-[13px] text-foreground mb-2">{t.title}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-muted-foreground/50">{t.assignee || "—"}</span>
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${priorityStyle[t.priority]}`}>{priorityLabel[t.priority]}</span>
                            </div>
                            {t.deadline && <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">{format(new Date(t.deadline), "dd/MM/yyyy")}</p>}
                          </div>
                        ))}
                        {colTasks.length === 0 && <p className="font-body text-[12px] text-muted-foreground/40 text-center py-8">{t("meetingDetail.noTasks")}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIONS (Confirmation Gate) ── */}
        {activeTab === "actions" && meeting.status === "completed" && (
          <div className="max-w-[900px]">
            <ConfirmationGate sessionId={(meeting as any).session_id || meeting.id} meetingId={meeting.id} />
          </div>
        )}
        {activeTab === "actions" && meeting.status !== "completed" && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">⏳</p>
            <p className="font-body text-sm text-muted-foreground">
              Les actions seront disponibles une fois l'analyse terminée.
            </p>
          </div>
        )}

        {/* ── RAPPORT ── */}
        {activeTab === "rapport" && (
          <div>
            <div className="bg-[#F8F8FC] rounded-[14px] p-6 sm:p-12 max-w-[760px] mx-auto text-[#1A1A2E]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2" style={{ borderImage: "linear-gradient(135deg, #E91E8C, #7C3AED) 1" }}>
                <div className="bg-gradient-primary rounded-lg px-4 py-2">
                  <span className="font-display font-extrabold text-sm text-white">BraindCode</span>
                </div>
                <span className="font-display font-bold text-sm text-[#E91E8C]">RapidoMeet ™</span>
              </div>

              <h2 className="font-display font-extrabold text-xl sm:text-2xl mb-1 tracking-[-0.5px]">{t("meetingDetail.meetingReport")}</h2>
              <p className="font-display font-bold text-lg mb-6">{meeting.title}</p>

              <div className="bg-[#F0F0F8] rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ["📅 Date", formatDate(meeting.created_at)],
                  ["⏱ Durée", formatDuration(meeting.duration_seconds)],
                  ["👥 Participants", participants.map(p => p.name).join(" · ") || "—"],
                  ["📹 Canal", meeting.channel || "—"],
                  ["🏷 Type", meetingTypeLabel[meeting.meeting_type] || meeting.meeting_type],
                ].map(([label, val]) => (
                  <div key={label}>
                    <span className="font-mono text-[11px] text-[#9898B0] uppercase">{label}</span>
                    <p className="font-body text-sm text-[#1A1A2E] mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <p className="font-mono text-[11px] text-[#E91E8C] uppercase tracking-[2px] mb-2">{t("meetingDetail.executiveSummaryLabel")}</p>
                <p className="font-body text-[15px] text-[#333] leading-[1.8]">{meeting.summary || t("meetingDetail.summaryUnavailable")}</p>
              </div>

              {decisions.length > 0 && (
                <div className="mb-6">
                  <p className="font-mono text-[11px] text-[#7C3AED] uppercase tracking-[2px] mb-2">{t("meetingDetail.decisionsMade")}</p>
                  {decisions.map((d, i) => (
                    <div key={d.id} className="flex items-start gap-2 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2 shrink-0" />
                      <p className="font-body text-sm text-[#1A1A2E]">{d.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {tasks.length > 0 && (
                <div className="mb-6">
                  <p className="font-mono text-[11px] text-[#E91E8C] uppercase tracking-[2px] mb-3">{t("meetingDetail.assignedTasks")}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-[#E0E0E8] rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-[#E8E8F0]">
                          <th className="text-left font-mono text-[10px] uppercase p-2.5 text-[#55556A]">{t("meetingDetail.task")}</th>
                          <th className="text-left font-mono text-[10px] uppercase p-2.5 text-[#55556A]">{t("meetingDetail.responsible")}</th>
                          <th className="text-left font-mono text-[10px] uppercase p-2.5 text-[#55556A]">{t("meetingDetail.deadline")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((t, i) => (
                          <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-[#F8F8FC]"}>
                            <td className="p-2.5 font-body text-[#1A1A2E]">☐ {t.title}</td>
                            <td className="p-2.5 font-body text-[#55556A]">{t.assignee || "—"}</td>
                            <td className="p-2.5 font-mono text-[12px] text-[#55556A]">{t.deadline ? format(new Date(t.deadline), "dd/MM/yyyy") : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {contacts.length > 0 && (
                <div className="mb-6">
                  <p className="font-mono text-[11px] text-[#10B981] uppercase tracking-[2px] mb-2">{t("meetingDetail.detectedContacts")}</p>
                  {contacts.map(c => (
                    <p key={c.id} className="font-body text-sm text-[#1A1A2E]">✓ {c.name}{c.company ? ` (${c.company})` : ""}{c.score ? ` — Score ${c.score}/10` : ""}</p>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-4 text-center" style={{ borderTop: "2px solid transparent", borderImage: "linear-gradient(135deg, #E91E8C, #7C3AED) 1" }}>
                <p className="font-mono text-[10px] text-[#9898B0]">{t("meetingDetail.autoGenerated")}</p>
                <p className="font-mono text-[10px] text-[#9898B0]">{formatDate(meeting.created_at)} · rapidomeet.io</p>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORIQUE ── */}
        {activeTab === "historique" && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📜</p>
            <p className="font-body text-muted-foreground">{t("meetingDetail.historyPlaceholder")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

function WorkspaceShareButton({ meetingId }: { meetingId: string }) {
  const { currentWorkspace, shareMeeting } = useWorkspace();
  const [sharing, setSharing] = useState(false);
  if (!currentWorkspace) return null;
  return (
    <button
      disabled={sharing}
      onClick={async (e) => { e.stopPropagation(); setSharing(true); try { await shareMeeting(meetingId); } finally { setSharing(false); } }}
      className="font-body text-xs text-muted-foreground bg-secondary border border-[hsl(var(--dark-5))] px-3.5 py-2 rounded-lg hover:text-foreground hover:border-[hsl(var(--fuchsia))]/40 transition-all disabled:opacity-50"
    >
      {sharing ? "⏳…" : `👥 Partager avec ${currentWorkspace.name}`}
    </button>
  );
}

export default ReunionDetail;
