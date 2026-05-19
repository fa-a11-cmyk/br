interface EfficiencyBreakdown {
  decisions: number;
  tasks_completion: number;
  sentiment: number;
  duration: number;
}

interface EfficiencyScoreProps {
  score: number;
  breakdown?: EfficiencyBreakdown;
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
}

export function EfficiencyScore({ score, breakdown, size = "md", showBreakdown = true }: EfficiencyScoreProps) {
  const color = score >= 75 ? "hsl(var(--success))" : score >= 50 ? "#f59e0b" : score >= 25 ? "#f97316" : "hsl(var(--destructive))";
  const label = score >= 75 ? "Excellente" : score >= 50 ? "Bonne" : score >= 25 ? "Moyenne" : "À améliorer";

  const radius = size === "lg" ? 54 : size === "md" ? 40 : 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const svgSize = size === "lg" ? 140 : size === "md" ? 100 : 70;
  const strokeWidth = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const fontSize = size === "lg" ? 28 : size === "md" ? 20 : 14;

  const criteria = breakdown ? [
    { key: "decisions", label: "Décisions prises", value: breakdown.decisions, max: 25, icon: "🎯" },
    { key: "tasks_completion", label: "Tâches complétées", value: breakdown.tasks_completion, max: 25, icon: "✅" },
    { key: "sentiment", label: "Ambiance", value: breakdown.sentiment, max: 25, icon: "😊" },
    { key: "duration", label: "Durée optimale", value: breakdown.duration, max: 25, icon: "⏱" },
  ] : [];

  return (
    <div className={`flex ${showBreakdown && breakdown ? "flex-col sm:flex-row" : ""} items-center gap-4`}>
      <div className="flex flex-col items-center">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease-out" }}
          />
          <text x={svgSize / 2} y={svgSize / 2} textAnchor="middle" dominantBaseline="central"
            fill="currentColor" fontSize={fontSize} fontWeight={800} fontFamily="Syne, sans-serif" className="text-foreground">
            {score}
          </text>
        </svg>
        {size !== "sm" && (
          <span className="text-xs font-medium mt-1" style={{ color }}>{label}</span>
        )}
      </div>

      {showBreakdown && breakdown && (
        <div className="flex-1 space-y-2 w-full">
          {criteria.map(c => (
            <div key={c.key} className="flex items-center gap-2">
              <span className="text-sm shrink-0">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-muted-foreground truncate">{c.label}</span>
                  <span className="text-xs font-mono text-foreground">{c.value}/{c.max}</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-700" style={{
                    width: `${(c.value / c.max) * 100}%`,
                    backgroundColor: c.value >= c.max * 0.75 ? "hsl(var(--success))" : c.value >= c.max * 0.5 ? "#f59e0b" : "hsl(var(--destructive))",
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EfficiencyScore;
