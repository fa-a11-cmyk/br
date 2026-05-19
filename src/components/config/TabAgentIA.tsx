import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange} className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-200 shrink-0 ${checked ? "bg-gradient-primary" : "bg-[hsl(var(--dark-4))]"}`}>
    <span className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform duration-200 ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
  </button>
);

const defaultSkills = [
  { icon: "📋", name: "skill-base-transcript", trigger: "Toute réunion", active: true },
  { icon: "💼", name: "skill-commercial", trigger: "meeting_type = commercial", active: true },
  { icon: "💻", name: "skill-tech-review", trigger: "meeting_type = tech", active: true },
  { icon: "🔄", name: "skill-retrospot", trigger: "meeting_type = retro", active: false },
  { icon: "🤝", name: "skill-onboarding", trigger: "meeting_type = onboarding", active: false },
  { icon: "⚙️", name: "skill-custom-braindcode", trigger: "Règles BraindCode", active: true },
];

const defaultIdentity = { agentName: "RapidoMeet", personality: "Professionnel et concis", language: "🇫🇷 Français", instructions: "Tu es l'agent IA de BraindCode. Lorsque tu extrais des tâches, tu dois toujours préciser le responsable et la deadline. Les prospects sont des entreprises françaises ou tunisiennes. Utilise toujours le vouvoiement dans les emails." };
const defaultMemory = { enabled: true, byProject: true, byClient: true, global: false };

const TabAgentIA = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState(defaultSkills);
  const [identity, setIdentity] = useState(defaultIdentity);
  const [memory, setMemory] = useState(defaultMemory);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_settings").select("settings_value").eq("user_id", user.id).eq("settings_key", "agent_ia").maybeSingle();
      if (data?.settings_value) {
        const v = data.settings_value as any;
        if (v.skills) setSkills(v.skills);
        if (v.identity) setIdentity(v.identity);
        if (v.memory) setMemory(v.memory);
      }
      setLoaded(true);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("user_settings").upsert({ user_id: user.id, settings_key: "agent_ia", settings_value: { skills, identity, memory } as any }, { onConflict: "user_id,settings_key" });
    setSaving(false);
    toast({ title: "Configuration sauvegardée" });
  };

  const toggleSkill = (i: number) => setSkills(s => s.map((sk, idx) => idx === i ? { ...sk, active: !sk.active } : sk));

  const docs = [
    { name: "Glossaire_BraindCode.pdf", size: "1.2 Mo", date: "15/03" },
    { name: "Process_Commercial_2026.docx", size: "890 Ko", date: "12/03" },
    { name: "Liste_clients_prioritaires.pdf", size: "2.1 Mo", date: "10/03" },
    { name: "Grille_tarifaire_Rapido.pdf", size: "450 Ko", date: "05/03" },
  ];

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-foreground mb-2">Configuration de l'agent IA</h2>
      <p className="font-body text-sm text-muted-foreground mb-8">
        Personnalisez le comportement de votre agent, ses instructions, sa mémoire et ses Skills Markdown.
      </p>

      {/* IDENTITÉ */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-6">Identité de l'agent</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">NOM DE L'AGENT</label>
              <input value={identity.agentName} onChange={e => setIdentity(p => ({ ...p, agentName: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12)] outline-none transition-all" />
            </div>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">PERSONNALITÉ</label>
              <select value={identity.personality} onChange={e => setIdentity(p => ({ ...p, personality: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] outline-none appearance-none">
                {["Professionnel et concis", "Chaleureux et détaillé", "Ultra-factuel", "Formel"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">LANGUE PAR DÉFAUT</label>
              <select value={identity.language} onChange={e => setIdentity(p => ({ ...p, language: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] outline-none appearance-none">
                {["🇫🇷 Français", "🇬🇧 English", "🇦🇪 العربية", "Auto-detect"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">INSTRUCTIONS SYSTÈME PERSONNALISÉES</label>
            <textarea
              value={identity.instructions}
              onChange={e => setIdentity(p => ({ ...p, instructions: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] outline-none resize-y min-h-[160px]"
            />
            <p className="font-mono text-[11px] text-muted-foreground/40 mt-1">Ces instructions s'ajoutent au comportement de base de l'agent.</p>
          </div>
        </div>
      </div>

      {/* SKILLS */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-2">Skills Markdown actifs</h3>
        <p className="font-body text-sm text-muted-foreground mb-5">
          Les Skills définissent le comportement de l'agent selon le type de réunion détecté.
        </p>
        <div className="space-y-3">
          {skills.map((s, i) => (
            <div key={s.name} className="bg-secondary border border-[hsl(var(--dark-5))] rounded-[10px] px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-lg">{s.icon}</span>
                <div className="min-w-0">
                  <span className="font-mono text-[12px] sm:text-[13px] text-[hsl(var(--fuchsia-l))]">{s.name}</span>
                  <p className="font-body text-[10px] sm:text-xs text-muted-foreground/60 truncate">{s.trigger}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="font-mono text-[10px] text-muted-foreground/40 hidden sm:inline">v1.0</span>
                <Toggle checked={s.active} onChange={() => toggleSkill(i)} />
              </div>
            </div>
          ))}
        </div>
        <button className="bg-fuchsia-d text-[hsl(var(--fuchsia-l))] font-body text-sm px-5 py-2.5 rounded-lg mt-4 w-full hover:opacity-80 transition-opacity">
          + Créer un nouveau Skill Markdown
        </button>
      </div>

      {/* RAG */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-2">Base de connaissance entreprise (RAG)</h3>
        <p className="font-body text-sm text-muted-foreground mb-5">
          Chargez vos documents pour que l'agent comprenne votre vocabulaire métier.
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
          <span className="bg-violet-d text-[hsl(var(--violet-l))] font-mono text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 rounded-full">12 documents indexés</span>
          <span className="bg-secondary text-muted-foreground font-mono text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 rounded-full">47 Mo / 500 Mo</span>
        </div>
        <div className="border-2 border-dashed border-[hsl(var(--dark-5))] rounded-xl p-4 sm:p-6 text-center mb-5 hover:border-[hsl(var(--fuchsia))] hover:bg-fuchsia-d transition-all cursor-pointer">
          <span className="text-2xl text-muted-foreground/40">📄</span>
          <p className="font-body text-sm text-muted-foreground/60 mt-1">Glissez vos documents ici</p>
          <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/40 mt-0.5">PDF, DOCX, TXT, MD · max 50 Mo</p>
        </div>
        <div className="space-y-2">
          {docs.map(d => (
            <div key={d.name} className="bg-secondary border border-[hsl(var(--dark-5))] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-fuchsia-d flex items-center justify-center text-[hsl(var(--fuchsia-l))] text-sm shrink-0">📄</div>
                <span className="font-body text-[12px] sm:text-[13px] text-foreground truncate">{d.name}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/60 hidden sm:inline">{d.size}</span>
                <button className="text-muted-foreground/40 hover:text-destructive transition-colors">🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MÉMOIRE */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-bold text-[15px] text-foreground">Mémoire contextuelle activée</h3>
          <Toggle checked={memory.enabled} onChange={() => setMemory(p => ({ ...p, enabled: !p.enabled }))} />
        </div>
        <p className="font-body text-[13px] text-muted-foreground mb-5">
          L'agent se souvient du contexte des réunions précédentes.
        </p>
        <div className="pl-4 space-y-3 mb-6">
          {[
            { key: "byProject" as const, label: "Mémoriser par projet", desc: "Le contexte est lié au projet détecté en réunion" },
            { key: "byClient" as const, label: "Mémoriser par client/contact CRM", desc: "Lié aux contacts RapidoCRM mentionnés" },
            { key: "global" as const, label: "Mémoire globale", desc: "Contexte partagé entre toutes les réunions" },
          ].map(o => (
            <label key={o.key} className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={memory[o.key]} onChange={() => setMemory(p => ({ ...p, [o.key]: !p[o.key] }))} className="accent-[hsl(var(--fuchsia))] mt-0.5" />
              <div>
                <span className="font-body text-[13px] text-foreground font-medium">{o.label}</span>
                <p className="font-body text-[12px] sm:text-[13px] text-muted-foreground">{o.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <button className="border border-destructive/50 text-destructive font-body text-[13px] px-4 py-2 rounded-lg hover:bg-destructive/10 transition-colors">
          Effacer toute la mémoire
        </button>
      </div>

      {/* SAVE */}
      <button onClick={save} disabled={saving} className="w-full bg-gradient-primary text-white font-display font-bold text-sm py-3 rounded-xl shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-50">
        {saving ? "Sauvegarde…" : "💾 Sauvegarder la configuration agent"}
      </button>
    </div>
  );
};

export default TabAgentIA;
