// mockData.ts — Données démo réalistes RapidoMeet

export const MOCK_USER = {
  id: 'usr_michael_001',
  name: 'Michael Kebail-Ali',
  email: 'michael@braindcode.com',
  role: 'admin',
  avatar: null,
  initials: 'MK',
  workspace: 'BraindCode',
  plan: 'pro',
  joined: '2026-01-18',
};

export interface Participant {
  name: string;
  email?: string;
  initials: string;
  talkTime: number;
}

export interface Meeting {
  id: string;
  title: string;
  type: 'commercial' | 'tech' | 'onboarding' | 'retro' | 'autre';
  status: 'completed' | 'partial' | 'processing' | 'scheduled';
  source: string;
  date: string;
  duration: number;
  participants: Participant[];
  stats: {
    tasks: number;
    decisions: number;
    contacts: number;
    sentiment: number;
    precision: number;
    wordCount: number;
  };
  summary: string;
  skill: string;
}

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'meet_001',
    title: 'Sprint 12 BraindCode',
    type: 'tech',
    status: 'completed',
    source: 'google-meet',
    date: '2026-03-18T14:30:00Z',
    duration: 2820,
    participants: [
      { name: 'Michael K.', email: 'michael@braindcode.com', initials: 'MK', talkTime: 42 },
      { name: 'Ahmed B.', email: 'ahmed@braindcode.com', initials: 'AB', talkTime: 28 },
      { name: 'Souhail M.', email: 'souhail@braindcode.com', initials: 'SM', talkTime: 12 },
      { name: 'Raja T.', email: 'raja@braindcode.com', initials: 'RT', talkTime: 10 },
      { name: 'Lilia F.', email: 'lilia@braindcode.com', initials: 'LF', talkTime: 8 },
    ],
    stats: { tasks: 7, decisions: 4, contacts: 2, sentiment: 87, precision: 94, wordCount: 2847 },
    summary: "La réunion Sprint 12 a permis de valider le déploiement staging vendredi 21 mars. Ahmed confirme la PR avant jeudi. Thomas Dupont (StartupX) identifié comme prospect chaud.",
    skill: 'skill-base-transcript',
  },
  {
    id: 'meet_002',
    title: 'Réunion client Djiby — Camicourse',
    type: 'commercial',
    status: 'completed',
    source: 'audio-import',
    date: '2026-03-18T11:00:00Z',
    duration: 1920,
    participants: [
      { name: 'Michael K.', initials: 'MK', talkTime: 55 },
      { name: 'Djiby S.', initials: 'DS', talkTime: 38 },
      { name: 'Lilia F.', initials: 'LF', talkTime: 7 },
    ],
    stats: { tasks: 3, decisions: 2, contacts: 1, sentiment: 72, precision: 91, wordCount: 1640 },
    summary: "Discussion autour de la refonte de la plateforme Camicourse. Djiby valide le budget 8 000€. Proposition à envoyer avant vendredi.",
    skill: 'skill-commercial',
  },
  {
    id: 'meet_003',
    title: 'Review technique OpenClaw v2.4',
    type: 'tech',
    status: 'completed',
    source: 'google-meet',
    date: '2026-03-17T16:15:00Z',
    duration: 3720,
    participants: [
      { name: 'Ahmed B.', initials: 'AB', talkTime: 45 },
      { name: 'Souhail M.', initials: 'SM', talkTime: 35 },
      { name: 'Raja T.', initials: 'RT', talkTime: 20 },
    ],
    stats: { tasks: 5, decisions: 6, contacts: 0, sentiment: 82, precision: 96, wordCount: 3210 },
    summary: "Migration OpenClaw v2.3 → v2.4 validée. Breaking changes identifiés dans mcp-rapidocrm. Souhail prend en charge le fix Docker compose.",
    skill: 'skill-tech-review',
  },
  {
    id: 'meet_004',
    title: 'Call commercial StartupX (Thomas D.)',
    type: 'commercial',
    status: 'partial',
    source: 'teams',
    date: '2026-03-17T10:00:00Z',
    duration: 1680,
    participants: [
      { name: 'Michael K.', initials: 'MK', talkTime: 48 },
      { name: 'Thomas D.', initials: 'TD', talkTime: 52 },
    ],
    stats: { tasks: 4, decisions: 1, contacts: 3, sentiment: 91, precision: 88, wordCount: 1280 },
    summary: "Thomas Dupont très intéressé par l'offre Pro 5 000€/an. Démo technique souhaitée la semaine prochaine. Score prospect : 8/10.",
    skill: 'skill-commercial',
  },
  {
    id: 'meet_005',
    title: 'PFE RapidoMeet — Briefing 3 stagiaires',
    type: 'onboarding',
    status: 'completed',
    source: 'google-meet',
    date: '2026-03-16T15:30:00Z',
    duration: 3300,
    participants: [
      { name: 'Michael K.', initials: 'MK', talkTime: 60 },
      { name: 'Amine A.', initials: 'AA', talkTime: 15 },
      { name: 'Marwan H.', initials: 'MH', talkTime: 15 },
      { name: 'Mohamed AG.', initials: 'MA', talkTime: 10 },
    ],
    stats: { tasks: 8, decisions: 3, contacts: 0, sentiment: 94, precision: 93, wordCount: 2540 },
    summary: "Onboarding des 3 stagiaires PFE (Amine, Marwan, Mohamed Ali). Objectifs clairs : 200 agents + 230 Skills via OpenClaw pour VivaTech. Démarrage semaine 13.",
    skill: 'skill-onboarding',
  },
];

export interface Task {
  id: string;
  title: string;
  assignee: string;
  meeting: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  source_timestamp: string;
}

export const MOCK_TASKS: Task[] = [
  { id: 'task_001', title: 'PR review module Docker avant jeudi', assignee: 'Ahmed B.', meeting: 'meet_001', deadline: '2026-03-20', priority: 'high', status: 'todo', source_timestamp: '00:02:31' },
  { id: 'task_002', title: 'Review Docker compose — Ahmed PR', assignee: 'Souhail M.', meeting: 'meet_001', deadline: '2026-03-19', priority: 'high', status: 'in_progress', source_timestamp: '00:03:12' },
  { id: 'task_003', title: 'CDC RapidoRH v2 finalisé', assignee: 'Lilia F.', meeting: 'meet_001', deadline: '2026-03-21', priority: 'medium', status: 'todo', source_timestamp: '00:31:45' },
  { id: 'task_004', title: 'Brief stagiaires RapidoMeet (démarrage sem. 13)', assignee: 'Michael K.', meeting: 'meet_005', deadline: '2026-03-24', priority: 'high', status: 'todo', source_timestamp: '00:08:22' },
  { id: 'task_005', title: 'Envoyer proposal à Thomas Dupont (StartupX)', assignee: 'Michael K.', meeting: 'meet_004', deadline: '2026-03-21', priority: 'high', status: 'todo', source_timestamp: '00:24:18' },
  { id: 'task_006', title: 'Confirmer salle démo VivaTech', assignee: 'Michael K.', meeting: 'meet_001', deadline: '2026-03-22', priority: 'low', status: 'done', source_timestamp: '00:38:55' },
  { id: 'task_007', title: 'Update OpenClaw v2.4', assignee: 'Souhail M.', meeting: 'meet_003', deadline: '2026-03-19', priority: 'high', status: 'done', source_timestamp: '00:44:10' },
];

export interface Scenario {
  id: string;
  name: string;
  trigger: string;
  status: 'active' | 'inactive';
  executions: number;
  successRate: number | null;
  lastRun: string | null;
  avgDuration: number | null;
}

export const MOCK_SCENARIOS: Scenario[] = [
  { id: 'n1', name: 'Weekly Meeting Digest', trigger: 'every_monday_8am', status: 'active', executions: 12, successRate: 100, lastRun: '2026-03-17T08:00:00Z', avgDuration: 1.2 },
  { id: 'n2', name: 'Prospect Auto-Capture', trigger: 'prospect_detected', status: 'active', executions: 47, successRate: 98, lastRun: '2026-03-18T14:51:00Z', avgDuration: 0.8 },
  { id: 'n3', name: 'Action Items Tracker', trigger: 'meeting_completed', status: 'active', executions: 38, successRate: 100, lastRun: '2026-03-18T14:52:00Z', avgDuration: 1.4 },
  { id: 'n4', name: 'PDF Report Generator', trigger: 'meeting_completed', status: 'active', executions: 38, successRate: 97, lastRun: '2026-03-18T14:53:00Z', avgDuration: 2.1 },
  { id: 'n5', name: 'Follow-up Email Sequence', trigger: 'commercial_meeting', status: 'inactive', executions: 0, successRate: null, lastRun: null, avgDuration: null },
  { id: 'n6', name: 'Sentiment Alert', trigger: 'sentiment_negative', status: 'inactive', executions: 0, successRate: null, lastRun: null, avgDuration: null },
];

export const MOCK_INTEGRATIONS_STATUS: Record<string, { connected: boolean; account?: string | null; url?: string; phone?: string; bot?: string; version?: string }> = {
  'google-meet': { connected: true, account: 'michael@braindcode.com' },
  'gmail': { connected: true, account: 'michael@braindcode.com' },
  'rapidocrm': { connected: true, url: 'crm.rapidosoftware.com' },
  'google-drive': { connected: true, account: 'michael@braindcode.com' },
  'google-calendar': { connected: true, account: 'michael@braindcode.com' },
  'whatsapp': { connected: true, phone: '+33 6 XX XX XX XX' },
  'telegram': { connected: true, bot: '@rapidomeet_bot' },
  'n8n': { connected: true, url: 'n8n.braindcode.com' },
  'openclaw': { connected: true, url: 'openclaw.braindcode.com', version: '2.3.1' },
  'microsoft-teams': { connected: false, account: null },
  'discord': { connected: false, account: null },
  'slack': { connected: false, account: null },
  'stripe': { connected: false, account: null },
  'notion': { connected: false, account: null },
};

export const MOCK_ANALYTICS = {
  meetings: {
    total: 87,
    trend: +18,
    byType: { commercial: 42, tech: 28, onboarding: 15, retro: 10, autre: 5 } as Record<string, number>,
    byDay: { lun: 12, mar: 18, mer: 22, jeu: 15, ven: 8, sam: 2, dim: 0 } as Record<string, number>,
    byHour: { '08h': 3, '09h': 8, '10h': 16, '11h': 12, '14h': 20, '15h': 14, '16h': 10, '17h': 4 } as Record<string, number>,
  },
  tasks: {
    total: 312,
    done: 187,
    inProgress: 43,
    todo: 82,
    completionRate: 60,
    trend: +24,
  },
  performance: {
    avgPrecision: 94.2,
    avgDuration: 134,
    deliveryRate: 100,
  },
  openclaw: {
    messagesSent: 312,
    byChannel: { whatsapp: 180, email: 118, telegram: 12, discord: 2 } as Record<string, number>,
    scenariosRun: 127,
    successRate: 99.2,
  },
};

export const MOCK_REPORTS = [
  { id: 'rpt_001', meetingId: 'meet_001', title: 'Rapport Sprint 12', date: '2026-03-18', wordCount: 2847, status: 'ready' },
  { id: 'rpt_002', meetingId: 'meet_002', title: 'Rapport Camicourse', date: '2026-03-18', wordCount: 1640, status: 'ready' },
  { id: 'rpt_003', meetingId: 'meet_003', title: 'Rapport OpenClaw v2.4', date: '2026-03-17', wordCount: 3210, status: 'ready' },
];

export const MOCK_CHANGELOG = [
  {
    version: '1.2.0',
    date: '15 mars 2026',
    items: [
      { type: 'new' as const, text: 'Skill multilangue arabe (skill-multilingual-ar)' },
      { type: 'new' as const, text: 'Export transcriptions en format SRT (sous-titres)' },
      { type: 'new' as const, text: 'Support Calendly pour les follow-ups automatiques' },
      { type: 'new' as const, text: 'Analytics dashboard avec métriques temps de traitement' },
      { type: 'improved' as const, text: 'Précision diarisation pour > 4 intervenants : +8%' },
      { type: 'improved' as const, text: 'Vitesse génération rapport PDF : -40%' },
      { type: 'improved' as const, text: 'Interface mobile : bottom sheets sur iOS' },
      { type: 'fixed' as const, text: 'Fix : crash transcription pour fichiers > 200 Mo' },
      { type: 'fixed' as const, text: 'Fix : token OAuth Google expirant après 1h' },
      { type: 'fixed' as const, text: 'Fix : scénario N8N N3 en double sur certaines réunions' },
    ],
  },
  {
    version: '1.1.0',
    date: '1er mars 2026',
    items: [
      { type: 'new' as const, text: 'Console OpenClaw avec chat IA intégré' },
      { type: 'new' as const, text: 'Scénarios N8N (6 workflows pré-configurés)' },
      { type: 'new' as const, text: 'Page intégrations avec 60+ apps supportées' },
      { type: 'improved' as const, text: 'Temps de transcription réduit de 30%' },
      { type: 'fixed' as const, text: 'Fix : notifications en double' },
    ],
  },
  {
    version: '1.0.0',
    date: '18 janvier 2026',
    items: [
      { type: 'new' as const, text: 'Lancement RapidoMeet v1.0 🚀' },
      { type: 'new' as const, text: 'Transcription IA (Whisper + Deepgram)' },
      { type: 'new' as const, text: 'Rapports PDF automatiques' },
      { type: 'new' as const, text: 'Extraction de tâches et décisions' },
      { type: 'new' as const, text: 'Intégration Google Meet + Microsoft Teams' },
    ],
  },
];

export const MOCK_ROADMAP = {
  inProgress: [
    { id: 'rd_1', title: 'Bot Meet/Teams natif', description: 'Rejoindre automatiquement les réunions et transcrire en temps réel.', tags: ['infra', 'IA'], votes: 42 },
    { id: 'rd_2', title: 'Marketplace skills', description: 'Catalogue de Skills publiés par la communauté.', tags: ['communauté'], votes: 38 },
    { id: 'rd_3', title: 'Dashboard web V2', description: 'Refonte complète du tableau de bord avec analytics avancés.', tags: ['UI'], votes: 31 },
    { id: 'rd_4', title: 'OpenClaw v2.5', description: 'Support multi-agent et chaînes de prompts.', tags: ['IA'], votes: 29 },
  ],
  planned: [
    { id: 'rd_5', title: 'Discord + iMessage', description: 'Nouveaux canaux de distribution des rapports.', tags: ['intégrations'], votes: 24 },
    { id: 'rd_6', title: 'Analytics avancé', description: 'Métriques de performance par équipe et par projet.', tags: ['analytics'], votes: 22 },
    { id: 'rd_7', title: 'API publique v1', description: 'Documentation et clés API pour développeurs.', tags: ['API'], votes: 19 },
    { id: 'rd_8', title: 'N8N scénarios N5-N8', description: '4 nouveaux scénarios d\'automatisation.', tags: ['automation'], votes: 15 },
  ],
  ideas: [
    { id: 'rd_9', title: 'Mode vocal WhatsApp', description: 'Transcrire directement les messages vocaux WhatsApp.', tags: ['IA', 'mobile'], votes: 56 },
    { id: 'rd_10', title: 'Avatalk vidéo', description: 'Avatar IA qui présente les résumés en vidéo.', tags: ['IA', 'vidéo'], votes: 33 },
    { id: 'rd_11', title: 'IA scoring prédictif', description: 'Prédire le potentiel de conversion d\'un prospect.', tags: ['IA', 'CRM'], votes: 27 },
  ],
};

// Helper function to format duration
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m}min`;
}

// Helper to get meeting type label
export function getMeetingTypeLabel(type: Meeting['type']): string {
  const labels: Record<string, string> = {
    commercial: 'Commercial',
    tech: 'Tech',
    onboarding: 'Onboarding',
    retro: 'Rétrospective',
    autre: 'Autre',
  };
  return labels[type] || type;
}

// Helper to get meeting type color
export function getMeetingTypeColor(type: Meeting['type']): string {
  const colors: Record<string, string> = {
    commercial: 'hsl(var(--fuchsia))',
    tech: 'hsl(var(--violet))',
    onboarding: 'hsl(var(--success))',
    retro: '#F59E0B',
    autre: 'hsl(var(--gray-1))',
  };
  return colors[type] || 'hsl(var(--gray-1))';
}
