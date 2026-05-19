import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem("exit-popup-shown")) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !triggered.current) {
        triggered.current = true;
        setTimeout(() => setIsVisible(true), 300);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("exit-popup-shown", "1");
  };

  const handleSubmit = () => {
    if (!email) return;
    setSubmitted(true);
    sessionStorage.setItem("exit-popup-shown", "1");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-5">
      <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 max-w-md w-full text-center relative animate-scale-in">
        <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <>
            <p className="text-5xl mb-4">🎁</p>
            <h3 className="font-display font-extrabold text-xl text-foreground mb-3 tracking-tight">
              Avant de partir...
            </h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">
              Recevez notre guide{" "}
              <strong className="text-foreground">
                "10 automatisations post-réunion qui font gagner 3h/semaine"
              </strong>{" "}
              + 30 jours d'essai gratuit (au lieu de 14).
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 font-body text-sm text-foreground placeholder:text-muted-foreground mb-3 outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-primary text-white font-display font-bold text-sm py-3.5 rounded-xl shadow-fuchsia"
            >
              Recevoir le guide + 30 jours gratuits →
            </button>
            <p className="font-body text-[11px] text-muted-foreground mt-3">
              Sans spam. Désabonnement en 1 clic.
            </p>
          </>
        ) : (
          <>
            <p className="text-5xl mb-4">✅</p>
            <h3 className="font-display font-extrabold text-xl text-rm-success mb-2">
              C'est envoyé !
            </h3>
            <p className="font-body text-sm text-muted-foreground">
              Vérifiez votre boîte mail dans 2 minutes.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ExitIntentPopup;
