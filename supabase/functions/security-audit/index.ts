import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
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

  const { data: role } = user
    ? await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
    : { data: null };

  if (!role) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action } = await req.json().catch(() => ({ action: "full_audit" }));
    let result: any = {};

    // Security events
    if (action === "full_audit" || action === "security_events") {
      const { data: events } = await admin
        .from("security_events")
        .select("event_type, severity, ip_address, created_at, details")
        .order("created_at", { ascending: false })
        .limit(50);

      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      (events || []).forEach((e: any) => {
        byType[e.event_type] = (byType[e.event_type] || 0) + 1;
        bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
      });

      result.security_events = {
        total: events?.length || 0,
        by_type: byType,
        by_severity: bySeverity,
        recent: (events || []).slice(0, 10),
      };
    }

    // Blocked IPs
    if (action === "full_audit" || action === "blocked_ips") {
      const { data: blocked } = await admin
        .from("blocked_ips")
        .select("*")
        .order("created_at", { ascending: false });

      result.blocked_ips = {
        total: blocked?.length || 0,
        active: (blocked || []).filter((b: any) =>
          !b.blocked_until || new Date(b.blocked_until) > new Date()
        ).length,
        list: blocked || [],
      };
    }

    // Secrets check
    if (action === "full_audit" || action === "secrets_check") {
      const secrets = [
        "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
        "LOVABLE_API_KEY", "RESEND_API_KEY",
        "STRIPE_SECRET_KEY", "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER",
      ];

      const secretsStatus = secrets.map(s => ({
        name: s,
        configured: !!Deno.env.get(s),
      }));

      const missing = secretsStatus.filter(s => !s.configured).map(s => s.name);

      result.secrets_check = {
        total: secrets.length,
        configured: secretsStatus.filter(s => s.configured).length,
        missing,
        status: missing.length === 0 ? "ok" : "warning",
      };
    }

    // RLS check
    if (action === "full_audit" || action === "rls_check") {
      const { data: noRls } = await admin.rpc("check_rls_status");
      result.rls_check = {
        tables_without_rls: noRls || [],
        status: (noRls || []).length === 0 ? "ok" : "warning",
      };
    }

    // Rate limits
    if (action === "full_audit" || action === "rate_limits") {
      const { data: rules } = await admin.from("rate_limit_rules").select("*").eq("is_active", true);
      result.rate_limits = { rules: rules || [], count: rules?.length || 0 };
    }

    // Auth check
    if (action === "full_audit" || action === "auth_check") {
      const { data: admins } = await admin.from("user_roles").select("user_id, role").eq("role", "admin");
      const { data: authFailures } = await admin
        .from("security_events")
        .select("ip_address, created_at")
        .eq("event_type", "auth_failure")
        .gte("created_at", new Date(Date.now() - 86400000).toISOString());

      result.auth_check = {
        admin_count: admins?.length || 0,
        auth_failures_24h: authFailures?.length || 0,
        status: (admins?.length || 0) <= 3 ? "ok" : "warning",
      };
    }

    // Security score
    if (action === "full_audit") {
      const checks = [
        result.secrets_check?.status === "ok",
        result.rls_check?.status === "ok",
        result.auth_check?.status === "ok",
        (result.security_events?.by_severity?.critical || 0) === 0,
        (result.blocked_ips?.total || 0) < 100,
      ];
      const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

      result.security_score = {
        score,
        grade: score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F",
        status: score >= 80 ? "ok" : score >= 60 ? "warning" : "critical",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
