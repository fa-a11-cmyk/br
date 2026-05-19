import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(body: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

async function checkRateLimit(
  admin: any,
  identifier: string,
  plan: string,
  limits: { per_hour: number; per_day: number }
): Promise<{ allowed: boolean; reason?: string; remaining: number; resetAt: string }> {
  const now = Date.now();
  const hourAgo = new Date(now - 3600000).toISOString();
  const dayAgo = new Date(now - 86400000).toISOString();

  const { count: hourCount } = await admin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("function_name", "api-gateway")
    .gte("window_start", hourAgo);

  if ((hourCount || 0) >= limits.per_hour) {
    return {
      allowed: false,
      reason: `Rate limit horaire atteint (${limits.per_hour} req/h pour le plan ${plan})`,
      remaining: 0,
      resetAt: new Date(now + 3600000).toISOString(),
    };
  }

  const { count: dayCount } = await admin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("function_name", "api-gateway")
    .gte("window_start", dayAgo);

  if ((dayCount || 0) >= limits.per_day) {
    return {
      allowed: false,
      reason: `Rate limit journalier atteint (${limits.per_day} req/j pour le plan ${plan})`,
      remaining: 0,
      resetAt: new Date(now + 86400000).toISOString(),
    };
  }

  await admin.from("rate_limits").insert({
    identifier,
    function_name: "api-gateway",
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  return {
    allowed: true,
    remaining: Math.min(
      limits.per_hour - (hourCount || 0) - 1,
      limits.per_day - (dayCount || 0) - 1
    ),
    resetAt: new Date(now + 3600000).toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let userId: string | null = null;
  let apiKeyId: string | null = null;
  let userPlan = "free";

  try {
    const apiKey = req.headers.get("x-api-key");
    const authHeader = req.headers.get("authorization");

    if (apiKey) {
      const keyHash = await hashKey(apiKey);
      const { data: keyRow, error: keyErr } = await admin
        .from("api_keys")
        .select("user_id, id")
        .eq("key_hash", keyHash)
        .maybeSingle();

      if (keyErr || !keyRow) {
        return jsonResponse({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
      }

      userId = keyRow.user_id;
      apiKeyId = keyRow.id;
      admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then(() => {});
    } else if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      });
      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        return jsonResponse({ error: "Invalid or expired token", code: "INVALID_TOKEN" }, 401);
      }
      userId = user.id;
    } else {
      return jsonResponse({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
        hint: "Use X-Api-Key header or Authorization: Bearer <jwt>.",
      }, 401);
    }

    // Get user plan
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    userPlan = sub?.plan || "free";

    // Rate limiting (only for API key auth)
    let rateLimitResult = { allowed: true, remaining: 999, resetAt: new Date(Date.now() + 3600000).toISOString() };

    if (apiKeyId) {
      const { data: planLimits } = await admin
        .from("plan_limits")
        .select("api_calls_per_hour, api_calls_per_day")
        .eq("plan", userPlan)
        .single();

      rateLimitResult = await checkRateLimit(
        admin,
        `user:${userId}`,
        userPlan,
        {
          per_hour: (planLimits as any)?.api_calls_per_hour || 60,
          per_day: (planLimits as any)?.api_calls_per_day || 1000,
        }
      );

      if (!rateLimitResult.allowed) {
        return jsonResponse(
          { error: rateLimitResult.reason, code: "RATE_LIMIT_EXCEEDED", retry_after: rateLimitResult.resetAt },
          429,
          {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt,
            "Retry-After": "3600",
          }
        );
      }
    }

    // Parse request
    const body = await req.json().catch(() => ({}));
    const { endpoint, method: reqMethod, params } = body as {
      endpoint?: string;
      method?: string;
      params?: Record<string, any>;
    };

    if (!endpoint) {
      return jsonResponse({
        error: "Missing endpoint",
        code: "MISSING_ENDPOINT",
        available_endpoints: [
          "GET /v1/meetings",
          "GET /v1/meetings/:id",
          "GET /v1/tasks",
          "GET /v1/reports/:meetingId",
          "GET /v1/decisions/:meetingId",
          "GET /v1/contacts/:meetingId",
        ],
        docs: "https://rapidomeet.io/developers",
      }, 400);
    }

    let result: any;

    if (endpoint === "/v1/meetings" && (!reqMethod || reqMethod === "GET")) {
      const limit = Math.min(Number(params?.limit) || 50, 100);
      const status = params?.status;
      let query = admin.from("meetings")
        .select("id, title, status, meeting_type, duration_seconds, summary, sentiment_score, language, created_at, completed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      result = { meetings: data || [], count: data?.length || 0 };
    }
    else if (endpoint.startsWith("/v1/meetings/") && (!reqMethod || reqMethod === "GET")) {
      const meetingId = endpoint.replace("/v1/meetings/", "");
      if (!meetingId) return jsonResponse({ error: "Missing meeting ID" }, 400);
      const { data, error } = await admin.from("meetings")
        .select("*")
        .eq("id", meetingId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return jsonResponse({ error: "Meeting not found" }, 404);
      result = { meeting: data };
    }
    else if (endpoint === "/v1/tasks" && (!reqMethod || reqMethod === "GET")) {
      const limit = Math.min(Number(params?.limit) || 100, 200);
      const status = params?.status;
      const meetingId = params?.meeting_id;
      let query = admin.from("extracted_tasks")
        .select("id, title, priority, status, assignee, deadline, meeting_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (status) query = query.eq("status", status);
      if (meetingId) query = query.eq("meeting_id", meetingId);
      const { data, error } = await query;
      if (error) throw error;
      result = { tasks: data || [], count: data?.length || 0 };
    }
    else if (endpoint.startsWith("/v1/reports/") && (!reqMethod || reqMethod === "GET")) {
      const meetingId = endpoint.replace("/v1/reports/", "");
      if (!meetingId) return jsonResponse({ error: "Missing meeting ID" }, 400);
      const { data, error } = await admin.from("reports")
        .select("id, title, content_json, report_type, created_at")
        .eq("meeting_id", meetingId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      result = { report: data };
    }
    else if (endpoint.startsWith("/v1/decisions/") && (!reqMethod || reqMethod === "GET")) {
      const meetingId = endpoint.replace("/v1/decisions/", "");
      if (!meetingId) return jsonResponse({ error: "Missing meeting ID" }, 400);
      const { data, error } = await admin.from("extracted_decisions")
        .select("id, content, source_timestamp, created_at")
        .eq("meeting_id", meetingId)
        .eq("user_id", userId);
      if (error) throw error;
      result = { decisions: data || [] };
    }
    else if (endpoint.startsWith("/v1/contacts/") && (!reqMethod || reqMethod === "GET")) {
      const meetingId = endpoint.replace("/v1/contacts/", "");
      if (!meetingId) return jsonResponse({ error: "Missing meeting ID" }, 400);
      const { data, error } = await admin.from("detected_contacts")
        .select("id, name, company, email, phone, score, interest_signals, created_at")
        .eq("meeting_id", meetingId)
        .eq("user_id", userId);
      if (error) throw error;
      result = { contacts: data || [] };
    }
    else {
      return jsonResponse({ error: `Unknown endpoint: ${endpoint}`, code: "NOT_FOUND" }, 404);
    }

    const duration = Date.now() - startTime;

    // Log API key usage
    if (apiKeyId) {
      admin.from("api_key_usage").insert({
        api_key_id: apiKeyId,
        user_id: userId,
        endpoint,
        response_status: 200,
        duration_ms: duration,
      }).then(() => {});
    }

    return jsonResponse(
      {
        ...result,
        _meta: {
          duration_ms: duration,
          plan: userPlan,
          rate_limit: {
            remaining: rateLimitResult.remaining,
            reset_at: rateLimitResult.resetAt,
          },
        },
      },
      200,
      {
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": rateLimitResult.resetAt,
        "X-Response-Time": `${duration}ms`,
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (apiKeyId && userId) {
      admin.from("api_key_usage").insert({
        api_key_id: apiKeyId,
        user_id: userId!,
        endpoint: "unknown",
        response_status: 500,
        duration_ms: duration,
      }).then(() => {});
    }

    console.error("api-gateway error:", error);
    return jsonResponse({ error: error.message || String(error), code: "INTERNAL_ERROR" }, 500);
  }
});
