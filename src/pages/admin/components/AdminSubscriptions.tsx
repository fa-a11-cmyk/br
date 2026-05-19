import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminSubscriptions() {
  const { fetchSection, loading } = useAdminData();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    fetchSection("subscriptions").then((d) => d && setSubscriptions(d.subscriptions || []));
  }, [fetchSection]);

  const planCounts = subscriptions.reduce((acc: Record<string, number>, s) => {
    acc[s.plan] = (acc[s.plan] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display font-extrabold text-xl md:text-2xl text-foreground mb-4 md:mb-6">
        <CreditCard className="inline h-5 w-5 md:h-6 md:w-6 mr-2" />
        Abonnements ({subscriptions.length})
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        {Object.entries(planCounts).map(([plan, count]: [string, number]) => (
          <Card key={plan} className="border-border/30">
            <CardContent className="p-3 md:p-4 text-center">
              <p className="font-mono text-[9px] md:text-[10px] uppercase text-muted-foreground mb-1">{plan}</p>
              <p className="font-display font-extrabold text-xl md:text-2xl text-foreground">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Chargement…</p>
        ) : subscriptions.map((s) => (
          <Card key={s.id} className="border-border/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-[10px] capitalize">{s.plan}</Badge>
                <Badge className={`text-[10px] border-0 ${s.status === "active" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"}`}>{s.status}</Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-mono text-[10px] truncate">{s.stripe_customer_id || "—"}</p>
                <div className="flex justify-between">
                  <span>{s.current_period_start ? new Date(s.current_period_start).toLocaleDateString("fr-FR") : "—"}</span>
                  <span>→ {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("fr-FR") : "—"}</span>
                </div>
                {s.cancel_at_period_end && <p className="text-[10px] text-[#F59E0B]">⚠️ Annulation prévue</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="border-border/30 hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/20">
                {["Plan", "Statut", "Stripe Customer", "Début", "Fin", "Annulation"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</td></tr>
              ) : subscriptions.map((s) => (
                <tr key={s.id} className="border-b border-border/10 hover:bg-muted/10">
                  <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] capitalize">{s.plan}</Badge></td>
                  <td className="px-4 py-3"><Badge className={`text-[10px] border-0 ${s.status === "active" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"}`}>{s.status}</Badge></td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{s.stripe_customer_id || "—"}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{s.current_period_start ? new Date(s.current_period_start).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="px-4 py-3 font-mono text-[10px]">{s.cancel_at_period_end ? "⚠️ Oui" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
