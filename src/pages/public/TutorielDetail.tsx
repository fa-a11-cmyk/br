import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Loader2, Award, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PageHead from "@/components/PageHead";
import { useTutorials } from "@/hooks/useTutorials";
import ReactMarkdown from "react-markdown";

/* ── Quiz Section ── */
function QuizSection({ chapter, onSubmit }: any) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  const questions = chapter.quiz_questions as any[];
  if (!questions?.length) return null;
  const question = questions[currentQ];

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(answers);
    setSubmitting(false);
  };

  const allAnswered = questions.every((q: any) => answers[q.id]);

  return (
    <Card className="p-5 space-y-5 border-primary/20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          🧠 Quiz — Question {currentQ + 1}/{questions.length}
        </h3>
        <div className="flex gap-1.5">
          {questions.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentQ ? "bg-primary scale-125" : answers[questions[i].id] ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1" />

      <div>
        <p className="font-medium text-sm mb-4">{question.question}</p>
        <div className="space-y-2">
          {question.options?.map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => setAnswers(prev => ({ ...prev, [question.id]: opt.value }))}
              className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all ${
                answers[question.id] === opt.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/30 hover:bg-muted/30 hover:border-border/50"
              }`}
            >
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mr-3 ${
                answers[question.id] === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {opt.value.toUpperCase()}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button size="sm" variant="ghost" disabled={currentQ === 0} onClick={() => setCurrentQ(q => q - 1)}>
          ← Précédent
        </Button>
        {currentQ < questions.length - 1 ? (
          <Button size="sm" disabled={!answers[question.id]} onClick={() => setCurrentQ(q => q + 1)}>
            Suivant →
          </Button>
        ) : (
          <Button size="sm" disabled={!allAnswered || submitting} onClick={handleSubmit}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Soumettre le quiz
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ── Quiz Results ── */
function QuizResults({ result, onRetry }: { result: any; onRetry: () => void }) {
  return (
    <Card className={`p-5 ${result.passed ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
      <div className="flex items-center gap-3 mb-4">
        {result.passed ? (
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        ) : (
          <XCircle className="w-8 h-8 text-destructive" />
        )}
        <div>
          <p className={`font-bold text-lg ${result.passed ? "text-green-600" : "text-destructive"}`}>
            {result.passed ? "Quiz réussi !" : "Quiz non réussi"}
          </p>
          <p className="text-sm text-muted-foreground">
            Score : {result.score}% ({result.correct}/{result.total}) — Minimum requis : {result.pass_score}%
          </p>
        </div>
      </div>

      <Progress value={result.score} className={`h-2 mb-4 ${result.passed ? "[&>div]:bg-green-500" : "[&>div]:bg-destructive"}`} />

      {result.results && (
        <div className="space-y-2 mb-4">
          {result.results.map((r: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg text-sm ${r.correct ? "bg-green-500/10" : "bg-destructive/10"}`}>
              <div className="flex items-start gap-2">
                {r.correct ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />}
                <div>
                  <p className="font-medium">{r.question}</p>
                  {!r.correct && r.explanation && (
                    <p className="text-xs text-muted-foreground mt-1">💡 {r.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!result.passed && (
        <Button size="sm" variant="outline" onClick={onRetry} className="w-full">
          <RotateCcw className="w-4 h-4 mr-1" />
          Réessayer le quiz
        </Button>
      )}
    </Card>
  );
}

/* ── Certificate Dialog ── */
function CertificateDialog({ courseTitle, certificateId, onClose }: any) {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("first_name, last_name").then(({ data }) => {
      if (data?.[0]) setUserName([data[0].first_name, data[0].last_name].filter(Boolean).join(" "));
    });
  }, []);

  const downloadCertificate = () => {
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:60px 40px;background:#fff;color:#1a1a2e}.border{border:8px solid #6366f1;padding:40px;border-radius:16px}.logo{text-align:center;font-size:28px;color:#6366f1;font-weight:900;margin-bottom:8px}h1{text-align:center;font-size:36px;color:#1a1a2e;margin:20px 0 8px}.subtitle{text-align:center;color:#6b7280;margin-bottom:32px}.name{text-align:center;font-size:32px;color:#6366f1;font-weight:bold;margin:16px 0}.course{text-align:center;font-size:18px;margin:8px 0 32px;color:#4b5563}.date{text-align:center;color:#9ca3af;font-size:14px}.id{text-align:center;font-family:monospace;font-size:12px;color:#d1d5db;margin-top:8px}.seal{text-align:center;font-size:60px;margin:24px 0}</style></head><body><div class="border"><div class="logo">⚡ RapidoMeet</div><h1>Certificat de Réussite</h1><div class="subtitle">Ce certificat est décerné à</div><div class="name">${userName}</div><div class="course">pour avoir complété avec succès :<br/><strong>${courseTitle}</strong></div><div class="seal">🎓</div><div class="date">Délivré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div><div class="id">Certificat N° ${certificateId}</div></div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificat-rapidomeet-${certificateId}.html`;
    a.click();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center">
        <div className="py-6 space-y-4">
          <div className="text-6xl">🎓</div>
          <h2 className="text-2xl font-bold">Félicitations !</h2>
          <p className="text-muted-foreground">Vous avez complété</p>
          <p className="font-semibold text-lg text-primary">{courseTitle}</p>
          <div className="bg-muted/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Certificat N°</p>
            <code className="font-mono font-bold text-primary">{certificateId}</code>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={downloadCertificate}>📥 Télécharger</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/certificat/${certificateId}`)}>📋 Copier le lien</Button>
          </div>
          <Button variant="ghost" onClick={onClose}>Continuer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Format duration ── */
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.round(seconds / 60);
  return mins > 0 ? `${mins}min` : `${seconds}s`;
}

/* ── Main Detail Page ── */
const TutorielDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { completeChapter, submitQuiz, getCourseProgress } = useTutorials();

  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [activeChapter, setActiveChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [completionResult, setCompletionResult] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: courseData } = await supabase.from("tutorial_courses").select("*").eq("slug", slug).eq("is_published", true).single();
      if (!courseData) { navigate("/tutoriels"); return; }
      setCourse(courseData);
      const { data: chapsData } = await supabase.from("tutorial_chapters").select("*").eq("course_id", courseData.id).eq("is_published", true).order("order_index");
      setChapters(chapsData || []);
      if (chapsData?.length) setActiveChapter(chapsData[0]);
      setLoading(false);
    })();
  }, [slug]);

  const progress = course ? getCourseProgress(course.id) : null;
  const isChapterCompleted = (chapterId: string) => progress?.completed_chapters?.includes(chapterId) || false;
  const completedCount = progress?.completed_chapters?.length || 0;
  const progressPercent = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

  const handleComplete = async () => {
    if (!course || !activeChapter) return;
    setCompleting(true);
    const result = await completeChapter(course.id, activeChapter.id);
    setCompletionResult(result);
    if (result.course_completed) setShowCertificate(true);
    setCompleting(false);
  };

  const handleNextChapter = () => {
    const currentIdx = chapters.findIndex(c => c.id === activeChapter?.id);
    if (currentIdx < chapters.length - 1) {
      setActiveChapter(chapters[currentIdx + 1]);
      setShowQuiz(false);
      setQuizResult(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isYouTubeUrl = (url: string) => /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/.test(url);
  const toEmbedUrl = (url: string) => url.replace(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/, "youtube.com/embed/$1");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background">
      <PageHead title={course.title} description={course.description} path={`/tutoriels/${slug}`} />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <button onClick={() => {
            const basePath = window.location.pathname.startsWith("/app") ? "/app/tutoriels" : "/tutoriels";
            navigate(basePath);
          }} className="hover:text-foreground transition-colors">Tutoriels</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{course.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <div>
                <h2 className="font-semibold text-sm mb-3">Chapitres</h2>
                <div className="space-y-1">
                  {chapters.map((ch, i) => {
                    const done = isChapterCompleted(ch.id);
                    const active = activeChapter?.id === ch.id;
                    const duration = formatDuration(ch.video_duration_seconds);
                    return (
                      <button key={ch.id}
                        onClick={() => { setActiveChapter(ch); setShowQuiz(false); setQuizResult(null); }}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl text-sm transition-all ${active ? "bg-primary/10 text-primary" : "hover:bg-muted/30"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${done ? "bg-green-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {done ? "✓" : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`truncate text-xs font-medium ${active ? "text-primary" : ""}`}>{ch.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {[duration, ch.has_quiz && "Quiz"].filter(Boolean).join(" · ") || "Texte"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress card */}
              <Card className="p-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{completedCount}/{chapters.length}</span>
                </div>
                <Progress value={progressPercent} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground text-center">{progressPercent}% complété</p>
                {progress?.course_completed && progress?.certificate_id && (
                  <Button size="sm" variant="outline" className="w-full mt-3 text-xs" onClick={() => navigate(`/certificat/${progress.certificate_id}`)}>
                    <Award className="w-3.5 h-3.5 mr-1" />
                    Voir le certificat
                  </Button>
                )}
              </Card>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {activeChapter && (
              <div>
                <h1 className="text-xl font-bold mb-1">{activeChapter.title}</h1>
                {activeChapter.description && (
                  <p className="text-sm text-muted-foreground mb-4">{activeChapter.description}</p>
                )}

                {/* YouTube Video */}
                {activeChapter.video_url && isYouTubeUrl(activeChapter.video_url) && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6">
                    <iframe
                      src={toEmbedUrl(activeChapter.video_url)}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={activeChapter.title}
                    />
                  </div>
                )}

                {/* No video placeholder */}
                {(!activeChapter.video_url || !isYouTubeUrl(activeChapter.video_url)) && !activeChapter.content_markdown && (
                  <Card className="p-8 text-center mb-6 bg-muted/10">
                    <p className="text-4xl mb-3">📖</p>
                    <p className="text-muted-foreground text-sm">Ce chapitre n'a pas encore de contenu vidéo ou texte.</p>
                  </Card>
                )}

                {/* Markdown content */}
                {activeChapter.content_markdown && (
                  <Card className="p-6 mb-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                      <ReactMarkdown>{activeChapter.content_markdown}</ReactMarkdown>
                    </div>
                  </Card>
                )}

                {/* Quiz */}
                {activeChapter.has_quiz && activeChapter.quiz_questions?.length > 0 && !quizResult && (
                  <div>
                    {!showQuiz ? (
                      <Button variant="outline" onClick={() => setShowQuiz(true)} className="w-full py-6 text-base">
                        🧠 Passer le quiz ({activeChapter.quiz_questions.length} questions)
                      </Button>
                    ) : (
                      <QuizSection chapter={activeChapter} onSubmit={async (answers: Record<string, string>) => {
                        const result = await submitQuiz(course.id, activeChapter.id, answers);
                        setQuizResult(result);
                        return result;
                      }} />
                    )}
                  </div>
                )}

                {/* Quiz results */}
                {quizResult && (
                  <QuizResults result={quizResult} onRetry={() => { setShowQuiz(true); setQuizResult(null); }} />
                )}

                {/* Action buttons */}
                <div className="flex gap-3 mt-6">
                  {!isChapterCompleted(activeChapter.id) && (!activeChapter.has_quiz || quizResult?.passed) && (
                    <Button onClick={handleComplete} disabled={completing} className="flex-1">
                      {completing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Marquer comme terminé
                    </Button>
                  )}
                  {isChapterCompleted(activeChapter.id) && (
                    <Button variant="outline" className="flex-1" disabled>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      Chapitre complété
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleNextChapter} disabled={chapters.indexOf(activeChapter) === chapters.length - 1}>
                    Suivant →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showCertificate && completionResult && (
          <CertificateDialog courseTitle={course.title} certificateId={completionResult.certificate_id} onClose={() => setShowCertificate(false)} />
        )}
      </div>
    </div>
  );
};

export default TutorielDetail;
