import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Session invalide" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const { data, error } = await supabase
          .from("user_connections")
          .select("id, integration_id, status, connection_type, account_label, config, connected_at")
          .eq("user_id", user.id);
        if (error) throw error;

        const connections = (data || []).map((c: any) => ({
          id: c.id,
          provider: c.integration_id,
          status: c.status,
          account_label: c.account_label,
          metadata: c.config || {},
          connected_at: c.connected_at,
        }));
        return new Response(JSON.stringify({ connections }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "oauth_start": {
        const { provider, redirect_uri } = body;
        if (!provider) {
          return new Response(JSON.stringify({ error: "Provider requis" }), { status: 400, headers: corsHeaders });
        }

        // Generate OAuth URL based on provider
        const state = crypto.randomUUID();
        let authUrl = "";

        if (provider === "google_calendar" || provider === "gmail" || provider === "google-calendar" || provider === "google-meet" || provider === "google-drive") {
          const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
          if (!clientId) {
            return new Response(JSON.stringify({ error: "Google OAuth non configuré" }), { status: 500, headers: corsHeaders });
          }
          const scopes = provider === "gmail"
            ? "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly"
            : provider === "google-drive"
            ? "https://www.googleapis.com/auth/drive.file"
            : "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events";

          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scopes + " openid email profile")}` +
            `&state=${state}` +
            `&access_type=offline` +
            `&prompt=consent`;
        } else {
          return new Response(JSON.stringify({ error: `OAuth non supporté pour ${provider}` }), { status: 400, headers: corsHeaders });
        }

        // Store state for verification
        await supabase.from("oauth_states" as any).upsert({
          state,
          user_id: user.id,
          provider,
          redirect_uri,
          created_at: new Date().toISOString(),
        } as any);

        return new Response(JSON.stringify({ url: authUrl, state }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "connect": {
        const { provider, credentials, account_label } = body;
        if (!provider || !credentials) {
          return new Response(JSON.stringify({ error: "Provider et credentials requis" }), { status: 400, headers: corsHeaders });
        }

        // Validate input lengths
        for (const [key, val] of Object.entries(credentials)) {
          if (typeof val === "string" && val.length > 2000) {
            return new Response(JSON.stringify({ error: `Champ ${key} trop long` }), { status: 400, headers: corsHeaders });
          }
        }

        // Store connection (without secrets in the main table)
        const { error: connError } = await supabase
          .from("user_connections")
          .upsert({
            user_id: user.id,
            integration_id: provider,
            status: "connected",
            connection_type: "api_key",
            credentials: {}, // Empty — secrets go to vault
            config: {},
            account_label: account_label || null,
          } as any, { onConflict: "user_id,integration_id" });

        if (connError) throw connError;

        // Encrypt and store credentials in vault via encrypt-credentials function
        try {
          const encryptRes = await fetch(`${supabaseUrl}/functions/v1/encrypt-credentials`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: "encrypt", credentials, integrationId: provider }),
          });
          if (!encryptRes.ok) {
            console.error("Vault storage warning:", await encryptRes.text());
          }
        } catch (e) {
          console.error("Vault storage failed:", e);
        }

        return new Response(JSON.stringify({ ok: true, provider, status: "connected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "disconnect": {
        const { connection_id } = body;
        if (!connection_id) {
          return new Response(JSON.stringify({ error: "connection_id requis" }), { status: 400, headers: corsHeaders });
        }

        const { error: delError } = await supabase
          .from("user_connections")
          .delete()
          .eq("id", connection_id)
          .eq("user_id", user.id);

        if (delError) throw delError;

        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "test": {
        const { connection_id } = body;
        if (!connection_id) {
          return new Response(JSON.stringify({ error: "connection_id requis" }), { status: 400, headers: corsHeaders });
        }

        // Fetch connection to determine provider
        const { data: conn, error: fetchErr } = await supabase
          .from("user_connections")
          .select("integration_id, config")
          .eq("id", connection_id)
          .eq("user_id", user.id)
          .single();

        if (fetchErr || !conn) {
          return new Response(JSON.stringify({ ok: false, error: "Connexion introuvable" }), { status: 404, headers: corsHeaders });
        }

        // Basic test — for now just verify the connection exists
        return new Response(JSON.stringify({ ok: true, provider: (conn as any).integration_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: `Action inconnue: ${action}` }), { status: 400, headers: corsHeaders });
    }
  } catch (e: any) {
    console.error("connections-api error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erreur interne" }), { status: 500, headers: corsHeaders });
  }
});
