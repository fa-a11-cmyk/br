import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BLOG_MASTER_PROMPT = `Tu es un expert en content marketing pour SaaS B2B francophone. Tu crées des articles de blog optimisés SEO pour RapidoMeet, une plateforme d'intelligence post-réunion IA.

Ton style : professionnel mais accessible, concret, orienté PME françaises et tunisiennes.

Pour chaque article tu dois :
1. Créer un titre accrocheur avec le mot-clé principal
2. Écrire un excerpt de 160 caractères max (SEO)
3. Générer le contenu HTML complet structuré avec :
   - H1 (titre principal avec mot-clé)
   - Introduction engageante (problème → solution)
   - H2 pour chaque section principale (4-6 sections)
   - H3 pour les sous-sections
   - Paragraphes de 3-5 phrases
   - Listes à puces pour les étapes/conseils
   - Appels à l'action (CTA) intégrés naturellement
   - Conclusion avec CTA final
4. Proposer 3-5 mots-clés SEO secondaires
5. Créer les balises Schema.org (Article)
6. Suggérer 3 prompts d'images IA pour illustrer
7. Proposer un titre de leads magnet pertinent
8. Calculer le temps de lecture estimé

Réponds UNIQUEMENT en JSON valide sans markdown.`;

const IMAGE_MASTER_PROMPT = `Tu es un expert en direction artistique pour contenu SaaS B2B. Génère des prompts détaillés pour créer des images professionnelles et modernes.

Style cible : flat design moderne, couleurs primaires indigo/violet (#6366f1), fond clair ou sombre, illustrations vectorielles, screenshots d'UI, infographies business.

Adapte le prompt selon le contexte de l'article et du paragraphe spécifique.
Format : prompt en anglais, ultra-détaillé, style Midjourney/DALL-E optimisé.`;

async function callAI(system: string, userContent: string, maxTokens = 4096) {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) throw new Error("LOVABLE_API_KEY manquant");

  const res = await fetch("https://ai.gateway.lovable.dev/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJSON(text: string) {
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const authHeader = req.headers.get("authorization");
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader || "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const { data: role } = await admin
    .from("user_roles").select("role")
    .eq("user_id", user.id).eq("role", "admin")
    .maybeSingle();
  if (!role)
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { action, payload } = await req.json();
    let result: any = {};

    if (action === "generate_article") {
      const {
        topic, keywords, target_audience,
        article_type, word_count = 1500,
        include_lead_magnet = true,
        phone_number, website_url,
      } = payload;

      const userPrompt = `Génère un article de blog complet pour RapidoMeet.

SUJET : ${topic}
MOT-CLÉ PRINCIPAL : ${keywords?.[0] || topic}
MOTS-CLÉS SECONDAIRES : ${keywords?.slice(1)?.join(", ") || ""}
AUDIENCE : ${target_audience || "PME dirigeants, managers"}
TYPE : ${article_type || "guide pratique"}
LONGUEUR CIBLE : ${word_count} mots
TÉLÉPHONE : ${phone_number || ""}
SITE WEB : ${website_url || "https://rapidomeet.io"}
INCLURE LEADS MAGNET : ${include_lead_magnet}

Retourne ce JSON :
{
  "title": "Titre H1 optimisé SEO",
  "slug": "titre-en-kebab-case",
  "excerpt": "Description 155 chars max",
  "seo_title": "Titre SEO 60 chars max",
  "seo_description": "Meta desc 155 chars",
  "seo_keywords": ["kw1","kw2","kw3","kw4","kw5"],
  "reading_time_minutes": 7,
  "content_html": "HTML COMPLET ICI avec toutes les sections",
  "image_prompts": [
    {"section": "hero", "context": "Description du contexte", "prompt": "Prompt image en anglais ultra-détaillé"},
    {"section": "section_2", "context": "Description", "prompt": "Prompt image"},
    {"section": "conclusion", "context": "Description", "prompt": "Prompt image"}
  ],
  "lead_magnet_suggestion": {
    "title": "Titre du leads magnet",
    "type": "checklist",
    "description": "Description courte"
  },
  "schema_markup": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Titre",
    "description": "Excerpt",
    "author": {"@type": "Organization", "name": "RapidoMeet"}
  },
  "internal_links": [
    {"anchor_text": "texte du lien", "suggested_url": "/fonctionnalites", "context": "où placer ce lien"}
  ]
}

RÈGLES HTML :
- Utilise des balises sémantiques (h1,h2,h3,p,ul,li)
- Intègre des CTA avec liens vers ${website_url || "https://rapidomeet.io"}
- Optimise pour les featured snippets Google
- Ajoute des balises aria-label sur les liens
- Structure FAQ en fin d'article si pertinent
- Utilise des listes numérotées pour les étapes`;

      const text = await callAI(BLOG_MASTER_PROMPT, userPrompt, 8192);
      try { result = parseJSON(text); } catch { result = { error: "Parse error", raw: text }; }

    } else if (action === "generate_image_prompt") {
      const { article_title, section_context, style_preferences } = payload;

      const text = await callAI(IMAGE_MASTER_PROMPT, `Article : "${article_title}"
Contexte du paragraphe : "${section_context}"
Style préféré : ${style_preferences || "flat design moderne, couleurs indigo"}

Génère 3 prompts d'images différents pour illustrer ce paragraphe.
Format JSON :
{"prompts": [{"label": "Option 1 - Description courte", "prompt": "Prompt détaillé en anglais", "style": "flat_design|photo|infographic"}]}`, 1024);
      try { result = parseJSON(text); } catch { result = { error: "Parse error" }; }

    } else if (action === "optimize_seo") {
      const { title, content_html, target_keyword, phone_number, location } = payload;

      const text = await callAI("Tu es un expert SEO technique spécialisé en référencement local et SaaS B2B.", `Optimise le SEO de cet article :
TITRE : ${title}
MOT-CLÉ CIBLE : ${target_keyword}
TÉLÉPHONE : ${phone_number || ""}
LOCALISATION : ${location || "France"}

CONTENU HTML :
${content_html?.substring(0, 3000)}

Retourne JSON :
{
  "seo_title": "Titre optimisé 60 chars",
  "seo_description": "Meta description 155 chars",
  "h1_optimized": "H1 avec mot-clé exact",
  "schema_faq": [{"question": "Question fréquente", "answer": "Réponse concise"}],
  "improvements": ["Suggestion 1", "Suggestion 2"],
  "keyword_density": "X%",
  "readability_score": 85,
  "missing_keywords": ["kw manquant"]
}`, 2048);
      try { result = parseJSON(text); } catch { result = { error: "Parse error" }; }

    } else if (action === "enrich_paragraph") {
      const { paragraph_text, context, style, add_stats } = payload;

      const text = await callAI("Tu es un rédacteur web expert en content marketing SaaS B2B.", `Enrichis ce paragraphe de blog :
"${paragraph_text}"

Contexte de l'article : ${context}
Style souhaité : ${style || "professionnel"}
Ajouter des statistiques : ${add_stats || false}

Retourne JSON :
{
  "enriched_html": "<p>Paragraphe enrichi...</p>",
  "stats_added": ["stat1", "stat2"],
  "internal_link_suggestion": {"anchor": "texte ancre", "url": "/page-interne"}
}`, 1024);
      try { result = parseJSON(text); } catch { result = { error: "Parse error" }; }

    } else {
      throw new Error(`Action inconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
