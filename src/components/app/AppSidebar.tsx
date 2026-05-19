import {
  LayoutDashboard,
  Mic,
  GraduationCap,
  FileText,
  CheckSquare,
  Zap,
  Bot,
  Settings,
  HelpCircle,
  Calendar,
  History,
  Plug,
  BarChart3,
  Store,
  Key,
  Receipt,
  CreditCard,
  Mail,
  FileType,
  ClipboardCheck,
  LogOut,
  Shield,
  Users,
  Rocket,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarGroupDef {
  label: string;
  items: SidebarItem[];
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useTranslation("common");
  const { isAdmin } = useAdminRole();
  const { isEnabled } = useFeatureFlags();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const groups: SidebarGroupDef[] = [
    {
      label: t("sidebar.groupMain"),
      items: [
        { title: t("sidebar.dashboard"), url: "/app/dashboard", icon: LayoutDashboard },
        { title: t("sidebar.meetings"), url: "/app/reunions", icon: Mic },
        { title: t("sidebar.agenda"), url: "/app/agenda", icon: Calendar },
        { title: t("sidebar.tasks"), url: "/app/taches", icon: CheckSquare },
      ],
    },
    {
      label: t("sidebar.groupIntelligence"),
      items: [
        { title: t("sidebar.reports"), url: "/app/rapports", icon: FileText },
        { title: t("sidebar.analytics"), url: "/app/analytics", icon: BarChart3 },
        { title: t("sidebar.history"), url: "/app/historique", icon: History },
        ...(isEnabled("openclaw") ? [{ title: t("sidebar.openClaw"), url: "/app/openclaw", icon: Bot }] : []),
        ...(isEnabled("skills_marketplace") ? [{ title: t("sidebar.marketplace"), url: "/app/skills-marketplace", icon: Store }] : []),
      ],
    },
    {
      label: t("sidebar.groupAutomation"),
      items: [
        { title: t("sidebar.scenarios"), url: "/app/scenarios", icon: Zap },
        { title: t("sidebar.integrations"), url: "/app/integrations", icon: Plug, badge: 8 },
        ...(isEnabled("email_builder") ? [{ title: t("sidebar.emailBuilder"), url: "/app/email-builder", icon: Mail }] : []),
        ...(isEnabled("pdf_builder") ? [{ title: t("sidebar.pdfBuilder"), url: "/app/pdf-builder", icon: FileType }] : []),
      ],
    },
    {
      label: t("sidebar.groupManagement"),
      items: [
        { title: "Équipe", url: "/app/workspace", icon: Users },
        { title: t("sidebar.billing"), url: "/app/billing", icon: CreditCard },
        { title: t("sidebar.apiKeys"), url: "/app/api-keys", icon: Key },
        ...(isEnabled("export_comptable") ? [{ title: t("sidebar.exportAccounting"), url: "/app/export-comptable", icon: Receipt }] : []),
        { title: "Affiliation", url: "/app/affiliation", icon: Users },
        { title: "Landing Pages", url: "/app/landing", icon: Rocket },
        { title: t("sidebar.projectStatus"), url: "/app/project-status", icon: ClipboardCheck },
      ],
    },
  ];

  const bottomItems = [
    { title: "Tutoriels", url: "/app/tutoriels", icon: GraduationCap },
    { title: t("sidebar.config"), url: "/app/configuration", icon: Settings },
    { title: t("sidebar.help"), url: "/app/aide", icon: HelpCircle },
    ...(isAdmin ? [{ title: "Admin", url: "/admin", icon: Shield }] : []),
  ];

  const initials = user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "??";

  const handleLogout = async () => {
    await signOut();
    navigate("/connexion");
  };

  const groupHasActive = (items: SidebarItem[]) =>
    items.some((item) => isActive(item.url));

  const renderItem = (item: SidebarItem) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
        <NavLink to={item.url} className="hover:bg-muted/50" activeClassName="bg-muted text-foreground font-medium">
          <item.icon className="h-4 w-4" />
          {!collapsed && (
            <span className="font-body text-sm flex-1">{item.title}</span>
          )}
          {!collapsed && item.badge && (
            <span className="w-[18px] h-[18px] rounded-full bg-fuchsia-d text-[hsl(var(--fuchsia-l))] font-mono text-[10px] flex items-center justify-center shrink-0">
              {item.badge}
            </span>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <a href="/app/dashboard" className="flex items-center gap-2.5">
          <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <defs>
              <linearGradient id="sideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E91E8C" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="9" fill="url(#sideGrad)" />
            <circle cx="18" cy="18" r="6" fill="white" opacity="0.9" />
            <circle cx="18" cy="18" r="3" fill="url(#sideGrad)" />
            <path d="M8 18 Q8 12 13 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M8 18 Q8 24 13 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M28 18 Q28 12 23 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M28 18 Q28 24 23 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" />
          </svg>
          {!collapsed && (
            <span className="font-display font-extrabold text-[17px] tracking-tight">
              <span className="bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] bg-clip-text text-transparent">
                Rapido
              </span>
              <span className="text-foreground">Meet</span>
            </span>
          )}
        </a>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <Collapsible key={group.label} defaultOpen={groupHasActive(group.items)} className="group/collapsible">
            <SidebarGroup>
              {!collapsed && (
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer flex items-center justify-between pr-2 hover:bg-muted/30 rounded-md transition-colors">
                    <span>{group.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
              )}
              {collapsed ? (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(renderItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              ) : (
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map(renderItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              )}
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        {!collapsed && (
          <div className="px-3 py-1">
            <LanguageSwitcher />
          </div>
        )}
        <div className="px-2 py-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate("/app/profil")}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-display font-extrabold text-xs text-white hover:ring-2 hover:ring-primary/40 transition-all"
              style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))" }}
            >
              {initials}
            </button>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="font-body text-[13px] text-foreground truncate">{user?.email?.split("@")[0] || "Utilisateur"}</p>
                <p className="font-mono text-[10px] text-[hsl(var(--fuchsia-l))]">{t("sidebar.planPro")}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title={t("sidebar.logout")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
