import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/hooks/useAdminData";
import { useAdminActions } from "@/pages/admin/hooks/useAdminActions";

export default function AdminAffiliates() {
  const { fetchSection, loading } = useAdminData();
  const { executeAction } = useAdminActions();
  const [data, setData] = useState<any>(null);

  useEffect(() => { fetchSection("affiliates").then(setData); }, [fetchSection]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">🤝 Programme d'affiliation</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Affiliés actifs", value: data?.totalAffiliates || 0, icon: "👥" },
          { label: "Commissions en attente", value: `${data?.totalPendingEuros || 0}€`, icon: "⏳" },
          { label: "Total commissions", value: data?.pendingCommissions?.length || 0, icon: "💰" },
        ].map(kpi => (
          <Card key={kpi.label} className="p-4">
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">{kpi.label}</span><span>{kpi.icon}</span></div>
            <div className="text-2xl font-bold mt-1">{kpi.value}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/30"><h3 className="font-medium">🏆 Classement affiliés</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/30">
              <tr>{["#", "Code", "Nom", "Entreprise", "Conversions", "Gains", "Commission", "Statut"].map(h => <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8">Chargement…</td></tr>
              ) : (data?.leaderboard || []).map((a: any) => (
                <tr key={a.id} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-4 py-3 font-bold text-muted-foreground">#{a.rank}</td>
                  <td className="px-4 py-3"><code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{a.code}</code></td>
                  <td className="px-4 py-3 font-medium">{a.first_name} {a.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.company || "—"}</td>
                  <td className="px-4 py-3 text-center">{a.total_conversions}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{a.total_earned_euros}€</td>
                  <td className="px-4 py-3">{a.commission_rate}%</td>
                  <td className="px-4 py-3"><Badge className="text-xs bg-green-500/10 text-green-600">{a.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <h3 className="font-medium">⏳ Commissions à approuver</h3>
          <Badge variant="outline">{data?.totalPendingEuros || 0}€ en attente</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/30">
              <tr>{["Affilié", "Montant", "Plan", "Taux", "Date", "Action"].map(h => <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(data?.pendingCommissions || []).map((c: any) => (
                <tr key={c.id} className="border-b border-border/30">
                  <td className="px-4 py-3"><code className="text-xs bg-muted px-1 rounded">{(c.affiliates as any)?.code}</code></td>
                  <td className="px-4 py-3 font-bold text-green-600">{c.amount_euros}€</td>
                  <td className="px-4 py-3">{c.plan}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.commission_rate}%</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={async () => {
                      await executeAction("approve_commission", null, { commissionId: c.id });
                      const updated = await fetchSection("affiliates");
                      setData(updated);
                    }}>✓ Approuver</Button>
                  </td>
                </tr>
              ))}
              {!data?.pendingCommissions?.length && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucune commission en attente</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
