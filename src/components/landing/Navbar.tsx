import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { t } = useTranslation("common");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const productLinks = [
    { label: t("nav.howItWorks"), href: "#comment-ca-marche" },
    { label: t("nav.features"), href: "/fonctionnalites", isRoute: true },
    { label: t("nav.integrations"), href: "#integrations" },
    { label: t("nav.useCases"), href: "/cas-d-usage", isRoute: true },
    { label: t("nav.security"), href: "/securite", isRoute: true },
  ];

  const resourceLinks = [
    { label: t("nav.docs"), href: "/docs", isRoute: true },
    { label: t("nav.tutorials"), href: "/tutoriels", isRoute: true },
    { label: t("nav.blog"), href: "/blog", isRoute: true },
    { label: t("nav.faq"), href: "/faq", isRoute: true },
    { label: t("nav.changelog"), href: "/changelog", isRoute: true },
    { label: t("nav.developers"), href: "/developers", isRoute: true },
    { label: t("nav.about"), href: "/a-propos", isRoute: true },
    { label: t("nav.requestDemo"), href: "/demo", isRoute: true },
  ];

  const renderLink = (l: { label: string; href: string; isRoute?: boolean }, onClick?: () => void) =>
    l.isRoute ? (
      <Link key={l.href} to={l.href} onClick={onClick} className="block text-sm font-body font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-md transition-colors">
        {l.label}
      </Link>
    ) : (
      <a key={l.href} href={l.href} onClick={onClick} className="block text-sm font-body font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-md transition-colors">
        {l.label}
      </a>
    );

  const LogoIcon = () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E91E8C" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="url(#navGrad)" />
      <circle cx="18" cy="18" r="6" fill="white" opacity="0.9" />
      <circle cx="18" cy="18" r="3" fill="url(#navGrad)" />
      <path d="M8 18 Q8 12 13 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M8 18 Q8 24 13 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M28 18 Q28 12 23 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M28 18 Q28 24 23 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
    </svg>
  );

  const DropdownMenu = ({ label, items }: { label: string; items: typeof productLinks }) => (
    <div className="relative group">
      <button className="flex items-center gap-1 text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors">
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
      </button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="bg-popover border border-border rounded-xl shadow-lg p-2 min-w-[200px]">
          {items.map((l) => renderLink(l))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center justify-between px-5 md:px-[60px] transition-all duration-300 ${scrolled ? "shadow-lg" : ""} bg-background/90 backdrop-blur-[20px] border-b border-border/30`}
      >
        <Link to="/" className="flex items-center gap-2">
          <LogoIcon />
          <span className="font-display font-extrabold text-base sm:text-lg">
            <span className="text-gradient">Rapido</span>
            <span className="text-foreground">Meet</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <DropdownMenu label={t("nav.product")} items={productLinks} />
          <DropdownMenu label={t("nav.resources")} items={resourceLinks} />
          <Link to="/openclaw" className="text-sm font-body font-medium text-[hsl(var(--violet-l))] hover:text-foreground transition-colors">
            {t("nav.openClaw")}
          </Link>
          <a href="#tarifs" className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("nav.pricing")}
          </a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher compact />
          <ThemeToggle size="md" />
          <Link to="/connexion" className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("nav.login")}
          </Link>
          <Link to="/inscription" className="bg-gradient-primary text-white font-semibold text-sm py-[9px] px-[22px] rounded-lg hover:-translate-y-0.5 transition-transform shadow-fuchsia">
            {t("nav.tryFree")}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-1.5">
          <LanguageSwitcher compact />
          <ThemeToggle size="sm" />
          <button className="text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="absolute top-[68px] left-0 right-0 bg-card border-b border-border p-4 md:hidden flex flex-col gap-1 max-h-[calc(100vh-68px)] overflow-y-auto z-50">
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground/70 py-2 px-1 cursor-pointer">
                {t("nav.product")}
                <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {productLinks.map((l) => renderLink(l, () => setMobileOpen(false)))}
              </CollapsibleContent>
            </Collapsible>

            <div className="h-[1px] bg-border my-1" />

            <Collapsible className="group/collapsible">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground/70 py-2 px-1 cursor-pointer">
                {t("nav.resources")}
                <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {resourceLinks.map((l) => renderLink(l, () => setMobileOpen(false)))}
              </CollapsibleContent>
            </Collapsible>

            <div className="h-[1px] bg-border my-1" />

            <Link to="/openclaw" className="text-sm font-body font-medium text-[hsl(var(--violet-l))] py-2 px-3 rounded-lg hover:bg-accent transition-colors" onClick={() => setMobileOpen(false)}>
              {t("nav.openClaw")}
            </Link>
            <a href="#tarifs" className="text-sm font-body font-medium text-muted-foreground py-2 px-3 rounded-lg hover:bg-accent hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>
              {t("nav.pricing")}
            </a>

            <div className="h-[1px] bg-border my-3" />
            <div className="flex flex-col gap-2.5">
              <Link to="/connexion" className="text-sm font-body font-semibold text-foreground text-center py-3 px-5 rounded-[10px] border border-border hover:border-primary transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.login")}
              </Link>
              <Link to="/inscription" className="bg-gradient-primary text-white font-display font-bold text-sm py-3 px-5 rounded-[10px] text-center shadow-fuchsia" onClick={() => setMobileOpen(false)}>
                {t("nav.tryFree")}
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div
        className="fixed top-[68px] left-0 h-[2px] z-[99] bg-gradient-primary transition-[width] duration-100"
        style={{ width: `${scrollProgress}%` }}
      />
    </>
  );
};

export default Navbar;
