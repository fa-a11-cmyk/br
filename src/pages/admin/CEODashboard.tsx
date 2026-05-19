import { useCEODashboard } from "@/hooks/useCEODashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2 } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ── Revenue KPIs ── */
function RevenueKPIs({ overview, revenue }: any) {
  const mrr = overview?.mrr;
  const stripeMrr = revenue?.mrr_stripe;
  const displayMrr = stripeMrr || mrr?.total || 0;

  const kpis = [
    {
      label: "MRR", value: `${displayMrr.toFixed(0)}€`,
      sub: stripeMrr ? "Depuis Stripe ✓" : "Depuis DB",
      icon: "💰",
      trend: mrr?.trend_vs_yesterday > 0 ? `+${mrr.trend_vs_yesterday.toFixed(0)}€` : null,
    },
    { label: "ARR", value: `${(displayMrr * 12).toFixed(0)}€`, sub: "Annualisé", icon: "📈" },
    {
      label: "Churn Rate", value: `${overview?.churn?.rate || 0}%`, sub: "Ce mois",
      icon: (overview?.churn?.rate || 0) > 5 ? "⚠️" : "✅",
    },
    {
      label: "Revenu MTD",
      value: revenue?.mtd_revenue ? `${revenue.mtd_revenue.toFixed(0)}€` : "—",
      sub: "Ce mois (Stripe)", icon: "🧾",
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-display font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Revenue</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-body">{kpi.label}</span>
              <span className="text-lg">{kpi.icon}</span>
            </div>
            <div className="text-2xl font-display font-bold">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-1 font-body">
              {kpi.sub}
              {kpi.trend && <span className="text-green-500 ml-1">{kpi.trend}</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Customer Metrics ── */
function CustomerMetrics({ overview }: any) {
  const c = overview?.customers;
  const conv = overview?.conversion;

  const plans = [
    { label: "Free", count: c?.free || 0, color: "hsl(var(--muted-foreground))" },
    { label: "Starter", count: c?.starter || 0, color: "hsl(var(--primary))" },
    { label: "Pro", count: c?.pro || 0, color: "hsl(var(--fuchsia))" },
  ];
  const total = plans.reduce((s, p) => s + p.count, 0);

  const funnel = [
    { label: "Inscriptions", value: c?.new_mtd || 0, icon: "👤" },
    { label: "Activés (≥1 réunion)", value: conv?.activated || 0, icon: "🎙" },
    { label: "Convertis (payants)", value: c?.converted_mtd || 0, icon: "💳" },
  ];

  return (
    <div>
      <h2 className="text-sm font-display font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Customers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-display font-medium text-sm mb-4">Distribution par plan</h3>
          <div className="space-y-3">
            {plans.map((plan) => {
              const pct = total > 0 ? Math.round((plan.count / total) * 100) : 0;
              return (
                <div key={plan.label}>
                  <div className="flex justify-between text-sm mb-1 font-body">
                    <span>{plan.label}</span>
                    <span className="font-medium">{plan.count} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: plan.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border/30 text-sm font-body">
            <span className="text-muted-foreground">Total :</span>
            <span className="font-bold ml-2">{c?.total || 0} utilisateurs</span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-display font-medium text-sm mb-4">Funnel ce mois</h3>
          <div className="space-y-4">
            {funnel.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-primary/10">{step.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-bold">{step.value}</span>
                  </div>
                  {i > 0 && (c?.new_mtd || 0) > 0 && (
                    <div className="text-xs text-muted-foreground">{Math.round((step.value / c.new_mtd) * 100)}% des inscrits</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-2 rounded-lg bg-primary/5 text-center">
            <span className="text-sm font-medium text-primary">Taux conversion : {conv?.free_to_paid || 0}%</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Trends Charts ── */
function TrendsCharts({ trends }: any) {
  const history = trends?.history || [];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

  return (
    <div>
      <h2 className="text-sm font-display font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Tendances 30 jours</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-display font-medium text-sm mb-4">Évolution MRR (€)</h3>
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="snapshot_date" tick={{ fontSize: 10 }} tickFormatter={formatDate} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}€`} />
                <Tooltip formatter={(v: any) => [`${v}€`, "MRR"]} />
                <Line type="monotone" dataKey="mrr_euros" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Données insuffisantes — revenez demain</div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-display font-medium text-sm mb-4">DAU vs MAU</h3>
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="snapshot_date" tick={{ fontSize: 10 }} tickFormatter={formatDate} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="mau" stroke="hsl(var(--fuchsia))" fill="hsl(var(--fuchsia) / 0.1)" name="MAU" />
                <Area type="monotone" dataKey="dau" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" name="DAU" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Données insuffisantes — revenez demain</div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ── Engagement Metrics ── */
function EngagementMetrics({ engagement }: any) {
  const byType = engagement?.meetings_by_type || {};
  const skills = engagement?.top_openclaw_skills || [];
  const eng = engagement?.daily_engagement || [];

  const typeData = Object.entries(byType)
    .map(([type, count]) => ({ name: type, value: count as number }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--fuchsia))", "hsl(var(--violet))", "#22c55e", "#ef4444", "#06b6d4"];

  return (
    <div>
      <h2 className="text-sm font-display font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Engagement Produit</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-display font-medium text-sm mb-4">Réunions par type (mois)</h3>
          {typeData.length > 0 ? (
            <div className="space-y-2">
              {typeData.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs flex-1 text-muted-foreground capitalize font-body">{t.name}</span>
                  <span className="text-xs font-bold">{t.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-display font-medium text-sm mb-4">Métriques temps réel</h3>
          <div className="space-y-3">
            {[
              { label: "DAU/MAU ratio", value: `${engagement?.dau_mau_ratio || 0}%`, tip: "> 20% = très bon" },
              { label: "Réunions aujourd'hui", value: eng[0]?.meetings_count || 0 },
              {
                label: "Taux complétion",
                value: eng[0]?.meetings_count > 0
                  ? `${Math.round((eng[0].completed_count / eng[0].meetings_count) * 100)}%`
                  : "—",
                tip: "Réunions transcrites",
              },
            ].map((m) => (
              <div key={m.label} className="flex justify-between items-start font-body">
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  {"tip" in m && m.tip && <p className="text-xs text-muted-foreground/60">{m.tip}</p>}
                </div>
                <span className="font-bold text-sm">{String(m.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-display font-medium text-sm mb-4">⚡ Top Skills OpenClaw</h3>
          {skills.length > 0 ? (
            <div className="space-y-2">
              {skills.map((s: any) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-xs flex-1 text-muted-foreground truncate font-body">{s.name}</span>
                  <span className="text-xs font-bold">{s.usage_count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">OpenClaw pas encore utilisé</p>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ── Top Users ── */
function TopUsers({ overview }: any) {
  const users = overview?.top_users || [];

  return (
    <div>
      <h2 className="text-sm font-display font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Top utilisateurs (30 jours)</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="border-b border-border/30">
              <tr>
                {["Utilisateur", "Entreprise", "Plan", "Réunions", "Score moyen", "Dernière activité"].map((h) => (
                  <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted-foreground py-8 text-sm">Aucune donnée</td></tr>
              ) : (
                users.map((u: any, i: number) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3"><span className="font-medium">{u.first_name} {u.last_name}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{u.company || "—"}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs capitalize">{u.plan || "free"}</Badge></td>
                    <td className="px-4 py-3 font-bold">{u.meetings_count}</td>
                    <td className="px-4 py-3">{u.avg_efficiency ? `${Math.round(u.avg_efficiency)}/100` : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{u.last_activity ? new Date(u.last_activity).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── Main Page ── */
const CEODashboard = () => {
  const { overview, trends, engagement, revenue, loading, lastUpdated, refresh } = useCEODashboard();

  if (loading && !overview) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">📈 CEO Dashboard</h1>
          <p className="text-sm text-muted-foreground font-body">Métriques business temps réel</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground font-mono">
              Mis à jour {lastUpdated.toLocaleTimeString("fr-FR")}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <RevenueKPIs overview={overview} revenue={revenue} />
      <CustomerMetrics overview={overview} />
      <TrendsCharts trends={trends} />
      <EngagementMetrics engagement={engagement} />
      <TopUsers overview={overview} />
    </div>
  );
};

export default CEODashboard;
