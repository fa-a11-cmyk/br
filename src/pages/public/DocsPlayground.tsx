import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Book, FlaskConical, Package, FileText, Key, Send, Copy, Clock, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";

const topNav = [
  { label: "Docs", icon: Book, href: "/docs" },
  { label: "API Playground", icon: FlaskConical, href: "/docs/playground", active: true },
  { label: "SDKs", icon: Package, href: "/docs#sdks" },
  { label: "Changelog", icon: FileText, href: "/changelog" },
  { label: "Obtenir une clé API →", icon: Key, href: "/app/api-keys", accent: true },
];

interface EndpointOption {
  method: string;
  path: string;
  label: string;
  group: string;
  paramFields: ParamField[];
}

interface ParamField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "meeting-select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

const ENDPOINT_OPTIONS: EndpointOption[] = [
  {
    method: "GET", path: "/v1/meetings", label: "Liste toutes vos réunions", group: "Réunions",
    paramFields: [
      { key: "limit", label: "Limite", type: "number", placeholder: "10", defaultValue: "10" },
      { key: "status", label: "Statut", type: "select", options: [
        { value: "all", label: "Tous" }, { value: "pending", label: "pending" },
        { value: "completed", label: "completed" }, { value: "failed", label: "failed" },
      ]},
    ],
  },
  {
    method: "GET", path: "/v1/meetings/:id", label: "Détail d'une réunion", group: "Réunions",
    paramFields: [
      { key: "meetingId", label: "Meeting ID", type: "meeting-select", required: true, placeholder: "UUID" },
    ],
  },
  {
    method: "GET", path: "/v1/tasks", label: "Toutes vos tâches extraites", group: "Tâches & Analyses",
    paramFields: [
      { key: "limit", label: "Limite", type: "number", placeholder: "20", defaultValue: "20" },
      { key: "status", label: "Statut", type: "select", options: [
        { value: "all", label: "Tous" }, { value: "pending", label: "pending" },
        { value: "in_progress", label: "in_progress" }, { value: "done", label: "done" },
      ]},
      { key: "meeting_id", label: "Meeting ID (optionnel)", type: "text", placeholder: "UUID" },
    ],
  },
  {
    method: "GET", path: "/v1/decisions/:meetingId", label: "Décisions d'une réunion", group: "Tâches & Analyses",
    paramFields: [
      { key: "meetingId", label: "Meeting ID", type: "meeting-select", required: true, placeholder: "UUID" },
    ],
  },
  {
    method: "GET", path: "/v1/contacts/:meetingId", label: "Contacts détectés", group: "Tâches & Analyses",
    paramFields: [
      { key: "meetingId", label: "Meeting ID", type: "meeting-select", required: true, placeholder: "UUID" },
    ],
  },
  {
    method: "GET", path: "/v1/reports/:meetingId", label: "Rapport d'une réunion", group: "Rapports",
    paramFields: [
      { key: "meetingId", label: "Meeting ID", type: "meeting-select", required: true, placeholder: "UUID" },
    ],
  },
];

interface ApiKeyItem { id: string; name: string; prefix: string; }
interface RecentMeeting { id: string; title: string; status: string; }
interface ResponseData {
  status: number;
  body: any;
  duration: number;
  size: string;
  timestamp: string;
}
interface HistoryItem {
  id: string;
  endpoint: string;
  params: any;
  response_status: number;
  response_body: any;
  duration_ms: number;
  used_api_key: boolean;
  created_at: string;
}

function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-blue-400"; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = "text-purple-400"; // key
        else cls = "text-green-400"; // string
      } else if (/true|false/.test(match)) cls = "text-orange-400"; // boolean
      else if (/null/.test(match)) cls = "text-muted-foreground"; // null
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

const ERROR_SUGGESTIONS: Record<number, string> = {
  401: "Vérifiez votre clé API ou reconnectez-vous.",
  403: "Vous n'avez pas accès à cette ressource.",
  404: "Ressource introuvable — vérifiez l'ID.",
  429: "Rate limit atteint — attendez 1 minute.",
  500: "Erreur serveur — contactez le support.",
};

const DocsPlayground = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [authMode, setAuthMode] = useState<"jwt" | "api_key">("jwt");
  const [apiKeyValue, setApiKeyValue] = useState(() => sessionStorage.getItem("playground_api_key") || "");
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<RecentMeeting[]>([]);
  const [params, setParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const ep = ENDPOINT_OPTIONS[selectedIdx];

  // Load API keys and recent meetings
  useEffect(() => {
    if (!user) return;
    supabase.from("api_keys").select("id, name, prefix").then(({ data }) => {
      setApiKeys((data as ApiKeyItem[]) || []);
      if (data && data.length > 0) setAuthMode("api_key");
    });
    supabase.from("meetings").select("id, title, status").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setRecentMeetings((data as RecentMeeting[]) || []));
  }, [user]);

  // Load history
  const loadHistory = useCallback(async () => {
    if (!user) return;
    const q = supabase.from("playground_history" as any) as any;
    const { data } = await q.select("*")
      .order("created_at", { ascending: false }).limit(50);
    setHistory((data as any[]) || []);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Read prefilled params from URL
  useEffect(() => {
    const preEndpoint = searchParams.get("endpoint");
    if (preEndpoint) {
      const idx = ENDPOINT_OPTIONS.findIndex(e => e.path === preEndpoint);
      if (idx >= 0) {
        setSelectedIdx(idx);
        const newParams: Record<string, string> = {};
        const limit = searchParams.get("limit");
        if (limit) newParams.limit = limit;
        setParams(newParams);
      }
    }
  }, [searchParams]);

  // Save API key to session storage
  useEffect(() => {
    if (apiKeyValue) sessionStorage.setItem("playground_api_key", apiKeyValue);
    else sessionStorage.removeItem("playground_api_key");
  }, [apiKeyValue]);

  const handleSelectEndpoint = (idx: number) => {
    setSelectedIdx(idx);
    setResponse(null);
    // Set default params
    const defaults: Record<string, string> = {};
    ENDPOINT_OPTIONS[idx].paramFields.forEach(f => {
      if (f.defaultValue) defaults[f.key] = f.defaultValue;
    });
    setParams(defaults);
  };

  const buildCurlCommand = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let resolvedEndpoint = ep.path;
    if (resolvedEndpoint.includes(":id")) resolvedEndpoint = resolvedEndpoint.replace(":id", params.meetingId || "<ID>");
    if (resolvedEndpoint.includes(":meetingId")) resolvedEndpoint = resolvedEndpoint.replace(":meetingId", params.meetingId || "<MEETING_ID>");

    const bodyParams: Record<string, any> = {};
    if (params.limit) bodyParams.limit = Number(params.limit);
    if (params.status && params.status !== "all") bodyParams.status = params.status;
    if (params.meeting_id) bodyParams.meeting_id = params.meeting_id;

    const authHeader = authMode === "api_key"
      ? `  -H "X-Api-Key: ${apiKeyValue || "rm_live_xxx..."}" \\`
      : `  -H "Authorization: Bearer <JWT_TOKEN>" \\`;

    return `curl -X POST \\
  ${supabaseUrl}/functions/v1/api-gateway \\
  -H "Content-Type: application/json" \\
${authHeader}
  -d '${JSON.stringify({ endpoint: resolvedEndpoint, method: "GET", params: Object.keys(bodyParams).length > 0 ? bodyParams : undefined }, null, 2)}'`;
  };

  const handleSend = async () => {
    if (!user) { toast({ title: "Connectez-vous d'abord", variant: "destructive" }); return; }
    setSending(true);
    const startTime = Date.now();

    try {
      let resolvedEndpoint = ep.path;
      if (resolvedEndpoint.includes(":id")) resolvedEndpoint = resolvedEndpoint.replace(":id", params.meetingId || "");
      if (resolvedEndpoint.includes(":meetingId")) resolvedEndpoint = resolvedEndpoint.replace(":meetingId", params.meetingId || "");

      const bodyParams: Record<string, any> = {};
      if (params.limit) bodyParams.limit = Number(params.limit);
      if (params.status && params.status !== "all") bodyParams.status = params.status;
      if (params.meeting_id) bodyParams.meeting_id = params.meeting_id;

      const body = {
        endpoint: resolvedEndpoint,
        method: "GET",
        params: Object.keys(bodyParams).length > 0 ? bodyParams : undefined,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      let usedApiKey = false;

      if (authMode === "api_key") {
        if (!apiKeyValue) throw new Error("Collez votre clé API. Elle n'est visible qu'une fois lors de sa création.");
        headers["X-Api-Key"] = apiKeyValue;
        usedApiKey = true;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Session expirée — reconnectez-vous");
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/api-gateway`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const duration = Date.now() - startTime;
      const responseBody = await res.json();
      const responseSize = (JSON.stringify(responseBody).length / 1024).toFixed(2);

      setResponse({ status: res.status, body: responseBody, duration, size: responseSize, timestamp: new Date().toISOString() });

      // Save to history, then purge old entries
      const insertQ = supabase.from("playground_history" as any) as any;
      await insertQ.insert({
        user_id: user.id,
        endpoint: resolvedEndpoint,
        params: bodyParams,
        response_status: res.status,
        response_body: responseBody,
        duration_ms: duration,
        used_api_key: usedApiKey,
      });

      // Purge entries beyond 50
      const purgeQuery = supabase.from("playground_history" as any) as any;
      const { data: allHist } = await purgeQuery.select("id").eq("user_id", user.id).order("created_at", { ascending: false });
      if (allHist && allHist.length > 50) {
        const idsToDelete = allHist.slice(50).map((h: any) => h.id);
        const deleteQuery = supabase.from("playground_history" as any) as any;
        await deleteQuery.delete().in("id", idsToDelete);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      setResponse({ status: 0, body: { error: error.message }, duration, size: "0", timestamp: new Date().toISOString() });
    } finally {
      setSending(false);
      loadHistory();
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response?.body, null, 2) || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(buildCurlCommand());
    toast({ title: "Commande curl copiée" });
  };

  const clearHistory = async () => {
    if (!user) return;
    const q = supabase.from("playground_history" as any) as any;
    await q.delete().eq("user_id", user.id);
    setHistory([]);
    toast({ title: "Historique effacé" });
  };

  const restoreFromHistory = (item: HistoryItem) => {
    const idx = ENDPOINT_OPTIONS.findIndex(e => {
      const resolved = e.path.replace(":id", "").replace(":meetingId", "");
      return item.endpoint.startsWith(resolved.replace(/\/$/, ""));
    });
    if (idx >= 0) setSelectedIdx(idx);
    setParams(item.params || {});
    setResponse({
      status: item.response_status,
      body: item.response_body,
      duration: item.duration_ms,
      size: (JSON.stringify(item.response_body).length / 1024).toFixed(2),
      timestamp: item.created_at,
    });
  };

  const statusColor = (s: number) => {
    if (s === 0) return "text-destructive";
    if (s < 300) return "text-[hsl(var(--success))]";
    if (s < 500) return "text-amber-500";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Top Bar */}
      <div className="border-b border-border/30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-10 py-3">
          <div className="flex items-center gap-4 overflow-x-auto">
            {topNav.map((n) => (
              <Link key={n.label} to={n.href} className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap transition-colors ${n.active ? "text-foreground" : n.accent ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <n.icon className="w-3.5 h-3.5" />
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-10 py-8">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl mb-2 text-foreground">
          🧪 API Playground
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Testez l'API RapidoMeet en temps réel avec vos vraies données.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — Configuration (35%) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Auth mode */}
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2 block font-bold">Authentification</label>
              <RadioGroup value={authMode} onValueChange={(v) => setAuthMode(v as "jwt" | "api_key")} className="gap-2">
                <div className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${authMode === "jwt" ? "border-primary/50 bg-primary/5" : "border-border/30"}`}>
                  <RadioGroupItem value="jwt" id="jwt" />
                  <Label htmlFor="jwt" className="cursor-pointer">
                    <span className="text-xs font-medium">Session courante (JWT)</span>
                    <span className="block text-[10px] text-muted-foreground">Recommandé pour les tests rapides</span>
                  </Label>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${authMode === "api_key" ? "border-primary/50 bg-primary/5" : "border-border/30"}`}>
                  <RadioGroupItem value="api_key" id="api_key" />
                  <Label htmlFor="api_key" className="cursor-pointer">
                    <span className="text-xs font-medium">Clé API</span>
                    <span className="block text-[10px] text-muted-foreground">{apiKeys.length > 0 ? `${apiKeys.length} clé(s) disponible(s)` : "Créez une clé dans API & Clés"}</span>
                  </Label>
                </div>
              </RadioGroup>

              {authMode === "api_key" && (
                <div className="mt-3 space-y-2">
                  <Input
                    type="password"
                    placeholder="rm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={apiKeyValue}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    className="font-mono text-xs bg-muted/30 border-border/30"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    ⚠️ La clé n'est visible qu'une fois lors de sa création.{" "}
                    <button onClick={() => navigate("/app/api-keys")} className="text-primary underline">Gérer mes clés</button>
                  </p>
                </div>
              )}
            </div>

            {/* Endpoint select */}
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 block font-bold">Endpoint</label>
              <div className="relative">
                <select
                  value={selectedIdx}
                  onChange={(e) => handleSelectEndpoint(Number(e.target.value))}
                  className="w-full bg-card border border-border/30 rounded-lg px-4 py-2.5 text-xs font-mono text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  {(() => {
                    let lastGroup = "";
                    return ENDPOINT_OPTIONS.map((o, i) => {
                      const showGroup = o.group !== lastGroup;
                      lastGroup = o.group;
                      return (
                        <option key={i} value={i}>
                          {showGroup ? `── ${o.group} ── ` : ""}{o.method} {o.path} — {o.label}
                        </option>
                      );
                    });
                  })()}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Dynamic params */}
            {ep.paramFields.length > 0 && (
              <div className="space-y-3">
                <label className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block font-bold">Paramètres</label>
                {ep.paramFields.map((field) => (
                  <div key={field.key}>
                    <label className="text-[10px] text-muted-foreground block mb-1">{field.label}{field.required && " *"}</label>
                    {field.type === "number" && (
                      <Input type="number" placeholder={field.placeholder} value={params[field.key] || ""} onChange={(e) => setParams(p => ({ ...p, [field.key]: e.target.value }))} className="font-mono text-xs bg-muted/30 border-border/30" />
                    )}
                    {field.type === "text" && (
                      <Input placeholder={field.placeholder} value={params[field.key] || ""} onChange={(e) => setParams(p => ({ ...p, [field.key]: e.target.value }))} className="font-mono text-xs bg-muted/30 border-border/30" />
                    )}
                    {field.type === "select" && (
                      <Select value={params[field.key] || "all"} onValueChange={(v) => setParams(p => ({ ...p, [field.key]: v }))}>
                        <SelectTrigger className="bg-muted/30 border-border/30 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {field.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === "meeting-select" && (
                      <div className="space-y-1.5">
                        <Input placeholder={field.placeholder} value={params[field.key] || ""} onChange={(e) => setParams(p => ({ ...p, [field.key]: e.target.value }))} className="font-mono text-xs bg-muted/30 border-border/30" />
                        {recentMeetings.length > 0 && (
                          <Select value="" onValueChange={(v) => setParams(p => ({ ...p, [field.key]: v }))}>
                            <SelectTrigger className="bg-muted/30 border-border/30 text-xs"><SelectValue placeholder="Ou choisir une réunion récente…" /></SelectTrigger>
                            <SelectContent>
                              {recentMeetings.map(m => (
                                <SelectItem key={m.id} value={m.id}>
                                  <span className="truncate">{m.title}</span>
                                  <span className="text-muted-foreground ml-2">({m.status})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Send button */}
            <Button onClick={handleSend} disabled={sending || !user} className="w-full">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {sending ? "Envoi en cours…" : "▶ Envoyer la requête"}
            </Button>

            {!user && <p className="text-xs text-destructive text-center">Connectez-vous pour tester l'API.</p>}

            {/* Curl preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold">curl</label>
                <button onClick={copyCurl} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Copier
                </button>
              </div>
              <pre className="bg-card rounded-lg p-3 text-[10px] font-mono text-foreground/70 whitespace-pre-wrap border border-border/30 overflow-x-auto max-h-[200px]">
                {buildCurlCommand()}
              </pre>
            </div>
          </div>

          {/* RIGHT — Response (65%) */}
          <div className="lg:col-span-3">
            {response ? (
              <div className="space-y-4">
                {/* Response header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-sm font-bold font-mono ${statusColor(response.status)}`}>
                    {response.status || "ERR"}
                  </span>
                  <span className="text-xs text-muted-foreground">· {response.duration}ms</span>
                  <span className="text-xs text-muted-foreground">· {response.size} KB</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{new Date(response.timestamp).toLocaleTimeString("fr-FR")}</span>
                </div>

                {/* Error suggestion */}
                {response.status >= 400 && ERROR_SUGGESTIONS[response.status] && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                    💡 {ERROR_SUGGESTIONS[response.status]}
                  </div>
                )}

                {/* Response body */}
                <div className="relative group">
                  <pre
                    className={`rounded-xl p-4 text-xs font-mono whitespace-pre-wrap border overflow-x-auto max-h-[500px] overflow-y-auto ${
                      response.status >= 400 ? "bg-destructive/5 border-destructive/20" : "bg-card border-border/30"
                    }`}
                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(response.body, null, 2)) }}
                  />
                  <button
                    onClick={copyResponse}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono px-2 py-1 rounded bg-muted border border-border/30 text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> {copied ? "Copié" : "Copier"}
                  </button>
                </div>

                {/* History accordion */}
                {history.length > 0 && (
                  <Accordion type="single" collapsible className="mt-4">
                    <AccordionItem value="history" className="border-border/30">
                      <AccordionTrigger className="text-xs font-mono">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Historique ({history.length})</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex justify-end mb-2">
                          <button onClick={clearHistory} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Effacer
                          </button>
                        </div>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                          {history.map((h) => (
                            <button
                              key={h.id}
                              onClick={() => restoreFromHistory(h)}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/10 text-[10px] hover:bg-muted/40 transition-colors text-left"
                            >
                              <span className="font-mono font-bold text-primary">GET</span>
                              <span className="font-mono text-foreground/70 truncate flex-1">{h.endpoint}</span>
                              <span className={`font-mono ${statusColor(h.response_status)}`}>{h.response_status}</span>
                              <span className="text-muted-foreground">{h.duration_ms}ms</span>
                              <span className="text-muted-foreground/50">{new Date(h.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center rounded-xl border border-border/30 bg-card/50">
                <FlaskConical className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">👋 Bienvenue dans le Playground RapidoMeet</p>
                <p className="text-xs text-muted-foreground/60 mt-2 max-w-[300px]">
                  Sélectionnez un endpoint et cliquez sur "Envoyer la requête" pour tester l'API en live. Les données affichées sont vos vraies données.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsPlayground;
