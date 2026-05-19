import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { action, payload } = await req.json();
    let result: any = {};

    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://app.rapidomeet.io";

    if (action === "get_auth_url") {
      const { provider } = payload;
      const state = btoa(JSON.stringify({ user_id: user.id, provider, ts: Date.now() }));

      if (provider === "google_meet") {
        const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
        if (!googleClientId) throw new Error("GOOGLE_CLIENT_ID non configuré");
        const params = new URLSearchParams({
          client_id: googleClientId,
          redirect_uri: `${frontendUrl}/oauth/google/callback`,
          response_type: "code",
          scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly openid email profile",
          access_type: "offline",
          prompt: "consent",
          state,
        });
        result = { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, state };
      } else if (provider === "zoom") {
        const zoomClientId = Deno.env.get("ZOOM_CLIENT_ID");
        if (!zoomClientId) throw new Error("ZOOM_CLIENT_ID non configuré");
        const params = new URLSearchParams({
          client_id: zoomClientId,
          redirect_uri: Deno.env.get("ZOOM_REDIRECT_URI") || `${frontendUrl}/oauth/zoom/callback`,
          response_type: "code",
          state,
        });
        result = { url: `https://zoom.us/oauth/authorize?${params}`, state };
      }

    } else if (action === "exchange_code") {
      const { provider, code, state } = payload;
      try {
        const decoded = JSON.parse(atob(state));
        if (decoded.user_id !== user.id) throw new Error("State invalide");
        if (Date.now() - decoded.ts > 600000) throw new Error("Code expiré");
      } catch { throw new Error("State OAuth invalide"); }

      if (provider === "google_meet") {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
            client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
            redirect_uri: `${frontendUrl}/oauth/google/callback`,
            code,
            grant_type: "authorization_code",
          }),
        });
        const tokens = await tokenRes.json();
        if (!tokens.access_token) throw new Error(tokens.error_description || "Erreur token Google");

        const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const profile = await profileRes.json();
        const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

        await admin.from("oauth_connections").upsert({
          user_id: user.id, provider: "google_meet", provider_user_id: profile.id,
          provider_email: profile.email, access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null, token_expires_at: expiresAt,
          scopes: tokens.scope?.split(" ") || [], is_active: true,
          metadata: { name: profile.name, avatar_url: profile.picture },
          updated_at: new Date().toISOString(),
        } as any, { onConflict: "user_id,provider" });

        await admin.from("user_connections" as any).upsert({
          user_id: user.id, integration_id: "google-meet", status: "connected",
          connection_type: "oauth", config: { email: profile.email, name: profile.name },
          account_label: profile.email, updated_at: new Date().toISOString(),
        } as any, { onConflict: "user_id,integration_id" }).catch(() => {});

        result = { success: true, provider: "google_meet", email: profile.email, name: profile.name };

      } else if (provider === "zoom") {
        const credentials = btoa(`${Deno.env.get("ZOOM_CLIENT_ID")}:${Deno.env.get("ZOOM_CLIENT_SECRET")}`);
        const tokenRes = await fetch("https://zoom.us/oauth/token", {
          method: "POST",
          headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code, grant_type: "authorization_code",
            redirect_uri: Deno.env.get("ZOOM_REDIRECT_URI") || `${frontendUrl}/oauth/zoom/callback`,
          }),
        });
        const tokens = await tokenRes.json();
        if (!tokens.access_token) throw new Error(tokens.reason || "Erreur token Zoom");

        const profileRes = await fetch("https://api.zoom.us/v2/users/me", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const profile = await profileRes.json();
        const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

        await admin.from("oauth_connections").upsert({
          user_id: user.id, provider: "zoom", provider_user_id: profile.id,
          provider_email: profile.email, access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null, token_expires_at: expiresAt,
          scopes: tokens.scope?.split(" ") || [], is_active: true,
          metadata: { name: `${profile.first_name} ${profile.last_name}`, account_type: profile.type },
          updated_at: new Date().toISOString(),
        } as any, { onConflict: "user_id,provider" });

        await admin.from("user_connections" as any).upsert({
          user_id: user.id, integration_id: "zoom", status: "connected",
          connection_type: "oauth", config: { email: profile.email },
          account_label: profile.email, updated_at: new Date().toISOString(),
        } as any, { onConflict: "user_id,integration_id" }).catch(() => {});

        result = { success: true, provider: "zoom", email: profile.email, name: `${profile.first_name} ${profile.last_name}` };
      }

    } else if (action === "refresh_token") {
      const { provider } = payload;
      const { data: conn } = await admin.from("oauth_connections").select("*").eq("user_id", user.id).eq("provider", provider).eq("is_active", true).single();
      if (!conn?.refresh_token) throw new Error("Pas de refresh token — reconnectez votre compte");

      let newTokens: any = {};
      if (provider === "google_meet") {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ client_id: Deno.env.get("GOOGLE_CLIENT_ID")!, client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!, refresh_token: conn.refresh_token, grant_type: "refresh_token" }),
        });
        newTokens = await res.json();
      } else if (provider === "zoom") {
        const credentials = btoa(`${Deno.env.get("ZOOM_CLIENT_ID")}:${Deno.env.get("ZOOM_CLIENT_SECRET")}`);
        const res = await fetch("https://zoom.us/oauth/token", {
          method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ refresh_token: conn.refresh_token, grant_type: "refresh_token" }),
        });
        newTokens = await res.json();
      }
      if (!newTokens.access_token) throw new Error("Échec du rafraîchissement du token");
      const expiresAt = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000).toISOString();
      await admin.from("oauth_connections").update({ access_token: newTokens.access_token, refresh_token: newTokens.refresh_token || conn.refresh_token, token_expires_at: expiresAt, updated_at: new Date().toISOString() } as any).eq("id", conn.id);
      result = { success: true, expires_at: expiresAt };

    } else if (action === "disconnect") {
      const { provider } = payload;
      await admin.from("oauth_connections").update({ is_active: false, updated_at: new Date().toISOString() } as any).eq("user_id", user.id).eq("provider", provider);
      await admin.from("user_connections" as any).delete().eq("user_id", user.id).eq("integration_id", provider === "google_meet" ? "google-meet" : provider);
      result = { success: true };

    } else if (action === "get_connections") {
      const { data: connections } = await admin.from("oauth_connections").select("provider, provider_email, is_active, token_expires_at, metadata").eq("user_id", user.id).eq("is_active", true);
      result = { connections: connections || [] };

    } else {
      throw new Error(`Action inconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
