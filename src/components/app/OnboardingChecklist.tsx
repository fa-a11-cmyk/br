import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useState } from "react";

const OnboardingChecklist = () => {
  const navigate = useNavigate();
  const { steps, progress, completionPercent, skipOnboarding, shouldShow, completeStep } = useOnboarding();
  const [collapsed, setCollapsed] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  if (!shouldShow) {
    if (justCompleted) {
      return (
        <div className="bg-success-d border border-[hsl(var(--success))]/30 rounded-2xl p-6 text-center animate-in fade-in duration-500">
          <span className="text-3xl block mb-2">🎉</span>
          <p className="font-display font-bold text-foreground">Vous maîtrisez RapidoMeet !</p>
          <p className="font-body text-sm text-muted-foreground mt-1">Passez à l'action.</p>
        </div>
      );
    }
    return null;
  }

  const completedSteps = progress?.completed_steps || [];

  // Detect completion
  if (completionPercent === 100 && !justCompleted) {
    setJustCompleted(true);
  }

  return (
    <div className="bg-card border border-primary/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🚀</span>
          <span className="font-display font-bold text-sm text-foreground">Démarrez avec RapidoMeet</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {completedSteps.length}/{steps.length}
          </span>
          <div className="w-20 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">{completionPercent}%</span>
          <button
            onClick={(e) => { e.stopPropagation(); skipOnboarding(); }}
            className="font-body text-xs text-muted-foreground/60 hover:text-foreground ml-2"
          >
            Ignorer
          </button>
        </div>
      </button>

      {/* Steps */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-1.5">
          {steps.map((step) => {
            const done = completedSteps.includes(step.id);
            const isActive = progress?.current_step === step.id;
            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  done
                    ? "bg-success-d/50"
                    : isActive
                    ? "bg-primary/5 border border-primary/20"
                    : "bg-muted/10"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base shrink-0">
                    {done ? "✅" : isActive ? step.icon : "○"}
                  </span>
                  <div className="min-w-0">
                    <p className={`font-body text-sm ${
                      done ? "line-through text-muted-foreground" : isActive ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.title}
                    </p>
                    {isActive && (
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    )}
                  </div>
                </div>
                {!done && (
                  <button
                    onClick={() => navigate(step.path)}
                    className={`font-display font-bold text-xs px-3 py-1.5 rounded-lg shrink-0 ml-2 ${
                      isActive
                        ? "bg-gradient-primary text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {step.action} →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;
