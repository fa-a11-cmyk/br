import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";

const AnimatedStat = ({ stat }: { stat: { numericTarget: number; displayFn: (v: number) => string } }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [displayed, setDisplayed] = useState(stat.displayFn(0));
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const start = performance.now();
        const duration = 1500;
        const update = (time: number) => {
          const elapsed = time - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * stat.numericTarget);
          setDisplayed(stat.displayFn(current));
          if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
      }
    }, { threshold: 0.5 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [stat]);

  return (
    <p ref={ref} className="font-display font-extrabold text-[40px] text-primary mb-2 tabular-nums">
      {displayed}
    </p>
  );
};

const Problem = () => {
  const ref = useScrollReveal();
  const { t } = useTranslation("landing");

  const stats = [
    { emoji: "⏱", numericTarget: 168, displayFn: (v: number) => { const h = Math.floor(v / 60); const m = v % 60; return `${h}h${m.toString().padStart(2, '0')}`; }, text: t("problem.stat1Text") },
    { emoji: "💀", numericTarget: 68, displayFn: (v: number) => `${v}%`, text: t("problem.stat2Text") },
    { emoji: "🕳", numericTarget: 0, displayFn: () => "0", text: t("problem.stat3Text") },
  ];

  return (
    <section id="probleme" className="bg-card py-[100px] px-5 md:px-[60px]">
      <div ref={ref} className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">{t("problem.tag")}</p>
        <h2
          className="font-display font-extrabold text-foreground mb-4"
          style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}
        >
          {t("problem.title").replace(/<1>|<\/1>/g, "")}
          <br />
          {t("problem.title2")}
        </h2>
        <p className="font-body text-muted-foreground mb-12 max-w-[580px]" style={{ fontSize: "clamp(16px, 2vw, 18px)", lineHeight: 1.65 }}>
          {t("problem.subtitle")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 rounded-2xl overflow-hidden bg-border mb-12">
          {stats.map((s, i) => (
            <div key={i} className="bg-card p-8 md:p-9">
              <span className="text-2xl mb-4 block">{s.emoji}</span>
              <AnimatedStat stat={s} />
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="bg-secondary border-l-[3px] border-l-primary rounded-r-xl p-6 md:py-6 md:px-8">
          <p className="font-body text-[17px] text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium not-italic">
              {t("problem.quote")}
            </span>
            <br />
            <span className="italic text-sm mt-2 block">{t("problem.quoteAuthor")}</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Problem;
