import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { meetingId, userId, chatId } = await req.json();

    const { data: meeting } = await supabase.from("meetings").select("*").eq("id", meetingId).single();
    if (!meeting) throw new Error("Réunion non trouvée");

    const { data: tasks } = await supabase.from("extracted_tasks").select("*").eq("meeting_id", meetingId);
    const { data: decisions } = await supabase.from("extracted_decisions").select("*").eq("meeting_id", meetingId);

    const taskList = (tasks || []).map(t => `• ${t.title} → ${t.assignee || "N/A"}`).join("\n");
    const decisionList = (decisions || []).map(d => `• ${d.content}`).join("\n");

    const duration = meeting.duration_seconds ? `${Math.round(meeting.duration_seconds / 60)} min` : "N/A";
    const text = `📋 <b>${meeting.title}</b>\n⏱ ${duration} · 📊 Sentiment: ${meeting.sentiment_score ?? "N/A"}%\n\n${meeting.summary || "<i>Pas de résumé</i>"}\n\n<b>✅ Tâches (${tasks?.length || 0})</b>\n${taskList || "<i>Aucune</i>"}\n\n<b>🎯 Décisions (${decisions?.length || 0})</b>\n${decisionList || "<i>Aucune</i>"}`;

    // Use gateway if connector available
    if (LOVABLE_API_KEY && TELEGRAM_API_KEY) {
      const targetChatId = chatId || await getChatIdFromConnections(supabase, userId);
      if (!targetChatId) {
        return new Response(JSON.stringify({ error: "Chat ID Telegram non configuré" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: targetChatId, text, parse_mode: "HTML" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);

      return new Response(JSON.stringify({ success: true, message_id: data.result?.message_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: use stored bot token
    const { data: conn } = await supabase.from("user_connections")
      .select("credentials, config").eq("user_id", userId).eq("integration_id", "telegram").eq("status", "connected").single();

    if (conn?.credentials?.bot_token && conn?.config?.chat_id) {
      const response = await fetch(`https://api.telegram.org/bot${conn.credentials.bot_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: conn.config.chat_id, text, parse_mode: "HTML" }),
      });
      if (!response.ok) throw new Error(`Telegram direct failed: ${response.status}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Telegram non configuré" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending Telegram report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getChatIdFromConnections(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase.from("user_connections")
    .select("config").eq("user_id", userId).eq("integration_id", "telegram").eq("status", "connected").single();
  return data?.config?.chat_id || null;
}
