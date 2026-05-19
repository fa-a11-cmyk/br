import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@rapidomeet.io";

  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY manquant" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const { userId, email, firstName } = await req.json();
    if (!email) throw new Error("email requis");

    const name = firstName || email.split("@")[0];
    const appUrl = Deno.env.get("FRONTEND_URL") || "https://rapidomeet.lovable.app";

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#d946ef,#8b5cf6);padding:40px 30px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;font-weight:800;">⚡ RapidoMeet</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">L'IA qui transforme vos réunions en actions</p>
  </div>
  <div style="padding:30px;">
    <h2 style="font-size:22px;color:#1a1a2e;margin:0 0 15px;">Bienvenue ${name} ! 🎉</h2>
    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 25px;">Votre compte est prêt. Voici comment démarrer :</p>
    <div style="margin-bottom:25px;">
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;">
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#d946ef,#8b5cf6);color:white;font-size:13px;font-weight:bold;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div>
        <div><p style="margin:0;font-size:14px;font-weight:600;color:#1a1a2e;">Importez votre premier audio</p><p style="margin:4px 0 0;font-size:13px;color:#888;">MP3, WAV, M4A — jusqu'à 500MB</p></div>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;">
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#d946ef,#8b5cf6);color:white;font-size:13px;font-weight:bold;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div>
        <div><p style="margin:0;font-size:14px;font-weight:600;color:#1a1a2e;">L'IA analyse en 2 minutes</p><p style="margin:4px 0 0;font-size:13px;color:#888;">Transcription + tâches + décisions + contacts</p></div>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#d946ef,#8b5cf6);color:white;font-size:13px;font-weight:bold;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div>
        <div><p style="margin:0;font-size:14px;font-weight:600;color:#1a1a2e;">Recevez votre rapport</p><p style="margin:4px 0 0;font-size:13px;color:#888;">Par email, Slack, WhatsApp ou Telegram</p></div>
      </div>
    </div>
    <div style="text-align:center;margin:30px 0;">
      <a href="${appUrl}/app/reunions/nouvelle" style="display:inline-block;background:linear-gradient(135deg,#d946ef,#8b5cf6);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;">Créer ma première réunion →</a>
    </div>
    <p style="font-size:13px;color:#999;text-align:center;">Questions ? Répondez à cet email, nous vous répondons sous 24h.</p>
  </div>
  <div style="background:#f8f9fa;padding:15px;text-align:center;font-size:11px;color:#999;">
    RapidoMeet · BraindCode · ${new Date().getFullYear()}
  </div>
</div></body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `RapidoMeet <${fromEmail}>`,
        to: [email],
        subject: `Bienvenue sur RapidoMeet, ${name} ! ⚡`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.json();
      throw new Error(`Resend: ${err.message}`);
    }

    const resendData = await resendRes.json();

    // Log
    await admin.from("email_logs").insert({
      user_id: userId || null,
      recipient_email: email,
      subject: `Bienvenue sur RapidoMeet, ${name} ! ⚡`,
      email_type: "welcome",
      status: "sent",
      resend_id: resendData.id,
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
