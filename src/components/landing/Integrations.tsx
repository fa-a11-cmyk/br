import { useScrollReveal } from "@/hooks/useScrollReveal";
import logoMeet from "@/assets/logo-google-meet.png";
import logoTeams from "@/assets/logo-teams.png";
import logoWhatsapp from "@/assets/logo-whatsapp.png";
import logoTelegram from "@/assets/logo-telegram.png";
import logoN8n from "@/assets/logo-n8n.png";
import logoCalendar from "@/assets/logo-gcalendar.png";
import logoDiscord from "@/assets/logo-discord.png";
import logoSlack from "@/assets/logo-slack.png";
import logoGmail from "@/assets/logo-gmail.png";

const items = [
  { logo: logoMeet, name: "Google Meet", type: "Visioconférence", badge: "MVP" },
  { logo: logoTeams, name: "Microsoft Teams", type: "Visioconférence", badge: "MVP" },
  { logo: null, name: "RapidoCRM", type: "CRM natif", badge: "Natif", emoji: "📊" },
  { logo: null, name: "OpenClaw", type: "Agent IA", badge: "MVP", emoji: "⚡" },
  { logo: logoN8n, name: "N8N", type: "Automatisation", badge: "MVP" },
  { logo: logoCalendar, name: "Google Calendar", type: "Agenda", badge: "MVP" },
  { logo: logoWhatsapp, name: "WhatsApp", type: "Messagerie", badge: "MVP" },
  { logo: logoTelegram, name: "Telegram", type: "Messagerie", badge: "MVP" },
  { logo: logoGmail, name: "Gmail / SMTP", type: "Email", badge: "MVP" },
  { logo: logoDiscord, name: "Discord", type: "Messagerie", badge: "V2" },
  { logo: null, name: "Notion", type: "Documentation", badge: "V2", emoji: "📝" },
  { logo: logoSlack, name: "Slack", type: "Collaboration", badge: "V2" },
];

const Integrations = () => {
  const ref = useScrollReveal();

  return (
    <section id="integrations" className="bg-background py-[100px] px-5 md:px-[60px]">
      <div ref={ref} className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-primary mb-4">Votre stack. Notre terrain.</p>
        <h2
          className="font-display font-extrabold text-foreground mb-4"
          style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: 1.1, letterSpacing: "-1px" }}
        >
          S'intègre en 2 minutes
          <br />
          avec ce que vous avez <span className="text-gradient">déjà.</span>
        </h2>
        <p className="font-body text-muted-foreground mb-12 max-w-[580px]" style={{ fontSize: "clamp(15px, 1.8vw, 17px)", lineHeight: 1.65 }}>
          Pas de migration. Pas de formation. Pas de friction.
          <br />
          RapidoMeet se branche sur vos outils existants
          et commence à agir immédiatement.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-[14px] py-6 px-5 text-center hover:border-primary transition-colors duration-300 shadow-sm"
            >
              {item.logo ? (
                <img
                  src={item.logo}
                  alt={item.name}
                  className="w-10 h-10 object-contain mx-auto mb-3"
                  loading="lazy"
                />
              ) : (
                <span className="text-[28px] block mb-3">{item.emoji}</span>
              )}
              <p className="font-display font-bold text-sm text-foreground mb-1">{item.name}</p>
              <p className="font-body text-[11px] text-muted-foreground mb-3">{item.type}</p>
              <span
                className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full ${
                  item.badge === "V2"
                    ? "bg-secondary text-muted-foreground"
                    : item.badge === "Natif"
                    ? "bg-violet-d text-[hsl(var(--violet-l))]"
                    : "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]"
                }`}
              >
                {item.badge}
              </span>
            </div>
          ))}
        </div>

        <p className="font-mono text-[12px] text-muted-foreground text-center mt-6">
          + 40 intégrations disponibles via N8N · API ouverte disponible
        </p>
      </div>
    </section>
  );
};

export default Integrations;
