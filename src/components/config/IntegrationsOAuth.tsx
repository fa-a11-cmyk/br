import { useState } from "react";
import { useOAuth } from "@/hooks/useOAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const PROVIDERS = [
  {
    id: "google_meet", name: "Google Meet", icon: "🎯",
    color: "bg-blue-500/10 border-blue-500/30",
    description: "Importez vos enregistrements Google Meet depuis Drive",
    scopes: ["Accès en lecture à Google Drive", "Accès au calendrier Google"],
  },
  {
    id: "zoom", name: "Zoom", icon: "📹",
    color: "bg-sky-500/10 border-sky-500/30",
    description: "Importez vos enregistrements cloud Zoom automatiquement",
    scopes: ["Accès aux enregistrements cloud", "Lecture des réunions passées"],
  },
];

export function IntegrationsOAuth() {
  const { connections, loading, syncing, recordings, importing, connectProvider, disconnectProvider, syncRecordings, loadRecordings, importRecording, isConnected, getConnection } = useOAuth();
  const [showRecordings, setShowRecordings] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-[3px] text-muted-foreground/60 mb-4 mt-10">Connexions vidéo (OAuth)</p>

      {PROVIDERS.map(provider => {
        const conn = getConnection(provider.id);
        const connected = isConnected(provider.id);
        const providerRecordings = recordings.filter(r => r.provider === provider.id);

        return (
          <div key={provider.id} className={`rounded-xl border p-4 ${provider.color}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <p className="font-display font-bold text-sm text-foreground">{provider.name}</p>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <Badge className="bg-green-500/10 text-green-600 text-xs">✅ Connecté</Badge>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => disconnectProvider(provider.id)}>Déconnecter</Button>
                  </>
                ) : (
                  <Button size="sm" disabled={loading} onClick={() => connectProvider(provider.id)}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Connecter
                  </Button>
                )}
              </div>
            </div>

            {connected && conn && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                <p className="text-xs text-muted-foreground">{conn.provider_email}{conn.metadata?.name && ` · ${conn.metadata.name}`}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7" disabled={syncing} onClick={async () => { await syncRecordings(provider.id); setShowRecordings(provider.id); }}>
                    {syncing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "🔄"} Synchroniser
                  </Button>
                  {providerRecordings.length > 0 && (
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowRecordings(showRecordings === provider.id ? null : provider.id)}>
                      {providerRecordings.length} enregistrement(s)
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!connected && (
              <div className="mt-2 space-y-1">
                {provider.scopes.map(scope => (
                  <p key={scope} className="text-xs text-muted-foreground flex items-center gap-1"><span>🔒</span> {scope}</p>
                ))}
              </div>
            )}

            {showRecordings === provider.id && providerRecordings.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Enregistrements disponibles</p>
                {providerRecordings.map(rec => (
                  <div key={rec.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {rec.start_time ? new Date(rec.start_time).toLocaleDateString("fr-FR") : "Date inconnue"}
                        {rec.duration_seconds && ` · ${Math.round(rec.duration_seconds / 60)}min`}
                      </p>
                    </div>
                    <div className="ml-3">
                      {rec.status === "completed" ? (
                        <Badge className="text-xs bg-green-500/10 text-green-600">✅ Importé</Badge>
                      ) : rec.status === "processing" ? (
                        <Badge className="text-xs bg-blue-500/10 text-blue-600">⚡ En cours</Badge>
                      ) : (
                        <Button size="sm" className="text-xs h-7" disabled={importing === rec.id} onClick={() => importRecording(rec.id)}>
                          {importing === rec.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Importer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
