import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const identifier = req.headers.get("authorization")?.replace("Bearer ", "").slice(0, 20) || "unknown";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const rlSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Rate limiting
    const windowStart = new Date(Date.now() - 60_000).toISOString();
    const { data: rlData } = await rlSupabase.from("rate_limits").select("id, request_count").eq("identifier", identifier).eq("function_name", "analyze-transcript").gte("window_start", windowStart).maybeSingle();
    if (rlData && rlData.request_count >= 10) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (rlData) {
      await rlSupabase.from("rate_limits").update({ request_count: rlData.request_count + 1 }).eq("id", rlData.id);
    } else {
      await rlSupabase.from("rate_limits").insert({ identifier, function_name: "analyze-transcript", request_count: 1 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { meetingId } = await req.json();
    if (!meetingId) throw new Error("meetingId is required");

    // Get transcription
    const { data: transcription, error: txError } = await supabase
      .from("transcriptions")
      .select("full_text, segments")
      .eq("meeting_id", meetingId)
      .single();

    if (txError || !transcription) throw new Error("Transcription not found");

    // Get meeting info
    const { data: meeting } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single();

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es un analyste de réunion expert. Analyse la transcription et extrais les informations structurées.

Réponds UNIQUEMENT en JSON valide :
{
  "summary": "Résumé exécutif en 3-5 phrases de la réunion",
  "sentiment_score": 75,
  "precision_percent": 92,
  "tasks": [
    {
      "title": "Titre de la tâche (action concrète avec verbe)",
      "assignee": "Nom de la personne (ou null)",
      "deadline": "2026-04-01T00:00:00Z (ou null)",
      "priority": "low|medium|high|critical",
      "source_timestamp": "14:23"
    }
  ],
  "decisions": [
    {
      "content": "Décision prise formulée clairement",
      "source_timestamp": "05:12"
    }
  ],
  "contacts": [
    {
      "name": "Nom complet ou Entreprise",
      "company": "Entreprise (ou null)",
      "email": "email (ou null)",
      "score": 80,
      "interest_signals": "Description des signaux d'intérêt"
    }
  ],
  "key_topics": ["sujet1", "sujet2", "sujet3"]
}

RÈGLES :
- sentiment_score : 0 (très négatif) à 100 (très positif), 50 = neutre
- precision_percent : ta confiance dans l'analyse (0-100)
- priority : basé sur l'urgence perçue dans le texte (uniquement low/medium/high/critical)
- tasks : maximum 10, uniquement les actions concrètes avec verbe
- decisions : uniquement les décisions formelles prises
- contacts : personnes ou entreprises mentionnées, score = importance (0-100)
- Ne pas inventer de données — extraire uniquement ce qui est mentionné
- Réponds en français uniquement`
          },
          {
            role: "user",
            content: `Réunion : "${meeting?.title || "Sans titre"}" (type: ${meeting?.meeting_type || "autre"})

Transcription :
${transcription.full_text.substring(0, 12000)}`
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const text = aiData.choices?.[0]?.message?.content || "{}";

    let analysis: any;
    try {
      const clean = text.replace(/```json\n?|\n?```/g, "").trim();
      analysis = JSON.parse(clean);
    } catch {
      analysis = { summary: text, sentiment_score: 50, precision_percent: 50, tasks: [], decisions: [], contacts: [], key_topics: [] };
    }

    // Insert tasks
    if (analysis.tasks?.length > 0) {
      await supabase.from("extracted_tasks").insert(
        analysis.tasks.map((t: any) => ({
          meeting_id: meetingId,
          user_id: user.id,
          title: t.title,
          assignee: t.assignee || null,
          deadline: t.deadline || null,
          priority: t.priority || "medium",
          status: "pending",
          source_timestamp: t.source_timestamp || null,
        }))
      );
    }

    // Insert decisions
    if (analysis.decisions?.length > 0) {
      await supabase.from("extracted_decisions").insert(
        analysis.decisions.map((d: any) => ({
          meeting_id: meetingId,
          user_id: user.id,
          content: d.content,
          source_timestamp: d.source_timestamp || null,
        }))
      );
    }

    // Insert contacts
    if (analysis.contacts?.length > 0) {
      await supabase.from("detected_contacts").insert(
        analysis.contacts.map((c: any) => ({
          meeting_id: meetingId,
          user_id: user.id,
          name: c.name,
          company: c.company || null,
          email: c.email || null,
          score: c.score || 0,
          interest_signals: c.interest_signals || null,
        }))
      );
    }

    // Generate and save report
    const reportDate = new Date(meeting?.created_at || Date.now()).toLocaleDateString("fr-FR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const sentimentLabel = (analysis.sentiment_score || 50) >= 70 ? "Positif" 
      : (analysis.sentiment_score || 50) >= 40 ? "Neutre" : "Négatif";
    const sentimentColor = (analysis.sentiment_score || 50) >= 70 ? "#22c55e"
      : (analysis.sentiment_score || 50) >= 40 ? "#f59e0b" : "#ef4444";

    const segments = Array.isArray(transcription.segments) ? transcription.segments : [];

    const reportHtml = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e; }
  .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 24px; font-weight: 800; color: #6366f1; }
  h1 { font-size: 22px; margin: 10px 0 4px; }
  .meta { color: #6b7280; font-size: 14px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .section { margin: 24px 0; }
  .section h2 { font-size: 16px; font-weight: 700; color: #4f46e5; border-left: 4px solid #6366f1; padding-left: 10px; margin-bottom: 12px; }
  .summary-box { background: #f0f0ff; border-radius: 8px; padding: 16px; font-size: 15px; line-height: 1.6; }
  .task { display: flex; align-items: flex-start; gap: 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; }
  .priority-critical { border-left: 4px solid #ef4444; }
  .priority-high { border-left: 4px solid #f97316; }
  .priority-medium { border-left: 4px solid #f59e0b; }
  .priority-low { border-left: 4px solid #22c55e; }
  .decision { padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 6px; font-size: 14px; }
  .contact { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #ede9fe; border-radius: 20px; margin: 4px; font-size: 13px; }
  .segment { font-size: 13px; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
  .speaker { font-weight: 600; color: #6366f1; min-width: 90px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">⚡ RapidoMeet</div>
  <h1>${meeting?.title || "Réunion"}</h1>
  <div class="meta">
    📅 ${reportDate} &nbsp;·&nbsp; 
    🏷 ${meeting?.meeting_type || "Général"} &nbsp;·&nbsp;
    <span class="badge" style="background:${sentimentColor}20;color:${sentimentColor}">
      ${sentimentLabel} (${analysis.sentiment_score || 50}/100)
    </span>
  </div>
</div>

<div class="section">
  <h2>📋 Résumé exécutif</h2>
  <div class="summary-box">${analysis.summary || "Résumé non disponible"}</div>
</div>

${analysis.tasks?.length > 0 ? `
<div class="section">
  <h2>✅ Actions à mener (${analysis.tasks.length})</h2>
  ${analysis.tasks.map((t: any) => `
  <div class="task priority-${t.priority || 'medium'}">
    <div style="flex:1">
      <strong>${t.title}</strong>
      ${t.assignee ? `<br><span style="color:#6b7280;font-size:13px">👤 ${t.assignee}</span>` : ""}
      ${t.deadline ? `<span style="color:#6b7280;font-size:13px">&nbsp;·&nbsp;📅 ${t.deadline}</span>` : ""}
    </div>
    <span class="badge" style="background:#f3f4f6;color:#374151">${t.priority || 'medium'}</span>
  </div>`).join("")}
</div>` : ""}

${analysis.decisions?.length > 0 ? `
<div class="section">
  <h2>🎯 Décisions prises (${analysis.decisions.length})</h2>
  ${analysis.decisions.map((d: any) => `
  <div class="decision">✓ ${d.content}</div>`).join("")}
</div>` : ""}

${analysis.contacts?.length > 0 ? `
<div class="section">
  <h2>👥 Contacts & Entreprises mentionnés</h2>
  <div>
    ${analysis.contacts.map((c: any) => `
    <span class="contact">👤 ${c.name} <span style="color:#7c3aed">${c.score || 0}%</span></span>`).join("")}
  </div>
</div>` : ""}

${segments.length > 0 ? `
<div class="section">
  <h2>🎙 Transcription complète</h2>
  ${(segments as any[]).slice(0, 50).map((s: any) => `
  <div class="segment">
    <span class="speaker">${s.speaker || "Locuteur"}</span>
    <span>${s.text || s.content || ""}</span>
  </div>`).join("")}
  ${segments.length > 50 ? `<p style="color:#6b7280;font-size:13px">... et ${segments.length - 50} segments supplémentaires</p>` : ""}
</div>` : ""}

<div class="footer">
  Rapport généré automatiquement par RapidoMeet &nbsp;·&nbsp; 
  ${new Date().toLocaleDateString("fr-FR")} &nbsp;·&nbsp;
  Propulsé par IA
</div>
</body>
</html>`;

    // Save report
    await supabase.from("reports").upsert({
      meeting_id: meetingId,
      user_id: user.id,
      title: `Rapport — ${meeting?.title || "Réunion"}`,
      content_html: reportHtml,
      content_json: analysis,
      report_type: meeting?.meeting_type || "standard",
    }, { onConflict: "meeting_id" }).catch(() => {
      // If upsert fails (no unique constraint on meeting_id), try insert
      return supabase.from("reports").insert({
        meeting_id: meetingId,
        user_id: user.id,
        title: `Rapport — ${meeting?.title || "Réunion"}`,
        content_html: reportHtml,
        content_json: analysis,
        report_type: meeting?.meeting_type || "standard",
      });
    });

    // Update meeting status to completed
    await supabase.from("meetings").update({
      status: "completed",
      summary: analysis.summary || null,
      sentiment_score: analysis.sentiment_score || null,
      precision_percent: analysis.precision_percent || null,
      completed_at: new Date().toISOString(),
    }).eq("id", meetingId);

    // Auto-distribute reports to connected channels
    const { data: connections } = await supabase
      .from("user_connections")
      .select("integration_id, config, credentials, status")
      .eq("user_id", user.id)
      .eq("status", "connected");

    const activeConnections = connections || [];
    const distributionResults: Record<string, string> = {};

    const { data: distSettings } = await supabase
      .from("user_settings")
      .select("settings_value")
      .eq("user_id", user.id)
      .eq("settings_key", "distribution")
      .single();

    const distConfig = (distSettings?.settings_value as Record<string, boolean>) || {};

    const slackConn = activeConnections.find((c: any) => c.integration_id === "slack");
    if (slackConn && distConfig.slack_enabled !== false) {
      try {
        const channel = (slackConn.config as any)?.channel || "#general";
        await supabase.functions.invoke("send-slack-report", { body: { meetingId, userId: user.id, channel } });
        distributionResults.slack = "sent";
      } catch { distributionResults.slack = "failed"; }
    }

    const telegramConn = activeConnections.find((c: any) => c.integration_id === "telegram");
    if (telegramConn && distConfig.telegram_enabled !== false) {
      try {
        const chatId = (telegramConn.config as any)?.chat_id;
        await supabase.functions.invoke("send-telegram-report", { body: { meetingId, userId: user.id, chatId } });
        distributionResults.telegram = "sent";
      } catch { distributionResults.telegram = "failed"; }
    }

    if (distConfig.email_enabled !== false) {
      try {
        await supabase.functions.invoke("send-email-report", { body: { meetingId, userId: user.id } });
        distributionResults.email = "sent";
      } catch { distributionResults.email = "failed"; }
    }

    const whatsappConn = activeConnections.find((c: any) => c.integration_id === "whatsapp");
    if (whatsappConn && distConfig.whatsapp_enabled !== false) {
      try {
        await supabase.functions.invoke("send-whatsapp-report", { body: { meetingId, userId: user.id } });
        distributionResults.whatsapp = "sent";
      } catch { distributionResults.whatsapp = "failed"; }
    }

    // Auto-trigger active scenarios for meeting_completed
    try {
      const { data: activeScenarios } = await supabase
        .from("scenarios")
        .select("id, filter_meeting_type, filter_min_duration, filter_sentiment_min")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("trigger_type", "meeting_completed");

      for (const scenario of (activeScenarios || [])) {
        if (scenario.filter_meeting_type?.length > 0
            && !scenario.filter_meeting_type.includes(meeting?.meeting_type || "")) {
          continue;
        }
        if (scenario.filter_min_duration
            && (meeting?.duration_seconds || 0) < scenario.filter_min_duration) {
          continue;
        }
        if (scenario.filter_sentiment_min
            && (analysis.sentiment_score || 0) < scenario.filter_sentiment_min) {
          continue;
        }
        // Fire-and-forget
        supabase.functions.invoke("execute-scenario", {
          body: { scenarioId: scenario.id, meetingId, triggerType: "meeting_completed" },
        }).catch(() => {});
      }
    } catch {}

    // Dispatch user webhooks for meeting.completed event
    try {
      const { data: userWebhooks } = await supabase
        .from("webhooks")
        .select("id, url, events, secret")
        .eq("user_id", user.id)
        .eq("status", "active");

      for (const wh of (userWebhooks || [])) {
        if (!wh.events?.includes("meeting.completed")) continue;

        const webhookPayload = {
          event: "meeting.completed",
          meeting_id: meetingId,
          meeting_title: meeting?.title,
          meeting_type: meeting?.meeting_type,
          tasks_count: analysis.tasks?.length || 0,
          decisions_count: analysis.decisions?.length || 0,
          contacts_count: analysis.contacts?.length || 0,
          sentiment_score: analysis.sentiment_score,
          timestamp: new Date().toISOString(),
        };

        const startMs = Date.now();
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          // HMAC signature if secret is set
          if (wh.secret) {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(wh.secret);
            const msgData = encoder.encode(JSON.stringify(webhookPayload));
            const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
            const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
            headers["X-RapidoMeet-Signature"] = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
          }

          const whRes = await fetch(wh.url, {
            method: "POST",
            headers,
            body: JSON.stringify(webhookPayload),
          });

          // Log delivery
          await supabase.from("webhook_deliveries").insert({
            webhook_id: wh.id,
            event_type: "meeting.completed",
            payload: webhookPayload,
            response_status: whRes.status,
            success: whRes.ok,
            duration_ms: Date.now() - startMs,
          });
        } catch (whErr: any) {
          await supabase.from("webhook_deliveries").insert({
            webhook_id: wh.id,
            event_type: "meeting.completed",
            payload: webhookPayload,
            response_status: 0,
            response_body: whErr.message || String(whErr),
            success: false,
            duration_ms: Date.now() - startMs,
          });
        }
      }
    } catch {}

    // Notify user — meeting completed
    await supabase.rpc("create_notification", {
      p_user_id: user.id,
      p_type: "meeting_completed",
      p_title: "Réunion analysée ✓",
      p_message: `"${meeting?.title}" — ${analysis.tasks?.length || 0} tâches, ${analysis.decisions?.length || 0} décisions extraites.`,
      p_link: `/app/reunions/${meetingId}`,
      p_metadata: { meetingId, tasksCount: analysis.tasks?.length || 0, decisionsCount: analysis.decisions?.length || 0, sentimentScore: analysis.sentiment_score || 50 },
    }).catch(() => {});

    // Log success
    await supabase.from("app_logs").insert({
      level: "info",
      source: "analyze-transcript",
      message: `Analysis completed for meeting ${meetingId}: ${analysis.tasks?.length || 0} tasks, ${analysis.decisions?.length || 0} decisions`,
      metadata: { meetingId, tasksCount: analysis.tasks?.length || 0, decisionsCount: analysis.decisions?.length || 0 },
      user_id: user.id,
      meeting_id: meetingId,
    }).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      meetingId,
      tasksCount: analysis.tasks?.length || 0,
      decisionsCount: analysis.decisions?.length || 0,
      contactsCount: analysis.contacts?.length || 0,
      distribution: distributionResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-transcript error:", e);

    // Log error
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    try {
      const logClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await logClient.from("app_logs").insert({
        level: "error",
        source: "analyze-transcript",
        message: e instanceof Error ? e.message : String(e),
        metadata: { stack: e instanceof Error ? e.stack : undefined },
      });
    } catch {}

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
