import { useTranslation } from "react-i18next";

export function CTACard() {
  const { t } = useTranslation("app");
  const tags = t("chat.ctaTags", { returnObjects: true }) as string[];

  return (
    <div className="rounded-xl overflow-hidden mt-2 text-center border border-border"
      style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia) / 0.12), hsl(var(--violet) / 0.12))" }}>
      <div className="p-4">
        <p className="text-2xl mb-2">🎁</p>
        <p className="font-display text-sm font-bold text-foreground">{t("chat.ctaTitle")}</p>
        <p className="font-body text-[11px] text-muted-foreground mt-1">
          {t("chat.ctaSub")}<br />{t("chat.ctaSub2")}
        </p>
        <a href="/inscription"
          className="inline-block mt-3 px-5 py-2 rounded-lg font-display text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))" }}>
          {t("chat.ctaButton")}
        </a>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {(Array.isArray(tags) ? tags : []).map((tag, i) => (
            <span key={i} className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-rm-success/15 text-rm-success">{`✓ ${tag}`}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
