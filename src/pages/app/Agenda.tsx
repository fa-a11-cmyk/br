import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, getDaysInMonth, getDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isSameDay } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCalendly } from "@/hooks/useCalendly";

const typeStyle: Record<string, string> = {
  completed: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))] border-l-2 border-[hsl(var(--fuchsia))]",
  partial: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))] border-l-2 border-[hsl(var(--fuchsia))]",
  pending: "bg-violet-d text-[hsl(var(--violet-l))] border-l-2 border-[hsl(var(--violet))]",
  transcribing: "bg-[rgba(233,30,140,0.25)] text-foreground animate-pulse border-l-2 border-[hsl(var(--fuchsia))]",
  analyzing: "bg-[rgba(233,30,140,0.25)] text-foreground animate-pulse border-l-2 border-[hsl(var(--fuchsia))]",
  failed: "bg-[rgba(239,68,68,0.12)] text-destructive border-l-2 border-destructive",
  calendly: "bg-[rgba(0,107,255,0.12)] text-[hsl(var(--violet-l))] border-l-2 border-[hsl(var(--violet))]",
};

interface MeetingEvent { id: string; title: string; status: string; created_at: string; duration_seconds: number | null; meeting_type: string; date: string; time: string; source?: "rapidomeet" | "calendly"; }

type ViewMode = "month" | "week" | "list";

const Agenda = () => {
  const { t, i18n } = useTranslation("app");
  const dateFnsLocale = i18n.language === "en" ? enUS : fr;
  const DAYS = t("agenda.days", { returnObjects: true }) as string[];
  const { events: calendlyEvents, isConnected: calendlyConnected, syncEvents, loading: calendlyLoading } = useCalendly();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<MeetingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("month");
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("meetings").select("id, title, status, created_at, duration_seconds, meeting_type").order("created_at", { ascending: false });
      const rapidoEvents: MeetingEvent[] = (data || []).map(m => ({ ...m, date: format(new Date(m.created_at), "yyyy-MM-dd"), time: format(new Date(m.created_at), "HH:mm"), source: "rapidomeet" as const }));
      
      const calEvents: MeetingEvent[] = (calendlyEvents || []).map((ev: any) => ({
        id: ev.id,
        title: ev.name || "Calendly",
        status: "calendly",
        created_at: ev.start_time,
        duration_seconds: ev.end_time && ev.start_time ? Math.round((new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime()) / 1000) : null,
        meeting_type: "calendly",
        date: ev.start_time ? format(new Date(ev.start_time), "yyyy-MM-dd") : "",
        time: ev.start_time ? format(new Date(ev.start_time), "HH:mm") : "",
        source: "calendly" as const,
      }));

      const all = [...rapidoEvents, ...calEvents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMeetings(all);
      setLoading(false);
    })();
  }, [calendlyEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfWeek = getDay(startOfMonth(currentDate));
  const firstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const prevMonthDays = getDaysInMonth(subMonths(currentDate, 1));

  const cells = useMemo(() => {
    const c: { day: number; current: boolean; dateStr: string }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) { const d = prevMonthDays - i; c.push({ day: d, current: false, dateStr: format(new Date(year, month - 1, d), "yyyy-MM-dd") }); }
    for (let d = 1; d <= daysInMonth; d++) c.push({ day: d, current: true, dateStr: format(new Date(year, month, d), "yyyy-MM-dd") });
    const remaining = 42 - c.length;
    for (let d = 1; d <= remaining; d++) c.push({ day: d, current: false, dateStr: format(new Date(year, month + 1, d), "yyyy-MM-dd") });
    return c;
  }, [year, month, daysInMonth, firstDay, prevMonthDays]);

  // Week view data
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      return { date: d, dateStr: format(d, "yyyy-MM-dd") };
    });
  }, [weekStart]);

  const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h - 20h

  const getEvents = (dateStr: string) => meetings.filter(m => m.date === dateStr);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const navigatePrev = () => {
    if (view === "week") setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subMonths(d, 1));
  };
  const navigateNext = () => {
    if (view === "week") setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addMonths(d, 1));
  };

  const headerLabel = view === "week"
    ? `${format(weekDays[0].date, "d MMM", { locale: dateFnsLocale })} — ${format(weekDays[6].date, "d MMM yyyy", { locale: dateFnsLocale })}`
    : format(currentDate, "MMMM yyyy", { locale: dateFnsLocale });

  return (
    <div>
      <div className="sticky top-[60px] z-20 backdrop-blur-xl bg-background/80 border-b border-border px-3 sm:px-6 md:px-12 pt-5 sm:pt-8 pb-4 sm:pb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div>
            <h1 className="font-display font-extrabold text-xl sm:text-[28px] tracking-tight text-foreground">{t("agenda.title")}</h1>
            <p className="font-body text-xs sm:text-sm text-muted-foreground mt-0.5">{t("agenda.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            {calendlyConnected && (
              <button onClick={syncEvents} disabled={calendlyLoading} className="flex items-center gap-1.5 font-body text-xs text-muted-foreground bg-secondary border border-border px-3 py-2 rounded-lg hover:text-foreground transition-colors">
                {calendlyLoading ? "⏳" : "🔄"} Sync Calendly
              </button>
            )}
            <Link to="/app/reunions/nouvelle" className="flex items-center gap-2 font-display font-bold text-sm text-white bg-gradient-primary px-4 sm:px-5 py-2.5 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform shrink-0 self-start">
              {t("agenda.newMeeting")}
            </Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={navigatePrev} className="w-8 h-8 sm:w-9 sm:h-9 bg-secondary border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground">←</button>
            <span className="font-display font-bold text-base sm:text-lg text-foreground min-w-[140px] sm:min-w-[200px] text-center">
              {headerLabel}
            </span>
            <button onClick={navigateNext} className="w-8 h-8 sm:w-9 sm:h-9 bg-secondary border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground">→</button>
            <button onClick={() => setCurrentDate(new Date())} className="font-body text-[12px] sm:text-[13px] text-muted-foreground bg-secondary border border-border px-2.5 sm:px-3 py-1.5 rounded-lg ml-1 sm:ml-2 hover:text-foreground">{t("agenda.today")}</button>
          </div>
          <div className="flex gap-1 bg-secondary border border-border rounded-lg p-1 self-start sm:self-auto">
            {(["month", "week", "list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`font-body text-[12px] sm:text-[13px] px-3 py-1.5 rounded-md transition-all ${view === v ? "bg-gradient-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                {v === "month" ? t("agenda.month") : v === "week" ? (i18n.language === "en" ? "Week" : "Semaine") : t("agenda.listView")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-6 md:px-12 py-4 sm:py-6">
        {loading ? (
          <div className="animate-pulse space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary rounded-xl" />)}</div>
        ) : view === "week" ? (
          /* ═══════ WEEK VIEW ═══════ */
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header row with day names */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-[1px] mb-[1px]">
                <div className="py-2" />
                {weekDays.map(wd => {
                  const isToday = wd.dateStr === todayStr;
                  return (
                    <div key={wd.dateStr} className={`text-center py-2 rounded-t-lg ${isToday ? "bg-primary/10" : ""}`}>
                      <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground/60">
                        {format(wd.date, "EEE", { locale: dateFnsLocale })}
                      </p>
                      <p className={`font-display font-bold text-lg ${isToday ? "text-primary" : "text-foreground"}`}>
                        {format(wd.date, "d")}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Time grid */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-[1px] bg-border/20 rounded-xl overflow-hidden">
                {HOURS.map(hour => (
                  <div key={hour} className="contents">
                    {/* Hour label */}
                    <div className="bg-card py-3 px-2 text-right">
                      <span className="font-mono text-[11px] text-muted-foreground/50">{hour}:00</span>
                    </div>
                    {/* Day columns */}
                    {weekDays.map(wd => {
                      const isToday = wd.dateStr === todayStr;
                      const hourEvents = getEvents(wd.dateStr).filter(ev => {
                        const evHour = parseInt(ev.time.split(":")[0], 10);
                        return evHour === hour;
                      });
                      return (
                        <div key={`${hour}-${wd.dateStr}`}
                          className={`min-h-[52px] p-1 border-t border-border/20 ${isToday ? "bg-primary/5" : "bg-card"} hover:bg-secondary/50 transition-colors`}>
                          {hourEvents.map(ev => (
                            <Link key={ev.id} to={`/app/reunions/${ev.id}`}
                              className={`block rounded-md px-2 py-1 mb-0.5 ${typeStyle[ev.status] || typeStyle.pending} hover:opacity-80 transition-opacity`}>
                              <p className="font-body text-[11px] font-medium truncate">{ev.title}</p>
                              <p className="font-mono text-[9px] opacity-70">{ev.time} · {ev.duration_seconds ? Math.round(ev.duration_seconds / 60) + "m" : ""}</p>
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : view === "month" ? (
          /* ═══════ MONTH VIEW ═══════ */
          <div>
            <div className="hidden sm:grid grid-cols-7 gap-[1px] mb-[1px]">
              {(Array.isArray(DAYS) ? DAYS : ["LUN","MAR","MER","JEU","VEN","SAM","DIM"]).map(d => (
                <div key={d} className="text-center font-mono text-[11px] uppercase tracking-[2px] text-muted-foreground/50 py-2.5">{d}</div>
              ))}
            </div>
            <div className="sm:hidden space-y-2">
              {cells.filter(c => c.current && getEvents(c.dateStr).length > 0).map(cell => (
                <div key={cell.dateStr} className="bg-card border border-border rounded-xl p-3">
                  <p className="font-mono text-[11px] text-muted-foreground mb-2">
                    {cell.dateStr === todayStr ? `🔴 ${t("agenda.today")}` : format(new Date(cell.dateStr), "EEEE d MMMM", { locale: dateFnsLocale })}
                  </p>
                  {getEvents(cell.dateStr).map(ev => (
                    <Link key={ev.id} to={`/app/reunions/${ev.id}`} className={`block rounded-lg px-3 py-2 mb-1 last:mb-0 ${typeStyle[ev.status] || typeStyle.pending}`}>
                      <p className="font-body text-sm font-medium">{ev.title}</p>
                      <p className="font-mono text-[10px] opacity-70">{ev.time} · {ev.duration_seconds ? Math.round(ev.duration_seconds / 60) + " min" : "—"}</p>
                    </Link>
                  ))}
                </div>
              ))}
              {cells.filter(c => c.current && getEvents(c.dateStr).length > 0).length === 0 && (
                <div className="text-center py-12"><span className="text-3xl block mb-2">📅</span><p className="font-body text-sm text-muted-foreground">{t("agenda.noMeetingsThisMonth")}</p></div>
              )}
            </div>
            <div className="hidden sm:grid grid-cols-7 gap-[1px] bg-border/30 rounded-xl overflow-hidden">
              {cells.map((cell, i) => {
                const dayEvents = getEvents(cell.dateStr);
                const isToday = cell.dateStr === todayStr;
                return (
                  <div key={i} className={`min-h-[100px] p-2 ${cell.current ? "bg-card" : "bg-card/40"} hover:bg-secondary/50 transition-colors relative`}>
                    <div className="flex justify-end mb-1">
                      <span className={`font-mono text-[13px] w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-gradient-primary text-white font-bold" : cell.current ? "text-muted-foreground" : "text-muted-foreground/30"}`}>{cell.day}</span>
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(ev => (
                        <div key={ev.id} className="relative" onMouseEnter={() => setHoveredEvent(ev.id)} onMouseLeave={() => setHoveredEvent(null)}>
                          <Link to={`/app/reunions/${ev.id}`} className={`block rounded px-1.5 py-0.5 font-body text-[11px] font-medium truncate ${typeStyle[ev.status] || typeStyle.pending}`}>
                            {ev.time} {ev.title}
                          </Link>
                          {hoveredEvent === ev.id && (
                            <div className="absolute z-50 bottom-full left-0 mb-1 bg-card border border-border rounded-xl p-4 min-w-[220px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                              <p className="font-display font-bold text-sm text-foreground mb-1">{ev.title}</p>
                              <p className="font-mono text-[11px] text-muted-foreground/50 mb-1">{ev.time} · {ev.duration_seconds ? Math.round(ev.duration_seconds / 60) + " min" : "—"} · {ev.meeting_type}</p>
                              <Link to={`/app/reunions/${ev.id}`} className="font-body text-[11px] text-[hsl(var(--fuchsia-l))]">{t("agenda.open")}</Link>
                            </div>
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <span className="font-mono text-[10px] text-muted-foreground/50 px-1">+{dayEvents.length - 2}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ═══════ LIST VIEW ═══════ */
          <div className="space-y-2 max-w-[700px]">
            {meetings.length === 0 ? (
              <div className="text-center py-16"><span className="text-3xl block mb-2">📅</span><p className="font-body text-sm text-muted-foreground">{t("agenda.noMeetings")}</p></div>
            ) : meetings.map(ev => (
              <Link key={ev.id} to={`/app/reunions/${ev.id}`}
                className={`block bg-card border border-border rounded-xl p-3 sm:p-4 hover:border-[hsl(var(--fuchsia))]/30 transition-colors ${typeStyle[ev.status] || ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-foreground truncate">{ev.title}</p>
                    <p className="font-mono text-[11px] text-muted-foreground/60 mt-0.5">
                      {format(new Date(ev.created_at), "dd/MM · HH:mm", { locale: dateFnsLocale })} · {ev.duration_seconds ? Math.round(ev.duration_seconds / 60) + " min" : "—"} · {ev.meeting_type}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">{ev.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;
