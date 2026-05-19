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
    const userId = claimsData.claims.sub;

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Forbidden: not an admin");

    const body = await req.json();
    const { section } = body;

    let result: any = {};

    if (section === "stats") {
      const [usersRes, meetingsRes, subsRes, tasksRes] = await Promise.all([
        admin.from("profiles").select("id", { count: "exact", head: true }),
        admin.from("meetings").select("id", { count: "exact", head: true }),
        admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        admin.from("extracted_tasks").select("id", { count: "exact", head: true }),
      ]);

      // MRR from Stripe
      let mrr = 0;
      let stripeActiveCount = 0;
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          const stripeRes = await fetch(
            "https://api.stripe.com/v1/subscriptions?status=active&limit=100",
            { headers: { Authorization: `Bearer ${stripeKey}` } }
          );
          const stripeData = await stripeRes.json();
          stripeActiveCount = stripeData.data?.length || 0;
          mrr = (stripeData.data || []).reduce((sum: number, sub: any) => {
            return sum + (sub.items?.data?.[0]?.price?.unit_amount || 0);
          }, 0) / 100;

          // Save today's snapshot
          const today = new Date().toISOString().split("T")[0];
          await admin.from("mrr_snapshots").upsert({
            snapshot_date: today,
            mrr_euros: mrr,
            total_active: stripeActiveCount,
          }, { onConflict: "snapshot_date" });
        }
      } catch (e) {
        console.error("Stripe MRR fetch error:", e);
      }

      // MRR history
      const { data: snapshots } = await admin
        .from("mrr_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: true })
        .limit(12);

      // Conversion funnel
      const [freeCount, starterCount, proCount] = await Promise.all([
        admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan", "free"),
        admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan", "starter"),
        admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan", "pro"),
      ]);

      // New users this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: newThisWeek } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      // Recent meetings
      const { data: recentMeetings } = await admin
        .from("meetings")
        .select("id, title, user_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      result = {
        totalUsers: usersRes.count || 0,
        totalMeetings: meetingsRes.count || 0,
        activeSubscriptions: subsRes.count || 0,
        totalTasks: tasksRes.count || 0,
        mrr,
        mrrHistory: snapshots || [],
        conversion: {
          free: freeCount.count || 0,
          starter: starterCount.count || 0,
          pro: proCount.count || 0,
        },
        newThisWeek: newThisWeek || 0,
        recentMeetings: recentMeetings || [],
      };
    } else if (section === "users") {
      const { data } = await admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
      const userIds = (data || []).map((p: any) => p.user_id);
      const { data: subs } = await admin.from("subscriptions").select("*").in("user_id", userIds);
      const { data: roles } = await admin.from("user_roles").select("*");
      result = { profiles: data || [], subscriptions: subs || [], roles: roles || [] };
    } else if (section === "meetings") {
      const { data } = await admin.from("meetings").select("*").order("created_at", { ascending: false }).limit(200);
      result = { meetings: data || [] };
    } else if (section === "subscriptions") {
      const { data } = await admin.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(100);
      result = { subscriptions: data || [] };
    } else if (section === "webhooks") {
      const { data } = await admin.from("webhooks").select("*").order("created_at", { ascending: false }).limit(100);
      result = { webhooks: data || [] };
    } else if (section === "rate_limits") {
      const { data } = await admin.from("rate_limits").select("*").order("window_start", { ascending: false }).limit(100);
      result = { rateLimits: data || [] };
    } else if (section === "templates") {
      const { data: templates } = await admin
        .from("email_templates")
        .select("*")
        .order("is_global", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(100);

      const { data: variables } = await admin
        .from("template_variables")
        .select("*")
        .order("category");

      result = { templates: templates || [], variables: variables || [] };
    } else if (section === "roles") {
      const { data } = await admin.from("user_roles").select("*");
      result = { roles: data || [] };
    } else if (section === "failed_meetings") {
      const { data } = await admin
        .from("meetings")
        .select("*")
        .in("status", ["failed", "partial"])
        .order("created_at", { ascending: false })
        .limit(50);
      // Get profile info for these meetings
      const userIds = [...new Set((data || []).map((m: any) => m.user_id))];
      const { data: profiles } = await admin.from("profiles").select("user_id, first_name, last_name, company").in("user_id", userIds);
      result = { failedMeetings: data || [], profiles: profiles || [] };
    } else if (section === "logs") {
      const level = body.level || null;
      let query = admin
        .from("app_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (level) query = query.eq("level", level);
      const { data } = await query;
      result = { logs: data || [] };
    } else if (section === "health") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      const deepgramKey = Deno.env.get("DEEPGRAM_API_KEY");

      const healthChecks: Promise<{ name: string; ok: boolean; status: number; configured: boolean; message?: string }>[] = [
        // Database — always checked
        admin.from("profiles").select("id", { count: "exact", head: true })
          .then(r => ({ name: "Database", ok: !r.error, status: r.error ? 500 : 200, configured: true })),
        // Stripe — conditional
        stripeKey
          ? fetch("https://api.stripe.com/v1/balance", {
              headers: { Authorization: `Bearer ${stripeKey}` }
            }).then(r => ({ name: "Stripe", ok: r.ok, status: r.status, configured: true }))
          : Promise.resolve({ name: "Stripe", ok: false, status: 0, configured: false, message: "STRIPE_SECRET_KEY non configuré" }),
        // Deepgram — conditional
        deepgramKey
          ? fetch("https://api.deepgram.com/v1/projects", {
              headers: { Authorization: `Token ${deepgramKey}` }
            }).then(r => ({ name: "Deepgram", ok: r.ok, status: r.status, configured: true }))
          : Promise.resolve({ name: "Deepgram", ok: false, status: 0, configured: false, message: "DEEPGRAM_API_KEY non configuré" }),
        // Lovable AI
        Promise.resolve({ name: "Lovable AI", ok: !!Deno.env.get("LOVABLE_API_KEY"), status: Deno.env.get("LOVABLE_API_KEY") ? 200 : 0, configured: !!Deno.env.get("LOVABLE_API_KEY") }),
      ];

      const checks = await Promise.allSettled(healthChecks);

      result = {
        health: checks.map((c) =>
          c.status === "fulfilled"
            ? c.value
            : { name: "Unknown", ok: false, status: 0, configured: false }
        ),
        checkedAt: new Date().toISOString(),
      };
    } else if (section === "impersonation_sessions") {
      const { data } = await admin
        .from("impersonation_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      result = { sessions: data || [] };
    } else if (section === "env_check") {
      const envVars = [
        "STRIPE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY",
        "LOVABLE_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"
      ];
      result = {
        envCheck: envVars.map(key => ({
          key,
          configured: !!Deno.env.get(key),
        }))
      };
    } else if (section === "email_logs") {
      const { data } = await admin
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(100);
      result = { emailLogs: data || [] };
    } else if (section === "affiliates") {
      const { data: leaderboard } = await admin.from("affiliate_leaderboard").select("*").limit(50);
      const { count: totalAffiliates } = await admin.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "active");
      const { data: pendingCommissions } = await admin.from("affiliate_commissions").select("*, affiliates(code)").eq("status", "pending").order("created_at", { ascending: false }).limit(50);
      const totalPending = (pendingCommissions || []).reduce((s: number, c: any) => s + parseFloat(c.amount_euros), 0);
      result = { leaderboard: leaderboard || [], totalAffiliates: totalAffiliates || 0, pendingCommissions: pendingCommissions || [], totalPendingEuros: totalPending };
    } else {
      throw new Error("Unknown section: " + section);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const status = msg.includes("Unauthorized") ? 401 : msg.includes("Forbidden") ? 403 : 400;
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
