import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHead from "@/components/PageHead";
import { useState } from "react";

const Check = () => <span className="text-rm-success mr-2">✓</span>;
const Cross = () => <span className="text-rm-gray-2 mr-2">✗</span>;

const faqs = [
  { q: "Puis-je changer de plan à tout moment ?", a: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Le changement prend effet immédiatement et la facturation est ajustée au prorata." },
  { q: "Y a-t-il une période d'essai gratuite ?", a: "Oui, le plan Starter est gratuit pendant 14 jours. Aucune carte bancaire requise pour commencer." },
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Nous acceptons Visa, Mastercard, American Express et les virements SEPA pour les plans Entreprise." },
  { q: "Que se passe-t-il si je dépasse mes limites ?", a: "Sur le plan Starter, les réunions supplémentaires sont bloquées. Sur Pro et Entreprise, les limites sont généreuses et vous êtes notifié à 80% d'utilisation." },
  { q: "Les données sont-elles sécurisées ?", a: "Toutes les données sont chiffrées en transit et au repos. Hébergement en Europe (France). Conformité RGPD garantie." },
];

const comparisonRows = [
  { feature: "Réunions / mois", starter: "20", pro: "Illimitées", enterprise: "Illimitées" },
  { feature: "Transcription", starter: "FR + EN", pro: "FR + EN + AR", enterprise: "Toutes langues" },
  { feature: "Canaux de diffusion", starter: "WhatsApp + Email", pro: "Tous (WhatsApp, Telegram, Email, Discord)", enterprise: "Tous + custom" },
  { feature: "Scénarios N8N", starter: "3", pro: "10", enterprise: "Illimité + custom" },
  { feature: "OpenClaw", starter: "✗", pro: "✓", enterprise: "✓ + multi-instance" },
  { feature: "RAG entreprise", starter: "✗", pro: "50 documents", enterprise: "Illimité" },
  { feature: "Charte graphique emails", starter: "✗", pro: "✓", enterprise: "✓ + templates custom" },
  { feature: "Utilisateurs", starter: "1", pro: "5", enterprise: "Illimité" },
  { feature: "Workspaces", starter: "1", pro: "1", enterprise: "Multi" },
  { feature: "Support", starter: "Email", pro: "Email prioritaire", enterprise: "SLA + dédié" },
  { feature: "Onboarding", starter: "Auto", pro: "Auto", enterprise: "Dédié" },
  { feature: "API access", starter: "✗", pro: "Limité", enterprise: "Complet" },
];

const Tarifs = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-rm-black min-h-screen">
      <PageHead title="Tarifs" description="Plans Starter à 29€/mois et Pro à 79€/mois. 14 jours d'essai gratuit. Réunions illimitées, transcription IA et automatisation." path="/tarifs" />
      <Navbar />

      {/* Hero */}
      <section className="pt-[140px] pb-[60px] px-5 md:px-[60px]">
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-rm-fuchsia mb-4">Tarifs</p>
          <h1 className="font-display font-extrabold tracking-[-1px] text-rm-white mb-4" style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>
            Simple, transparent,<br /><span className="text-gradient">sans mauvaise surprise.</span>
          </h1>
          <p className="font-body text-base text-rm-gray-1 max-w-xl mx-auto">
            Choisissez le plan adapté à la taille de votre équipe. Évoluez quand vous le souhaitez.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-5 md:px-[60px] pb-[80px]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Starter */}
          <div className="bg-rm-dark-2 border border-rm-dark-4 rounded-[20px] p-9 order-2 md:order-1">
            <p className="font-display font-bold text-sm text-rm-gray-1 uppercase tracking-[1px] mb-4">Starter</p>
            <p className="font-display font-extrabold text-5xl text-rm-white tracking-[-2px] mb-1">29€</p>
            <p className="font-body text-[13px] text-rm-gray-2 mb-4">/ mois · par workspace</p>
            <p className="font-body text-sm text-rm-gray-1 mb-6">Pour les indépendants et petites équipes qui veulent automatiser leurs réunions sans complexité.</p>
            <ul className="font-body text-sm space-y-2.5 mb-8 text-rm-gray-1">
              <li><Check />20 réunions / mois</li>
              <li><Check />Transcription FR + EN</li>
              <li><Check />Rapport WhatsApp & email</li>
              <li><Check />Connexion RapidoCRM</li>
              <li><Check />3 scénarios N8N</li>
              <li><Cross />OpenClaw inclus</li>
              <li><Cross />RAG entreprise</li>
            </ul>
            <a href="/app/billing?plan=starter" className="block w-full text-center bg-rm-dark-3 border border-rm-dark-5 text-rm-gray-1 font-body font-semibold text-sm py-3 rounded-[10px] hover:border-rm-fuchsia hover:text-rm-white transition-all">
              Choisir Starter →
            </a>
          </div>

          {/* Pro */}
          <div className="bg-rm-dark-2 border-[1.5px] border-rm-fuchsia rounded-[20px] p-9 relative md:scale-[1.02] order-1 md:order-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary font-mono text-[10px] uppercase py-1 px-4 rounded-full text-rm-white tracking-wider">⭐ Le plus populaire</div>
            <p className="font-display font-bold text-sm text-rm-gray-1 uppercase tracking-[1px] mb-4">Pro</p>
            <p className="font-display font-extrabold text-5xl tracking-[-2px] mb-1 text-gradient">79€</p>
            <p className="font-body text-[13px] text-rm-gray-2 mb-4">/ mois · par workspace</p>
            <p className="font-body text-sm text-rm-gray-1 mb-6">Pour les équipes commerciales et les PME qui veulent un agent IA complet connecté à leur écosystème.</p>
            <ul className="font-body text-sm space-y-2.5 mb-8 text-rm-gray-1">
              <li><Check />Réunions illimitées</li>
              <li><Check />Transcription FR + EN + AR</li>
              <li><Check />Tous les canaux</li>
              <li><Check />RapidoCRM + Calendar + N8N</li>
              <li><Check />10 scénarios N8N inclus</li>
              <li><Check />OpenClaw inclus</li>
              <li><Check />RAG entreprise (50 docs)</li>
              <li><Check />Charte graphique emails</li>
            </ul>
            <a href="/app/billing?plan=pro" className="block w-full text-center bg-gradient-primary text-rm-white font-display font-bold text-sm py-3 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 hover:shadow-fuchsia-lg transition-all">
              Choisir Pro →
            </a>
          </div>

          {/* Enterprise */}
          <div className="bg-rm-dark-2 border border-rm-dark-4 rounded-[20px] p-9 order-3">
            <p className="font-display font-bold text-sm text-rm-gray-1 uppercase tracking-[1px] mb-4">Entreprise</p>
            <p className="font-display font-extrabold text-[32px] text-rm-white tracking-[-1px] mb-1">Sur devis</p>
            <p className="font-body text-[13px] text-rm-gray-2 mb-4">Multi-équipes · SLA garanti</p>
            <p className="font-body text-sm text-rm-gray-1 mb-6">Pour les organisations multi-équipes avec des besoins spécifiques et un accompagnement dédié.</p>
            <ul className="font-body text-sm space-y-2.5 mb-8 text-rm-gray-1">
              <li><Check />Tout le plan Pro</li>
              <li><Check />Multi-workspace</li>
              <li><Check />RAG illimité</li>
              <li><Check />Skills sur-mesure</li>
              <li><Check />Intégrations spécifiques</li>
              <li><Check />SLA + support prioritaire</li>
              <li><Check />Onboarding dédié</li>
            </ul>
            <a href="/demo" className="block w-full text-center bg-rm-dark-3 border border-rm-dark-5 text-rm-gray-1 font-body font-semibold text-sm py-3 rounded-[10px] hover:border-rm-fuchsia hover:text-rm-white transition-all">
              Contacter l'équipe
            </a>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-5 md:px-[60px] pb-[80px]">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display font-extrabold text-2xl text-rm-white mb-8 text-center">Comparaison <span className="text-gradient">détaillée</span></h2>
          <div className="bg-rm-dark-2 border border-rm-dark-4 rounded-[16px] overflow-hidden">
            <div className="grid grid-cols-4 bg-rm-dark-3 px-5 py-3">
              <span className="font-mono text-[10px] uppercase text-rm-gray-2 tracking-wider">Fonctionnalité</span>
              <span className="font-mono text-[10px] uppercase text-rm-gray-2 tracking-wider text-center">Starter · 29€</span>
              <span className="font-mono text-[10px] uppercase text-rm-fuchsia tracking-wider text-center">Pro · 79€</span>
              <span className="font-mono text-[10px] uppercase text-rm-gray-2 tracking-wider text-center">Entreprise</span>
            </div>
            {comparisonRows.map((row, i) => (
              <div key={i} className={`grid grid-cols-4 px-5 py-3 border-t border-rm-dark-4 ${i % 2 === 0 ? "bg-rm-dark-2" : "bg-rm-dark-1"}`}>
                <span className="font-body text-sm text-rm-white">{row.feature}</span>
                <span className="font-body text-sm text-rm-gray-1 text-center">{row.starter}</span>
                <span className="font-body text-sm text-rm-white text-center">{row.pro}</span>
                <span className="font-body text-sm text-rm-gray-1 text-center">{row.enterprise}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 md:px-[60px] pb-[100px]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display font-extrabold text-2xl text-rm-white mb-8 text-center">Questions <span className="text-gradient">fréquentes</span></h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-rm-dark-2 border border-rm-dark-4 rounded-[14px] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-body font-medium text-sm text-rm-white">{faq.q}</span>
                  <span className="text-rm-gray-2 text-lg transition-transform" style={{ transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="font-body text-sm text-rm-gray-1 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Tarifs;
