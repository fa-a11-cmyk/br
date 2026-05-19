import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

export default function AdminLeadsCaptures() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("leads_captures")
      .select("*, leads_magnets(title), blog_articles(title)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => { setLeads(data || []); setLoading(false); });
  }, []);

  const filtered = leads.filter(l =>
    !search || l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  const thisWeekLeads = leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 7 * 86400000)).length;

  const exportCSV = () => {
    const headers = ["Email", "Prénom", "Entreprise", "Téléphone", "Source", "Magnet", "Article", "Date", "UTM Source"];
    const rows = filtered.map(l => [
      l.email, l.first_name || "", l.company_name || "", l.phone || "", l.source || "",
      (l.leads_magnets as any)?.title || "", (l.blog_articles as any)?.title || "",
      new Date(l.created_at).toLocaleDateString("fr-FR"), l.utm_source || "",
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Leads capturés</h2>
          <p className="text-sm text-muted-foreground">{leads.length} leads</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Exporter CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total leads", value: leads.length, icon: "👥" },
          { label: "Cette semaine", value: thisWeekLeads, icon: "📈" },
          { label: "Taux email", value: `${Math.round(leads.filter(l => l.email).length / Math.max(leads.length, 1) * 100)}%`, icon: "✉️" },
        ].map(kpi => (
          <Card key={kpi.label} className="p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{kpi.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="font-bold text-lg">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Input placeholder="Rechercher par email, nom, entreprise..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      {loading ? (
        [1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />)
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">📧</p>
          <p className="text-sm">{search ? "Aucun résultat" : "Aucun lead capturé"}</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/30 bg-muted/20">
                <tr>
                  {["Prénom", "Entreprise", "Email", "Téléphone", "Leads Magnet", "Date"].map(h => (
                    <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b border-border/30 hover:bg-muted/10">
                    <td className="px-4 py-2">{l.first_name || "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{l.company_name || "—"}</td>
                    <td className="px-4 py-2">
                      <a href={`mailto:${l.email}`} className="text-primary hover:underline">{l.email}</a>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {l.phone ? <a href={`tel:${l.phone}`} className="text-primary hover:underline">{l.phone}</a> : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[150px]">
                      {(l.leads_magnets as any)?.title || "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(l.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
