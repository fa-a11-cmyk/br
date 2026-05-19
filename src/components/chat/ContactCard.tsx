import { useTranslation } from "react-i18next";
import { useContactSettings } from "@/hooks/useContactSettings";

export function ContactCard() {
  const { t } = useTranslation("app");
  const { calendly_url, whatsapp_number, contact_name, contact_role } = useContactSettings();

  const initial = contact_name?.charAt(0)?.toUpperCase() || "M";

  return (
    <div className="rounded-xl overflow-hidden mt-2 border border-border">
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia) / 0.15), hsl(var(--violet) / 0.15))" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
          style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))" }}>{initial}</div>
        <div>
          <p className="font-display text-sm font-bold text-foreground">{contact_name}</p>
          <p className="font-body text-[11px] text-muted-foreground">{contact_role}</p>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2 bg-secondary">
        <a href={`https://wa.me/${whatsapp_number.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-lg bg-rm-success hover:opacity-90 transition-opacity">
          <span className="text-lg">💬</span>
          <div>
            <p className="font-body text-xs font-semibold text-white">{t("chat.contactWhatsapp")}</p>
            <p className="font-body text-[10px] text-white/70">{whatsapp_number}</p>
          </div>
        </a>
        <a href={calendly_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-lg bg-card hover:bg-accent/10 transition-colors">
          <span className="text-lg">📅</span>
          <div>
            <p className="font-body text-xs font-semibold text-foreground">{t("chat.contactBookDemo")}</p>
            <p className="font-body text-[10px] text-muted-foreground">{t("chat.contactBookDemoSub")}</p>
          </div>
        </a>
        <p className="font-body text-[10px] text-muted-foreground px-1 pt-1">
          {t("chat.contactNote")}
        </p>
      </div>
    </div>
  );
}
