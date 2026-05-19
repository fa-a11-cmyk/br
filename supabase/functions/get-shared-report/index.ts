import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) throw new Error("Token requis");

    const { data: shared, error } = await admin
      .from("shared_reports")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !shared) {
      return new Response(JSON.stringify({ error: "Lien invalide ou expiré" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (shared.expires_at && new Date(shared.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Ce lien a expiré" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("shared_reports").update({ view_count: shared.view_count + 1 }).eq("id", shared.id);

    const [{ data: meeting }, { data: report }, { data: tasks }, { data: decisions }, contactsResult] = await Promise.all([
      admin.from("meetings").select("id, title, meeting_type, duration_seconds, summary, sentiment_score, created_at, language").eq("id", shared.meeting_id).single(),
      admin.from("reports").select("*").eq("meeting_id", shared.meeting_id).maybeSingle(),
      admin.from("extracted_tasks").select("id, title, priority, status, assignee, deadline").eq("meeting_id", shared.meeting_id),
      admin.from("extracted_decisions").select("id, content").eq("meeting_id", shared.meeting_id),
      shared.show_contacts
        ? admin.from("detected_contacts").select("id, name, company, score").eq("meeting_id", shared.meeting_id)
        : Promise.resolve({ data: [] }),
    ]);

    let transcription = null;
    if (shared.show_transcription) {
      const { data: tx } = await admin.from("transcriptions").select("full_text, segments").eq("meeting_id", shared.meeting_id).maybeSingle();
      transcription = tx;
    }

    return new Response(JSON.stringify({
      meeting, report,
      tasks: tasks || [], decisions: decisions || [],
      contacts: contactsResult.data || [],
      transcription,
      shared: {
        token: shared.token,
        viewCount: shared.view_count + 1,
        expiresAt: shared.expires_at,
        showTranscription: shared.show_transcription,
        showContacts: shared.show_contacts,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
