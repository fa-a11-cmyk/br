import { useState, useEffect } from "react";
import { X } from "lucide-react";

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["⌘", "K"], action: "Recherche globale" },
      { keys: ["⌘", "⌥", "D"], action: "Dashboard" },
      { keys: ["⌘", "⌥", "R"], action: "Mes réunions" },
      { keys: ["⌘", "⌥", "T"], action: "Tâches" },
      { keys: ["⌘", "⌥", "A"], action: "Agenda" },
      { keys: ["⌘", "⌥", "I"], action: "Intégrations" },
    ],
  },
  {
    category: "Réunions",
    items: [
      { keys: ["N"], action: "Nouvelle réunion" },
      { keys: ["⌘", "P"], action: "Télécharger PDF" },
      { keys: ["⌘", "F"], action: "Rechercher dans transcription" },
      { keys: ["⌘", "Enter"], action: "Valider toutes les tâches" },
      { keys: ["Esc"], action: "Fermer modal / drawer" },
    ],
  },
  {
    category: "Actions rapides",
    items: [
      { keys: ["⌘", "E"], action: "Envoyer rapport par email" },
      { keys: ["⌘", "W"], action: "Envoyer sur WhatsApp" },
      { keys: ["⌘", "S"], action: "Sauvegarder" },
      { keys: ["?"], action: "Afficher cette aide" },
    ],
  },
];

const KeyboardShortcutsModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setOpen(false)}>
      <div
        className="bg-card border border-border rounded-2xl p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-extrabold text-xl text-foreground">⌨️ Raccourcis clavier</h2>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="font-display font-bold text-sm text-foreground mb-4">{group.category}</h3>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.action} className="flex items-center justify-between gap-3">
                    <span className="font-body text-[13px] text-muted-foreground">{item.action}</span>
                    <div className="flex gap-1 shrink-0">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="bg-secondary border border-border rounded-md px-2 py-0.5 font-mono text-[11px] text-foreground"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="font-mono text-[10px] text-muted-foreground/50 mt-6 text-center">
          Appuyez sur <kbd className="bg-secondary border border-border rounded px-1.5 py-0.5 text-[10px]">?</kbd> pour ouvrir/fermer
        </p>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
