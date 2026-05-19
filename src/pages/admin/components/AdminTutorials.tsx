import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, GripVertical, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  difficulty: string;
  duration_minutes: number;
  chapters_count: number;
  is_published: boolean;
  is_featured: boolean;
  required_plan: string;
  order_index: number;
  created_at: string;
}

interface Chapter {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_provider: string;
  video_duration_seconds: number;
  thumbnail_url: string | null;
  content_markdown: string | null;
  has_quiz: boolean;
  quiz_questions: any[];
  quiz_pass_score: number;
  order_index: number;
  is_published: boolean;
  is_free: boolean;
}

const CATEGORIES = [
  { value: "getting_started", label: "🚀 Démarrage" },
  { value: "transcription", label: "🎙 Transcription" },
  { value: "rapports", label: "📊 Rapports" },
  { value: "scenarios", label: "⚡ Scénarios" },
  { value: "openclaw", label: "🤖 OpenClaw" },
  { value: "avance", label: "🏆 Avancé" },
  { value: "admin", label: "🛡 Admin" },
];

const DIFFICULTIES = [
  { value: "debutant", label: "🟢 Débutant" },
  { value: "intermediaire", label: "🟡 Intermédiaire" },
  { value: "avance", label: "🔴 Avancé" },
];

const PLANS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
];

function isValidYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/.test(url);
}

function toYouTubeEmbedUrl(url: string): string {
  if (!url) return "";
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export default function AdminTutorials() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseDialog, setCourseDialog] = useState<{ open: boolean; course: Partial<Course> | null }>({ open: false, course: null });
  const [chapterDialog, setChapterDialog] = useState<{ open: boolean; chapter: Partial<Chapter> | null; courseId: string | null }>({ open: false, chapter: null, courseId: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: coursesData }, { data: chaptersData }] = await Promise.all([
      supabase.from("tutorial_courses").select("*").order("order_index"),
      supabase.from("tutorial_chapters").select("*").order("order_index"),
    ]);
    setCourses((coursesData as any) || []);
    setChapters((chaptersData as any) || []);
    setLoading(false);
  };

  const saveCourse = async () => {
    if (!courseDialog.course?.title || !courseDialog.course?.slug) {
      toast({ title: "Titre et slug requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: courseDialog.course.title,
        slug: courseDialog.course.slug,
        description: courseDialog.course.description || null,
        thumbnail_url: courseDialog.course.thumbnail_url || null,
        category: courseDialog.course.category || "getting_started",
        difficulty: courseDialog.course.difficulty || "debutant",
        duration_minutes: courseDialog.course.duration_minutes || 10,
        is_published: courseDialog.course.is_published ?? false,
        is_featured: courseDialog.course.is_featured ?? false,
        required_plan: courseDialog.course.required_plan || "free",
        order_index: courseDialog.course.order_index || 0,
      };

      if (courseDialog.course.id) {
        await supabase.from("tutorial_courses").update(data).eq("id", courseDialog.course.id);
      } else {
        await supabase.from("tutorial_courses").insert(data);
      }
      toast({ title: "Cours sauvegardé ✓" });
      setCourseDialog({ open: false, course: null });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (id: string) => {
    setDeleting(id);
    await supabase.from("tutorial_chapters").delete().eq("course_id", id);
    await supabase.from("tutorial_courses").delete().eq("id", id);
    toast({ title: "Cours supprimé ✓" });
    setDeleting(null);
    await loadAll();
  };

  const saveChapter = async () => {
    if (!chapterDialog.chapter?.title || !chapterDialog.chapter?.slug) {
      toast({ title: "Titre et slug requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        course_id: chapterDialog.courseId!,
        title: chapterDialog.chapter.title,
        slug: chapterDialog.chapter.slug,
        description: chapterDialog.chapter.description || null,
        video_url: chapterDialog.chapter.video_url || null,
        video_provider: chapterDialog.chapter.video_provider || "youtube",
        video_duration_seconds: chapterDialog.chapter.video_duration_seconds || 0,
        content_markdown: chapterDialog.chapter.content_markdown || null,
        has_quiz: chapterDialog.chapter.has_quiz ?? false,
        quiz_questions: chapterDialog.chapter.quiz_questions || [],
        quiz_pass_score: chapterDialog.chapter.quiz_pass_score || 70,
        order_index: chapterDialog.chapter.order_index || 0,
        is_published: chapterDialog.chapter.is_published ?? true,
        is_free: chapterDialog.chapter.is_free ?? true,
      };

      if (chapterDialog.chapter.id) {
        await supabase.from("tutorial_chapters").update(data).eq("id", chapterDialog.chapter.id);
      } else {
        await supabase.from("tutorial_chapters").insert(data);
        // Update chapters_count
        const count = chapters.filter(c => c.course_id === chapterDialog.courseId).length + 1;
        await supabase.from("tutorial_courses").update({ chapters_count: count }).eq("id", chapterDialog.courseId!);
      }
      toast({ title: "Chapitre sauvegardé ✓" });
      setChapterDialog({ open: false, chapter: null, courseId: null });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteChapter = async (chapter: Chapter) => {
    setDeleting(chapter.id);
    await supabase.from("tutorial_chapters").delete().eq("id", chapter.id);
    const count = chapters.filter(c => c.course_id === chapter.course_id && c.id !== chapter.id).length;
    await supabase.from("tutorial_courses").update({ chapters_count: count }).eq("id", chapter.course_id);
    toast({ title: "Chapitre supprimé ✓" });
    setDeleting(null);
    await loadAll();
  };

  const togglePublished = async (course: Course) => {
    await supabase.from("tutorial_courses").update({ is_published: !course.is_published }).eq("id", course.id);
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
  };

  const toggleFeatured = async (course: Course) => {
    await supabase.from("tutorial_courses").update({ is_featured: !course.is_featured }).eq("id", course.id);
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_featured: !c.is_featured } : c));
  };

  const courseChapters = (courseId: string) => chapters.filter(c => c.course_id === courseId).sort((a, b) => a.order_index - b.order_index);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">🎓 Gestion des Tutoriels</h2>
          <p className="text-sm text-muted-foreground">{courses.length} cours · {chapters.length} chapitres</p>
        </div>
        <Button size="sm" onClick={() => setCourseDialog({ open: true, course: { is_published: false, is_featured: false, category: "getting_started", difficulty: "debutant", required_plan: "free", order_index: courses.length } })}>
          <Plus className="w-4 h-4 mr-1" /> Nouveau cours
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Cours publiés", value: courses.filter(c => c.is_published).length, icon: "📚" },
          { label: "Chapitres total", value: chapters.length, icon: "📖" },
          { label: "Avec vidéo YouTube", value: chapters.filter(c => isValidYouTubeUrl(c.video_url || "")).length, icon: "🎥" },
          { label: "Avec quiz", value: chapters.filter(c => c.has_quiz).length, icon: "🧠" },
        ].map(k => (
          <Card key={k.label} className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <span>{k.icon}</span>
            </div>
            <p className="font-bold text-lg mt-1">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Courses list */}
      <div className="space-y-3">
        {courses.map(course => {
          const chaps = courseChapters(course.id);
          const expanded = expandedCourse === course.id;
          return (
            <Card key={course.id} className="overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <button onClick={() => setExpandedCourse(expanded ? null : course.id)} className="p-1 hover:bg-muted/30 rounded">
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                    <Badge variant="outline" className="text-xs">{CATEGORIES.find(c => c.value === course.category)?.label || course.category}</Badge>
                    {course.is_featured && <Badge className="text-xs bg-amber-500/10 text-amber-600">⭐</Badge>}
                    {!course.is_published && <Badge variant="outline" className="text-xs text-muted-foreground">Brouillon</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{chaps.length} chapitres · {course.duration_minutes}min · {course.required_plan}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Publié</span>
                    <Switch checked={course.is_published} onCheckedChange={() => togglePublished(course)} />
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Featured</span>
                    <Switch checked={course.is_featured} onCheckedChange={() => toggleFeatured(course)} />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setCourseDialog({ open: true, course: { ...course } })}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={deleting === course.id} onClick={() => deleteCourse(course.id)}>
                    {deleting === course.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-border/30 bg-muted/5 p-4 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Chapitres</p>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setChapterDialog({ open: true, chapter: { is_published: true, is_free: true, video_provider: "youtube", order_index: chaps.length }, courseId: course.id })}>
                      <Plus className="w-3 h-3 mr-1" /> Ajouter chapitre
                    </Button>
                  </div>
                  {chaps.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucun chapitre. Ajoutez-en un.</p>
                  ) : (
                    chaps.map((ch, i) => (
                      <div key={ch.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/20 bg-background">
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{ch.title}</p>
                            {isValidYouTubeUrl(ch.video_url || "") && (
                              <Badge className="text-[10px] bg-red-500/10 text-red-600 shrink-0">
                                <Video className="w-3 h-3 mr-0.5" /> YouTube
                              </Badge>
                            )}
                            {ch.video_url && !isValidYouTubeUrl(ch.video_url) && (
                              <Badge variant="outline" className="text-[10px] shrink-0">📎 Vidéo</Badge>
                            )}
                            {ch.has_quiz && <Badge variant="outline" className="text-[10px] shrink-0">🧠 Quiz</Badge>}
                            {!ch.is_published && <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">Masqué</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{Math.round(ch.video_duration_seconds / 60)}min{ch.content_markdown ? " · Contenu texte" : ""}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setChapterDialog({ open: true, chapter: { ...ch }, courseId: course.id })}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" disabled={deleting === ch.id} onClick={() => deleteChapter(ch)}>
                          {deleting === ch.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {courses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">📚</p>
            <p>Aucun cours créé. Commencez par en ajouter un.</p>
          </div>
        )}
      </div>

      {/* Course dialog */}
      <Dialog open={courseDialog.open} onOpenChange={o => !o && setCourseDialog({ open: false, course: null })}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{courseDialog.course?.id ? "Modifier le cours" : "Nouveau cours"}</DialogTitle>
          </DialogHeader>
          {courseDialog.course && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Titre *</Label>
                <Input value={courseDialog.course.title || ""} onChange={e => setCourseDialog(p => ({ ...p, course: { ...p.course!, title: e.target.value } }))} placeholder="Ex: Démarrer avec RapidoMeet" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Slug * (URL)</Label>
                <Input value={courseDialog.course.slug || ""} onChange={e => setCourseDialog(p => ({ ...p, course: { ...p.course!, slug: e.target.value } }))} placeholder="demarrer-rapidomeet" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={courseDialog.course.description || ""} onChange={e => setCourseDialog(p => ({ ...p, course: { ...p.course!, description: e.target.value } }))} rows={3} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Image miniature (URL)</Label>
                <Input value={courseDialog.course.thumbnail_url || ""} onChange={e => setCourseDialog(p => ({ ...p, course: { ...p.course!, thumbnail_url: e.target.value } }))} placeholder="https://..." className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Catégorie</Label>
                  <Select value={courseDialog.course.category || "getting_started"} onValueChange={v => setCourseDialog(p => ({ ...p, course: { ...p.course!, category: v } }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Difficulté</Label>
                  <Select value={courseDialog.course.difficulty || "debutant"} onValueChange={v => setCourseDialog(p => ({ ...p, course: { ...p.course!, difficulty: v } }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Durée (min)</Label>
                  <Input type="number" value={courseDialog.course.duration_minutes || 10} onChange={e => setCourseDialog(p => ({ ...p, course: { ...p.course!, duration_minutes: parseInt(e.target.value) || 10 } }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Plan requis</Label>
                  <Select value={courseDialog.course.required_plan || "free"} onValueChange={v => setCourseDialog(p => ({ ...p, course: { ...p.course!, required_plan: v } }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PLANS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Ordre</Label>
                  <Input type="number" value={courseDialog.course.order_index || 0} onChange={e => setCourseDialog(p => ({ ...p, course: { ...p.course!, order_index: parseInt(e.target.value) || 0 } }))} className="mt-1" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialog({ open: false, course: null })}>Annuler</Button>
            <Button onClick={saveCourse} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter dialog */}
      <Dialog open={chapterDialog.open} onOpenChange={o => !o && setChapterDialog({ open: false, chapter: null, courseId: null })}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{chapterDialog.chapter?.id ? "Modifier le chapitre" : "Nouveau chapitre"}</DialogTitle>
          </DialogHeader>
          {chapterDialog.chapter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Titre *</Label>
                  <Input value={chapterDialog.chapter.title || ""} onChange={e => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, title: e.target.value } }))} placeholder="Introduction" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Slug *</Label>
                  <Input value={chapterDialog.chapter.slug || ""} onChange={e => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, slug: e.target.value } }))} placeholder="introduction" className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input value={chapterDialog.chapter.description || ""} onChange={e => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, description: e.target.value } }))} placeholder="Ce que vous apprendrez..." className="mt-1" />
              </div>

              {/* YouTube Video */}
              <div className="p-4 rounded-xl border border-border/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-red-500" />
                  <Label className="text-xs font-semibold">Vidéo YouTube</Label>
                </div>
                <Input
                  value={chapterDialog.chapter.video_url || ""}
                  onChange={e => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, video_url: e.target.value } }))}
                  placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                  className="text-sm"
                />
                {chapterDialog.chapter.video_url && isValidYouTubeUrl(chapterDialog.chapter.video_url) && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={toYouTubeEmbedUrl(chapterDialog.chapter.video_url)}
                      className="w-full h-full"
                      allowFullScreen
                      title="Aperçu vidéo"
                    />
                  </div>
                )}
                {chapterDialog.chapter.video_url && !isValidYouTubeUrl(chapterDialog.chapter.video_url) && (
                  <p className="text-xs text-amber-600">⚠️ URL non reconnue comme YouTube. L'iframe ne sera pas affichée sur la page tutoriel.</p>
                )}
                {!chapterDialog.chapter.video_url && (
                  <p className="text-xs text-muted-foreground">Laissez vide si pas de vidéo — seul le contenu texte sera affiché.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Durée vidéo (secondes)</Label>
                  <Input type="number" value={chapterDialog.chapter.video_duration_seconds || 0} onChange={e => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, video_duration_seconds: parseInt(e.target.value) || 0 } }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Ordre d'affichage</Label>
                  <Input type="number" value={chapterDialog.chapter.order_index || 0} onChange={e => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, order_index: parseInt(e.target.value) || 0 } }))} className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Contenu (Markdown)</Label>
                <Textarea
                  value={chapterDialog.chapter.content_markdown || ""}
                  onChange={e => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, content_markdown: e.target.value } }))}
                  rows={8}
                  className="mt-1 font-mono text-xs"
                  placeholder="## Titre&#10;&#10;Votre contenu en markdown..."
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={chapterDialog.chapter.is_published ?? true} onCheckedChange={v => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, is_published: v } }))} />
                  <Label className="text-xs">Publié</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={chapterDialog.chapter.is_free ?? true} onCheckedChange={v => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, is_free: v } }))} />
                  <Label className="text-xs">Gratuit</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={chapterDialog.chapter.has_quiz ?? false} onCheckedChange={v => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, has_quiz: v } }))} />
                  <Label className="text-xs">Quiz</Label>
                </div>
              </div>

              {chapterDialog.chapter.has_quiz && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Questions du quiz</Label>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                      const questions = [...(chapterDialog.chapter?.quiz_questions || [])];
                      questions.push({
                        id: `q${questions.length + 1}`,
                        question: "",
                        type: "qcm",
                        options: [
                          { value: "a", label: "", correct: true },
                          { value: "b", label: "", correct: false },
                          { value: "c", label: "", correct: false },
                        ],
                        explanation: "",
                      });
                      setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, quiz_questions: questions } }));
                    }}>
                      <Plus className="w-3 h-3 mr-1" /> Ajouter question
                    </Button>
                  </div>

                  {(chapterDialog.chapter.quiz_questions || []).map((q: any, qi: number) => (
                    <Card key={qi} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">Question {qi + 1}</p>
                        <Button size="sm" variant="ghost" className="text-destructive h-6 w-6 p-0" onClick={() => {
                          const questions = [...(chapterDialog.chapter?.quiz_questions || [])];
                          questions.splice(qi, 1);
                          setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, quiz_questions: questions } }));
                        }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <Input
                        value={q.question || ""}
                        onChange={e => {
                          const questions = [...(chapterDialog.chapter?.quiz_questions || [])];
                          questions[qi] = { ...questions[qi], question: e.target.value };
                          setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, quiz_questions: questions } }));
                        }}
                        placeholder="Posez votre question..."
                        className="text-sm"
                      />
                      <div className="space-y-2">
                        {(q.options || []).map((opt: any, oi: number) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const questions = [...(chapterDialog.chapter?.quiz_questions || [])];
                                questions[qi] = {
                                  ...questions[qi],
                                  options: questions[qi].options.map((o: any, idx: number) => ({
                                    ...o,
                                    correct: idx === oi,
                                  })),
                                };
                                setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, quiz_questions: questions } }));
                              }}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 transition-all ${
                                opt.correct ? "border-green-500 bg-green-500 text-white" : "border-border hover:border-primary"
                              }`}
                            >
                              {opt.correct ? "✓" : opt.value?.toUpperCase()}
                            </button>
                            <Input
                              value={opt.label || ""}
                              onChange={e => {
                                const questions = [...(chapterDialog.chapter?.quiz_questions || [])];
                                questions[qi].options[oi] = { ...questions[qi].options[oi], label: e.target.value };
                                setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, quiz_questions: questions } }));
                              }}
                              placeholder={`Option ${opt.value?.toUpperCase() || oi + 1}...`}
                              className="text-sm flex-1"
                            />
                            {(q.options || []).length > 2 && (
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => {
                                const questions = [...(chapterDialog.chapter?.quiz_questions || [])];
                                questions[qi].options.splice(oi, 1);
                                setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, quiz_questions: questions } }));
                              }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {(q.options || []).length < 5 && (
                          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => {
                            const questions = [...(chapterDialog.chapter?.quiz_questions || [])];
                            const letters = "abcdefghij";
                            const newVal = letters[questions[qi].options.length] || `${questions[qi].options.length + 1}`;
                            questions[qi].options.push({ value: newVal, label: "", correct: false });
                            setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, quiz_questions: questions } }));
                          }}>
                            + Ajouter une option
                          </Button>
                        )}
                      </div>
                      <Input
                        value={q.explanation || ""}
                        onChange={e => {
                          const questions = [...(chapterDialog.chapter?.quiz_questions || [])];
                          questions[qi] = { ...questions[qi], explanation: e.target.value };
                          setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, quiz_questions: questions } }));
                        }}
                        placeholder="Explication (affichée si réponse incorrecte)..."
                        className="text-xs"
                      />
                    </Card>
                  ))}

                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Score requis (%)</Label>
                    <Input type="number" value={chapterDialog.chapter.quiz_pass_score || 70} onChange={e => setChapterDialog(p => ({ ...p, chapter: { ...p.chapter!, quiz_pass_score: parseInt(e.target.value) || 70 } }))} className="w-20 h-7 text-xs" />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterDialog({ open: false, chapter: null, courseId: null })}>Annuler</Button>
            <Button onClick={saveChapter} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
