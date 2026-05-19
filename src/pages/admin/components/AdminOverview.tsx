import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAdminData } from "@/hooks/useAdminData";
import { useIsMobile } from "@/hooks/use-mobile";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Stats {
  totalUsers: number;
  totalMeetings: number;
  activeSubscriptions: number;
  totalTasks: number;
  mrr: number;
  mrrHistory: { snapshot_date: string; mrr_euros: number; total_active: number }[];
  conversion: { free: number; starter: number; pro: number };
  newThisWeek: number;
  recentMeetings: { id: string; title: string; user_id: string; status: string; created_at: string }[];
}

const defaultStats: Stats = {
  totalUsers: 0, totalMeetings: 0, activeSubscriptions: 0, totalTasks: 0,
  mrr: 0, mrrHistory: [], conversion: { free: 0, starter: 0, pro: 0 },
  newThisWeek: 0, recentMeetings: [],
};

export default function AdminOverview() {
  const { fetchSection, loading } = useAdminData();
  const [stats, setStats] = useState<Stats>(defaultStats);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchSection("stats").then((d) => d && setStats({ ...defaultStats, ...d }));
  }, [fetchSection]);

  const prevMrr = stats.mrrHistory.length >= 2 ? stats.mrrHistory[stats.mrrHistory.length - 2]?.mrr_euros || 0 : 0;
  const mrrChange = prevMrr > 0 ? ((stats.mrr - prevMrr) / prevMrr * 100).toFixed(1) : null;

  const kpis = [
    { emoji: "👥", label: "Utilisateurs", value: stats.totalUsers },
    { emoji: "🎙", label: "Réunions", value: stats.totalMeetings },
    { emoji: "💳", label: "Abonnements", value: stats.activeSubscriptions },
    { emoji: "✅", label: "Tâches", value: stats.totalTasks },
    { emoji: "💰", label: "MRR", value: `${stats.mrr.toFixed(0)} €`, extra: mrrChange ? `${Number(mrrChange) >= 0 ? "+" : ""}${mrrChange}%` : null },
    { emoji: "📈", label: "Nouveaux (7j)", value: stats.newThisWeek },
  ];

  const mrrData = stats.mrrHistory.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    mrr: Number(s.mrr_euros),
  }));

  const totalConv = stats.conversion.free + stats.conversion.starter + stats.conversion.pro;
  const starterRate = stats.conversion.free > 0 ? (stats.conversion.starter / stats.conversion.free * 100).toFixed(1) : "0";
  const proRate = stats.conversion.starter > 0 ? (stats.conversion.pro / stats.conversion.starter * 100).toFixed(1) : "0";

  const statusColors: Record<string, string> = {
    completed: "bg-emerald-500/15 text-emerald-400",
    pending: "bg-muted text-muted-foreground",
    failed: "bg-destructive/15 text-destructive",
    partial: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]",
    transcribing: "bg-primary/15 text-primary",
    analyzing: "bg-[hsl(var(--violet))]/15 text-[hsl(var(--violet))]",
  };

  return (
    <div>
      <h1 className="font-display font-extrabold text-xl md:text-2xl text-foreground mb-4 md:mb-6">Vue d'ensemble</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/30">
            <CardContent className="p-3 md:p-5">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <span className="text-sm md:text-base">{kpi.emoji}</span>
                <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-wider text-muted-foreground truncate">{kpi.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <p className="font-display font-extrabold text-xl md:text-3xl text-foreground leading-none">
                  {loading ? "…" : typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                </p>
                {"extra" in kpi && kpi.extra && (
                  <span className={`text-[10px] md:text-xs font-mono ${Number(kpi.extra.replace("%", "").replace("+", "")) >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                    {kpi.extra}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MRR Chart */}
      <Card className="border-border/30 mb-6 md:mb-8">
        <CardContent className="p-4 md:p-6">
          <p className="font-display font-bold text-sm mb-3 md:mb-4">MRR — Historique</p>
          {mrrData.length < 2 ? (
            <p className="text-sm text-muted-foreground py-6 md:py-8 text-center">
              Données insuffisantes — revenez dans quelques jours
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
              <AreaChart data={mrrData}>
                <defs>
                  <linearGradient id="adminMrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--fuchsia))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--fuchsia))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: isMobile ? 9 : 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: isMobile ? 9 : 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} width={isMobile ? 40 : 60} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value.toFixed(2)} €`, "MRR"]}
                />
                <Area type="monotone" dataKey="mrr" stroke="hsl(var(--fuchsia))" fill="url(#adminMrrGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="border-border/30 mb-6 md:mb-8">
        <CardContent className="p-4 md:p-6">
          <p className="font-display font-bold text-sm mb-3 md:mb-4">Funnel de conversion</p>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            {[
              { label: "Free", count: stats.conversion.free, pct: totalConv > 0 ? (stats.conversion.free / totalConv * 100) : 0 },
              { label: "Starter", count: stats.conversion.starter, pct: totalConv > 0 ? (stats.conversion.starter / totalConv * 100) : 0, rate: `${starterRate}%` },
              { label: "Pro", count: stats.conversion.pro, pct: totalConv > 0 ? (stats.conversion.pro / totalConv * 100) : 0, rate: `${proRate}%` },
            ].map((step) => (
              <div key={step.label} className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{step.label}</span>
                  <span className="font-display font-bold text-sm text-foreground">{step.count}</span>
                </div>
                <Progress value={step.pct} className="h-2" />
                {"rate" in step && (
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">taux {step.rate}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-border/30">
        <CardContent className="p-4 md:p-6">
          <p className="font-display font-bold text-sm mb-3 md:mb-4">Activité récente</p>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {stats.recentMeetings.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-xs">Aucune réunion récente</p>
            ) : stats.recentMeetings.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <Badge variant="outline" className={`text-[9px] capitalize shrink-0 ${statusColors[m.status] || ""}`}>{m.status}</Badge>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/20">
                  {["Titre", "User ID", "Statut", "Date"].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentMeetings.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground text-xs">Aucune réunion récente</td></tr>
                ) : stats.recentMeetings.map(m => (
                  <tr key={m.id} className="border-b border-border/10">
                    <td className="px-3 py-2.5 text-xs text-foreground">{m.title}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">{m.user_id.slice(0, 8)}…</td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className={`text-[9px] capitalize ${statusColors[m.status] || ""}`}>{m.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
