import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { SupportWidget } from "@/components/SupportWidget";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { CommandSearch } from "@/components/app/CommandSearch";
import KeyboardShortcutsModal from "@/components/app/KeyboardShortcutsModal";
import OnboardingTour from "@/components/app/OnboardingTour";
import { ThemeToggle } from "@/components/ThemeToggle";
import AnnouncementBanner from "@/components/app/AnnouncementBanner";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Mic, FileText, CheckSquare, Plus, User, LogOut, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useTranslation("common");
  const isActive = (path: string) => location.pathname.startsWith(path);

  const mobileNavItems = [
    { icon: LayoutDashboard, label: t("sidebar.dashboard"), url: "/app/dashboard" },
    { icon: Mic, label: t("sidebar.meetings"), url: "/app/reunions" },
    { icon: null, label: t("actions.create"), url: "/app/reunions/nouvelle", isCenter: true },
    { icon: FileText, label: t("sidebar.reports"), url: "/app/rapports" },
    { icon: CheckSquare, label: t("sidebar.tasks"), url: "/app/taches" },
  ];

  const initials = user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "??";

  const handleLogout = async () => { await signOut(); navigate("/connexion"); };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[60px] flex items-center justify-between border-b border-border/30 px-4 md:px-6 backdrop-blur-md bg-background/80 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <CommandSearch />
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <ThemeToggle size="md" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-display font-bold text-xs text-white cursor-pointer outline-none ring-0 hover:ring-2 hover:ring-primary/40 transition-all">
                    {initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-card border-border">
                  <div className="px-3 py-2">
                    <p className="font-body text-sm text-foreground truncate">{user?.email || "User"}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{t("sidebar.planPro")}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/app/profil")} className="cursor-pointer gap-2">
                    <User className="h-4 w-4" /> {t("sidebar.dashboard") === "Dashboard" ? "My Profile" : "Mon profil"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/app/configuration")} className="cursor-pointer gap-2">
                    <Settings className="h-4 w-4" /> {t("sidebar.config")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> {t("sidebar.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <AnnouncementBanner />
          <main className="flex-1 overflow-auto pb-20 md:pb-0"><Outlet /></main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-end justify-around px-2 pt-1.5 pb-1">
          {mobileNavItems.map((item) => {
            if (item.isCenter) {
              return (
                <Link key={item.label} to={item.url} className="relative -mt-5 flex flex-col items-center">
                  <div className="w-[52px] h-[52px] rounded-full bg-gradient-primary shadow-fuchsia flex items-center justify-center">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground mt-0.5">{item.label}</span>
                </Link>
              );
            }
            const Icon = item.icon!;
            const active = isActive(item.url);
            return (
              <Link key={item.label} to={item.url} className={`flex flex-col items-center py-1.5 px-3 ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                <span className={`font-mono text-[9px] mt-0.5 ${active ? "text-primary font-bold" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <KeyboardShortcutsModal />
      <OnboardingTour />
      <SupportWidget />
    </SidebarProvider>
  );
};

export default AppLayout;
