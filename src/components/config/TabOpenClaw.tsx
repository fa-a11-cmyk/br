import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
  <button onClick={onChange} disabled={disabled} className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-200 shrink-0 ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${checked ? "bg-gradient-primary" : "bg-[hsl(var(--dark-4))]"}`}>
    <span className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform duration-200 ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
  </button>
);

const defaultChannels = { whatsapp: true, telegram: true, email: true, discord: false };
const defaultConfig = { serverUrl: "https://openclaw.braindcode.com", port: "3000", workspace: "braindcode-main", timeout: "30s" };

const TabOpenClaw = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState(defaultChannels);
  const [config, setConfig] = useState(defaultConfig);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_settings").select("settings_value").eq("user_id", user.id).eq("settings_key", "openclaw").maybeSingle();
      if (data?.settings_value) {
        const v = data.settings_value as any;
        if (v.channels) setChannels(v.channels);
        if (v.config) setConfig(v.config);
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("user_settings").upsert({ user_id: user.id, settings_key: "openclaw", settings_value: { channels, config } as any }, { onConflict: "user_id,settings_key" });
    setSaving(false);
    toast({ title: "Configuration OpenClaw sauvegardée" });
  };

  const skills = [
    { name: "rapidomeet-core", desc: "Transcription + extraction + rapport", version: "v1.2.0", status: "active", channels: ["WhatsApp", "Telegram", "Email"] },
    { name: "rapidomeet-crm-sync", desc: "Synchronisation RapidoCRM post-réunion", version: "v1.0.3", status: "active", channels: ["CRM"] },
    { name: "rapidomeet-n8n-trigger", desc: "Déclenchement scénarios N8N", version: "v0.9.1", status: "update", channels: ["N8N"] },
    { name: "rapidomeet-reports", desc: "Génération et distribution des rapports PDF", version: "v1.1.0", status: "active", channels: ["PDF", "Email", "WhatsApp"] },
  ];

  const logs = [
    { date: "18/03 · 14:52", meeting: "Sprint 12 BraindCode", channel: "WhatsApp + Telegram", status: "success", duration: "1.8s" },
    { date: "18/03 · 11:30", meeting: "Réunion client Djiby", channel: "Email HTML", status: "success", duration: "2.1s" },
    { date: "17/03 · 16:15", meeting: "Review technique", channel: "WhatsApp", status: "success", duration: "1.4s" },
    { date: "17/03 · 10:00", meeting: "Call commercial StartupX", channel: "WhatsApp + Email", status: "partial", duration: "4.2s" },
    { date: "16/03 · 15:30", meeting: "Réunion PFE", channel: "Telegram", status: "success", duration: "1.2s" },
  ];

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-foreground mb-2">Connexion OpenClaw</h2>
      <p className="font-body text-sm text-muted-foreground mb-8">
        OpenClaw est le système de distribution intelligent qui envoie vos rapports sur WhatsApp, Telegram, Discord et plus.
      </p>

      {/* STATUS */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] bg-violet-d flex items-center justify-center text-xl sm:text-2xl shrink-0">⚡</div>
            <div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">OpenClaw Gateway</h3>
              <span className="bg-success-d text-[hsl(var(--success))] font-mono text-[11px] px-3 py-1 rounded-full inline-block mt-1">● Connecté et actif</span>
              <p className="font-mono text-[11px] sm:text-xs text-muted-foreground/60 mt-2">openclaw.braindcode.com · Port {config.port}</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 shrink-0">
            <button className="bg-violet-d text-[hsl(var(--violet-l))] font-body text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg">Tester</button>
            <button className="border border-destructive/50 text-destructive font-body text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg">Déconnecter</button>
          </div>
        </div>
      </div>

      {/* CONFIG */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-6">Paramètres de connexion</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">URL DU SERVEUR</label>
              <input value={config.serverUrl} onChange={e => setConfig(p => ({ ...p, serverUrl: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] outline-none transition-all" />
            </div>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">PORT</label>
              <input value={config.port} onChange={e => setConfig(p => ({ ...p, port: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">WORKSPACE</label>
              <input value={config.workspace} onChange={e => setConfig(p => ({ ...p, workspace: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] outline-none transition-all" />
            </div>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">TIMEOUT</label>
              <select value={config.timeout} onChange={e => setConfig(p => ({ ...p, timeout: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground outline-none appearance-none">
                {["10s", "30s", "60s"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SKILLS */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-2">Skills déployés</h3>
        <p className="font-body text-sm text-muted-foreground mb-5">Skills RapidoMeet sur votre instance OpenClaw.</p>
        <div className="space-y-3">
          {skills.map(s => (
            <div key={s.name} className="bg-secondary border border-[hsl(var(--dark-5))] rounded-[10px] p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[12px] sm:text-[13px] text-[hsl(var(--fuchsia-l))]">{s.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/40">{s.version}</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-success-d text-[hsl(var(--success))]" : "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]"}`}>
                      {s.status === "active" ? "● Actif" : "⚠ MAJ"}
                    </span>
                  </div>
                  <p className="font-body text-[11px] sm:text-xs text-muted-foreground/60 mt-1">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CANAUX */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-5">Canaux de diffusion</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { icon: "💬", name: "WhatsApp Business", key: "whatsapp" as const, detail: "+33 6 XX XX XX XX" },
            { icon: "✈️", name: "Telegram", key: "telegram" as const, detail: "@rapidomeet_bot" },
            { icon: "📧", name: "Email HTML", key: "email" as const, detail: "Template BraindCode v1" },
            { icon: "🎮", name: "Discord", key: "discord" as const, detail: "Disponible en V2", v2: true },
          ].map(ch => (
            <div key={ch.key} className={`bg-secondary border border-[hsl(var(--dark-5))] rounded-[14px] p-4 sm:p-5 ${ch.v2 ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl">{ch.icon}</span>
                  <span className="font-display font-bold text-xs sm:text-sm text-foreground">{ch.name}</span>
                </div>
                <Toggle checked={channels[ch.key]} onChange={() => setChannels(p => ({ ...p, [ch.key]: !p[ch.key] }))} disabled={ch.v2} />
              </div>
              <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/60">{ch.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* LOGS */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-5">Logs récents</h3>
        <div className="space-y-2 sm:hidden">
          {logs.map((l, i) => (
            <div key={i} className="bg-secondary border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-xs text-foreground">{l.meeting}</span>
                <span className={`font-mono text-[10px] ${l.status === "success" ? "text-[hsl(var(--success))]" : "text-[#F59E0B]"}`}>
                  {l.status === "success" ? "✅" : "⚠️"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-muted-foreground/60">{l.date}</span>
                <span className="font-mono text-[10px] text-muted-foreground/40">{l.channel}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden sm:block bg-secondary rounded-[10px] overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-2.5 bg-[hsl(var(--dark-4))]">
            {["DATE", "RÉUNION", "CANAL", "STATUT", "DURÉE"].map(h => (
              <span key={h} className="font-mono text-[10px] uppercase text-muted-foreground/60 tracking-wide">{h}</span>
            ))}
          </div>
          {logs.map((l, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-[hsl(var(--dark-4))] last:border-0">
              <span className="font-mono text-xs text-muted-foreground/60">{l.date}</span>
              <span className="font-body text-[13px] text-foreground truncate">{l.meeting}</span>
              <span className="font-body text-[13px] text-muted-foreground truncate">{l.channel}</span>
              <span className={`font-mono text-[11px] ${l.status === "success" ? "text-[hsl(var(--success))]" : "text-[#F59E0B]"}`}>
                {l.status === "success" ? "✅ Envoyé" : "⚠️ Partiel"}
              </span>
              <span className="font-mono text-xs text-muted-foreground/60">{l.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SAVE */}
      <button onClick={save} disabled={saving} className="w-full bg-gradient-primary text-white font-display font-bold text-sm py-3 rounded-xl shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-50">
        {saving ? "Sauvegarde…" : "💾 Sauvegarder la configuration OpenClaw"}
      </button>
    </div>
  );
};

export default TabOpenClaw;
