import { useState } from "react";
import { useConnectionsApi } from "@/hooks/useConnectionsApi";
import ConnectionModal, { getConnectionType } from "@/components/config/ConnectionModal";
import { ALL_INTEGRATIONS } from "@/data/integrations";
import { IntegrationsOAuth } from "@/components/config/IntegrationsOAuth";
import { CalendlyWidget } from "@/components/config/CalendlyWidget";

const SectionLabel = ({ children }: { children: string }) => (
  <p className="font-mono text-[11px] uppercase tracking-[3px] text-[hsl(var(--fuchsia-l))] mb-4 mt-10 first:mt-0">
    {children}
  </p>
);

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-200 shrink-0 ${
      checked ? "bg-gradient-primary" : "bg-[hsl(var(--dark-4))]"
    }`}
  >
    <span
      className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform duration-200 ${
        checked ? "translate-x-[22px]" : "translate-x-[2px]"
      }`}
    />
  </button>
);

const ConnectionCard = ({
  icon, name, badge, connected, account, children, connectLabel, onConnect, onDisconnect, onConfigure,
}: {
  icon: string; name: string; badge?: string; connected: boolean;
  account?: string; children?: React.ReactNode; connectLabel?: string;
  onConnect?: () => void; onDisconnect?: () => void; onConfigure?: () => void;
}) => (
  <div className="bg-card border border-border rounded-[14px] p-6 hover:border-[hsl(var(--fuchsia))]/30 transition-colors">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-[44px] h-[44px] rounded-[10px] bg-secondary flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[15px] text-foreground">{name}</span>
            {badge && (
              <span className="bg-violet-d text-[hsl(var(--violet-l))] font-mono text-[10px] px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          {connected ? (
            <>
              <span className="bg-success-d text-[hsl(var(--success))] font-mono text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-1.5">
                ● Connecté
              </span>
              {account && <p className="font-body text-xs text-muted-foreground/60 mt-1">{account}</p>}
            </>
          ) : (
            <span className="bg-[hsl(var(--dark-4))] text-muted-foreground/60 font-mono text-[11px] px-2.5 py-0.5 rounded-full inline-block mt-1.5">
              ○ Non connecté
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {connected ? (
          <>
            {onConfigure && (
              <button onClick={onConfigure} className="font-body text-[13px] text-muted-foreground bg-secondary border border-[hsl(var(--dark-5))] px-3.5 py-1.5 rounded-lg hover:text-foreground transition-colors">
                Configurer
              </button>
            )}
            <button onClick={onDisconnect} className="font-body text-[13px] text-destructive border border-destructive/50 px-3.5 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
              Déconnecter
            </button>
          </>
        ) : (
          <button onClick={onConnect} className="font-body text-[13px] font-semibold text-white bg-gradient-primary px-4 py-1.5 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform">
            {connectLabel || `Connecter ${name}`}
          </button>
        )}
      </div>
    </div>
    {children && <div className="mt-3">{children}</div>}
  </div>
);

interface IntegrationDef {
  id: string; icon: string; name: string; badge?: string; connectLabel?: string;
  category: string; configToggles?: { key: string; label: string }[];
  children?: (props: { connected: boolean; config: Record<string, unknown>; updateConfig: (c: Record<string, unknown>) => void }) => React.ReactNode;
}

const INTEGRATION_DEFS: IntegrationDef[] = [
  // Visioconférences
  { id: "google-meet", icon: "📹", name: "Google Meet", category: "visio" },
  { id: "microsoft-teams", icon: "💼", name: "Microsoft Teams", category: "visio" },
  // Agendas
  { id: "google-calendar", icon: "📅", name: "Google Calendar", category: "agenda" },
  { id: "outlook", icon: "📆", name: "Outlook Calendar", category: "agenda", connectLabel: "Connecter Outlook" },
  // CRM
  { id: "rapidocrm", icon: "📊", name: "RapidoCRM", badge: "Natif", category: "crm", configToggles: [
    { key: "createContact", label: "Créer contact si prospect détecté" },
    { key: "createOpp", label: "Créer opportunité pipeline" },
    { key: "logActivity", label: "Logger l'activité réunion" },
    { key: "assignTasks", label: "Assigner les tâches aux contacts" },
    { key: "welcomeEmail", label: "Envoyer email de bienvenue auto" },
  ]},
  { id: "hubspot", icon: "🔗", name: "HubSpot", category: "crm", connectLabel: "Connecter via API" },
  // Diffusion
  { id: "whatsapp", icon: "💬", name: "WhatsApp Business", category: "diffusion", configToggles: [
    { key: "whShort", label: "Résumé court (< 300 mots)" },
    { key: "whTasks", label: "Liste des tâches" },
    { key: "whPdf", label: "Lien vers rapport PDF" },
    { key: "whSentiment", label: "Alerte sentiment négatif" },
  ]},
  { id: "telegram", icon: "✈️", name: "Telegram", category: "diffusion" },
  { id: "slack", icon: "💬", name: "Slack", category: "diffusion" },
  { id: "gmail", icon: "📧", name: "Email HTML", category: "diffusion" },
  // Automation
  { id: "n8n", icon: "🔁", name: "N8N Workflows", category: "automation" },
];

const SECTION_MAP: Record<string, string> = {
  visio: "Visioconférences",
  agenda: "Agendas",
  crm: "CRM",
  diffusion: "Canaux de diffusion des rapports",
  automation: "Automatisation",
};

const TabConnexions = () => {
  const { connectionMap, startOAuthConnect, connectWithCredentials, disconnect, loading } = useConnectionsApi();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationDef | null>(null);

  const openConnect = (def: IntegrationDef) => {
    setSelectedIntegration(def);
    setModalOpen(true);
  };

  const handleDisconnect = async (integrationId: string) => {
    const conn = connectionMap[integrationId];
    if (conn && confirm("Êtes-vous sûr de vouloir déconnecter cette intégration ?")) {
      await disconnect(conn.id);
    }
  };

  const sections = ["visio", "agenda", "crm", "diffusion", "automation"];

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-foreground mb-2">Applications connectées</h2>
      <p className="font-body text-sm text-muted-foreground mb-8">
        Connectez vos plateformes de visioconférence, agendas et outils pour que RapidoMeet puisse agir automatiquement après chaque réunion.
      </p>

      <IntegrationsOAuth />
      <CalendlyWidget />

      {loading && <p className="font-body text-sm text-muted-foreground">Chargement...</p>}

      {sections.map(section => {
        const defs = INTEGRATION_DEFS.filter(d => d.category === section);
        if (!defs.length) return null;
        return (
          <div key={section}>
            <SectionLabel>{SECTION_MAP[section]}</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
              {defs.map(def => {
                const conn = connectionMap[def.id];
                const isConnected = !!conn && conn.status === "connected";
                const config = (conn?.metadata as Record<string, unknown>) || {};

                return (
                  <ConnectionCard
                    key={def.id}
                    icon={def.icon}
                    name={def.name}
                    badge={def.badge}
                    connected={isConnected}
                    account={conn?.account_label || undefined}
                    connectLabel={def.connectLabel}
                    onConnect={() => openConnect(def)}
                    onDisconnect={() => handleDisconnect(def.id)}
                    onConfigure={def.configToggles ? () => {} : undefined}
                  >
                    {isConnected && def.configToggles && (
                      <div className="bg-secondary rounded-[10px] p-4 mt-2">
                        <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-3">Options activées</p>
                        {def.configToggles.map(t => (
                          <div key={t.key} className="flex items-center justify-between py-1.5">
                            <span className="font-body text-[13px] text-foreground">{t.label}</span>
                            <Toggle
                              checked={config[t.key] !== false}
                              onChange={() => {}}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </ConnectionCard>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedIntegration && (
        <ConnectionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          integrationName={selectedIntegration.name}
          integrationId={selectedIntegration.id}
          connectionType={getConnectionType(selectedIntegration.id)}
          onOAuthStart={(provider) => startOAuthConnect(provider)}
          onConnect={async (credentials, accountLabel) => {
            return await connectWithCredentials(
              selectedIntegration.id,
              credentials,
              accountLabel
            );
          }}
        />
      )}
    </div>
  );
};

export default TabConnexions;
