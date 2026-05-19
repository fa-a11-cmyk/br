import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Shield, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Progress } from "@/components/ui/progress";

const PLANS = {
  starter: {
    name: "Starter", price: "29€",
    priceId: "price_1TDhL5BU9PSiI302ZIzyDpQO", productId: "prod_UC5WUQ2MB150B4",
    features: ["5 réunions / mois", "2 canaux (Email, WhatsApp)", "Rapports basiques", "1 scénario N8N", "Support communautaire"],
  },
  pro: {
    name: "Pro", price: "79€",
    priceId: "price_1TDhL6BU9PSiI302nfNRh5iJ", productId: "prod_UC5WYesjWFnkE9",
    features: ["Réunions illimitées", "Tous les canaux (WhatsApp, Telegram, Email)", "OpenClaw inclus", "RAG entreprise (50 docs)", "10 scénarios N8N", "Charte graphique emails", "Support en français"],
  },
};

const Billing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation("app");
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: t("billing.subscriptionActivated"), description: t("billing.welcome") });
    }
  }, [searchParams]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription(data);
    } catch { setSubscription({ subscribed: false }); }
    setLoading(false);
  };

  useEffect(() => { checkSubscription(); }, []);

  const handleCheckout = async (priceId: string) => {
    setCheckingOut(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { priceId } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) { toast({ title: t("newMeeting.error"), description: e.message, variant: "destructive" }); }
    setCheckingOut(null);
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) { toast({ title: t("newMeeting.error"), description: e.message, variant: "destructive" }); }
  };

  const currentPlan = subscription?.subscribed ? Object.entries(PLANS).find(([, p]) => p.productId === subscription.product_id)?.[0] : null;
  const { quota, limits } = usePlanLimits();

  const usageBars = [
    {
      label: t("billing.meetingsThisMonth"),
      value: quota ? (quota.limit ? Math.round((quota.used / quota.limit) * 100) : 10) : 0,
      max: quota?.limit || Infinity,
      display: quota ? (quota.limit ? `${quota.used} / ${quota.limit}` : `${quota.used} / ∞`) : "…",
    },
    {
      label: t("billing.ragStorage"),
      value: limits ? Math.round((limits.storage_gb || 0) / 10 * 100) : 0,
      max: 100,
      display: limits ? `${limits.storage_gb || 0} Go / 10 Go` : "… / …",
    },
    {
      label: t("billing.workspaceMembers"),
      value: 20,
      max: 100,
      display: quota ? `${Math.min(quota.used, 5)} / 5` : "… / …",
    },
  ];

  return (
    <div className="p-3 sm:p-6 md:p-10 max-w-[1000px]">
      <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[2px] text-muted-foreground/60 mb-3 sm:mb-4">{t("billing.breadcrumb")}</p>
      <h1 className="font-display font-extrabold text-xl sm:text-[28px] md:text-[32px] tracking-tight text-foreground mb-6 sm:mb-8">{t("billing.title")}</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {subscription?.subscribed && (
            <Card className="border-primary/30 mb-6 sm:mb-8">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-extrabold text-lg sm:text-xl text-foreground">
                      Plan {PLANS[currentPlan as keyof typeof PLANS]?.name || ""} · {PLANS[currentPlan as keyof typeof PLANS]?.price || ""}{t("billing.perMonth")}
                    </p>
                    <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-0">{t("billing.active")}</Badge>
                  </div>
                  {subscription.subscription_end && (
                    <p className="font-body text-xs sm:text-sm text-muted-foreground mt-1">
                      {t("billing.nextRenewal", { date: new Date(subscription.subscription_end).toLocaleDateString() })}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={handleManage}>
                  <ExternalLink className="h-3 w-3 mr-1" /> {t("billing.manageSubscription")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quota warning */}
          {quota && quota.limit && quota.remaining === 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-bold text-sm text-foreground">Quota épuisé</p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Vous avez utilisé {quota.used}/{quota.limit} réunions ce mois. Passez à Starter ou Pro pour continuer.
                </p>
              </div>
            </div>
          )}

          {!subscription?.subscribed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(PLANS).map(([key, plan]) => (
                <Card key={key} className={`border-border/30 ${key === "pro" ? "border-primary/50 ring-1 ring-primary/20" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                      {key === "pro" && <Badge className="bg-gradient-primary text-white border-0">{t("billing.popular")}</Badge>}
                    </div>
                    <p className="font-display font-extrabold text-3xl text-foreground mb-1">{plan.price}<span className="text-base font-normal text-muted-foreground"> {t("billing.perMonth")}</span></p>
                    <div className="space-y-2 my-5">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[hsl(var(--success))] shrink-0" /><span className="font-body text-xs text-muted-foreground">{f}</span></div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border/20 mb-4">
                      <Shield className="h-4 w-4 text-[hsl(var(--success))]" />
                      <span className="font-body text-xs text-muted-foreground">{t("billing.trialNote")}</span>
                    </div>
                    <Button className={`w-full ${key === "pro" ? "bg-gradient-primary text-white shadow-fuchsia" : ""}`} variant={key === "pro" ? "default" : "outline"}
                      onClick={() => handleCheckout(plan.priceId)} disabled={checkingOut === plan.priceId}>
                      {checkingOut === plan.priceId && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <CreditCard className="h-4 w-4 mr-2" /> {t("billing.startTrial")}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="border-border/30 mb-6">
            <CardContent className="p-4 sm:p-6 space-y-3">
              <p className="font-display font-bold text-sm text-foreground mb-2">{t("billing.billableUsage")}</p>
              {usageBars.map(u => (
                <div key={u.label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-[11px] sm:text-xs text-muted-foreground">{u.label}</span>
                    <span className="font-mono text-[11px] sm:text-xs text-foreground">{u.display}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gradient-primary" style={{ width: `${Math.min(u.value, 100)}%` }} /></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="text-xs" onClick={checkSubscription}>{t("billing.refreshStatus")}</Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/app/export-comptable")}>{t("billing.accountingExport")}</Button>
          </div>
        </>
      )}
    </div>
  );
};

export { };
export default Billing;
