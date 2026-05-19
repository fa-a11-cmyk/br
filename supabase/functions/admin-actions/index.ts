import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Unauthorized");
    const callerUserId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", callerUserId).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Forbidden: not an admin");

    const { action, userId, payload } = await req.json();

    if (!action) throw new Error("Missing action");

    // Helper to log admin actions
    const logAction = async (level: string, message: string, metadata?: any) => {
      try {
        await admin.from("app_logs").insert({
          level,
          source: "admin-actions",
          message,
          metadata: metadata || {},
          user_id: callerUserId,
        });
      } catch {}
    };

    let message = "";

    switch (action) {
      case "suspend_user": {
        if (!userId) throw new Error("Missing userId");
        if (userId === callerUserId) throw new Error("Cannot suspend yourself");
        const { error: updErr } = await admin.from("profiles").update({ is_suspended: true }).eq("user_id", userId);
        if (updErr) throw new Error("Failed to suspend: " + updErr.message);
        await admin.auth.admin.signOut(userId);
        await logAction("warn", `Suspended user ${userId}`, { action, targetUserId: userId });
        message = "User suspended successfully";
        break;
      }

      case "unsuspend_user": {
        if (!userId) throw new Error("Missing userId");
        const { error: updErr } = await admin.from("profiles").update({ is_suspended: false }).eq("user_id", userId);
        if (updErr) throw new Error("Failed to unsuspend: " + updErr.message);
        await logAction("info", `Unsuspended user ${userId}`, { action, targetUserId: userId });
        message = "User unsuspended successfully";
        break;
      }

      case "change_plan": {
        if (!userId) throw new Error("Missing userId");
        const newPlan = payload?.newPlan;
        if (!["free", "starter", "pro"].includes(newPlan)) {
          throw new Error("Invalid plan: " + newPlan);
        }
        const { data: existingSub } = await admin.from("subscriptions").select("id").eq("user_id", userId).maybeSingle();
        if (existingSub) {
          const { error: updErr } = await admin.from("subscriptions").update({ plan: newPlan, status: "active", updated_at: new Date().toISOString() }).eq("user_id", userId);
          if (updErr) throw new Error("Failed to change plan: " + updErr.message);
        } else {
          const { error: insErr } = await admin.from("subscriptions").insert({ user_id: userId, plan: newPlan, status: "active" });
          if (insErr) throw new Error("Failed to create subscription: " + insErr.message);
        }
        await logAction("info", `Changed plan to ${newPlan} for user ${userId}`, { action, targetUserId: userId, newPlan });
        message = `Plan changed to ${newPlan}`;
        break;
      }

      case "assign_admin_role": {
        if (!userId) throw new Error("Missing userId");
        const { error: insErr } = await admin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        if (insErr) throw new Error("Failed to assign admin: " + insErr.message);
        await logAction("warn", `Assigned admin role to ${userId}`, { action, targetUserId: userId });
        message = "Admin role assigned";
        break;
      }

      case "remove_admin_role": {
        if (!userId) throw new Error("Missing userId");
        if (userId === callerUserId) throw new Error("Cannot remove your own admin role");
        const { error: delErr } = await admin.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (delErr) throw new Error("Failed to remove admin: " + delErr.message);
        await logAction("warn", `Removed admin role from ${userId}`, { action, targetUserId: userId });
        message = "Admin role removed";
        break;
      }

      case "delete_user": {
        if (!userId) throw new Error("Missing userId");
        if (userId === callerUserId) throw new Error("Cannot delete yourself");
        await admin.from("user_roles").delete().eq("user_id", userId);
        await admin.from("subscriptions").delete().eq("user_id", userId);
        await admin.from("profiles").delete().eq("user_id", userId);
        const { error: authErr } = await admin.auth.admin.deleteUser(userId);
        if (authErr) throw new Error("Failed to delete auth user: " + authErr.message);
        await logAction("critical", `Deleted user ${userId} permanently`, { action, targetUserId: userId });
        message = "User deleted permanently";
        break;
      }

      case "retry_meeting": {
        const meetingId = payload?.meetingId;
        if (!meetingId) throw new Error("Missing meetingId");
        const { error: updErr } = await admin.from("meetings").update({ status: "pending", updated_at: new Date().toISOString() }).eq("id", meetingId);
        if (updErr) throw new Error("Failed to retry meeting: " + updErr.message);
        await logAction("info", `Retried meeting ${meetingId}`, { action, meetingId });
        message = "Meeting queued for retry";
        break;
      }

      case "start_impersonation": {
        const targetUserId = payload?.targetUserId;
        const targetEmail = payload?.targetEmail;
        if (!targetUserId || !targetEmail) throw new Error("Missing targetUserId or targetEmail");

        // Check target is not admin
        const { data: targetRole } = await admin.from("user_roles").select("role").eq("user_id", targetUserId).eq("role", "admin").maybeSingle();
        if (targetRole) throw new Error("Cannot impersonate an admin user");

        // Generate magic link
        const { data: sessionData, error: linkErr } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email: targetEmail,
          options: { redirectTo: "/app/dashboard?impersonating=true" }
        });
        if (linkErr) throw new Error("Failed to generate link: " + linkErr.message);

        // Create session
        const { data: impSession, error: sessErr } = await admin.from("impersonation_sessions").insert({
          admin_id: callerUserId,
          target_user_id: targetUserId,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }).select().single();
        if (sessErr) throw new Error("Failed to create session: " + sessErr.message);

        await logAction("warn", `Started impersonation of user ${targetUserId}`, {
          action, adminId: callerUserId, targetUserId, sessionId: impSession.id,
        });

        return new Response(JSON.stringify({
          success: true,
          actionLink: sessionData.properties?.action_link,
          sessionId: impSession.id,
          expiresAt: impSession.expires_at,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "end_impersonation": {
        const sessionId = payload?.sessionId;
        if (!sessionId) throw new Error("Missing sessionId");
        await admin.from("impersonation_sessions").update({ is_active: false, ended_at: new Date().toISOString() }).eq("id", sessionId);
        await logAction("info", `Ended impersonation session ${sessionId}`, { action, sessionId });
        message = "Impersonation session ended";
        break;
      }

      case "purge_logs": {
        await admin.rpc("purge_old_logs");
        await logAction("info", "Purged logs older than 30 days", { action });
        message = "Old logs purged";
        break;
      }

      case "update_config": {
        const configKey = payload?.key;
        const configValue = payload?.value;
        if (!configKey || configValue === undefined) throw new Error("Missing key or value");
        const { error: cfgErr } = await admin.from("admin_config").upsert({
          config_key: configKey,
          config_value: configValue,
          updated_at: new Date().toISOString(),
          updated_by: callerUserId,
        }, { onConflict: "config_key" });
        if (cfgErr) throw new Error("Failed to update config: " + cfgErr.message);
        await logAction("info", `Updated config: ${configKey}`, { action, configKey });
        message = `Config ${configKey} updated`;
        break;
      }

      case "create_template": {
        if (!payload?.name) throw new Error("Missing template name");
        const { data: tpl, error: tplErr } = await admin
          .from("email_templates")
          .insert({
            user_id: callerUserId,
            name: payload.name,
            category: payload.category || "general",
            html_content: payload.html_content || "",
            css_content: payload.css_content || "",
            gjsdata: payload.gjsdata || null,
            preview_text: payload.preview_text || null,
            is_global: payload.is_global ?? false,
            usage_count: 0,
          })
          .select()
          .single();
        if (tplErr) throw new Error("Failed to create template: " + tplErr.message);
        await logAction("info", `Template created: "${payload.name}"`, { templateId: tpl.id, isGlobal: payload.is_global });
        return new Response(JSON.stringify({ success: true, template: tpl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_template": {
        if (!payload?.templateId) throw new Error("Missing templateId");
        const { error: updErr } = await admin
          .from("email_templates")
          .update({
            name: payload.name,
            category: payload.category,
            html_content: payload.html_content,
            css_content: payload.css_content || "",
            gjsdata: payload.gjsdata || null,
            preview_text: payload.preview_text || null,
            is_global: payload.is_global ?? false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.templateId);
        if (updErr) throw new Error("Failed to update template: " + updErr.message);
        await logAction("info", `Template updated: "${payload.name}"`, { templateId: payload.templateId });
        message = "Template updated";
        break;
      }

      case "delete_template": {
        if (!payload?.templateId) throw new Error("Missing templateId");
        const { data: tpl } = await admin.from("email_templates").select("name").eq("id", payload.templateId).single();
        const { error: delErr } = await admin.from("email_templates").delete().eq("id", payload.templateId);
        if (delErr) throw new Error("Failed to delete template: " + delErr.message);
        await logAction("warn", `Template deleted: "${tpl?.name}"`, { templateId: payload.templateId });
        message = "Template deleted";
        break;
      }

      case "toggle_global_template": {
        if (!payload?.templateId) throw new Error("Missing templateId");
        const { error: togErr } = await admin
          .from("email_templates")
          .update({ is_global: payload.isGlobal, updated_at: new Date().toISOString() })
          .eq("id", payload.templateId);
        if (togErr) throw new Error("Failed to toggle: " + togErr.message);
        await logAction("info", `Template global toggled: ${payload.isGlobal}`, { templateId: payload.templateId });
        message = payload.isGlobal ? "Template set to global" : "Template set to personal";
        break;
      }

      case "approve_commission": {
        const commissionId = payload?.commissionId;
        if (!commissionId) throw new Error("Missing commissionId");
        await admin.from("affiliate_commissions").update({ status: "approved" }).eq("id", commissionId);
        await logAction("info", `Approved commission ${commissionId}`, { action, commissionId });
        message = "Commission approved";
        break;
      }

      case "process_payout": {
        const { affiliateId, commissionIds, totalAmount, method, currentPaid } = payload || {};
        if (!affiliateId || !commissionIds?.length) throw new Error("Missing payout data");

        const { data: payout } = await admin.from("affiliate_payouts").insert({
          affiliate_id: affiliateId,
          amount_euros: totalAmount,
          commission_ids: commissionIds,
          status: "processing",
          payout_method: method || "bank_transfer",
          processed_by: callerUserId,
          processed_at: new Date().toISOString(),
        }).select().single();

        await admin.from("affiliate_commissions").update({
          status: "paid",
          paid_at: new Date().toISOString(),
        }).in("id", commissionIds);

        await admin.from("affiliates").update({
          total_paid_euros: (currentPaid || 0) + totalAmount,
          updated_at: new Date().toISOString(),
        }).eq("id", affiliateId);

        await logAction("info", `Processed payout of ${totalAmount}€ for affiliate ${affiliateId}`, { action, affiliateId, totalAmount });
        return new Response(JSON.stringify({ success: true, payout }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error("Unknown action: " + action);
    }

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const status = msg.includes("Unauthorized") ? 401 : msg.includes("Forbidden") ? 403 : msg.includes("Cannot") ? 400 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
