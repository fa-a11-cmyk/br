import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useScrollReveal();
  const { t } = useTranslation("landing");

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
    { q: t("faq.q7"), a: t("faq.a7") },
    { q: t("faq.q8"), a: t("faq.a8") },
  ];

  return (
    <section className="bg-secondary py-[100px] px-5 md:px-[60px]">
      <div ref={ref} className="max-w-[800px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">{t("faq.tag")}</p>
        <h2
          className="font-display font-extrabold text-foreground mb-12"
          style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}
        >
          {t("faq.title")}
          <br />
          <span className="text-gradient">{t("faq.titleGradient")}</span>
        </h2>

        <div className="space-y-1 rounded-xl overflow-hidden">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border shadow-sm rounded-lg">
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-display font-semibold text-[15px] text-foreground pr-4">{faq.q}</span>
                <span
                  className={`text-muted-foreground transition-all duration-300 shrink-0 ${open === i ? "text-primary" : ""}`}
                  style={{ transform: open === i ? "rotate(180deg)" : "rotate(0)" }}
                >
                  ⌄
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-[350ms] ease-in-out"
                style={{ maxHeight: open === i ? 300 : 0 }}
              >
                <p className="px-5 pb-5 font-body text-sm text-muted-foreground leading-[1.7]">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
