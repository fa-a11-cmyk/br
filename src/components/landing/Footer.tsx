import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";

const LogoIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E91E8C" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    <rect width="36" height="36" rx="9" fill="url(#footerGrad)" />
    <circle cx="18" cy="18" r="6" fill="white" opacity="0.9" />
    <circle cx="18" cy="18" r="3" fill="url(#footerGrad)" />
    <path d="M8 18 Q8 12 13 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
    <path d="M8 18 Q8 24 13 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
    <path d="M28 18 Q28 12 23 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
    <path d="M28 18 Q28 24 23 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
  </svg>
);

const Footer = () => {
  const { t } = useTranslation("common");

  const cols = [
    {
      title: t("footer.product"),
      links: [
        { label: t("nav.howItWorks"), href: "#comment-ca-marche" },
        { label: t("nav.features"), href: "/fonctionnalites" },
        { label: t("nav.useCases"), href: "/cas-d-usage" },
        { label: t("nav.integrations"), href: "/integrations" },
        { label: t("nav.openClaw"), href: "/openclaw" },
        { label: t("nav.pricing"), href: "/tarifs" },
        { label: t("nav.security"), href: "/securite" },
      ],
    },
    {
      title: t("footer.resources"),
      links: [
        { label: t("footer.apiDocs"), href: "/docs" },
        { label: t("nav.tutorials"), href: "/tutoriels" },
        { label: t("nav.faq"), href: "/faq" },
        { label: t("nav.blog"), href: "/blog" },
        { label: t("nav.changelog"), href: "/changelog" },
        { label: t("nav.developers"), href: "/developers" },
        { label: t("nav.requestDemo"), href: "/demo" },
        { label: "vs Otter.ai", href: "/vs/otter-ai" },
      ],
    },
    {
      title: t("footer.suite"),
      links: [
        { label: "RapidoCRM", href: "https://rapidosoftware.com/solutions/crm", ext: true },
        { label: "RapidoCMS", href: "https://rapidosoftware.com/solutions/cms", ext: true },
        { label: "RapidoRH", href: "https://rapidosoftware.com/solutions/rh", ext: true },
        { label: "OpenClaw", href: "https://openclaw.ai", ext: true },
        { label: "StartupForge", href: "https://startupforge.fr", ext: true },
      ],
    },
    {
      title: t("footer.braindcode"),
      links: [
        { label: t("nav.about"), href: "/a-propos" },
        { label: "BraindCode.com", href: "https://braindcode.com", ext: true },
        { label: "FoodEatUp", href: "https://foodeatup.com", ext: true },
        { label: "Contact", href: "mailto:hello@braindcode.com", ext: true },
        { label: t("footer.privacyPolicy"), href: "#" },
        { label: "Admin", href: "/admin" },
      ],
    },
  ];

  return (
    <footer className="bg-card px-5 md:px-[60px] pt-[60px] pb-10 border-t border-border">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 md:gap-[40px] mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <LogoIcon />
              <span className="font-display font-extrabold text-lg">
                <span className="text-gradient">Rapido</span>
                <span className="text-foreground">Meet</span>
              </span>
            </div>
            <p className="font-body text-[13px] text-muted-foreground leading-relaxed max-w-xs mb-4">
              {t("footer.description")}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground mb-4">
              {t("footer.madeBy")} <span className="text-primary font-medium">BraindCode</span>
            </p>
            <ThemeToggle size="sm" showLabel />
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <p className="font-display font-bold text-sm text-foreground mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"ext" in link && link.ext ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-body text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                        {link.label} ↗
                      </a>
                    ) : link.href.startsWith("/") ? (
                      <Link to={link.href} className="font-body text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="font-body text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="h-[1px] mb-6"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(233,30,140,0.3) 30%, rgba(124,58,237,0.3) 70%, transparent 100%)" }}
        />

        <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-[12px] text-muted-foreground">
          <span>{t("footer.rights")}</span>
          <span>
            {t("footer.solution")} <span className="text-primary">RapidoSoftware</span> · {t("footer.location")}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
