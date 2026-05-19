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
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  const authHeader = req.headers.get("authorization");
  if (!authHeader)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const { data: roleData } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData)
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { section } = await req.json().catch(() => ({ section: "overview" }));
    let result: any = {};

    if (section === "overview") {
      const [
        { data: mrr },
        { data: churn },
        { data: funnel },
        { data: ltv },
        { data: snapshots },
        { data: topUsers },
      ] = await Promise.all([
        admin.from("mrr_by_plan").select("*"),
        admin.from("monthly_churn").select("*").single(),
        admin.from("conversion_funnel").select("*").single(),
        admin.from("customer_ltv").select("*"),
        admin.from("ceo_metrics_snapshots")
          .select("*")
          .order("snapshot_date", { ascending: false })
          .order("snapshot_hour", { ascending: false })
          .limit(30),
        admin.from("top_engaged_users").select("*"),
      ]);

      const totalMrr = (mrr || []).reduce(
        (s: number, p: any) => s + (parseFloat(p.mrr_euros) || 0), 0
      );

      const latest = snapshots?.[0];
      const yesterday = snapshots?.find(
        (s: any) =>
          s.snapshot_date ===
          new Date(Date.now() - 86400000).toISOString().split("T")[0]
      );

      result = {
        mrr: {
          total: totalMrr,
          arr: totalMrr * 12,
          by_plan: mrr || [],
          trend_vs_yesterday: yesterday ? totalMrr - (parseFloat(yesterday.mrr_euros) || 0) : 0,
        },
        customers: {
          total: latest?.total_customers || 0,
          free: latest?.free_users || 0,
          starter: latest?.starter_users || 0,
          pro: latest?.pro_users || 0,
          new_mtd: funnel?.new_signups_mtd || 0,
          converted_mtd: funnel?.converted_to_paid_mtd || 0,
        },
        engagement: {
          dau: latest?.dau || 0,
          mau: latest?.mau || 0,
          meetings_today: latest?.meetings_created || 0,
          completed_today: latest?.meetings_completed || 0,
          dau_mau_ratio: latest?.mau > 0 ? Math.round((latest.dau / latest.mau) * 100) : 0,
        },
        conversion: {
          free_to_paid:
            funnel?.new_signups_mtd > 0
              ? Math.round((funnel.converted_to_paid_mtd / funnel.new_signups_mtd) * 100)
              : 0,
          activated: funnel?.activated_mtd || 0,
        },
        churn: {
          rate: parseFloat(churn?.churn_rate_percent) || 0,
          churned: churn?.churned_customers || 0,
        },
        ltv: ltv || [],
        top_users: topUsers || [],
      };
    } else if (section === "revenue") {
      if (!stripeKey) {
        result = { error: "STRIPE_SECRET_KEY manquant", fallback: "Données depuis DB uniquement" };
      } else {
        const stripeRes = await fetch(
          "https://api.stripe.com/v1/subscriptions?status=active&limit=100",
          { headers: { Authorization: `Bearer ${stripeKey}` } }
        );
        const stripeData = await stripeRes.json();
        const subs = stripeData.data || [];

        const stripeMrr = subs.reduce(
          (s: number, sub: any) => s + (sub.items?.data?.[0]?.price?.unit_amount || 0) / 100,
          0
        );

        const monthStart = Math.floor(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000
        );
        const invoicesRes = await fetch(
          `https://api.stripe.com/v1/invoices?status=paid&limit=100&created[gte]=${monthStart}`,
          { headers: { Authorization: `Bearer ${stripeKey}` } }
        );
        const invData = await invoicesRes.json();
        const mtdRevenue = (invData.data || []).reduce(
          (s: number, inv: any) => s + (inv.total || 0) / 100,
          0
        );

        result = {
          mrr_stripe: stripeMrr,
          arr_stripe: stripeMrr * 12,
          mtd_revenue: mtdRevenue,
          active_subscriptions: subs.length,
          invoices_count: invData.data?.length || 0,
        };
      }
    } else if (section === "trends") {
      const { data: history } = await admin
        .from("ceo_metrics_snapshots")
        .select(
          "snapshot_date,snapshot_hour,mrr_euros,total_customers,dau,mau,meetings_created,meetings_completed"
        )
        .gte("snapshot_date", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0])
        .eq("snapshot_hour", 12)
        .order("snapshot_date");

      result = { history: history || [] };
    } else if (section === "engagement") {
      const { data: daily } = await admin.from("daily_engagement").select("*");

      const { data: byType } = await admin
        .from("meetings")
        .select("meeting_type, status")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const typeCount = (byType || []).reduce((acc: any, m: any) => {
        acc[m.meeting_type] = (acc[m.meeting_type] || 0) + 1;
        return acc;
      }, {});

      const { data: topSkills } = await admin
        .from("openclaw_skills")
        .select("name, icon, usage_count")
        .order("usage_count", { ascending: false })
        .limit(5);

      result = {
        daily_engagement: daily || [],
        meetings_by_type: typeCount,
        top_openclaw_skills: topSkills || [],
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
