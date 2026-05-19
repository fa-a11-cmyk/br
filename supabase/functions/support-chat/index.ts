import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORT_BOT_PROMPT = `Tu es l'assistant support de RapidoMeet, une plateforme SaaS d'intelligence post-réunion. Tu t'appelles "Rapido" et tu es amical, professionnel et concis.

Règles :
- Réponds TOUJOURS en français
- Sois concis (max 3-4 phrases)
- Si tu ne sais pas, dis-le honnêtement
- Propose de connecter avec un humain si la question est complexe
- Ne fais JAMAIS de promesses sur les prix ou les délais
- Pour les bugs techniques, demande les détails (navigateur, OS, étapes)

Quand tu ne peux pas résoudre, réponds avec ce JSON exact :
{"escalate": true, "reason": "raison courte"}

Sinon réponds normalement en texte.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const { action, payload } = await req.json();

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    let result: any = {};

    if (action === "start_conversation") {
      const { visitor_id, page_url, initial_message, subject } = payload;

      let userContext: any = {};
      if (userId) {
        const [{ data: profile }, { data: sub }] = await Promise.all([
          admin.from("profiles").select("first_name, last_name, company").eq("user_id", userId).single(),
          admin.from("subscriptions").select("plan, status").eq("user_id", userId).maybeSingle(),
        ]);
        userContext = {
          name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
          company: profile?.company,
          plan: sub?.plan || "free",
        };
      }

      const { data: conv } = await admin.from("support_conversations").insert({
        user_id: userId,
        visitor_id: visitor_id || null,
        status: "open",
        subject: subject || initial_message?.substring(0, 60) || "Nouvelle conversation",
        channel: "widget",
        metadata: { page_url, user_context: userContext, user_agent: req.headers.get("user-agent") },
      }).select().single();

      const welcomeMsg = userId && userContext.name
        ? `Bonjour ${userContext.name} ! 👋 Je suis Rapido, l'assistant RapidoMeet. Comment puis-je vous aider ?`
        : `Bonjour ! 👋 Je suis Rapido, l'assistant RapidoMeet. Comment puis-je vous aider ?`;

      await admin.from("support_messages").insert({
        conversation_id: conv.id,
        sender_type: "bot",
        content: welcomeMsg,
        payload: {
          quick_replies: [
            { label: "📁 Importer audio", value: "Comment importer un fichier audio ?" },
            { label: "💳 Changer de plan", value: "Comment changer de plan ?" },
            { label: "🔗 Partager rapport", value: "Comment partager un rapport ?" },
            { label: "🐛 Signaler un bug", value: "Je veux signaler un bug" },
          ],
        },
      });

      if (initial_message) {
        await processUserMessage(admin, conv.id, userId, initial_message, userContext);
      }

      result = { conversation_id: conv.id };

    } else if (action === "send_message") {
      const { conversation_id, content } = payload;

      const { data: conv } = await admin.from("support_conversations").select("*").eq("id", conversation_id).single();
      if (!conv) throw new Error("Conversation introuvable");

      const userContext: any = conv.metadata?.user_context || {};

      await admin.from("support_messages").insert({
        conversation_id,
        sender_type: "user",
        sender_id: userId,
        content,
      });

      if (!conv.assigned_to || conv.status === "open") {
        await processUserMessage(admin, conversation_id, userId, content, userContext);
      }

      result = { success: true };

    } else if (action === "get_messages") {
      const { conversation_id } = payload;
      const { data: messages } = await admin.from("support_messages").select("*").eq("conversation_id", conversation_id).eq("is_internal", false).order("created_at");
      result = { messages: messages || [] };

    } else if (action === "resolve") {
      const { conversation_id, satisfaction, comment } = payload;
      await admin.from("support_conversations").update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        satisfaction_score: satisfaction || null,
        satisfaction_comment: comment || null,
        updated_at: new Date().toISOString(),
      }).eq("id", conversation_id);
      result = { success: true };

    } else {
      throw new Error(`Action inconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processUserMessage(admin: any, conversationId: string, userId: string | null, userMessage: string, userContext: any) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    await escalateToHuman(admin, conversationId, "IA non configurée");
    return;
  }

  const { data: articles } = await admin.from("support_articles").select("title, content, category").eq("is_published", true).limit(10);
  const knowledgeBase = (articles || []).map((a: any) => `### ${a.title}\n${a.content}`).join("\n\n");

  const { data: history } = await admin.from("support_messages").select("sender_type, content").eq("conversation_id", conversationId).eq("is_internal", false).order("created_at", { ascending: false }).limit(6);

  const messages = (history || []).reverse().filter((m: any) => m.content !== userMessage).map((m: any) => ({
    role: m.sender_type === "user" ? "user" : "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: userMessage });

  const systemPrompt = SUPPORT_BOT_PROMPT + `\n\nContexte utilisateur:\nNom: ${userContext.name || "Inconnu"}\nPlan: ${userContext.plan || "free"}\nEntreprise: ${userContext.company || "Non renseigné"}\n\nBase de connaissances RapidoMeet:\n${knowledgeBase}`;

  try {
    const res = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 512,
      }),
    });

    const data = await res.json();
    const botResponse = data.choices?.[0]?.message?.content || "";

    if (!botResponse) {
      await escalateToHuman(admin, conversationId, "Réponse IA vide");
      return;
    }

    try {
      const parsed = JSON.parse(botResponse);
      if (parsed.escalate) {
        await escalateToHuman(admin, conversationId, parsed.reason);
        return;
      }
    } catch {
      // Not JSON — normal response
    }

    await admin.from("support_messages").insert({
      conversation_id: conversationId,
      sender_type: "bot",
      content: botResponse,
    });

    await admin.from("support_conversations").update({
      first_response_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", conversationId).is("first_response_at", null);
  } catch (e) {
    console.error("AI error:", e);
    await escalateToHuman(admin, conversationId, "Erreur IA");
  }
}

async function escalateToHuman(admin: any, conversationId: string, reason: string) {
  await admin.from("support_messages").insert({
    conversation_id: conversationId,
    sender_type: "bot",
    content: `Je vais vous connecter avec notre équipe support. Un agent vous répondra dans les meilleurs délais. En attendant, consultez notre [documentation](/docs) ou envoyez-nous un email à support@rapidomeet.io`,
  });

  await admin.from("support_conversations").update({
    status: "pending",
    priority: "high",
    updated_at: new Date().toISOString(),
  }).eq("id", conversationId);

  const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  for (const adminUser of admins || []) {
    await admin.rpc("create_notification", {
      p_user_id: adminUser.user_id,
      p_type: "system",
      p_title: "🆘 Escalade support",
      p_message: `Une conversation nécessite une intervention humaine : ${reason}`,
      p_link: "/admin",
    }).catch(() => {});
  }
}
