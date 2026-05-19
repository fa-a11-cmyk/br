import { useState } from "react";
import { useCalendly } from "@/hooks/useCalendly";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CalendlyWidget() {
  const {
    connection, events, eventTypes, links, loading, isConnected,
    connectWithPAT, disconnect, syncEvents, createLink,
  } = useCalendly();
  const { toast } = useToast();

  const [showConnect, setShowConnect] = useState(false);
  const [pat, setPat] = useState("");
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [selectedET, setSelectedET] = useState("");
  const [linkContext, setLinkContext] = useState("");

  return (
    <div className="rounded-xl border border-border/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="font-medium text-sm text-foreground">Calendly</p>
            <p className="text-xs text-muted-foreground">Synchronisez vos réunions planifiées</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Badge className="bg-success-d text-[hsl(var(--success))] text-xs">✅ Connecté</Badge>
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={disconnect}>Déconnecter</Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setShowConnect(true)}>Connecter</Button>
          )}
        </div>
      </div>

      {showConnect && !isConnected && (
        <div className="space-y-3 p-3 bg-secondary rounded-xl">
          <h4 className="text-sm font-medium text-foreground">Connexion avec Personal Access Token</h4>
          <p className="text-xs text-muted-foreground">
            1. Allez sur{" "}
            <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              calendly.com/integrations
            </a>
            <br />2. Cliquez sur "Personal Access Tokens"
            <br />3. Créez un token et collez-le ici
          </p>
          <Input type="password" placeholder="eyJraWQiOiJwZXJzb25hbC1..." value={pat} onChange={e => setPat(e.target.value)} className="font-mono text-xs" />
          <div className="flex gap-2">
            <Button size="sm" disabled={!pat.trim() || loading} onClick={async () => { await connectWithPAT(pat); setPat(""); setShowConnect(false); }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Connecter
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowConnect(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {isConnected && connection && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
            <div>
              <p className="text-sm font-medium text-foreground">{connection.user_name}</p>
              <p className="text-xs text-muted-foreground">{connection.user_email}</p>
              {connection.scheduling_url && (
                <a href={connection.scheduling_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                  {connection.scheduling_url}
                </a>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={syncEvents} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🔄"}
            </Button>
          </div>

          {events.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Prochaines réunions ({events.length})</p>
              <div className="space-y-2">
                {events.slice(0, 5).map((ev: any) => (
                  <div key={ev.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/30 text-sm">
                    <div>
                      <p className="font-medium text-xs text-foreground truncate max-w-[180px]">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">
                        📅 {new Date(ev.start_time).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {ev.end_time && ev.start_time ? `${Math.round((new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime()) / 60000)}min` : "—"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            {!showCreateLink ? (
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setShowCreateLink(true)}>
                🔗 Créer un lien de réservation
              </Button>
            ) : (
              <div className="space-y-2 p-3 bg-secondary rounded-xl">
                <p className="text-xs font-medium text-foreground">Créer un lien de réservation</p>
                <Select value={selectedET} onValueChange={setSelectedET}>
                  <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Type de réunion..." /></SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((et: any) => (
                      <SelectItem key={et.uri} value={et.uri} className="text-xs">{et.name} ({et.duration}min)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Contexte (optionnel)" value={linkContext} onChange={e => setLinkContext(e.target.value)} className="text-xs h-8" />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 text-xs" disabled={!selectedET || loading}
                    onClick={async () => {
                      const url = await createLink(selectedET, linkContext);
                      if (url) {
                        navigator.clipboard.writeText(url);
                        toast({ title: "Lien copié ! 📋" });
                        setShowCreateLink(false);
                        setSelectedET("");
                        setLinkContext("");
                      }
                    }}>
                    Créer et copier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowCreateLink(false); setSelectedET(""); }}>✕</Button>
                </div>
              </div>
            )}
          </div>

          {links.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Liens récents</p>
              <div className="space-y-1">
                {links.slice(0, 3).map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between text-xs py-1.5">
                    <span className="text-muted-foreground truncate max-w-[200px]">{link.context || "Lien Calendly"}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { navigator.clipboard.writeText(link.booking_url); toast({ title: "Copié !" }); }} className="text-primary hover:underline">📋</button>
                      <a href={link.booking_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">↗</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
