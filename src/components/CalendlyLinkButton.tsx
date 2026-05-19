import { useState } from "react";
import { useCalendly } from "@/hooks/useCalendly";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendlyLinkButtonProps {
  meetingId: string;
  meetingTitle: string;
}

export function CalendlyLinkButton({ meetingId, meetingTitle }: CalendlyLinkButtonProps) {
  const { isConnected, eventTypes, createLink, loading } = useCalendly();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedET, setSelectedET] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");
  const { toast } = useToast();

  if (!isConnected) {
    return (
      <Button size="sm" variant="outline" disabled title="Connectez Calendly dans Configuration">
        📅 Calendly non connecté
      </Button>
    );
  }

  if (createdUrl) {
    return (
      <div className="flex items-center gap-2">
        <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">{createdUrl}</code>
        <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(createdUrl); toast({ title: "Lien copié ! 📋" }); }}>📋</Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {!showPicker ? (
        <Button size="sm" variant="outline" onClick={() => setShowPicker(true)}>📅 Planifier un suivi</Button>
      ) : (
        <div className="flex items-center gap-2">
          <Select value={selectedET} onValueChange={setSelectedET}>
            <SelectTrigger className="h-8 text-xs w-48"><SelectValue placeholder="Type de réunion" /></SelectTrigger>
            <SelectContent>
              {eventTypes.map((et: any) => (
                <SelectItem key={et.uri} value={et.uri} className="text-xs">{et.name} ({et.duration}min)</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!selectedET || loading}
            onClick={async () => {
              const url = await createLink(selectedET, `Suivi : ${meetingTitle}`, meetingId);
              if (url) { setCreatedUrl(url); setShowPicker(false); }
            }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowPicker(false); setSelectedET(""); }}>✕</Button>
        </div>
      )}
    </div>
  );
}
