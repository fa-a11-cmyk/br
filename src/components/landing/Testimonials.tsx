import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const Testimonials = () => {
  const ref = useScrollReveal();
  const { t } = useTranslation("landing");

  const globalStats = [
    { value: t("testimonials.stat1"), label: t("testimonials.stat1Label") },
    { value: t("testimonials.stat2"), label: t("testimonials.stat2Label") },
    { value: t("testimonials.stat3"), label: t("testimonials.stat3Label") },
    { value: t("testimonials.stat4"), label: t("testimonials.stat4Label") },
  ];

  const testimonials = [
    {
      text: t("testimonials.t1Text"),
      initials: "SL",
      name: t("testimonials.t1Name"),
      role: t("testimonials.t1Role"),
      gradient: "from-[#E91E8C] to-[#C2177A]",
    },
    {
      text: t("testimonials.t2Text"),
      initials: "KM",
      name: t("testimonials.t2Name"),
      role: t("testimonials.t2Role"),
      gradient: "from-[#7C3AED] to-[#5B21B6]",
    },
    {
      text: t("testimonials.t3Text"),
      initials: "AB",
      name: t("testimonials.t3Name"),
      role: t("testimonials.t3Role"),
      gradient: "from-[#E91E8C] to-[#7C3AED]",
    },
  ];

  return (
    <section className="bg-background py-[100px] px-5 md:px-[60px]">
      <div ref={ref} className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">{t("testimonials.tag")}</p>
        <h2
          className="font-display font-extrabold text-foreground mb-12"
          style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}
        >
          <span className="text-gradient">{t("testimonials.title1")}</span>
          <br />
          {t("testimonials.title2")}
        </h2>

        <div className="bg-card border border-border rounded-[14px] p-7 grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 shadow-sm">
          {globalStats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-display font-extrabold text-[36px] text-gradient tracking-[-1px]">{s.value}</p>
              <p className="font-body text-[13px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-7 shadow-sm">
              <div className="text-primary text-[13px] mb-3.5">★★★★★</div>
              <p className="font-body text-sm text-muted-foreground italic leading-[1.7] mb-5">{item.text}</p>
              <div className="flex items-center gap-3">
                <div className={`w-[38px] h-[38px] rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center font-display font-extrabold text-xs text-white`}>
                  {item.initials}
                </div>
                <div>
                  <p className="font-body text-[13px] font-semibold text-foreground">{item.name}</p>
                  <p className="font-body text-[11px] text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
