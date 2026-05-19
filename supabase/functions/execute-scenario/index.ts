import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const { scenarioId, meetingId, triggerType = "manual" } = await req.json();
    if (!scenarioId) throw new Error("scenarioId requis");

    // Fetch scenario
    const { data: scenario, error: scenarioError } = await admin
      .from("scenarios")
      .select("*")
      .eq("id", scenarioId)
      .eq("user_id", user.id)
      .single();

    if (scenarioError || !scenario) throw new Error("Scénario introuvable");
    if (!scenario.is_active && triggerType !== "manual") throw new Error("Scénario inactif");

    // Create execution entry
    const { data: execution } = await admin
      .from("scenario_executions")
      .insert({
        scenario_id: scenarioId,
        user_id: user.id,
        meeting_id: meetingId || null,
        trigger_type: triggerType,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const startTime = Date.now();
    const actionsResults: any[] = [];
    let hasError = false;

    // Load meeting data if available
    let meetingData: any = null;
    if (meetingId) {
      const { data: m } = await admin.from("meetings")
        .select("*")
        .eq("id", meetingId).single();
      meetingData = m;
    }

    // Template context
    const ctx: Record<string, string> = {
      meeting_title: meetingData?.title || "Réunion",
      meeting_type: meetingData?.meeting_type || "autre",
      meeting_summary: meetingData?.summary || "",
      meeting_date: meetingData
        ? new Date(meetingData.created_at).toLocaleDateString("fr-FR")
        : new Date().toLocaleDateString("fr-FR"),
      user_id: user.id,
    };

    const interpolate = (str: string) =>
      str.replace(/\{\{(\w+)\}\}/g, (_, key) => ctx[key] || "");

    const actions = Array.isArray(scenario.actions) ? scenario.actions : [];

    for (const action of actions) {
      try {
        let actionResult: any = { type: action.type, status: "success" };

        switch (action.type) {
          case "send_email": {
            const { error } = await admin.functions.invoke("send-email-report", {
              body: {
                meetingId,
                userId: user.id,
                subject: interpolate(action.config?.subject || "Rapport RapidoMeet"),
              },
            });
            if (error) throw error;
            actionResult.message = "Email envoyé";
            break;
          }

          case "send_slack": {
            const channel = interpolate(action.config?.channel || "#general");
            const message = interpolate(action.config?.message || "Nouvelle réunion terminée");
            const { error } = await admin.functions.invoke("send-slack-report", {
              body: { meetingId, userId: user.id, channel, message },
            });
            if (error) throw error;
            actionResult.message = `Slack → ${channel}`;
            break;
          }

          case "send_whatsapp": {
            const { error } = await admin.functions.invoke("send-whatsapp-report", {
              body: { meetingId, userId: user.id },
            });
            if (error) throw error;
            actionResult.message = "WhatsApp envoyé";
            break;
          }

          case "send_telegram": {
            const { error } = await admin.functions.invoke("send-telegram-report", {
              body: { meetingId, userId: user.id },
            });
            if (error) throw error;
            actionResult.message = "Telegram envoyé";
            break;
          }

          case "trigger_n8n": {
            const n8nUrl = Deno.env.get("N8N_WEBHOOK_URL");
            if (!n8nUrl) throw new Error("N8N_WEBHOOK_URL non configuré");

            const payload = {
              workflow: action.config?.workflow || "default",
              trigger: triggerType,
              meeting: meetingData ? {
                id: meetingData.id,
                title: meetingData.title,
                type: meetingData.meeting_type,
                summary: meetingData.summary,
                sentiment_score: meetingData.sentiment_score,
                duration_seconds: meetingData.duration_seconds,
              } : null,
              timestamp: new Date().toISOString(),
              userId: user.id,
            };

            const n8nRes = await fetch(n8nUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!n8nRes.ok) throw new Error(`N8N error: ${n8nRes.status}`);
            actionResult.message = `N8N déclenché (${action.config?.workflow || "default"})`;
            break;
          }

          case "webhook": {
            const webhookUrl = action.config?.url;
            if (!webhookUrl) throw new Error("URL webhook manquante");
            const res = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trigger: triggerType, meetingId, userId: user.id, context: ctx }),
            });
            if (!res.ok) throw new Error(`Webhook error: ${res.status}`);
            actionResult.message = `Webhook → ${webhookUrl}`;
            break;
          }

          default:
            actionResult.status = "skipped";
            actionResult.message = `Action inconnue: ${action.type}`;
        }

        actionsResults.push(actionResult);
      } catch (actionError: any) {
        hasError = true;
        actionsResults.push({
          type: action.type,
          status: "failed",
          error: actionError.message || String(actionError),
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const finalStatus = hasError ? "failed" : "success";

    await admin.from("scenario_executions").update({
      status: finalStatus,
      actions_results: actionsResults,
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
      error_message: hasError
        ? actionsResults.filter(r => r.status === "failed").map(r => r.error).join(", ")
        : null,
    }).eq("id", execution?.id);

    await admin.from("scenarios").update({
      execution_count: (scenario.execution_count || 0) + 1,
      last_executed_at: new Date().toISOString(),
      last_status: finalStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", scenarioId);

    await admin.from("app_logs").insert({
      level: hasError ? "warn" : "info",
      source: "execute-scenario",
      message: `Scénario "${scenario.name}" exécuté : ${finalStatus}`,
      metadata: { scenarioId, meetingId, triggerType, actionsCount: actions.length, durationMs, actionsResults },
      user_id: user.id,
      meeting_id: meetingId || null,
    }).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      executionId: execution?.id,
      status: finalStatus,
      durationMs,
      actionsResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    await admin.from("app_logs").insert({
      level: "error",
      source: "execute-scenario",
      message: error.message || String(error),
      user_id: user.id,
    }).catch(() => {});

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
