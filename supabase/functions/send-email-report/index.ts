import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@rapidomeet.io";

  if (!resendKey) {
    return new Response(JSON.stringify({
      error: "RESEND_API_KEY non configuré",
      hint: "Ajoutez RESEND_API_KEY dans les secrets Supabase"
    }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const { meetingId, userId, recipientEmail, subject, templateId } = await req.json();
    if (!meetingId || !userId) throw new Error("meetingId et userId requis");

    // Fetch meeting data + profile + report in parallel
    const [{ data: meeting }, { data: report }, { data: profile }] = await Promise.all([
      admin.from("meetings").select("*").eq("id", meetingId).single(),
      admin.from("reports").select("*").eq("meeting_id", meetingId).eq("user_id", userId).maybeSingle(),
      admin.from("profiles").select("first_name, last_name").eq("user_id", userId).single(),
    ]);

    if (!meeting) throw new Error("Réunion introuvable");

    // Determine recipient
    let toEmail = recipientEmail;
    if (!toEmail) {
      const { data: { user } } = await admin.auth.admin.getUserById(userId);
      toEmail = user?.email;
    }
    if (!toEmail) throw new Error("Email destinataire introuvable");

    const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Utilisateur";
    let htmlContent = report?.content_html;

    // If a template is specified, use it with variable interpolation
    if (templateId) {
      const { data: tpl } = await admin.from("email_templates").select("html_content").eq("id", templateId).single();
      if (tpl?.html_content) {
        const [{ count: tasksCount }, { count: decisionsCount }] = await Promise.all([
          admin.from("extracted_tasks").select("id", { count: "exact", head: true }).eq("meeting_id", meetingId),
          admin.from("extracted_decisions").select("id", { count: "exact", head: true }).eq("meeting_id", meetingId),
        ]);

        const sentimentScore = meeting.sentiment_score || 50;
        const sentimentLabel = sentimentScore >= 70 ? "Positif" : sentimentScore >= 40 ? "Neutre" : "Négatif";
        const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://rapidomeet.lovable.app";

        const vars: Record<string, string> = {
          meeting_title: meeting.title || "Réunion",
          meeting_date: new Date(meeting.created_at).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          meeting_type: meeting.meeting_type || "général",
          meeting_duration: meeting.duration_seconds ? `${Math.round(meeting.duration_seconds / 60)} min` : "—",
          summary: meeting.summary || "",
          tasks_count: String(tasksCount || 0),
          decisions_count: String(decisionsCount || 0),
          sentiment_label: sentimentLabel,
          report_url: `${frontendUrl}/app/reunions/${meetingId}`,
          user_name: userName,
          app_name: "RapidoMeet",
          current_date: new Date().toLocaleDateString("fr-FR"),
        };

        htmlContent = tpl.html_content;
        Object.entries(vars).forEach(([key, value]) => {
          htmlContent = htmlContent!.replaceAll(`{{${key}}}`, value);
        });
      }
    }

    // Fallback: build HTML from meeting data
    if (!htmlContent) {
      const { data: tasks } = await admin.from("extracted_tasks").select("*").eq("meeting_id", meetingId);
      const { data: decisions } = await admin.from("extracted_decisions").select("*").eq("meeting_id", meetingId);
      const { data: contacts } = await admin.from("detected_contacts").select("*").eq("meeting_id", meetingId);

      const duration = meeting.duration_seconds ? `${Math.round(meeting.duration_seconds / 60)} min` : "N/A";
      const taskRows = (tasks || []).map((t: any) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${t.title}</td><td style="padding:8px;border-bottom:1px solid #eee;">${t.assignee || "—"}</td><td style="padding:8px;border-bottom:1px solid #eee;"><span style="background:#${t.priority === 'critical' ? 'ef4444' : t.priority === 'high' ? 'f59e0b' : '3b82f6'};color:white;padding:2px 8px;border-radius:4px;font-size:11px;">${t.priority}</span></td></tr>`
      ).join("");
      const decisionItems = (decisions || []).map((d: any) => `<li style="margin-bottom:6px;">${d.content}</li>`).join("");
      const contactRows = (contacts || []).map((c: any) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${c.name}</td><td style="padding:8px;border-bottom:1px solid #eee;">${c.company || "—"}</td><td style="padding:8px;border-bottom:1px solid #eee;">${c.email || "—"}</td></tr>`
      ).join("");

      htmlContent = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:white;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#d946ef,#8b5cf6);padding:30px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;">📋 Rapport de réunion</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${meeting.title}</p>
  </div>
  <div style="padding:25px;">
    <div style="display:flex;gap:15px;margin-bottom:20px;">
      <div style="flex:1;background:#f8f9fa;padding:12px;border-radius:8px;text-align:center;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;">Durée</div>
        <div style="font-size:18px;font-weight:bold;">${duration}</div>
      </div>
      <div style="flex:1;background:#f8f9fa;padding:12px;border-radius:8px;text-align:center;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;">Sentiment</div>
        <div style="font-size:18px;font-weight:bold;">${meeting.sentiment_score ?? "N/A"}%</div>
      </div>
    </div>
    <h2 style="font-size:16px;border-bottom:2px solid #d946ef;padding-bottom:8px;">Résumé</h2>
    <p style="color:#444;line-height:1.6;font-size:14px;">${meeting.summary || "<em>Aucun résumé</em>"}</p>
    ${(tasks || []).length > 0 ? `<h2 style="font-size:16px;border-bottom:2px solid #d946ef;padding-bottom:8px;">✅ Tâches (${tasks!.length})</h2><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#f8f9fa;"><th style="padding:8px;text-align:left;">Tâche</th><th style="padding:8px;text-align:left;">Assigné</th><th style="padding:8px;text-align:left;">Priorité</th></tr></thead><tbody>${taskRows}</tbody></table>` : ""}
    ${(decisions || []).length > 0 ? `<h2 style="font-size:16px;border-bottom:2px solid #d946ef;padding-bottom:8px;">🎯 Décisions (${decisions!.length})</h2><ul style="color:#444;font-size:14px;">${decisionItems}</ul>` : ""}
    ${(contacts || []).length > 0 ? `<h2 style="font-size:16px;border-bottom:2px solid #d946ef;padding-bottom:8px;">👤 Contacts (${contacts!.length})</h2><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#f8f9fa;"><th style="padding:8px;text-align:left;">Nom</th><th style="padding:8px;text-align:left;">Entreprise</th><th style="padding:8px;text-align:left;">Email</th></tr></thead><tbody>${contactRows}</tbody></table>` : ""}
  </div>
  <div style="background:#f8f9fa;padding:15px;text-align:center;font-size:11px;color:#999;">RapidoMeet — Vos réunions en actions</div>
</div></body></html>`;
    }

    const emailSubject = subject || `Rapport RapidoMeet : ${meeting.title}`;

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `RapidoMeet <${fromEmail}>`,
        to: [toEmail],
        subject: emailSubject,
        html: htmlContent,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      throw new Error(`Resend error ${resendRes.status}: ${resendData.message || JSON.stringify(resendData)}`);
    }

    // Log the send
    await admin.from("email_logs").insert({
      user_id: userId,
      meeting_id: meetingId,
      template_id: templateId || null,
      recipient_email: toEmail,
      subject: emailSubject,
      email_type: "report",
      status: "sent",
      resend_id: resendData.id,
    }).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      resendId: resendData.id,
      recipient: toEmail,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    const msg = error.message || String(error);

    // Log failure
    await admin.from("email_logs").insert({
      user_id: null,
      recipient_email: "unknown",
      subject: "Échec envoi rapport",
      email_type: "report",
      status: "failed",
      error_message: msg,
    }).catch(() => {});

    await admin.from("app_logs").insert({
      level: "error",
      source: "send-email-report",
      message: msg,
    }).catch(() => {});

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
