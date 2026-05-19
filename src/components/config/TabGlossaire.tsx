import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Term {
  word: string;
  variants: string;
}

const defaultTerms: Term[] = [
  { word: "BraindCode", variants: "braindcode, braind code" },
  { word: "OpenClaw", variants: "open claw, opanclo" },
  { word: "RapidoCRM", variants: "rapido crm, rapidocrm" },
  { word: "RapidoMeet", variants: "rapido meet" },
  { word: "VivaTech", variants: "viva tech, vivah tech" },
];

const TabGlossaire = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [terms, setTerms] = useState<Term[]>(defaultTerms);
  const [newWord, setNewWord] = useState("");
  const [newVariants, setNewVariants] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_settings").select("settings_value").eq("user_id", user.id).eq("settings_key", "glossaire").maybeSingle();
      if (data?.settings_value) {
        const v = data.settings_value as any;
        if (Array.isArray(v.terms)) setTerms(v.terms);
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("user_settings").upsert({ user_id: user.id, settings_key: "glossaire", settings_value: { terms } as any }, { onConflict: "user_id,settings_key" });
    setSaving(false);
    toast({ title: "Glossaire sauvegardé" });
  };

  const addTerm = () => {
    if (!newWord) return;
    setTerms([...terms, { word: newWord, variants: newVariants }]);
    setNewWord("");
    setNewVariants("");
  };

  const removeTerm = (i: number) => setTerms(terms.filter((_, idx) => idx !== i));

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-bold text-base text-foreground">Glossaire métier</h3>
        <span className="font-mono text-[11px] text-[hsl(var(--success))]">+8-15% précision STT</span>
      </div>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Mots et noms propres que l'agent doit reconnaître correctement pendant la transcription.
      </p>

      <div className="space-y-2 mb-5">
        {terms.map((t, i) => (
          <div key={i} className="bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="font-mono text-[12px] sm:text-[13px] text-[hsl(var(--fuchsia-l))] font-medium">{t.word}</span>
              {t.variants && (
                <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/50 truncate hidden sm:inline">
                  ≠ {t.variants}
                </span>
              )}
            </div>
            <button onClick={() => removeTerm(i)} className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Nouveau terme"
          className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[hsl(var(--fuchsia))]" />
        <input value={newVariants} onChange={(e) => setNewVariants(e.target.value)} placeholder="Variantes (virgule)"
          className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[hsl(var(--fuchsia))]" />
        <button onClick={addTerm} className="bg-gradient-primary text-white px-4 py-2.5 rounded-lg shrink-0">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button onClick={save} disabled={saving} className="w-full bg-gradient-primary text-white font-display font-bold text-sm py-3 rounded-xl shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-50 mb-4">
        {saving ? "Sauvegarde…" : "💾 Sauvegarder le glossaire"}
      </button>

      <div className="flex gap-3">
        <button className="bg-secondary border border-border text-muted-foreground font-body text-xs px-4 py-2 rounded-lg hover:text-foreground transition-colors">
          📥 Importer CSV
        </button>
        <button className="bg-secondary border border-border text-muted-foreground font-body text-xs px-4 py-2 rounded-lg hover:text-foreground transition-colors">
          📤 Exporter CSV
        </button>
      </div>
    </div>
  );
};

export default TabGlossaire;
