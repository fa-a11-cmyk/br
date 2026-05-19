import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import QuickStartTemplates from "@/components/app/QuickStartTemplates";
import { useMeetings } from "@/hooks/useMeetings";
import { useMeetingUpload } from "@/hooks/useMeetingUpload";
import { getExpressApiBaseUrl } from "@/lib/expressApi";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/useSubscription";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useOAuth } from "@/hooks/useOAuth";

type MeetingTypeValue = "commercial" | "tech" | "retro" | "onboarding" | "rh" | "marketing" | "autre";

const typeMap: Record<string, MeetingTypeValue> = {
  "Commercial": "commercial",
  "Tech": "tech",
  "Rétro": "retro",
  "Onboarding": "onboarding",
  "Autre": "autre",
};

const NouvelleReunion = () => {
  const { t } = useTranslation("app");
  const { limits, canUseFeature } = useSubscription();
  const [mode, setMode] = useState<"live" | "import" | "plan" | "google_meet" | "zoom">("live");
  const [dragOver, setDragOver] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState("Commercial");
  const [language, setLanguage] = useState("fr");
  const [participants, setParticipants] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [recentImports, setRecentImports] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createMeeting, uploadAndTranscribe, analyzeTranscript, loading } = useMeetings();
  const { uploadMeeting } = useMeetingUpload();
  const hasExpressApi = !!getExpressApiBaseUrl();
  const { completeStep } = useOnboarding();
  const { canCreateMeeting, upgradeMessage, checkAudioFile, quota, limits: planLimits, loading: planLoading } = usePlanLimits();
  const { recordings, syncing, importing, isConnected: oauthIsConnected, syncRecordings, importRecording } = useOAuth();
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [meetingUrl, setMeetingUrl] = useState("");

  // Live recording state
  const [liveTitle, setLiveTitle] = useState("");
  const [liveMeetingType, setLiveMeetingType] = useState("Commercial");
  const [liveParticipants, setLiveParticipants] = useState("");
  const [liveLang, setLiveLang] = useState("fr");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(20).fill(4));
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load recent meetings + enumerate mic devices
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("meetings")
        .select("id, title, created_at, duration_seconds, status, channel")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setRecentImports(data);
    })();
    navigator.mediaDevices?.enumerateDevices().then(d => {
      const mics = d.filter(dev => dev.kind === "audioinput");
      setDevices(mics);
      if (mics.length > 0) setSelectedDevice(mics[0].deviceId);
    }).catch(() => {});
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const startRecording = useCallback(async () => {
    if (!liveTitle.trim()) {
      toast({ title: t("newMeeting.titleRequired"), description: t("newMeeting.titleRequiredDesc"), variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      });
      streamRef.current = stream;

      // Audio analyser for visualisation
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateLevels = () => {
        const arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
        const levels = Array.from(arr.slice(0, 20)).map(v => Math.max(4, (v / 255) * 32));
        setAudioLevel(levels);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();

      // MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(1000); // chunk every 1s
      mediaRecorderRef.current = recorder;

      setIsRecording(true);
      setIsPaused(false);
      setRecordingElapsed(0);
      timerRef.current = setInterval(() => setRecordingElapsed(e => e + 1), 1000);
    } catch (e: any) {
      toast({ title: t("newMeeting.micError"), description: e.message || "Mic access denied", variant: "destructive" });
    }
  }, [liveTitle, selectedDevice, toast]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => setRecordingElapsed(e => e + 1), 1000);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        // Cleanup
        if (timerRef.current) clearInterval(timerRef.current);
        cancelAnimationFrame(animFrameRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        setIsRecording(false);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `live-recording-${Date.now()}.webm`, { type: "audio/webm" });

        // Now process: create meeting → transcribe → analyze
        setIsProcessing(true);
        try {
          if (hasExpressApi) {
            // Express backend path: single upload call handles everything
            setProcessingStep(t("newMeeting.creatingMeeting"));
            const meeting = await createMeeting({
              title: liveTitle.trim(),
              meeting_type: typeMap[liveMeetingType] || "autre",
              channel: "live",
              language: liveLang,
              participants: liveParticipants.split(",").map(p => p.trim()).filter(Boolean),
            });
            setProcessingStep(t("newMeeting.transcribing"));
            const result = await uploadMeeting(meeting.id, file, {
              title: liveTitle.trim(),
              meeting_type: typeMap[liveMeetingType] || "autre",
              language: liveLang,
              participants: liveParticipants.split(",").map(p => p.trim()).filter(Boolean),
            });
            // Store session_id on the meeting for ConfirmationGate
            if (result.session_id) {
              await supabase.from("meetings").update({ session_id: result.session_id } as any).eq("id", meeting.id);
            }
            setProcessingStep(t("newMeeting.done"));
            toast({ title: t("newMeeting.analysisDone"), description: t("newMeeting.redirecting") });
            completeStep("first_meeting");
            setTimeout(() => navigate(`/app/reunions/${meeting.id}`), 1500);
          } else {
            // Fallback: Edge Functions flow
            setProcessingStep(t("newMeeting.creatingMeeting"));
            const meeting = await createMeeting({
              title: liveTitle.trim(),
              meeting_type: typeMap[liveMeetingType] || "autre",
              channel: "live",
              language: liveLang,
              participants: liveParticipants.split(",").map(p => p.trim()).filter(Boolean),
            });
            setProcessingStep(t("newMeeting.transcribing"));
            await uploadAndTranscribe(meeting.id, file);
            setProcessingStep(t("newMeeting.analyzing"));
            await analyzeTranscript(meeting.id);
            setProcessingStep(t("newMeeting.done"));
            toast({ title: t("newMeeting.analysisDone"), description: t("newMeeting.redirecting") });
            completeStep("first_meeting");
            setTimeout(() => navigate(`/app/reunions/${meeting.id}`), 1500);
          }
        } catch (e: any) {
          console.error(e);
          toast({ title: t("newMeeting.error"), description: e.message, variant: "destructive" });
        } finally {
          setIsProcessing(false);
          setProcessingStep("");
        }
        resolve();
      };
      mediaRecorderRef.current!.stop();
    });
  }, [liveTitle, liveMeetingType, liveLang, liveParticipants, hasExpressApi, createMeeting, uploadMeeting, uploadAndTranscribe, analyzeTranscript, navigate, toast]);

  const handleFileSelect = useCallback((file: File) => {
    const validTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/ogg", "video/mp4"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4|ogg)$/i)) {
      toast({ title: t("newMeeting.formatError"), description: t("newMeeting.formatErrorDesc"), variant: "destructive" });
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast({ title: t("newMeeting.fileTooLarge"), description: t("newMeeting.fileTooLargeDesc"), variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setFileSelected(true);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
  }, [title, toast]);

  const handleImportAnalyze = useCallback(async () => {
    if (!selectedFile || !title.trim()) {
      toast({ title: t("newMeeting.fieldsRequired"), description: t("newMeeting.fieldsRequiredDesc"), variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      if (hasExpressApi) {
        // Express backend path
        setProcessingStep(t("newMeeting.creatingMeeting"));
        const meeting = await createMeeting({
          title: title.trim(),
          meeting_type: typeMap[meetingType] || "autre",
          channel: "import",
          language,
          participants: participants.split(",").map(p => p.trim()).filter(Boolean),
        });
        setProcessingStep(t("newMeeting.transcribing"));
        const result = await uploadMeeting(meeting.id, selectedFile, {
          title: title.trim(),
          meeting_type: typeMap[meetingType] || "autre",
          language,
          participants: participants.split(",").map(p => p.trim()).filter(Boolean),
        });
        if (result.session_id) {
          await supabase.from("meetings").update({ session_id: result.session_id } as any).eq("id", meeting.id);
        }
        setProcessingStep(t("newMeeting.done"));
        toast({ title: t("newMeeting.analysisDone"), description: t("newMeeting.redirecting") });
        completeStep("first_meeting");
        setTimeout(() => navigate(`/app/reunions/${meeting.id}`), 1500);
      } else {
        // Fallback: Edge Functions flow
        setProcessingStep(t("newMeeting.creatingMeeting"));
        const meeting = await createMeeting({
          title: title.trim(),
          meeting_type: typeMap[meetingType] || "autre",
          channel: "import",
          language,
          participants: participants.split(",").map(p => p.trim()).filter(Boolean),
        });
        setProcessingStep(t("newMeeting.transcribing"));
        await uploadAndTranscribe(meeting.id, selectedFile);
        setProcessingStep(t("newMeeting.analyzing"));
        await analyzeTranscript(meeting.id);
        setProcessingStep(t("newMeeting.done"));
        toast({ title: t("newMeeting.analysisDone"), description: t("newMeeting.redirecting") });
        completeStep("first_meeting");
        setTimeout(() => navigate(`/app/reunions/${meeting.id}`), 1500);
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: t("newMeeting.error"), description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  }, [selectedFile, title, meetingType, language, participants, hasExpressApi, createMeeting, uploadMeeting, uploadAndTranscribe, analyzeTranscript, navigate, toast]);
  const handleBotJoin = useCallback(async () => {
    if (!meetingUrl) {
      toast({ title: "Champ requis", description: "Veuillez renseigner le lien de la réunion (ex: meet.google.com/...)", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    setProcessingStep("Lancement du Bot d'enregistrement...");
    try {
      const botApiUrl = import.meta.env.VITE_BOT_API_URL || "http://localhost:3000";
      const res = await fetch(`${botApiUrl}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google_meet",
          meeting_url: meetingUrl,
          meeting_title: title.trim() || "Réunion Google Meet",
          meeting_type: typeMap[meetingType] || "autre",
          language: language,
          participants: participants,
          max_duration_seconds: 5400
        })
      });
      if (!res.ok) throw new Error(`Erreur Bot (${res.status})`);
      const data = await res.json();
      toast({ title: "Bot lancé avec succès", description: `Le bot d'enregistrement a rejoint la réunion (Job: ${data.jobId})` });
      setMeetingUrl("");
      setTitle("");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erreur de connexion", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  }, [meetingUrl, title, meetingType, language, participants, toast]);
  const modes = [
    {
      id: "live" as const, icon: (
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" className="w-12 h-12 sm:w-16 sm:h-16">
          <circle cx="32" cy="32" r="32" fill="rgba(233,30,140,0.15)" />
          <circle cx="32" cy="32" r="28" stroke="hsl(var(--fuchsia))" strokeWidth="1.5" fill="none" opacity="0.3">
            <animate attributeName="r" values="24;32;24" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <rect x="25" y="14" width="14" height="22" rx="7" fill="hsl(var(--fuchsia))" opacity="0.9" />
          <path d="M20 34 Q20 46 32 46 Q44 46 44 34" stroke="hsl(var(--fuchsia))" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line x1="32" y1="46" x2="32" y2="52" stroke="hsl(var(--fuchsia))" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="26" y1="52" x2="38" y2="52" stroke="hsl(var(--fuchsia))" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
      title: t("newMeeting.live"), desc: t("newMeeting.liveDesc"),
      badge: true,
    },
    {
      id: "import" as const, icon: (
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" className="w-12 h-12 sm:w-16 sm:h-16">
          <circle cx="32" cy="32" r="32" fill="rgba(124,58,237,0.15)" />
          <rect x="16" y="12" width="24" height="32" rx="4" stroke="hsl(var(--violet))" strokeWidth="2" fill="rgba(124,58,237,0.1)" />
          <path d="M32 12 L40 20 L32 20" stroke="hsl(var(--violet))" strokeWidth="2" fill="rgba(124,58,237,0.15)" />
          <line x1="22" y1="30" x2="22" y2="36" stroke="hsl(var(--violet-l))" strokeWidth="2" strokeLinecap="round" />
          <line x1="26" y1="27" x2="26" y2="39" stroke="hsl(var(--violet-l))" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="29" x2="30" y2="37" stroke="hsl(var(--violet-l))" strokeWidth="2" strokeLinecap="round" />
          <circle cx="46" cy="46" r="12" fill="rgba(124,58,237,0.2)" stroke="hsl(var(--violet))" strokeWidth="1.5" />
          <path d="M46 52 L46 42 M42 46 L46 42 L50 46" stroke="hsl(var(--violet))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: t("newMeeting.import"), desc: t("newMeeting.importDesc"),
    },
    {
      id: "google_meet" as const, icon: <span className="text-3xl sm:text-4xl">🎯</span>,
      title: "Google Meet", desc: "Faire rejoindre le Bot",
    },
    {
      id: "zoom" as const, icon: <span className="text-3xl sm:text-4xl">📹</span>,
      title: "Zoom Cloud", desc: "Importer depuis Zoom",
      disabled: !oauthIsConnected("zoom"),
    },
    {
      id: "plan" as const, icon: (
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" className="w-12 h-12 sm:w-16 sm:h-16">
          <circle cx="32" cy="32" r="32" fill="rgba(16,185,129,0.12)" />
          <rect x="14" y="20" width="30" height="28" rx="5" stroke="hsl(var(--success))" strokeWidth="2" fill="rgba(16,185,129,0.08)" />
          <line x1="14" y1="28" x2="44" y2="28" stroke="hsl(var(--success))" strokeWidth="2" />
          <line x1="22" y1="16" x2="22" y2="24" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="36" y1="16" x2="36" y2="24" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="20" y="33" width="6" height="6" rx="1.5" fill="hsl(var(--success))" opacity="0.6" />
          <rect x="29" y="33" width="6" height="6" rx="1.5" fill="hsl(var(--success))" />
        </svg>
      ),
      title: t("newMeeting.connect"), desc: t("newMeeting.connectDesc"),
    },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-3 sm:px-4 md:px-6 py-5 sm:py-8 md:py-10">
      {/* Breadcrumb */}
      <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground mb-4 sm:mb-6">
        <Link to="/app/reunions" className="hover:text-[hsl(var(--fuchsia-l))]">{t("newMeeting.breadcrumb")}</Link>
        <span className="mx-2">›</span>{t("newMeeting.title")}
      </p>

      <h1 className="font-display font-extrabold text-xl sm:text-2xl md:text-[32px] tracking-tight text-foreground mb-1">{t("newMeeting.title")}</h1>
      <p className="font-body text-xs sm:text-[15px] text-muted-foreground mb-5 sm:mb-8">{t("newMeeting.subtitle")}</p>

      {/* Quota banner */}
      {!planLoading && !canCreateMeeting && (
        <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">🚫</span>
            <div className="flex-1">
              <p className="font-display font-bold text-sm text-foreground mb-1">Quota mensuel atteint</p>
              <p className="font-body text-xs text-muted-foreground">{upgradeMessage}</p>
              <button onClick={() => navigate("/app/billing")} className="mt-2 font-display font-bold text-xs text-primary hover:underline">
                Passer à Pro →
              </button>
            </div>
          </div>
        </div>
      )}

      {!planLoading && canCreateMeeting && quota && quota.limit && (
        <div className="mb-4 flex items-center gap-2 text-xs font-body text-muted-foreground">
          <span>📊 {quota.used}/{quota.limit} réunions ce mois</span>
          {quota.remaining !== null && quota.remaining <= 3 && (
            <span className="text-amber-600 font-medium">⚠️ Plus que {quota.remaining} réunion(s) disponible(s)</span>
          )}
        </div>
      )}

      <QuickStartTemplates onSelect={(id) => console.log("Template selected:", id)} />

      {/* Mode cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-5 sm:mb-8">
        {modes.map(m => (
          <button key={m.id} onClick={() => !m.disabled && setMode(m.id)}
            className={`bg-card rounded-xl sm:rounded-[20px] p-3 sm:p-5 text-center transition-all relative ${m.disabled ? "opacity-50 cursor-not-allowed" : ""} ${mode === m.id ? "border-2 border-[hsl(var(--fuchsia))] bg-fuchsia-d shadow-[0_0_0_4px_rgba(233,30,140,0.1)]" : "border border-border hover:border-[hsl(var(--fuchsia))]/40 hover:-translate-y-1"}`}>
            <div className="flex justify-center mb-2 sm:mb-3">{m.icon}</div>
            <p className="font-display font-bold text-xs sm:text-sm text-foreground mb-0.5">{m.title}</p>
            <p className="font-body text-[10px] sm:text-[11px] text-muted-foreground hidden sm:block">{m.desc}</p>
            {m.badge && <span className="mt-1 sm:mt-2 inline-block bg-gradient-primary text-white font-mono text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full">{t("newMeeting.recommended")}</span>}
            {m.disabled && <p className="font-mono text-[9px] text-muted-foreground mt-1">Connecter dans Configuration</p>}
          </button>
        ))}
      </div>

      {/* Contextual form */}
      <div className="bg-card border border-border rounded-xl sm:rounded-[20px] p-4 sm:p-6 md:p-9 animate-in fade-in slide-in-from-bottom-2 duration-300">

        {mode === "live" && (
          <>
            <h2 className="font-display font-bold text-base sm:text-lg text-foreground mb-4 sm:mb-7">
              {isRecording ? t("newMeeting.recording") : t("newMeeting.configRecording")}
            </h2>

            {/* Recording active UI */}
            {isRecording && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2 font-mono text-sm text-destructive">
                    <span className={`w-2.5 h-2.5 rounded-full bg-destructive ${isPaused ? "" : "animate-pulse"}`} />
                    {isPaused ? "EN PAUSE" : "REC"}
                  </span>
                  <span className="font-mono text-2xl sm:text-3xl text-foreground tracking-wider">{fmtTime(recordingElapsed)}</span>
                </div>
                {/* Live waveform */}
                <div className="bg-secondary border border-border rounded-xl p-3 sm:p-4 mb-4">
                  <div className="flex items-end gap-[2px] h-10 sm:h-14 overflow-hidden">
                    {audioLevel.map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-primary rounded-sm transition-all duration-100" style={{ height: `${isPaused ? 4 : h}px` }} />
                    ))}
                  </div>
                  <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/60 mt-2">
                    🎙 {isPaused ? t("newMeeting.micPaused") : t("newMeeting.micActive")} · {liveTitle}
                  </p>
                </div>
                {/* Controls */}
                <div className="flex gap-2 sm:gap-3">
                  <button onClick={pauseRecording}
                    className="flex-1 bg-secondary border border-border py-3 rounded-xl font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {isPaused ? t("newMeeting.resume") : t("newMeeting.pause")}
                  </button>
                  <button onClick={stopRecording}
                    className="flex-1 bg-destructive/15 border border-destructive/30 py-3 rounded-xl font-body text-sm text-destructive hover:bg-destructive/25 transition-colors">
                    {t("newMeeting.stopAnalyze")}
                  </button>
                </div>
              </div>
            )}

            {/* Processing after stop */}
            {isProcessing && !isRecording && (
              <div className="mb-5 bg-fuchsia-d border border-primary/30 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div>
                    <p className="font-display font-bold text-sm text-foreground">{processingStep}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">Veuillez patienter...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Config form (hidden during recording) */}
            {!isRecording && !isProcessing && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                    <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.meetingTitle")}</label>
                      <input value={liveTitle} onChange={e => setLiveTitle(e.target.value)} placeholder={t("newMeeting.meetingTitlePh")} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.meetingType")}</label>
                      <select value={liveMeetingType} onChange={e => setLiveMeetingType(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground outline-none focus:border-primary appearance-none">
                        {["Commercial", "Tech", "Rétro", "Onboarding", "Autre"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.participants")}</label>
                      <input value={liveParticipants} onChange={e => setLiveParticipants(e.target.value)} placeholder={t("newMeeting.participantsPh")} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.language")}</label>
                      <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                        {[{ l: "🇫🇷 FR", v: "fr" }, { l: "🇬🇧 EN", v: "en" }, { l: "🇦🇪 AR", v: "ar" }, { l: "🔄 Auto", v: "auto" }].map(({ l, v }) => (
                          <button key={v} onClick={() => setLiveLang(v)} className={`font-body text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${liveLang === v ? "bg-fuchsia-d text-[hsl(var(--fuchsia-l))] border border-primary/30" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.microphone")}</label>
                      <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground outline-none focus:border-primary appearance-none">
                        {devices.length > 0 ? devices.map(d => (
                          <option key={d.deviceId} value={d.deviceId}>{d.label || `Micro ${d.deviceId.slice(0, 8)}`}</option>
                        )) : <option>Microphone par défaut</option>}
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">APERÇU AUDIO</label>
                      <div className="bg-secondary border border-border rounded-xl p-3 sm:p-4">
                        <div className="flex items-center gap-[2px] sm:gap-[3px] mb-2 overflow-hidden">
                          {audioLevel.map((h, i) => (
                            <div key={i} className="w-1 rounded-full bg-gradient-primary flex-shrink-0" style={{ height: `${h}px` }} />
                          ))}
                        </div>
                        <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/60">Cliquez sur Démarrer pour activer le micro</p>
                      </div>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">SCÉNARIOS</label>
                      <div className="space-y-2">
                        {["N2 — Prospect Auto-Capture", "N4 — PDF Report Generator"].map(s => (
                          <label key={s} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="accent-[hsl(var(--fuchsia))]" />
                            <span className="font-body text-xs sm:text-sm text-muted-foreground">{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={startRecording}
                  disabled={!liveTitle.trim()}
                  className="w-full mt-5 sm:mt-7 bg-gradient-primary text-white font-display font-extrabold text-sm sm:text-base py-3.5 sm:py-[18px] rounded-xl shadow-[0_8px_32px_rgba(233,30,140,0.35)] hover:scale-[1.01] hover:shadow-[0_12px_40px_rgba(233,30,140,0.45)] transition-all disabled:opacity-50 disabled:hover:scale-100">
                  {t("newMeeting.startRecording")}
                </button>
              </>
            )}
          </>
        )}

        {mode === "import" && (
          <>
            <h2 className="font-display font-bold text-base sm:text-lg text-foreground mb-4 sm:mb-7">Importer votre fichier audio</h2>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.mp4,.ogg,audio/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />

            {!fileSelected ? (
              <div className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-8 sm:p-14 text-center transition-all cursor-pointer ${dragOver ? "border-[hsl(var(--fuchsia))] bg-fuchsia-d" : "border-[hsl(var(--dark-5))] bg-secondary hover:border-[hsl(var(--fuchsia))] hover:bg-fuchsia-d"}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                onClick={() => fileInputRef.current?.click()}>
                <span className="text-4xl sm:text-5xl block mb-2 sm:mb-3">{dragOver ? "📥" : "📁"}</span>
                <p className="font-body text-sm sm:text-base text-muted-foreground mb-1">{dragOver ? "📥" : t("newMeeting.dropzone")}</p>
                <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/50 mb-3 sm:mb-4">MP3 · WAV · M4A · MP4 · OGG · max 500 Mo</p>
                <button className="bg-[hsl(var(--dark-4))] border border-[hsl(var(--dark-5))] text-muted-foreground font-body text-[12px] sm:text-[13px] px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg">Parcourir</button>
              </div>
            ) : (
              <div className="bg-secondary border border-border rounded-xl p-3 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[8px] sm:rounded-[10px] bg-fuchsia-d flex items-center justify-center text-base sm:text-lg">🎵</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs sm:text-sm text-foreground truncate">{selectedFile?.name || "fichier.mp3"}</p>
                    <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/50">
                      {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} Mo` : ""}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] sm:text-[11px] text-[hsl(var(--success))]">✓</span>
                  <button onClick={() => { setFileSelected(false); setSelectedFile(null); }} className="text-muted-foreground hover:text-destructive text-base sm:text-lg">×</button>
                </div>
                <div className="flex items-end gap-[1px] h-8 sm:h-12 mb-2 sm:mb-3 overflow-hidden">
                  {Array.from({ length: 60 }, (_, i) => (
                    <div key={i} className="flex-1 bg-gradient-primary rounded-sm" style={{ height: `${Math.random() * 28 + 4}px`, opacity: 0.6 + Math.random() * 0.4 }} />
                  ))}
                </div>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="mt-4 bg-fuchsia-d border border-[hsl(var(--fuchsia))]/30 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[hsl(var(--fuchsia))] border-t-transparent animate-spin" />
                  <div>
                    <p className="font-display font-bold text-sm text-foreground">{processingStep}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">Veuillez patienter...</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.meetingTitle")}</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("newMeeting.meetingTitlePh")} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.meetingType")}</label>
                <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground outline-none focus:border-[hsl(var(--fuchsia))] appearance-none">
                  {["Commercial", "Tech", "Rétro", "Onboarding", "Autre"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.participants")}</label>
                <input value={participants} onChange={e => setParticipants(e.target.value)} placeholder={t("newMeeting.participantsPh")} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.language")}</label>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {[{ l: "🇫🇷 FR", v: "fr" }, { l: "🇬🇧 EN", v: "en" }, { l: "🇦🇪 AR", v: "ar" }, { l: "🔄 Auto", v: "auto" }].map(({ l, v }) => (
                    <button key={v} onClick={() => setLanguage(v)} className={`font-body text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${language === v ? "bg-fuchsia-d text-[hsl(var(--fuchsia-l))] border border-[hsl(var(--fuchsia))]/30" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleImportAnalyze}
              disabled={isProcessing || !fileSelected || !title.trim()}
              className="w-full mt-5 sm:mt-7 bg-gradient-primary text-white font-display font-extrabold text-sm sm:text-base py-3.5 sm:py-[18px] rounded-xl shadow-[0_8px_32px_rgba(233,30,140,0.35)] hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100">
              {isProcessing ? `⏳ ${processingStep}` : t("newMeeting.analyze")}
            </button>
          </>
        )}

        {mode === "plan" && (
          <>
            <h2 className="font-display font-bold text-base sm:text-lg text-foreground mb-4 sm:mb-7">Connecter une réunion future</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.connectUrl")}</label>
                <input placeholder={t("newMeeting.connectUrlPh")} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
                <p className="font-mono text-[10px] text-[hsl(var(--success))] mt-1">✅ Lien Google Meet valide</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">DATE & HEURE *</label>
                  <input type="datetime-local" className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] outline-none" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">DURÉE ESTIMÉE</label>
                  <select className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground outline-none focus:border-[hsl(var(--fuchsia))] appearance-none">
                    {["30 min", "45 min", "1h", "1h30", "2h"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">TITRE *</label>
                <input placeholder="Ex: Demo NovaCorp" className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">PARTICIPANTS</label>
                <input placeholder="ahmed@braindcode.com, ..." className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
              </div>
              <div className="pt-2 border-t border-border/40 space-y-2.5 sm:space-y-3">
                <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide">CONFIGURATION AUTO</p>
                {[
                  "RapidoMeet rejoint 2 min avant",
                  "Enregistrement automatique",
                  "Rapport envoyé immédiatement",
                  "Rappel avant la réunion",
                ].map((t, i) => (
                  <div key={t} className="flex items-center justify-between gap-2">
                    <span className="font-body text-xs sm:text-sm text-muted-foreground">{t}</span>
                    <div className={`w-[40px] h-[22px] sm:w-[44px] sm:h-[24px] rounded-full relative cursor-pointer shrink-0 ${i < 3 ? "bg-gradient-primary" : "bg-[hsl(var(--dark-4))]"}`}>
                      <span className={`absolute top-[2px] w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] rounded-full bg-white transition-transform ${i < 3 ? "translate-x-[20px] sm:translate-x-[22px]" : "translate-x-[2px]"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full mt-5 sm:mt-7 bg-gradient-primary text-white font-display font-extrabold text-sm sm:text-base py-3.5 sm:py-[18px] rounded-xl shadow-[0_8px_32px_rgba(233,30,140,0.35)] hover:scale-[1.01] transition-all">
              📅 Planifier et connecter
            </button>
          </>
        )}

        {mode === "zoom" && (
          <>
            <h2 className="font-display font-bold text-base sm:text-lg text-foreground mb-4 sm:mb-7">
              Importer depuis Zoom
            </h2>
            <div className="space-y-3">
              {recordings.filter(r => r.provider === mode && r.status === "pending").length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl block mb-3">📹</span>
                  <p className="font-body text-sm text-muted-foreground mb-4">Aucun enregistrement disponible.</p>
                  <button onClick={() => syncRecordings(mode)} disabled={syncing}
                    className="font-display font-bold text-sm text-white bg-gradient-primary px-5 py-2.5 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-50">
                    {syncing ? "⏳ Synchronisation..." : "🔄 Synchroniser les enregistrements"}
                  </button>
                </div>
              ) : (
                <>
                  {recordings.filter(r => r.provider === mode && r.status === "pending").map((rec: any) => (
                    <button key={rec.id}
                      onClick={() => setSelectedRecording(rec.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selectedRecording === rec.id ? "border-[hsl(var(--fuchsia))] bg-fuchsia-d" : "border-border hover:bg-secondary"}`}>
                      <p className="font-display font-bold text-sm text-foreground">{rec.title}</p>
                      <p className="font-mono text-[11px] text-muted-foreground mt-1">
                        📅 {rec.start_time ? new Date(rec.start_time).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "Date inconnue"}
                        {rec.duration_seconds && ` · ⏱ ${Math.round(rec.duration_seconds / 60)}min`}
                      </p>
                    </button>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => syncRecordings(mode)} disabled={syncing}
                      className="font-body text-xs text-muted-foreground bg-secondary border border-border px-3 py-2 rounded-lg hover:text-foreground">
                      {syncing ? "⏳" : "🔄"} Actualiser
                    </button>
                  </div>
                </>
              )}

              {selectedRecording && (
                <button
                  className="w-full mt-4 bg-gradient-primary text-white font-display font-extrabold text-sm sm:text-base py-3.5 sm:py-[18px] rounded-xl shadow-[0_8px_32px_rgba(233,30,140,0.35)] hover:scale-[1.01] transition-all disabled:opacity-50"
                  disabled={!!importing}
                  onClick={async () => {
                    const result = await importRecording(selectedRecording);
                    if (result?.meeting_id) {
                      navigate(`/app/reunions/${result.meeting_id}`);
                    }
                  }}>
                  {importing ? "⏳ Import en cours..." : "⚡ Importer et analyser"}
                </button>
              )}
            </div>
          </>
        )}

        {mode === "google_meet" && (
          <>
            <h2 className="font-display font-bold text-base sm:text-lg text-foreground mb-4 sm:mb-7">
              Faire rejoindre le Bot
            </h2>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">Lien Google Meet (ex: https://meet.google.com/...)</label>
                <input value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx" className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground focus:border-[hsl(var(--fuchsia))] outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.meetingTitle")}</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de la réunion..." className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.meetingType")}</label>
                  <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground outline-none focus:border-[hsl(var(--fuchsia))] appearance-none">
                    {["Commercial", "Tech", "Rétro", "Onboarding", "Autre"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.participants")}</label>
                  <input value={participants} onChange={e => setParticipants(e.target.value)} placeholder={t("newMeeting.participantsPh")} className="w-full bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide block mb-1.5">{t("newMeeting.language")}</label>
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                    {[{ l: "🇫🇷", v: "fr" }, { l: "🇬🇧", v: "en" }, { l: "🇦🇪", v: "ar" }].map(({ l, v }) => (
                      <button key={v} onClick={() => setLanguage(v)} className={`font-body text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${language === v ? "bg-fuchsia-d text-[hsl(var(--fuchsia-l))] border border-[hsl(var(--fuchsia))]/30" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="font-body text-xs text-muted-foreground bg-fuchsia-d/50 p-3 rounded-lg border border-[hsl(var(--fuchsia))]/10">
                🤖 <strong>Action :</strong> Un bot virtuel rejoindra la réunion Google Meet indiquée pour enregistrer l'audio, puis uploadera l'enregistrement automatiquement sur votre tableau de bord.
              </p>
              
              <button
                onClick={handleBotJoin}
                disabled={isProcessing || !meetingUrl.trim()}
                className="w-full mt-5 bg-gradient-primary text-white font-display font-extrabold text-sm sm:text-base py-3.5 sm:py-[18px] rounded-xl shadow-[0_8px_32px_rgba(233,30,140,0.35)] hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100">
                {isProcessing ? `⏳ ${processingStep}` : "Lancer le Bot 🎯"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Recent imports */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-5 sm:mt-8">
        <h3 className="font-display font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4">{t("newMeeting.recentImports")}</h3>
        {recentImports.length === 0 ? (
          <p className="font-body text-xs text-muted-foreground">Aucune importation récente. Importez votre premier fichier audio ci-dessus.</p>
        ) : (
          <div className="space-y-2">
            {recentImports.map((r: any) => (
              <div key={r.id} className="flex items-center gap-2 sm:gap-3 py-2 border-b border-border/30 last:border-0">
                <span className="font-mono text-[11px] sm:text-[12px] text-foreground flex-1 truncate min-w-0">{r.title}</span>
                <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/50 shrink-0 hidden sm:inline">
                  {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                </span>
                <span className={`font-mono text-[9px] sm:text-[10px] shrink-0 ${r.status === "completed" ? "text-[hsl(var(--success))]" : r.status === "failed" ? "text-destructive" : "text-[hsl(var(--fuchsia-l))]"}`}>
                  {r.status === "completed" ? "✓" : r.status === "failed" ? "❌" : "⏳"}
                </span>
                <Link to={`/app/reunions/${r.id}`} className="font-body text-[11px] sm:text-xs text-[hsl(var(--fuchsia-l))] shrink-0">Voir →</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NouvelleReunion;
