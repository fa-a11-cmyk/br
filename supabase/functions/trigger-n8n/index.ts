import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { meetingId, webhookUrl, event = "meeting.completed" } = await req.json();

    if (!meetingId) throw new Error("meetingId is required");
    if (!webhookUrl) throw new Error("webhookUrl is required");

    // Gather all meeting data
    const [meetingRes, tasksRes, decisionsRes, contactsRes, transcriptionRes] = await Promise.all([
      supabase.from("meetings").select("*").eq("id", meetingId).single(),
      supabase.from("extracted_tasks").select("*").eq("meeting_id", meetingId),
      supabase.from("extracted_decisions").select("*").eq("meeting_id", meetingId),
      supabase.from("detected_contacts").select("*").eq("meeting_id", meetingId),
      supabase.from("transcriptions").select("full_text, word_count, language").eq("meeting_id", meetingId).single(),
    ]);

    if (!meetingRes.data) throw new Error("Meeting not found");

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data: {
        meeting_id: meetingId,
        title: meetingRes.data.title,
        type: meetingRes.data.meeting_type,
        status: meetingRes.data.status,
        summary: meetingRes.data.summary,
        sentiment_score: meetingRes.data.sentiment_score,
        precision_percent: meetingRes.data.precision_percent,
        duration_seconds: meetingRes.data.duration_seconds,
        stats: {
          tasks: tasksRes.data?.length || 0,
          decisions: decisionsRes.data?.length || 0,
          contacts: contactsRes.data?.length || 0,
          word_count: transcriptionRes.data?.word_count || 0,
        },
        tasks: tasksRes.data || [],
        decisions: decisionsRes.data || [],
        contacts: contactsRes.data || [],
      },
    };

    // Send webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const webhookStatus = webhookResponse.status;
    const webhookOk = webhookStatus >= 200 && webhookStatus < 300;

    return new Response(JSON.stringify({
      success: webhookOk,
      webhookStatus,
      event,
      meetingId,
    }), {
      status: webhookOk ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trigger-n8n error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
