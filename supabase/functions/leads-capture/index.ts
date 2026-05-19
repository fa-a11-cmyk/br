import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const {
      lead_magnet_id, article_id,
      first_name, company_name,
      email, phone,
      utm_source, utm_medium, utm_campaign,
    } = await req.json();

    if (!email) throw new Error("Email requis");

    // Check duplicate
    const { data: existing } = await admin
      .from("leads_captures")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("lead_magnet_id", lead_magnet_id || "")
      .maybeSingle();

    // Insert lead
    await admin.from("leads_captures").insert({
      lead_magnet_id: lead_magnet_id || null,
      article_id: article_id || null,
      first_name: first_name || null,
      company_name: company_name || null,
      email: email.toLowerCase(),
      phone: phone || null,
      source: "blog",
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
    });

    // Increment download_count
    if (lead_magnet_id) {
      const { data: magnet } = await admin
        .from("leads_magnets")
        .select("download_count")
        .eq("id", lead_magnet_id)
        .single();
      if (magnet) {
        await admin.from("leads_magnets")
          .update({ download_count: (magnet.download_count || 0) + 1 })
          .eq("id", lead_magnet_id);
      }
    }

    // Get lead magnet data
    let magnetData: any = null;
    if (lead_magnet_id) {
      const { data } = await admin
        .from("leads_magnets")
        .select("title, file_url, content_html, description")
        .eq("id", lead_magnet_id)
        .single();
      magnetData = data;
    }

    // Send email with lead magnet
    if (resendKey && magnetData) {
      const downloadSection = magnetData.file_url
        ? `<a href="${magnetData.file_url}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">📥 Télécharger ${magnetData.title} →</a>`
        : magnetData.content_html || "";

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "RapidoMeet <noreply@rapidomeet.io>",
          to: [email],
          subject: `📥 Votre ${magnetData.title} — RapidoMeet`,
          html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e">
            <h2>⚡ Merci ${first_name || ""}!</h2>
            <p>Voici votre accès à :</p>
            <h3 style="color:#6366f1">${magnetData.title}</h3>
            <p>${magnetData.description || ""}</p>
            ${downloadSection}
            <hr style="border:1px solid #e5e7eb;margin:24px 0"/>
            <p style="color:#6b7280;font-size:13px">Découvrez comment RapidoMeet peut transformer vos réunions en actions.</p>
            <a href="https://rapidomeet.lovable.app" style="color:#6366f1">Essayer gratuitement →</a>
            <p style="color:#9ca3af;font-size:11px;margin-top:20px">RapidoMeet · BraindCode</p>
          </div>`,
        }),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      success: true,
      is_duplicate: !!existing,
      has_file: !!magnetData?.file_url,
      message: "Lead enregistré avec succès",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
