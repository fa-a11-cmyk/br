import { useTranslation } from "react-i18next";

export function PricingCard() {
  const { t } = useTranslation("app");

  const plans = [
    { name: "Découverte", price: "49€", detail: "10 transcriptions · 4 N8N · 1 MCP", total: "~158-163€/mois", highlight: false },
    { name: "Medium", price: "99€", detail: "50 transcriptions · 8 N8N · 2 MCPs", total: "~213-223€/mois", highlight: true, badge: "⭐ Populaire" },
    { name: "Premium", price: "149€", detail: "Illimité + RapidoSoftware", total: "~268-278€/mois", highlight: false },
  ];

  return (
    <div className="rounded-xl overflow-hidden mt-2 bg-secondary border border-border">
      <p className="font-display text-xs font-bold text-foreground px-3 pt-3 pb-2">{t("chat.pricingTitle")}</p>
      <div className="flex flex-col gap-1.5 px-3 pb-2">
        {plans.map((plan, i) => (
          <div key={i} className={`rounded-lg px-3 py-2 relative bg-card ${plan.highlight ? "border border-primary" : "border border-transparent"}`}>
            {plan.badge && (
              <span className="absolute -top-2 right-2 font-mono text-[9px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                {plan.badge}
              </span>
            )}
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xs font-bold text-foreground">{plan.name}</span>
              <span className="font-display text-sm font-bold text-primary">{plan.price}<span className="text-[10px] text-muted-foreground">/mois</span></span>
            </div>
            <p className="font-body text-[10px] text-muted-foreground mt-0.5">{plan.detail}</p>
            <p className="font-mono text-[9px] text-muted-foreground/60 mt-1">+ 99€ OpenClaw · {plan.total}</p>
          </div>
        ))}
      </div>
      <a href="/tarifs" className="block text-center font-body text-[11px] py-2 text-primary-foreground transition-colors"
        style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))" }}>
        {t("chat.pricingSeeAll")}
      </a>
    </div>
  );
}
