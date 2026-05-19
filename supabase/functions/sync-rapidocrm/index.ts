import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const authHeader = req.headers.get("authorization");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader || "" } },
  });

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { meetingId } = await req.json();
    if (!meetingId) throw new Error("meetingId requis");

    const { data: connection } = await admin
      .from("user_connections")
      .select("credentials, config, status")
      .eq("user_id", user.id)
      .eq("integration_id", "rapidocrm")
      .eq("status", "connected")
      .maybeSingle();

    if (!connection) {
      return new Response(JSON.stringify({ skipped: true, reason: "RapidoCRM non connecté" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const creds = connection.credentials as any;
    const apiUrl = creds?.api_url || "https://api.rapidocrm.io";
    const apiKey = creds?.api_key;
    if (!apiKey) throw new Error("Clé API RapidoCRM manquante");

    const { data: contacts } = await admin
      .from("detected_contacts").select("*")
      .eq("meeting_id", meetingId).eq("user_id", user.id);

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ success: true, synced: 0, message: "Aucun contact à synchroniser" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: meeting } = await admin
      .from("meetings").select("title, meeting_type, summary, created_at")
      .eq("id", meetingId).single();

    const results = { created: 0, updated: 0, skipped: 0, failed: 0 };

    for (const contact of contacts) {
      try {
        const { data: existing } = await admin
          .from("rapidocrm_syncs")
          .select("rapidocrm_contact_id")
          .eq("contact_id", contact.id).eq("action", "created")
          .maybeSingle();

        let action: string;
        let rapidocrmId: string;

        if (existing?.rapidocrm_contact_id) {
          const updateRes = await fetch(`${apiUrl}/v1/contacts/${existing.rapidocrm_contact_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
            body: JSON.stringify({
              last_interaction: meeting?.created_at,
              last_meeting: meeting?.title,
              interest_score: contact.score,
            }),
            signal: AbortSignal.timeout(10000),
          });
          if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.status}`);
          rapidocrmId = existing.rapidocrm_contact_id;
          action = "updated";
          results.updated++;
        } else {
          const createRes = await fetch(`${apiUrl}/v1/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
            body: JSON.stringify({
              name: contact.name, company: contact.company || null,
              email: contact.email || null, source: "rapidomeet",
              source_meeting_id: meetingId, interest_score: contact.score,
              tags: ["rapidomeet", meeting?.meeting_type || "reunion"],
            }),
            signal: AbortSignal.timeout(10000),
          });
          if (!createRes.ok) {
            const err = await createRes.json().catch(() => ({}));
            throw new Error((err as any).message || `Create failed: ${createRes.status}`);
          }
          const created = await createRes.json();
          rapidocrmId = (created as any).id || (created as any).data?.id || "unknown";
          action = "created";
          results.created++;
        }

        await admin.from("rapidocrm_syncs").insert({
          user_id: user.id, meeting_id: meetingId,
          contact_id: contact.id, rapidocrm_contact_id: rapidocrmId, action,
        });
      } catch (contactError: any) {
        results.failed++;
        await admin.from("rapidocrm_syncs").insert({
          user_id: user.id, meeting_id: meetingId,
          contact_id: contact.id, action: "failed",
          error_message: contactError.message,
        });
      }
    }

    if (results.created + results.updated > 0) {
      await admin.rpc("create_notification", {
        p_user_id: user.id, p_type: "system",
        p_title: "Contacts synchronisés vers RapidoCRM",
        p_message: `${results.created + results.updated} contact(s) synchronisé(s) depuis la réunion.`,
        p_link: `/app/reunions/${meetingId}`,
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
