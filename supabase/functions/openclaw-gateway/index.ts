import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function executeTool(
  name: string,
  input: any,
  userId: string,
  admin: any
): Promise<any> {
  switch (name) {
    case "get_meeting_analysis": {
      const [{ data: m }, { data: tasks }, { data: decisions }, { data: contacts }] =
        await Promise.all([
          admin.from("meetings").select("*").eq("id", input.meeting_id).eq("user_id", userId).single(),
          admin.from("extracted_tasks").select("title,priority,status,assignee,deadline").eq("meeting_id", input.meeting_id),
          admin.from("extracted_decisions").select("content").eq("meeting_id", input.meeting_id),
          admin.from("detected_contacts").select("name,company,score").eq("meeting_id", input.meeting_id),
        ]);
      if (!m) return { error: "Réunion introuvable" };
      return {
        title: m.title,
        type: m.meeting_type,
        date: new Date(m.created_at).toLocaleDateString("fr-FR"),
        duration_min: m.duration_seconds ? Math.round(m.duration_seconds / 60) : null,
        summary: m.summary,
        sentiment: m.sentiment_score,
        efficiency: m.efficiency_score,
        tasks: tasks || [],
        decisions: decisions || [],
        contacts: contacts || [],
      };
    }

    case "get_weekly_summary": {
      const days = input.days || 7;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data: meetings } = await admin
        .from("meetings")
        .select("id,title,meeting_type,summary,sentiment_score,efficiency_score,created_at")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      const { data: pending } = await admin
        .from("extracted_tasks")
        .select("title,priority")
        .eq("user_id", userId)
        .eq("status", "pending")
        .in("priority", ["critical", "high"])
        .limit(10);
      return {
        period: `${days} derniers jours`,
        count: meetings?.length || 0,
        avg_efficiency: meetings?.length
          ? Math.round(meetings.reduce((s: number, m: any) => s + (m.efficiency_score || 0), 0) / meetings.length)
          : null,
        meetings: (meetings || []).map((m: any) => ({
          title: m.title,
          type: m.meeting_type,
          date: new Date(m.created_at).toLocaleDateString("fr-FR"),
          summary: m.summary,
          efficiency: m.efficiency_score,
        })),
        critical_pending: pending || [],
      };
    }

    case "get_critical_tasks": {
      const priorities: Record<string, string[]> = {
        critical: ["critical"],
        high: ["critical", "high"],
        medium: ["critical", "high", "medium"],
        low: ["critical", "high", "medium", "low"],
      };
      const { data } = await admin
        .from("extracted_tasks")
        .select("title,priority,status,assignee,deadline,meetings(title)")
        .eq("user_id", userId)
        .in("priority", priorities[input.priority || "high"])
        .in("status", ["pending", "in_progress"])
        .order("priority")
        .limit(input.limit || 20);
      return {
        count: data?.length || 0,
        overdue: (data || []).filter((t: any) => t.deadline && new Date(t.deadline) < new Date()).length,
        tasks: (data || []).map((t: any) => ({
          title: t.title,
          priority: t.priority,
          assignee: t.assignee || "Non assigné",
          deadline: t.deadline ? new Date(t.deadline).toLocaleDateString("fr-FR") : "Aucune",
          overdue: t.deadline && new Date(t.deadline) < new Date(),
          from: (t.meetings as any)?.title,
        })),
      };
    }

    case "get_top_contacts": {
      const { data } = await admin
        .from("detected_contacts")
        .select("name,company,email,score,meetings(title,meeting_type)")
        .eq("user_id", userId)
        .gte("score", input.min_score || 70)
        .order("score", { ascending: false })
        .limit(input.limit || 10);
      return {
        count: data?.length || 0,
        contacts: (data || []).map((c: any) => ({
          name: c.name,
          company: c.company || "—",
          score: c.score,
          from_meeting: (c.meetings as any)?.title,
        })),
        top_prospect: data?.[0]?.name || null,
      };
    }

    case "get_coaching_insights": {
      const since = new Date(Date.now() - (input.period_days || 30) * 86400000).toISOString();
      const { data: meetings } = await admin
        .from("meetings")
        .select("efficiency_score,efficiency_breakdown,duration_seconds")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("created_at", since)
        .not("efficiency_score", "is", null);
      if (!meetings?.length) return { message: "Pas assez de données (min 3 réunions)" };
      const avg = Math.round(meetings.reduce((s: number, m: any) => s + (m.efficiency_score || 0), 0) / meetings.length);
      const avgDuration = Math.round(meetings.reduce((s: number, m: any) => s + (m.duration_seconds || 0), 0) / meetings.length / 60);
      const tips: string[] = [];
      if (avg < 50) tips.push("Score faible — formalisez les décisions");
      if (avgDuration > 60) tips.push(`Durée moyenne ${avgDuration}min — visez 30-45min`);
      if (avgDuration < 15) tips.push("Réunions très courtes — documentez mieux");
      if (!tips.length) tips.push("Excellent ! Continuez sur cette lancée.");
      return {
        meetings_analyzed: meetings.length,
        avg_score: avg,
        avg_duration_min: avgDuration,
        level: avg >= 75 ? "Excellent" : avg >= 50 ? "Bon" : avg >= 25 ? "Moyen" : "À améliorer",
        coaching: tips,
      };
    }

    case "track_decisions": {
      const since = new Date(Date.now() - (input.period_days || 30) * 86400000).toISOString();
      const { data: decisions } = await admin
        .from("extracted_decisions")
        .select("content,created_at,meetings(title)")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      const { data: tasks } = await admin
        .from("extracted_tasks")
        .select("status")
        .eq("user_id", userId)
        .gte("created_at", since);
      const done = (tasks || []).filter((t: any) => t.status === "done").length;
      const rate = tasks?.length ? Math.round((done / tasks.length) * 100) : 0;
      return {
        decisions_count: decisions?.length || 0,
        decisions: (decisions || []).map((d: any) => ({
          content: d.content,
          from: (d.meetings as any)?.title,
          date: new Date(d.created_at).toLocaleDateString("fr-FR"),
        })),
        task_completion_rate: rate,
        health: rate >= 70 ? "🟢 Bon" : rate >= 40 ? "🟡 Moyen" : "🔴 Insuffisant",
      };
    }

    case "trigger_n8n_workflow": {
      const url = Deno.env.get("N8N_WEBHOOK_URL");
      if (!url) return { error: "N8N_WEBHOOK_URL non configuré" };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: input.workflow_name,
          source: "openclaw",
          user_id: userId,
          timestamp: new Date().toISOString(),
          ...(input.payload || {}),
        }),
      });
      return { success: res.ok, status: res.status, workflow: input.workflow_name };
    }

    case "calendly_schedule": {
      const { data: conn } = await admin
        .from("calendly_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (!conn) {
        return { error: "Calendly non connecté", action_needed: "Connectez Calendly dans /app/configuration" };
      }

      const { sub_action } = input;

      if (sub_action === "get_upcoming") {
        const { data: events } = await admin
          .from("calendly_events")
          .select("name, start_time, end_time, invitees, location, status")
          .eq("user_id", userId)
          .eq("status", "active")
          .gte("start_time", new Date().toISOString())
          .lte("start_time", new Date(Date.now() + 7 * 86400000).toISOString())
          .order("start_time");

        return {
          upcoming_meetings: (events || []).map((e: any) => ({
            name: e.name,
            date: new Date(e.start_time).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }),
            duration: e.end_time && e.start_time ? `${Math.round((new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 60000)}min` : "?",
            invitees: (e.invitees || []).map((i: any) => i.name || i.email),
            location: e.location?.join_url ? "Vidéo" : "Présentiel",
          })),
          count: events?.length || 0,
          scheduling_url: conn.scheduling_url,
        };
      } else if (sub_action === "create_link") {
        const { event_type_slug, context } = input;

        const etRes = await fetch(
          `https://api.calendly.com/event_types?user=${encodeURIComponent(conn.calendly_user_uri)}&active=true`,
          { headers: { Authorization: `Bearer ${conn.access_token}` } }
        );
        const etData = await etRes.json();
        const eventTypes = etData.collection || [];
        const et = event_type_slug ? eventTypes.find((e: any) => e.slug === event_type_slug) : eventTypes[0];

        if (!et) return { error: "Aucun event type disponible", available_types: eventTypes.map((e: any) => `${e.name} (${e.slug})`) };

        const linkRes = await fetch("https://api.calendly.com/scheduling_links", {
          method: "POST",
          headers: { Authorization: `Bearer ${conn.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ max_event_count: 1, owner: et.uri, owner_type: "EventType" }),
        });
        const linkData = await linkRes.json();
        const bookingUrl = linkData.resource?.booking_url;

        if (bookingUrl) {
          await admin.from("calendly_scheduling_links").insert({
            user_id: userId, calendly_link_uri: linkData.resource?.uri,
            booking_url: bookingUrl, event_type_uri: et.uri, max_event_count: 1,
            context: context || "Créé depuis OpenClaw",
          });
        }

        return {
          success: !!bookingUrl, booking_url: bookingUrl,
          event_type: et.name, duration: `${et.duration} minutes`,
          message: bookingUrl ? `Lien créé pour "${et.name}" (${et.duration}min) : ${bookingUrl}` : "Échec de création du lien",
        };
      }

      return { error: `sub_action inconnu: ${sub_action}`, available: ["get_upcoming", "create_link"] };
    }

    default:
      return { error: `Tool inconnu: ${name}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey)
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY manquant", hint: "Ajoutez-le dans les secrets Supabase" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const authHeader = req.headers.get("authorization");
  if (!authHeader)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { messages, conversation_id, selected_skills } = await req.json();
    if (!messages?.length) throw new Error("messages array requis");

    // Load user's installed skills first, fallback to default published skills
    const { data: userInstalls } = await admin
      .from("skill_installations")
      .select("skill_slug, is_active, config, openclaw_skills(slug, name, mcp_tool_name, mcp_tool_description, mcp_input_schema, icon, is_active)")
      .eq("user_id", user.id)
      .eq("is_active", true);

    let skills: any[] = [];
    if (userInstalls && userInstalls.length > 0) {
      skills = userInstalls
        .map((inst: any) => inst.openclaw_skills)
        .filter((s: any) => s && s.is_active);
    } else {
      // Fallback: load free published skills
      const { data: defaultSkills } = await admin
        .from("openclaw_skills")
        .select("*")
        .eq("is_active", true)
        .eq("is_published", true)
        .eq("required_plan", "free")
        .limit(8);
      skills = defaultSkills || [];
    }
    if (selected_skills?.length) {
      skills = skills.filter((s: any) => selected_skills.includes(s.slug));
    }

    // User profile for system prompt
    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, company")
      .eq("user_id", user.id)
      .single();

    const systemPrompt = `Tu es OpenClaw, assistant IA de RapidoMeet.
Tu aides ${profile?.first_name || "l'utilisateur"}${profile?.company ? ` (${profile.company})` : ""} à exploiter ses données de réunions.

Utilise toujours les Skills disponibles avant de répondre.
Présente les données de façon structurée et lisible avec du markdown.
Suggère des actions concrètes. Réponds en français.`;

    const tools = (skills || []).map((s: any) => ({
      name: s.mcp_tool_name,
      description: s.mcp_tool_description,
      input_schema: s.mcp_input_schema,
    }));

    // Initial Anthropic call
    const anthropicHeaders = {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    };

    let apiMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));

    let body: any = {
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
    };
    if (tools.length) body.tools = tools;

    let res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: anthropicHeaders,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errBody}`);
    }

    let response = await res.json();
    const skillsUsed: string[] = [];
    let iterations = 0;

    // Agentic loop
    while (response.stop_reason === "tool_use" && iterations < 5) {
      iterations++;

      const toolBlocks = response.content.filter((b: any) => b.type === "tool_use");

      const results = await Promise.all(
        toolBlocks.map(async (block: any) => {
          const start = Date.now();
          const skill = (skills || []).find((s: any) => s.mcp_tool_name === block.name);
          if (skill) skillsUsed.push(skill.slug);

          const result = await executeTool(block.name, block.input, user.id, admin);

          // Log execution
          if (conversation_id && skill) {
            await admin
              .from("openclaw_skill_executions")
              .insert({
                conversation_id,
                user_id: user.id,
                skill_slug: skill.slug,
                input_params: block.input,
                output_data: result,
                duration_ms: Date.now() - start,
                success: !result.error,
                error_message: result.error || null,
              })
              .catch(() => {});

            await admin
              .from("openclaw_skills")
              .update({ usage_count: (skill.usage_count || 0) + 1 })
              .eq("slug", skill.slug)
              .catch(() => {});
          }

          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          };
        })
      );

      // Continue conversation with tool results
      apiMessages = [
        ...apiMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: results },
      ];

      body = {
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: apiMessages,
      };
      if (tools.length) body.tools = tools;

      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: anthropicHeaders,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${errBody}`);
      }

      response = await res.json();
    }

    const finalText = response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");

    // Save to conversation
    if (conversation_id) {
      await admin
        .from("openclaw_conversations")
        .update({
          messages: [...messages, { role: "assistant", content: finalText, skills_used: skillsUsed }],
          skills_used: [...new Set(skillsUsed)],
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversation_id)
        .catch(() => {});
    }

    return new Response(
      JSON.stringify({
        message: finalText,
        skills_used: skillsUsed,
        usage: response.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    await admin
      .from("app_logs")
      .insert({ level: "error", source: "openclaw-gateway", message: error.message, user_id: user.id })
      .catch(() => {});

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
