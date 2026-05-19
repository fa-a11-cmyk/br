import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHead from "@/components/PageHead";

const features = [
  {
    icon: "🎙", title: "Transcription intelligente",
    desc: "Whisper + Deepgram pour une transcription FR/EN/AR ultra-précise avec identification des intervenants (diarisation). Import audio ou connexion live.",
    tags: ["Diarisation", "FR / EN / AR", "Temps réel", "Import audio"],
  },
  {
    icon: "🧠", title: "Analyse IA avancée",
    desc: "Extraction automatique des décisions, tâches, prospects, entités clés et analyse des sentiments. Tout est structuré et actionnable.",
    tags: ["Décisions", "Tâches", "Sentiments", "Entités"],
  },
  {
    icon: "📊", title: "Connexion RapidoCRM native",
    desc: "Les prospects détectés sont créés dans RapidoCRM. Pipeline mis à jour, activités loggées, tâches assignées — zéro saisie manuelle.",
    tags: ["Contacts auto", "Pipeline", "Log activités"],
  },
  {
    icon: "⚡", title: "OpenClaw & multi-canal",
    desc: "Rapports envoyés sur WhatsApp, Telegram, Discord ou email HTML en moins de 3 minutes. Répondez depuis WhatsApp pour déclencher des actions.",
    tags: ["WhatsApp", "Telegram", "Email HTML", "Discord"],
  },
  {
    icon: "🔁", title: "Scénarios N8N post-réunion",
    desc: "Déclenchez vos workflows N8N directement depuis la réunion. Weekly digest, séquence email, génération de facture — tout s'active au bon moment.",
    tags: ["10 scénarios", "Personnalisables", "1-clic"],
  },
  {
    icon: "📅", title: "Agenda & suivi automatique",
    desc: "«On se revoit dans 2 semaines» devient un événement Google Calendar créé automatiquement avec tous les participants invités.",
    tags: ["Google Calendar", "Rappels auto", "Follow-up"],
  },
  {
    icon: "🧩", title: "RAG entreprise & mémoire",
    desc: "Connectez vos documents, processus et glossaire métier. L'agent utilise ce contexte pour des extractions encore plus précises.",
    tags: ["Base de connaissance", "Mémoire par projet"],
  },
  {
    icon: "🎨", title: "Charte graphique personnalisée",
    desc: "Personnalisez vos emails et rapports PDF aux couleurs de votre entreprise. Templates, typographie et signature configurables.",
    tags: ["Charte email", "Templates PDF", "Signature"],
  },
];

const Fonctionnalites = () => (
  <div className="bg-rm-black min-h-screen">
    <PageHead title="Fonctionnalités" description="Transcription IA, analyse NLP, automatisation CRM, distribution multi-canal — découvrez toutes les fonctionnalités de RapidoMeet." path="/fonctionnalites" />
    <Navbar />

    <section className="pt-[140px] pb-[60px] px-5 md:px-[60px]">
      <div className="max-w-[1200px] mx-auto text-center">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-rm-fuchsia mb-4">Fonctionnalités</p>
        <h1 className="font-display font-extrabold tracking-[-1px] text-rm-white mb-4" style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>
          Tout ce dont votre équipe<br />a <span className="text-gradient">réellement besoin.</span>
        </h1>
        <p className="font-body text-base text-rm-gray-1 max-w-xl mx-auto">
          De la transcription à l'action, RapidoMeet couvre l'intégralité du cycle post-réunion.
        </p>
      </div>
    </section>

    <section className="px-5 md:px-[60px] pb-[100px]">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <div key={i} className="bg-rm-dark-2 border border-rm-dark-4 rounded-2xl p-8 hover:border-rm-violet/50 hover:-translate-y-[3px] transition-all duration-300">
            <div className="w-12 h-12 bg-fuchsia-d rounded-xl flex items-center justify-center text-2xl mb-6">{f.icon}</div>
            <h3 className="font-display font-bold text-lg text-rm-white mb-3">{f.title}</h3>
            <p className="font-body text-sm text-rm-gray-1 leading-relaxed mb-6">{f.desc}</p>
            <div className="flex flex-wrap gap-2">
              {f.tags.map((t, j) => (
                <span key={j} className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${j < 2 ? "bg-fuchsia-d text-rm-fuchsia-l" : "bg-rm-dark-3 text-rm-gray-1 border border-rm-dark-4"}`}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="px-5 md:px-[60px] pb-[100px]">
      <div className="max-w-[800px] mx-auto text-center bg-rm-dark-2 border border-rm-dark-4 rounded-[20px] p-12">
        <h2 className="font-display font-extrabold text-2xl text-rm-white mb-4">Prêt à <span className="text-gradient">transformer</span> vos réunions ?</h2>
        <p className="font-body text-sm text-rm-gray-1 mb-8">Essayez RapidoMeet gratuitement pendant 14 jours. Aucune carte bancaire requise.</p>
        <a href="/inscription" className="inline-block bg-gradient-primary text-rm-white font-display font-bold text-sm py-3 px-8 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform">
          Démarrer maintenant →
        </a>
      </div>
    </section>

    <Footer />
  </div>
);

export default Fonctionnalites;
