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

  try {
    const { provider, days_back = 7 } = await req.json();
    const { data: conn } = await admin.from("oauth_connections").select("*").eq("user_id", user.id).eq("provider", provider).eq("is_active", true).single();
    if (!conn) throw new Error(`${provider} non connecté`);

    let accessToken = conn.access_token;
    const isExpired = conn.token_expires_at && new Date(conn.token_expires_at) < new Date(Date.now() + 60000);
    if (isExpired && conn.refresh_token) {
      const refreshRes = await admin.functions.invoke("oauth-handler", { body: { action: "refresh_token", payload: { provider } } });
      if (refreshRes.data?.success) {
        const { data: updatedConn } = await admin.from("oauth_connections").select("access_token").eq("id", conn.id).single();
        accessToken = updatedConn?.access_token || accessToken;
      }
    }

    let recordings: any[] = [];
    const since = new Date(Date.now() - days_back * 86400000).toISOString();

    if (provider === "zoom") {
      const res = await fetch(`https://api.zoom.us/v2/users/me/recordings?from=${since.split("T")[0]}&page_size=30`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Zoom API error: ${res.status}`);
      const data = await res.json();
      for (const meeting of data.meetings || []) {
        const audioRec = meeting.recording_files?.find((f: any) => f.file_type === "M4A" || f.file_type === "MP4");
        if (!audioRec) continue;
        recordings.push({
          provider_meeting_id: meeting.id.toString(), provider_recording_id: audioRec.id,
          title: meeting.topic || "Réunion Zoom", start_time: meeting.start_time,
          duration_seconds: meeting.duration * 60, participants: meeting.participant_count ? [{ count: meeting.participant_count }] : [],
          recording_url: audioRec.download_url,
          metadata: { file_type: audioRec.file_type, file_size: audioRec.file_size, zoom_meeting_id: meeting.id },
        });
      }
    } else if (provider === "google_meet") {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType='video/mp4' and createdTime>'${since}' and name contains 'Meet'&fields=files(id,name,createdTime,size,webContentLink)&pageSize=20`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) { const err = await res.json(); throw new Error(`Google Drive error: ${err.error?.message || res.status}`); }
      const data = await res.json();
      for (const file of data.files || []) {
        recordings.push({
          provider_meeting_id: file.id, provider_recording_id: file.id,
          title: file.name.replace(".mp4", "") || "Réunion Google Meet",
          start_time: file.createdTime, duration_seconds: null, participants: [],
          recording_url: file.webContentLink, metadata: { file_id: file.id, file_size: file.size },
        });
      }
    }

    let newCount = 0;
    for (const rec of recordings) {
      const { data: existing } = await admin.from("meeting_recordings").select("id").eq("user_id", user.id).eq("provider", provider).eq("provider_meeting_id", rec.provider_meeting_id).maybeSingle();
      if (!existing) {
        await admin.from("meeting_recordings").insert({ ...rec, user_id: user.id, oauth_connection_id: conn.id, provider, status: "pending" } as any);
        newCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, found: recordings.length, new: newCount, provider }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
