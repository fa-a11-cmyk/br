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
  if (!authHeader)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const userClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();
  if (authErr || !user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { action, workspaceId, payload } = await req.json();
    let result: any = {};

    switch (action) {
      case "create_workspace": {
        const slug =
          payload.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .substring(0, 30) +
          "-" +
          Math.random().toString(36).substring(2, 6);

        const { data: ws, error } = await admin
          .from("workspaces")
          .insert({
            name: payload.name,
            slug,
            description: payload.description || null,
            owner_id: user.id,
            plan: "free",
          })
          .select()
          .single();

        if (error) throw error;

        await admin.from("workspace_members").insert({
          workspace_id: ws.id,
          user_id: user.id,
          role: "owner",
          status: "active",
        });

        result = { success: true, workspace: ws };
        break;
      }

      case "invite_member": {
        const role = await admin.rpc("get_user_workspace_role", {
          p_user_id: user.id,
          p_workspace_id: workspaceId,
        });
        if (!["owner", "admin"].includes(role.data))
          throw new Error("Permission refusée");

        const { data: ws } = await admin
          .from("workspaces")
          .select("max_members, name")
          .eq("id", workspaceId)
          .single();

        const { count: memberCount } = await admin
          .from("workspace_members")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "active");

        if ((memberCount || 0) >= (ws?.max_members || 5))
          throw new Error(
            `Limite de ${ws?.max_members} membres atteinte. Passez à un plan supérieur.`
          );

        const { data: inv, error: invErr } = await admin
          .from("workspace_invitations")
          .insert({
            workspace_id: workspaceId,
            email: payload.email.toLowerCase(),
            role: payload.role || "member",
            invited_by: user.id,
          })
          .select()
          .single();

        if (invErr) throw invErr;

        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const { data: inviterProfile } = await admin
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", user.id)
            .single();

          const inviterName =
            [inviterProfile?.first_name, inviterProfile?.last_name]
              .filter(Boolean)
              .join(" ") || "Un membre";

          const acceptUrl = `${
            Deno.env.get("FRONTEND_URL") || "https://app.rapidomeet.io"
          }/workspace/join/${inv.token}`;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "RapidoMeet <noreply@rapidomeet.io>",
              to: [payload.email],
              subject: `${inviterName} vous invite à rejoindre ${ws?.name}`,
              html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px">
                <h2>⚡ Invitation RapidoMeet</h2>
                <p><strong>${inviterName}</strong> vous invite à rejoindre l'espace de travail <strong>${ws?.name}</strong> sur RapidoMeet.</p>
                <a href="${acceptUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Accepter l'invitation →</a>
                <p style="color:#9ca3af;font-size:12px">Lien valable 7 jours.</p>
              </div>`,
            }),
          }).catch(() => {});
        }

        result = { success: true, invitation: inv, email_sent: !!resendKey };
        break;
      }

      case "accept_invitation": {
        const { token } = payload;

        const { data: inv } = await admin
          .from("workspace_invitations")
          .select("*, workspaces(name)")
          .eq("token", token)
          .eq("status", "pending")
          .maybeSingle();

        if (!inv) throw new Error("Invitation invalide ou expirée");

        if (new Date(inv.expires_at) < new Date()) {
          await admin
            .from("workspace_invitations")
            .update({ status: "expired" })
            .eq("id", inv.id);
          throw new Error("Invitation expirée");
        }

        const { data: { user: currentUser } } =
          await admin.auth.admin.getUserById(user.id);
        if (
          currentUser?.email?.toLowerCase() !== inv.email.toLowerCase()
        )
          throw new Error("Cette invitation est pour " + inv.email);

        await admin.from("workspace_members").upsert(
          {
            workspace_id: inv.workspace_id,
            user_id: user.id,
            role: inv.role,
            status: "active",
            invited_by: inv.invited_by,
          },
          { onConflict: "workspace_id,user_id" }
        );

        await admin
          .from("workspace_invitations")
          .update({ status: "accepted" })
          .eq("id", inv.id);

        await admin
          .rpc("create_notification", {
            p_user_id: inv.invited_by,
            p_type: "system",
            p_title: "Invitation acceptée",
            p_message: `${currentUser?.email} a rejoint ${(inv.workspaces as any)?.name}`,
            p_link: "/app/workspace",
          })
          .catch(() => {});

        result = {
          success: true,
          workspace_id: inv.workspace_id,
          workspace_name: (inv.workspaces as any)?.name,
        };
        break;
      }

      case "remove_member": {
        const role = await admin.rpc("get_user_workspace_role", {
          p_user_id: user.id,
          p_workspace_id: workspaceId,
        });
        if (!["owner", "admin"].includes(role.data))
          throw new Error("Permission refusée");
        if (payload.userId === user.id)
          throw new Error("Impossible de se retirer soi-même");

        await admin
          .from("workspace_members")
          .update({ status: "inactive" })
          .eq("workspace_id", workspaceId)
          .eq("user_id", payload.userId);

        result = { success: true };
        break;
      }

      case "change_member_role": {
        const role = await admin.rpc("get_user_workspace_role", {
          p_user_id: user.id,
          p_workspace_id: workspaceId,
        });
        if (role.data !== "owner")
          throw new Error("Seul le owner peut changer les rôles");

        await admin
          .from("workspace_members")
          .update({ role: payload.newRole })
          .eq("workspace_id", workspaceId)
          .eq("user_id", payload.userId);

        result = { success: true };
        break;
      }

      case "share_meeting": {
        const isMember = await admin.rpc("is_workspace_member", {
          p_user_id: user.id,
          p_workspace_id: workspaceId,
        });
        if (!isMember.data) throw new Error("Non membre du workspace");

        const { error } = await admin.from("shared_meetings").upsert(
          {
            meeting_id: payload.meetingId,
            workspace_id: workspaceId,
            shared_by: user.id,
            permissions: payload.permissions || "view",
          },
          { onConflict: "meeting_id,workspace_id" }
        );

        if (error) throw error;

        const { data: wsMembers } = await admin
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", workspaceId)
          .eq("status", "active")
          .neq("user_id", user.id);

        const { data: meeting } = await admin
          .from("meetings")
          .select("title")
          .eq("id", payload.meetingId)
          .single();

        for (const member of wsMembers || []) {
          await admin
            .rpc("create_notification", {
              p_user_id: member.user_id,
              p_type: "system",
              p_title: "Nouvelle réunion partagée",
              p_message: `"${meeting?.title}" a été partagée avec l'équipe`,
              p_link: "/app/workspace",
            })
            .catch(() => {});
        }

        result = { success: true };
        break;
      }

      case "update_workspace": {
        const role = await admin.rpc("get_user_workspace_role", {
          p_user_id: user.id,
          p_workspace_id: workspaceId,
        });
        if (!["owner", "admin"].includes(role.data))
          throw new Error("Permission refusée");

        const { error } = await admin
          .from("workspaces")
          .update({
            name: payload.name,
            description: payload.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workspaceId);

        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
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
