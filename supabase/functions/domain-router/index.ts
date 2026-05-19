import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const host = req.headers.get("host") || "";

  let pageQuery: any = null;

  if (host.endsWith(".rapidomeet.io")) {
    const subdomain = host.replace(".rapidomeet.io", "");
    if (["www", "app", "api"].includes(subdomain)) {
      return new Response(null, { status: 404 });
    }
    pageQuery = admin
      .from("landing_pages")
      .select("id, slug, title, content_html, subdomain")
      .eq("subdomain", subdomain)
      .eq("status", "published")
      .eq("subdomain_active", true)
      .single();
  } else if (
    host !== "rapidomeet.io" &&
    host !== "www.rapidomeet.io"
  ) {
    pageQuery = admin
      .from("landing_pages")
      .select("id, slug, title, content_html, custom_domain")
      .eq("custom_domain", host)
      .eq("status", "published")
      .eq("domain_verified", true)
      .single();
  }

  if (!pageQuery) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: page, error } = await pageQuery;

  if (error || !page) {
    return new Response(
      `<!DOCTYPE html><html><head><title>Page introuvable</title></head><body style="font-family:Arial;text-align:center;padding:60px"><h1>404</h1><p>Cette page n'existe pas.</p><a href="https://rapidomeet.io">Créer votre page →</a></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://app.rapidomeet.io/p/${page.slug}`,
      "X-Rapidomeet-Page-Id": page.id,
      "X-Rapidomeet-Slug": page.slug,
      "Cache-Control": "no-store, must-revalidate",
    },
  });
});
