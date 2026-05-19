import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { useTheme } from "@/hooks/useTheme";
import { useMeetings, Meeting, ExtractedTask } from "@/hooks/useMeetings";
import { useTranslation } from "react-i18next";
import { EfficiencyScore } from "@/components/app/EfficiencyScore";
import { Link } from "react-router-dom";

const Analytics = () => {
  const { t } = useTranslation("app");
  const periods = [t("analytics.period7"), t("analytics.period30"), t("analytics.period90")];
  const [activePeriod, setActivePeriod] = useState(periods[1]);
  const { isDark } = useTheme();
  const { fetchMeetings, fetchTasks, fetchContacts } = useMeetings();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [m, tk, c] = await Promise.all([fetchMeetings(), fetchTasks(), fetchContacts()]);
        // Filter by selected period
        const periodIndex = periods.indexOf(activePeriod);
        const daysMap = [7, 30, 90];
        const days = daysMap[periodIndex] ?? 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const filteredMeetings = m.filter(mt => new Date(mt.created_at) >= cutoff);
        const filteredTasks = tk.filter(t => new Date(t.created_at) >= cutoff);
        setMeetings(filteredMeetings);
        setTasks(filteredTasks);
        setContactsCount(c.filter((ct: any) => new Date(ct.created_at) >= cutoff).length);
      } catch { }
      setLoading(false);
    })();
  }, [activePeriod]);

  const completedMeetings = meetings.filter(m => m.status === "completed");
  const avgPrecision = completedMeetings.length > 0 ? Math.round(completedMeetings.reduce((s, m) => s + (m.precision_percent || 0), 0) / completedMeetings.length) : 0;
  const avgDuration = completedMeetings.length > 0 ? Math.round(completedMeetings.reduce((s, m) => s + (m.duration_seconds || 0), 0) / completedMeetings.length) : 0;

  // Efficiency stats
  const scoredMeetings = completedMeetings.filter(m => m.efficiency_score != null);
  const avgEfficiency = scoredMeetings.length > 0 ? Math.round(scoredMeetings.reduce((s, m) => s + (m.efficiency_score || 0), 0) / scoredMeetings.length) : 0;
  const avgBreakdown = scoredMeetings.length > 0 ? {
    decisions: Math.round(scoredMeetings.reduce((s, m) => s + ((m.efficiency_breakdown as any)?.decisions || 0), 0) / scoredMeetings.length),
    tasks_completion: Math.round(scoredMeetings.reduce((s, m) => s + ((m.efficiency_breakdown as any)?.tasks_completion || 0), 0) / scoredMeetings.length),
    sentiment: Math.round(scoredMeetings.reduce((s, m) => s + ((m.efficiency_breakdown as any)?.sentiment || 0), 0) / scoredMeetings.length),
    duration: Math.round(scoredMeetings.reduce((s, m) => s + ((m.efficiency_breakdown as any)?.duration || 0), 0) / scoredMeetings.length),
  } : undefined;

  const efficiencyTrend = scoredMeetings
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-15)
    .map(m => ({
      date: new Date(m.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      score: m.efficiency_score || 0,
      title: m.title,
    }));

  const byType = completedMeetings.reduce((acc, m) => {
    if (m.efficiency_score != null) {
      if (!acc[m.meeting_type]) acc[m.meeting_type] = { scores: [], type: m.meeting_type };
      acc[m.meeting_type].scores.push(m.efficiency_score);
    }
    return acc;
  }, {} as Record<string, { scores: number[]; type: string }>);
  const typeAvgs = Object.values(byType).map(t => ({
    type: t.type, avg: Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length),
  }));

  const bestMeetings = [...scoredMeetings].sort((a, b) => (b.efficiency_score || 0) - (a.efficiency_score || 0)).slice(0, 3);
  const worstMeetings = [...scoredMeetings].sort((a, b) => (a.efficiency_score || 0) - (b.efficiency_score || 0)).slice(0, 3);

  const tasksDone = tasks.filter(tk => tk.status === "done").length;
  const tasksInProgress = tasks.filter(tk => tk.status === "in_progress").length;
  const tasksPending = tasks.filter(tk => tk.status === "pending").length;
  const completionRate = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0;

  const tasksByStatus = [
    { name: t("analytics.tasksDone"), value: tasksDone, color: "hsl(var(--success))" },
    { name: t("analytics.tasksInProgress"), value: tasksInProgress, color: "hsl(var(--violet))" },
    { name: t("analytics.tasksTodo"), value: tasksPending, color: "hsl(var(--fuchsia))" },
  ];

  const areaData = Array.from({ length: 8 }, (_, i) => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - (7 - i) * 7);
    const weekEnd = new Date(weekAgo); weekEnd.setDate(weekEnd.getDate() + 7);
    const count = meetings.filter(m => { const d = new Date(m.created_at); return d >= weekAgo && d < weekEnd; }).length;
    return { week: `S${i + 1}`, reunions: count };
  });

  const typeBreakdown = meetings.reduce((acc, m) => { acc[m.meeting_type] = (acc[m.meeting_type] || 0) + 1; return acc; }, {} as Record<string, number>);
  const typeColors: Record<string, string> = { commercial: "#E91E8C", tech: "#7C3AED", retro: "#10B981", onboarding: "#F59E0B", rh: "#60A5FA", marketing: "#F04DA0", autre: "#9898B0" };
  const meetingsByType = Object.entries(typeBreakdown).map(([type, value]) => ({ name: type, value, color: typeColors[type] || "#9898B0" }));

  const gridColor = isDark ? "hsl(240, 17%, 19%)" : "hsl(240, 12%, 88%)";
  const tickColor = isDark ? "#9898B0" : "#4A4A62";
  const tooltipBg = isDark ? "#16161F" : "#FFFFFF";
  const tooltipBorder = isDark ? "#28283A" : "#DDDDE8";
  const tooltipText = isDark ? "#F5F5FA" : "#0D0D14";
  const tooltipStyle = { background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12, color: tooltipText };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10 max-w-[1400px]">
      <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[2px] text-muted-foreground/60 mb-3 sm:mb-4">{t("analytics.breadcrumb")}</p>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display font-extrabold text-xl sm:text-[28px] md:text-[32px] tracking-tight text-foreground mb-1">{t("analytics.title")}</h1>
          <p className="font-body text-xs sm:text-[15px] text-muted-foreground">{t("analytics.subtitle")}</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border/30 self-start sm:self-auto">
          {periods.map(p => (
            <button key={p} onClick={() => setActivePeriod(p)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md font-body text-[11px] sm:text-xs transition-all ${activePeriod === p ? "bg-gradient-primary text-white shadow-fuchsia" : "text-muted-foreground hover:text-foreground"}`}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-[hsl(var(--fuchsia))] border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
            {[
              { emoji: "🎙", label: t("analytics.meetings"), value: meetings.length },
              { emoji: "📊", label: t("analytics.tasksCreated"), value: tasks.length },
              { emoji: "⏱", label: t("analytics.avgDuration"), value: `${Math.floor(avgDuration / 60)}m` },
              { emoji: "👤", label: t("analytics.contacts"), value: contactsCount },
              { emoji: "⚡", label: t("analytics.efficiencyScore"), value: `${avgEfficiency}/100` },
            ].map(kpi => (
              <Card key={kpi.label} className="border-border/30">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <span className="text-sm sm:text-base">{kpi.emoji}</span>
                    <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[1.5px] text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="font-display font-extrabold text-2xl sm:text-[36px] tracking-tight text-foreground leading-none">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Efficiency section */}
          {scoredMeetings.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Card className="border-primary/20">
                <CardHeader className="pb-2 px-3 sm:px-6">
                  <CardTitle className="font-display text-sm">⚡ {t("analytics.efficiencyScore")}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4">
                  <EfficiencyScore score={avgEfficiency} breakdown={avgBreakdown} size="lg" />
                </CardContent>
              </Card>

              <Card className="border-border/30">
                <CardHeader className="pb-2 px-3 sm:px-6">
                  <CardTitle className="font-display text-sm">{t("analytics.efficiencyTrend")}</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={efficiencyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <ReferenceLine y={75} stroke="hsl(var(--success))" strokeDasharray="3 3" label={{ value: "Objectif", fill: tickColor, fontSize: 10 }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* By type efficiency */}
          {typeAvgs.length > 0 && (
            <Card className="border-border/30 mb-6 sm:mb-8">
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="font-display text-sm">Score par type de réunion</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={typeAvgs}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="type" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Best & worst */}
          {scoredMeetings.length >= 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Card className="border-border/30">
                <CardHeader className="pb-2 px-3 sm:px-6"><CardTitle className="font-display text-sm">🏆 {t("analytics.bestMeetings")}</CardTitle></CardHeader>
                <CardContent className="px-3 sm:px-6 space-y-2">
                  {bestMeetings.map(m => (
                    <Link key={m.id} to={`/app/reunions/${m.id}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                      <span className="text-xs text-foreground truncate max-w-[200px]">{m.title}</span>
                      <span className="font-mono text-xs font-bold text-[hsl(var(--success))]">{m.efficiency_score}/100</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border/30">
                <CardHeader className="pb-2 px-3 sm:px-6"><CardTitle className="font-display text-sm">📈 {t("analytics.worstMeetings")}</CardTitle></CardHeader>
                <CardContent className="px-3 sm:px-6 space-y-2">
                  {worstMeetings.map(m => (
                    <Link key={m.id} to={`/app/reunions/${m.id}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                      <span className="text-xs text-foreground truncate max-w-[200px]">{m.title}</span>
                      <span className="font-mono text-xs font-bold text-destructive">{m.efficiency_score}/100</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border/30 mb-6 sm:mb-8">
            <CardHeader className="pb-2 px-3 sm:px-6"><CardTitle className="font-display text-sm sm:text-lg">{t("analytics.meetingsPerWeek")}</CardTitle></CardHeader>
            <CardContent className="px-2 sm:px-6">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={areaData}>
                  <defs><linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(326, 82%, 52%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(326, 82%, 52%)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="reunions" stroke="hsl(326, 82%, 52%)" fill="url(#gradArea)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="border-border/30">
              <CardHeader className="pb-2 px-3 sm:px-6"><CardTitle className="font-display text-sm">{t("analytics.transcriptionPrecision")}</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center py-4 sm:py-6">
                <div className="relative w-[160px] sm:w-[200px] h-[80px] sm:h-[100px] mb-4">
                  <svg viewBox="0 0 200 100" className="w-full h-full">
                    <path d="M 10 95 A 85 85 0 0 1 190 95" fill="none" stroke={gridColor} strokeWidth="12" strokeLinecap="round" />
                    <path d="M 10 95 A 85 85 0 0 1 190 95" fill="none" stroke="url(#gaugeGradA)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(avgPrecision / 100) * 267} 267`} />
                    <defs><linearGradient id="gaugeGradA" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#E91E8C" /><stop offset="100%" stopColor="#7C3AED" /></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex items-end justify-center pb-0">
                    <span className="font-display font-extrabold text-2xl sm:text-[32px] tracking-tight text-gradient">{avgPrecision}%</span>
                  </div>
                </div>
                <p className="font-body text-xs sm:text-sm text-muted-foreground">{t("analytics.avgPrecisionSTT")}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30">
              <CardHeader className="pb-2 px-3 sm:px-6"><CardTitle className="font-display text-sm">{t("analytics.tasksByStatus")}</CardTitle></CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 p-3 sm:p-6">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart><Pie data={tasksByStatus} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={3}>{tasksByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie></PieChart>
                </ResponsiveContainer>
                <div className="flex-1">
                  <p className="font-display font-extrabold text-3xl sm:text-[40px] text-[hsl(var(--success))] leading-none mb-1">{completionRate}%</p>
                  <p className="font-body text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{t("analytics.completionRate")}</p>
                  {tasksByStatus.map(tk => (
                    <div key={tk.name} className="flex items-center gap-2 text-xs font-body mb-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: tk.color }} />
                      <span className="text-muted-foreground flex-1">{tk.name}</span>
                      <span className="font-mono text-foreground">{tk.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {meetingsByType.length > 0 && (
            <Card className="border-border/30">
              <CardHeader className="pb-2 px-3 sm:px-6"><CardTitle className="font-display text-sm">{t("analytics.meetingTypes")}</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center p-3 sm:p-6">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart><Pie data={meetingsByType} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={3}>{meetingsByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-3">
                  {meetingsByType.map(tk => (
                    <div key={tk.name} className="flex items-center gap-1.5 text-xs font-body">
                      <span className="w-2 h-2 rounded-full" style={{ background: tk.color }} />
                      <span className="text-muted-foreground">{tk.name}</span>
                      <span className="font-mono text-foreground">{tk.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
