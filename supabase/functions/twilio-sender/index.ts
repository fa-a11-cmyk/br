import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function twilioRequest(
  path: string,
  params: Record<string, string>,
  sid: string,
  token: string
): Promise<any> {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Twilio error ${res.status}`);
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
  const twilioWhatsApp = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
  const resendKey = Deno.env.get("RESEND_API_KEY");

  try {
    const { action, payload } = await req.json();
    let result: any = {};

    if (action === "send_reminder") {
      const { reminder_id } = payload;

      const { data: reminder } = await admin
        .from("reminder_schedules")
        .select("*, landing_bookings(*), landing_pages(title, slug, jitsi_config, booking_config)")
        .eq("id", reminder_id)
        .single();

      if (!reminder) throw new Error("Rappel introuvable");
      if (reminder.status === "sent") return new Response(JSON.stringify({ already_sent: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const b = reminder.landing_bookings as any;
      const page = reminder.landing_pages as any;

      // Get owner profile
      const { data: profile } = await admin
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", reminder.user_id)
        .single();

      const ownerName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Votre contact";

      // Build template variables
      const vars: Record<string, string> = {
        prospect_name: b?.prospect_name || "",
        owner_name: ownerName,
        date: b?.booked_date || "",
        time: b?.booked_time || "",
        duration: `${b?.duration_minutes || 30}`,
        jitsi_url: b?.jitsi_room_url || "",
        page_title: page?.title || "",
        booking_url: `${Deno.env.get("FRONTEND_URL") || "https://app.rapidomeet.io"}/p/${page?.slug || ""}`,
      };

      // Get template
      const { data: template } = await admin
        .from("reminder_templates")
        .select("body_template, subject")
        .eq("reminder_type", reminder.reminder_type)
        .eq("channel", reminder.channel)
        .eq("is_default", true)
        .maybeSingle();

      let messageContent = reminder.message_content || template?.body_template || `Rappel RDV le ${vars.date} à ${vars.time}`;
      for (const [k, v] of Object.entries(vars)) {
        messageContent = messageContent.replace(new RegExp(`{{${k}}}`, "g"), v);
      }

      let twilioSidResult: string | null = null;
      const isFollowup = reminder.reminder_type.startsWith("followup") || reminder.reminder_type === "no_show";

      // Send based on channel
      if (reminder.channel === "sms" && twilioSid && twilioToken && twilioPhone && reminder.to_phone) {
        const data = await twilioRequest("/Messages.json", {
          From: twilioPhone,
          To: reminder.to_phone,
          Body: messageContent,
        }, twilioSid, twilioToken);
        twilioSidResult = data.sid;

      } else if (reminder.channel === "whatsapp" && twilioSid && twilioToken && reminder.to_phone) {
        const fromNumber = twilioWhatsApp || `whatsapp:${twilioPhone}`;
        const data = await twilioRequest("/Messages.json", {
          From: fromNumber,
          To: `whatsapp:${reminder.to_phone}`,
          Body: messageContent,
        }, twilioSid, twilioToken);
        twilioSidResult = data.sid;

      } else if (reminder.channel === "voice" && twilioSid && twilioToken && twilioPhone && reminder.to_phone) {
        const twiml = `<Response><Pause length="1"/><Say language="fr-FR" voice="alice">${messageContent}</Say><Pause length="1"/><Say language="fr-FR" voice="alice">Au revoir.</Say></Response>`;
        const data = await twilioRequest("/Calls.json", {
          From: twilioPhone,
          To: reminder.to_phone,
          Twiml: twiml,
        }, twilioSid, twilioToken);
        twilioSidResult = data.sid;

      } else if (reminder.channel === "email" && resendKey && reminder.to_email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "RapidoMeet <noreply@rapidomeet.io>",
            to: [reminder.to_email],
            subject: template?.subject || (isFollowup ? "🙏 Merci" : "📅 Rappel de RDV"),
            html: `<div style="font-family:Arial;max-width:500px;margin:0 auto;padding:24px"><h2>${isFollowup ? "🙏 Merci" : "📅 Rappel de RDV"}</h2><p>${messageContent.replace(/\n/g, "<br/>")}</p>${!isFollowup && b?.jitsi_room_url ? `<a href="${b.jitsi_room_url}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">🎥 Rejoindre la visio →</a>` : ""}<p style="color:#9ca3af;font-size:12px;margin-top:32px">Propulsé par ⚡ RapidoMeet</p></div>`,
          }),
        }).catch(() => {});
        twilioSidResult = "resend-" + Date.now();
      } else {
        throw new Error(`Canal ${reminder.channel} non configuré ou coordonnées manquantes`);
      }

      await admin.from("reminder_schedules").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        twilio_sid: twilioSidResult,
        attempts: (reminder.attempts || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq("id", reminder_id);

      result = { success: true, channel: reminder.channel, type: reminder.reminder_type, twilio_sid: twilioSidResult };

    } else if (action === "process_pending") {
      const { data: pending } = await admin
        .from("reminder_schedules")
        .select("id")
        .eq("status", "pending")
        .lte("scheduled_at", new Date(Date.now() + 5 * 60000).toISOString())
        .limit(50);

      let sent = 0, failed = 0;
      for (const reminder of pending || []) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const res = await fetch(`${supabaseUrl}/functions/v1/twilio-sender`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({ action: "send_reminder", payload: { reminder_id: reminder.id } }),
          });
          if (res.ok) sent++; else {
            failed++;
            const errData = await res.json();
            await admin.from("reminder_schedules").update({ status: "failed", error_message: errData.error, attempts: (reminder as any).attempts + 1 }).eq("id", reminder.id);
          }
        } catch { failed++; }
      }
      result = { processed: (pending || []).length, sent, failed };

    } else if (action === "send_manual") {
      const { booking_id, channel, message, to_phone, to_email } = payload;
      if (!booking_id) throw new Error("booking_id requis");

      if (channel === "sms" && to_phone && twilioSid && twilioToken && twilioPhone) {
        const data = await twilioRequest("/Messages.json", { From: twilioPhone, To: to_phone, Body: message }, twilioSid, twilioToken);
        result = { success: true, sid: data.sid };
      } else if (channel === "whatsapp" && to_phone && twilioSid && twilioToken) {
        const data = await twilioRequest("/Messages.json", { From: twilioWhatsApp || `whatsapp:${twilioPhone}`, To: `whatsapp:${to_phone}`, Body: message }, twilioSid, twilioToken);
        result = { success: true, sid: data.sid };
      } else if (channel === "voice" && to_phone && twilioSid && twilioToken && twilioPhone) {
        const twiml = `<Response><Say language="fr-FR" voice="alice">${message}</Say></Response>`;
        const data = await twilioRequest("/Calls.json", { From: twilioPhone, To: to_phone, Twiml: twiml }, twilioSid, twilioToken);
        result = { success: true, sid: data.sid };
      } else if (channel === "email" && to_email && resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "RapidoMeet <noreply@rapidomeet.io>", to: [to_email], subject: "Message de RapidoMeet", html: `<p>${message.replace(/\n/g, "<br/>")}</p>` }),
        });
        result = { success: true };
      } else {
        throw new Error(`Canal ${channel} non configuré`);
      }

    } else if (action === "test_config") {
      const { to_phone } = payload;
      if (!twilioSid || !twilioToken) throw new Error("TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN requis");

      const verifyRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`, {
        headers: { Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}` },
      });
      const account = await verifyRes.json();
      if (!verifyRes.ok) throw new Error("Credentials Twilio invalides");

      result = {
        valid: true,
        account_name: account.friendly_name,
        account_status: account.status,
        phone_number: twilioPhone,
        whatsapp_number: twilioWhatsApp,
      };

      if (to_phone && twilioPhone) {
        await twilioRequest("/Messages.json", { From: twilioPhone, To: to_phone, Body: "✅ Test RapidoMeet × Twilio : votre configuration est correcte !" }, twilioSid, twilioToken);
        result.test_sms_sent = true;
      }
    } else {
      throw new Error(`Action inconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
