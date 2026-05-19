import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const { action, payload } = await req.json();

    if (action === "track_click") {
      const { code, landing_page, referer_url, utm_source, utm_medium, utm_campaign } = payload;

      const { data: affiliate } = await admin
        .from("affiliates")
        .select("id, status")
        .eq("code", code.toUpperCase())
        .eq("status", "active")
        .single();

      if (!affiliate) {
        return new Response(JSON.stringify({ valid: false, error: "Code invalide" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: click } = await admin.from("affiliate_clicks").insert({
        affiliate_id: affiliate.id,
        code: code.toUpperCase(),
        ip_address: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
        referer_url: referer_url || null,
        landing_page: landing_page || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
      }).select().single();

      // Increment total_clicks
      const { data: aff } = await admin.from("affiliates").select("total_clicks").eq("id", affiliate.id).single();
      await admin.from("affiliates").update({
        total_clicks: (aff?.total_clicks || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq("id", affiliate.id);

      return new Response(JSON.stringify({ valid: true, click_id: click?.id, affiliate_id: affiliate.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "track_signup") {
      const { code, click_id, user_id, email } = payload;

      const { data: affiliate } = await admin
        .from("affiliates")
        .select("id, commission_rate, total_referrals, user_id")
        .eq("code", code.toUpperCase())
        .single();

      if (!affiliate) {
        return new Response(JSON.stringify({ skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await admin.from("affiliate_referrals").insert({
        affiliate_id: affiliate.id,
        click_id: click_id || null,
        referred_user_id: user_id || null,
        referred_email: email,
        status: "registered",
      });

      if (click_id) {
        await admin.from("affiliate_clicks").update({
          converted: true,
          converted_at: new Date().toISOString(),
        }).eq("id", click_id);
      }

      await admin.from("affiliates").update({
        total_referrals: affiliate.total_referrals + 1,
        updated_at: new Date().toISOString(),
      }).eq("id", affiliate.id);

      await admin.rpc("create_notification", {
        p_user_id: affiliate.user_id,
        p_type: "system",
        p_title: "Nouveau filleul ! 🎉",
        p_message: `${email} vient de s'inscrire avec votre code ${code}.`,
        p_link: "/app/affiliation",
      }).catch(() => {});

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "track_conversion") {
      const { referred_user_id, plan, mrr_euros, stripe_customer_id, stripe_invoice_id } = payload;

      const { data: referral } = await admin
        .from("affiliate_referrals")
        .select("*, affiliates(commission_rate, commission_type, total_conversions, total_earned_euros, user_id)")
        .eq("referred_user_id", referred_user_id)
        .eq("status", "registered")
        .maybeSingle();

      if (!referral) {
        return new Response(JSON.stringify({ skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const affiliate = referral.affiliates as any;
      const commissionRate = affiliate.commission_rate / 100;
      const commissionAmount = Math.round(mrr_euros * commissionRate * 100) / 100;

      await admin.from("affiliate_commissions").insert({
        affiliate_id: referral.affiliate_id,
        referral_id: referral.id,
        amount_euros: commissionAmount,
        commission_rate: affiliate.commission_rate,
        plan,
        mrr_euros,
        status: "pending",
        stripe_invoice_id: stripe_invoice_id || null,
        period_start: new Date().toISOString().split("T")[0],
      });

      await admin.from("affiliate_referrals").update({
        status: "converted",
        plan,
        stripe_customer_id: stripe_customer_id || null,
        converted_at: new Date().toISOString(),
      }).eq("id", referral.id);

      await admin.from("affiliates").update({
        total_conversions: affiliate.total_conversions + 1,
        total_earned_euros: parseFloat(affiliate.total_earned_euros) + commissionAmount,
        updated_at: new Date().toISOString(),
      }).eq("id", referral.affiliate_id);

      await admin.rpc("create_notification", {
        p_user_id: affiliate.user_id,
        p_type: "system",
        p_title: "Commission gagnée ! 💰",
        p_message: `+${commissionAmount}€ de commission sur un abonnement ${plan}.`,
        p_link: "/app/affiliation",
      }).catch(() => {});

      return new Response(JSON.stringify({ success: true, commission: commissionAmount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "apply_as_affiliate") {
      const authHeader = req.headers.get("authorization");
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader || "" } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: existing } = await admin
        .from("affiliates")
        .select("id, status, code")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ success: false, existing: true, status: existing.status, code: existing.code }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: code } = await admin.rpc("generate_affiliate_code", { p_user_id: user.id });

      const { data: affiliate } = await admin.from("affiliates").insert({
        user_id: user.id,
        code,
        status: "active",
        commission_rate: 20.00,
        commission_type: "recurring",
        approved_at: new Date().toISOString(),
      }).select().single();

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const { data: { user: fullUser } } = await admin.auth.admin.getUserById(user.id);
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "RapidoMeet <noreply@rapidomeet.io>",
            to: [fullUser?.email || ""],
            subject: "Bienvenue dans le programme d'affiliation RapidoMeet ! 🎉",
            html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px">
              <h2>⚡ Vous êtes affilié !</h2>
              <p>Votre code personnel :</p>
              <div style="background:#f0f0ff;border-radius:8px;padding:16px;text-align:center;font-size:24px;font-weight:bold;color:#6366f1;letter-spacing:4px">${code}</div>
              <p>Votre lien de parrainage :</p>
              <code style="background:#f5f5f5;padding:8px;border-radius:4px;display:block">https://rapidomeet.io?ref=${code}</code>
              <p>Commission : <strong>20% récurrent</strong> sur chaque abonnement de vos filleuls.</p>
              <a href="https://app.rapidomeet.io/app/affiliation" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Voir mon tableau de bord →</a>
            </div>`,
          }),
        }).catch(() => {});
      }

      return new Response(JSON.stringify({ success: true, affiliate, code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "get_my_stats") {
      const authHeader = req.headers.get("authorization");
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader || "" } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: stats } = await admin.from("affiliate_stats").select("*").eq("user_id", user.id).single();
      const { data: referrals } = await admin.from("affiliate_referrals")
        .select("*")
        .eq("affiliate_id", stats?.id)
        .order("created_at", { ascending: false })
        .limit(20);
      const { data: commissions } = await admin.from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", stats?.id)
        .order("created_at", { ascending: false })
        .limit(20);
      const { data: clicks } = await admin.from("affiliate_clicks")
        .select("created_at, converted, landing_page, utm_source")
        .eq("affiliate_id", stats?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({ stats, referrals: referrals || [], commissions: commissions || [], clicks: clicks || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      throw new Error(`Action inconnue: ${action}`);
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
