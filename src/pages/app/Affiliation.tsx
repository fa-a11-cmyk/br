import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAffiliate } from "@/hooks/useAffiliate";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function AffiliateSimulator() {
  const [referrals, setReferrals] = useState(10);
  const starterRevenue = Math.round(referrals * 0.3 * 9.90 * 0.20 * 100) / 100;
  const proRevenue = Math.round(referrals * 0.1 * 24.90 * 0.20 * 100) / 100;
  const total = Math.round((starterRevenue + proRevenue) * 100) / 100;

  return (
    <Card className="p-6 text-left mt-6">
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

function ClicksChart({ clicks }: { clicks: any[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    return {
      date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      clicks: clicks.filter(c => c.created_at?.startsWith(dateStr)).length,
      converted: clicks.filter(c => c.created_at?.startsWith(dateStr) && c.converted).length,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="clicks" fill="hsl(var(--primary))" name="Clics" radius={[4, 4, 0, 0]} />
        <Bar dataKey="converted" fill="#22c55e" name="Convertis" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PayoutRequest({ affiliate, stats, pendingCommissions }: any) {
  const pending = stats?.pending_payout_euros || 0;
  const [method, setMethod] = useState("bank_transfer");
  const [details, setDetails] = useState({ iban: "", paypal_email: "" });
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const minPayout = 50;

  const requestPayout = async () => {
    setRequesting(true);
    await supabase.from("app_logs").insert({
      level: "info",
      source: "affiliate-payout-request",
      message: `Demande de paiement affilié : ${pending}€ (code: ${affiliate.code})`,
      metadata: { affiliate_id: affiliate.id, amount: pending, method, details },
    });
    setSuccess(true);
    setRequesting(false);
    toast({ title: "Demande envoyée ✓", description: "Nous traiterons votre paiement sous 5 jours ouvrés." });
  };

  return (
    <Card className="p-6 max-w-md">
      <h3 className="font-semibold mb-4">💳 Demander un virement</h3>
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-sm text-muted-foreground">Solde disponible</p>
          <p className="text-3xl font-bold text-primary mt-1">{pending}€</p>
          {pending < minPayout && <p className="text-xs text-muted-foreground mt-2">Minimum {minPayout}€ requis. Il vous manque {minPayout - pending}€.</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Méthode de paiement</label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">🏦 Virement bancaire (IBAN)</SelectItem>
              <SelectItem value="paypal">💙 PayPal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {method === "bank_transfer" ? (
          <div>
            <label className="text-sm font-medium">IBAN</label>
            <Input value={details.iban} onChange={e => setDetails(p => ({ ...p, iban: e.target.value }))} placeholder="FR76 XXXX XXXX..." className="mt-1 font-mono" />
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium">Email PayPal</label>
            <Input type="email" value={details.paypal_email} onChange={e => setDetails(p => ({ ...p, paypal_email: e.target.value }))} placeholder="votre@paypal.com" className="mt-1" />
          </div>
        )}
        {success ? (
          <div className="p-4 rounded-xl bg-green-500/10 text-green-700 text-center text-sm">✅ Demande envoyée ! Traitement sous 5 jours ouvrés.</div>
        ) : (
          <Button className="w-full" disabled={pending < minPayout || requesting || (!details.iban && !details.paypal_email)} onClick={requestPayout}>
            {requesting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Demander le virement de {pending}€
          </Button>
        )}
        <p className="text-xs text-muted-foreground">Les virements sont traités sous 5 jours ouvrés. Minimum : {minPayout}€.</p>
      </div>
    </Card>
  );
}

export default function Affiliation() {
  const { affiliate, stats, clicks, referrals, commissions, loading, applyAsAffiliate, copyLink, copyCode } = useAffiliate();
  const [applying, setApplying] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!affiliate) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-6">🤝</div>
        <h1 className="text-3xl font-bold mb-4">Programme d'affiliation RapidoMeet</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Gagnez <strong className="text-primary">20% de commission récurrente</strong> sur chaque abonnement de vos filleuls.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-left">
          {[
            { icon: "💰", title: "20% récurrent", desc: "Commission sur chaque mois d'abonnement actif" },
            { icon: "📊", title: "Tableau de bord", desc: "Suivez vos clics, filleuls et commissions en temps réel" },
            { icon: "💳", title: "Paiement mensuel", desc: "Virement bancaire ou PayPal chaque mois" },
          ].map(a => (
            <Card key={a.title} className="p-4">
              <div className="text-3xl mb-2">{a.icon}</div>
              <h3 className="font-semibold mb-1">{a.title}</h3>
              <p className="text-sm text-muted-foreground">{a.desc}</p>
            </Card>
          ))}
        </div>
        <AffiliateSimulator />
        <Button size="lg" className="mt-8 w-full md:w-auto" disabled={applying} onClick={async () => { setApplying(true); await applyAsAffiliate(); setApplying(false); }}>
          {applying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "🚀"} Rejoindre le programme gratuitement
        </Button>
        <p className="text-xs text-muted-foreground mt-3">Approbation instantanée. Aucun frais. Aucun engagement.</p>
      </div>
    );
  }

  const affiliateLink = `https://rapidomeet.io?ref=${affiliate.code}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mon espace affilié</h1>
          <p className="text-muted-foreground text-sm">Programme RapidoMeet · {affiliate.commission_rate}% commission récurrente</p>
        </div>
        <Badge className={affiliate.status === "active" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}>
          {affiliate.status === "active" ? "✅ Actif" : "⚠️ Suspendu"}
        </Badge>
      </div>

      <Card className="p-4 border-primary/30 bg-primary/5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">🔗 Votre lien de parrainage</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="flex-1 bg-background rounded-lg px-3 py-2 text-sm border border-border/30 truncate">{affiliateLink}</code>
          <Button size="sm" onClick={copyLink}>📋 Copier le lien</Button>
          <Button size="sm" variant="outline" onClick={copyCode}>Copier le code : {affiliate.code}</Button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[
            { label: "LinkedIn", icon: "💼", url: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(affiliateLink)}` },
            { label: "Twitter/X", icon: "𝕏", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent("Je recommande RapidoMeet pour transformer vos réunions en actions.")}&url=${encodeURIComponent(affiliateLink)}` },
            { label: "WhatsApp", icon: "📱", url: `https://wa.me/?text=${encodeURIComponent("Je recommande RapidoMeet : " + affiliateLink)}` },
            { label: "Email", icon: "📧", url: `mailto:?subject=${encodeURIComponent("Je te recommande RapidoMeet")}&body=${encodeURIComponent("Essaie RapidoMeet : " + affiliateLink)}` },
          ].map(s => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors">
              {s.icon} {s.label}
            </a>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Clics", value: stats?.total_clicks || 0, icon: "👆", sub: `${stats?.click_to_signup_rate || 0}% → inscrits` },
          { label: "Filleuls inscrits", value: stats?.total_referrals || 0, icon: "👥", sub: `${stats?.signup_to_paid_rate || 0}% → payants` },
          { label: "Conversions payantes", value: stats?.total_conversions || 0, icon: "💳", color: "text-green-500" },
          { label: "Commissions totales", value: `${stats?.total_earned_euros || 0}€`, icon: "💰", sub: `${stats?.pending_payout_euros || 0}€ en attente`, color: "text-primary font-bold" },
        ].map(kpi => (
          <Card key={kpi.label} className="p-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <span className="text-lg">{kpi.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${kpi.color || ""}`}>{kpi.value}</div>
            {kpi.sub && <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>}
          </Card>
        ))}
      </div>

      <Tabs defaultValue="referrals">
        <TabsList>
          <TabsTrigger value="referrals">👥 Filleuls ({referrals.length})</TabsTrigger>
          <TabsTrigger value="commissions">💰 Commissions ({commissions.length})</TabsTrigger>
          <TabsTrigger value="clicks">👆 Clics ({clicks.length})</TabsTrigger>
          <TabsTrigger value="payout">💳 Paiement</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/30">
                  <tr>{["Email", "Statut", "Plan", "Date inscription"].map(h => <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {referrals.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Aucun filleul. Partagez votre lien !</td></tr>
                  ) : referrals.map(r => (
                    <tr key={r.id} className="border-b border-border/30">
                      <td className="px-4 py-3">{r.referred_email}</td>
                      <td className="px-4 py-3">
                        <Badge className={r.status === "converted" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}>
                          {r.status === "converted" ? "💳 Payant" : "👤 Inscrit"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.plan || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/30">
                  <tr>{["Montant", "Plan", "Taux", "Statut", "Date"].map(h => <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {commissions.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Aucune commission. Convertissez vos filleuls !</td></tr>
                  ) : commissions.map(c => (
                    <tr key={c.id} className="border-b border-border/30">
                      <td className="px-4 py-3 font-bold text-green-600">+{c.amount_euros}€</td>
                      <td className="px-4 py-3">{c.plan}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.commission_rate}%</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={c.status === "paid" ? "text-green-600" : c.status === "approved" ? "text-blue-600" : ""}>
                          {c.status === "paid" ? "✅ Payée" : c.status === "approved" ? "✓ Approuvée" : "⏳ En attente"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="clicks">
          <Card className="p-4">
            {clicks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun clic. Partagez votre lien !</p>
            ) : (
              <>
                <ClicksChart clicks={clicks} />
                <div className="mt-4 space-y-1">
                  {clicks.slice(0, 10).map(c => (
                    <div key={c.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/20">
                      <span className="text-muted-foreground truncate max-w-[200px]">{c.referer_url || "Direct"}</span>
                      <div className="flex items-center gap-2">
                        {c.converted && <Badge className="text-xs bg-green-500/10 text-green-600">✓ Converti</Badge>}
                        <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="payout">
          <PayoutRequest affiliate={affiliate} stats={stats} pendingCommissions={commissions.filter(c => c.status === "pending" || c.status === "approved")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
