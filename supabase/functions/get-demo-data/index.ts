import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded demo data — no DB dependency, no auth required
const DEMO_DATA = {
  meeting: {
    id: "00000000-0000-0000-0000-000000000002",
    title: "Réunion commerciale Q2 — Présentation solution",
    status: "completed",
    meeting_type: "commercial",
    duration_seconds: 2700,
    summary: "Réunion avec le prospect Acme Corp pour présenter la solution RapidoMeet. Le client est très intéressé par les fonctionnalités de transcription automatique et de distribution des rapports. Décision de lancer un POC de 30 jours. Budget validé côté client.",
    sentiment_score: 82,
    language: "fr",
    created_at: new Date().toISOString(),
    participants: ["Sophie Martin", "Jean Dupont", "Marie Bernard"],
  },
  tasks: [
    { id: "t1", title: "Préparer la proposition commerciale détaillée", priority: "high", status: "pending", assignee: "Sophie Martin" },
    { id: "t2", title: "Envoyer accès POC à Jean Dupont", priority: "critical", status: "pending", assignee: "Sophie Martin" },
    { id: "t3", title: "Planifier réunion de suivi dans 2 semaines", priority: "medium", status: "pending", assignee: null },
    { id: "t4", title: "Vérifier compatibilité avec leur stack technique", priority: "low", status: "pending", assignee: "Tech team" },
  ],
  decisions: [
    { id: "d1", content: "Lancement d'un POC de 30 jours validé" },
    { id: "d2", content: "Budget de 500€/mois pré-approuvé" },
    { id: "d3", content: "Intégration Slack prioritaire pour la phase POC" },
  ],
  contacts: [
    { id: "c1", name: "Jean Dupont", company: "Acme Corp", score: 92 },
    { id: "c2", name: "Marie Bernard", company: "Acme Corp", score: 75 },
    { id: "c3", name: "Pierre Lefebvre", company: "Tech Partner", score: 60 },
  ],
  demoMode: true,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  return new Response(JSON.stringify(DEMO_DATA), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
