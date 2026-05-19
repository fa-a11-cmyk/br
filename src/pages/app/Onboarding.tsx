import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronRight, Loader2 } from "lucide-react";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { progress, loading, steps, completeStep, skipOnboarding, completionPercent } = useOnboarding();
  const [activeStep, setActiveStep] = useState(0);

  const firstName = user?.user_metadata?.first_name || "Utilisateur";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // If onboarding is done, redirect
  if (progress?.is_completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8 text-center">
        <span className="text-5xl sm:text-6xl mb-4">🎉</span>
        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-primary flex items-center justify-center mb-4 sm:mb-6 mx-auto">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-[36px] text-foreground mb-2">RapidoMeet est prêt !</h1>
        <p className="font-body text-sm sm:text-base text-muted-foreground mb-6">Toutes les étapes sont terminées.</p>
        <Link to="/app/dashboard" className="font-display font-bold text-sm sm:text-base text-white bg-gradient-primary px-8 sm:px-10 py-3 sm:py-4 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform">
          Accéder au tableau de bord →
        </Link>
      </div>
    );
  }

  const completedSteps = progress?.completed_steps || [];
  const currentStepData = steps[activeStep];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-8 py-3 sm:py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-gradient-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v20M8 6v12M4 9v6M16 6v12M20 9v6" /></svg>
          </div>
          <span className="font-display font-extrabold text-sm"><span className="text-gradient">Rapido</span><span className="text-foreground">Meet</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground">{completionPercent}%</span>
          <button onClick={async () => { await skipOnboarding(); navigate("/app/dashboard"); }} className="font-body text-[12px] sm:text-[13px] text-muted-foreground hover:text-foreground">
            Passer →
          </button>
        </div>
      </header>
      <div className="h-[3px] bg-muted">
        <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${completionPercent}%` }} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar - Steps */}
        <aside className="lg:w-80 border-b lg:border-b-0 lg:border-r border-border/30 p-4 lg:p-6">
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground mb-1">
            Bienvenue, <span className="text-gradient">{firstName}</span> !
          </h2>
          <p className="font-body text-xs sm:text-sm text-muted-foreground mb-4 lg:mb-6">Configurez votre espace en quelques minutes.</p>

          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {steps.map((step, i) => {
              const isCompleted = completedSteps.includes(step.id);
              const isActive = i === activeStep;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(i)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all shrink-0 lg:shrink lg:w-full ${
                    isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/30 border border-transparent"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
                  ) : (
                    <Circle className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/40"}`} />
                  )}
                  <div className="min-w-0">
                    <p className={`font-body text-sm ${isCompleted ? "line-through text-muted-foreground" : isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </p>
                    <p className="font-body text-[11px] text-muted-foreground/60 truncate hidden lg:block">{step.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-lg w-full">
            {currentStepData && (
              <div className="text-center">
                <span className="text-4xl sm:text-5xl block mb-3 sm:mb-4">{currentStepData.icon}</span>
                <h2 className="font-display font-extrabold text-xl sm:text-[28px] text-foreground mb-2">
                  {currentStepData.title}
                </h2>
                <p className="font-body text-sm sm:text-base text-muted-foreground mb-6">
                  {currentStepData.description}
                </p>

                {completedSteps.includes(currentStepData.id) ? (
                  <div className="bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/30 rounded-xl p-6 mb-6">
                    <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))] mx-auto mb-2" />
                    <p className="font-display font-bold text-sm text-foreground">Étape complétée !</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">Passez à l'étape suivante.</p>
                  </div>
                ) : (
                  <div className="bg-card border border-border/30 rounded-xl p-6 mb-6">
                    <p className="font-body text-sm text-muted-foreground mb-4">
                      Cliquez ci-dessous pour accéder à cette fonctionnalité et compléter l'étape automatiquement.
                    </p>
                    <Button
                      className="bg-gradient-primary text-white shadow-fuchsia w-full sm:w-auto"
                      onClick={() => navigate(currentStepData.path)}
                    >
                      {currentStepData.action} <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  {activeStep > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setActiveStep(s => s - 1)}>
                      ← Retour
                    </Button>
                  )}
                  {activeStep < steps.length - 1 && (
                    <Button variant="outline" size="sm" onClick={() => setActiveStep(s => s + 1)}>
                      Suivant →
                    </Button>
                  )}
                  {activeStep === steps.length - 1 && (
                    <Button size="sm" className="bg-gradient-primary text-white" onClick={() => navigate("/app/dashboard")}>
                      Aller au dashboard →
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Onboarding;
