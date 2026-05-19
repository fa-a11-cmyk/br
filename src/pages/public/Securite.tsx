import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Shield, Lock, Server, FileCheck, Globe, Mail, Download, Trash2 } from "lucide-react";
import PageHead from "@/components/PageHead";

const sections = [
  {
    icon: Lock,
    title: "Chiffrement des données",
    items: [
      "AES-256 pour les données au repos",
      "TLS 1.3 pour les données en transit",
      "Clés de chiffrement gérées par AWS KMS",
      "Hachage bcrypt pour les mots de passe",
    ],
  },
  {
    icon: Server,
    title: "Localisation & hébergement",
    items: [
      "Hébergé sur AWS EU-West-3 (Paris, France)",
      "Aucune donnée hors de l'Union Européenne",
      "Infrastructure redondante multi-AZ",
      "Sauvegardes quotidiennes chiffrées",
    ],
  },
  {
    icon: FileCheck,
    title: "Conformité RGPD",
    items: [
      "Registre de traitement à jour (Art. 30)",
      "Base légale documentée pour chaque traitement",
      "Analyses d'impact (AIPD) réalisées",
      "Sous-traitants conformes (DPA signés)",
    ],
  },
  {
    icon: Globe,
    title: "Politique de rétention",
    items: [
      "Durée configurable par workspace (6 mois à illimité)",
      "Suppression automatique à expiration",
      "Purge des transcriptions brutes après traitement",
      "Logs d'audit conservés 2 ans",
    ],
  },
  {
    icon: Download,
    title: "Export & portabilité",
    items: [
      "Export complet des données en JSON/CSV",
      "Export des transcriptions en TXT/SRT",
      "Export des rapports en PDF",
      "API d'export programmatique (Plan Pro+)",
    ],
  },
  {
    icon: Trash2,
    title: "Droit à l'effacement",
    items: [
      "Suppression de compte en 1 clic",
      "Effacement complet sous 72h",
      "Certificat de suppression sur demande",
      "Suppression des sauvegardes sous 30 jours",
    ],
  },
];

const certifications = [
  { name: "SOC 2 Type II", status: "En cours", color: "text-rm-warning" },
  { name: "ISO 27001", status: "Prévu Q3 2026", color: "text-muted-foreground" },
  { name: "RGPD", status: "Conforme", color: "text-rm-success" },
  { name: "HDS (Données de santé)", status: "Non applicable", color: "text-muted-foreground" },
];

const Securite = () => (
  <div className="min-h-screen bg-background">
    <PageHead title="Sécurité" description="Chiffrement AES-256, hébergement en France, conformité RGPD. Découvrez comment RapidoMeet protège vos données de réunion." path="/securite" />
    <Navbar />

    {/* Hero */}
    <section className="pt-[140px] pb-16 px-4 md:px-[60px] text-center">
      <div className="inline-flex items-center gap-2 bg-rm-success/10 border border-rm-success/20 rounded-full py-1.5 px-4 mb-6">
        <Shield className="w-4 h-4 text-rm-success" />
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-rm-success">Sécurité & conformité</span>
      </div>
      <h1 className="font-display font-extrabold text-foreground leading-[1.05] tracking-tight mb-5" style={{ fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-2px" }}>
        Vos données sont <span className="text-gradient">notre priorité</span>.
      </h1>
      <p className="font-body text-lg text-muted-foreground max-w-[600px] mx-auto">
        RapidoMeet est conçu avec la sécurité au cœur. Chiffrement de bout en bout,
        hébergement européen et conformité RGPD native.
      </p>
    </section>

    {/* Grid sections */}
    <section className="px-4 md:px-[60px] pb-20">
      <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((s) => (
          <div key={s.title} className="bg-card border border-border rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground mb-3">{s.title}</h3>
            <ul className="space-y-2">
              {s.items.map((item) => (
                <li key={item} className="flex gap-2 font-body text-sm text-muted-foreground">
                  <span className="text-rm-success mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    {/* Certifications */}
    <section className="px-4 md:px-[60px] pb-20 bg-rm-dark-1">
      <div className="max-w-[800px] mx-auto py-16">
        <h2 className="font-display font-extrabold text-2xl text-foreground text-center mb-10">Certifications & conformité</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {certifications.map((c) => (
            <div key={c.name} className="bg-card border border-border rounded-xl p-5 text-center">
              <p className="font-display font-bold text-sm text-foreground mb-1">{c.name}</p>
              <p className={`font-mono text-xs ${c.color}`}>{c.status}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Bug Bounty */}
    <section className="px-4 md:px-[60px] py-16">
      <div className="max-w-[600px] mx-auto bg-card border border-primary/30 rounded-2xl p-8 text-center">
        <p className="text-3xl mb-3">🐛</p>
        <h3 className="font-display font-extrabold text-xl text-foreground mb-2">Programme Bug Bounty</h3>
        <p className="font-body text-sm text-muted-foreground mb-4">
          Vous avez trouvé une vulnérabilité ? Signalez-la de manière responsable
          et recevez une récompense.
        </p>
        <a href="mailto:security@rapidomeet.io" className="inline-block bg-gradient-primary text-white font-display font-bold text-sm py-3 px-7 rounded-xl">
          security@rapidomeet.io
        </a>
      </div>
    </section>

    {/* DPO */}
    <section className="px-4 md:px-[60px] pb-20">
      <div className="max-w-[600px] mx-auto text-center">
        <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Contact DPO</h3>
        <p className="font-body text-sm text-muted-foreground mb-3">
          Pour toute question relative à vos données personnelles, contactez notre Délégué à la Protection des Données.
        </p>
        <a href="mailto:dpo@braindcode.com" className="font-mono text-sm text-primary hover:underline">
          dpo@braindcode.com
        </a>
      </div>
    </section>

    <Footer />
  </div>
);

export default Securite;
