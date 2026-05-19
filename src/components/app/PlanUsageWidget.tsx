import { useNavigate } from "react-router-dom";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Progress } from "@/components/ui/progress";

const PlanUsageWidget = () => {
  const navigate = useNavigate();
  const { limits, quota, loading } = usePlanLimits();

  if (loading || !limits) return null;

  const planLabel = limits.plan === "free" ? "Free" : limits.plan === "starter" ? "Starter" : "Pro";

  const metrics = [
    {
      label: "Réunions",
      used: quota?.used ?? 0,
      max: quota?.limit,
      icon: "🎙",
    },
    {
      label: "Scénarios",
      used: null,
      max: limits.scenarios_max,
      icon: "⚡",
    },
    {
      label: "Clés API",
      used: null,
      max: limits.api_keys_max,
      icon: "🔑",
    },
  ];

  return (
    <div className="bg-card border border-border/30 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm text-foreground">
            Plan {planLabel}
          </span>
        </div>
        {limits.plan !== "pro" && (
          <button
            onClick={() => navigate("/app/billing")}
            className="font-display font-bold text-xs text-primary hover:underline"
          >
            Passer à Pro →
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {metrics.map((m) => {
          if (m.max === null || m.max === undefined) {
            return (
              <div key={m.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{m.icon}</span>
                  <span className="font-body text-xs text-muted-foreground">{m.label}</span>
                </div>
                <span className="font-mono text-xs text-[hsl(var(--success))]">✓ Illimité</span>
              </div>
            );
          }

          const used = m.used ?? 0;
          const pct = Math.min(100, Math.round((used / m.max) * 100));

          return (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{m.icon}</span>
                  <span className="font-body text-xs text-muted-foreground">{m.label}</span>
                </div>
                <span className="font-mono text-xs text-foreground">
                  {used}/{m.max}
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanUsageWidget;
