import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Book, FlaskConical, Package, FileText, Key, ChevronRight, Copy, Check, ExternalLink, Download, Server, Shield, AlertTriangle, Globe } from "lucide-react";
import PageHead from "@/components/PageHead";

/* ─── DATA ─── */

const topNav = [
  { label: "Docs", icon: Book, href: "/docs", active: true },
  { label: "API Playground", icon: FlaskConical, href: "/docs/playground" },
  { label: "SDKs", icon: Package, href: "/docs#sdks" },
  { label: "Changelog", icon: FileText, href: "/changelog" },
  { label: "Obtenir une clé API →", icon: Key, href: "/app/api-keys", accent: true },
];

const sidebarNav = [
  {
    group: "Introduction",
    items: [
      { id: "intro", label: "Vue d'ensemble" },
      { id: "auth", label: "Authentification" },
      { id: "envs", label: "Environnements" },
      { id: "limits", label: "Rate limits" },
    ],
  },
  {
    group: "Endpoints",
    items: [
      { id: "ep-create-meeting", label: "POST /meetings" },
      { id: "ep-list-meetings", label: "GET /meetings" },
      { id: "ep-get-meeting", label: "GET /meetings/:id" },
      { id: "ep-import", label: "POST /transcriptions/import" },
      { id: "ep-send-report", label: "POST /reports/:id/send" },
      { id: "ep-tasks", label: "GET /tasks" },
      { id: "ep-webhooks", label: "POST /webhooks" },
    ],
  },
  {
    group: "Avancé",
    items: [
      { id: "errors", label: "Gestion des erreurs" },
      { id: "pagination", label: "Pagination" },
      { id: "webhooks-guide", label: "Guide Webhooks" },
      { id: "streaming", label: "Streaming" },
      { id: "n8n", label: "Intégration N8N" },
      { id: "sdks", label: "SDKs" },
      { id: "openapi", label: "OpenAPI Spec" },
    ],
  },
];

const environments = [
  { name: "Production", url: "https://api.rapidomeet.io/v1", usage: "Données réelles", color: "success" },
  { name: "Sandbox", url: "https://sandbox.api.rapidomeet.io/v1", usage: "Tests (sans frais)", color: "warning" },
  { name: "Local (dev)", url: "http://localhost:3001/v1", usage: "Dev local", color: "gray-1" },
];

const sandboxFeatures = {
  included: ["Quota illimité (pas de débit API)", "Transcriptions simulées (réponse instantanée)", "Webhooks testables sans serveur externe", "Clés préfixées rm_test_ (jamais rm_live_)"],
  excluded: ["Pas d'envoi WhatsApp/Telegram réel", "OpenClaw simulé (actions loguées, non exécutées)"],
};

const errorCodes = [
  { code: "INVALID_API_KEY", http: 401, desc: "Clé API invalide/révoquée", action: "Vérifier /app/api-keys" },
  { code: "EXPIRED_API_KEY", http: 401, desc: "Clé expirée", action: "Renouveler la clé" },
  { code: "INSUFFICIENT_PERMISSIONS", http: 403, desc: "Droits insuffisants", action: "Vérifier les scopes" },
  { code: "WORKSPACE_SUSPENDED", http: 403, desc: "Workspace suspendu", action: "Contacter support" },
  { code: "QUOTA_TRANSCRIPTIONS", http: 402, desc: "Quota dépassé", action: "Upgrader le plan" },
  { code: "QUOTA_API_CALLS", http: 429, desc: "Rate limit atteint", action: "Attendre (voir headers)" },
  { code: "RESOURCE_NOT_FOUND", http: 404, desc: "Réunion/rapport introuvable", action: "Vérifier l'ID" },
  { code: "AUDIO_FORMAT_INVALID", http: 422, desc: "Format audio non supporté", action: "Convertir en MP3" },
  { code: "AUDIO_TOO_LARGE", http: 413, desc: "Fichier > 500 Mo", action: "Compresser le fichier" },
  { code: "AUDIO_TOO_SHORT", http: 422, desc: "Audio < 30 secondes", action: "Minimum 30s requis" },
  { code: "AUDIO_NO_SPEECH", http: 422, desc: "Aucune voix détectée", action: "Vérifier l'audio" },
  { code: "TRANSCRIPTION_FAILED", http: 500, desc: "Erreur STT (transitoire)", action: "Retry dans 30s" },
  { code: "NLP_FAILED", http: 500, desc: "Erreur analyse NLP", action: "Retry dans 60s" },
  { code: "OPENCLAW_UNAVAILABLE", http: 503, desc: "Instance OpenClaw hors ligne", action: "Retry + alerter support" },
  { code: "N8N_CONNECTION_FAILED", http: 503, desc: "N8N non joignable", action: "Vérifier la connexion" },
  { code: "CRM_CONNECTION_FAILED", http: 503, desc: "CRM non joignable", action: "Vérifier l'intégration" },
  { code: "WEBHOOK_URL_UNREACHABLE", http: 422, desc: "URL webhook non accessible", action: "Tester l'URL" },
];

const endpoints = [
  {
    id: "ep-create-meeting",
    method: "POST",
    path: "/meetings",
    title: "Créer et analyser une réunion",
    desc: "Créez une nouvelle réunion et lancez l'analyse automatique (transcription, NLP, scénarios).",
    request: `{
  "title": "Sprint 12 BraindCode",
  "type": "tech",
  "audio_url": "https://cdn.example.com/meeting.mp3",
  "language": "fr",
  "participants": [
    { "name": "Ahmed B.", "email": "ahmed@braindcode.com" }
  ],
  "scenarios": ["n2", "n4"],
  "webhook_url": "https://your-server.com/hook"
}`,
    response: `{
  "id": "meet_abc123",
  "status": "processing",
  "created_at": "2026-03-18T14:32:00Z",
  "estimated_completion_at": "2026-03-18T14:35:00Z"
}`,
    params: [
      { name: "title", type: "string", required: true, desc: "Titre de la réunion (max 255 car.)" },
      { name: "type", type: "enum", required: false, desc: "commercial | tech | retro | onboarding | rh | marketing | autre" },
      { name: "audio_url", type: "uri", required: false, desc: "URL publique du fichier audio" },
      { name: "language", type: "enum", required: false, desc: "fr | en | ar | auto (défaut: auto)" },
      { name: "participants", type: "array", required: false, desc: "Liste des participants" },
      { name: "scenarios", type: "array", required: false, desc: "Scénarios N8N à déclencher (n1-n8)" },
      { name: "webhook_url", type: "uri", required: false, desc: "URL pour recevoir les événements" },
    ],
  },
  {
    id: "ep-list-meetings",
    method: "GET",
    path: "/meetings",
    title: "Lister les réunions",
    desc: "Récupérez la liste paginée de vos réunions avec filtres et tri.",
    request: `curl https://api.rapidomeet.io/v1/meetings?limit=20&sort=created_at:desc&filter[status]=completed \\
  -H "Authorization: Bearer rm_live_xxx"`,
    response: `{
  "data": [
    { "id": "meet_abc123", "title": "Sprint 12", "status": "completed", ... }
  ],
  "meta": {
    "total": 247,
    "count": 20,
    "has_more": true,
    "next_cursor": "eyJjcmVh..."
  }
}`,
    params: [
      { name: "limit", type: "integer", required: false, desc: "Nombre de résultats (défaut: 20, max: 100)" },
      { name: "cursor", type: "string", required: false, desc: "Cursor de pagination" },
      { name: "sort", type: "string", required: false, desc: "Champ:direction (created_at:desc)" },
      { name: "filter[status]", type: "string", required: false, desc: "Filtrer par statut" },
      { name: "filter[type]", type: "string", required: false, desc: "Filtrer par type" },
    ],
  },
  {
    id: "ep-get-meeting",
    method: "GET",
    path: "/meetings/:id",
    title: "Détail d'une réunion",
    desc: "Récupérez tous les détails d'une réunion : transcription, tâches, décisions, sentiment.",
    request: `curl https://api.rapidomeet.io/v1/meetings/meet_abc123 \\
  -H "Authorization: Bearer rm_live_xxx"`,
    response: `{
  "id": "meet_abc123",
  "title": "Sprint 12 BraindCode",
  "status": "completed",
  "duration": 2820,
  "precision_percent": 94,
  "summary": "L'équipe a validé le lancement...",
  "tasks": [
    { "id": "task_001", "title": "Brief stagiaires", "assignee": "Michael", "deadline": "2026-03-24T09:00:00Z", "priority": "high" }
  ],
  "decisions": [
    { "text": "Lancement validé pour VivaTech", "timestamp": "00:04:12" }
  ],
  "sentiment": { "score": 78, "label": "Positif" }
}`,
    params: [
      { name: "id", type: "string", required: true, desc: "ID de la réunion (path param)" },
    ],
  },
  {
    id: "ep-import",
    method: "POST",
    path: "/transcriptions/import",
    title: "Importer un fichier audio",
    desc: "Importez un fichier audio existant (MP3, WAV, M4A, FLAC) pour analyse.",
    request: `curl -X POST https://api.rapidomeet.io/v1/transcriptions/import \\
  -H "Authorization: Bearer rm_live_xxx" \\
  -F "file=@meeting.mp3" \\
  -F "title=Réunion client" \\
  -F "language=fr" \\
  -F "diarization=true"`,
    response: `{
  "id": "meet_xyz789",
  "status": "processing",
  "file_size": "24.5 MB",
  "estimated_time": "3 minutes"
}`,
    params: [
      { name: "file", type: "binary", required: true, desc: "Fichier audio (max 500 Mo)" },
      { name: "title", type: "string", required: false, desc: "Titre de la réunion" },
      { name: "language", type: "enum", required: false, desc: "fr | en | ar | auto" },
      { name: "diarization", type: "boolean", required: false, desc: "Activer la diarisation (défaut: true)" },
      { name: "speakers_count", type: "integer", required: false, desc: "Nombre de locuteurs attendu" },
    ],
  },
  {
    id: "ep-send-report",
    method: "POST",
    path: "/reports/:id/send",
    title: "Envoyer un rapport",
    desc: "Distribuez le rapport sur un ou plusieurs canaux.",
    request: `{
  "channels": ["whatsapp", "email", "slack"],
  "recipients": [
    { "email": "team@braindcode.com" },
    { "phone": "+33612345678" }
  ],
  "format": "pdf"
}`,
    response: `{
  "sent": true,
  "channels": [
    { "type": "whatsapp", "status": "delivered", "message_id": "msg_abc" },
    { "type": "email", "status": "sent", "message_id": "mail_xyz" },
    { "type": "slack", "status": "sent", "channel": "#meeting-reports" }
  ]
}`,
    params: [
      { name: "id", type: "string", required: true, desc: "ID du rapport/réunion" },
      { name: "channels", type: "array", required: true, desc: "whatsapp | email | slack | telegram" },
      { name: "recipients", type: "array", required: false, desc: "Destinataires supplémentaires" },
      { name: "format", type: "enum", required: false, desc: "pdf | html | text (défaut: pdf)" },
    ],
  },
  {
    id: "ep-tasks",
    method: "GET",
    path: "/tasks",
    title: "Lister les tâches",
    desc: "Récupérez toutes les tâches extraites par l'IA avec filtres.",
    request: `curl https://api.rapidomeet.io/v1/tasks?filter[status]=pending&sort=deadline:asc \\
  -H "Authorization: Bearer rm_live_xxx"`,
    response: `{
  "data": [
    {
      "id": "task_001",
      "title": "Brief stagiaires",
      "assignee": { "name": "Michael", "email": "michael@braindcode.com" },
      "deadline": "2026-03-24T09:00:00Z",
      "priority": "high",
      "status": "pending",
      "source_meeting": "meet_abc123",
      "source_timestamp": "00:14:23"
    }
  ],
  "meta": { "total": 312, "count": 20, "has_more": true }
}`,
    params: [
      { name: "filter[status]", type: "string", required: false, desc: "pending | in_progress | done | ignored" },
      { name: "filter[priority]", type: "string", required: false, desc: "low | medium | high | critical" },
      { name: "filter[assignee]", type: "string", required: false, desc: "Email de l'assigné" },
      { name: "sort", type: "string", required: false, desc: "deadline:asc | created_at:desc" },
    ],
  },
  {
    id: "ep-webhooks",
    method: "POST",
    path: "/webhooks",
    title: "Créer un webhook",
    desc: "Configurez un endpoint pour recevoir les événements en temps réel.",
    request: `{
  "url": "https://your-server.com/hook",
  "secret": "whsec_xxx",
  "events": ["meeting.completed", "task.created", "contact.detected"],
  "filters": {
    "meeting_type": ["commercial", "tech"],
    "min_precision": 80,
    "min_duration_seconds": 300
  },
  "metadata": {
    "team": "sales",
    "environment": "production"
  }
}`,
    response: `{
  "id": "wh_abc123",
  "url": "https://your-server.com/hook",
  "events": ["meeting.completed", "task.created", "contact.detected"],
  "status": "active",
  "created_at": "2026-03-18T14:32:00Z"
}`,
    params: [
      { name: "url", type: "uri", required: true, desc: "URL du webhook" },
      { name: "secret", type: "string", required: false, desc: "Secret HMAC pour vérification" },
      { name: "events", type: "array", required: true, desc: "Événements à écouter" },
      { name: "filters", type: "object", required: false, desc: "Filtres d'événements" },
      { name: "metadata", type: "object", required: false, desc: "Métadonnées personnalisées" },
    ],
  },
];

const webhookEvents = [
  { category: "Réunions", events: [
    { name: "meeting.started", desc: "Bot rejoint la réunion" },
    { name: "meeting.processing", desc: "Upload reçu, analyse lancée" },
    { name: "meeting.transcribed", desc: "STT terminé" },
    { name: "meeting.analyzed", desc: "NLP terminé" },
    { name: "meeting.completed", desc: "Tout terminé, rapport prêt" },
    { name: "meeting.failed", desc: "Erreur durant l'analyse" },
  ]},
  { category: "Tâches", events: [
    { name: "task.created", desc: "Tâche extraite par NLP" },
    { name: "task.updated", desc: "Statut changé" },
    { name: "task.completed", desc: "Marquée terminée" },
    { name: "task.overdue", desc: "Deadline dépassée" },
  ]},
  { category: "Rapports", events: [
    { name: "report.generated", desc: "PDF créé" },
    { name: "report.sent", desc: "Distribué sur un canal" },
    { name: "report.viewed", desc: "Lien public ouvert" },
    { name: "report.feedback", desc: "👍/👎 reçu" },
  ]},
  { category: "Contacts", events: [
    { name: "contact.detected", desc: "Prospect identifié" },
    { name: "contact.created_crm", desc: "Créé dans le CRM" },
    { name: "contact.enriched", desc: "LinkedIn/Firecrawl" },
  ]},
  { category: "Scénarios", events: [
    { name: "scenario.triggered", desc: "Scénario N8N lancé" },
    { name: "scenario.completed", desc: "Scénario N8N terminé" },
    { name: "scenario.failed", desc: "Erreur N8N" },
  ]},
  { category: "OpenClaw", events: [
    { name: "openclaw.action", desc: "Action exécutée" },
    { name: "openclaw.skill_loaded", desc: "Skill hot-reload" },
    { name: "openclaw.memory_updated", desc: "Mémoire mise à jour" },
  ]},
  { category: "Facturation", events: [
    { name: "billing.quota_80", desc: "Quota atteint à 80%" },
    { name: "billing.quota_100", desc: "Quota épuisé" },
    { name: "billing.invoice_created", desc: "Facture générée" },
  ]},
];

const retryPolicy = [
  { attempt: 1, delay: "Immédiat", condition: "Première livraison" },
  { attempt: 2, delay: "30 secondes", condition: "Si HTTP 4xx ou 5xx" },
  { attempt: 3, delay: "2 minutes", condition: "Toujours en échec" },
  { attempt: 4, delay: "10 minutes", condition: "Toujours en échec" },
  { attempt: 5, delay: "1 heure", condition: "Toujours en échec" },
  { attempt: 6, delay: "Abandon", condition: "Notification email admin" },
];

/* ─── COMPONENTS ─── */

function CodeBlock({ code, lang = "json", className = "" }: { code: string; lang?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className={`relative group ${className}`}>
      <pre className="bg-[hsl(var(--dark-1))] rounded-xl p-5 text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed border border-border/30 overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button onClick={copy} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground text-[10px] font-mono px-2 py-1 rounded-md bg-[hsl(var(--dark-3))] border border-border/30 flex items-center gap-1">
        {copied ? <><Check className="w-3 h-3" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
      </button>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    POST: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    GET: "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent-foreground))]",
    PATCH: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    DELETE: "bg-destructive/15 text-destructive",
  };
  return <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${colors[method] || ""}`}>{method}</span>;
}

/* ─── MAIN ─── */

const Docs = () => {
  const [active, setActive] = useState("intro");
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <PageHead title="Documentation API" description="Documentation complète de l'API RapidoMeet : authentification, endpoints, SDKs et exemples de code." path="/docs" />
      {/* Top Bar */}
      <div className="border-b border-border/30 bg-[hsl(var(--dark-2))]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-10 py-3">
          <div className="flex items-center gap-4 overflow-x-auto">
            {topNav.map((n) => (
              <Link key={n.label} to={n.href} className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap transition-colors ${n.active ? "text-foreground" : n.accent ? "text-[hsl(var(--fuchsia-l))]" : "text-muted-foreground hover:text-foreground"}`}>
                <n.icon className="w-3.5 h-3.5" />
                {n.label}
              </Link>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <span>Version : v1.0</span>
            <span>·</span>
            <span>18 mars 2026</span>
            <span>·</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" /> Opérationnel</span>
          </div>
        </div>
      </div>

      {/* Alert banner */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-10 pt-4">
        <div className="bg-[hsl(var(--violet))]/10 border border-[hsl(var(--violet))]/30 rounded-lg px-4 py-2.5 flex items-center gap-2 text-xs">
          <span className="font-bold text-[hsl(var(--violet-l))]">🆕 Nouveau</span>
          <span className="text-foreground/80">SDK Python v1.0 disponible · <code className="font-mono text-[hsl(var(--fuchsia-l))]">pip install rapidomeet</code></span>
          <Link to="/changelog" className="ml-auto text-[hsl(var(--violet-l))] hover:underline">Voir les notes →</Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar */}
        <aside className="w-[220px] shrink-0 border-r border-border/20 py-8 pr-4 pl-4 sm:pl-10 sticky top-0 h-screen overflow-y-auto hidden lg:block">
          {sidebarNav.map((g) => (
            <div key={g.group} className="mb-6">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">{g.group}</p>
              {g.items.map((item) => (
                <button key={item.id} onClick={() => scrollTo(item.id)} className={`block w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors mb-0.5 ${active === item.id ? "bg-[hsl(var(--fuchsia))]/10 text-[hsl(var(--fuchsia-l))] font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}

          {/* OpenAPI Download */}
          <div className="mt-6 p-3 rounded-xl border border-border/30 bg-[hsl(var(--dark-2))]">
            <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2 font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> OpenAPI Spec</p>
            <p className="text-[10px] text-muted-foreground mb-3">Importez dans Postman, Insomnia, Swagger UI</p>
            <div className="space-y-1.5">
              <button className="w-full text-[10px] font-medium py-1.5 rounded-md bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] text-white flex items-center justify-center gap-1"><Download className="w-3 h-3" /> openapi.yaml</button>
              <button className="w-full text-[10px] font-medium py-1.5 rounded-md border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"><Download className="w-3 h-3" /> openapi.json</button>
              <a href="https://editor.swagger.io" target="_blank" rel="noreferrer" className="w-full text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1"><ExternalLink className="w-3 h-3" /> Swagger Editor ↗</a>
            </div>
            <p className="text-[9px] text-muted-foreground mt-2">OpenAPI 3.1.0 · 18 mars 2026</p>
          </div>
        </aside>

        {/* Content */}
        <main ref={contentRef} className="flex-1 py-8 px-4 sm:px-8 max-w-[900px]">
          {/* INTRO */}
          <section id="intro" className="mb-16">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-4 bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] bg-clip-text text-transparent">
              Documentation API RapidoMeet
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[600px] mb-6">
              Agent IA de transcription et d'orchestration post-réunion.
              Transcrivez vos réunions et déclenchez des actions automatiques via notre API REST.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/docs/playground" className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] text-white"><FlaskConical className="w-3.5 h-3.5" /> Essayer le Playground</Link>
              <Link to="/inscription" className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-border/50 text-foreground hover:bg-muted/30"><Key className="w-3.5 h-3.5" /> Obtenir une clé API</Link>
            </div>
          </section>

          {/* AUTH */}
          <section id="auth" className="mb-16">
            <h2 className="font-display font-extrabold text-xl mb-4 text-foreground">Authentification</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Toutes les requêtes nécessitent un header <code className="font-mono text-[hsl(var(--fuchsia-l))] text-xs">Authorization</code> avec votre clé API.
            </p>
            <CodeBlock code={`Authorization: Bearer rm_live_xxxxxxxxxxxxxxxxxxxx

# Clés de production : rm_live_xxx
# Clés sandbox     : rm_test_xxx`} />
            <div className="mt-4 p-3 rounded-lg bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/30 text-xs text-foreground/80 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
              <span>Ne partagez jamais vos clés <code className="font-mono">rm_live_</code>. Utilisez des variables d'environnement et les clés <code className="font-mono">rm_test_</code> pour le développement.</span>
            </div>
          </section>

          {/* ENVIRONMENTS */}
          <section id="envs" className="mb-16">
            <h2 className="font-display font-extrabold text-xl mb-4 text-foreground flex items-center gap-2"><Globe className="w-5 h-5" /> Environnements</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 text-muted-foreground font-mono uppercase text-[9px]">Environnement</th>
                    <th className="text-left py-2 text-muted-foreground font-mono uppercase text-[9px]">Base URL</th>
                    <th className="text-left py-2 text-muted-foreground font-mono uppercase text-[9px]">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {environments.map((e) => (
                    <tr key={e.name} className="border-b border-border/10">
                      <td className="py-3 font-medium text-foreground flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-[hsl(var(--${e.color}))]`} />
                        {e.name}
                      </td>
                      <td className="py-3 font-mono text-[hsl(var(--fuchsia-l))]">{e.url}</td>
                      <td className="py-3 text-muted-foreground">{e.usage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5">
                <p className="text-xs font-semibold text-[hsl(var(--success))] mb-2">✓ Sandbox inclut</p>
                <ul className="space-y-1">
                  {sandboxFeatures.included.map((f) => <li key={f} className="text-[11px] text-muted-foreground">✓ {f}</li>)}
                </ul>
              </div>
              <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                <p className="text-xs font-semibold text-destructive mb-2">✗ Sandbox exclut</p>
                <ul className="space-y-1">
                  {sandboxFeatures.excluded.map((f) => <li key={f} className="text-[11px] text-muted-foreground">✗ {f}</li>)}
                </ul>
              </div>
            </div>

            <CodeBlock className="mt-6" lang="javascript" code={`// Basculer entre les environnements
const client = new RapidoMeet({
  apiKey: process.env.NODE_ENV === 'production'
    ? process.env.RAPIDOMEET_API_KEY        // rm_live_xxx
    : process.env.RAPIDOMEET_SANDBOX_KEY,   // rm_test_xxx
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.rapidomeet.io/v1'
    : 'https://sandbox.api.rapidomeet.io/v1',
});`} />
          </section>

          {/* RATE LIMITS */}
          <section id="limits" className="mb-16">
            <h2 className="font-display font-extrabold text-xl mb-4 text-foreground">Rate Limits</h2>
            <p className="text-sm text-muted-foreground mb-4">
              L'API est limitée à <strong className="text-foreground">120 requêtes par minute</strong> par clé API.
            </p>
            <CodeBlock code={`# Headers de réponse
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 1710765120
Retry-After: 30  # uniquement si 429`} />
          </section>

          {/* ENDPOINTS */}
          <h2 className="font-display font-extrabold text-2xl text-foreground mb-8 pt-4 border-t border-border/20">Endpoints</h2>

          {endpoints.map((ep) => (
            <section key={ep.id} id={ep.id} className="mb-14">
              <div className="flex items-center gap-2 mb-2">
                <MethodBadge method={ep.method} />
                <code className="font-mono text-sm text-foreground font-semibold">{ep.path}</code>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-1">{ep.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{ep.desc}</p>

              {/* Params table */}
              {ep.params && ep.params.length > 0 && (
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left py-1.5 font-mono text-muted-foreground uppercase text-[9px]">Paramètre</th>
                        <th className="text-left py-1.5 font-mono text-muted-foreground uppercase text-[9px]">Type</th>
                        <th className="text-left py-1.5 font-mono text-muted-foreground uppercase text-[9px]">Requis</th>
                        <th className="text-left py-1.5 font-mono text-muted-foreground uppercase text-[9px]">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ep.params.map((p) => (
                        <tr key={p.name} className="border-b border-border/10">
                          <td className="py-2 font-mono text-[hsl(var(--fuchsia-l))]">{p.name}</td>
                          <td className="py-2 text-muted-foreground">{p.type}</td>
                          <td className="py-2">{p.required ? <span className="text-[hsl(var(--fuchsia))]">✓</span> : <span className="text-muted-foreground">—</span>}</td>
                          <td className="py-2 text-muted-foreground">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 font-bold">Requête</p>
                  <CodeBlock code={ep.request} />
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 font-bold">Réponse</p>
                  <CodeBlock code={ep.response} />
                </div>
              </div>
            </section>
          ))}

          {/* ERRORS */}
          <section id="errors" className="mb-16 pt-4 border-t border-border/20">
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Gestion des erreurs</h2>
            <p className="text-sm text-muted-foreground mb-4">Format standard de toutes les erreurs :</p>
            <CodeBlock className="mb-6" code={`{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Meeting not found",
    "details": { "meeting_id": "meet_xxx" },
    "request_id": "req_abc123",
    "docs_url": "https://rapidomeet.io/docs#errors"
  }
}`} />
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 font-mono text-muted-foreground uppercase text-[9px]">Code</th>
                    <th className="text-left py-2 font-mono text-muted-foreground uppercase text-[9px]">HTTP</th>
                    <th className="text-left py-2 font-mono text-muted-foreground uppercase text-[9px]">Description</th>
                    <th className="text-left py-2 font-mono text-muted-foreground uppercase text-[9px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {errorCodes.map((e) => (
                    <tr key={e.code} className="border-b border-border/10">
                      <td className="py-2 font-mono text-[hsl(var(--fuchsia-l))] text-[10px]">{e.code}</td>
                      <td className="py-2"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${e.http < 500 ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]" : "bg-destructive/15 text-destructive"}`}>{e.http}</span></td>
                      <td className="py-2 text-muted-foreground">{e.desc}</td>
                      <td className="py-2 text-muted-foreground">{e.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="font-display font-bold text-base mt-8 mb-4 text-foreground">Pattern de retry intelligent</h3>
            <CodeBlock code={`class RapidoMeetRetryClient {
  constructor(client) {
    this.client = client;
    this.RETRYABLE_CODES = [
      'TRANSCRIPTION_FAILED', 'NLP_FAILED',
      'OPENCLAW_UNAVAILABLE', 'N8N_CONNECTION_FAILED',
    ];
  }

  async withRetry(operation, options = {}) {
    const { maxRetries = 3, initialDelay = 1000, backoffFactor = 2 } = options;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (error.status >= 400 && error.status < 500
            && error.status !== 429
            && !this.RETRYABLE_CODES.includes(error.code)) {
          throw error;
        }
        if (attempt === maxRetries) break;
        const delay = error.headers?.['retry-after']
          ? parseInt(error.headers['retry-after']) * 1000
          : initialDelay * Math.pow(backoffFactor, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastError;
  }
}`} />
          </section>

          {/* PAGINATION */}
          <section id="pagination" className="mb-16">
            <h2 className="font-display font-extrabold text-xl mb-4 text-foreground">Pagination (cursor-based)</h2>
            <p className="text-sm text-muted-foreground mb-4">Plus performante que l'offset pour les grands datasets.</p>
            <CodeBlock code={`// Première page
const page1 = await client.meetings.list({
  limit: 20,
  sort: 'created_at:desc',
  filter: { status: 'completed', type: 'commercial' }
});

// Page suivante via cursor
if (page1.meta.has_more) {
  const page2 = await client.meetings.list({
    limit: 20,
    cursor: page1.meta.next_cursor,
  });
}

// Itérateur automatique (récupérer tout)
for await (const meeting of client.meetings.iter({
  filter: { status: 'completed' },
  limit: 50,
})) {
  console.log(meeting.title);
}`} />
          </section>

          {/* WEBHOOKS GUIDE */}
          <section id="webhooks-guide" className="mb-16 pt-4 border-t border-border/20">
            <h2 className="font-display font-extrabold text-2xl mb-4 text-foreground">Guide Webhooks</h2>

            <h3 className="font-display font-bold text-base mb-4 text-foreground">Événements disponibles</h3>
            <div className="space-y-4 mb-8">
              {webhookEvents.map((cat) => (
                <div key={cat.category}>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[hsl(var(--fuchsia-l))] mb-2 font-bold">{cat.category}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {cat.events.map((e) => (
                      <div key={e.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--dark-2))] border border-border/20">
                        <code className="font-mono text-[10px] text-[hsl(var(--fuchsia-l))]">{e.name}</code>
                        <span className="text-[10px] text-muted-foreground ml-auto">{e.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="font-display font-bold text-base mb-4 text-foreground">Retry Policy</h3>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 text-muted-foreground font-mono uppercase text-[9px]">Tentative</th>
                    <th className="text-left py-2 text-muted-foreground font-mono uppercase text-[9px]">Délai</th>
                    <th className="text-left py-2 text-muted-foreground font-mono uppercase text-[9px]">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {retryPolicy.map((r) => (
                    <tr key={r.attempt} className="border-b border-border/10">
                      <td className="py-2 font-mono text-foreground">{r.attempt}</td>
                      <td className="py-2 text-[hsl(var(--fuchsia-l))]">{r.delay}</td>
                      <td className="py-2 text-muted-foreground">{r.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="font-display font-bold text-base mb-4 text-foreground">Vérification de signature</h3>
            <CodeBlock code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`} />
          </section>

          {/* STREAMING */}
          <section id="streaming" className="mb-16">
            <h2 className="font-display font-extrabold text-xl mb-4 text-foreground">Streaming Transcription (WebSocket)</h2>
            <CodeBlock code={`const stream = await client.transcriptions.createStream({
  meetingId: 'meet_abc123',
  language: 'fr',
  diarization: true,
});

stream.on('word', (data) => {
  console.log(\`[\${data.speaker}] \${data.word} (\${data.confidence}%)\`);
});

stream.on('entity', (entity) => {
  if (entity.type === 'task') {
    console.log(\`📌 Tâche détectée: \${entity.text}\`);
  }
  if (entity.type === 'prospect') {
    console.log(\`👤 Prospect: \${entity.name} (\${entity.company})\`);
  }
});

stream.on('complete', (result) => {
  console.log(\`✅ Terminé. Précision: \${result.precision}%\`);
  console.log(\`📊 \${result.tasks.length} tâches, \${result.decisions.length} décisions\`);
});

const audioStream = fs.createReadStream('meeting.mp3');
audioStream.pipe(stream);`} />
          </section>

          {/* N8N */}
          <section id="n8n" className="mb-16">
            <h2 className="font-display font-extrabold text-xl mb-4 text-foreground">Intégration N8N</h2>
            <p className="text-sm text-muted-foreground mb-4">Configuration du nœud N8N RapidoMeet :</p>
            <CodeBlock code={`{
  "node": "n8n-nodes-rapidomeet.RapidoMeet",
  "typeVersion": 1,
  "parameters": {
    "resource": "meeting",
    "operation": "get",
    "meetingId": "={{ $json.meeting_id }}",
    "options": {
      "includeTranscription": false,
      "includeTasks": true,
      "includeReport": true
    }
  },
  "credentials": {
    "rapidoMeetApi": { "id": "1", "name": "RapidoMeet API" }
  }
}`} />
          </section>

          {/* SDKs */}
          <section id="sdks" className="mb-16">
            <h2 className="font-display font-extrabold text-xl mb-4 text-foreground flex items-center gap-2"><Package className="w-5 h-5" /> SDKs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { lang: "JavaScript/Node.js", install: "npm install @rapidomeet/sdk", ver: "1.2.0" },
                { lang: "Python", install: "pip install rapidomeet", ver: "1.0.0" },
                { lang: "cURL / REST", install: "Aucune installation requise", ver: "—" },
              ].map((sdk) => (
                <div key={sdk.lang} className="p-4 rounded-xl border border-border/30 bg-[hsl(var(--dark-2))]">
                  <p className="text-xs font-semibold text-foreground mb-1">{sdk.lang}</p>
                  <code className="text-[10px] font-mono text-[hsl(var(--fuchsia-l))]">{sdk.install}</code>
                  <p className="text-[9px] text-muted-foreground mt-2">v{sdk.ver}</p>
                </div>
              ))}
            </div>
          </section>

          {/* OPENAPI */}
          <section id="openapi" className="mb-16">
            <h2 className="font-display font-extrabold text-xl mb-4 text-foreground">Spécification OpenAPI</h2>
            <details className="group">
              <summary className="cursor-pointer text-xs text-[hsl(var(--fuchsia-l))] font-medium hover:underline flex items-center gap-1">
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                Voir l'extrait openapi.yaml
              </summary>
              <CodeBlock className="mt-3" lang="yaml" code={`openapi: 3.1.0
info:
  title: RapidoMeet API
  version: 1.0.0
  description: |
    Agent IA de transcription et d'orchestration post-réunion.
  contact:
    name: Support BraindCode
    email: api@rapidomeet.io
  license:
    name: MIT

servers:
  - url: https://api.rapidomeet.io/v1
    description: Production
  - url: https://sandbox.api.rapidomeet.io/v1
    description: Sandbox

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: rm_live_xxx`} />
            </details>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Docs;
