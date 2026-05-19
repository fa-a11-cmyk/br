import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const tagStyles = {
  fuchsia: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
  violet: "bg-violet-d text-[hsl(var(--violet-l))]",
  gray: "bg-secondary text-muted-foreground border border-border",
};

const Features = () => {
  const ref = useScrollReveal();
  const { t } = useTranslation("landing");

  const smallCards: { icon: string; titleKey: string; descKey: string; tags: { label: string; color: "fuchsia" | "violet" | "gray" }[] }[] = [
    {
      icon: "📊", titleKey: "features.card1Title", descKey: "features.card1Desc",
      tags: [{ label: "Contacts auto", color: "violet" }, { label: "Pipeline mis à jour", color: "violet" }, { label: "Log activités", color: "gray" }],
    },
    {
      icon: "📅", titleKey: "features.card2Title", descKey: "features.card2Desc",
      tags: [{ label: "Google Calendar", color: "fuchsia" }, { label: "Rappels auto", color: "gray" }, { label: "Follow-up planifié", color: "gray" }],
    },
    {
      icon: "🔁", titleKey: "features.card3Title", descKey: "features.card3Desc",
      tags: [{ label: "10 scénarios inclus", color: "violet" }, { label: "Personnalisables", color: "gray" }, { label: "1-clic", color: "gray" }],
    },
    {
      icon: "⚡", titleKey: "features.card4Title", descKey: "features.card4Desc",
      tags: [{ label: "WhatsApp", color: "fuchsia" }, { label: "Telegram", color: "fuchsia" }, { label: "Email HTML", color: "gray" }, { label: "Discord", color: "gray" }],
    },
    {
      icon: "🧩", titleKey: "features.card5Title", descKey: "features.card5Desc",
      tags: [{ label: "Base de connaissance", color: "violet" }, { label: "Mémoire par projet", color: "gray" }, { label: "Personnalisé", color: "gray" }],
    },
    {
      icon: "🎨", titleKey: "features.card6Title", descKey: "features.card6Desc",
      tags: [{ label: "Charte email", color: "fuchsia" }, { label: "Templates PDF", color: "gray" }, { label: "Skills sur-mesure", color: "gray" }],
    },
  ];

  return (
    <section id="fonctionnalites" className="bg-secondary py-[100px] px-5 md:px-[60px]">
      <div ref={ref} className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">{t("features.tag")}</p>
        <h2
          className="font-display font-extrabold text-foreground mb-4"
          style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}
        >
          {t("features.title")}
          <br />
          <span className="text-gradient">{t("features.titleGradient")}</span>
        </h2>
        <p className="font-body text-muted-foreground mb-12 max-w-[580px]" style={{ fontSize: "clamp(16px, 2vw, 18px)", lineHeight: 1.65 }}>
          {t("features.subtitle")}
        </p>

        {/* Large card */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-10 mb-6 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
          <div>
            <div className="w-[52px] h-[52px] bg-fuchsia-d rounded-xl flex items-center justify-center text-2xl mb-6">🎙</div>
            <h3 className="font-display font-bold text-[19px] text-foreground mb-3">
              {t("features.mainTitle")}
            </h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">
              {t("features.mainDesc")}
            </p>
            <div className="flex flex-wrap gap-2">
              {["Diarisation", "FR / EN", "Analyse sentiments", "Import audio", "Temps réel"].map((tag, i) => (
                <span key={tag} className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${i < 3 ? tagStyles.fuchsia : tagStyles.gray}`}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="force-dark border border-[#33334A] rounded-xl p-5 font-mono text-xs leading-relaxed">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E91E8C]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#33334A]" />
              <span className="ml-3 text-[#55556A] text-[11px]">réunion_client_18-03.mp3</span>
            </div>
            <div className="space-y-3 text-[#9898B0]">
              <div>
                <span className="text-[#55556A]">DÉCISION</span><br />
                <span className="text-[#F5F5FA]">Déploiement staging vendredi 21/03</span>{" "}
                <span className="bg-[rgba(16,185,129,0.12)] text-[#10B981] px-2 py-0.5 rounded-md ml-1">✓ créé</span>
              </div>
              <div>
                <span className="text-[#55556A]">TÂCHE EXTRAITE</span><br />
                <span className="text-[#F5F5FA]">Ahmed → PR review avant jeudi 20/03</span>{" "}
                <span className="bg-[rgba(16,185,129,0.12)] text-[#10B981] px-2 py-0.5 rounded-md ml-1">✓ assignée</span>
              </div>
              <div>
                <span className="text-[#55556A]">PROSPECT DÉTECTÉ</span><br />
                <span className="text-[#F5F5FA]">Thomas Dupont / StartupX</span>{" "}
                <span className="bg-[rgba(16,185,129,0.12)] text-[#10B981] px-2 py-0.5 rounded-md ml-1">✓ CRM</span>
              </div>
              <div>
                <span className="text-[#55556A]">SENTIMENT</span><br />
                <span className="text-[#10B981]">Positif — 87% ↗</span>
              </div>
            </div>
          </div>
        </div>

        {/* Small cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {smallCards.map((card, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-8 hover:border-accent/50 hover:-translate-y-[3px] transition-all duration-300 shadow-sm">
              <div className="w-12 h-12 bg-fuchsia-d rounded-xl flex items-center justify-center text-2xl mb-6">{card.icon}</div>
              <h3 className="font-display font-bold text-lg text-foreground mb-3">{t(card.titleKey)}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">{t(card.descKey)}</p>
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag, j) => (
                  <span key={j} className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${tagStyles[tag.color]}`}>{tag.label}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
