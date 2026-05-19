import { useState } from "react";

const TabAbonnement = () => {
  const [showCancel, setShowCancel] = useState(false);

  const invoices = [
    { date: "18 mars 2026", amount: "79,00 €", status: "Payé" },
    { date: "18 févr. 2026", amount: "79,00 €", status: "Payé" },
    { date: "18 janv. 2026", amount: "79,00 €", status: "Payé" },
    { date: "18 déc. 2025", amount: "29,00 €", status: "Payé" },
  ];

  const comparison = [
    { feature: "Réunions", pro: "Illimitées", ent: "Illimitées" },
    { feature: "Workspaces", pro: "1", ent: "Multi" },
    { feature: "Utilisateurs", pro: "5 max", ent: "Illimité" },
    { feature: "Stockage RAG", pro: "50 docs", ent: "Illimité" },
    { feature: "Scénarios N8N", pro: "10", ent: "Illimité + custom" },
    { feature: "Support", pro: "Email", ent: "Prioritaire + SLA" },
    { feature: "Onboarding", pro: "Auto", ent: "Dédié" },
    { feature: "Skills custom", pro: "6", ent: "Illimité" },
    { feature: "API access", pro: "Limité", ent: "Complet" },
  ];

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-foreground mb-2">Abonnement & facturation</h2>
      <p className="font-body text-sm text-muted-foreground mb-8">
        Gérez votre plan, consultez vos factures et mettez à jour vos informations de paiement.
      </p>

      {/* PLAN ACTUEL */}
      <div className="bg-card border-[1.5px] border-[hsl(var(--fuchsia))] rounded-[20px] p-8 mb-6">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground/60 mb-3">PLAN ACTUEL</p>
            <h3 className="font-display font-extrabold text-[32px] text-gradient mb-1">Pro</h3>
            <p className="font-body text-lg text-foreground">79€ / mois · renouvelé le 18 avril 2026</p>
            <div className="mt-4 space-y-1.5">
              {["Réunions illimitées", "Tous les canaux (WhatsApp, Telegram, Email)", "OpenClaw inclus", "RAG entreprise 50 docs", "10 scénarios N8N", "Charte graphique emails"].map(f => (
                <div key={f} className="flex items-center gap-2 font-body text-[13px] text-muted-foreground">
                  <span className="text-[hsl(var(--success))]">✓</span> {f}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-secondary rounded-xl p-5 min-w-[220px]">
            <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-3">Usage ce mois-ci</p>
            {[
              { val: "24", label: "réunions traitées", color: "text-[hsl(var(--fuchsia))]", max: "/ illimitées" },
              { val: "12", label: "docs RAG", color: "text-[hsl(var(--violet-l))]", max: "/ 50" },
              { val: "4", label: "scénarios actifs", color: "text-[hsl(var(--success))]", max: "/ 10" },
              { val: "38 Mo", label: "stockage", color: "text-foreground", max: "/ 500 Mo" },
            ].map(s => (
              <div key={s.label} className="flex items-baseline gap-2 mb-2">
                <span className={`font-display font-extrabold text-2xl ${s.color}`}>{s.val}</span>
                <span className="font-body text-xs text-muted-foreground">{s.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground/40 ml-auto">{s.max}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="font-display font-bold text-sm text-white bg-gradient-primary px-5 py-2.5 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform">
            Passer au plan Entreprise
          </button>
          <button className="font-body text-sm text-muted-foreground bg-secondary border border-[hsl(var(--dark-5))] px-5 py-2.5 rounded-lg hover:text-foreground transition-colors">
            Gérer l'abonnement
          </button>
        </div>
      </div>

      {/* COMPARAISON */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-5">Évoluer vers Entreprise ?</h3>
        <div className="bg-secondary rounded-[10px] overflow-hidden">
          <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-[hsl(var(--dark-4))]">
            <span className="font-mono text-[10px] uppercase text-muted-foreground/60 tracking-wide">Fonctionnalité</span>
            <span className="font-mono text-[10px] uppercase text-muted-foreground/60 tracking-wide flex items-center gap-2">
              PRO · 79€/mois
              <span className="bg-fuchsia-d text-[hsl(var(--fuchsia-l))] font-mono text-[9px] px-1.5 py-0.5 rounded-full">Votre plan</span>
            </span>
            <span className="font-mono text-[10px] uppercase text-muted-foreground/60 tracking-wide">ENTREPRISE · Sur devis</span>
          </div>
          {comparison.map((r, i) => (
            <div key={r.feature} className={`grid grid-cols-3 gap-2 px-4 py-3 border-b border-[hsl(var(--dark-4))] last:border-0 ${i % 2 === 0 ? "" : "bg-[hsl(var(--dark-3))]/30"}`}>
              <span className="font-body text-[13px] text-foreground">{r.feature}</span>
              <span className="font-body text-[13px] text-muted-foreground">{r.pro}</span>
              <span className="font-body text-[13px] text-[hsl(var(--success))]">{r.ent}</span>
            </div>
          ))}
        </div>
        <button className="font-display font-bold text-sm text-white bg-gradient-primary px-5 py-3.5 rounded-[10px] shadow-fuchsia w-full mt-5 hover:-translate-y-0.5 transition-transform">
          Contacter l'équipe pour un devis →
        </button>
      </div>

      {/* PAIEMENT */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-6">
        <h3 className="font-display font-bold text-base text-foreground mb-5">Moyen de paiement</h3>
        <div className="bg-secondary border border-[hsl(var(--dark-5))] rounded-xl p-5 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <p className="font-body text-sm text-foreground">Visa ●●●● ●●●● ●●●● 4242</p>
              <p className="font-mono text-xs text-muted-foreground/60">Expire 09/2027</p>
            </div>
          </div>
          <button className="bg-[hsl(var(--dark-4))] border border-[hsl(var(--dark-5))] text-muted-foreground font-body text-[13px] px-3.5 py-1.5 rounded-lg hover:text-foreground transition-colors">Modifier</button>
        </div>
        <h4 className="font-display font-bold text-sm text-foreground mb-4">Informations de facturation</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { label: "NOM SUR LA FACTURE", value: "BraindCode / CO CUISINAGE" },
            { label: "SIRET", value: "910 767 193 00XXX" },
            { label: "ADRESSE", value: "Aubervilliers, Île-de-France, France" },
            { label: "EMAIL DE FACTURATION", value: "compta@braindcode.com" },
          ].map(f => (
            <div key={f.label}>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{f.label}</label>
              <input defaultValue={f.value} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12)] outline-none transition-all" />
            </div>
          ))}
        </div>
        <button className="font-display font-bold text-sm text-white bg-gradient-primary px-5 py-2.5 rounded-lg shadow-fuchsia mt-5">Sauvegarder les infos de facturation</button>
      </div>

      {/* FACTURES */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-base text-foreground">Historique des factures</h3>
          <button className="text-[hsl(var(--fuchsia-l))] font-body text-[13px] hover:underline">Télécharger tout</button>
        </div>
        <div className="bg-secondary rounded-[10px] overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-[hsl(var(--dark-4))]">
            {["DATE", "MONTANT", "STATUT", "FACTURE"].map(h => (
              <span key={h} className="font-mono text-[10px] uppercase text-muted-foreground/60 tracking-wide">{h}</span>
            ))}
          </div>
          {invoices.map((inv, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-[hsl(var(--dark-4))] last:border-0 hover:bg-secondary/80 transition-colors">
              <span className="font-body text-[13px] text-foreground">{inv.date}</span>
              <span className="font-body text-[13px] text-foreground">{inv.amount}</span>
              <span className="font-mono text-[11px] text-[hsl(var(--success))]">✅ {inv.status}</span>
              <button className="font-body text-[13px] text-[hsl(var(--violet-l))] hover:underline text-left">Télécharger PDF</button>
            </div>
          ))}
        </div>
      </div>

      {/* ZONE DANGER */}
      <div className="bg-[rgba(239,68,68,0.04)] border border-destructive/30 rounded-2xl p-8">
        <h3 className="font-display font-bold text-base text-destructive mb-5">Zone de danger</h3>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-body text-sm text-foreground">Mettre l'abonnement en pause</p>
              <p className="font-body text-[13px] text-muted-foreground/60">Suspendre temporairement sans perdre vos données. Facturation suspendue.</p>
            </div>
            <button className="border border-[#F59E0B]/50 text-[#F59E0B] font-body text-[13px] px-4.5 py-2 rounded-lg hover:bg-[#F59E0B]/10 transition-colors shrink-0">Mettre en pause</button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-body text-sm text-foreground">Résilier l'abonnement</p>
              <p className="font-body text-[13px] text-muted-foreground/60">Votre accès sera maintenu jusqu'à la fin de la période en cours. Toutes vos données seront supprimées après 30 jours.</p>
            </div>
            <button onClick={() => setShowCancel(true)} className="border border-destructive/50 text-destructive font-body text-[13px] px-4.5 py-2 rounded-lg hover:bg-destructive/10 transition-colors shrink-0">Résilier</button>
          </div>
        </div>
      </div>

      {/* MODAL RÉSILIATION */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowCancel(false)}>
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
          <div onClick={e => e.stopPropagation()} className="relative bg-card border border-border rounded-[20px] p-9 max-w-[420px] w-full mx-4 animate-scale-in">
            <h3 className="font-display font-bold text-xl text-foreground mb-2">Êtes-vous sûr ?</h3>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Cette action est irréversible. Votre accès sera maintenu jusqu'au 18 avril 2026, puis toutes vos données seront supprimées après 30 jours.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCancel(false)} className="font-body text-sm text-muted-foreground px-4 py-2 hover:text-foreground transition-colors">Annuler</button>
              <button className="font-body text-sm text-white bg-destructive px-5 py-2 rounded-lg hover:bg-destructive/90 transition-colors">Confirmer la résiliation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabAbonnement;
