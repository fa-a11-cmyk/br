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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const authHeader = req.headers.get("authorization");
  const userClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader || "" } } }
  );
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { section, workspaceId } = await req.json();
    let result: any = {};

    if (section === "my_workspaces") {
      const { data: memberships } = await admin
        .from("workspace_members")
        .select(
          `role, status, joined_at,
          workspaces(id, name, slug, description, logo_url, owner_id, plan, max_members, created_at)`
        )
        .eq("user_id", user.id)
        .eq("status", "active");

      result = {
        workspaces: (memberships || []).map((m: any) => ({
          ...m.workspaces,
          my_role: m.role,
          joined_at: m.joined_at,
        })),
      };
    } else if (section === "workspace_detail") {
      if (!workspaceId) throw new Error("workspaceId requis");

      const isMember = await admin.rpc("is_workspace_member", {
        p_user_id: user.id,
        p_workspace_id: workspaceId,
      });
      if (!isMember.data) throw new Error("Accès refusé");

      const [
        { data: ws },
        { data: members },
        { data: invitations },
        { data: sharedMeetings },
      ] = await Promise.all([
        admin.from("workspaces").select("*").eq("id", workspaceId).single(),
        admin
          .from("workspace_members")
          .select(
            `user_id, role, status, joined_at,
            profiles(first_name, last_name, company, avatar_url)`
          )
          .eq("workspace_id", workspaceId)
          .eq("status", "active"),
        admin
          .from("workspace_invitations")
          .select("id, email, role, status, expires_at")
          .eq("workspace_id", workspaceId)
          .eq("status", "pending"),
        admin
          .from("shared_meetings")
          .select(
            `meeting_id, permissions, shared_by, created_at,
            meetings(id, title, status, meeting_type, duration_seconds, summary, sentiment_score, efficiency_score, created_at)`
          )
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      // Get sharer profiles
      const sharerIds = [
        ...new Set((sharedMeetings || []).map((sm: any) => sm.shared_by)),
      ];
      let sharerProfiles: any[] = [];
      if (sharerIds.length > 0) {
        const { data: profiles } = await admin
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", sharerIds);
        sharerProfiles = profiles || [];
      }

      const myRole = (members || []).find(
        (m: any) => m.user_id === user.id
      )?.role;

      result = {
        workspace: ws,
        my_role: myRole,
        members: members || [],
        pending_invitations: invitations || [],
        shared_meetings: (sharedMeetings || []).map((sm: any) => ({
          ...sm,
          sharer_profile: sharerProfiles.find(
            (p: any) => p.user_id === sm.shared_by
          ),
        })),
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
