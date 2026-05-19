export type IntegrationStatus = "connected" | "available" | "coming_soon";

export interface Integration {
  id: string;
  name: string;
  domain: string;
  description: string;
  status: IntegrationStatus;
  badge: string;
  badgeColor: string;
  mcp: boolean;
  mcpName?: string;
  category: string;
  priority: number;
  tools?: string[];
}

export interface AgentSkillCategory {
  category: string;
  icon: string;
  color: string;
  skills: string[];
}

export const CATEGORIES: Record<string, { label: string; icon: string }> = {
  visio: { label: "Visioconférence & Audio", icon: "📹" },
  ai: { label: "Intelligence Artificielle", icon: "🤖" },
  crm: { label: "CRM & Suite Rapido", icon: "📊" },
  email: { label: "Email & Communication", icon: "📧" },
  messaging: { label: "Messagerie & Réseaux", icon: "💬" },
  productivity: { label: "Agenda & Productivité", icon: "📅" },
  payment: { label: "Paiement & Finance", icon: "💳" },
  storage: { label: "Stockage & Documents", icon: "📁" },
  automation: { label: "Automatisation & Dev", icon: "⚡" },
  analytics: { label: "Analytics & Marketing", icon: "📈" },
};

export const ALL_INTEGRATIONS: Integration[] = [
  // Visio
  { id: "google-meet", name: "Google Meet", domain: "meet.google.com", description: "Rejoindre et enregistrer automatiquement", status: "connected", badge: "Natif", badgeColor: "success", mcp: true, mcpName: "mcp-google-meet", category: "visio", priority: 1 },
  { id: "microsoft-teams", name: "Microsoft Teams", domain: "teams.microsoft.com", description: "Bot d'enregistrement via Graph API", status: "available", badge: "MVP", badgeColor: "fuchsia", mcp: true, mcpName: "mcp-teams", category: "visio", priority: 2 },
  { id: "zoom", name: "Zoom", domain: "zoom.us", description: "Enregistrement cloud Zoom", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "visio", priority: 3 },
  { id: "whereby", name: "Whereby", domain: "whereby.com", description: "Import enregistrements Whereby", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "visio", priority: 4 },
  { id: "webex", name: "Webex", domain: "webex.com", description: "Intégration Cisco Webex", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "visio", priority: 5 },

  // AI
  { id: "claude", name: "Claude (Anthropic)", domain: "anthropic.com", description: "LLM orchestrateur — analyse NLP, extraction, routing", status: "connected", badge: "Natif", badgeColor: "success", mcp: true, mcpName: "mcp-claude", category: "ai", priority: 1 },
  { id: "openai", name: "OpenAI / ChatGPT", domain: "openai.com", description: "Whisper STT + GPT-4 fallback NLP", status: "connected", badge: "STT", badgeColor: "violet", mcp: true, mcpName: "mcp-openai", category: "ai", priority: 2 },
  { id: "gemini", name: "Google Gemini", domain: "gemini.google.com", description: "Gemini Pro fallback analyse multimodale", status: "available", badge: "Fallback", badgeColor: "gray", mcp: true, mcpName: "mcp-gemini", category: "ai", priority: 3 },
  { id: "deepgram", name: "Deepgram", domain: "deepgram.com", description: "STT cloud haute précision, diarisation temps réel", status: "connected", badge: "STT Cloud", badgeColor: "violet", mcp: true, mcpName: "mcp-deepgram", category: "ai", priority: 4 },
  { id: "elevenlabs", name: "ElevenLabs", domain: "elevenlabs.io", description: "TTS — lecture vocale des rapports", status: "available", badge: "TTS", badgeColor: "fuchsia", mcp: true, mcpName: "mcp-elevenlabs", category: "ai", priority: 5 },
  { id: "heygen", name: "HeyGen", domain: "heygen.com", description: "Avatar vidéo pour comptes-rendus vidéo", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "ai", priority: 6 },
  { id: "whisper-local", name: "Whisper (Local)", domain: "github.com", description: "Whisper open-source hébergé en local", status: "connected", badge: "Offline", badgeColor: "success", mcp: false, category: "ai", priority: 7 },
  { id: "firecrawl", name: "Firecrawl", domain: "firecrawl.dev", description: "Scraping web pour enrichissement prospects", status: "available", badge: "Enrichissement", badgeColor: "violet", mcp: true, mcpName: "mcp-firecrawl", category: "ai", priority: 8 },

  // CRM
  { id: "rapidocrm", name: "RapidoCRM", domain: "rapidosoftware.com", description: "CRM natif — contacts, pipeline, opportunités", status: "connected", badge: "Natif", badgeColor: "success", mcp: true, mcpName: "mcp-rapidocrm", category: "crm", priority: 1, tools: ["create_contact", "update_contact", "create_opportunity", "update_pipeline_stage", "log_activity", "create_task"] },
  { id: "rapidocms", name: "RapidoCMS", domain: "rapidosoftware.com", description: "CMS — publication automatique post-réunion", status: "available", badge: "Rapido", badgeColor: "violet", mcp: true, mcpName: "mcp-rapidocms", category: "crm", priority: 2 },
  { id: "rapidorh", name: "RapidoRH", domain: "rapidosoftware.com", description: "RH — réunions équipe, onboarding, entretiens", status: "available", badge: "Rapido", badgeColor: "violet", mcp: true, mcpName: "mcp-rapidorh", category: "crm", priority: 3 },
  { id: "rapidoats", name: "RapidoATS", domain: "rapidosoftware.com", description: "ATS — entretiens candidats, feedback auto", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "crm", priority: 4 },
  { id: "hubspot", name: "HubSpot", domain: "hubspot.com", description: "CRM externe — contacts, deals, pipeline", status: "available", badge: "Via API", badgeColor: "gray", mcp: true, mcpName: "mcp-hubspot", category: "crm", priority: 5 },
  { id: "salesforce", name: "Salesforce", domain: "salesforce.com", description: "CRM enterprise — objets, opportunités, leads", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "crm", priority: 6 },
  { id: "pipedrive", name: "Pipedrive", domain: "pipedrive.com", description: "Pipeline commercial — deals et activités", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "crm", priority: 7 },

  // Email
  { id: "gmail", name: "Gmail", domain: "gmail.com", description: "Envoi rapports, follow-ups, séquences automatiques", status: "connected", badge: "Connecté", badgeColor: "success", mcp: true, mcpName: "mcp-gmail", category: "email", priority: 1, tools: ["send_email", "send_bulk_email", "draft_email", "create_followup_sequence"] },
  { id: "resend", name: "Resend", domain: "resend.com", description: "API email transactionnelle haute délivrabilité", status: "connected", badge: "Email API", badgeColor: "violet", mcp: true, mcpName: "mcp-resend", category: "email", priority: 2 },
  { id: "outlook", name: "Outlook / Microsoft 365", domain: "outlook.com", description: "Email et calendrier Microsoft", status: "available", badge: "Via Graph", badgeColor: "gray", mcp: true, mcpName: "mcp-outlook", category: "email", priority: 3 },
  { id: "sendgrid", name: "SendGrid", domain: "sendgrid.com", description: "Email marketing et transactionnel", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "email", priority: 4 },
  { id: "mailchimp", name: "Mailchimp", domain: "mailchimp.com", description: "Séquences marketing depuis les réunions", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "email", priority: 5 },

  // Messaging
  { id: "whatsapp", name: "WhatsApp Business", domain: "whatsapp.com", description: "Rapports et notifications post-réunion", status: "connected", badge: "MVP", badgeColor: "success", mcp: true, mcpName: "mcp-whatsapp", category: "messaging", priority: 1 },
  { id: "telegram", name: "Telegram", domain: "telegram.org", description: "Bot Telegram — rapports et commandes interactives", status: "connected", badge: "MVP", badgeColor: "success", mcp: true, mcpName: "mcp-telegram", category: "messaging", priority: 2 },
  { id: "discord", name: "Discord", domain: "discord.com", description: "Rapport dans les channels de projet", status: "available", badge: "V2", badgeColor: "violet", mcp: true, mcpName: "mcp-discord", category: "messaging", priority: 3 },
  { id: "slack", name: "Slack", domain: "slack.com", description: "Broadcast résumé dans les channels Slack", status: "available", badge: "V2", badgeColor: "violet", mcp: true, mcpName: "mcp-slack", category: "messaging", priority: 4 },
  { id: "linkedin", name: "LinkedIn", domain: "linkedin.com", description: "Enrichissement profil prospects", status: "available", badge: "Enrichissement", badgeColor: "fuchsia", mcp: true, mcpName: "mcp-linkedin", category: "messaging", priority: 5 },
  { id: "meta", name: "Meta (Facebook / Instagram)", domain: "meta.com", description: "WhatsApp Business API, Meta Ads insights", status: "available", badge: "Via API", badgeColor: "gray", mcp: true, mcpName: "mcp-meta", category: "messaging", priority: 6 },
  { id: "tiktok", name: "TikTok Business", domain: "tiktok.com", description: "Analytics campagnes et insights créatifs", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "messaging", priority: 7 },

  // Productivity
  { id: "google-calendar", name: "Google Calendar", domain: "calendar.google.com", description: "Création d'événements, rappels, follow-ups", status: "connected", badge: "Connecté", badgeColor: "success", mcp: true, mcpName: "mcp-google-calendar", category: "productivity", priority: 1, tools: ["create_event", "update_event", "list_events", "set_reminder", "schedule_followup"] },
  { id: "google-drive", name: "Google Drive", domain: "drive.google.com", description: "Sauvegarde transcriptions, rapports PDF", status: "connected", badge: "Connecté", badgeColor: "success", mcp: true, mcpName: "mcp-google-drive", category: "productivity", priority: 2, tools: ["upload_file", "create_folder", "share_file", "create_doc"] },
  { id: "calendly", name: "Calendly", domain: "calendly.com", description: "Planification de follow-ups depuis la réunion", status: "available", badge: "Scheduling", badgeColor: "violet", mcp: true, mcpName: "mcp-calendly", category: "productivity", priority: 3 },
  { id: "notion", name: "Notion", domain: "notion.so", description: "Pages comptes-rendus dans vos workspaces", status: "available", badge: "Via API", badgeColor: "gray", mcp: true, mcpName: "mcp-notion", category: "productivity", priority: 4 },
  { id: "trello", name: "Trello", domain: "trello.com", description: "Cartes Trello depuis les tâches extraites", status: "available", badge: "Via API", badgeColor: "gray", mcp: true, mcpName: "mcp-trello", category: "productivity", priority: 5 },
  { id: "atlassian", name: "Atlassian (Jira / Confluence)", domain: "atlassian.com", description: "Tickets Jira + pages Confluence depuis réunions", status: "available", badge: "Via API", badgeColor: "gray", mcp: true, mcpName: "mcp-atlassian", category: "productivity", priority: 6 },
  { id: "clickup", name: "ClickUp", domain: "clickup.com", description: "Tâches et projets depuis réunions", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "productivity", priority: 7 },
  { id: "airtable", name: "Airtable", domain: "airtable.com", description: "Base de données structurée depuis transcriptions", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "productivity", priority: 8 },
  { id: "linear", name: "Linear", domain: "linear.app", description: "Issues engineering depuis réunions tech", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "productivity", priority: 9 },

  // Payment
  { id: "stripe", name: "Stripe", domain: "stripe.com", description: "Facture après validation commerciale en réunion", status: "available", badge: "Via API", badgeColor: "violet", mcp: true, mcpName: "mcp-stripe", category: "payment", priority: 1 },
  { id: "paypal", name: "PayPal", domain: "paypal.com", description: "Devis et paiements post-réunion", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "payment", priority: 2 },
  { id: "pennylane", name: "Pennylane", domain: "pennylane.com", description: "Comptabilité française — factures automatiques", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "payment", priority: 3 },
  { id: "qonto", name: "Qonto", domain: "qonto.com", description: "Banque pro — suivi dépenses", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "payment", priority: 4 },

  // Storage
  { id: "dropbox", name: "Dropbox", domain: "dropbox.com", description: "Archivage automatique des transcriptions", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "storage", priority: 1 },
  { id: "onedrive", name: "OneDrive", domain: "onedrive.live.com", description: "Stockage Microsoft 365", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "storage", priority: 2 },

  // Automation
  { id: "n8n", name: "N8N", domain: "n8n.io", description: "Orchestration de workflows post-réunion", status: "connected", badge: "Natif", badgeColor: "success", mcp: true, mcpName: "mcp-n8n", category: "automation", priority: 1, tools: ["trigger_workflow", "list_workflows", "get_workflow_status"] },
  { id: "openclaw", name: "OpenClaw", domain: "openclaw.ai", description: "Gateway MCP — distribution multi-canal", status: "connected", badge: "Natif", badgeColor: "success", mcp: true, mcpName: "mcp-openclaw", category: "automation", priority: 2 },
  { id: "make", name: "Make (ex-Integromat)", domain: "make.com", description: "Scénarios Make déclenchés depuis réunion", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "automation", priority: 3 },
  { id: "zapier", name: "Zapier", domain: "zapier.com", description: "Zaps déclenchés depuis les transcriptions", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "automation", priority: 4 },
  { id: "github", name: "GitHub", domain: "github.com", description: "Issues et PRs depuis réunions tech", status: "available", badge: "Via API", badgeColor: "gray", mcp: true, mcpName: "mcp-github", category: "automation", priority: 5 },
  { id: "webhook", name: "Webhook personnalisé", domain: "rapidomeet.io", description: "Envoyer les données vers n'importe quelle URL", status: "available", badge: "Custom", badgeColor: "fuchsia", mcp: false, category: "automation", priority: 6 },

  // Analytics
  { id: "google-analytics", name: "Google Analytics 4", domain: "analytics.google.com", description: "Métriques web mentionnées en réunion marketing", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "analytics", priority: 1 },
  { id: "meta-ads", name: "Meta Ads Manager", domain: "adsmanager.facebook.com", description: "Insights campagnes Meta", status: "coming_soon", badge: "V2", badgeColor: "gray", mcp: false, category: "analytics", priority: 2 },
  { id: "mixpanel", name: "Mixpanel", domain: "mixpanel.com", description: "Événements produit depuis décisions réunion", status: "coming_soon", badge: "V3", badgeColor: "gray", mcp: false, category: "analytics", priority: 3 },
];

export const AGENT_SKILLS: AgentSkillCategory[] = [
  { category: "Transcription", icon: "🎙", color: "fuchsia", skills: ["Transcription audio FR/EN/AR (Whisper + Deepgram)", "Diarisation automatique (jusqu'à 8 voix)", "Horodatage précis par mot et par bloc", "Détection de langue automatique", "Transcription temps réel (streaming)", "Transcription différée (fichier importé)", "Support : MP3, WAV, M4A, MP4, OGG, FLAC", "Durée max : 4 heures par session", "Précision : 85-97%", "Correction contextuelle via RAG", "Export : TXT, JSON, SRT"] },
  { category: "Analyse NLP", icon: "🧠", color: "violet", skills: ["Résumé exécutif automatique", "Extraction de tâches avec responsable et deadline", "Extraction de décisions avec timestamp", "Détection de prospects et contacts", "Analyse de sentiment par intervenant", "Identification des mots-clés et thèmes", "Détection du type de réunion", "Extraction d'opportunités commerciales", "Identification des risques et bloquants", "Détection des engagements pris", "Analyse du temps de parole", "Extraction de chiffres, dates et montants", "Détection d'alertes (tension, insatisfaction)"] },
  { category: "Actions CRM", icon: "📊", color: "success", skills: ["Création auto de contacts dans RapidoCRM", "Création d'opportunités avec valeur et pipeline", "Mise à jour du stade pipeline", "Log automatique de l'activité réunion", "Enrichissement via LinkedIn", "Enrichissement via Firecrawl", "Création de deals post-validation", "Déclenchement de séquences nurturing", "Compatibilité HubSpot, Pipedrive, Salesforce"] },
  { category: "Communication & Distribution", icon: "📨", color: "fuchsia", skills: ["Rapport WhatsApp (< 300 mots)", "Rapport Telegram (markdown)", "Email HTML avec charte graphique", "Broadcast Discord / Slack", "Envoi PDF en pièce jointe auto", "Séquence email J+1/J+7/J+14", "Alerte sentiment négatif", "Rapport vocal via ElevenLabs (TTS)", "Personnalisation par type de réunion"] },
  { category: "Agenda & Planning", icon: "📅", color: "violet", skills: ["Création événements Google Calendar", "Planification follow-up automatique", "Invitation automatique des participants", "Configuration de rappels pour deadlines", "Génération de liens Calendly", "Détection des disponibilités communes", "Synchronisation Outlook Calendar", "Récurrence automatique"] },
  { category: "Documents & Stockage", icon: "📄", color: "gray", skills: ["Rapport PDF avec charte graphique", "Sauvegarde transcription dans Drive", "Page Notion avec compte-rendu structuré", "Document Google Docs partageable", "Archivage automatique par projet", "Génération de sous-titres SRT", "Création de minutes de réunion (DOCX)"] },
  { category: "Gestion de projet", icon: "✅", color: "success", skills: ["Cartes Trello depuis les tâches", "Issues Jira pour projets tech", "Pages Confluence (documentation)", "Issues GitHub avec assignation auto", "Tickets ClickUp / Linear", "Mise à jour de sprint Jira", "Assignation selon noms mentionnés"] },
  { category: "Finance & Facturation", icon: "💳", color: "warning", skills: ["Facture Stripe après validation", "Lien de paiement Stripe", "Création client Stripe depuis CRM", "Envoi de devis auto post-réunion", "Déclenchement d'abonnement"] },
  { category: "Automatisation & Workflows", icon: "⚡", color: "fuchsia", skills: ["Déclenchement 10 scénarios N8N", "Exécution workflows Make / Zapier", "Envoi webhooks personnalisés", "Triggers conditionnels par type", "Workflows avec délai (J+1, J+7)", "Chaînage de MCPs en séquence", "Retry automatique en cas d'échec", "Monitoring avec logs détaillés"] },
  { category: "Mémoire & Apprentissage", icon: "🧩", color: "violet", skills: ["Mémoire contextuelle par projet", "Mémoire par contact CRM", "RAG entreprise (50 documents indexés)", "Apprentissage vocabulaire métier", "Hot-reload Skills Markdown", "Personnalisation par type de réunion", "Amélioration continue via feedback"] },
  { category: "Enrichissement & Intelligence", icon: "🔍", color: "violet", skills: ["Enrichissement prospect via LinkedIn", "Enrichissement via Firecrawl", "Scoring prospect automatique (1-10)", "Détection secteur d'activité", "Estimation taille entreprise", "Vérification email (délivrabilité)", "Suggestion prochaine action commerciale"] },
];

export const MCP_SERVERS = [
  { id: "mcp-gmail", name: "MCP Gmail", app: "Gmail", version: "1.2.0", status: "active", toolCount: 5 },
  { id: "mcp-whatsapp", name: "MCP WhatsApp", app: "WhatsApp Business", version: "1.1.0", status: "active", toolCount: 4 },
  { id: "mcp-telegram", name: "MCP Telegram", app: "Telegram", version: "1.0.3", status: "active", toolCount: 4 },
  { id: "mcp-rapidocrm", name: "MCP RapidoCRM", app: "RapidoCRM", version: "2.1.0", status: "active", toolCount: 10 },
  { id: "mcp-google-calendar", name: "MCP Google Calendar", app: "Google Calendar", version: "1.3.0", status: "active", toolCount: 8 },
  { id: "mcp-google-drive", name: "MCP Google Drive", app: "Google Drive", version: "1.1.0", status: "active", toolCount: 8 },
  { id: "mcp-n8n", name: "MCP N8N", app: "N8N", version: "1.4.0", status: "active", toolCount: 6 },
  { id: "mcp-deepgram", name: "MCP Deepgram", app: "Deepgram", version: "1.0.1", status: "active", toolCount: 4 },
  { id: "mcp-resend", name: "MCP Resend", app: "Resend", version: "1.0.0", status: "active", toolCount: 4 },
  { id: "mcp-slack", name: "MCP Slack", app: "Slack", version: "0.9.1", status: "available", toolCount: 5 },
  { id: "mcp-discord", name: "MCP Discord", app: "Discord", version: "0.8.0", status: "available", toolCount: 3 },
  { id: "mcp-elevenlabs", name: "MCP ElevenLabs", app: "ElevenLabs", version: "0.9.0", status: "available", toolCount: 3 },
  { id: "mcp-firecrawl", name: "MCP Firecrawl", app: "Firecrawl", version: "0.8.2", status: "available", toolCount: 4 },
  { id: "mcp-stripe", name: "MCP Stripe", app: "Stripe", version: "1.0.0", status: "available", toolCount: 6 },
  { id: "mcp-notion", name: "MCP Notion", app: "Notion", version: "0.9.3", status: "available", toolCount: 5 },
  { id: "mcp-trello", name: "MCP Trello", app: "Trello", version: "0.8.0", status: "available", toolCount: 5 },
  { id: "mcp-atlassian", name: "MCP Atlassian", app: "Atlassian", version: "0.7.5", status: "available", toolCount: 6 },
  { id: "mcp-github", name: "MCP GitHub", app: "GitHub", version: "0.9.0", status: "available", toolCount: 5 },
];
