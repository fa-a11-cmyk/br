import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function AffiliateSimulator() {
  const [referrals, setReferrals] = useState(10);
  const starterRevenue = Math.round(referrals * 0.3 * 9.90 * 0.20 * 100) / 100;
  const proRevenue = Math.round(referrals * 0.1 * 24.90 * 0.20 * 100) / 100;
  const total = Math.round((starterRevenue + proRevenue) * 100) / 100;

  return (
    <Card className="p-6 text-left">
      <h3 className="font-semibold mb-4">💡 Simulez vos revenus</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground">
            Filleuls inscrits par mois : <strong className="text-foreground ml-2">{referrals}</strong>
          </label>
          <input type="range" min="1" max="100" value={referrals} onChange={e => setReferrals(Number(e.target.value))} className="w-full mt-2" />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-primary">{starterRevenue}€</div>
            <div className="text-xs text-muted-foreground">Starter (30%)</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-500">{proRevenue}€</div>
            <div className="text-xs text-muted-foreground">Pro (10%)</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{total}€</div>
            <div className="text-xs text-muted-foreground">Total/mois</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">* Estimation basée sur 30% Starter, 10% Pro, 20% de commission récurrente.</p>
      </div>
    </Card>
  );
}

export default function AffiliationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-primary/10 to-background py-20 px-4 text-center">
        <Badge className="mb-4">Programme d'affiliation</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Gagnez <span className="text-primary">20% de commission</span><br />sur chaque abonnement
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Recommandez RapidoMeet à votre réseau et touchez une commission récurrente tant que vos filleuls restent abonnés.
        </p>
        <Button size="lg" onClick={() => navigate("/connexion?redirect=/app/affiliation")}>Devenir affilié gratuitement →</Button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "1", icon: "🔗", title: "Obtenez votre lien", desc: "Créez votre compte et recevez votre lien personnalisé en 30 secondes." },
            { step: "2", icon: "📢", title: "Partagez", desc: "Partagez sur LinkedIn, WhatsApp, email ou votre blog." },
            { step: "3", icon: "👥", title: "Vos filleuls s'inscrivent", desc: "Ils essaient RapidoMeet gratuitement (3 réunions offertes)." },
            { step: "4", icon: "💰", title: "Vous gagnez", desc: "20% de commission récurrente sur chaque abonnement payant." },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">{s.step}</div>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Simulez vos revenus</h2>
        <AffiliateSimulator />
        <div className="text-center mt-8">
          <Button size="lg" onClick={() => navigate("/connexion?redirect=/app/affiliation")}>Commencer à gagner →</Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
        <div className="space-y-3">
          {[
            { q: "Quand suis-je payé ?", a: "Les virements sont traités chaque mois sous 5 jours ouvrés. Minimum 50€ requis." },
            { q: "Combien de temps dure la commission ?", a: "Tant que votre filleul reste abonné. Si il passe de Starter à Pro, votre commission augmente." },
            { q: "Y a-t-il une limite de filleuls ?", a: "Aucune limite. Plus vous parrainez, plus vous gagnez." },
            { q: "Comment suivre mes performances ?", a: "Votre tableau de bord affilié affiche clics, inscriptions, conversions et commissions en temps réel." },
          ].map(faq => (
            <details key={faq.q} className="border border-border/30 rounded-xl p-4">
              <summary className="cursor-pointer font-medium">{faq.q}</summary>
              <p className="text-sm text-muted-foreground mt-3">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
