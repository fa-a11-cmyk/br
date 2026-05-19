import { useState, useEffect } from "react";

const STEPS = [
  {
    target: '[data-tour="new-meeting-btn"]',
    title: "🎙 Démarrez votre première réunion",
    content: "Cliquez ici pour enregistrer, importer ou planifier une réunion.",
    position: "bottom" as const,
  },
  {
    target: '[data-tour="integrations-nav"]',
    title: "🔌 Connectez vos outils",
    content: "Branchez Google Meet, RapidoCRM et WhatsApp pour activer les automatisations.",
    position: "right" as const,
  },
  {
    target: '[data-tour="scenarios-nav"]',
    title: "⚡ Activez vos scénarios",
    content: "Choisissez quelles actions se déclenchent automatiquement après chaque réunion.",
    position: "right" as const,
  },
  {
    target: '[data-tour="config-agent"]',
    title: "🧠 Personnalisez votre agent",
    content: "Définissez la personnalité, la langue et les instructions de votre agent IA.",
    position: "left" as const,
  },
];

const OnboardingTour = () => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("onboarding-done")) return;
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setVisible(false);
      localStorage.setItem("onboarding-done", "1");
    }
  };

  const handleSkip = () => {
    setVisible(false);
    localStorage.setItem("onboarding-done", "1");
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
      <div className="bg-card border border-[hsl(var(--fuchsia))]/30 rounded-2xl p-6 max-w-sm w-full mx-4 animate-scale-in shadow-fuchsia-lg">
        <h4 className="font-display font-bold text-base text-foreground mb-2">{current.title}</h4>
        <p className="font-body text-sm text-muted-foreground mb-5">{current.content}</p>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground/50">
            Étape {step + 1}/{STEPS.length}
          </span>
          <div className="flex gap-2">
            <button onClick={handleSkip} className="font-body text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">
              Passer
            </button>
            <button onClick={handleNext} className="bg-gradient-primary text-white font-display font-bold text-sm px-5 py-2 rounded-lg">
              {step < STEPS.length - 1 ? "Suivant →" : "Terminer ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
