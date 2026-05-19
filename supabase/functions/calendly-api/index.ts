import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CALENDLY_BASE = "https://api.calendly.com";

async function calendlyFetch(path: string, token: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${CALENDLY_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`Calendly API ${res.status}: ${err.message || JSON.stringify(err)}`);
  }
  return res.json();
}

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
  if (!user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { action, payload } = await req.json();
    let result: any = {};

    if (action === "connect_pat") {
      const { token } = payload;
      if (!token) throw new Error("Token requis");

      const profile = await calendlyFetch("/users/me", token);
      const calendlyUser = profile.resource;

      await admin.from("calendly_connections").upsert({
        user_id: user.id,
        access_token: token,
        token_type: "personal",
        calendly_user_uri: calendlyUser.uri,
        calendly_org_uri: calendlyUser.current_organization,
        user_name: calendlyUser.name,
        user_email: calendlyUser.email,
        user_slug: calendlyUser.slug,
        scheduling_url: calendlyUser.scheduling_url,
        is_active: true,
        metadata: { avatar_url: calendlyUser.avatar_url, timezone: calendlyUser.timezone },
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      await admin.from("user_connections").upsert({
        user_id: user.id,
        integration_id: "calendly",
        status: "connected",
        connection_type: "api_key",
        credentials: {},
        config: { name: calendlyUser.name, email: calendlyUser.email, scheduling_url: calendlyUser.scheduling_url },
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,integration_id" }).catch(() => {});

      result = { success: true, name: calendlyUser.name, email: calendlyUser.email, scheduling_url: calendlyUser.scheduling_url };

    } else if (action === "disconnect") {
      await admin.from("calendly_connections").update({ is_active: false, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      await admin.from("user_connections").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("integration_id", "calendly");
      result = { success: true };

    } else if (action === "get_event_types") {
      const { data: conn } = await admin.from("calendly_connections").select("access_token, calendly_user_uri").eq("user_id", user.id).eq("is_active", true).single();
      if (!conn) throw new Error("Calendly non connecté");

      const data = await calendlyFetch(`/event_types?user=${encodeURIComponent(conn.calendly_user_uri)}&active=true`, conn.access_token);
      result = {
        event_types: (data.collection || []).map((et: any) => ({
          uri: et.uri, name: et.name, duration: et.duration, slug: et.slug,
          scheduling_url: et.scheduling_url, color: et.color, description_plain: et.description_plain,
        })),
      };

    } else if (action === "sync_events") {
      const { days_back = 30, days_ahead = 30 } = payload || {};
      const { data: conn } = await admin.from("calendly_connections").select("*").eq("user_id", user.id).eq("is_active", true).single();
      if (!conn) throw new Error("Calendly non connecté");

      const minTime = new Date(Date.now() - days_back * 86400000).toISOString();
      const maxTime = new Date(Date.now() + days_ahead * 86400000).toISOString();

      const data = await calendlyFetch(
        `/scheduled_events?user=${encodeURIComponent(conn.calendly_user_uri)}&min_start_time=${minTime}&max_start_time=${maxTime}&count=100&sort=start_time:asc`,
        conn.access_token
      );

      const events = data.collection || [];
      let synced = 0;

      for (const ev of events) {
        let invitees: any[] = [];
        try {
          const invData = await calendlyFetch(`/scheduled_events/${ev.uri.split("/").pop()}/invitees?count=20`, conn.access_token);
          invitees = (invData.collection || []).map((inv: any) => ({ name: inv.name, email: inv.email, status: inv.status, timezone: inv.timezone }));
        } catch {}

        await admin.from("calendly_events").upsert({
          user_id: user.id, calendly_uri: ev.uri, event_type_uri: ev.event_type,
          name: ev.name, status: ev.status, start_time: ev.start_time, end_time: ev.end_time,
          location: ev.location || {}, invitees_count: invitees.length, invitees,
          cancellation: ev.cancellation || null, updated_at: new Date().toISOString(),
        }, { onConflict: "calendly_uri" });
        synced++;
      }

      result = { success: true, synced, total: events.length };

    } else if (action === "create_link") {
      const { event_type_uri, max_count = 1, context, meeting_id } = payload;
      const { data: conn } = await admin.from("calendly_connections").select("access_token").eq("user_id", user.id).eq("is_active", true).single();
      if (!conn) throw new Error("Calendly non connecté");

      const data = await calendlyFetch("/scheduling_links", conn.access_token, {
        method: "POST",
        body: JSON.stringify({ max_event_count: max_count, owner: event_type_uri, owner_type: "EventType" }),
      });

      const link = data.resource;
      await admin.from("calendly_scheduling_links").insert({
        user_id: user.id, meeting_id: meeting_id || null, calendly_link_uri: link.uri,
        booking_url: link.booking_url, event_type_uri, max_event_count: max_count, context: context || null,
      });

      result = { success: true, booking_url: link.booking_url, uri: link.uri };

    } else if (action === "cancel_event") {
      const { event_uri, reason } = payload;
      const { data: conn } = await admin.from("calendly_connections").select("access_token").eq("user_id", user.id).eq("is_active", true).single();
      if (!conn) throw new Error("Calendly non connecté");

      const eventId = event_uri.split("/").pop();
      await calendlyFetch(`/scheduled_events/${eventId}/cancellation`, conn.access_token, {
        method: "POST",
        body: JSON.stringify({ reason: reason || "Annulé depuis RapidoMeet" }),
      });

      await admin.from("calendly_events").update({
        status: "canceled", cancellation: { reason, canceled_by: "user" }, updated_at: new Date().toISOString(),
      }).eq("calendly_uri", event_uri);

      result = { success: true };

    } else if (action === "get_connection") {
      const { data: conn } = await admin.from("calendly_connections")
        .select("user_name, user_email, scheduling_url, user_slug, is_active, metadata")
        .eq("user_id", user.id).maybeSingle();
      result = { connection: conn };

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
