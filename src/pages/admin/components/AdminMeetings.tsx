import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mic } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  pending: "bg-muted text-muted-foreground",
  transcribing: "bg-primary/10 text-primary",
  analyzing: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
  partial: "bg-[hsl(var(--warning,40_100%_50%))]/10 text-[hsl(var(--warning,40_100%_50%))]",
};

export default function AdminMeetings() {
  const { fetchSection, loading } = useAdminData();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchSection("meetings").then((d) => d && setMeetings(d.meetings || []));
  }, [fetchSection]);

  const filtered = meetings.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <h1 className="font-display font-extrabold text-xl md:text-2xl text-foreground mb-4 md:mb-6">
        <Mic className="inline h-5 w-5 md:h-6 md:w-6 mr-2" />
        Réunions ({meetings.length})
      </h1>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30 border-border/30" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["ALL", "completed", "pending", "failed"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "secondary" : "ghost"} size="sm" className="text-xs" onClick={() => setStatusFilter(s)}>
              {s === "ALL" ? "Tous" : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Aucune réunion</p>
        ) : filtered.map((m) => (
          <Card key={m.id} className="border-border/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-1.5">
                <p className="font-display font-bold text-sm text-foreground truncate flex-1 mr-2">{m.title}</p>
                <Badge className={`text-[9px] border-0 shrink-0 ${STATUS_COLORS[m.status] || "bg-muted text-muted-foreground"}`}>{m.status}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[9px]">{m.meeting_type}</Badge>
                <span className="text-[10px] text-muted-foreground">{m.duration_seconds ? `${Math.floor(m.duration_seconds / 60)}min` : "—"}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{new Date(m.created_at).toLocaleDateString("fr-FR")}</span>
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
                {["Titre", "Type", "Statut", "Durée", "Langue", "Créé le"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucune réunion</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="border-b border-border/10 hover:bg-muted/10">
                  <td className="px-4 py-3 font-display font-bold text-xs text-foreground max-w-[200px] truncate">{m.title}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{m.meeting_type}</Badge></td>
                  <td className="px-4 py-3"><Badge className={`text-[10px] border-0 ${STATUS_COLORS[m.status] || "bg-muted text-muted-foreground"}`}>{m.status}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.duration_seconds ? `${Math.floor(m.duration_seconds / 60)}min` : "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{m.language || "fr"}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
