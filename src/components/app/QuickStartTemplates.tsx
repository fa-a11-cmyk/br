const templates = [
  {
    id: "daily",
    emoji: "☀️",
    name: "Daily Standup",
    description: "15 min · Tech · Extraction tâches par personne",
  },
  {
    id: "commercial",
    emoji: "💼",
    name: "Appel prospect",
    description: "30-60 min · Commercial · Score + CRM auto",
  },
  {
    id: "client-review",
    emoji: "🤝",
    name: "Réunion client",
    description: "1h · Suivi · PDF rapport + email client",
  },
  {
    id: "retro",
    emoji: "🔄",
    name: "Rétrospective",
    description: "1h · Rétro · Format went-well/improve/actions",
  },
  {
    id: "interview",
    emoji: "👤",
    name: "Entretien RH",
    description: "45 min · RH · Fiche candidat + feedback",
  },
  {
    id: "sprint",
    emoji: "🚀",
    name: "Sprint Planning",
    description: "2h · Tech · Stories Jira + sprint board",
  },
];

interface Props {
  onSelect: (templateId: string) => void;
}

const QuickStartTemplates = ({ onSelect }: Props) => (
  <div className="mb-8">
    <h3 className="font-display font-bold text-sm text-foreground mb-3">⚡ Quick Start — Templates</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className="bg-secondary border border-border rounded-xl p-3.5 text-left hover:border-[hsl(var(--fuchsia))]/40 transition-all group"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{t.emoji}</span>
            <span className="font-display font-bold text-[13px] text-foreground group-hover:text-[hsl(var(--fuchsia-l))] transition-colors">
              {t.name}
            </span>
          </div>
          <p className="font-body text-[11px] text-muted-foreground/60 pl-7">{t.description}</p>
        </button>
      ))}
    </div>
  </div>
);

export default QuickStartTemplates;
