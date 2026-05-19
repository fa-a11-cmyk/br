import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { UpdateBanner } from "@/components/pwa/UpdateBanner";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import ExitIntentPopup from "@/components/landing/ExitIntentPopup";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded public pages
const Connexion = lazy(() => import("./pages/public/Connexion"));
const Inscription = lazy(() => import("./pages/public/Inscription"));
const MotDePasseOublie = lazy(() => import("./pages/public/MotDePasseOublie"));
const ResetPassword = lazy(() => import("./pages/public/ResetPassword"));
const Demo = lazy(() => import("./pages/public/Demo"));
const SharedReport = lazy(() => import("./pages/public/SharedReport"));
const Tarifs = lazy(() => import("./pages/public/Tarifs"));
const Fonctionnalites = lazy(() => import("./pages/public/Fonctionnalites"));
const IntegrationsPage = lazy(() => import("./pages/public/IntegrationsPage"));
const Blog = lazy(() => import("./pages/public/Blog"));
const BlogArticle = lazy(() => import("./pages/public/BlogArticle"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const CasDUsage = lazy(() => import("./pages/public/CasDUsage"));
const APropos = lazy(() => import("./pages/public/APropos"));
const Securite = lazy(() => import("./pages/public/Securite"));
const Comparaison = lazy(() => import("./pages/public/Comparaison"));
const OpenClawPage = lazy(() => import("./pages/public/OpenClawPage"));
const AffiliationPage = lazy(() => import("./pages/public/AffiliationPage"));

// App layout & pages
const AppLayout = lazy(() => import("./components/app/AppLayout"));
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Reunions = lazy(() => import("./pages/app/Reunions"));
const NouvelleReunion = lazy(() => import("./pages/app/NouvelleReunion"));
const ReunionDetail = lazy(() => import("./pages/app/ReunionDetail"));
const Rapports = lazy(() => import("./pages/app/Rapports"));
const RapportDetail = lazy(() => import("./pages/app/RapportDetail"));
const Taches = lazy(() => import("./pages/app/Taches"));
const Scenarios = lazy(() => import("./pages/app/Scenarios"));
const ScenarioCatalogue = lazy(() => import("./pages/app/ScenarioCatalogue"));
const ScenarioDetail = lazy(() => import("./pages/app/ScenarioDetail"));
const OpenClaw = lazy(() => import("./pages/app/OpenClaw"));
const Configuration = lazy(() => import("./pages/app/Configuration"));
const Aide = lazy(() => import("./pages/app/Aide"));
const Agenda = lazy(() => import("./pages/app/Agenda"));
const TranscriptionLive = lazy(() => import("./pages/app/TranscriptionLive"));
const Historique = lazy(() => import("./pages/app/Historique"));
const AppIntegrations = lazy(() => import("./pages/app/Integrations"));
const Profil = lazy(() => import("./pages/app/Profil"));
const WorkspacePage = lazy(() => import("./pages/app/Workspace"));
const Onboarding = lazy(() => import("./pages/app/Onboarding"));
const Analytics = lazy(() => import("./pages/app/Analytics"));
const Changelog = lazy(() => import("./pages/public/Changelog"));
const EmailBuilder = lazy(() => import("./pages/app/EmailBuilder"));
const PdfBuilder = lazy(() => import("./pages/app/PdfBuilder"));
const SkillsMarketplace = lazy(() => import("./pages/app/SkillsMarketplace"));
const ApiKeys = lazy(() => import("./pages/app/ApiKeys"));
const ExportComptable = lazy(() => import("./pages/app/ExportComptable"));
const Billing = lazy(() => import("./pages/app/Billing"));
const Developers = lazy(() => import("./pages/public/Developers"));
const Docs = lazy(() => import("./pages/public/Docs"));
const DocsPlayground = lazy(() => import("./pages/public/DocsPlayground"));
const TutorielsHub = lazy(() => import("./pages/public/TutorielsHub"));
const TutorielDetail = lazy(() => import("./pages/public/TutorielDetail"));
const FAQPage = lazy(() => import("./pages/public/FAQPage"));
const CertificatePage = lazy(() => import("./pages/public/CertificatePage"));
const SuperAdmin = lazy(() => import("./pages/admin/SuperAdmin"));
const Notifications = lazy(() => import("./pages/app/Notifications"));
const ProjectStatus = lazy(() => import("./pages/app/ProjectStatus"));
const JoinWorkspace = lazy(() => import("./pages/app/JoinWorkspace"));
const Affiliation = lazy(() => import("./pages/app/Affiliation"));
const OAuthCallback = lazy(() => import("./pages/public/OAuthCallback"));
const LandingHub = lazy(() => import("./pages/app/LandingHub"));
const LandingEditor = lazy(() => import("./pages/app/LandingEditor"));
const LandingPagePublic = lazy(() => import("./pages/public/LandingPagePublic"));


const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div
      className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
      style={{
        borderTopColor: "hsl(var(--fuchsia))",
        borderRightColor: "hsl(var(--violet))",
      }}
    />
  </div>
);

function PublicChatWidget() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/app") || pathname.startsWith("/admin") || pathname.startsWith("/onboarding")) return null;
  return <ChatWidget />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <UpdateBanner />
      <InstallPrompt />
      <ExitIntentPopup />
      <BrowserRouter>
        <AuthProvider>
          <ImpersonationProvider>
          <ImpersonationBanner />
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Index />} />
                <Route path="/tarifs" element={<Tarifs />} />
                <Route path="/fonctionnalites" element={<Fonctionnalites />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogArticle />} />
                <Route path="/connexion" element={<Connexion />} />
                <Route path="/inscription" element={<Inscription />} />
                <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/roadmap" element={<Changelog />} />
                <Route path="/developers" element={<Developers />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/docs/playground" element={<DocsPlayground />} />
                <Route path="/tutoriels" element={<TutorielsHub />} />
                <Route path="/tutoriels/:slug" element={<TutorielDetail />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/certificat/:id" element={<CertificatePage />} />
                <Route path="/cas-d-usage" element={<CasDUsage />} />
                <Route path="/a-propos" element={<APropos />} />
                <Route path="/securite" element={<Securite />} />
                <Route path="/vs/:slug" element={<Comparaison />} />
                <Route path="/openclaw" element={<OpenClawPage />} />
                <Route path="/affiliation" element={<AffiliationPage />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/rapport/:token" element={<SharedReport />} />
                <Route path="/workspace/join/:token" element={<JoinWorkspace />} />
                <Route path="/oauth/google/callback" element={<OAuthCallback />} />
                <Route path="/oauth/zoom/callback" element={<OAuthCallback />} />
                <Route path="/p/:slug" element={<LandingPagePublic />} />

                {/* App (authenticated) */}
                <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="reunions" element={<Reunions />} />
                  <Route path="reunions/nouvelle" element={<NouvelleReunion />} />
                  <Route path="reunions/:id/live" element={<TranscriptionLive />} />
                  <Route path="reunions/:id" element={<ReunionDetail />} />
                  <Route path="rapports" element={<Rapports />} />
                  <Route path="rapports/:id" element={<RapportDetail />} />
                  <Route path="taches" element={<Taches />} />
                  <Route path="scenarios" element={<Scenarios />} />
                  <Route path="scenarios/catalogue" element={<ScenarioCatalogue />} />
                  <Route path="scenarios/:id" element={<ScenarioDetail />} />
                  <Route path="openclaw" element={<OpenClaw />} />
                  <Route path="configuration" element={<Configuration />} />
                  <Route path="agenda" element={<Agenda />} />
                  <Route path="historique" element={<Historique />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="integrations" element={<AppIntegrations />} />
                  <Route path="profil" element={<Profil />} />
                  <Route path="workspace" element={<WorkspacePage />} />
                  <Route path="aide" element={<Aide />} />
                  <Route path="email-builder" element={<EmailBuilder />} />
                  <Route path="pdf-builder" element={<PdfBuilder />} />
                  <Route path="skills-marketplace" element={<SkillsMarketplace />} />
                  <Route path="skills-marketplace/:id" element={<SkillsMarketplace />} />
                  <Route path="api-keys" element={<ApiKeys />} />
                  <Route path="export-comptable" element={<ExportComptable />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="checkout" element={<Navigate to="/app/billing" replace />} />
                  <Route path="project-status" element={<ProjectStatus />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="affiliation" element={<Affiliation />} />
                  <Route path="landing" element={<LandingHub />} />
                  <Route path="landing/new" element={<LandingEditor />} />
                  <Route path="landing/edit/:id" element={<LandingEditor />} />
                  <Route path="tutoriels" element={<TutorielsHub />} />
                  <Route path="tutoriels/:slug" element={<TutorielDetail />} />
                </Route>
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<AdminRoute><SuperAdmin /></AdminRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <PublicChatWidget />
            </Suspense>
          </ErrorBoundary>
          </ImpersonationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
