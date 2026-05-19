import { useState } from "react";

const auditEntries = [
  { date: "19/03 · 10:32", user: "Michael K.", action: "Connexion", detail: "Depuis Chrome/macOS", ip: "92.184.xx.xx", type: "info" },
  { date: "19/03 · 09:45", user: "Ahmed B.", action: "Réunion créée", detail: "Sprint 13 Planning", ip: "82.120.xx.xx", type: "create" },
  { date: "18/03 · 17:20", user: "Michael K.", action: "Intégration connectée", detail: "Google Meet", ip: "92.184.xx.xx", type: "create" },
  { date: "18/03 · 15:10", user: "Lilia F.", action: "Rapport partagé", detail: "Rapport #142 — lien public", ip: "176.132.xx.xx", type: "share" },
  { date: "18/03 · 14:52", user: "Michael K.", action: "Scénario activé", detail: "N2 — Prospect Auto-Capture", ip: "92.184.xx.xx", type: "create" },
  { date: "17/03 · 11:00", user: "Michael K.", action: "Membre invité", detail: "souhail@braindcode.com", ip: "92.184.xx.xx", type: "create" },
  { date: "17/03 · 09:15", user: "Ahmed B.", action: "Clé API créée", detail: "rk_live_xxxx...xxxx", ip: "82.120.xx.xx", type: "warning" },
  { date: "16/03 · 18:00", user: "Lilia F.", action: "Réunion supprimée", detail: "Call Djiby 12/03", ip: "176.132.xx.xx", type: "delete" },
  { date: "16/03 · 16:30", user: "Michael K.", action: "Intégration déconnectée", detail: "Slack", ip: "92.184.xx.xx", type: "delete" },
  { date: "15/03 · 14:00", user: "Michael K.", action: "Scénario désactivé", detail: "N7 — WhatsApp Broadcast", ip: "92.184.xx.xx", type: "warning" },
];

const typeColors: Record<string, string> = {
  info: "bg-[hsl(var(--fuchsia))]/20 text-[hsl(var(--fuchsia-l))]",
  create: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]",
  share: "bg-[hsl(var(--violet))]/20 text-[hsl(var(--violet-l))]",
  warning: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  delete: "bg-destructive/20 text-destructive",
};

const AuditLog = () => {
  const [filter, setFilter] = useState("all");
  const filters = ["all", "Connexion", "Réunion", "Intégration", "Membre", "Scénario", "API"];

  const filtered = filter === "all"
    ? auditEntries
    : auditEntries.filter((e) => e.action.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-body text-xs px-3 py-1.5 rounded-lg transition-all ${
              filter === f
                ? "bg-fuchsia-d text-[hsl(var(--fuchsia-l))] border border-[hsl(var(--fuchsia))]/30"
                : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "Tout" : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[100px_100px_1fr_1fr_100px] gap-3 px-5 py-2.5 bg-secondary font-mono text-[10px] uppercase tracking-wide text-muted-foreground/50">
          <span>Date</span>
          <span>Utilisateur</span>
          <span>Action</span>
          <span>Détail</span>
          <span>IP</span>
        </div>
        {filtered.map((e, i) => (
          <div key={i} className="grid grid-cols-[100px_100px_1fr_1fr_100px] gap-3 px-5 py-3 border-t border-border/40 items-center">
            <span className="font-mono text-[11px] text-muted-foreground/60">{e.date}</span>
            <span className="font-body text-[13px] text-foreground">{e.user}</span>
            <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full w-fit ${typeColors[e.type]}`}>
              {e.action}
            </span>
            <span className="font-body text-[12px] text-muted-foreground truncate">{e.detail}</span>
            <span className="font-mono text-[10px] text-muted-foreground/40">{e.ip}</span>
          </div>
        ))}
      </div>

      {/* Export */}
      <button className="bg-secondary border border-border text-muted-foreground font-body text-sm px-5 py-2.5 rounded-lg hover:text-foreground transition-colors">
        📥 Exporter en CSV
      </button>
    </div>
  );
};

export default AuditLog;
