import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import HeroVideoDemo from "./HeroVideoDemo";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const typewriterLines = [
  { speaker: "MICHAEL K.", time: "00:00:12", text: "\"On valide le déploiement vendredi ?\"" },
  { speaker: "AHMED B.", time: "00:00:18", text: "\"PR prête jeudi soir, pas de souci.\"" },
  { speaker: "LILIA F.", time: "00:00:31", text: "\"CDC RapidoRH finalisé pour lundi.\"" },
];

const actionPills = [
  { icon: "✅", text: "Tâche créée — Ahmed → PR avant jeudi", color: "bg-success-d text-[hsl(var(--success))]" },
  { icon: "📊", text: "Contact Thomas Dupont → RapidoCRM", color: "bg-violet-d text-[hsl(var(--violet-l))]" },
  { icon: "💬", text: "Rapport envoyé sur WhatsApp", color: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]" },
];

const TypewriterCard = () => {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<typeof typewriterLines>([]);
  const [showPills, setShowPills] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (currentLine >= typewriterLines.length) {
      const t = setTimeout(() => setShowPills(true), 500);
      const reset = setTimeout(() => {
        setCurrentLine(0);
        setCurrentChar(0);
        setDisplayedLines([]);
        setShowPills(false);
      }, 6000);
      return () => { clearTimeout(t); clearTimeout(reset); };
    }

    const line = typewriterLines[currentLine];
    const fullText = line.text;

    if (currentChar < fullText.length) {
      intervalRef.current = setTimeout(() => setCurrentChar(c => c + 1), 40);
    } else {
      intervalRef.current = setTimeout(() => {
        setDisplayedLines(prev => [...prev, line]);
        setCurrentLine(l => l + 1);
        setCurrentChar(0);
      }, 800);
    }

    return () => clearTimeout(intervalRef.current);
  }, [currentLine, currentChar]);

  return (
    <div className="relative w-full max-w-[400px]">
      <div className="force-dark rounded-xl p-5 font-mono text-xs leading-relaxed border border-[#28283A]">
        <div className="flex items-center gap-1.5 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E91E8C]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#33334A]" />
          <span className="ml-3 text-[#55556A] text-[11px]">réunion_live.mp3</span>
        </div>
        <div className="space-y-3 min-h-[140px]">
          {displayedLines.map((line, i) => (
            <div key={i}>
              <span className="text-[#55556A]">[{line.time}] {line.speaker}</span>
              <br />
              <span className="text-[#F5F5FA]">{line.text}</span>
            </div>
          ))}
          {currentLine < typewriterLines.length && (
            <div>
              <span className="text-[#55556A]">[{typewriterLines[currentLine].time}] {typewriterLines[currentLine].speaker}</span>
              <br />
              <span className="text-[#F5F5FA]">
                {typewriterLines[currentLine].text.slice(0, currentChar)}
              </span>
              <span className="text-[#E91E8C] animate-blink">|</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {actionPills.map((pill, i) => (
          <div
            key={i}
            className={`${pill.color} rounded-lg px-3 py-2 text-xs font-mono flex items-center gap-2 transition-all duration-500 ${showPills ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            style={{ transitionDelay: `${i * 300}ms` }}
          >
            <span>{pill.icon}</span>
            <span>{pill.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Hero = () => {
  const blobRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("landing");

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!blobRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      blobRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-60% + ${y}px))`;
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center px-5 md:px-[60px] pt-[68px] overflow-hidden">
      <div
        ref={blobRef}
        className="absolute animate-pulse-blob pointer-events-none"
        style={{
          width: 800, height: 800, top: "20%", left: "50%",
          transform: "translate(-50%, 0)",
          background: "radial-gradient(circle, rgba(233,30,140,0.15) 0%, rgba(124,58,237,0.08) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-center">
        <div>
          <motion.div
            {...fadeUp(0)}
            className="flex items-center gap-2 bg-secondary border border-border rounded-full py-1.5 px-4 mb-8 w-fit"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-blink" />
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-primary">
              {t("hero.badge")}
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="font-display font-extrabold text-foreground mb-6"
            style={{ fontSize: "clamp(32px, 5vw, 62px)", lineHeight: 1.05, letterSpacing: "-2px" }}
          >
            {t("hero.title1")}
            <br />
            <span className="text-gradient">{t("hero.title2")}</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="font-body text-muted-foreground max-w-[520px] mb-10 leading-[1.65]"
            style={{ fontSize: "clamp(15px, 1.8vw, 17px)" }}
          >
            {t("hero.subtitle").replace(/<1>|<\/1>/g, "")}
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-3.5 mb-8">
            <a href="#tarifs" className="bg-gradient-primary text-white font-display font-bold text-base py-4 px-9 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 hover:shadow-fuchsia-lg transition-all">
              {t("hero.cta1")}
            </a>
            <a href="#comment-ca-marche" className="bg-card border border-border text-muted-foreground font-body text-base py-4 px-7 rounded-[10px] hover:border-primary hover:text-foreground transition-all">
              {t("hero.cta2")}
            </a>
          </motion.div>

          <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-6 text-[13px] text-muted-foreground mb-4">
            <span>{t("hero.proof1")}</span>
            <span>{t("hero.proof2")}</span>
            <span>{t("hero.proof3")}</span>
          </motion.div>

          <motion.div {...fadeUp(0.45)} className="flex items-center gap-2">
            <span className="text-[hsl(var(--warning))] text-sm">★★★★★</span>
            <span className="font-mono text-[12px] text-muted-foreground">{t("hero.rating")}</span>
          </motion.div>
        </div>

        <motion.div {...fadeUp(0.4)} className="hidden lg:block">
          <HeroVideoDemo />
          <p className="font-body text-[12px] text-muted-foreground text-center mt-3">
            {t("hero.videoCaption")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
