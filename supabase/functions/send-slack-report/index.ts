import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { meetingId, userId, channel } = await req.json();

    // Fetch meeting data
    const { data: meeting } = await supabase.from("meetings").select("*").eq("id", meetingId).single();
    if (!meeting) throw new Error("Réunion non trouvée");

    const { data: tasks } = await supabase.from("extracted_tasks").select("*").eq("meeting_id", meetingId);
    const { data: decisions } = await supabase.from("extracted_decisions").select("*").eq("meeting_id", meetingId);

    // Build Slack message
    const taskList = (tasks || []).map(t => `• ${t.title} → ${t.assignee || "Non assigné"}`).join("\n");
    const decisionList = (decisions || []).map(d => `• ${d.content}`).join("\n");

    const blocks = [
      { type: "header", text: { type: "plain_text", text: `📋 ${meeting.title}`, emoji: true } },
      { type: "section", text: { type: "mrkdwn", text: meeting.summary || "_Pas de résumé disponible_" } },
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: `*✅ Tâches (${tasks?.length || 0})*\n${taskList || "_Aucune tâche_"}` } },
      { type: "section", text: { type: "mrkdwn", text: `*🎯 Décisions (${decisions?.length || 0})*\n${decisionList || "_Aucune décision_"}` } },
    ];

    // If Slack connector is available, use gateway
    if (LOVABLE_API_KEY && SLACK_API_KEY) {
      const response = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": SLACK_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: channel || "#general",
          text: `📋 Rapport de réunion : ${meeting.title}`,
          blocks,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`Slack API failed [${response.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify({ success: true, ts: data.result?.ts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: check user_connections for webhook URL
    const { data: conn } = await supabase.from("user_connections")
      .select("credentials").eq("user_id", userId).eq("integration_id", "slack").eq("status", "connected").single();

    if (conn?.credentials?.webhook_url) {
      const response = await fetch(conn.credentials.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `📋 *${meeting.title}*\n\n${meeting.summary || ""}\n\n*Tâches:*\n${taskList}\n\n*Décisions:*\n${decisionList}` }),
      });
      if (!response.ok) throw new Error(`Slack webhook failed: ${response.status}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Slack non configuré" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending Slack report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
