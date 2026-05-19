import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SecretField } from "@/components/ui/SecretField";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Check, X, Wifi, WifiOff, Settings2, Server, Shield, Zap,
  Brain, Send, Radio, Activity, RefreshCw, Save, TestTube,
} from "lucide-react";

// ── Types ──

interface McpTool {
  name: string;
  enabled: boolean;
  requiresConfirmation: boolean;
}

interface McpConfig {
  serverUrl: string;
  tools: McpTool[];
  maxRetries: number;
  timeoutMs: number;
}

interface ServiceConfig {
  apiBaseUrl: string;
  apiKey: string;
  nsAccessToken?: string;
  webhookSecret: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  status: "connected" | "error" | "not_configured";
  mcp: McpConfig;
}

interface ChannelConfig {
  openclawWsUrl: string;
  openclawWsToken: string;
  useOpenclaw: boolean;
  openclawStatus: "connected" | "disconnected" | "disabled";
  telegramBotToken: string;
  telegramChatId: string;
  discordWebhookUrl: string;
  resendApiKey: string;
  resendFromEmail: string;
}

interface AiConfig {
  groqApiKey: string;
  groqModel: string;
  localWhisperFallback: boolean;
  localWhisperModel: string;
  geminiApiKey: string;
  geminiModel: string;
  geminiTemperature: number;
  n8nBaseUrl: string;
  n8nApiKey: string;
  n8nEnabled: boolean;
}

interface HealthService {
  name: string;
  status: "healthy" | "degraded" | "down";
  latencyMs?: number;
  details?: string;
}

interface CircuitBreaker {
  name: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  successes: number;
  lastFailure?: string;
}

// ── Defaults ──

const DEFAULT_CRM_TOOLS: McpTool[] = [
  { name: "crm_create_contact", enabled: true, requiresConfirmation: false },
  { name: "crm_create_opportunity", enabled: true, requiresConfirmation: false },
  { name: "crm_log_activity", enabled: true, requiresConfirmation: false },
  { name: "update_lead_status", enabled: true, requiresConfirmation: true },
  { name: "create_task", enabled: true, requiresConfirmation: false },
];

const DEFAULT_CMS_TOOLS: McpTool[] = [
  { name: "cms_create_page", enabled: true, requiresConfirmation: true },
  { name: "cms_publish_content", enabled: true, requiresConfirmation: true },
  { name: "cms_create_post", enabled: true, requiresConfirmation: false },
  { name: "cms_upload_media", enabled: true, requiresConfirmation: false },
];

const DEFAULT_RH_TOOLS: McpTool[] = [
  { name: "hr_create_employee_note", enabled: true, requiresConfirmation: false },
  { name: "hr_schedule_interview", enabled: true, requiresConfirmation: true },
  { name: "hr_update_candidate_status", enabled: true, requiresConfirmation: true },
  { name: "hr_create_onboarding_task", enabled: true, requiresConfirmation: false },
];

const makeServiceConfig = (tools: McpTool[], mcpUrl: string): ServiceConfig => ({
  apiBaseUrl: "", apiKey: "", nsAccessToken: "", webhookSecret: "",
  status: "not_configured",
  mcp: { serverUrl: mcpUrl, tools, maxRetries: 3, timeoutMs: 30000 },
});

// ── API helpers (all calls go to VITE_API_URL) ──

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Session expired");
  return session.access_token;
}

function getBase() {
  const url = import.meta.env.VITE_API_URL;
  if (!url) throw new Error("VITE_API_URL not configured");
  return url.replace(/\/$/, "");
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    headers: { Authorization: `Bearer ${await getToken()}` },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// ── Component ──

export default function AdminIntegrations() {
  const [activeTab, setActiveTab] = useState("integrations");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Tab 1
  const [crm, setCrm] = useState<ServiceConfig>(makeServiceConfig(DEFAULT_CRM_TOOLS, "http://localhost:3001/sse"));
  const [cms, setCms] = useState<ServiceConfig>({ ...makeServiceConfig(DEFAULT_CMS_TOOLS, "http://localhost:3006/sse"), oauthClientId: "", oauthClientSecret: "" });
  const [rh, setRh] = useState<ServiceConfig>(makeServiceConfig(DEFAULT_RH_TOOLS, "http://localhost:3007/sse"));

  // Tab 2
  const [channels, setChannels] = useState<ChannelConfig>({
    openclawWsUrl: "", openclawWsToken: "", useOpenclaw: true,
    openclawStatus: "disabled",
    telegramBotToken: "", telegramChatId: "",
    discordWebhookUrl: "",
    resendApiKey: "", resendFromEmail: "",
  });

  // Tab 3
  const [ai, setAi] = useState<AiConfig>({
    groqApiKey: "", groqModel: "whisper-large-v3",
    localWhisperFallback: false, localWhisperModel: "base",
    geminiApiKey: "", geminiModel: "gemini-2.5-flash-lite", geminiTemperature: 0.3,
    n8nBaseUrl: "", n8nApiKey: "", n8nEnabled: false,
  });

  // Tab 4
  const [health, setHealth] = useState<HealthService[]>([]);
  const [breakers, setBreakers] = useState<CircuitBreaker[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  // Test connection states
  const [testing, setTesting] = useState<Record<string, "idle" | "loading" | "ok" | "error">>({});

  // ── Load config ──
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<any>("/api/admin/config");
      if (data.rapidocrm) setCrm(prev => ({ ...prev, ...data.rapidocrm }));
      if (data.rapidocms) setCms(prev => ({ ...prev, ...data.rapidocms }));
      if (data.rapidorh) setRh(prev => ({ ...prev, ...data.rapidorh }));
      if (data.channels) setChannels(prev => ({ ...prev, ...data.channels }));
      if (data.ai) setAi(prev => ({ ...prev, ...data.ai }));
    } catch {
      // Config not yet saved — use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // ── Auto-refresh health ──
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const [h, b] = await Promise.all([
        apiGet<HealthService[]>("/api/admin/health"),
        apiGet<CircuitBreaker[]>("/api/admin/circuit-breakers"),
      ]);
      setHealth(Array.isArray(h) ? h : []);
      setBreakers(Array.isArray(b) ? b : []);
    } catch { /* silent */ } finally { setHealthLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab !== "health") return;
    fetchHealth();
    const iv = setInterval(fetchHealth, 30_000);
    return () => clearInterval(iv);
  }, [activeTab, fetchHealth]);

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPost("/api/admin/config", {
        rapidocrm: crm, rapidocms: cms, rapidorh: rh,
        channels, ai,
      });
      setDirty(false);
      toast({ title: "Configuration saved", description: "All integration settings updated." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  // ── Test connection ──
  const testConnection = async (service: string) => {
    setTesting(p => ({ ...p, [service]: "loading" }));
    try {
      await apiGet(`/api/admin/config/test?service=${service}`);
      setTesting(p => ({ ...p, [service]: "ok" }));
    } catch {
      setTesting(p => ({ ...p, [service]: "error" }));
    }
    setTimeout(() => setTesting(p => ({ ...p, [service]: "idle" })), 4000);
  };

  const testChannel = async (channel: string) => {
    setTesting(p => ({ ...p, [channel]: "loading" }));
    try {
      await apiPost(`/api/admin/config/test-channel`, { channel });
      setTesting(p => ({ ...p, [channel]: "ok" }));
    } catch {
      setTesting(p => ({ ...p, [channel]: "error" }));
    }
    setTimeout(() => setTesting(p => ({ ...p, [channel]: "idle" })), 4000);
  };

  // Helpers
  const markDirty = () => { if (!dirty) setDirty(true); };
  const updateCrm = (patch: Partial<ServiceConfig>) => { setCrm(p => ({ ...p, ...patch })); markDirty(); };
  const updateCms = (patch: Partial<ServiceConfig>) => { setCms(p => ({ ...p, ...patch })); markDirty(); };
  const updateRh = (patch: Partial<ServiceConfig>) => { setRh(p => ({ ...p, ...patch })); markDirty(); };
  const updateChannels = (patch: Partial<ChannelConfig>) => { setChannels(p => ({ ...p, ...patch })); markDirty(); };
  const updateAi = (patch: Partial<AiConfig>) => { setAi(p => ({ ...p, ...patch })); markDirty(); };

  const updateMcpTool = (
    setter: React.Dispatch<React.SetStateAction<ServiceConfig>>,
    toolName: string,
    field: "enabled" | "requiresConfirmation",
    value: boolean
  ) => {
    setter(prev => ({
      ...prev,
      mcp: {
        ...prev.mcp,
        tools: prev.mcp.tools.map(t => t.name === toolName ? { ...t, [field]: value } : t),
      },
    }));
    markDirty();
  };

  const TestButton = ({ id, onClick }: { id: string; onClick: () => void }) => {
    const state = testing[id] || "idle";
    return (
      <Button variant="outline" size="sm" onClick={onClick} disabled={state === "loading"} className="gap-1.5">
        {state === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {state === "ok" && <Check className="w-3.5 h-3.5 text-green-500" />}
        {state === "error" && <X className="w-3.5 h-3.5 text-red-500" />}
        {state === "idle" && <TestTube className="w-3.5 h-3.5" />}
        Test
      </Button>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "connected") return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>;
    if (status === "error") return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="secondary">Not configured</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Service accordion section ──
  const ServiceSection = ({
    title, icon: Icon, service, config, setConfig,
    showOAuth = false,
  }: {
    title: string; icon: any; service: string;
    config: ServiceConfig;
    setConfig: (patch: Partial<ServiceConfig>) => void;
    showOAuth?: boolean;
  }) => (
    <AccordionItem value={service}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <span className="font-display font-bold">{title}</span>
          <StatusBadge status={config.status} />
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1 block">API Base URL</label>
            <Input value={config.apiBaseUrl} onChange={e => setConfig({ apiBaseUrl: e.target.value })}
              placeholder="https://..." />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SecretField label="API Key" value={config.apiKey}
                onChange={v => setConfig({ apiKey: v })} placeholder="Enter API key" />
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <SecretField label="Webhook Secret" value={config.webhookSecret}
            onChange={v => setConfig({ webhookSecret: v })} placeholder="whsec_..." />
          <SecretField label="NS Access Token" value={config.nsAccessToken || ""}
            onChange={v => setConfig({ nsAccessToken: v })} placeholder="NS Token" />
        </div>

        {showOAuth && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">OAuth Client ID</label>
              <Input value={config.oauthClientId || ""} onChange={e => setConfig({ oauthClientId: e.target.value })} />
            </div>
            <SecretField label="OAuth Client Secret" value={config.oauthClientSecret || ""}
              onChange={v => setConfig({ oauthClientSecret: v })} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <TestButton id={service} onClick={() => testConnection(service)} />
        </div>

        {/* MCP Properties */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4" /> MCP Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">MCP Server URL</label>
              <Input value={config.mcp.serverUrl}
                onChange={e => {
                  setConfig({ mcp: { ...config.mcp, serverUrl: e.target.value } } as any);
                  // Need to properly update nested state
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Available Tools</label>
              <div className="space-y-2 mt-2">
                {config.mcp.tools.map(tool => (
                  <div key={tool.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tool.enabled}
                        onCheckedChange={v => {
                          const setter = service === "rapidocrm" ? setCrm : service === "rapidocms" ? setCms : setRh;
                          updateMcpTool(setter, tool.name, "enabled", !!v);
                        }}
                      />
                      <code className="text-xs font-mono">{tool.name}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confirm</span>
                      <Switch
                        checked={tool.requiresConfirmation}
                        onCheckedChange={v => {
                          const setter = service === "rapidocrm" ? setCrm : service === "rapidocms" ? setCms : setRh;
                          updateMcpTool(setter, tool.name, "requiresConfirmation", v);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Max Retries</label>
                <Input type="number" min={1} max={5} value={config.mcp.maxRetries}
                  onChange={e => {
                    const setter = service === "rapidocrm" ? setCrm : service === "rapidocms" ? setCms : setRh;
                    setter(p => ({ ...p, mcp: { ...p.mcp, maxRetries: Number(e.target.value) } }));
                    markDirty();
                  }} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Timeout (ms)</label>
                <Input type="number" min={1000} max={120000} step={1000} value={config.mcp.timeoutMs}
                  onChange={e => {
                    const setter = service === "rapidocrm" ? setCrm : service === "rapidocms" ? setCms : setRh;
                    setter(p => ({ ...p, mcp: { ...p.mcp, timeoutMs: Number(e.target.value) } }));
                    markDirty();
                  }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </AccordionContent>
    </AccordionItem>
  );

  // ── Circuit breaker color ──
  const cbColor = (state: string) =>
    state === "CLOSED" ? "text-green-500" : state === "OPEN" ? "text-red-500" : "text-amber-500";
  const cbBg = (state: string) =>
    state === "CLOSED" ? "bg-green-500/10" : state === "OPEN" ? "bg-red-500/10" : "bg-amber-500/10";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Integrations & Config</h2>
          <p className="text-sm text-muted-foreground">Manage API keys, MCP tools, channels, and system health</p>
        </div>
        {activeTab !== "health" && (
          <Button onClick={handleSave} disabled={!dirty || saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations" className="gap-1.5 text-xs sm:text-sm">
            <Settings2 className="w-3.5 h-3.5 hidden sm:block" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-1.5 text-xs sm:text-sm">
            <Send className="w-3.5 h-3.5 hidden sm:block" /> Channels
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 text-xs sm:text-sm">
            <Brain className="w-3.5 h-3.5 hidden sm:block" /> AI & STT
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5 text-xs sm:text-sm">
            <Activity className="w-3.5 h-3.5 hidden sm:block" /> Health
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Integrations ── */}
        <TabsContent value="integrations" className="mt-6">
          <Accordion type="multiple" defaultValue={["rapidocrm"]} className="space-y-2">
            <ServiceSection title="RapidoCRM" icon={Zap} service="rapidocrm" config={crm} setConfig={updateCrm} />
            <ServiceSection title="RapidoCMS" icon={Shield} service="rapidocms" config={cms} setConfig={updateCms} showOAuth />
            <ServiceSection title="Rapido RH" icon={Settings2} service="rapidorh" config={rh} setConfig={updateRh} />
          </Accordion>
        </TabsContent>

        {/* ── TAB 2: Channels ── */}
        <TabsContent value="channels" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Radio className="w-4 h-4" /> OpenClaw WebSocket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">WS URL</label>
                  <Input value={channels.openclawWsUrl} onChange={e => updateChannels({ openclawWsUrl: e.target.value })} placeholder="wss://..." />
                </div>
                <SecretField label="WS Token" value={channels.openclawWsToken} onChange={v => updateChannels({ openclawWsToken: v })} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={channels.useOpenclaw} onCheckedChange={v => updateChannels({ useOpenclaw: v })} />
                <span className="text-sm">Use OpenClaw</span>
                <Badge variant={channels.openclawStatus === "connected" ? "default" : "secondary"} className={channels.openclawStatus === "connected" ? "bg-green-500/10 text-green-500" : ""}>
                  {channels.openclawStatus === "connected" ? <><Wifi className="w-3 h-3 mr-1" />Connected</> : channels.openclawStatus === "disabled" ? "Disabled" : <><WifiOff className="w-3 h-3 mr-1" />Disconnected</>}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {!channels.useOpenclaw && (
            <Card>
              <CardHeader><CardTitle className="text-base">Telegram Direct</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SecretField label="Bot Token" value={channels.telegramBotToken} onChange={v => updateChannels({ telegramBotToken: v })} />
                <div>
                  <label className="text-sm font-medium mb-1 block">Chat ID</label>
                  <Input value={channels.telegramChatId} onChange={e => updateChannels({ telegramChatId: e.target.value })} />
                </div>
                <TestButton id="telegram" onClick={() => testChannel("telegram")} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Discord</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <SecretField label="Webhook URL" value={channels.discordWebhookUrl} onChange={v => updateChannels({ discordWebhookUrl: v })} />
              <TestButton id="discord" onClick={() => testChannel("discord")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Resend Email</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <SecretField label="API Key" value={channels.resendApiKey} onChange={v => updateChannels({ resendApiKey: v })} />
              <div>
                <label className="text-sm font-medium mb-1 block">From Email</label>
                <Input type="email" value={channels.resendFromEmail} onChange={e => updateChannels({ resendFromEmail: e.target.value })} placeholder="noreply@yourdomain.com" />
              </div>
              <TestButton id="resend" onClick={() => testChannel("resend")} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: AI & STT ── */}
        <TabsContent value="ai" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Groq STT</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <SecretField label="API Key" value={ai.groqApiKey} onChange={v => updateAi({ groqApiKey: v })} />
              <div>
                <label className="text-sm font-medium mb-1 block">Model</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ai.groqModel} onChange={e => updateAi({ groqModel: e.target.value })}>
                  <option value="whisper-large-v3">whisper-large-v3</option>
                  <option value="whisper-large-v3-turbo">whisper-large-v3-turbo</option>
                </select>
              </div>
              <div className="text-sm text-muted-foreground">Max file size: <strong>25 MB</strong></div>
              <div className="flex items-center gap-3">
                <Switch checked={ai.localWhisperFallback} onCheckedChange={v => updateAi({ localWhisperFallback: v })} />
                <span className="text-sm">Local Whisper fallback</span>
              </div>
              {ai.localWhisperFallback && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Local Whisper Model</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ai.localWhisperModel} onChange={e => updateAi({ localWhisperModel: e.target.value })}>
                    <option value="base">base</option>
                    <option value="small">small</option>
                    <option value="medium">medium</option>
                    <option value="large-v3">large-v3</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Gemini NLP / Routing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <SecretField label="API Key" value={ai.geminiApiKey} onChange={v => updateAi({ geminiApiKey: v })} />
              <div>
                <label className="text-sm font-medium mb-1 block">Model</label>
                <Input value={ai.geminiModel} readOnly className="bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Temperature: {ai.geminiTemperature.toFixed(1)}</label>
                <Slider min={0} max={1} step={0.1} value={[ai.geminiTemperature]} onValueChange={([v]) => updateAi({ geminiTemperature: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">N8N</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Base URL</label>
                <Input value={ai.n8nBaseUrl} onChange={e => updateAi({ n8nBaseUrl: e.target.value })} placeholder="https://n8n.example.com" />
              </div>
              <SecretField label="API Key" value={ai.n8nApiKey} onChange={v => updateAi({ n8nApiKey: v })} />
              <div className="flex items-center gap-3">
                <Switch checked={ai.n8nEnabled} onCheckedChange={v => updateAi({ n8nEnabled: v })} />
                <span className="text-sm">Enable N8N</span>
              </div>
              <TestButton id="n8n" onClick={() => testChannel("n8n")} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: Health ── */}
        <TabsContent value="health" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Auto-refreshes every 30s</p>
            <Button variant="outline" size="sm" onClick={fetchHealth} disabled={healthLoading} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {health.length === 0 && !healthLoading && (
            <Card className="py-12 text-center text-muted-foreground">
              <p>No health data available. Make sure the backend is running.</p>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {health.map(s => (
              <Card key={s.name}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    {s.details && <p className="text-xs text-muted-foreground mt-0.5">{s.details}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.latencyMs !== undefined && <span className="text-xs text-muted-foreground">{s.latencyMs}ms</span>}
                    <div className={`w-2.5 h-2.5 rounded-full ${s.status === "healthy" ? "bg-green-500" : s.status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {breakers.length > 0 && (
            <>
              <h3 className="font-display font-bold text-base mt-4">Circuit Breakers</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {breakers.map(cb => (
                  <Card key={cb.name} className={cbBg(cb.state)}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium">{cb.name}</span>
                        <Badge className={`${cbColor(cb.state)} bg-transparent border`}>{cb.state}</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Failures: {cb.failures}</span>
                        <span>Successes: {cb.successes}</span>
                      </div>
                      {cb.lastFailure && <p className="text-xs text-muted-foreground">Last failure: {new Date(cb.lastFailure).toLocaleString()}</p>}
                      {cb.state === "OPEN" && (
                        <Button variant="outline" size="sm" className="mt-1"
                          onClick={async () => {
                            try {
                              await apiPost(`/api/admin/circuit-breakers/reset`, { name: cb.name });
                              fetchHealth();
                              toast({ title: "Circuit breaker reset" });
                            } catch { toast({ title: "Reset failed", variant: "destructive" }); }
                          }}>
                          Reset
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
