import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const CTAFinal = () => {
  const ref = useScrollReveal();
  const { t } = useTranslation("landing");

  return (
    <section className="bg-background py-[120px] px-5 md:px-10 text-center relative overflow-hidden">
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600, height: 600, bottom: -200, left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
        }}
      />
      <div ref={ref} className="relative z-10 max-w-[700px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">{t("cta.tag")}</p>
        <h2
          className="font-display font-extrabold text-foreground mb-2"
          style={{ fontSize: "clamp(28px, 4vw, 46px)", lineHeight: 1.08, letterSpacing: "-1.5px" }}
        >
          {t("cta.title1")}
          <br />
          {t("cta.title2")}
        </h2>
        <p
          className="font-display font-extrabold text-gradient mb-8"
          style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-1px" }}
        >
          {t("cta.title3")}
        </p>
        <p className="font-body text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
          {t("cta.subtitle")}
        </p>
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-destructive animate-blink" />
          <span className="font-mono text-[12px] text-muted-foreground">{t("cta.socialProof")}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3.5 mb-8">
          <a href="#tarifs" className="bg-gradient-primary text-white font-display font-bold text-base py-4 px-9 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 hover:shadow-fuchsia-lg transition-all">
            {t("cta.cta1")}
          </a>
          <a href="/demo" className="bg-card border border-border text-muted-foreground font-body text-base py-4 px-7 rounded-[10px] hover:border-primary hover:text-foreground transition-all">
            {t("cta.cta2")}
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-[13px] text-muted-foreground">
          <span>{t("cta.proof1")}</span>
          <span>{t("cta.proof2")}</span>
          <span>{t("cta.proof3")}</span>
        </div>
      </div>
    </section>
  );
};

export default CTAFinal;
