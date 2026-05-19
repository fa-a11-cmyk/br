import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const ref = useScrollReveal();
  const { t } = useTranslation("landing");

  const steps = [
    { num: t("howItWorks.step1Num"), icon: "🎙", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { num: t("howItWorks.step2Num"), icon: "🧠", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { num: t("howItWorks.step3Num"), icon: "⚡", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
  ];

  return (
    <section id="comment-ca-marche" className="bg-background py-[100px] px-5 md:px-[60px]">
      <div ref={ref} className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">{t("howItWorks.tag")}</p>
        <h2
          className="font-display font-extrabold text-foreground mb-4"
          style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}
        >
          <span className="text-gradient">{t("howItWorks.title1")}</span>
          <br />
          <span className="text-gradient">{t("howItWorks.title2")}</span>
        </h2>
        <p className="font-body text-muted-foreground mb-12 max-w-[580px]" style={{ fontSize: "clamp(16px, 2vw, 18px)", lineHeight: 1.65 }}>
          {t("howItWorks.subtitle")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-8 hover:border-primary/40 hover:-translate-y-[3px] transition-all duration-300 relative shadow-sm"
            >
              <p className="font-mono text-[11px] uppercase tracking-[2px] text-primary mb-4">{s.num}</p>
              <div className="w-12 h-12 bg-fuchsia-d rounded-xl flex items-center justify-center text-2xl mb-6">
                {s.icon}
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-3">{s.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              {i < 2 && (
                <span className="hidden md:block absolute top-1/2 -right-4 text-border text-xl">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
