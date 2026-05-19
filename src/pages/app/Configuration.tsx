import { useState } from "react";
import { Palette, Brain, Zap, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TabCharte from "@/components/config/TabCharte";
import TabAgentIA from "@/components/config/TabAgentIA";
import TabOpenClaw from "@/components/config/TabOpenClaw";
import TabGlossaire from "@/components/config/TabGlossaire";
import { useTranslation } from "react-i18next";

const Configuration = () => {
  const { t } = useTranslation("app");
  const [activeTab, setActiveTab] = useState("charte");
  const navigate = useNavigate();

  const tabs = [
    { id: "charte", label: t("config.tabCharteShort"), fullLabel: t("config.tabCharte"), icon: Palette, emoji: "🎨" },
    { id: "agent", label: t("config.tabAgent"), fullLabel: t("config.tabAgent"), icon: Brain, emoji: "🧠" },
    { id: "glossaire", label: t("config.tabGlossaireShort"), fullLabel: t("config.tabGlossaire"), icon: BookOpen, emoji: "📖" },
    { id: "openclaw", label: t("config.tabOpenClaw"), fullLabel: t("config.tabOpenClaw"), icon: Zap, emoji: "⚡" },
  ];

  const quickLinks = [
    { label: t("config.integrations"), desc: t("config.integrationsDesc"), url: "/app/integrations", emoji: "🔌" },
    { label: t("config.billing"), desc: t("config.billingDesc"), url: "/app/billing", emoji: "💳" },
    { label: t("config.emailBuilder"), desc: t("config.emailBuilderDesc"), url: "/app/email-builder", emoji: "✉️" },
    { label: t("config.pdfBuilder"), desc: t("config.pdfBuilderDesc"), url: "/app/pdf-builder", emoji: "📄" },
    { label: t("config.apiKeys"), desc: t("config.apiKeysDesc"), url: "/app/api-keys", emoji: "🔑" },
    { label: t("config.exportComptable"), desc: t("config.exportComptableDesc"), url: "/app/export-comptable", emoji: "📊" },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10 max-w-[1200px]">
      <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[2px] text-muted-foreground/60 mb-3 sm:mb-4">{t("config.breadcrumb")}</p>
      <h1 className="font-display font-extrabold text-xl sm:text-[28px] md:text-[32px] tracking-tight text-foreground mb-1 sm:mb-2">{t("config.title")}</h1>
      <p className="font-body text-xs sm:text-[15px] text-muted-foreground mb-5 sm:mb-8">{t("config.subtitle")}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-10">
        {quickLinks.map(link => (
          <button key={link.url} onClick={() => navigate(link.url)}
            className="bg-card border border-border/50 rounded-xl p-3 sm:p-4 text-left hover:border-primary/30 hover:bg-muted/20 transition-all group">
            <div className="flex items-center gap-1.5 sm:gap-2.5 mb-0.5 sm:mb-1">
              <span className="text-base sm:text-lg">{link.emoji}</span>
              <span className="font-display font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate">{link.label}</span>
            </div>
            <p className="font-body text-[10px] sm:text-xs text-muted-foreground pl-[26px] sm:pl-[30px] truncate">{link.desc}</p>
          </button>
        ))}
      </div>

      <div className="border-b border-border mb-5 sm:mb-8 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-0 min-w-max">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 font-body text-xs sm:text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id ? "text-foreground border-primary" : "text-muted-foreground/60 border-transparent hover:text-muted-foreground"}`}>
              <span className="text-sm sm:text-base">{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.fullLabel}</span>
              <span className="sm:hidden">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in" key={activeTab}>
        {activeTab === "charte" && <TabCharte />}
        {activeTab === "agent" && <TabAgentIA />}
        {activeTab === "glossaire" && <TabGlossaire />}
        {activeTab === "openclaw" && <TabOpenClaw />}
      </div>
    </div>
  );
};

export default Configuration;
