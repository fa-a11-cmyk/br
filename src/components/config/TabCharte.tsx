import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const defaultSettings = {
  company_name: "",
  website: "",
  sender_email: "",
  sender_name: "",
  primary_color: "#E91E8C",
  secondary_color: "#7C3AED",
  text_color: "#1A1A2E",
  title_font: "Syne",
  body_font: "DM Sans",
  font_size: 16,
  line_height: "1.6",
  footer_text: "",
  signature: "",
  include_signature: true,
};

const TabCharte = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("settings_value")
        .eq("user_id", user.id)
        .eq("settings_key", "charte")
        .single();
      if (data?.settings_value) {
        setSettings(prev => ({ ...prev, ...(data.settings_value as any) }));
      }
      setLoaded(true);
    })();
  }, [user]);

  const update = (key: string, val: any) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      settings_key: "charte",
      settings_value: settings as any,
    }, { onConflict: "user_id,settings_key" });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Charte sauvegardée" });
      setDirty(false);
    }
    setSaving(false);
  };

  if (!loaded) return <div className="animate-pulse space-y-4"><div className="h-8 bg-secondary rounded w-1/3" /><div className="h-40 bg-secondary rounded" /></div>;

  return (
    <div className="relative pb-24">
      <h2 className="font-display font-bold text-lg sm:text-xl text-foreground mb-2">Charte graphique de l'entreprise</h2>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 sm:mb-8">
        <p className="font-body text-xs sm:text-sm text-muted-foreground max-w-xl">
          Ces paramètres s'appliquent aux emails HTML, rapports PDF et notifications envoyées en votre nom.
        </p>
      </div>

      {/* IDENTITÉ */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-4 sm:mb-6">Identité de l'entreprise</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-3 sm:space-y-4">
            {[
              { key: "company_name", label: "NOM DE L'ENTREPRISE", placeholder: "BraindCode" },
              { key: "website", label: "SITE WEB", placeholder: "https://braindcode.com" },
              { key: "sender_email", label: "EMAIL DE L'EXPÉDITEUR", placeholder: "michael@braindcode.com" },
              { key: "sender_name", label: "NOM DE L'EXPÉDITEUR", placeholder: "Michael – BraindCode" },
            ].map(f => (
              <div key={f.key}>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{f.label}</label>
                <input
                  value={(settings as any)[f.key] || ""}
                  placeholder={f.placeholder}
                  onChange={e => update(f.key, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] outline-none transition-all"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">LOGO DE L'ENTREPRISE</label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 sm:p-8 text-center min-h-[120px] flex flex-col items-center justify-center hover:border-[hsl(var(--fuchsia))] hover:bg-fuchsia-d transition-all cursor-pointer">
              <span className="text-3xl text-muted-foreground/40 mb-2">🖼</span>
              <p className="font-body text-xs sm:text-sm text-muted-foreground/60">Glissez votre logo ici</p>
              <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/40 mt-1">PNG, SVG · max 2MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* COULEURS */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-4 sm:mb-6">Couleurs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { key: "primary_color", label: "PRINCIPALE" },
            { key: "secondary_color", label: "SECONDAIRE" },
            { key: "text_color", label: "TEXTE" },
          ].map(c => (
            <div key={c.key}>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-2">{c.label}</label>
              <div className="flex items-center gap-3">
                <input type="color" value={(settings as any)[c.key]} onChange={e => update(c.key, e.target.value)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-[10px] border-2 border-border cursor-pointer bg-transparent" />
                <input value={(settings as any)[c.key]} onChange={e => update(c.key, e.target.value)}
                  className="w-[100px] sm:w-[120px] bg-secondary border border-border rounded-lg px-3 py-2 font-mono text-[13px] text-foreground outline-none" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 sm:mt-6">
          <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-2">APERÇU GRADIENT</label>
          <div className="h-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.secondary_color})` }} />
        </div>
      </div>

      {/* TYPOGRAPHIE */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-4 sm:mb-6">Typographie email</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            {[
              { key: "title_font", label: "POLICE TITRES", options: ["Syne", "Georgia", "Montserrat", "Playfair Display", "Arial"] },
              { key: "body_font", label: "POLICE CORPS", options: ["DM Sans", "Inter", "Helvetica", "Georgia", "Times New Roman"] },
            ].map(s => (
              <div key={s.key}>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{s.label}</label>
                <select value={(settings as any)[s.key]} onChange={e => update(s.key, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 font-body text-sm text-foreground outline-none appearance-none">
                  {s.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">TAILLE POLICE</label>
              <div className="flex items-center gap-2">
                <input type="number" value={settings.font_size} onChange={e => update("font_size", parseInt(e.target.value) || 16)}
                  className="w-20 bg-secondary border border-border rounded-lg px-3 py-2 font-body text-sm text-foreground outline-none" />
                <span className="font-mono text-sm text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>
        {/* Preview */}
        <div className="mt-5 sm:mt-6">
          <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-2">APERÇU</label>
          <div className="bg-white rounded-lg p-4 sm:p-5">
            <h4 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: settings.primary_color, fontFamily: `${settings.title_font}, sans-serif` }}>Résumé de votre réunion</h4>
            <p className="text-sm sm:text-[15px] leading-relaxed text-gray-700 mb-3" style={{ fontFamily: `${settings.body_font}, sans-serif`, fontSize: `${settings.font_size}px` }}>
              Voici les décisions et tâches extraites automatiquement...
            </p>
            <button className="text-white text-sm px-4 sm:px-5 py-2 rounded-lg font-medium" style={{ background: settings.primary_color }}>
              Voir le rapport →
            </button>
          </div>
        </div>
      </div>

      {/* SIGNATURE */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-4 sm:mb-6">Signature</h3>
        <textarea value={settings.signature} onChange={e => update("signature", e.target.value)}
          placeholder="Michael — CEO & Fondateur&#10;BraindCode"
          className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-3 font-body text-sm text-foreground outline-none resize-y min-h-[80px] mb-3" />
        <div className="flex items-center justify-between">
          <span className="font-body text-[12px] sm:text-[13px] text-foreground">Inclure dans tous les emails</span>
          <button onClick={() => update("include_signature", !settings.include_signature)}
            className={`relative w-[44px] h-[24px] rounded-full shrink-0 transition-colors ${settings.include_signature ? "bg-gradient-primary" : "bg-secondary border border-border"}`}>
            <span className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform ${settings.include_signature ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
          </button>
        </div>
      </div>

      {/* PIED DE PAGE */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-4 sm:mb-6">Pied de page email</h3>
        <textarea value={settings.footer_text} onChange={e => update("footer_text", e.target.value)}
          placeholder="© 2026 BraindCode · Généré par RapidoMeet"
          className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-3 font-body text-sm text-foreground outline-none resize-y min-h-[80px]" />
      </div>

      {/* SAVE BAR */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-3 sm:px-6 md:px-12 py-3 sm:py-4 flex items-center justify-between z-50">
          <span className="font-body text-[12px] sm:text-[13px] text-muted-foreground/60">Modifications non sauvegardées</span>
          <div className="flex gap-2 sm:gap-3">
            <button onClick={() => setDirty(false)} className="font-body text-[13px] text-muted-foreground px-3 sm:px-4 py-2">Annuler</button>
            <button onClick={save} disabled={saving}
              className="font-display font-bold text-sm text-white bg-gradient-primary px-4 sm:px-5 py-2 rounded-lg shadow-fuchsia disabled:opacity-50">
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabCharte;
