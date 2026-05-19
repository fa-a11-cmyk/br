import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminRateLimits() {
  const { fetchSection, loading } = useAdminData();
  const [limits, setLimits] = useState<any[]>([]);

  useEffect(() => {
    fetchSection("rate_limits").then((d) => d && setLimits(d.rateLimits || []));
  }, [fetchSection]);

  return (
    <div>
      <h1 className="font-display font-extrabold text-xl md:text-2xl text-foreground mb-4 md:mb-6">
        <Gauge className="inline h-5 w-5 md:h-6 md:w-6 mr-2" />
        Rate Limits ({limits.length})
      </h1>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Chargement…</p>
      ) : limits.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Aucune limite enregistrée</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {limits.map((r) => (
              <Card key={r.id} className="border-border/30">
                <CardContent className="p-3">
                  <p className="font-mono text-sm text-foreground mb-1">{r.function_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground truncate mb-2">{r.identifier}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{r.request_count} req</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(r.window_start).toLocaleString("fr-FR")}</span>
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
                    {["Function", "Identifier", "Requêtes", "Fenêtre"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {limits.map((r) => (
                    <tr key={r.id} className="border-b border-border/10 hover:bg-muted/10">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{r.function_name}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground max-w-[200px] truncate">{r.identifier}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{r.request_count}</Badge></td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{new Date(r.window_start).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
