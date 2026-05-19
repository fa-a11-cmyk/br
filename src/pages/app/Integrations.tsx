import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { AppLogo } from "@/components/app/AppLogo";
import {
  ALL_INTEGRATIONS,
  CATEGORIES,
  AGENT_SKILLS,
  MCP_SERVERS,
  type Integration,
} from "@/data/integrations";
import { useConnectionsApi } from "@/hooks/useConnectionsApi";
import ConnectionModal, { getConnectionType } from "@/components/config/ConnectionModal";

const BADGE_STYLES: Record<string, string> = {
  success: "bg-success-d text-[hsl(var(--success))]",
  fuchsia: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]",
  violet: "bg-violet-d text-[hsl(var(--violet-l))]",
  gray: "bg-[hsl(var(--dark-4))] text-muted-foreground",
  warning: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]",
};

const STATUS_FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "connected", label: "Connectées" },
  { id: "available", label: "Disponibles" },
  { id: "coming_soon", label: "Bientôt" },
];

const IntegrationCard = ({ app, isDbConnected, onConnect, onDisconnect, onTest }: { app: Integration; isDbConnected: boolean; onConnect: () => void; onDisconnect: () => void; onTest?: () => void }) => {
  const effectiveConnected = isDbConnected || app.status === "connected";
  const isAvailable = !effectiveConnected && app.status !== "coming_soon";
  return (
    <div
      className={`bg-card border rounded-[14px] p-5 transition-all hover:-translate-y-0.5 ${
        effectiveConnected
          ? "border-[rgba(16,185,129,0.25)] hover:border-[rgba(16,185,129,0.5)]"
          : "border-border hover:border-[rgba(233,30,140,0.4)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <AppLogo domain={app.domain} name={app.name} size={36} />
          <div className="min-w-0">
            <p className="font-display font-bold text-[14px] text-foreground truncate">{app.name}</p>
            <p className="font-mono text-[10px] text-muted-foreground/50">{app.domain}</p>
          </div>
        </div>
        <span className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full shrink-0 ${
          effectiveConnected ? BADGE_STYLES.success : (BADGE_STYLES[app.badgeColor] || BADGE_STYLES.gray)
        }`}>
          {effectiveConnected ? "● Connecté" : app.badge}
        </span>
      </div>
      <p className="font-body text-[13px] text-muted-foreground leading-relaxed mb-4">{app.description}</p>
      <div className="flex items-center justify-between gap-2">
        {app.mcp && (
          <span className="font-mono text-[10px] bg-violet-d text-[hsl(var(--violet-l))] px-2 py-0.5 rounded">
            MCP {app.mcpName}
          </span>
        )}
        {!app.mcp && <span />}
        {effectiveConnected && (
          <div className="flex gap-1.5">
            {onTest && (
              <button onClick={onTest} className="font-body text-[12px] text-muted-foreground bg-[hsl(var(--dark-3))] border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors">
                Tester
              </button>
            )}
            <button onClick={onDisconnect} className="font-body text-[12px] text-muted-foreground bg-[hsl(var(--dark-3))] border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors">
              Déconnecter
            </button>
          </div>
        )}
        {isAvailable && (
          <button onClick={onConnect} className="font-body text-[12px] text-white bg-gradient-primary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
            Connecter →
          </button>
        )}
        {!effectiveConnected && app.status === "coming_soon" && (
          <span className="font-mono text-[10px] text-muted-foreground/40">Bientôt disponible</span>
        )}
      </div>
    </div>
  );
};

const Integrations = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Integration | null>(null);
  const { connectionMap, startOAuthConnect, connectWithCredentials, disconnect, testConnection, loading: connectionsLoading } = useConnectionsApi();

  // Compute effective status using DB connections
  const getEffectiveStatus = (app: Integration): "connected" | "available" | "coming_soon" => {
    if (connectionMap[app.id]?.status === "connected") return "connected";
    return app.status;
  };

  const connected = ALL_INTEGRATIONS.filter(a => getEffectiveStatus(a) === "connected");
  const available = ALL_INTEGRATIONS.filter(a => getEffectiveStatus(a) === "available");
  const comingSoon = ALL_INTEGRATIONS.filter(a => getEffectiveStatus(a) === "coming_soon");
  const mcpActive = MCP_SERVERS.filter(m => m.status === "active");

  const filtered = useMemo(() => {
    let list = ALL_INTEGRATIONS;
    if (statusFilter !== "all") list = list.filter(a => getEffectiveStatus(a) === statusFilter);
    if (catFilter !== "all") list = list.filter(a => a.category === catFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.priority - b.priority);
  }, [search, statusFilter, catFilter, connectionMap]);

  const grouped = useMemo(() => {
    const map: Record<string, Integration[]> = {};
    filtered.forEach(a => {
      if (!map[a.category]) map[a.category] = [];
      map[a.category].push(a);
    });
    return map;
  }, [filtered]);

  const openConnect = (app: Integration) => {
    setSelectedApp(app);
    setModalOpen(true);
  };

  const handleDisconnect = async (id: string) => {
    const conn = connectionMap[id];
    if (conn && confirm("Déconnecter cette intégration ?")) await disconnect(conn.id);
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-[60px] z-20 backdrop-blur-xl bg-background/80 border-b border-border px-6 md:px-12 pt-8 pb-6">
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-foreground">
          Intégrations & Connexions
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          60+ applications connectables. Branchez vos outils en 2 minutes.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="font-mono text-[11px] bg-success-d text-[hsl(var(--success))] px-3 py-1 rounded-full">✅ {connected.length} connectées</span>
          <span className="font-mono text-[11px] bg-violet-d text-[hsl(var(--violet-l))] px-3 py-1 rounded-full">⚡ {available.length} disponibles</span>
          <span className="font-mono text-[11px] bg-[hsl(var(--dark-4))] text-muted-foreground px-3 py-1 rounded-full">🔜 {comingSoon.length}+ bientôt</span>
          <span className="font-mono text-[11px] bg-fuchsia-d text-[hsl(var(--fuchsia-l))] px-3 py-1 rounded-full">🔧 MCPs: {mcpActive.length} actifs</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px] max-w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une application..."
              className="w-full bg-[hsl(var(--dark-3))] border border-border rounded-lg pl-9 pr-4 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(var(--fuchsia))]"
            />
          </div>
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`font-body text-[12px] px-3 py-1.5 rounded-lg border transition-colors ${
                  statusFilter === f.id
                    ? "bg-gradient-primary text-white border-transparent"
                    : "bg-[hsl(var(--dark-3))] border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="bg-[hsl(var(--dark-3))] border border-border rounded-lg px-3 py-2 font-body text-[12px] text-muted-foreground focus:outline-none focus:border-[hsl(var(--fuchsia))]"
          >
            <option value="all">Toutes les catégories</option>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.icon} {cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-6 md:px-12 py-8 max-w-[1300px] space-y-10">
        {/* Connected section */}
        {statusFilter === "all" && !search && catFilter === "all" && connected.length > 0 && (
          <section>
            <p className="font-mono text-[11px] text-[hsl(var(--fuchsia-l))] uppercase tracking-[2px] mb-4">
              Mes connexions · {connected.length} actives
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {connected.map(app => (
                <IntegrationCard key={app.id} app={app} isDbConnected={!!connectionMap[app.id]} onConnect={() => openConnect(app)} onDisconnect={() => handleDisconnect(app.id)} onTest={connectionMap[app.id] ? () => testConnection(connectionMap[app.id].id) : undefined} />
              ))}
            </div>
          </section>
        )}

        {/* By category */}
        {Object.entries(grouped).map(([catKey, apps]) => {
          const cat = CATEGORIES[catKey];
          if (!cat) return null;
          if (statusFilter === "all" && !search && catFilter === "all" && apps.every(a => getEffectiveStatus(a) === "connected")) return null;
          return (
            <section key={catKey}>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/30">
                <span className="text-lg">{cat.icon}</span>
                <h2 className="font-display font-bold text-[16px] text-foreground">{cat.label}</h2>
                <span className="font-mono text-[11px] text-muted-foreground/50 ml-1">({apps.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {apps.map(app => (
                  <IntegrationCard key={app.id} app={app} isDbConnected={!!connectionMap[app.id]} onConnect={() => openConnect(app)} onDisconnect={() => handleDisconnect(app.id)} onTest={connectionMap[app.id] ? () => testConnection(connectionMap[app.id].id) : undefined} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Agent Skills */}
        <section>
          <p className="font-mono text-[11px] text-[hsl(var(--violet-l))] uppercase tracking-[2px] mb-4">
            Ce que l'agent peut faire avec vos intégrations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AGENT_SKILLS.map(cat => {
              const isExpanded = expandedSkill === cat.category;
              const shown = isExpanded ? cat.skills : cat.skills.slice(0, 4);
              const remaining = cat.skills.length - 4;
              const colorCls =
                cat.color === "fuchsia" ? "text-[hsl(var(--fuchsia-l))]" :
                cat.color === "violet" ? "text-[hsl(var(--violet-l))]" :
                cat.color === "success" ? "text-[hsl(var(--success))]" :
                cat.color === "warning" ? "text-[#F59E0B]" :
                "text-muted-foreground";
              return (
                <div key={cat.category} className="bg-card border border-border rounded-[14px] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <h3 className="font-display font-bold text-[15px] text-foreground">{cat.category}</h3>
                    </div>
                    <span className={`font-mono text-[11px] ${colorCls}`}>{cat.skills.length}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {shown.map((skill, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          cat.color === "fuchsia" ? "bg-[hsl(var(--fuchsia))]" :
                          cat.color === "violet" ? "bg-[hsl(var(--violet))]" :
                          cat.color === "success" ? "bg-[hsl(var(--success))]" :
                          cat.color === "warning" ? "bg-[#F59E0B]" :
                          "bg-muted-foreground"
                        }`} />
                        <span className="font-body text-[13px] text-muted-foreground">{skill}</span>
                      </li>
                    ))}
                  </ul>
                  {remaining > 0 && (
                    <button
                      onClick={() => setExpandedSkill(isExpanded ? null : cat.category)}
                      className={`font-body text-[13px] mt-2 ${colorCls} hover:underline`}
                    >
                      {isExpanded ? "Réduire" : `+${remaining} autres →`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* MCP Servers */}
        <section>
          <p className="font-mono text-[11px] text-[hsl(var(--fuchsia-l))] uppercase tracking-[2px] mb-4">
            Serveurs MCP disponibles · {MCP_SERVERS.length} configurés
          </p>
          <div className="bg-card border border-border rounded-[14px] overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_80px_70px_80px] gap-2 px-5 py-3 bg-[hsl(var(--dark-3))] border-b border-border">
              <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[1.5px]">Nom MCP</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[1.5px]">Application</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[1.5px]">Version</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[1.5px]">Outils</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[1.5px]">Statut</span>
            </div>
            {MCP_SERVERS.map(m => (
              <div key={m.id} className="grid grid-cols-[1fr_1fr_80px_70px_80px] gap-2 px-5 py-3 border-b border-border/30 hover:bg-[hsl(var(--dark-3))] transition-colors">
                <span className="font-mono text-[13px] text-[hsl(var(--fuchsia-l))]">{m.name}</span>
                <span className="font-body text-[13px] text-muted-foreground">{m.app}</span>
                <span className="font-mono text-[11px] text-muted-foreground/50">{m.version}</span>
                <span className="font-mono text-[11px] bg-violet-d text-[hsl(var(--violet-l))] px-2 py-0.5 rounded text-center w-fit">{m.toolCount}</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full w-fit ${
                  m.status === "active" ? "bg-success-d text-[hsl(var(--success))]" : "bg-[hsl(var(--dark-4))] text-muted-foreground"
                }`}>
                  {m.status === "active" ? "● Actif" : "Disponible"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Connection Modal */}
      {selectedApp && (
        <ConnectionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          integrationName={selectedApp.name}
          integrationId={selectedApp.id}
          connectionType={getConnectionType(selectedApp.id)}
          onOAuthStart={(provider) => startOAuthConnect(provider)}
          onConnect={async (credentials, accountLabel) => {
            return await connectWithCredentials(
              selectedApp.id,
              credentials,
              accountLabel
            );
          }}
        />
      )}
    </div>
  );
};

export default Integrations;
