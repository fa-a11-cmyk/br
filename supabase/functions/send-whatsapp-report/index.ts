import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { meetingId, userId, to, from } = await req.json();
    if (!meetingId || !userId) throw new Error("meetingId and userId required");

    // Determine recipient phone number
    let recipientPhone = to;
    if (!recipientPhone) {
      const { data: conn } = await supabase
        .from("user_connections")
        .select("config")
        .eq("user_id", userId)
        .eq("integration_id", "whatsapp")
        .eq("status", "connected")
        .single();
      recipientPhone = (conn?.config as any)?.phone_number;
    }
    if (!recipientPhone) throw new Error("Numéro WhatsApp destinataire non configuré");

    // Determine sender (Twilio WhatsApp number)
    let senderPhone = from;
    if (!senderPhone) {
      const { data: conn } = await supabase
        .from("user_connections")
        .select("credentials")
        .eq("user_id", userId)
        .eq("integration_id", "whatsapp")
        .eq("status", "connected")
        .single();
      senderPhone = (conn?.credentials as any)?.from_number || "whatsapp:+14155238886";
    }

    // Ensure whatsapp: prefix
    if (!recipientPhone.startsWith("whatsapp:")) recipientPhone = `whatsapp:${recipientPhone}`;
    if (!senderPhone.startsWith("whatsapp:")) senderPhone = `whatsapp:${senderPhone}`;

    // Fetch meeting data
    const { data: meeting } = await supabase.from("meetings").select("*").eq("id", meetingId).single();
    if (!meeting) throw new Error("Réunion non trouvée");

    const { data: tasks } = await supabase.from("extracted_tasks").select("*").eq("meeting_id", meetingId);
    const { data: decisions } = await supabase.from("extracted_decisions").select("*").eq("meeting_id", meetingId);

    const duration = meeting.duration_seconds ? `${Math.round(meeting.duration_seconds / 60)} min` : "N/A";
    const taskList = (tasks || []).map(t => `• ${t.title} → ${t.assignee || "N/A"}`).join("\n");
    const decisionList = (decisions || []).map(d => `• ${d.content}`).join("\n");

    const body = `📋 *${meeting.title}*\n⏱ ${duration} · 📊 Sentiment: ${meeting.sentiment_score ?? "N/A"}%\n\n${meeting.summary || "_Pas de résumé_"}\n\n*✅ Tâches (${tasks?.length || 0})*\n${taskList || "_Aucune_"}\n\n*🎯 Décisions (${decisions?.length || 0})*\n${decisionList || "_Aucune_"}`;

    // Send via Twilio WhatsApp API through gateway
    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: recipientPhone,
        From: senderPhone,
        Body: body,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Twilio WhatsApp API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, sid: data.sid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending WhatsApp report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
