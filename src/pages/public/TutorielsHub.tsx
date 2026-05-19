import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHead from "@/components/PageHead";
import { useTutorials } from "@/hooks/useTutorials";

const CATEGORIES = [
  { key: "all", label: "Tous" },
  { key: "getting_started", label: "🚀 Démarrage" },
  { key: "transcription", label: "🎙 Transcription" },
  { key: "rapports", label: "📊 Rapports" },
  { key: "scenarios", label: "⚡ Scénarios" },
  { key: "openclaw", label: "🤖 OpenClaw" },
  { key: "avance", label: "🏆 Avancé" },
];

const DIFF_LABELS: Record<string, string> = {
  debutant: "🟢 Débutant",
  intermediaire: "🟡 Intermédiaire",
  avance: "🔴 Avancé",
};

const CATEGORY_ICONS: Record<string, string> = {
  getting_started: "🚀",
  transcription: "🎙",
  rapports: "📊",
  scenarios: "⚡",
  openclaw: "🤖",
  avance: "🏆",
  admin: "🛡",
};

/* ── User Learning Stats ── */
function UserLearningStats() {
  const [stats, setStats] = useState({ completed: 0, inProgress: 0, certificates: 0, totalTime: 0 });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: progresses }, { count: certs }] = await Promise.all([
        supabase.from("tutorial_progress").select("course_completed, completed_chapters").eq("user_id", user.id),
        supabase.from("tutorial_certificates").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      const completed = (progresses || []).filter((p: any) => p.course_completed).length;
      const inProgress = (progresses || []).filter((p: any) => !p.course_completed && p.completed_chapters?.length > 0).length;
      setStats({ completed, inProgress, certificates: certs || 0, totalTime: completed * 15 });
    })();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: "Cours complétés", value: stats.completed, icon: "✅" },
        { label: "En cours", value: stats.inProgress, icon: "📖" },
        { label: "Certificats", value: stats.certificates, icon: "🎓" },
        { label: "Temps formation", value: `${stats.totalTime}min`, icon: "⏱" },
      ].map(s => (
        <Card key={s.label} className="p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{s.icon}</span>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold text-lg">{s.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Course Card ── */
function CourseCard({ course, progress, progressPercent, badge, badgeColor }: any) {
  const navigate = useNavigate();
  const isCompleted = progress?.course_completed;
  const isStarted = (progress?.completed_chapters?.length || 0) > 0;

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => {
        const basePath = window.location.pathname.startsWith("/app") ? "/app/tutoriels" : "/tutoriels";
        navigate(`${basePath}/${course.slug}`.replace("//", "/"));
      }}>
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {CATEGORY_ICONS[course.category] || "📚"}
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {isCompleted && <Badge className="bg-green-500 text-white text-xs">✅ Complété</Badge>}
          {badge && <Badge className={`text-xs ${badgeColor || ""}`}>{badge}</Badge>}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-primary ml-1" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">{DIFF_LABELS[course.difficulty]}</Badge>
          <span className="text-xs text-muted-foreground">{course.chapters_count} chapitres · {course.duration_minutes} min</span>
        </div>
        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
        {isStarted && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progression</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: isCompleted ? "hsl(var(--success))" : "hsl(var(--primary))" }} />
            </div>
          </div>
        )}
        {!isStarted && (
          <Button size="sm" variant="outline" className="w-full text-xs">
            {course.required_plan === "free" ? "Commencer gratuitement" : `Plan ${course.required_plan} requis`}
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ── Main Page ── */
const TutorielsHub = () => {
  const { courses, loading, getCourseProgress, getProgressPercent, recommendations } = useTutorials();
  const [filterCat, setFilterCat] = useState("all");

  const filtered = courses.filter(c => filterCat === "all" || c.category === filterCat);
  const featuredCourses = courses.filter(c => c.is_featured);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHead title="Tutoriels RapidoMeet" description="Maîtrisez RapidoMeet pas à pas avec nos tutoriels vidéo interactifs." path="/tutoriels" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Centre de formation RapidoMeet</h1>
          <p className="text-muted-foreground">Maîtrisez RapidoMeet pas à pas avec nos tutoriels vidéo interactifs.</p>
        </div>

        <UserLearningStats />

        {recommendations.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 flex items-center gap-2">🤖 Recommandés pour vous</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec: any) => {
                const course = courses.find(c => c.slug === rec.slug);
                if (!course) return null;
                return (
                  <CourseCard key={rec.slug} course={course} progress={getCourseProgress(course.id)}
                    progressPercent={getProgressPercent(course.id, course.chapters_count)}
                    badge={rec.reason} badgeColor="bg-primary/10 text-primary" />
                );
              })}
            </div>
          </div>
        )}

        {featuredCourses.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">⭐ Cours populaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredCourses.map(course => (
                <CourseCard key={course.id} course={course} progress={getCourseProgress(course.id)}
                  progressPercent={getProgressPercent(course.id, course.chapters_count)} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setFilterCat(cat.key)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filterCat === cat.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => (
            <CourseCard key={course.id} course={course} progress={getCourseProgress(course.id)}
              progressPercent={getProgressPercent(course.id, course.chapters_count)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TutorielsHub;
