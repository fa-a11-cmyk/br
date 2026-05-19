import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Verify HMAC-SHA256 signature from the meeting bot webhook */
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (computed.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_WEBHOOK_SECRET = Deno.env.get("BOT_WEBHOOK_SECRET");
    if (!BOT_WEBHOOK_SECRET) throw new Error("BOT_WEBHOOK_SECRET not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Read raw body for signature verification
    const rawBody = await req.text();

    // Verify HMAC signature
    const signature = req.headers.get("x-webhook-signature") || "";
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isValid = await verifySignature(rawBody, signature, BOT_WEBHOOK_SECRET);
    if (!isValid) {
      console.error("Invalid HMAC signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the verified payload
    const payload = JSON.parse(rawBody);

    // Expected payload from ScreenApp meeting-bot:
    // {
    //   event: "recording.complete",
    //   meeting_url: "https://meet.google.com/...",
    //   recording_url: "https://s3.../recording.mp4",  (or .webm)
    //   bot_name: "RapidoMeet",
    //   duration_seconds: 1800,
    //   platform: "google_meet" | "teams" | "zoom",
    //   meeting_id?: "optional-external-id",
    //   metadata?: { user_id, rapidomeet_meeting_id }
    // }

    const {
      event,
      recording_url,
      duration_seconds,
      platform,
      metadata,
    } = payload;

    if (event !== "recording.complete") {
      return new Response(JSON.stringify({ message: "Event ignored", event }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!recording_url) {
      return new Response(JSON.stringify({ error: "Missing recording_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve the RapidoMeet meeting ID
    const meetingId = metadata?.rapidomeet_meeting_id;
    const userId = metadata?.user_id;

    if (!meetingId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing metadata.rapidomeet_meeting_id or metadata.user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update meeting with recording info
    await supabase
      .from("meetings")
      .update({
        audio_url: recording_url,
        duration_seconds: duration_seconds || null,
        channel: platform || null,
        status: "transcribing",
      })
      .eq("id", meetingId);

    console.log(`[bot-recording-complete] Meeting ${meetingId} — recording received, triggering transcription`);

    // Step 1: Trigger transcription
    // We call transcribe-audio with the S3/recording URL instead of base64
    const transcribeResponse = await supabase.functions.invoke("transcribe-audio", {
      body: {
        meetingId,
        recordingUrl: recording_url,
        fileName: `recording-${platform || "unknown"}.mp3`,
      },
      headers: {
        // Use service role to authenticate the internal call
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (transcribeResponse.error) {
      console.error("Transcription failed:", transcribeResponse.error);
      await supabase
        .from("meetings")
        .update({ status: "failed", error_message: "Transcription failed" })
        .eq("id", meetingId);

      return new Response(
        JSON.stringify({ error: "Transcription failed", details: transcribeResponse.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[bot-recording-complete] Meeting ${meetingId} — transcription done, triggering analysis`);

    // Step 2: Trigger analysis
    const analyzeResponse = await supabase.functions.invoke("analyze-transcript", {
      body: { meetingId },
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (analyzeResponse.error) {
      console.error("Analysis failed:", analyzeResponse.error);
      await supabase
        .from("meetings")
        .update({ status: "partial", error_message: "Analysis failed after transcription" })
        .eq("id", meetingId);

      return new Response(
        JSON.stringify({
          success: true,
          meetingId,
          transcription: "completed",
          analysis: "failed",
          details: analyzeResponse.error,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[bot-recording-complete] Meeting ${meetingId} — full pipeline complete`);

    return new Response(
      JSON.stringify({
        success: true,
        meetingId,
        platform,
        transcription: "completed",
        analysis: "completed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("bot-recording-complete error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
