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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Session invalide" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const { meeting_id } = body;
        if (!meeting_id) {
          return new Response(JSON.stringify({ error: "meeting_id requis" }), { status: 400, headers: corsHeaders });
        }

        // Verify meeting belongs to user
        const { data: meeting } = await supabase
          .from("meetings")
          .select("id")
          .eq("id", meeting_id)
          .eq("user_id", user.id)
          .single();

        if (!meeting) {
          return new Response(JSON.stringify({ error: "Réunion introuvable" }), { status: 404, headers: corsHeaders });
        }

        const { data: actions, error } = await supabase
          .from("pending_actions" as any)
          .select("*")
          .eq("meeting_id", meeting_id)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        return new Response(JSON.stringify({ actions: actions || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "confirm": {
        const { action_id } = body;
        if (!action_id) {
          return new Response(JSON.stringify({ error: "action_id requis" }), { status: 400, headers: corsHeaders });
        }

        const { error } = await supabase
          .from("pending_actions" as any)
          .update({ status: "confirmed", updated_at: new Date().toISOString() } as any)
          .eq("id", action_id)
          .eq("user_id", user.id)
          .eq("status", "pending");

        if (error) throw error;

        // TODO: Trigger actual execution via dispatcher/MCP
        // For now, mark as confirmed and let the backend poll handle execution

        return new Response(JSON.stringify({ ok: true, status: "confirmed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "refuse": {
        const { action_id } = body;
        if (!action_id) {
          return new Response(JSON.stringify({ error: "action_id requis" }), { status: 400, headers: corsHeaders });
        }

        const { error } = await supabase
          .from("pending_actions" as any)
          .update({ status: "refused", updated_at: new Date().toISOString() } as any)
          .eq("id", action_id)
          .eq("user_id", user.id)
          .eq("status", "pending");

        if (error) throw error;

        return new Response(JSON.stringify({ ok: true, status: "refused" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "confirm_all":
      case "refuse_all": {
        const { action_ids, meeting_id } = body;
        const newStatus = action === "confirm_all" ? "confirmed" : "refused";

        let query = supabase
          .from("pending_actions" as any)
          .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
          .eq("user_id", user.id)
          .eq("status", "pending");

        if (meeting_id) query = query.eq("meeting_id", meeting_id);
        if (action_ids?.length) query = query.in("id", action_ids);

        const { error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true, status: newStatus, count: action_ids?.length || 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Action inconnue: ${action}` }), { status: 400, headers: corsHeaders });
    }
  } catch (e: any) {
    console.error("pending-actions error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erreur interne" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
