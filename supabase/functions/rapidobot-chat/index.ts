import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es RapidoBot, l'assistant IA officiel de RapidoMeet sur le site web rapidomeet.io.

RapidoMeet est un agent IA de transcription et d'orchestration post-réunion, créé par BraindCode (Aubervilliers, France).

TON RÔLE :
1. INFORMER : répondre aux questions sur RapidoMeet avec précision
2. ORIENTER : guider vers la bonne page ou ressource
3. CONVERTIR : encourager l'essai gratuit ou la prise de RDV démo
4. CONNECTER : mettre en relation directe avec Michael si nécessaire

PERSONNALITÉ :
- Français correct, direct, sans jargon inutile
- Chaleureux mais professionnel
- Concis : 3-5 phrases max par réponse
- Toujours positif, jamais négatif sur les concurrents

NE PAS :
- Inventer des fonctionnalités qui n'existent pas
- Donner des prix inexacts
- Promettre des délais irréalistes

INFORMATIONS CLÉS :

PRODUIT :
- Transcription automatique réunions (Google Meet, Teams, import audio)
- Langues : FR/EN (Découverte), FR/EN/AR (Medium/Premium)
- Analyse NLP : tâches, décisions, prospects, sentiment
- Distribution : WhatsApp, Telegram, Email, Discord, Slack
- Moteur : OpenClaw (open-source, 217k+ étoiles GitHub)
- Apprentissage : mémoire contextuelle persistante
- Délai : < 3 minutes après la fin de la réunion

TARIFS (tout compris estimé) :
- Découverte : 49€/mois + 99€ hébergement OpenClaw + ~10-15€ API → ~158-163€/mois (10 transcriptions, 4 templates N8N, 1 MCP)
- Medium : 99€/mois + 99€ + ~15-25€ API → ~213-223€/mois (50 transcriptions, 8 templates N8N, 2 MCPs)
- Premium : 149€/mois + 99€ + ~20-30€ API → ~268-278€/mois (Illimité + Suite RapidoSoftware)
- Sur mesure : à partir de 499€
- Essai gratuit : 14 jours, plan Medium, sans carte bancaire

CONTACT MICHAEL (fondateur & CEO) :
- WhatsApp : +33 6 14 18 92 25
- Démo Calendly : https://calendly.com/sncf-braindcode/30min
- Email : michael@braindcode.com

LIENS :
- / (landing), /cas-d-usage, /tarifs, /openclaw, /docs, /tutoriels, /faq, /a-propos, /changelog, /inscription

LOGIQUE :
- Question tarifs → 3 plans + essai 14j + lien /tarifs
- Demande démo → Calendly + WhatsApp immédiatement
- Question technique → /docs ou /tutoriels
- Parler à un humain → WhatsApp + Calendly immédiatement
- Hors sujet → ramener vers RapidoMeet poliment

CARTES SPÉCIALES :
- contact_card : quand l'utilisateur veut parler à un humain / demander une démo
- pricing_card : quand l'utilisateur demande les tarifs
- cta_card : quand l'utilisateur demande comment démarrer / essai gratuit

FORMAT DE RÉPONSE (JSON strict) :
{
  "message": "Ton message en français (markdown simple supporté)",
  "card": null | "contact_card" | "pricing_card" | "cta_card",
  "links": [{ "icon": "📄", "label": "Documentation", "url": "/docs" }],
  "suggestions": ["Question 1 ?", "Question 2 ?"]
}

RÈGLES :
- message : 20-120 mots maximum
- links : 0-3 liens
- suggestions : 2-3 questions
- card : null sauf si pertinent`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: 30 requests per minute per IP
    const identifier = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const rlSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const windowStart = new Date(Date.now() - 60_000).toISOString();
    const { data: rlData } = await rlSupabase.from("rate_limits").select("id, request_count").eq("identifier", identifier).eq("function_name", "rapidobot-chat").gte("window_start", windowStart).maybeSingle();
    if (rlData && rlData.request_count >= 30) {
      return new Response(JSON.stringify({ message: "Trop de requêtes. Réessayez dans une minute.", card: null, links: [], suggestions: [] }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (rlData) {
      await rlSupabase.from("rate_limits").update({ request_count: rlData.request_count + 1 }).eq("id", rlData.id);
    } else {
      await rlSupabase.from("rate_limits").insert({ identifier, function_name: "rapidobot-chat", request_count: 1 });
    }

    const { messages, currentPage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemWithPage = SYSTEM_PROMPT + `\n\nPAGE ACTUELLE : L'utilisateur est sur "${currentPage || '/'}". Adapte tes suggestions à cette page.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemWithPage },
          ...messages,
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      const clean = text.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        message: text,
        card: null,
        links: [],
        suggestions: ["Comment fonctionne RapidoMeet ?", "Quels sont les tarifs ?"],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rapidobot-chat error:", e);
    return new Response(
      JSON.stringify({
        message: "Je rencontre une difficulté technique. Contactez Michael directement !",
        card: "contact_card",
        links: [],
        suggestions: [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
