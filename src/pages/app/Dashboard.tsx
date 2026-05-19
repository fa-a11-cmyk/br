import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import OpenClawStatusCard from "@/components/app/OpenClawStatusCard";
import PlanUsageWidget from "@/components/app/PlanUsageWidget";
import OnboardingChecklist from "@/components/app/OnboardingChecklist";
import { AppLogo } from "@/components/app/AppLogo";
import { useMeetings, Meeting, ExtractedTask } from "@/hooks/useMeetings";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/useSubscription";

/* ── Tutorial Progress Widget ── */
function TutorialProgressWidget({ userId }: { userId?: string }) {
  const [inProg, setInProg] = useState<any[]>([]);
  useEffect(() => {
    if (!userId) return;
    supabase.from("tutorial_progress")
      .select("*, tutorial_courses(title, slug, chapters_count)")
      .eq("user_id", userId).eq("course_completed", false)
      .order("updated_at", { ascending: false }).limit(2)
      .then(({ data }) => setInProg(data || []));
  }, [userId]);
  if (!inProg.length) return null;
  return (
    <Card className="p-4 mb-4 sm:mb-6">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">📖 Formations en cours</h3>
      <div className="space-y-3">
        {inProg.map((prog: any) => {
          const course = prog.tutorial_courses as any;
          const pct = Math.round((prog.completed_chapters?.length || 0) / (course?.chapters_count || 1) * 100);
          return (
            <Link key={prog.id} to={`/tutoriels/${course?.slug}`} className="block hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors">
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate font-medium">{course?.title}</span>
                <span className="text-muted-foreground text-xs ml-2">{pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
      <Link to="/tutoriels" className="text-xs text-primary hover:underline mt-3 block">Voir tous les cours →</Link>
    </Card>
  );
}

const typeStyle: Record<string, string> = {
  commercial: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
  tech: "bg-violet-d text-[hsl(var(--violet-l))]",
  retro: "bg-success-d text-[hsl(var(--success))]",
  onboarding: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]",
  rh: "bg-violet-d text-[hsl(var(--violet-l))]",
  marketing: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
  autre: "bg-[hsl(var(--dark-4))] text-muted-foreground",
};

/* ── AnimatedCounter ── */
const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const animated = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !animated.current) {
        animated.current = true;
        const start = performance.now();
        const dur = 1200;
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation("app");
  const { fetchMeetings, fetchTasks, fetchContacts } = useMeetings();
  const { toast } = useToast();
  const { plan, isPro, isFree, limits } = useSubscription();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allTasks, setAllTasks] = useState<ExtractedTask[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const dateFnsLocale = i18n.language === "en" ? enUS : fr;

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [m, ts, c] = await Promise.all([fetchMeetings(), fetchTasks(), fetchContacts()]);
      setMeetings(m);
      setAllTasks(ts);
      setContactsCount(c.length);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { loadDashboard(); }, []);

  // Auto-refresh KPIs every 30s
  useEffect(() => {
    const interval = setInterval(() => { loadDashboard(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-meetings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, (payload) => {
        const newRow = payload.new as Meeting | undefined;
        if (payload.eventType === 'UPDATE' && newRow?.status === 'completed') {
          toast({ title: t("dashboard.analysisComplete"), description: t("dashboard.analysisCompleteDesc", { title: newRow.title }) });
        } else if (payload.eventType === 'INSERT' && newRow) {
          toast({ title: t("dashboard.newMeetingToast"), description: t("dashboard.newMeetingToastDesc", { title: newRow.title }) });
        }
        loadDashboard();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const completedMeetings = meetings.filter(m => m.status === "completed").length;
  const pendingTasks = allTasks.filter(tk => tk.status === "pending" || tk.status === "in_progress");
  const doneTasks = allTasks.filter(tk => tk.status === "done").length;
  const taskCompletionPct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const statusMap: Record<string, { label: string; icon: string; cls: string }> = {
    completed: { label: t("status.completed"), icon: "✓", cls: "bg-success-d text-[hsl(var(--success))]" },
    partial: { label: t("status.partial"), icon: "⚠", cls: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]" },
    pending: { label: t("status.pending"), icon: "⏳", cls: "bg-[hsl(var(--dark-4))] text-muted-foreground" },
    transcribing: { label: t("status.transcribing"), icon: "🎙", cls: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))] animate-pulse" },
    analyzing: { label: t("status.analyzing"), icon: "🧠", cls: "bg-violet-d text-[hsl(var(--violet-l))] animate-pulse" },
    failed: { label: t("status.failed"), icon: "❌", cls: "bg-[rgba(239,68,68,0.12)] text-destructive" },
  };

  const kpis = [
    { icon: "🎙", bg: "bg-fuchsia-d", value: meetings.length, label: t("dashboard.meetingsProcessed"), link: "/app/reunions", delta: t("dashboard.completed", { count: completedMeetings }), deltaColor: "bg-success-d text-[hsl(var(--success))]" },
    { icon: "✅", bg: "bg-success-d", value: allTasks.length, label: t("dashboard.tasksCreated"), link: "/app/taches", delta: t("dashboard.percentCompleted", { pct: taskCompletionPct }), deltaColor: "bg-success-d text-[hsl(var(--success))]" },
    { icon: "📊", bg: "bg-violet-d", value: contactsCount, label: t("dashboard.contactsDetected"), link: "/app/taches", delta: t("dashboard.viaAI"), deltaColor: "bg-violet-d text-[hsl(var(--violet-l))]" },
    { icon: "📨", bg: "bg-fuchsia-d", value: completedMeetings, label: t("dashboard.reportsGenerated"), link: "/app/reunions", delta: t("dashboard.automatic"), deltaColor: "bg-[hsl(var(--dark-4))] text-muted-foreground" },
  ];

  const recentMeetings = meetings.slice(0, 5);
  const formatDate = (d: string) => { try { return format(new Date(d), "dd/MM · HH:mm", { locale: dateFnsLocale }); } catch { return d; } };
  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)} min` : "—";
  const firstName = user?.user_metadata?.first_name || (i18n.language === "en" ? "User" : i18n.language === "tn" ? "مستخدم" : "Utilisateur");

  return (
    <div>
      <div className="sticky top-[60px] z-20 backdrop-blur-xl bg-background/80 border-b border-border px-3 sm:px-4 md:px-12 pt-4 sm:pt-6 md:pt-8 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 mb-1">
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-xl sm:text-2xl md:text-[28px] tracking-tight text-foreground truncate">
              {t("dashboard.hello", { name: firstName })}
            </h1>
            <p className="font-body text-xs sm:text-sm text-muted-foreground mt-0.5">
              {format(new Date(), "EEEE d MMMM yyyy", { locale: dateFnsLocale })}
            </p>
          </div>
          <Link to="/app/reunions/nouvelle" className="flex items-center gap-2 font-display font-bold text-sm text-white bg-gradient-primary px-4 sm:px-5 py-2.5 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform shrink-0 w-full sm:w-auto justify-center">
            {t("dashboard.newMeeting")}
          </Link>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-12 py-4 sm:py-6 md:py-8 max-w-[1200px]">
        <div className="mb-6">
          <OnboardingChecklist />
        </div>
        <div className="mb-6">
          <PlanUsageWidget />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
          {kpis.map((k, i) => (
            <div key={i} onClick={() => navigate(k.link)}
              className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 cursor-pointer hover:border-primary/40 hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-[8px] sm:rounded-[10px] ${k.bg} flex items-center justify-center text-sm sm:text-lg`}>{k.icon}</div>
                <span className={`font-mono text-[9px] sm:text-[11px] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${k.deltaColor}`}>{k.delta}</span>
              </div>
              <p className="font-display font-extrabold text-2xl sm:text-3xl md:text-[44px] text-foreground tracking-[-2px] leading-none">
                {loading ? "—" : <AnimatedCounter target={k.value} />}
              </p>
              <p className="font-body text-[11px] sm:text-[13px] text-muted-foreground mt-1 line-clamp-2">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-display font-bold text-base sm:text-lg text-foreground">{t("dashboard.recentMeetings")}</h2>
              <Link to="/app/reunions" className="text-[hsl(var(--fuchsia-l))] font-body text-[12px] sm:text-[13px] hover:underline">{t("dashboard.seeAll")}</Link>
            </div>
            {loading ? (
              <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[hsl(var(--fuchsia))] border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : recentMeetings.length === 0 ? (
              <div className="bg-card border-2 border-dashed border-primary/30 rounded-xl p-6 sm:p-8 text-center">
                <p className="text-4xl mb-3">🎙</p>
                <h3 className="font-display font-bold text-base text-foreground mb-1">{t("dashboard.noMeetings")}</h3>
                <p className="font-body text-sm text-muted-foreground mb-4">Lancez votre première réunion pour commencer à exploiter RapidoMeet.</p>
                <Link to="/app/reunions/nouvelle" className="inline-flex items-center gap-2 font-display font-bold text-sm text-white bg-gradient-primary px-5 py-2.5 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform">
                  ⚡ {t("dashboard.start")}
                </Link>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-2.5">
                {recentMeetings.map(m => {
                  const st = statusMap[m.status] || statusMap.pending;
                  const participants = Array.isArray(m.participants) ? m.participants as any[] : [];
                  return (
                    <Link key={m.id} to={`/app/reunions/${m.id}`}
                      className="block bg-card border border-border rounded-xl sm:rounded-[14px] p-3 sm:p-[18px_20px] hover:border-[rgba(233,30,140,0.35)] hover:shadow-[0_4px_20px_rgba(233,30,140,0.08)] transition-all cursor-pointer group">
                      <div className="flex items-start gap-2 sm:gap-3 mb-2">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-fuchsia-d flex items-center justify-center text-sm sm:text-base shrink-0">🎙</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-bold text-[13px] sm:text-[15px] text-foreground truncate group-hover:text-[hsl(var(--fuchsia-l))] transition-colors">{m.title}</p>
                          <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/50 mt-0.5">{formatDate(m.created_at)} · {formatDuration(m.duration_seconds)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className={`font-mono text-[9px] sm:text-[10px] uppercase px-2 sm:px-2.5 py-0.5 rounded-full ${typeStyle[m.meeting_type] || typeStyle.autre}`}>{m.meeting_type}</span>
                        <span className={`font-mono text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full ${st.cls}`}>{st.icon} {st.label}</span>
                        {participants.length > 0 && <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground/50 ml-auto">{t("dashboard.participants", { count: participants.length })}</span>}
                      </div>
                      {m.summary && <p className="font-body text-xs sm:text-sm text-muted-foreground mt-2 pt-2 border-t border-border/40 truncate">{m.summary}</p>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <h2 className="font-display font-bold text-base sm:text-lg text-foreground">{t("dashboard.pendingTasks")}</h2>
              <span className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] rounded-full bg-[hsl(var(--fuchsia))] text-white font-mono text-[10px] sm:text-xs flex items-center justify-center">{pendingTasks.length}</span>
            </div>
            {pendingTasks.length === 0 ? (
              <div className="bg-secondary border border-border rounded-xl p-6 text-center">
                <p className="font-body text-sm text-muted-foreground">{t("dashboard.noPendingTasks")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 5).map(tk => (
                  <div key={tk.id} className="bg-secondary border border-[hsl(var(--dark-5))] rounded-[10px] p-3 sm:p-3.5">
                    <p className="font-body text-xs sm:text-sm text-foreground">{tk.title}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                      {tk.assignee && <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/50">→ {tk.assignee}</span>}
                      <span className={`font-mono text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded ${tk.priority === "high" || tk.priority === "critical" ? "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]" : "bg-[hsl(var(--dark-4))] text-muted-foreground"}`}>{tk.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/app/taches" className="block text-center font-body text-[12px] sm:text-[13px] text-[hsl(var(--fuchsia-l))] hover:underline mt-2">
              {t("dashboard.seeAllTasks")}
            </Link>
          </div>
        </div>
        <TutorialProgressWidget userId={user?.id} />

        <div className="mb-4 sm:mb-6"><OpenClawStatusCard /></div>

        <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-7 mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="font-display font-bold text-sm sm:text-lg text-foreground">{t("dashboard.activeIntegrations")}</h2>
            <Link to="/app/integrations" className="text-[hsl(var(--fuchsia-l))] font-body text-[12px] sm:text-[13px] hover:underline">{t("dashboard.manage")}</Link>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {[
              { name: "Google Meet", domain: "meet.google.com" },
              { name: "WhatsApp", domain: "whatsapp.com" },
              { name: "N8N", domain: "n8n.io" },
            ].map((app) => (
              <div key={app.name} className="flex items-center gap-1.5 sm:gap-2 bg-[hsl(var(--dark-3))] border border-border rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5">
                <AppLogo domain={app.domain} name={app.name} size={16} />
                <span className="font-body text-[11px] sm:text-[12px] text-muted-foreground">{app.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
