import { useState, useEffect, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  meetingId: string;
  reportId?: string;
  meetingTitle: string;
  children: ReactNode;
}

type Expiration = "24h" | "7d" | "30d" | "permanent";

interface SharedLink {
  id: string;
  token: string;
  view_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export function ShareReportDialog({ meetingId, reportId, meetingTitle, children }: Props) {
  const [open, setOpen] = useState(false);
  const [expiration, setExpiration] = useState<Expiration>("permanent");
  const [showTranscription, setShowTranscription] = useState(false);
  const [showContacts, setShowContacts] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [activeLinks, setActiveLinks] = useState<SharedLink[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) loadLinks();
  }, [open]);

  const loadLinks = async () => {
    const { data } = await supabase
      .from("shared_reports")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setActiveLinks((data as any[]) || []);
  };

  const generateLink = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const durations: Record<string, number> = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
      const expiresAt = expiration === "permanent" ? null : new Date(Date.now() + durations[expiration]).toISOString();

      const { data, error } = await supabase
        .from("shared_reports")
        .insert({
          report_id: reportId || null,
          meeting_id: meetingId,
          user_id: user.id,
          expires_at: expiresAt,
          show_transcription: showTranscription,
          show_contacts: showContacts,
        })
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/rapport/${(data as any).token}`;
      setGeneratedUrl(url);
      setActiveLinks(prev => [(data as any), ...prev]);
      toast({ title: "Lien de partage créé ✓" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const revokeLink = async (linkId: string) => {
    await supabase.from("shared_reports").update({ is_active: false }).eq("id", linkId);
    setActiveLinks(prev => prev.filter(l => l.id !== linkId));
    toast({ title: "Lien révoqué ✓" });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    toast({ title: "Lien copié ✓" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">🔗 Partager ce rapport</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">Expiration</label>
            <div className="flex gap-2">
              {(["24h", "7d", "30d", "permanent"] as Expiration[]).map(e => (
                <button key={e} onClick={() => setExpiration(e)}
                  className={`font-mono text-[11px] px-3 py-1.5 rounded-full transition-colors ${expiration === e ? "bg-fuchsia-d border border-primary/30 text-primary" : "bg-secondary border border-border text-muted-foreground"}`}>
                  {e === "permanent" ? "Permanent" : e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">Contenu visible</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                <span className="text-sm">Résumé et décisions</span>
                <Badge variant="outline" className="text-[9px]">Toujours</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                <span className="text-sm">Contacts détectés</span>
                <Switch checked={showContacts} onCheckedChange={setShowContacts} />
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                <span className="text-sm">Transcription complète</span>
                <Switch checked={showTranscription} onCheckedChange={setShowTranscription} />
              </div>
            </div>
          </div>

          <Button onClick={generateLink} disabled={generating} className="w-full bg-gradient-primary text-white">
            {generating ? "Génération…" : "Générer le lien"}
          </Button>

          {generatedUrl && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="font-mono text-xs text-muted-foreground break-all">{generatedUrl}</p>
              <Button variant="outline" size="sm" onClick={copyUrl}>📋 Copier</Button>
            </div>
          )}

          {activeLinks.length > 0 && (
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">Liens actifs ({activeLinks.length})</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {activeLinks.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg text-xs">
                    <div>
                      <span className="text-muted-foreground">👁 {l.view_count} vue(s)</span>
                      <span className="mx-2">·</span>
                      <span className="text-muted-foreground">{l.expires_at ? new Date(l.expires_at).toLocaleDateString("fr-FR") : "Permanent"}</span>
                    </div>
                    <button onClick={() => revokeLink(l.id)} className="text-destructive hover:underline text-[10px]">Révoquer</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
