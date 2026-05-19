import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface HistoryEvent {
  id: string; time: string; date: Date; icon: string; bg: string; title: string; detail: string; link?: string;
}

const Historique = () => {
  const { t, i18n } = useTranslation("app");
  const dateFnsLocale = i18n.language === "en" ? enUS : fr;
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(t("history.all"));

  const filterTypes = [t("history.all"), t("history.meetingsFilter"), t("history.tasksFilter"), t("history.contactsFilter"), t("history.decisionsFilter")];

  useEffect(() => {
    (async () => {
      const allEvents: HistoryEvent[] = [];
      const { data: meetings } = await supabase.from("meetings").select("id, title, status, created_at, completed_at, channel, duration_seconds, summary").order("created_at", { ascending: false }).limit(50);
      if (meetings) {
        for (const m of meetings) {
          const d = new Date(m.created_at);
          allEvents.push({ id: `m-start-${m.id}`, time: format(d, "HH:mm"), date: d, icon: "▶", bg: "bg-secondary",
            title: t("history.meetingStarted", { title: m.title }),
            detail: `${m.channel || "import"} · ${m.duration_seconds ? Math.round(m.duration_seconds / 60) + " min" : "—"}`, link: `/app/reunions/${m.id}` });
          if (m.status === "completed" && m.completed_at) {
            const dc = new Date(m.completed_at);
            allEvents.push({ id: `m-done-${m.id}`, time: format(dc, "HH:mm"), date: dc, icon: "🧠", bg: "bg-violet-d",
              title: t("history.analysisComplete", { title: m.title }),
              detail: m.summary?.slice(0, 80) || "—", link: `/app/reunions/${m.id}` });
          }
        }
      }
      const { data: tasks } = await supabase.from("extracted_tasks").select("id, title, assignee, created_at, meeting_id, priority").order("created_at", { ascending: false }).limit(50);
      if (tasks) {
        for (const tk of tasks) {
          const d = new Date(tk.created_at);
          allEvents.push({ id: `t-${tk.id}`, time: format(d, "HH:mm"), date: d, icon: "✅", bg: "bg-success-d",
            title: t("history.taskExtracted", { title: tk.title }),
            detail: `→ ${tk.assignee || t("history.unassigned")} · ${tk.priority}`, link: `/app/reunions/${tk.meeting_id}` });
        }
      }
      const { data: contacts } = await supabase.from("detected_contacts").select("id, name, company, created_at, meeting_id").order("created_at", { ascending: false }).limit(30);
      if (contacts) {
        for (const c of contacts) {
          const d = new Date(c.created_at);
          allEvents.push({ id: `c-${c.id}`, time: format(d, "HH:mm"), date: d, icon: "📊", bg: "bg-violet-d",
            title: t("history.contactDetected", { name: c.name }),
            detail: c.company || t("history.unknownCompany"), link: `/app/reunions/${c.meeting_id}` });
        }
      }
      const { data: decisions } = await supabase.from("extracted_decisions").select("id, content, created_at, meeting_id").order("created_at", { ascending: false }).limit(30);
      if (decisions) {
        for (const dc of decisions) {
          const d = new Date(dc.created_at);
          allEvents.push({ id: `d-${dc.id}`, time: format(d, "HH:mm"), date: d, icon: "🔵", bg: "bg-fuchsia-d",
            title: t("history.decisionExtracted"), detail: dc.content.slice(0, 80), link: `/app/reunions/${dc.meeting_id}` });
        }
      }
      allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
      setEvents(allEvents);
      setLoading(false);
    })();
  }, [t]);

  const filtered = events.filter(e => {
    if (activeFilter === filterTypes[1]) return e.id.startsWith("m-");
    if (activeFilter === filterTypes[2]) return e.id.startsWith("t-");
    if (activeFilter === filterTypes[3]) return e.id.startsWith("c-");
    if (activeFilter === filterTypes[4]) return e.id.startsWith("d-");
    return true;
  });

  const grouped: { label: string; items: HistoryEvent[] }[] = [];
  for (const ev of filtered) {
    const label = isToday(ev.date) ? t("history.today") : isYesterday(ev.date) ? t("history.yesterday") : format(ev.date, "dd MMMM yyyy", { locale: dateFnsLocale });
    const existing = grouped.find(g => g.label === label);
    if (existing) existing.items.push(ev);
    else grouped.push({ label, items: [ev] });
  }

  return (
    <div>
      <div className="sticky top-[60px] z-20 backdrop-blur-xl bg-background/80 border-b border-border px-3 sm:px-6 md:px-12 pt-5 sm:pt-8 pb-4 sm:pb-5">
        <h1 className="font-display font-extrabold text-xl sm:text-[28px] tracking-tight text-foreground mb-0.5">{t("history.title")}</h1>
        <p className="font-body text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{t("history.subtitle")}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filterTypes.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`font-mono text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 ${activeFilter === f ? "bg-fuchsia-d border border-[rgba(233,30,140,0.3)] text-[hsl(var(--fuchsia-l))]" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="px-3 sm:px-6 md:px-12 py-4 sm:py-6 max-w-[900px]">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary" />
                <div className="flex-1 space-y-1.5"><div className="h-3 bg-secondary rounded w-2/3" /><div className="h-2.5 bg-secondary rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">📜</span>
            <p className="font-display font-bold text-lg text-foreground mb-1">{t("history.noHistory")}</p>
            <p className="font-body text-sm text-muted-foreground">{t("history.noHistoryDesc")}</p>
          </div>
        ) : (
          grouped.map((day, di) => (
            <div key={di} className="mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-[hsl(var(--fuchsia))]/20 to-transparent" />
                <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/50 uppercase tracking-wide shrink-0">{day.label}</span>
                <div className="h-px flex-1 bg-gradient-to-l from-[hsl(var(--violet))]/20 to-transparent" />
              </div>
              <div className="relative pl-6 sm:pl-8">
                <div className="absolute left-2 sm:left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))]/30" />
                {day.items.map((ev) => (
                  <div key={ev.id} className="relative mb-3 sm:mb-4 last:mb-0">
                    <div className="absolute -left-[18px] sm:-left-[22px] w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-card bg-gradient-primary" />
                    <Link to={ev.link || "#"} className="block bg-card border border-border rounded-xl p-3 sm:p-4 ml-2 sm:ml-3 hover:border-[hsl(var(--fuchsia))]/20 transition-colors">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${ev.bg} flex items-center justify-center text-xs sm:text-sm shrink-0`}>{ev.icon}</div>
                          <div className="min-w-0">
                            <p className="font-body text-xs sm:text-sm text-foreground font-medium truncate">{ev.title}</p>
                            <p className="font-body text-[11px] sm:text-[12px] text-muted-foreground mt-0.5 truncate">{ev.detail}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/40 shrink-0">{ev.time}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Historique;
