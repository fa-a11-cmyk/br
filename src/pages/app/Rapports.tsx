import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface ReportData {
  id: string; title: string; meeting_type: string; status: string; created_at: string;
  duration_seconds: number | null; summary: string | null;
  tasks_count: number; decisions_count: number; contacts_count: number;
}

const typeStyle: Record<string, string> = {
  commercial: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
  tech: "bg-violet-d text-[hsl(var(--violet-l))]",
  retro: "bg-success-d text-[hsl(var(--success))]",
  onboarding: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]",
  rh: "bg-violet-d text-[hsl(var(--violet-l))]",
  marketing: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
  autre: "bg-secondary text-muted-foreground",
};

const Rapports = () => {
  const { t, i18n } = useTranslation("app");
  const dateFnsLocale = i18n.language === "en" ? enUS : fr;
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(t("meetings.types.all"));

  const filterOptions = [t("meetings.types.all"), t("meetings.types.commercial"), t("meetings.types.tech"), t("meetings.types.retro"), t("meetings.types.onboarding")];
  const typeValueMap: Record<string, string> = {};
  typeValueMap[t("meetings.types.commercial")] = "commercial";
  typeValueMap[t("meetings.types.tech")] = "tech";
  typeValueMap[t("meetings.types.retro")] = "retro";
  typeValueMap[t("meetings.types.onboarding")] = "onboarding";

  useEffect(() => {
    (async () => {
      const { data: meetings } = await supabase.from("meetings")
        .select("id, title, meeting_type, status, created_at, duration_seconds, summary")
        .in("status", ["completed", "partial"]).order("created_at", { ascending: false });
      if (!meetings) { setLoading(false); return; }
      const enriched = await Promise.all(meetings.map(async (m) => {
        const [{ count: tc }, { count: dc }, { count: cc }] = await Promise.all([
          supabase.from("extracted_tasks").select("id", { count: "exact", head: true }).eq("meeting_id", m.id),
          supabase.from("extracted_decisions").select("id", { count: "exact", head: true }).eq("meeting_id", m.id),
          supabase.from("detected_contacts").select("id", { count: "exact", head: true }).eq("meeting_id", m.id),
        ]);
        return { ...m, tasks_count: tc || 0, decisions_count: dc || 0, contacts_count: cc || 0 };
      }));
      setReports(enriched);
      setLoading(false);
    })();
  }, []);

  const filtered = reports.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeFilter !== filterOptions[0] && typeValueMap[activeFilter] && r.meeting_type !== typeValueMap[activeFilter]) return false;
    return true;
  });

  return (
    <div className="px-3 sm:px-6 md:px-10 py-4 sm:py-5 md:py-8 max-w-[1200px]">
      <h1 className="font-display font-extrabold text-xl sm:text-2xl md:text-[28px] tracking-tight text-foreground mb-1">{t("reports.title")}</h1>
      <p className="font-body text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">{t("reports.subtitle")}</p>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("reports.search")}
          className="w-full sm:w-80 bg-secondary border border-border rounded-xl px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[hsl(var(--fuchsia))]" />
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {filterOptions.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`font-mono text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors shrink-0 ${activeFilter === f ? "bg-fuchsia-d border border-primary/30 text-primary" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="flex gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-secondary" /><div className="flex-1 space-y-2"><div className="h-4 bg-secondary rounded w-3/4" /><div className="h-3 bg-secondary rounded w-1/3" /></div></div>
              <div className="h-3 bg-secondary rounded w-full mb-2" /><div className="h-3 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">📄</span>
          <p className="font-display font-bold text-lg text-foreground mb-1">
            {search || activeFilter !== filterOptions[0] ? t("reports.noResults") : t("reports.noReports")}
          </p>
          <p className="font-body text-sm text-muted-foreground mb-4">
            {search ? t("reports.tryOther") : t("reports.importFirst")}
          </p>
          {!search && activeFilter === filterOptions[0] && (
            <Link to="/app/reunions/nouvelle" className="inline-flex items-center gap-2 bg-gradient-primary text-white font-display font-bold text-sm px-5 py-2.5 rounded-xl shadow-fuchsia">
              {t("reports.newMeeting")}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {filtered.map(r => (
            <Link key={r.id} to={`/app/reunions/${r.id}`}
              className="bg-card border border-border rounded-xl sm:rounded-[14px] p-4 sm:p-6 hover:border-[hsl(var(--fuchsia))]/40 transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center text-lg shrink-0">📄</div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-[14px] sm:text-[15px] text-foreground group-hover:text-[hsl(var(--fuchsia-l))] transition-colors truncate">{r.title}</p>
                  <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/60">
                    {format(new Date(r.created_at), "dd/MM/yyyy · HH:mm", { locale: dateFnsLocale })}
                    {r.duration_seconds ? ` · ${Math.round(r.duration_seconds / 60)} min` : ""}
                  </p>
                </div>
              </div>
              {r.summary && <p className="font-body text-[12px] sm:text-[13px] text-muted-foreground line-clamp-2 mb-3">{r.summary}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${typeStyle[r.meeting_type] || typeStyle.autre}`}>{r.meeting_type}</span>
                <span className="font-mono text-[10px] bg-secondary text-muted-foreground/60 px-2 py-0.5 rounded">{t("reports.tasks", { count: r.tasks_count })}</span>
                <span className="font-mono text-[10px] bg-secondary text-muted-foreground/60 px-2 py-0.5 rounded">{t("reports.decisions", { count: r.decisions_count })}</span>
                <span className="font-mono text-[10px] bg-secondary text-muted-foreground/60 px-2 py-0.5 rounded">{t("reports.contacts", { count: r.contacts_count })}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rapports;
