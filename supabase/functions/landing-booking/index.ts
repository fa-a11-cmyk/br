import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
  const resendKey = Deno.env.get("RESEND_API_KEY");

  try {
    const { action, payload } = await req.json();
    let result: any = {};

    if (action === "get_availability") {
      const { landing_page_id, date } = payload;

      const { data: page } = await admin
        .from("landing_pages")
        .select("booking_config, user_id")
        .eq("id", landing_page_id)
        .single();

      if (!page) throw new Error("Page introuvable");

      const config = page.booking_config as any || {};
      const dayOfWeek = new Date(date).getDay();
      const availableDays = config.available_days || [1, 2, 3, 4, 5];

      if (!availableDays.includes(dayOfWeek)) {
        return new Response(
          JSON.stringify({ slots: [], available: false, reason: "Jour non disponible" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const startHour = parseInt((config.available_hours?.start || "09:00").split(":")[0]);
      const endHour = parseInt((config.available_hours?.end || "18:00").split(":")[0]);
      const duration = config.duration_options?.[0] || 30;

      const allSlots: string[] = [];
      for (let m = startHour * 60; m < endHour * 60; m += duration) {
        const h = Math.floor(m / 60);
        const mins = m % 60;
        allSlots.push(
          `${h.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
        );
      }

      const { data: existing } = await admin
        .from("landing_bookings")
        .select("booked_time")
        .eq("landing_page_id", landing_page_id)
        .eq("booked_date", date)
        .in("status", ["pending", "confirmed"]);

      const bookedTimes = new Set((existing || []).map((b: any) => b.booked_time));
      const freeSlots = allSlots.filter(slot => !bookedTimes.has(slot));

      result = {
        slots: freeSlots,
        date,
        duration_options: config.duration_options || [30],
        available: freeSlots.length > 0,
      };

    } else if (action === "create_booking") {
      const {
        landing_page_id, prospect_name, prospect_email,
        prospect_phone, prospect_company, prospect_message,
        booked_date, booked_time, duration_minutes, timezone,
      } = payload;

      const { data: page } = await admin
        .from("landing_pages")
        .select("*")
        .eq("id", landing_page_id)
        .eq("status", "published")
        .single();

      if (!page) throw new Error("Page introuvable ou non publiée");

      // Check conflict
      const { data: conflict } = await admin
        .from("landing_bookings")
        .select("id")
        .eq("landing_page_id", landing_page_id)
        .eq("booked_date", booked_date)
        .eq("booked_time", booked_time)
        .in("status", ["pending", "confirmed"])
        .maybeSingle();

      if (conflict) throw new Error("Ce créneau est déjà réservé.");

      const jitsiRoomName = `rapidomeet-${page.slug}-${booked_date.replace(/-/g, "")}-${booked_time.replace(":", "")}-${Math.random().toString(36).substring(2, 6)}`;
      const jitsiDomain = (page.jitsi_config as any)?.domain || "meet.jit.si";
      const jitsiRoomUrl = `https://${jitsiDomain}/${jitsiRoomName}`;

      const { data: booking } = await admin
        .from("landing_bookings")
        .insert({
          landing_page_id,
          user_id: page.user_id,
          prospect_name,
          prospect_email: prospect_email.toLowerCase(),
          prospect_phone: prospect_phone || null,
          prospect_company: prospect_company || null,
          prospect_message: prospect_message || null,
          booked_date,
          booked_time,
          duration_minutes: duration_minutes || 30,
          timezone: timezone || "Europe/Paris",
          status: "confirmed",
          jitsi_room_name: jitsiRoomName,
          jitsi_room_url: jitsiRoomUrl,
        })
        .select()
        .single();

      await admin.from("landing_pages")
        .update({
          booking_count: (page.booking_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", landing_page_id);

      await admin.rpc("create_notification", {
        p_user_id: page.user_id,
        p_type: "system",
        p_title: "Nouveau RDV ! 📅",
        p_message: `${prospect_name} a réservé un appel le ${booked_date} à ${booked_time}.`,
        p_link: "/app/landing/bookings",
      }).catch(() => {});

      if (resendKey) {
        // Email prospect
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "RapidoMeet <noreply@rapidomeet.io>",
            to: [prospect_email],
            subject: `✅ Votre RDV est confirmé — ${page.title}`,
            html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><h2>📅 RDV confirmé !</h2><p>Bonjour ${prospect_name},</p><p>Votre rendez-vous est confirmé.</p><div style="background:#f0f0ff;border-radius:8px;padding:16px;margin:16px 0"><p>📅 Date : <strong>${booked_date}</strong></p><p>🕐 Heure : <strong>${booked_time}</strong></p><p>⏱ Durée : <strong>${duration_minutes || 30} min</strong></p></div><a href="${jitsiRoomUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">🎥 Rejoindre la visio →</a><p style="color:#6b7280;font-size:12px;margin-top:16px">Lien Jitsi Meet gratuit, aucune installation requise.</p></div>`,
          }),
        }).catch(() => {});
      }

      result = {
        success: true,
        booking_id: booking?.id,
        jitsi_room_url: jitsiRoomUrl,
        message: "RDV confirmé ! Vous allez recevoir un email de confirmation.",
      };

    } else if (action === "cancel_booking") {
      const { booking_id, reason } = payload;

      const authHeader = req.headers.get("authorization");
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader || "" } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) throw new Error("Non autorisé");

      await admin.from("landing_bookings")
        .update({
          status: "canceled",
          owner_notes: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking_id)
        .eq("user_id", user.id);

      result = { success: true };

    } else if (action === "generate_landing") {
      const authHeader = req.headers.get("authorization");
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/blog-ai-generator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader || "",
          },
          body: JSON.stringify({
            action: "generate_article",
            payload: { ...payload, article_type: "landing_page", word_count: 600 },
          }),
        }
      );

      result = await res.json();

    } else {
      throw new Error(`Action inconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
