import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExportMenu } from "@/components/ExportMenu";
import { useMeetings, Meeting } from "@/hooks/useMeetings";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeBanner from "@/components/app/UpgradeBanner";

const typeStyle: Record<string, string> = {
  commercial: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
  tech: "bg-violet-d text-[hsl(var(--violet-l))]",
  retro: "bg-success-d text-[hsl(var(--success))]",
  onboarding: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]",
  rh: "bg-violet-d text-[hsl(var(--violet-l))]",
  marketing: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
  autre: "bg-[hsl(var(--dark-4))] text-muted-foreground",
};

const typeValueMap: Record<string, string> = {
  "Commercial": "commercial", "Tech": "tech", "Rétro": "retro", "Retro": "retro", "Onboarding": "onboarding", "Autre": "autre", "Other": "autre",
};

const Reunions = () => {
  const { t, i18n } = useTranslation("app");
  const dateFnsLocale = i18n.language === "en" ? enUS : fr;
  const { isFree, limits } = useSubscription();

  const statusMap: Record<string, { label: string; icon: string; cls: string }> = {
    completed: { label: t("status.completed"), icon: "✓", cls: "bg-success-d text-[hsl(var(--success))]" },
    partial: { label: t("status.partial"), icon: "⚠", cls: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]" },
    pending: { label: t("status.pending"), icon: "⏳", cls: "bg-[hsl(var(--dark-4))] text-muted-foreground" },
    transcribing: { label: t("status.transcribing"), icon: "🎙", cls: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))] animate-pulse" },
    analyzing: { label: t("status.analyzing"), icon: "🧠", cls: "bg-violet-d text-[hsl(var(--violet-l))] animate-pulse" },
    failed: { label: t("status.failed"), icon: "❌", cls: "bg-[rgba(239,68,68,0.12)] text-destructive" },
  };

  const types = [t("meetings.types.all"), t("meetings.types.commercial"), t("meetings.types.tech"), t("meetings.types.retro"), t("meetings.types.onboarding"), t("meetings.types.other")];

  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState(types[0]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const { fetchMeetings } = useMeetings();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setMeetings(await fetchMeetings()); } catch { }
      setLoading(false);
    })();
  }, []);

  const filtered = meetings.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeType !== types[0] && m.meeting_type !== typeValueMap[activeType]) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedMeetings = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const counts = {
    total: meetings.length,
    completed: meetings.filter(m => m.status === "completed").length,
    processing: meetings.filter(m => ["pending", "transcribing", "analyzing"].includes(m.status)).length,
    failed: meetings.filter(m => m.status === "failed").length,
  };

  const formatDate = (d: string) => { try { return format(new Date(d), "dd/MM · HH:mm", { locale: dateFnsLocale }); } catch { return d; } };
  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)} min` : "—";

  return (
    <div>
      <div className="px-3 sm:px-4 md:px-12 pt-4">
        {isFree && <UpgradeBanner feature="meetings" currentCount={meetings.length} limit={limits.meetings} />}
      </div>
      <div className="sticky top-[60px] z-20 backdrop-blur-xl bg-background/80 border-b border-border px-3 sm:px-4 md:px-12 pt-4 sm:pt-6 md:pt-8 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 mb-1">
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-xl sm:text-2xl md:text-[28px] tracking-tight text-foreground">{t("meetings.title")}</h1>
            <p className="font-body text-xs sm:text-sm text-muted-foreground mt-0.5">{t("meetings.subtitle", { total: counts.total, completed: counts.completed })}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ExportMenu type="meetings" />
            <Link to="/app/reunions/nouvelle"
              className="flex items-center gap-2 font-display font-bold text-sm text-white bg-gradient-primary px-4 sm:px-5 py-2.5 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform shrink-0 flex-1 sm:flex-initial justify-center">
              {t("meetings.newMeeting")}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 sm:mt-4 md:mt-5 mb-2 sm:mb-3">
          <div className="flex-1 relative min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("meetings.search")}
              className="w-full bg-secondary border border-border rounded-lg pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 font-body text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary outline-none" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 font-body text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">⚙</button>
          <div className="hidden sm:flex bg-secondary border border-border rounded-lg p-1">
            <button onClick={() => setViewMode("list")} className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>≡</button>
            <button onClick={() => setViewMode("grid")} className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>⊞</button>
          </div>
        </div>

        <div className="flex gap-1.5 sm:gap-2 pb-3 sm:pb-4 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
          {[
            { label: t("meetings.all"), count: counts.total },
            { label: t("meetings.processed"), count: counts.completed },
            { label: t("meetings.inProgress"), count: counts.processing },
            { label: t("meetings.errors"), count: counts.failed },
          ].map(f => (
            <button key={f.label}
              className="font-mono text-[10px] sm:text-[11px] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-colors shrink-0 bg-secondary border border-border text-muted-foreground hover:text-foreground">
              {f.label} · {f.count}
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="mx-3 sm:mx-4 md:mx-12 mt-2 bg-card border border-border rounded-xl p-3 sm:p-4 md:p-5">
          <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide block mb-1.5">{t("meetings.type")}</label>
          <div className="flex flex-wrap gap-1.5">
            {types.map(tp => (
              <button key={tp} onClick={() => setActiveType(tp)}
                className={`font-mono text-[11px] px-3 py-1.5 rounded-full transition-colors ${activeType === tp ? "bg-fuchsia-d border border-primary/30 text-primary" : "bg-secondary border border-border text-muted-foreground"}`}>{tp}</button>
            ))}
          </div>
        </div>
      )}

      <div className="px-3 sm:px-4 md:px-12 py-4 sm:py-6 max-w-[1200px]">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[hsl(var(--fuchsia))] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-body text-sm text-muted-foreground mt-3">{t("meetings.loading")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">🎙</p>
            <p className="font-body text-muted-foreground">{t("meetings.noResults")}</p>
            <Link to="/app/reunions/nouvelle" className="font-body text-sm text-[hsl(var(--fuchsia-l))] hover:underline mt-2 block">{t("meetings.createFirst")}</Link>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-2 sm:space-y-2.5">
            {paginatedMeetings.map(m => {
              const st = statusMap[m.status] || statusMap.pending;
              return (
                <Link key={m.id} to={`/app/reunions/${m.id}`}
                  className="block bg-card border border-border rounded-xl sm:rounded-[14px] p-3 sm:p-5 hover:border-[rgba(233,30,140,0.35)] hover:shadow-[0_4px_20px_rgba(233,30,140,0.08)] transition-all group">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-fuchsia-d flex items-center justify-center text-sm sm:text-base shrink-0">🎙</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-[13px] sm:text-base text-foreground truncate group-hover:text-[hsl(var(--fuchsia-l))] transition-colors">{m.title}</p>
                      <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/50 mt-0.5">{formatDate(m.created_at)} · {formatDuration(m.duration_seconds)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                    <span className={`font-mono text-[9px] sm:text-[10px] uppercase px-2 sm:px-2.5 py-0.5 rounded-full ${typeStyle[m.meeting_type] || typeStyle.autre}`}>{m.meeting_type}</span>
                    <span className={`font-mono text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full ${st.cls}`}>{st.icon} {st.label}</span>
                    {m.channel && <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground/50 ml-auto">{m.channel}</span>}
                  </div>
                  {m.summary && <p className="font-body text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/40 truncate">{m.summary}</p>}
                  <div className="flex items-center justify-between mt-2 sm:mt-3">
                    <div className="flex items-center gap-2 sm:gap-5">
                      {m.precision_percent && <span className="font-body text-[11px] sm:text-[13px] text-muted-foreground">🎯 {m.precision_percent}%</span>}
                      {m.sentiment_score && <span className="font-body text-[11px] sm:text-[13px] text-muted-foreground">💚 {m.sentiment_score}%</span>}
                    </div>
                    <span className="bg-fuchsia-d text-[hsl(var(--fuchsia-l))] font-body text-[11px] sm:text-[13px] font-medium px-3 sm:px-4 py-1 sm:py-1.5 rounded-md">{t("meetings.open")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {paginatedMeetings.map(m => {
              const st = statusMap[m.status] || statusMap.pending;
              return (
                <Link key={m.id} to={`/app/reunions/${m.id}`}
                  className="block bg-card border border-border rounded-[14px] p-4 sm:p-5 hover:border-[rgba(233,30,140,0.35)] transition-all group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-d flex items-center justify-center text-sm shrink-0">🎙</div>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${st.cls} ml-auto`}>{st.icon} {st.label}</span>
                  </div>
                  <p className="font-display font-bold text-sm text-foreground mb-1 truncate group-hover:text-[hsl(var(--fuchsia-l))] transition-colors">{m.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground/50 mb-2">{formatDate(m.created_at)} · {formatDuration(m.duration_seconds)}</p>
                  {m.summary && <p className="font-body text-[13px] text-muted-foreground line-clamp-2 mb-3">{m.summary}</p>}
                  <button className="w-full bg-gradient-primary text-white font-display font-bold text-sm py-2 rounded-lg">{t("meetings.open")}</button>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="font-body text-xs px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              ← Précédent
            </button>
            <span className="font-mono text-[11px] text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="font-body text-xs px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reunions;
