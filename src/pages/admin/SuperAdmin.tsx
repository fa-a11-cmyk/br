import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { BarChart3, Users, CreditCard, Mic, Webhook, Gauge, Mail, Settings, LogOut, Shield, Activity, Bug, Menu, TrendingUp, FileText, Download, UserCheck, Users2, MessageCircle, Lock, Zap, Send, GraduationCap, Plug } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const AdminOverview = lazy(() => import("./components/AdminOverview"));
const AdminUsers = lazy(() => import("./components/AdminUsers"));
const AdminMeetings = lazy(() => import("./components/AdminMeetings"));
const AdminSubscriptions = lazy(() => import("./components/AdminSubscriptions"));
const AdminWebhooks = lazy(() => import("./components/AdminWebhooks"));
const AdminRateLimits = lazy(() => import("./components/AdminRateLimits"));
const AdminTemplates = lazy(() => import("./components/AdminTemplates"));
const AdminConfig = lazy(() => import("./components/AdminConfig"));
const AdminMonitoring = lazy(() => import("./components/AdminMonitoring"));
const AdminDebug = lazy(() => import("./components/AdminDebug"));
const CEODashboard = lazy(() => import("./CEODashboard"));
const AdminBlog = lazy(() => import("./components/AdminBlog"));
const AdminLeadsMagnets = lazy(() => import("./components/AdminLeadsMagnets"));
const AdminLeadsCaptures = lazy(() => import("./components/AdminLeadsCaptures"));
const AdminAffiliates = lazy(() => import("./components/AdminAffiliates"));
const AdminSupport = lazy(() => import("./components/AdminSupport"));
const AdminSecurity = lazy(() => import("./components/AdminSecurity"));
const AdminSkills = lazy(() => import("./components/AdminSkills"));
const AdminEmailMarketing = lazy(() => import("./components/AdminEmailMarketing"));
const AdminTutorials = lazy(() => import("./components/AdminTutorials"));
const AdminIntegrations = lazy(() => import("./components/AdminIntegrations"));

const adminNav = [
  { group: "Gestion", items: [
    { id: "ceo", label: "CEO Dashboard", icon: TrendingUp },
    { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "subscriptions", label: "Abonnements", icon: CreditCard },
    { id: "meetings", label: "Réunions", icon: Mic },
  ]},
  { group: "Contenu", items: [
    { id: "blog", label: "Blog", icon: FileText },
    { id: "leads_magnets", label: "Leads Magnets", icon: Download },
    { id: "leads_captures", label: "Leads capturés", icon: UserCheck },
    { id: "affiliates", label: "Affiliés", icon: Users2 },
    { id: "skills", label: "Skills", icon: Zap },
    { id: "email_marketing", label: "Email Marketing", icon: Send },
    { id: "tutorials", label: "Tutoriels", icon: GraduationCap },
  ]},
  { group: "Backend", items: [
    { id: "integrations_config", label: "Integrations & MCP", icon: Plug },
  ]},
  { group: "Système", items: [
    { id: "support", label: "Support Chat", icon: MessageCircle },
    { id: "security", label: "Sécurité", icon: Lock },
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "rate_limits", label: "Rate Limits", icon: Gauge },
    { id: "templates", label: "Templates Email", icon: Mail },
    { id: "config", label: "Config globale", icon: Settings },
    { id: "debug", label: "Debug & Sessions", icon: Bug },
  ]},
];

const SECTIONS: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  ceo: CEODashboard as any,
  overview: AdminOverview,
  users: AdminUsers,
  meetings: AdminMeetings,
  subscriptions: AdminSubscriptions,
  webhooks: AdminWebhooks,
  rate_limits: AdminRateLimits,
  templates: AdminTemplates,
  config: AdminConfig,
  monitoring: AdminMonitoring,
  debug: AdminDebug,
  blog: AdminBlog as any,
  leads_magnets: AdminLeadsMagnets as any,
  leads_captures: AdminLeadsCaptures as any,
  affiliates: AdminAffiliates as any,
  support: AdminSupport as any,
  security: AdminSecurity as any,
  skills: AdminSkills as any,
  email_marketing: AdminEmailMarketing as any,
  tutorials: AdminTutorials as any,
  integrations_config: AdminIntegrations as any,
};

const getActiveLabel = (id: string) => {
  for (const g of adminNav) {
    const item = g.items.find(i => i.id === id);
    if (item) return item.label;
  }
  return "Admin";
};

const SuperAdmin = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const ActiveComponent = SECTIONS[activeSection] || AdminOverview;

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-8 shrink-0">
        <Shield className="h-4 w-4 text-destructive" />
        <span className="font-display font-extrabold text-sm text-foreground">RapidoMeet ADMIN</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {adminNav.map((group) => (
          <div key={group.group} className="mb-4">
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-2 px-2">{group.group}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`flex items-center gap-2 w-full px-2 py-2.5 lg:py-2 rounded-lg text-xs font-body transition-colors ${
                  activeSection === item.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <item.icon className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="shrink-0 pt-2">
        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground justify-start" onClick={() => navigate("/app/dashboard")}>
          <LogOut className="h-3.5 w-3.5 mr-1" /> Retour à l'app
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-border/30 bg-background/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-destructive" />
          <span className="font-display font-bold text-sm">ADMIN</span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{getActiveLabel(activeSection)}</span>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-muted/30">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-4 flex flex-col">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[240px] shrink-0 border-r border-border/30 p-4 bg-card">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Chargement…</div>}>
          <ActiveComponent />
        </Suspense>
      </main>
    </div>
  );
};

export default SuperAdmin;
