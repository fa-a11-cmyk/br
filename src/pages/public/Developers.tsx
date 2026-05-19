import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHead from "@/components/PageHead";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xxxx.supabase.co";

const sections = [
  { id: "auth", title: "Authentification", content: `Toutes les requêtes à l'API RapidoMeet transitent par l'edge function api-gateway.\n\nDeux modes d'authentification :\n\n1. Clé API (recommandé pour les intégrations) :\n   Header: X-Api-Key: rm_live_xxxxxxxxxxxxxxxxxxxx\n\n2. JWT Supabase (pour les appels depuis le frontend) :\n   Header: Authorization: Bearer <jwt_token>\n\nLes clés API sont disponibles dans votre tableau de bord → API & Clés d'accès.` },
  { id: "limits", title: "Rate limits", content: "L'API est limitée à 100 requêtes par minute par clé API. Les headers de réponse incluent X-RateLimit-Limit, X-RateLimit-Remaining et X-RateLimit-Reset." },
  { id: "errors", title: "Erreurs", content: "Les erreurs suivent le format standard :\n\n{ \"error\": \"not_found\" }\n\nCodes HTTP : 400 Bad Request, 401 Unauthorized, 404 Not Found, 429 Too Many Requests, 500 Internal Server Error" },
];

const endpoints = [
  {
    method: "GET", path: "/v1/meetings", title: "Lister les réunions",
    request: `curl -X POST ${SUPABASE_URL}/functions/v1/api-gateway \\\n  -H "Content-Type: application/json" \\\n  -H "X-Api-Key: rm_live_xxx" \\\n  -d '{"endpoint": "/v1/meetings", "params": {"limit": 10}}'`,
    response: `{\n  "meetings": [...],\n  "count": 10\n}`,
    playgroundParams: "endpoint=/v1/meetings&limit=10",
  },
  {
    method: "GET", path: "/v1/meetings/:id", title: "Détail d'une réunion",
    request: `curl -X POST ${SUPABASE_URL}/functions/v1/api-gateway \\\n  -H "Content-Type: application/json" \\\n  -H "X-Api-Key: rm_live_xxx" \\\n  -d '{"endpoint": "/v1/meetings/<MEETING_ID>"}'`,
    response: `{\n  "meeting": {\n    "id": "...",\n    "title": "Sprint 12",\n    "status": "completed",\n    "summary": "...",\n    "duration_seconds": 2820\n  }\n}`,
    playgroundParams: "endpoint=/v1/meetings/:id",
  },
  {
    method: "GET", path: "/v1/tasks", title: "Lister les tâches",
    request: `curl -X POST ${SUPABASE_URL}/functions/v1/api-gateway \\\n  -H "Content-Type: application/json" \\\n  -H "X-Api-Key: rm_live_xxx" \\\n  -d '{"endpoint": "/v1/tasks", "params": {"limit": 20}}'`,
    response: `{\n  "tasks": [...],\n  "count": 20\n}`,
    playgroundParams: "endpoint=/v1/tasks&limit=20",
  },
  {
    method: "GET", path: "/v1/reports/:meetingId", title: "Rapport d'une réunion",
    request: `curl -X POST ${SUPABASE_URL}/functions/v1/api-gateway \\\n  -H "Content-Type: application/json" \\\n  -H "X-Api-Key: rm_live_xxx" \\\n  -d '{"endpoint": "/v1/reports/<MEETING_ID>"}'`,
    response: `{\n  "report": {\n    "id": "...",\n    "title": "Rapport — Sprint 12",\n    "content_json": {...}\n  }\n}`,
    playgroundParams: "endpoint=/v1/reports/:meetingId",
  },
  {
    method: "GET", path: "/v1/decisions/:meetingId", title: "Décisions d'une réunion",
    request: `curl -X POST ${SUPABASE_URL}/functions/v1/api-gateway \\\n  -H "Content-Type: application/json" \\\n  -H "X-Api-Key: rm_live_xxx" \\\n  -d '{"endpoint": "/v1/decisions/<MEETING_ID>"}'`,
    response: `{\n  "decisions": [\n    {"id": "...", "content": "..."}\n  ]\n}`,
    playgroundParams: "endpoint=/v1/decisions/:meetingId",
  },
  {
    method: "GET", path: "/v1/contacts/:meetingId", title: "Contacts détectés",
    request: `curl -X POST ${SUPABASE_URL}/functions/v1/api-gateway \\\n  -H "Content-Type: application/json" \\\n  -H "X-Api-Key: rm_live_xxx" \\\n  -d '{"endpoint": "/v1/contacts/<MEETING_ID>"}'`,
    response: `{\n  "contacts": [\n    {"name": "...", "score": 80}\n  ]\n}`,
    playgroundParams: "endpoint=/v1/contacts/:meetingId",
  },
];

const nav = [
  { group: "Introduction", items: [{ id: "auth", label: "Authentification" }, { id: "limits", label: "Rate limits" }, { id: "errors", label: "Erreurs" }] },
  { group: "Endpoints", items: endpoints.map((e, i) => ({ id: `ep_${i}`, label: `${e.method} ${e.path}` })) },
];

const Developers = () => {
  const [activeSection, setActiveSection] = useState("auth");
  const navigate = useNavigate();

  const methodColor = (m: string) => {
    if (m === "POST") return "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]";
    if (m === "GET") return "bg-accent/15 text-accent";
    if (m === "PATCH") return "bg-amber-500/15 text-amber-500";
    if (m === "DELETE") return "bg-destructive/15 text-destructive";
    return "";
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHead title="API pour Développeurs" description="Explorez l'API REST RapidoMeet : endpoints, authentification, rate limits et exemples de code pour intégrer la transcription IA." path="/developers" />
      <div className="border-b border-border/30 px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3">
          <a href="/" className="font-display font-extrabold text-gradient text-lg">RapidoMeet</a>
          <span className="font-mono text-xs text-muted-foreground">API Documentation v1.0</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto flex">
        {/* Sidebar */}
        <aside className="w-[240px] shrink-0 border-r border-border/30 py-8 pr-6 sticky top-0 h-screen overflow-y-auto hidden lg:block">
          {nav.map((group) => (
            <div key={group.group} className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{group.group}</p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`block w-full text-left px-3 py-1.5 rounded-md text-xs font-body transition-colors ${
                    activeSection === item.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 py-8 px-8 max-w-[800px]">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="mb-12">
              <h2 className="font-display font-extrabold text-xl text-foreground mb-4">{s.title}</h2>
              <pre className="bg-card rounded-xl p-5 text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed border border-border/30">{s.content}</pre>
            </section>
          ))}

          <h2 className="font-display font-extrabold text-xl text-foreground mb-6">Endpoints</h2>

          {endpoints.map((ep, i) => (
            <section key={i} id={`ep_${i}`} className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${methodColor(ep.method)}`}>{ep.method}</span>
                <code className="font-mono text-sm text-foreground">{ep.path}</code>
                <span className="text-xs text-muted-foreground ml-2">{ep.title}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Requête</p>
                  <pre className="bg-card rounded-xl p-4 text-xs font-mono text-foreground/80 whitespace-pre-wrap border border-border/30 relative">
                    {ep.request}
                    <button onClick={() => { navigator.clipboard.writeText(ep.request); }} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/50">📋 Copier</button>
                  </pre>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Réponse</p>
                  <pre className="bg-card rounded-xl p-4 text-xs font-mono text-[hsl(var(--success))]/80 whitespace-pre-wrap border border-border/30">{ep.response}</pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/docs/playground?${ep.playgroundParams}`)}
                  className="text-xs"
                >
                  🧪 Tester dans le Playground →
                </Button>
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};

export default Developers;
