interface ImprovementTipsProps {
  breakdown?: {
    decisions: number;
    tasks_completion: number;
    sentiment: number;
    duration: number;
  };
  score: number;
}

export function ImprovementTips({ breakdown, score }: ImprovementTipsProps) {
  if (!breakdown) return null;

  const tips: Array<{ icon: string; text: string; action: string }> = [];

  if (breakdown.decisions < 15) {
    tips.push({ icon: "🎯", text: "Formalisez davantage les décisions en réunion", action: "Terminez chaque point par une décision claire" });
  }
  if (breakdown.tasks_completion < 15) {
    tips.push({ icon: "✅", text: "Taux de complétion des tâches faible", action: "Revisitez les tâches des réunions précédentes" });
  }
  if (breakdown.sentiment < 15) {
    tips.push({ icon: "😊", text: "Ambiance de réunion perfectible", action: "Commencez par des points positifs" });
  }
  if (breakdown.duration < 15) {
    tips.push({ icon: "⏱", text: "Durée non optimale (idéal : 30-45 min)", action: "Définissez un ordre du jour strict" });
  }

  if (tips.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-success-d">
        <span className="text-sm">🏆</span>
        <div>
          <p className="text-sm font-medium text-[hsl(var(--success))]">Réunion exemplaire !</p>
          <p className="text-xs text-muted-foreground">Continuez sur cette lancée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">💡 Axes d'amélioration</p>
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20">
          <span className="text-sm shrink-0 mt-0.5">{tip.icon}</span>
          <div>
            <p className="text-xs text-foreground">{tip.text}</p>
            <p className="text-[11px] text-muted-foreground">→ {tip.action}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ImprovementTips;
