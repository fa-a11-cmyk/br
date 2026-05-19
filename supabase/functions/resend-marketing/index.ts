import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRAND = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  accent: "#f59e0b",
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#1a1a2e",
  muted: "#6b7280",
  border: "#e5e7eb",
};

function baseTemplate(subject: string, preheader: string, body: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;color:${BRAND.bg};font-size:1px">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg}"><tr><td align="center" style="padding:24px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
  <tr><td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.secondary});border-radius:16px 16px 0 0;padding:32px 40px;text-align:center">
    <p style="margin:0;font-size:30px;font-weight:900;color:white;letter-spacing:-0.5px">⚡ RapidoMeet</p>
  </td></tr>
  <tr><td style="background:${BRAND.card};padding:40px;border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border}">${body}</td></tr>
  <tr><td style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-top:3px solid ${BRAND.primary};border-radius:0 0 16px 16px;padding:28px 40px;text-align:center">
    <p style="margin:0 0 12px">
      <a href="https://rapidomeet.io" style="color:${BRAND.primary};text-decoration:none;font-size:13px;font-weight:600;margin:0 10px">🌐 rapidomeet.io</a>
      <a href="mailto:hello@rapidomeet.io" style="color:${BRAND.primary};text-decoration:none;font-size:13px;font-weight:600;margin:0 10px">✉️ hello@rapidomeet.io</a>
    </p>
    <p style="margin:0 0 8px;font-size:11px;color:${BRAND.muted}">BraindCode SASU · Aubervilliers, France</p>
    <p style="margin:0;font-size:11px;color:#d1d5db">Vous recevez cet email car vous êtes inscrit sur RapidoMeet. · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${BRAND.muted}">Se désinscrire</a></p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

const ONBOARDING_TEMPLATES: Record<string, (firstName: string) => { subject: string; preheader: string; html: string }> = {
  welcome: (firstName) => ({
    subject: `Bienvenue sur RapidoMeet, ${firstName || "et merci"} ! ⚡`,
    preheader: "Transformez vos réunions en actions dès aujourd'hui — 3 étapes pour démarrer",
    html: baseTemplate(
      "Bienvenue sur RapidoMeet ! ⚡",
      "Transformez vos réunions en actions dès aujourd'hui",
      `<h1 style="font-size:26px;font-weight:800;color:${BRAND.text};margin:0 0 16px">Bonjour ${firstName || "👋"} !</h1>
      <p style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 20px">Bienvenue sur <strong>RapidoMeet</strong> — la plateforme qui transforme vos réunions en actions concrètes grâce à l'IA.</p>
      <div style="background:#f0f0ff;border-radius:14px;padding:24px;margin:0 0 24px">
        <p style="margin:0 0 14px;font-weight:700;color:${BRAND.text};font-size:15px">🚀 3 étapes pour démarrer :</p>
        <p style="margin:0 0 10px;color:#374151;font-size:15px">1️⃣ <strong>Importez</strong> un enregistrement audio de réunion</p>
        <p style="margin:0 0 10px;color:#374151;font-size:15px">2️⃣ <strong>Découvrez</strong> le rapport IA généré automatiquement</p>
        <p style="margin:0;color:#374151;font-size:15px">3️⃣ <strong>Exportez</strong> vos tâches vers votre Kanban</p>
      </div>
      <div style="text-align:center">
        <a href="https://app.rapidomeet.io/app/reunions/nouvelle" style="display:inline-block;background:${BRAND.primary};color:white;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:12px">Créer ma première réunion →</a>
      </div>`
    ),
  }),

  first_meeting: (firstName) => ({
    subject: "2 minutes pour transformer votre première réunion 🎙",
    preheader: "Votre premier rapport IA vous attend — MP3, WAV ou M4A acceptés",
    html: baseTemplate(
      "Votre première réunion vous attend",
      "2 minutes pour votre premier rapport IA",
      `<h1 style="font-size:26px;font-weight:800;color:${BRAND.text};margin:0 0 16px">${firstName || "Bonjour"}, prêt à essayer ? 🎙</h1>
      <p style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 20px">Vous vous êtes inscrit il y a 3 jours. La bonne nouvelle : importer votre premier enregistrement prend <strong>moins de 2 minutes</strong>.</p>
      <div style="background:#fef9f0;border-left:4px solid ${BRAND.accent};padding:18px 20px;margin:0 0 24px;border-radius:0 10px 10px 0">
        <p style="margin:0;font-weight:600;color:#92400e;font-size:15px">💡 Astuce : commencez avec un enregistrement existant — appel client, réunion d'équipe, entretien. Formats acceptés : MP3, WAV, M4A.</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
        <tr>
          <td width="48%" style="background:#f8fafc;border-radius:12px;padding:18px;text-align:center">
            <p style="font-size:28px;margin:0 0 8px">📤</p>
            <p style="font-weight:700;color:${BRAND.text};margin:0 0 4px">Import audio</p>
            <p style="font-size:13px;color:${BRAND.muted};margin:0">MP3, WAV, M4A</p>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#f0f0ff;border-radius:12px;padding:18px;text-align:center">
            <p style="font-size:28px;margin:0 0 8px">⚡</p>
            <p style="font-weight:700;color:${BRAND.primary};margin:0 0 4px">Rapport IA</p>
            <p style="font-size:13px;color:${BRAND.muted};margin:0">En 2 minutes</p>
          </td>
        </tr>
      </table>
      <div style="text-align:center">
        <a href="https://app.rapidomeet.io/app/reunions/nouvelle" style="display:inline-block;background:${BRAND.primary};color:white;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:12px">Importer mon audio →</a>
      </div>
      <p style="font-size:13px;color:${BRAND.muted};text-align:center;margin:20px 0 0">Des questions ? Répondez directement à cet email.</p>`
    ),
  }),

  features: (firstName) => ({
    subject: "Vous n'avez pas encore essayé ça ✨",
    preheader: "OpenClaw, Landing Pages, Kanban, Twilio — tout ce que vous pouvez faire avec RapidoMeet",
    html: baseTemplate(
      "Découvrez tout ce que vous pouvez faire",
      "5 features qui vont changer vos réunions",
      `<h1 style="font-size:26px;font-weight:800;color:${BRAND.text};margin:0 0 16px">${firstName || "Bonjour"}, vous n'avez pas encore essayé ça ✨</h1>
      <p style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 24px">Voici les 5 fonctionnalités qui changent vraiment la façon de travailler de nos utilisateurs :</p>
      ${[
        ["🤖", "OpenClaw IA", "Votre assistant IA qui agit après chaque réunion — tâches, décisions, contacts."],
        ["📅", "Landing Pages + RDV", "Créez une page de prise de RDV en 5 minutes avec visio Jitsi intégrée."],
        ["🎯", "Kanban automatique", "Les tâches extraites de vos réunions arrivent directement dans votre Kanban."],
        ["⚡", "Skills Marketplace", "Installez des skills IA pour enrichir OpenClaw selon vos besoins."],
        ["🔔", "Rappels SMS/WhatsApp", "Vos prospects reçoivent des rappels automatiques avant chaque RDV."],
      ].map(([icon, title, desc]) => `
        <div style="display:flex;gap:16px;margin:0 0 16px;padding:18px;background:#f8fafc;border-radius:12px">
          <div style="font-size:26px;flex-shrink:0">${icon}</div>
          <div>
            <p style="margin:0 0 4px;font-weight:700;color:${BRAND.text}">${title}</p>
            <p style="margin:0;font-size:14px;color:${BRAND.muted}">${desc}</p>
          </div>
        </div>
      `).join("")}
      <div style="text-align:center;margin-top:28px">
        <a href="https://app.rapidomeet.io/app" style="display:inline-block;background:${BRAND.primary};color:white;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:12px">Explorer les features →</a>
      </div>`
    ),
  }),

  upsell: (firstName) => ({
    subject: "Débloquez tout RapidoMeet — à partir de 9.90€/mois",
    preheader: "Illimité, OpenClaw complet, PDF, Slack — tout ce que le plan Pro débloque",
    html: baseTemplate(
      "Passez à la vitesse supérieure",
      "Plan Pro à partir de 9.90€/mois",
      `<h1 style="font-size:26px;font-weight:800;color:${BRAND.text};margin:0 0 16px">${firstName || "Bonjour"}, prêt pour la vitesse supérieure ? 🚀</h1>
      <p style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 24px">Vous utilisez RapidoMeet depuis 2 semaines. Voici ce que le <strong>Plan Pro</strong> débloque pour vous :</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
        <tr>
          <td width="47%" style="background:#f8fafc;border-radius:14px;padding:22px;vertical-align:top">
            <p style="font-weight:700;font-size:17px;color:${BRAND.muted};margin:0 0 14px">Plan Free</p>
            ${["3 réunions/mois", "Export basique", "OpenClaw limité", "Pas de PDF"].map(f => `<p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted}">○ ${f}</p>`).join("")}
          </td>
          <td width="6%"></td>
          <td width="47%" style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.secondary});border-radius:14px;padding:22px;vertical-align:top">
            <p style="font-weight:700;font-size:17px;color:white;margin:0 0 14px">Plan Pro ⚡</p>
            ${["Réunions illimitées", "Export PDF + Slack", "OpenClaw complet", "Support prioritaire"].map(f => `<p style="margin:0 0 8px;font-size:14px;color:white">✓ ${f}</p>`).join("")}
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin:0 0 16px">
        <a href="https://app.rapidomeet.io/app/billing" style="display:inline-block;background:${BRAND.primary};color:white;text-decoration:none;font-weight:700;font-size:16px;padding:18px 48px;border-radius:12px">Passer à Pro — 9.90€/mois →</a>
      </div>
      <p style="text-align:center;font-size:13px;color:${BRAND.muted};margin:0">Sans engagement · Annulation à tout moment</p>`
    ),
  }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY manquant" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const fromMarketing = Deno.env.get("RESEND_MARKETING_FROM") || "RapidoMeet News <news@mail.rapidomeet.io>";

  try {
    const { action, payload } = await req.json();
    let result: any = {};

    // === Process onboarding queue ===
    if (action === "process_onboarding_queue") {
      const { data: pending } = await admin
        .from("onboarding_email_queue")
        .select("*")
        .eq("status", "pending")
        .lte("scheduled_at", new Date().toISOString())
        .order("scheduled_at")
        .limit(50);

      let sent = 0, skipped = 0, failed = 0;

      for (const item of pending || []) {
        // Check skip conditions
        if (item.skip_if_meeting) {
          const { count } = await admin.from("meetings")
            .select("id", { count: "exact", head: true })
            .eq("user_id", item.user_id);
          if ((count || 0) > 0) {
            await admin.from("onboarding_email_queue")
              .update({ status: "skipped" }).eq("id", item.id);
            skipped++;
            continue;
          }
        }

        if (item.skip_if_paid) {
          const { data: sub } = await admin.from("subscriptions")
            .select("plan").eq("user_id", item.user_id)
            .eq("status", "active").maybeSingle();
          if (sub && sub.plan !== "free") {
            await admin.from("onboarding_email_queue")
              .update({ status: "skipped" }).eq("id", item.id);
            skipped++;
            continue;
          }
        }

        const tplFn = ONBOARDING_TEMPLATES[item.step_name];
        if (!tplFn) {
          await admin.from("onboarding_email_queue")
            .update({ status: "failed", error_message: `Template ${item.step_name} introuvable` })
            .eq("id", item.id);
          failed++;
          continue;
        }

        const name = item.first_name || "there";
        const tpl = tplFn(name);

        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: fromMarketing,
              to: [item.email],
              subject: tpl.subject,
              html: tpl.html,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            await admin.from("onboarding_email_queue")
              .update({ status: "sent", sent_at: new Date().toISOString(), resend_email_id: data.id })
              .eq("id", item.id);
            sent++;
          } else {
            const err = await res.json();
            await admin.from("onboarding_email_queue")
              .update({ status: "failed", error_message: err.message || "Resend error" })
              .eq("id", item.id);
            failed++;
          }
        } catch (e: any) {
          await admin.from("onboarding_email_queue")
            .update({ status: "failed", error_message: e.message })
            .eq("id", item.id);
          failed++;
        }
      }

      result = { processed: (pending || []).length, sent, skipped, failed };

    // === Send broadcast (create + send in one call) ===
    } else if (action === "send_broadcast") {
      const { name, subject, html, audience_segment, broadcast_type, scheduled_at } = payload;

      if (!name || !subject || !html) throw new Error("name, subject et html requis");

      const audienceId = getAudienceId(audience_segment || "all");
      if (!audienceId) throw new Error(`Configurez RESEND_AUDIENCE_ID_${(audience_segment || "ALL").toUpperCase()} dans les secrets`);

      // Get user
      const authH = req.headers.get("authorization");
      const uc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authH || "" } },
      });
      const { data: { user } } = await uc.auth.getUser();

      // 1. Create broadcast in Resend
      const createRes = await fetch("https://api.resend.com/broadcasts", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ audience_id: audienceId, from: fromMarketing, subject, html, name }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.message || "Erreur création broadcast Resend");

      const broadcastId = createData.id;

      // 2. Send or schedule
      const sendEndpoint = scheduled_at
        ? `https://api.resend.com/broadcasts/${broadcastId}/schedule`
        : `https://api.resend.com/broadcasts/${broadcastId}/send`;
      const sendRes = await fetch(sendEndpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(scheduled_at ? { scheduled_at } : {}),
      });
      if (!sendRes.ok) {
        const sendErr = await sendRes.json();
        throw new Error(sendErr.message || "Broadcast send error");
      }

      // 3. Log
      await admin.from("resend_broadcasts_log").insert({
        created_by: user?.id || "00000000-0000-0000-0000-000000000000",
        name, subject,
        broadcast_type: broadcast_type || "custom",
        resend_broadcast_id: broadcastId,
        resend_audience_id: audienceId,
        audience_segment: audience_segment || "all",
        content_html: html,
        status: scheduled_at ? "scheduled" : "sent",
        scheduled_at: scheduled_at || null,
        sent_at: !scheduled_at ? new Date().toISOString() : null,
      });

      result = { success: true, broadcast_id: broadcastId, status: scheduled_at ? "scheduled" : "sent" };

    // === Sync contacts to Resend audience ===
    } else if (action === "sync_contacts" || action === "sync_audience") {
      const { segment, audience_id } = payload;
      const targetSegment = segment || "all";
      const targetAudienceId = audience_id || getAudienceId(targetSegment);

      if (!targetAudienceId) throw new Error(`Audience ID manquant pour segment "${targetSegment}"`);

      const { data: users } = await admin.rpc("get_segment_users", { p_segment: targetSegment });

      let synced = 0;
      for (const user of users || []) {
        try {
          const res = await fetch(`https://api.resend.com/audiences/${targetAudienceId}/contacts`, {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, first_name: user.first_name || "", unsubscribed: false }),
          });
          if (res.ok) synced++;
          else await res.text();
        } catch { /* continue */ }
      }

      await admin.from("resend_audiences")
        .update({ contact_count: synced, last_synced_at: new Date().toISOString() })
        .eq("segment", targetSegment);

      result = { synced, total: (users || []).length };

    // === Get broadcast stats ===
    } else if (action === "get_stats" || action === "get_broadcast_stats") {
      if (payload?.broadcast_id) {
        // Single broadcast stats from Resend
        const statsRes = await fetch(`https://api.resend.com/broadcasts/${payload.broadcast_id}`, {
          headers: { Authorization: `Bearer ${resendKey}` },
        });
        const statsData = await statsRes.json();
        if (statsRes.ok && statsData.metrics) {
          await admin.from("resend_broadcasts_log").update({
            recipients_count: statsData.metrics.total || 0,
            opens_count: statsData.metrics.opens || 0,
            clicks_count: statsData.metrics.clicks || 0,
            unsubscribes_count: statsData.metrics.unsubscribes || 0,
            bounces_count: statsData.metrics.bounces || 0,
          }).eq("resend_broadcast_id", payload.broadcast_id);
        }
        result = statsData;
      } else {
        const [{ data: broadcasts }, { data: queue }, { data: audiences }] = await Promise.all([
          admin.from("resend_broadcasts_log").select("*").order("created_at", { ascending: false }).limit(20),
          admin.from("onboarding_email_queue").select("status").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
          admin.from("resend_audiences").select("*"),
        ]);
        const queueStats = (queue || []).reduce((acc: any, q: any) => { acc[q.status] = (acc[q.status] || 0) + 1; return acc; }, {});
        result = { broadcasts: broadcasts || [], audiences: audiences || [], onboarding_queue: queueStats };
      }

    // === Generate email content with AI ===
    } else if (action === "generate_email" || action === "generate_ai") {
      const { type, broadcast_type, topic, audience_segment, key_points, cta_label, cta_url, tone } = payload;

      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableApiKey) throw new Error("LOVABLE_API_KEY manquant");

      const AI_SYSTEM_PROMPT = `Tu es expert en email marketing SaaS B2B pour RapidoMeet — plateforme d'intelligence post-réunion IA fondée par BraindCode SASU.

CHARTE GRAPHIQUE :
- Primaire : #6366f1 (indigo) / Secondaire : #8b5cf6 (violet) / Accent : #f59e0b (ambre)
- Fond : #f8fafc / Carte : #ffffff / Texte : #1a1a2e / Muted : #6b7280
- Police : Arial, Helvetica, sans-serif / Radius : 12-16px

STRUCTURE OBLIGATOIRE (HTML inline uniquement) :
1. Titre H1 percutant avec emoji (max 10 mots)
2. Paragraphe d'accroche (max 3 lignes)
3. Contenu principal (features, liste, tableau)
4. Bouton CTA centré (background #6366f1, couleur white, padding 16px 40px, border-radius 12px, font-weight 700)
5. Note de clôture courte

RÈGLES STRICTES :
- CSS inline uniquement (compatible Outlook)
- Pas de JavaScript, pas de classes CSS
- Variable prénom : {{{FIRST_NAME|vous}}}
- Mobile responsive (max-width:100%)
- Longueur : 200-400 mots max

Réponds UNIQUEMENT avec le HTML du corps de l'email. Pas de DOCTYPE, pas d'<html>. HTML pur.`;

      const emailType = type || broadcast_type || "newsletter";
      const userPrompt = `Type: ${emailType}
Sujet: ${topic || "Nouveautés RapidoMeet"}
${audience_segment ? `Audience: ${audience_segment}` : ""}
${(key_points || []).filter(Boolean).length > 0 ? `Points clés:\n${key_points.filter(Boolean).map((p: string) => `- ${p}`).join("\n")}` : ""}
CTA: "${cta_label || "Découvrir →"}" → ${cta_url || "https://app.rapidomeet.io"}
Ton: ${tone || "professionnel et chaleureux"}

Génère le HTML du corps de l'email.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: AI_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI gateway error: ${response.status} ${errText}`);
      }

      const aiData = await response.json();
      const generatedBody = aiData.choices?.[0]?.message?.content || "";
      // Clean markdown fences if present
      const cleanBody = generatedBody.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
      const fullHtml = baseTemplate(topic || "RapidoMeet", topic || "", cleanBody);

      result = { html: fullHtml, raw_body: cleanBody };

    } else {
      throw new Error(`Action inconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getAudienceId(segment: string): string | null {
  const map: Record<string, string> = {
    all: Deno.env.get("RESEND_AUDIENCE_ID_ALL") || "",
    free: Deno.env.get("RESEND_AUDIENCE_ID_FREE") || "",
    pro: Deno.env.get("RESEND_AUDIENCE_ID_PRO") || "",
    new_7d: Deno.env.get("RESEND_AUDIENCE_ID_NEW") || "",
  };
  return map[segment] || map["all"] || null;
}
