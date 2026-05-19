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

  const authHeader = req.headers.get("authorization");
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader || "" } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { action, payload } = await req.json();
    let result: any = {};

    if (action === "set_subdomain") {
      const { page_id, subdomain } = payload;
      const clean = subdomain
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const { data: available } = await admin.rpc("is_subdomain_available", {
        p_slug: clean,
      });

      if (!available) {
        throw new Error(
          `"${clean}" est déjà pris ou invalide. Essayez un autre nom.`
        );
      }

      const { data: page } = await admin
        .from("landing_pages")
        .select("id, user_id")
        .eq("id", page_id)
        .eq("user_id", user.id)
        .single();

      if (!page) throw new Error("Page introuvable");

      await admin
        .from("landing_pages")
        .update({
          subdomain: clean,
          subdomain_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", page_id)
        .eq("user_id", user.id);

      result = {
        success: true,
        subdomain: clean,
        url: `https://${clean}.rapidomeet.io`,
        message: `Sous-domaine activé : ${clean}.rapidomeet.io`,
      };
    } else if (action === "check_subdomain") {
      const { subdomain } = payload;
      const clean = subdomain
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const { data: available } = await admin.rpc("is_subdomain_available", {
        p_slug: clean,
      });

      result = {
        available: !!available,
        subdomain: clean,
        url: available ? `https://${clean}.rapidomeet.io` : null,
        suggestion: !available
          ? await generateSuggestion(admin, clean)
          : null,
      };
    } else if (action === "add_custom_domain") {
      const { page_id, domain } = payload;

      const { data: sub } = await admin
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!sub || sub.plan !== "pro") {
        throw new Error(
          "Les domaines custom nécessitent le plan Pro (24.90€/mois)."
        );
      }

      const cleanDomain = domain
        .toLowerCase()
        .replace(/^https?:\/\//i, "")
        .replace(/\/.*$/, "")
        .trim();

      const domainRegex = /^([a-z0-9][a-z0-9-]*\.)+[a-z]{2,}$/;
      if (!domainRegex.test(cleanDomain)) {
        throw new Error(`"${cleanDomain}" n'est pas un domaine valide.`);
      }

      const { data: existingPage } = await admin
        .from("landing_pages")
        .select("id, user_id")
        .eq("custom_domain", cleanDomain)
        .maybeSingle();

      if (existingPage && existingPage.user_id !== user.id) {
        throw new Error("Ce domaine est déjà utilisé par un autre compte.");
      }

      const token =
        "rapidomeet-verify=" +
        Math.random().toString(36).substring(2, 18);

      await admin.from("domain_verifications").upsert(
        {
          landing_page_id: page_id,
          user_id: user.id,
          domain: cleanDomain,
          domain_type: "custom",
          verification_token: token,
          status: "pending",
        },
        { onConflict: "landing_page_id" }
      );

      await admin
        .from("landing_pages")
        .update({
          custom_domain: cleanDomain,
          domain_verified: false,
          domain_txt_record: token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", page_id)
        .eq("user_id", user.id);

      result = {
        success: true,
        domain: cleanDomain,
        verification_token: token,
        instructions: {
          step1: {
            title: "Étape 1 — Enregistrement CNAME",
            type: "cname",
            host: cleanDomain.startsWith("www.") ? "www" : "@",
            value: "pages.rapidomeet.io",
          },
          step2: {
            title: "Étape 2 — Vérification TXT",
            type: "txt",
            host: "_rapidomeet-verify",
            value: token,
          },
        },
      };
    } else if (action === "verify_domain") {
      const { page_id } = payload;

      const { data: page } = await admin
        .from("landing_pages")
        .select("custom_domain, domain_txt_record, user_id")
        .eq("id", page_id)
        .eq("user_id", user.id)
        .single();

      if (!page?.custom_domain)
        throw new Error("Aucun domaine custom configuré");

      let cnameOk = false;
      let txtOk = false;

      try {
        const cnameRes = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${page.custom_domain}&type=CNAME`,
          { headers: { Accept: "application/dns-json" } }
        );
        const cnameData = await cnameRes.json();
        cnameOk = (cnameData.Answer || []).some(
          (a: any) =>
            a.data?.includes("pages.rapidomeet.io") ||
            a.data?.includes("rapidomeet.io")
        );
        if (!cnameOk) {
          const aRes = await fetch(
            `https://cloudflare-dns.com/dns-query?name=${page.custom_domain}&type=A`,
            { headers: { Accept: "application/dns-json" } }
          );
          const aData = await aRes.json();
          cnameOk = (aData.Answer || []).length > 0;
        }
      } catch {}

      try {
        const txtRes = await fetch(
          `https://cloudflare-dns.com/dns-query?name=_rapidomeet-verify.${page.custom_domain}&type=TXT`,
          { headers: { Accept: "application/dns-json" } }
        );
        const txtData = await txtRes.json();
        txtOk = (txtData.Answer || []).some(
          (a: any) =>
            a.data?.includes(page.domain_txt_record) ||
            a.data?.replace(/"/g, "").includes(page.domain_txt_record)
        );
      } catch {}

      const verified = cnameOk && txtOk;

      await admin
        .from("landing_pages")
        .update({
          domain_verified: verified,
          domain_verified_at: verified ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", page_id);

      await admin
        .from("domain_verifications")
        .update({
          status: verified ? "verified" : "pending",
          attempts: 1,
          last_check_at: new Date().toISOString(),
          verified_at: verified ? new Date().toISOString() : null,
          error_message: !verified
            ? `CNAME: ${cnameOk ? "✓" : "✗"} | TXT: ${txtOk ? "✓" : "✗"}`
            : null,
        })
        .eq("landing_page_id", page_id)
        .eq("status", "pending");

      result = {
        verified,
        cname_ok: cnameOk,
        txt_ok: txtOk,
        domain: page.custom_domain,
        message: verified
          ? `✅ Domaine vérifié ! ${page.custom_domain} est actif.`
          : `⏳ Vérification en cours. CNAME ${cnameOk ? "✓" : "✗"}, TXT ${txtOk ? "✓" : "✗"}. Réessayez dans quelques minutes.`,
      };
    } else if (action === "remove_custom_domain") {
      const { page_id } = payload;

      await admin
        .from("landing_pages")
        .update({
          custom_domain: null,
          domain_verified: false,
          domain_verified_at: null,
          domain_txt_record: null,
          ssl_provisioned: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", page_id)
        .eq("user_id", user.id);

      await admin
        .from("domain_verifications")
        .delete()
        .eq("landing_page_id", page_id);

      result = { success: true };
    } else if (action === "get_domain_config") {
      const { page_id } = payload;

      const { data: page } = await admin
        .from("landing_pages")
        .select(
          "subdomain, custom_domain, domain_verified, domain_txt_record, subdomain_active, ssl_provisioned, domain_verified_at"
        )
        .eq("id", page_id)
        .eq("user_id", user.id)
        .single();

      const { data: verif } = await admin
        .from("domain_verifications")
        .select("status, attempts, last_check_at, error_message")
        .eq("landing_page_id", page_id)
        .maybeSingle();

      result = {
        config: page,
        verification: verif,
        subdomain_url: page?.subdomain
          ? `https://${page.subdomain}.rapidomeet.io`
          : null,
        custom_url:
          page?.custom_domain && page?.domain_verified
            ? `https://${page.custom_domain}`
            : null,
      };
    } else {
      throw new Error(`Action inconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateSuggestion(
  admin: any,
  base: string
): Promise<string> {
  const suffixes = ["-pro", "-fr", "-2", "-business", "-pro2"];
  for (const s of suffixes) {
    const candidate = base + s;
    const { data } = await admin.rpc("is_subdomain_available", {
      p_slug: candidate,
    });
    if (data) return candidate;
  }
  return base + "-" + Math.random().toString(36).substring(2, 5);
}
