import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { query } = await req.json();
    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const q = query.trim().toLowerCase();
    const userId = user.id;

    const [meetings, tasks, contacts, decisions] = await Promise.all([
      admin.from("meetings").select("id, title, meeting_type, status, created_at").eq("user_id", userId).ilike("title", `%${q}%`).order("created_at", { ascending: false }).limit(5),
      admin.from("extracted_tasks").select("id, title, priority, status, meeting_id, created_at").eq("user_id", userId).ilike("title", `%${q}%`).order("created_at", { ascending: false }).limit(5),
      admin.from("detected_contacts").select("id, name, company, score, meeting_id").eq("user_id", userId).or(`name.ilike.%${q}%,company.ilike.%${q}%`).order("score", { ascending: false }).limit(3),
      admin.from("extracted_decisions").select("id, content, meeting_id, created_at").eq("user_id", userId).ilike("content", `%${q}%`).order("created_at", { ascending: false }).limit(3),
    ]);

    const results = [
      ...(meetings.data || []).map((m: any) => ({
        id: m.id, type: "meeting", title: m.title,
        subtitle: `${m.meeting_type} · ${new Date(m.created_at).toLocaleDateString("fr-FR")}`,
        badge: m.status, link: `/app/reunions/${m.id}`, icon: "🎙",
      })),
      ...(tasks.data || []).map((t: any) => ({
        id: t.id, type: "task", title: t.title,
        subtitle: `Priorité ${t.priority} · ${t.status}`,
        badge: t.priority, link: `/app/taches?highlight=${t.id}`, icon: "✅",
      })),
      ...(contacts.data || []).map((c: any) => ({
        id: c.id, type: "contact", title: c.name,
        subtitle: c.company || "Contact détecté",
        badge: `${c.score}%`, link: `/app/reunions/${c.meeting_id}`, icon: "👤",
      })),
      ...(decisions.data || []).map((d: any) => ({
        id: d.id, type: "decision",
        title: d.content.substring(0, 60) + (d.content.length > 60 ? "…" : ""),
        subtitle: "Décision", badge: null, link: `/app/reunions/${d.meeting_id}`, icon: "🎯",
      })),
    ];

    return new Response(JSON.stringify({ results, query }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
