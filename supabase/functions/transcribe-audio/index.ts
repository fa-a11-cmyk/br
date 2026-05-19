import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let _meetingId: string | null = null;
  let _userId: string | null = null;
  let _meetingTitle: string | null = null;

  try {
    // Rate limiting: 10 requests per minute per user
    const identifier = req.headers.get("authorization")?.replace("Bearer ", "").slice(0, 20) || "unknown";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const rlSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const windowStart = new Date(Date.now() - 60_000).toISOString();
    const { data: rlData } = await rlSupabase.from("rate_limits").select("id, request_count").eq("identifier", identifier).eq("function_name", "transcribe-audio").gte("window_start", windowStart).maybeSingle();
    if (rlData && rlData.request_count >= 10) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (rlData) {
      await rlSupabase.from("rate_limits").update({ request_count: rlData.request_count + 1 }).eq("id", rlData.id);
    } else {
      await rlSupabase.from("rate_limits").insert({ identifier, function_name: "transcribe-audio", request_count: 1 });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { meetingId, audioBase64, recordingUrl, fileName } = await req.json();
    if (!meetingId) throw new Error("meetingId is required");
    _meetingId = meetingId;
    _userId = user.id;

    // Server-side quota check
    const { data: quotaData } = await supabase.rpc("check_meeting_quota", { p_user_id: user.id });
    if (quotaData && !quotaData.allowed) {
      await supabase.from("meetings").update({ status: "failed", error_message: `Quota mensuel atteint (${quotaData.used}/${quotaData.limit})` }).eq("id", meetingId);
      return new Response(JSON.stringify({
        error: "quota_exceeded",
        message: `Quota mensuel atteint (${quotaData.used}/${quotaData.limit}). Passez à un plan supérieur.`,
        quota: quotaData,
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update meeting status to transcribing
    await supabase.from("meetings").update({ status: "transcribing" }).eq("id", meetingId);

    // Resolve audio data: prefer recordingUrl (S3), fallback to audioBase64
    let resolvedBase64 = audioBase64;
    let resolvedFileName = fileName || "audio.mp3";

    if (!resolvedBase64 && recordingUrl) {
      console.log(`Fetching audio from URL: ${recordingUrl}`);
      const audioResponse = await fetch(recordingUrl);
      if (!audioResponse.ok) throw new Error(`Failed to fetch recording: ${audioResponse.status}`);
      const audioBuffer = await audioResponse.arrayBuffer();
      // Convert to base64
      const uint8 = new Uint8Array(audioBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      resolvedBase64 = btoa(binary);
      // Derive filename from URL if not provided
      if (!fileName) {
        const urlPath = new URL(recordingUrl).pathname;
        resolvedFileName = urlPath.split("/").pop() || "recording.mp3";
      }
    }

    // Use Lovable AI (Gemini) to transcribe
    const messages: any[] = [
      {
        role: "system",
        content: `Tu es un moteur de transcription audio professionnel. 
Transcris l'audio fourni en texte français avec :
- Ponctuation correcte
- Identification des locuteurs si possible (Locuteur 1, Locuteur 2, etc.)
- Timestamps approximatifs au format [MM:SS]

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "full_text": "transcription complète",
  "segments": [
    {"speaker": "Locuteur 1", "timestamp": "00:00", "text": "..."},
    {"speaker": "Locuteur 2", "timestamp": "00:15", "text": "..."}
  ],
  "word_count": 123,
  "language": "fr",
  "duration_estimate_seconds": 300
}`
      },
      {
        role: "user",
        content: resolvedBase64
          ? [
              { type: "text", text: `Transcris cet audio (fichier: ${resolvedFileName}). Retourne UNIQUEMENT du JSON valide.` },
              {
                type: "input_audio",
                input_audio: {
                  data: resolvedBase64,
                  format: resolvedFileName.endsWith(".wav") ? "wav" : "mp3",
                },
              },
            ]
          : `Il n'y a pas d'audio fourni. Génère une transcription de démonstration pour une réunion de test RapidoMeet de 5 minutes avec 3 participants discutant d'un projet technique. Retourne UNIQUEMENT du JSON valide.`,
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        await supabase.from("meetings").update({ status: "failed", error_message: "Rate limit exceeded" }).eq("id", meetingId);
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        await supabase.from("meetings").update({ status: "failed", error_message: "Payment required" }).eq("id", meetingId);
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const text = aiData.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      const clean = text.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        full_text: text,
        segments: [],
        word_count: text.split(/\s+/).length,
        language: "fr",
        duration_estimate_seconds: 0,
      };
    }

    // Store transcription
    const { error: insertError } = await supabase.from("transcriptions").insert({
      meeting_id: meetingId,
      user_id: user.id,
      full_text: parsed.full_text,
      segments: parsed.segments || [],
      word_count: parsed.word_count || 0,
      language: parsed.language || "fr",
    });

    if (insertError) {
      console.error("Insert transcription error:", insertError);
      throw new Error("Failed to save transcription");
    }

    // Update meeting with duration estimate and move to analyzing
    await supabase.from("meetings").update({
      status: "analyzing",
      duration_seconds: parsed.duration_estimate_seconds || null,
    }).eq("id", meetingId);

    return new Response(JSON.stringify({
      success: true,
      meetingId,
      wordCount: parsed.word_count,
      segmentsCount: parsed.segments?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-audio error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const logClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await logClient.from("app_logs").insert({
        level: "error",
        source: "transcribe-audio",
        message: msg,
        metadata: { stack: e instanceof Error ? e.stack : undefined, meetingId: _meetingId },
      });

      if (_userId && _meetingId) {
        await logClient.rpc("create_notification", {
          p_user_id: _userId,
          p_type: "meeting_failed",
          p_title: "Échec de transcription",
          p_message: `La réunion n'a pas pu être transcrite. Réessayez ou contactez le support.`,
          p_link: `/app/reunions/${_meetingId}`,
          p_metadata: { meetingId: _meetingId, error: msg },
        }).catch(() => {});
      }
    } catch {}

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
