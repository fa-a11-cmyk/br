import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminWebhooks() {
  const { fetchSection, loading } = useAdminData();
  const [webhooks, setWebhooks] = useState<any[]>([]);

  useEffect(() => {
    fetchSection("webhooks").then((d) => d && setWebhooks(d.webhooks || []));
  }, [fetchSection]);

  return (
    <div>
      <h1 className="font-display font-extrabold text-xl md:text-2xl text-foreground mb-4 md:mb-6">
        <Webhook className="inline h-5 w-5 md:h-6 md:w-6 mr-2" />
        Webhooks ({webhooks.length})
      </h1>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Chargement…</p>
      ) : webhooks.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Aucun webhook configuré</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {webhooks.map((w) => (
              <Card key={w.id} className="border-border/30">
                <CardContent className="p-3">
                  <p className="text-sm font-mono truncate mb-2">{w.url}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(w.events || []).map((e: string) => (
                      <Badge key={e} variant="outline" className="text-[9px]">{e}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={`text-[10px] border-0 ${w.status === "active" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-destructive/10 text-destructive"}`}>{w.status}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleDateString("fr-FR")}</span>
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
                    {["URL", "Events", "Statut", "Créé le"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((w) => (
                    <tr key={w.id} className="border-b border-border/10 hover:bg-muted/10">
                      <td className="px-4 py-3 font-mono text-xs text-foreground max-w-[300px] truncate">{w.url}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(w.events || []).map((e: string) => (<Badge key={e} variant="outline" className="text-[9px]">{e}</Badge>))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] border-0 ${w.status === "active" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-destructive/10 text-destructive"}`}>{w.status}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleDateString("fr-FR")}</td>
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
