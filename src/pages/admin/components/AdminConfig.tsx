import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Bell, Loader2, Check, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FeatureFlag {
  key: string;
  label: string;
  enabled: boolean;
}

const FLAG_LABELS: Record<string, string> = {
  email_builder: "Email Builder",
  pdf_builder: "PDF Builder",
  openclaw: "OpenClaw IA",
  skills_marketplace: "Skills Marketplace",
  live_transcription: "Transcription Live (Bot)",
  export_comptable: "Export Comptable",
};

export default function AdminConfig() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingFlags, setSavingFlags] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("admin_config" as any)
        .select("config_key, config_value")
        .in("config_key", ["feature_flags", "global_announcement", "contact_settings"]);

      const rows = (data as any[]) || [];
      const flagsRow = rows.find((r: any) => r.config_key === "feature_flags");
      const announcementRow = rows.find((r: any) => r.config_key === "global_announcement");
      const contactRow = rows.find((r: any) => r.config_key === "contact_settings");

      if (flagsRow) {
        const flagValues = flagsRow.config_value as Record<string, boolean>;
        setFlags(Object.entries(flagValues).map(([key, enabled]) => ({ key, label: FLAG_LABELS[key] || key, enabled })));
      }

      if (announcementRow) {
        const annValue = announcementRow.config_value as { message: string; active: boolean };
        setAnnouncement(annValue.message || "");
        setAnnouncementActive(annValue.active || false);
      }

      if (contactRow) {
        const cv = contactRow.config_value as any;
        setCalendlyUrl(cv.calendly_url || "");
        setWhatsappNumber(cv.whatsapp_number || "");
        setContactName(cv.contact_name || "");
        setContactRole(cv.contact_role || "");
      }
    } catch (e) {
      console.error("Failed to load admin config:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const toggleFlag = (key: string) => {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
  };

  const saveFlags = async () => {
    setSavingFlags(true);
    try {
      const flagValues: Record<string, boolean> = {};
      flags.forEach((f) => { flagValues[f.key] = f.enabled; });
      const { error } = await supabase.functions.invoke("admin-actions", {
        body: { action: "update_config", userId: null, payload: { key: "feature_flags", value: flagValues } },
      });
      if (error) throw error;
      toast({ title: "Feature flags sauvegardés ✓" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSavingFlags(false);
  };

  const saveAnnouncement = async (active: boolean) => {
    setSavingAnnouncement(true);
    try {
      const { error } = await supabase.functions.invoke("admin-actions", {
        body: { action: "update_config", userId: null, payload: { key: "global_announcement", value: { message: announcement, active } } },
      });
      if (error) throw error;
      setAnnouncementActive(active);
      toast({ title: active ? "Annonce publiée ✓" : "Annonce effacée ✓" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSavingAnnouncement(false);
  };

  const saveContactSettings = async () => {
    setSavingContact(true);
    try {
      const { error } = await supabase.functions.invoke("admin-actions", {
        body: {
          action: "update_config", userId: null,
          payload: {
            key: "contact_settings",
            value: { calendly_url: calendlyUrl, whatsapp_number: whatsappNumber, contact_name: contactName, contact_role: contactRole },
          },
        },
      });
      if (error) throw error;
      toast({ title: "Paramètres de contact sauvegardés ✓" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSavingContact(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-display font-extrabold text-xl md:text-2xl text-foreground mb-4 md:mb-6">
        <Settings className="inline h-5 w-5 md:h-6 md:w-6 mr-2" />
        Configuration globale
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Feature Flags */}
        <Card className="border-border/30">
          <CardContent className="p-4 md:p-6">
            <p className="font-display font-bold text-sm mb-3 md:mb-4">Feature Flags</p>
            <div className="space-y-3 md:grid md:grid-cols-1 md:gap-3 md:space-y-0">
              {flags.map((f) => (
                <div key={f.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="font-body text-sm text-foreground flex-1 min-w-0 mr-3">{f.label}</span>
                  <Switch checked={f.enabled} onCheckedChange={() => toggleFlag(f.key)} />
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full text-xs" size="sm" onClick={saveFlags} disabled={savingFlags}>
              {savingFlags ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Sauvegarder
            </Button>
          </CardContent>
        </Card>

        {/* Annonce globale */}
        <Card className="border-border/30">
          <CardContent className="p-4 md:p-6">
            <p className="font-display font-bold text-sm mb-3 md:mb-4">
              <Bell className="inline h-4 w-4 mr-1" />
              Annonce globale
              {announcementActive && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500">Active</span>
              )}
            </p>
            <Textarea
              placeholder="Message de maintenance ou annonce visible par tous les utilisateurs..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="bg-muted/30 border-border/30 mb-3"
              rows={4}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" className="text-xs flex-1" onClick={() => saveAnnouncement(true)} disabled={savingAnnouncement || !announcement.trim()}>
                {savingAnnouncement ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                Publier
              </Button>
              <Button size="sm" variant="outline" className="text-xs flex-1 sm:flex-none" onClick={() => { setAnnouncement(""); saveAnnouncement(false); }} disabled={savingAnnouncement}>
                Effacer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Calendly */}
        <Card className="border-border/30 lg:col-span-2">
          <CardContent className="p-4 md:p-6">
            <p className="font-display font-bold text-sm mb-3 md:mb-4">
              <Calendar className="inline h-4 w-4 mr-1" />
              Prise de rendez-vous & Contact
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Configurez le lien Calendly et les coordonnées affichés dans le chat et la landing page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Lien Calendly</label>
                <Input
                  value={calendlyUrl}
                  onChange={(e) => setCalendlyUrl(e.target.value)}
                  placeholder="https://calendly.com/votre-nom/30min"
                  className="bg-muted/30 border-border/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Numéro WhatsApp</label>
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+33614189225"
                  className="bg-muted/30 border-border/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Nom du contact</label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Michael K."
                  className="bg-muted/30 border-border/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Rôle du contact</label>
                <Input
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="CEO & Co-fondateur"
                  className="bg-muted/30 border-border/30"
                />
              </div>
            </div>
            <Button className="mt-4 text-xs" size="sm" onClick={saveContactSettings} disabled={savingContact}>
              {savingContact ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Sauvegarder les paramètres de contact
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
