import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface Segment { speaker: string; timestamp: string; text: string; }
interface TaskItem { title: string; assignee: string | null; priority: string; deadline: string | null; }
interface DecisionItem { content: string; source_timestamp: string | null; }
interface ContactItem { name: string; company: string | null; }

const TranscriptionLive = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("app");

  const [meetingTitle, setMeetingTitle] = useState("...");
  const [meetingStatus, setMeetingStatus] = useState("pending");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: meeting } = await supabase.from("meetings").select("title, status, created_at, duration_seconds").eq("id", id).single();
      if (meeting) { setMeetingTitle(meeting.title); setMeetingStatus(meeting.status); if (meeting.duration_seconds) setElapsed(meeting.duration_seconds); }
      const { data: trans } = await supabase.from("transcriptions").select("segments").eq("meeting_id", id).single();
      if (trans?.segments && Array.isArray(trans.segments)) setSegments(trans.segments as unknown as Segment[]);
      const { data: tasksData } = await supabase.from("extracted_tasks").select("title, assignee, priority, deadline").eq("meeting_id", id);
      if (tasksData) setTasks(tasksData);
      const { data: decisionsData } = await supabase.from("extracted_decisions").select("content, source_timestamp").eq("meeting_id", id);
      if (decisionsData) setDecisions(decisionsData);
      const { data: contactsData } = await supabase.from("detected_contacts").select("name, company").eq("meeting_id", id);
      if (contactsData) setContacts(contactsData);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`live-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meetings', filter: `id=eq.${id}` }, (payload) => {
        const row = payload.new as any;
        setMeetingStatus(row.status);
        if (row.duration_seconds) setElapsed(row.duration_seconds);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    if (meetingStatus === "transcribing" || meetingStatus === "analyzing") {
      const timer = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [meetingStatus]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [segments]);

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const speakerColors: Record<string, string> = {};
  const palette = ["hsl(var(--fuchsia))", "hsl(var(--violet-l))", "hsl(var(--success))", "#F59E0B", "#60A5FA", "#F472B6"];
  segments.forEach(s => { if (!speakerColors[s.speaker]) speakerColors[s.speaker] = palette[Object.keys(speakerColors).length % palette.length]; });

  const isActive = meetingStatus === "transcribing" || meetingStatus === "analyzing";
  const isDone = meetingStatus === "completed" || meetingStatus === "partial";

  const pipelineSteps = [
    { name: t("liveTranscription.captureAudio"), icon: "🎙", done: true },
    { name: t("liveTranscription.transcriptionStep"), icon: "📝", done: meetingStatus !== "pending", active: meetingStatus === "transcribing" },
    { name: t("liveTranscription.nlpAnalysis"), icon: "🧠", done: isDone, active: meetingStatus === "analyzing" },
    { name: t("liveTranscription.extraction"), icon: "📌", done: isDone },
    { name: t("liveTranscription.reportStep"), icon: "📄", done: isDone },
  ];

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-60px)]"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      <div className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {isActive && (
            <span className="flex items-center gap-1.5 font-mono text-[11px] sm:text-[12px] text-destructive uppercase shrink-0">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" /> {t("liveTranscription.recording")}
            </span>
          )}
          {isDone && <span className="font-mono text-[11px] sm:text-[12px] text-[hsl(var(--success))] shrink-0">✅ {t("liveTranscription.done")}</span>}
          <span className="font-display font-bold text-sm sm:text-lg text-foreground truncate">{meetingTitle}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="font-mono text-lg sm:text-xl text-foreground tracking-wider">{fmt(elapsed)}</span>
          {isDone && (
            <Link to={`/app/reunions/${id}`} className="bg-gradient-primary text-white font-display font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg shadow-fuchsia">
              {t("liveTranscription.viewReport")}
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="hidden md:block w-[260px] bg-card border-r border-border p-5 overflow-y-auto shrink-0">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-muted-foreground/50 mb-5">{t("liveTranscription.pipeline")}</p>
          <div className="space-y-4">
            {pipelineSteps.map((step, i) => (
              <div key={i} className="flex gap-3 relative">
                {i < pipelineSteps.length - 1 && <div className={`absolute left-3 top-7 w-0.5 h-[calc(100%+8px)] ${step.done ? "bg-gradient-primary" : "bg-border"}`} />}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] ${step.done ? "bg-success-d text-[hsl(var(--success))]" : step.active ? "bg-fuchsia-d text-[hsl(var(--fuchsia))] animate-pulse" : "bg-secondary text-muted-foreground/40"}`}>
                  {step.done ? "✓" : step.active ? "⟳" : "—"}
                </div>
                <div>
                  <p className={`font-body text-sm ${step.done || step.active ? "text-foreground" : "text-muted-foreground/50"}`}>{step.icon} {step.name}</p>
                  {step.active && <p className="font-mono text-[10px] text-[hsl(var(--fuchsia-l))] mt-0.5 animate-pulse">{t("liveTranscription.inProgress")}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-3 sm:px-5 py-2 flex items-center gap-3 border-b border-border">
            <span className="font-mono text-[11px] text-muted-foreground/60">{t("liveTranscription.transcriptionLabel")}</span>
            <span className="font-mono text-[10px] text-muted-foreground/40">{t("liveTranscription.segments", { count: segments.length })}</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
            {segments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <span className="text-3xl block mb-2">📝</span>
                <p className="font-body text-sm">{isActive ? t("liveTranscription.transcribing") : t("liveTranscription.noTranscription")}</p>
              </div>
            ) : (
              <>
                <div className="text-center font-mono text-[10px] text-muted-foreground/30 border-t border-dashed border-border pt-3">
                  —————— {t("liveTranscription.meetingStart")} ——————
                </div>
                {segments.map((s, i) => (
                  <div key={i} className="flex gap-2 sm:gap-3">
                    <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/30 min-w-[50px] sm:min-w-[75px] shrink-0 pt-0.5">[{s.timestamp}]</span>
                    <div className="flex gap-2 sm:gap-2.5 min-w-0">
                      <div className="w-[5px] sm:w-[6px] rounded-sm shrink-0" style={{ backgroundColor: speakerColors[s.speaker] || palette[0] }} />
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] sm:text-[11px] uppercase block mb-1" style={{ color: speakerColors[s.speaker] || palette[0] }}>{s.speaker}</span>
                        <p className="font-mono text-[12px] sm:text-[13px] text-foreground leading-[1.8]">"{s.text}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="w-full md:w-[300px] bg-card border-t md:border-t-0 md:border-l border-border p-3 sm:p-5 overflow-y-auto shrink-0 max-h-[300px] md:max-h-none">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-display font-bold text-sm text-foreground">{t("liveTranscription.tasksLabel")}</span>
              <span className="w-5 h-5 rounded-full bg-[hsl(var(--fuchsia))] text-white font-mono text-[10px] flex items-center justify-center">{tasks.length}</span>
            </div>
            {tasks.length === 0 ? (
              <p className="font-body text-[12px] text-muted-foreground/50">{isActive ? t("liveTranscription.extracting") : t("liveTranscription.noItems")}</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((tk, i) => (
                  <div key={i} className="bg-secondary border border-border rounded-[10px] p-2.5 sm:p-3">
                    <p className="font-body text-[12px] sm:text-[13px] text-foreground">{tk.title}</p>
                    <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/50 mt-0.5">→ {tk.assignee || t("liveTranscription.notAssigned")}</p>
                    <span className={`font-mono text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${tk.priority === "high" || tk.priority === "critical" ? "bg-[rgba(239,68,68,0.15)] text-destructive" : "bg-secondary text-muted-foreground"}`}>{tk.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-display font-bold text-sm text-foreground">{t("liveTranscription.decisionsLabel")}</span>
              <span className="w-5 h-5 rounded-full bg-[hsl(var(--violet))] text-white font-mono text-[10px] flex items-center justify-center">{decisions.length}</span>
            </div>
            {decisions.length === 0 ? (
              <p className="font-body text-[12px] text-muted-foreground/50">{isActive ? t("liveTranscription.waiting") : t("liveTranscription.noItems")}</p>
            ) : (
              <div className="space-y-2">
                {decisions.map((d, i) => (
                  <div key={i} className="bg-secondary rounded-md p-2.5"><p className="font-body text-[11px] sm:text-[12px] text-foreground">{d.content}</p></div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-display font-bold text-sm text-foreground">{t("liveTranscription.contactsLabel")}</span>
              <span className="w-5 h-5 rounded-full bg-[hsl(var(--success))] text-white font-mono text-[10px] flex items-center justify-center">{contacts.length}</span>
            </div>
            {contacts.length === 0 ? (
              <p className="font-body text-[12px] text-muted-foreground/50">{isActive ? t("liveTranscription.detecting") : t("liveTranscription.noItems")}</p>
            ) : (
              <div className="space-y-2">
                {contacts.map((c, i) => (
                  <div key={i} className="bg-secondary rounded-md p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-success-d flex items-center justify-center font-mono text-[9px] text-[hsl(var(--success))] shrink-0">
                      {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-body text-[12px] text-foreground">{c.name}</p>
                      <p className="font-body text-[10px] text-muted-foreground/50">{c.company || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionLive;
