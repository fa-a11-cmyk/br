import { useState, useEffect } from "react";
import logoMeet from "@/assets/logo-google-meet.png";
import logoTeams from "@/assets/logo-teams.png";
import logoWhatsapp from "@/assets/logo-whatsapp.png";
import logoCalendar from "@/assets/logo-gcalendar.png";
import logoN8n from "@/assets/logo-n8n.png";

const feedItems = [
  { icon: "⚡", text: "Yasmina C. vient de recevoir son rapport WhatsApp", time: "il y a 2 min" },
  { icon: "📊", text: "3 contacts créés dans RapidoCRM · Marseille", time: "il y a 4 min" },
  { icon: "✅", text: "Rapport de réunion commerciale généré · Paris", time: "il y a 6 min" },
  { icon: "💬", text: "Équipe BraindCode · 7 tâches créées automatiquement", time: "il y a 8 min" },
  { icon: "📅", text: "Follow-up planifié pour StartupX · Lyon", time: "il y a 11 min" },
];

const integrations = [
  { logo: logoMeet, name: "Google Meet" },
  { logo: logoTeams, name: "Microsoft Teams" },
  { logo: null, name: "RapidoCRM", emoji: "📊" },
  { logo: null, name: "OpenClaw", emoji: "⚡" },
  { logo: logoN8n, name: "N8N" },
  { logo: logoCalendar, name: "Google Calendar" },
  { logo: logoWhatsapp, name: "WhatsApp" },
];

const LogoBar = () => {
  const [visibleIdx, setVisibleIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleIdx(i => (i + 1) % feedItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const visibleItems = [0, 1, 2].map(offset => feedItems[(visibleIdx + offset) % feedItems.length]);

  return (
    <section className="py-10 px-5 md:px-[60px] border-t border-b border-border/50">
      {/* Live feed */}
      <div className="max-w-[800px] mx-auto mb-8">
        <div className="bg-card border border-border rounded-xl px-5 py-4 space-y-2 overflow-hidden shadow-sm">
          {visibleItems.map((item, i) => (
            <div key={`${item.text}-${i}`} className="flex items-center justify-between gap-3 font-mono text-[12px] text-muted-foreground animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-blink shrink-0" />
                <span className="truncate">{item.icon} {item.text}</span>
              </div>
              <span className="text-muted-foreground/60 shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[3px] text-muted-foreground text-center mb-6">
        S'intègre avec vos outils actuels
      </p>
      <div className="flex flex-wrap justify-center gap-3 md:gap-6">
        {integrations.map((i) => (
          <div
            key={i.name}
            className="bg-card border border-border rounded-lg py-2.5 px-5 font-display text-[13px] font-bold text-muted-foreground flex items-center gap-2.5 shadow-sm hover:border-primary hover:text-foreground transition-all"
          >
            {i.logo ? (
              <img src={i.logo} alt={i.name} className="w-5 h-5 object-contain" loading="lazy" />
            ) : (
              <span className="text-base">{i.emoji}</span>
            )}
            {i.name}
          </div>
        ))}
      </div>
    </section>
  );
};

export default LogoBar;
