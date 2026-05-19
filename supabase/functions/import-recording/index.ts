import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const authHeader = req.headers.get("authorization");
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader || "" } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let recordingId: string | null = null;
  try {
    const body = await req.json();
    recordingId = body.recording_id;

    const { data: recording } = await admin.from("meeting_recordings").select("*, oauth_connections(*)").eq("id", recordingId).eq("user_id", user.id).single();
    if (!recording) throw new Error("Enregistrement introuvable");
    if (recording.status === "processing" || recording.status === "completed") {
      return new Response(JSON.stringify({ success: false, message: "Déjà importé ou en cours" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("meeting_recordings").update({ status: "downloading", updated_at: new Date().toISOString() } as any).eq("id", recordingId);

    const { data: quotaData } = await admin.rpc("check_meeting_quota", { p_user_id: user.id });
    if (quotaData && !quotaData.allowed) {
      await admin.from("meeting_recordings").update({ status: "failed", error_message: "Quota mensuel atteint", updated_at: new Date().toISOString() } as any).eq("id", recordingId);
      throw new Error("Quota mensuel de réunions atteint");
    }

    const { data: meeting } = await admin.from("meetings").insert({ user_id: user.id, title: recording.title, status: "pending", meeting_type: "autre", language: "fr" }).select().single();

    const conn = (recording as any).oauth_connections;
    const downloadRes = await fetch(recording.recording_url, { headers: { Authorization: `Bearer ${conn.access_token}` } });
    if (!downloadRes.ok) throw new Error(`Téléchargement échoué: ${downloadRes.status}`);

    const audioBuffer = await downloadRes.arrayBuffer();
    const filePath = `${user.id}/${meeting!.id}/audio`;
    const contentType = recording.provider === "zoom" ? "audio/m4a" : "video/mp4";
    const { error: uploadError } = await admin.storage.from("meeting-audio").upload(filePath, new Uint8Array(audioBuffer), { contentType, upsert: true });
    if (uploadError) throw new Error(`Upload Storage: ${uploadError.message}`);

    await admin.from("meeting_recordings").update({ status: "processing", rapidomeet_meeting_id: meeting!.id, updated_at: new Date().toISOString() } as any).eq("id", recordingId);
    admin.functions.invoke("transcribe-audio", { body: { meetingId: meeting!.id } }).catch(() => {});

    await admin.rpc("create_notification", {
      p_user_id: user.id, p_type: "system", p_title: "Import en cours 🎙",
      p_message: `"${recording.title}" est en cours d'analyse.`,
      p_link: `/app/reunions/${meeting!.id}`,
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true, meeting_id: meeting!.id, message: "Import lancé — transcription en cours" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    if (recordingId) {
      await admin.from("meeting_recordings").update({ status: "failed", error_message: error.message, updated_at: new Date().toISOString() } as any).eq("id", recordingId).catch(() => {});
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
