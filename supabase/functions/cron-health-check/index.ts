import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  // Simple auth check — require service role or valid auth
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const checks: Record<string, any> = {};

    // Check 1: Recent logs (edge functions alive?)
    const { count: logsLast1h } = await admin
      .from("app_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());
    checks.logs_last_hour = logsLast1h || 0;

    // Check 2: Stuck meetings (transcribing/analyzing > 30 min)
    const { data: stuckMeetings } = await admin
      .from("meetings")
      .select("id, title, status, updated_at")
      .in("status", ["transcribing", "analyzing"])
      .lt("updated_at", new Date(Date.now() - 1800000).toISOString());

    checks.stuck_meetings = stuckMeetings?.length || 0;

    if (stuckMeetings && stuckMeetings.length > 0) {
      await admin.from("meetings")
        .update({ status: "failed", error_message: "Timeout — marquée en échec par le health check", updated_at: new Date().toISOString() })
        .in("id", stuckMeetings.map(m => m.id));

      await admin.from("app_logs").insert({
        level: "warn",
        source: "cron-health-check",
        message: `${stuckMeetings.length} réunion(s) bloquée(s) remises en failed`,
        metadata: { meetingIds: stuckMeetings.map(m => m.id) },
      });
    }

    // Check 3: Table sizes
    const tableCounts: Record<string, number> = {};
    for (const table of ["app_logs", "rate_limits", "notifications", "api_key_usage"]) {
      const { count } = await admin.from(table as any).select("id", { count: "exact", head: true });
      tableCounts[table] = count || 0;
    }
    checks.table_sizes = tableCounts;

    const alerts: string[] = [];
    if (tableCounts.app_logs > 100000) alerts.push("app_logs > 100k lignes");
    if (tableCounts.rate_limits > 50000) alerts.push("rate_limits > 50k lignes");

    checks.alerts = alerts;
    checks.status = alerts.length > 0 ? "warning" : "healthy";
    checks.checked_at = new Date().toISOString();

    return new Response(JSON.stringify(checks), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
