import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHead from "@/components/PageHead";

const categories = [
  {
    label: "VISIOCONFÉRENCE",
    items: [
      { emoji: "📹", name: "Google Meet", desc: "Rejoignez automatiquement vos réunions Google Meet et transcrivez en temps réel.", badge: "MVP", status: "Disponible" },
      { emoji: "💼", name: "Microsoft Teams", desc: "Connexion native à Teams pour capturer vos réunions d'équipe.", badge: "MVP", status: "Disponible" },
    ],
  },
  {
    label: "CRM",
    items: [
      { emoji: "📊", name: "RapidoCRM", desc: "Synchronisation native : contacts, opportunités, activités et tâches créés automatiquement.", badge: "Natif", status: "Disponible" },
      { emoji: "🔗", name: "HubSpot / Salesforce", desc: "Connectez votre CRM externe via webhook ou API REST pour synchroniser vos données.", badge: "API", status: "Disponible" },
    ],
  },
  {
    label: "AGENDA",
    items: [
      { emoji: "📅", name: "Google Calendar", desc: "Synchronisez vos calendriers, créez automatiquement des événements de suivi.", badge: "MVP", status: "Disponible" },
      { emoji: "📆", name: "Outlook Calendar", desc: "Connectez votre agenda Outlook pour planifier les follow-ups automatiquement.", badge: "MVP", status: "Disponible" },
    ],
  },
  {
    label: "MESSAGERIE & DIFFUSION",
    items: [
      { emoji: "💬", name: "WhatsApp Business", desc: "Recevez vos rapports de réunion directement sur WhatsApp. Répondez pour déclencher des actions.", badge: "MVP", status: "Disponible" },
      { emoji: "✈️", name: "Telegram", desc: "Bot Telegram intégré pour recevoir résumés et alertes en temps réel.", badge: "MVP", status: "Disponible" },
      { emoji: "📧", name: "Email HTML", desc: "Rapports email personnalisés aux couleurs de votre entreprise.", badge: "MVP", status: "Disponible" },
      { emoji: "🎮", name: "Discord", desc: "Envoyez vos rapports sur vos channels Discord. Bientôt disponible.", badge: "V2", status: "Bientôt" },
    ],
  },
  {
    label: "AUTOMATISATION",
    items: [
      { emoji: "🔁", name: "N8N", desc: "Déclenchez vos workflows post-réunion : emails, factures, notifications, syncs.", badge: "MVP", status: "Disponible" },
      { emoji: "⚡", name: "OpenClaw", desc: "Gateway IA pour orchestrer la distribution multi-canal de vos rapports.", badge: "MVP", status: "Disponible" },
    ],
  },
  {
    label: "PRODUCTIVITÉ",
    items: [
      { emoji: "📝", name: "Notion", desc: "Exportez vos résumés et tâches directement dans vos pages Notion.", badge: "V2", status: "Bientôt" },
      { emoji: "💬", name: "Slack", desc: "Notifications et résumés dans vos channels Slack.", badge: "V2", status: "Bientôt" },
    ],
  },
];

const badgeStyle = (badge: string) =>
  badge === "V2" ? "bg-rm-dark-4 text-rm-gray-2" : badge === "Natif" ? "bg-violet-d text-rm-violet-l" : badge === "API" ? "bg-rm-dark-3 text-rm-gray-1" : "bg-fuchsia-d text-rm-fuchsia-l";

const IntegrationsPage = () => (
  <div className="bg-rm-black min-h-screen">
    <PageHead title="Intégrations" description="Connectez RapidoMeet à Google Meet, Slack, HubSpot, WhatsApp et plus. Intégrations natives et API pour automatiser vos réunions." path="/integrations" />
    <Navbar />

    <section className="pt-[140px] pb-[60px] px-5 md:px-[60px]">
      <div className="max-w-[1200px] mx-auto text-center">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-rm-fuchsia mb-4">Intégrations</p>
        <h1 className="font-display font-extrabold tracking-[-1px] text-rm-white mb-4" style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>
          Branché sur <span className="text-gradient">votre stack existant.</span>
        </h1>
        <p className="font-body text-base text-rm-gray-1 max-w-xl mx-auto">
          Connectez en 2 minutes les outils que vous utilisez déjà. Pas de migration, pas de friction.
        </p>
      </div>
    </section>

    <section className="px-5 md:px-[60px] pb-[100px]">
      <div className="max-w-[1200px] mx-auto space-y-12">
        {categories.map((cat) => (
          <div key={cat.label}>
            <p className="font-mono text-[11px] uppercase tracking-[3px] text-rm-fuchsia mb-4">{cat.label}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cat.items.map((item, j) => (
                <div key={j} className="bg-rm-dark-2 border border-rm-dark-4 rounded-[14px] p-6 hover:border-rm-fuchsia/40 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-rm-dark-3 rounded-xl flex items-center justify-center text-2xl shrink-0">{item.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-bold text-[15px] text-rm-white">{item.name}</span>
                        <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full ${badgeStyle(item.badge)}`}>{item.badge}</span>
                      </div>
                      <p className="font-body text-sm text-rm-gray-1 leading-relaxed mb-3">{item.desc}</p>
                      <span className={`font-mono text-[11px] ${item.status === "Bientôt" ? "text-rm-gray-2" : "text-rm-success"}`}>
                        {item.status === "Bientôt" ? "○ Bientôt disponible" : "● Disponible"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>

    <Footer />
  </div>
);

export default IntegrationsPage;
