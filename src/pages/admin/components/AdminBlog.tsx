import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Eye, EyeOff, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

// ─── Article List ───────────────────────────────────────────

export default function AdminBlog() {
  const [articles, setArticles] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "editor">("list");
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadArticles = async () => {
    const { data } = await supabase
      .from("blog_articles")
      .select("id,title,slug,status,category,published_at,view_count,has_lead_magnet,reading_time_minutes,updated_at")
      .order("updated_at", { ascending: false });
    setArticles(data || []);
    setLoading(false);
  };

  useEffect(() => { loadArticles(); }, []);

  if (view === "editor") {
    return (
      <ArticleEditor
        article={editingArticle}
        onSave={async (data: any) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toast.error("Non connecté"); return; }
            const saveData = { ...data };
            // Remove non-DB fields
            delete saveData.phone_number;
            if (editingArticle?.id) {
              const { error } = await supabase.from("blog_articles")
                .update({ ...saveData, updated_at: new Date().toISOString() })
                .eq("id", editingArticle.id);
              if (error) throw error;
            } else {
              saveData.author_id = user.id;
              const { error } = await supabase.from("blog_articles").insert(saveData);
              if (error) throw error;
            }
            toast.success("Article sauvegardé ✓");
            setView("list");
            loadArticles();
          } catch (e: any) {
            toast.error("Erreur sauvegarde : " + (e.message || "Erreur inconnue"));
          }
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Articles de blog</h2>
          <p className="text-sm text-muted-foreground">{articles.length} articles</p>
        </div>
        <Button onClick={() => { setEditingArticle(null); setView("editor"); }}>
          <Plus className="w-4 h-4 mr-2" /> Nouvel article
        </Button>
      </div>

      <div className="space-y-2">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />)
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">📝</p>
            <p className="text-sm">Aucun article. Créez le premier !</p>
          </div>
        ) : articles.map(article => (
          <Card key={article.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate">{article.title}</h3>
                  <Badge variant={article.status === "published" ? "default" : "outline"} className="text-xs shrink-0">
                    {article.status}
                  </Badge>
                  {article.has_lead_magnet && (
                    <Badge className="text-xs bg-amber-500/10 text-amber-600 shrink-0">🎁 Magnet</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>/{article.slug}</span>
                  <span>·</span>
                  <span>{article.reading_time_minutes}min</span>
                  <span>·</span>
                  <span>{article.view_count} vues</span>
                  <span>·</span>
                  <span>{new Date(article.updated_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <Button size="sm" variant="ghost" onClick={() => { setEditingArticle(article); setView("editor"); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={async () => {
                  const newStatus = article.status === "published" ? "draft" : "published";
                  await supabase.from("blog_articles")
                    .update({ status: newStatus, published_at: newStatus === "published" ? new Date().toISOString() : null })
                    .eq("id", article.id);
                  loadArticles();
                }}>
                  {article.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                  if (confirm("Supprimer cet article ?")) {
                    await supabase.from("blog_articles").delete().eq("id", article.id);
                    loadArticles();
                  }
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── useArticleEditor Hook ──────────────────────────────────

function useArticleEditor(article: any) {
  const [form, setForm] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    excerpt: article?.excerpt || "",
    content_html: article?.content_html || "",
    seo_title: article?.seo_title || "",
    seo_description: article?.seo_description || "",
    seo_keywords: article?.seo_keywords || [] as string[],
    category: article?.category || "general",
    tags: article?.tags || [] as string[],
    has_lead_magnet: article?.has_lead_magnet || false,
    lead_magnet_id: article?.lead_magnet_id || null as string | null,
    status: article?.status || "draft",
    reading_time_minutes: article?.reading_time_minutes || 5,
    og_image_url: article?.og_image_url || "",
    phone_number: "",
  });
  const [aiLoading, setAiLoading] = useState(false);

  const callAI = async (action: string, payload: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/blog-ai-generator`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ action, payload }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
    return res.json();
  };

  const generateArticle = async (params: any) => {
    setAiLoading(true);
    try {
      const result = await callAI("generate_article", {
        topic: params.topic, keywords: params.keywords, target_audience: params.audience,
        article_type: params.type, word_count: params.wordCount,
        phone_number: params.phone, website_url: params.website, include_lead_magnet: true,
      });
      setForm(prev => ({
        ...prev,
        title: result.title || prev.title, slug: result.slug || prev.slug,
        excerpt: result.excerpt || prev.excerpt, content_html: result.content_html || prev.content_html,
        seo_title: result.seo_title || prev.seo_title, seo_description: result.seo_description || prev.seo_description,
        seo_keywords: result.seo_keywords || prev.seo_keywords,
        reading_time_minutes: result.reading_time_minutes || prev.reading_time_minutes,
      }));
      toast.success("Article généré ✓");
      return result;
    } finally { setAiLoading(false); }
  };

  const generateImagePrompt = async (context: string) => {
    setAiLoading(true);
    try {
      return await callAI("generate_image_prompt", { article_title: form.title, section_context: context });
    } finally { setAiLoading(false); }
  };

  const optimizeSEO = async () => {
    setAiLoading(true);
    try {
      const result = await callAI("optimize_seo", {
        title: form.title, content_html: form.content_html,
        target_keyword: form.seo_keywords?.[0], phone_number: form.phone_number,
      });
      setForm(prev => ({
        ...prev,
        seo_title: result.seo_title || prev.seo_title,
        seo_description: result.seo_description || prev.seo_description,
      }));
      toast.success("SEO optimisé ✓");
      return result;
    } finally { setAiLoading(false); }
  };

  return { form, setForm, aiLoading, generateArticle, generateImagePrompt, optimizeSEO };
}

// ─── Article Editor ─────────────────────────────────────────

interface ArticleEditorProps {
  article: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
  const { form, setForm, aiLoading, generateArticle, generateImagePrompt, optimizeSEO } = useArticleEditor(article);
  const editorRef = useRef<Editor | null>(null);
  const gjsContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("seo");

  const [gjsReady, setGjsReady] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(!article?.id);

  // Load full article content if editing
  useEffect(() => {
    if (!article?.id) return;
    supabase.from("blog_articles").select("*").eq("id", article.id).single()
      .then(({ data }) => {
        if (data) {
          setForm(prev => ({
            ...prev,
            content_html: data.content_html || "",
            excerpt: data.excerpt || "",
            seo_title: data.seo_title || "",
            seo_description: data.seo_description || "",
            seo_keywords: data.seo_keywords || [],
            og_image_url: data.og_image_url || "",
            has_lead_magnet: data.has_lead_magnet || false,
            lead_magnet_id: data.lead_magnet_id || null,
          }));
          // Sync to GrapeJS if already initialized
          if (editorRef.current && data.content_html) {
            editorRef.current.setComponents(data.content_html);
          }
        }
        setContentLoaded(true);
      });
  }, [article?.id]);

  // Init GrapeJS
  useEffect(() => {
    if (!gjsContainerRef.current || editorRef.current || !contentLoaded) return;

    const editor = grapesjs.init({
      container: gjsContainerRef.current,
      height: "100%",
      width: "auto",
      fromElement: false,
      storageManager: false,
      plugins: [],
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap",
        ],
      },
      blockManager: {
        blocks: [
          { id: "paragraph", label: "Paragraphe", content: "<p>Votre texte ici...</p>", category: "Texte" },
          { id: "heading2", label: "Titre H2", content: "<h2>Titre de section</h2>", category: "Texte" },
          { id: "heading3", label: "Titre H3", content: "<h3>Sous-titre</h3>", category: "Texte" },
          {
            id: "image_caption", label: "Image + Légende", category: "Média",
            content: `<figure><img src="https://placehold.co/800x400/6366f1/white?text=Image" alt="Description" style="width:100%;border-radius:8px"/><figcaption style="text-align:center;color:#6b7280;font-size:14px;margin-top:8px">Légende</figcaption></figure>`,
          },
          {
            id: "cta_block", label: "Bloc CTA", category: "Marketing",
            content: `<div style="background:#f0f0ff;border-radius:12px;padding:24px;text-align:center;margin:24px 0"><h3 style="color:#6366f1;margin-bottom:8px">Prêt à transformer vos réunions ?</h3><p style="color:#6b7280;margin-bottom:16px">Essayez RapidoMeet gratuitement.</p><a href="https://app.rapidomeet.io" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Commencer →</a></div>`,
          },
          {
            id: "lead_magnet_block", label: "🎁 Leads Magnet", category: "Marketing",
            content: `<div style="background:#fef9f0;border:2px solid #f59e0b;border-radius:12px;padding:24px;margin:32px 0"><h3 style="color:#92400e">📥 Téléchargez gratuitement</h3><p style="color:#78350f">[Titre du leads magnet]</p></div>`,
          },
          {
            id: "faq_item", label: "Question FAQ", category: "Texte",
            content: `<details style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:8px"><summary style="cursor:pointer;font-weight:600;color:#1a1a2e">Question ?</summary><p style="margin-top:12px;color:#6b7280">Réponse.</p></details>`,
          },
          {
            id: "stats_block", label: "📊 Statistiques", category: "Marketing",
            content: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:24px 0"><div style="text-align:center;background:#f8fafc;border-radius:8px;padding:16px"><div style="font-size:32px;font-weight:800;color:#6366f1">80%</div><div style="font-size:13px;color:#6b7280">des infos perdues en 24h</div></div><div style="text-align:center;background:#f8fafc;border-radius:8px;padding:16px"><div style="font-size:32px;font-weight:800;color:#6366f1">45min</div><div style="font-size:13px;color:#6b7280">économisées par réunion</div></div><div style="text-align:center;background:#f8fafc;border-radius:8px;padding:16px"><div style="font-size:32px;font-weight:800;color:#6366f1">2min</div><div style="font-size:13px;color:#6b7280">pour analyser 1h</div></div></div>`,
          },
        ],
      },
    });

    if (form.content_html) {
      editor.setComponents(form.content_html);
    }

    editor.on("change:changesCount", () => {
      const html = editor.getHtml();
      setForm(prev => ({ ...prev, content_html: html }));
    });

    editorRef.current = editor;
    setGjsReady(true);

    return () => {
      editor.destroy();
      editorRef.current = null;
      setGjsReady(false);
    };
  }, [contentLoaded]);

  // Sync content when AI generates
  const applyContent = useCallback((html: string) => {
    if (editorRef.current) {
      editorRef.current.setComponents(html);
      setForm(prev => ({ ...prev, content_html: html }));
    }
  }, [setForm]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 shrink-0">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <Input
          value={form.title}
          onChange={e => setForm(prev => ({
            ...prev, title: e.target.value,
            slug: prev.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
          }))}
          placeholder="Titre de l'article..."
          className="flex-1 border-0 text-lg font-bold bg-transparent focus-visible:ring-0 px-0"
        />
        <Badge variant="outline">{form.status}</Badge>
        <Button variant="outline" size="sm" onClick={() => onSave({ ...form, status: "draft" })}>Brouillon</Button>
        <Button size="sm" onClick={() => onSave({ ...form, status: "published", published_at: new Date().toISOString() })}>Publier</Button>
      </div>

      {/* Body: 3 columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-60 border-r border-border/30 overflow-y-auto hidden lg:block p-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-3">
              <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
              <TabsTrigger value="images" className="text-xs">Images</TabsTrigger>
              <TabsTrigger value="magnet" className="text-xs">Magnet</TabsTrigger>
            </TabsList>

            <TabsContent value="seo" className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Slug URL</label>
                <Input value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} className="text-xs mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Excerpt</label>
                <Textarea value={form.excerpt} onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))} className="text-xs mt-1" rows={3} maxLength={160} />
                <p className="text-xs text-muted-foreground mt-0.5">{form.excerpt.length}/160</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Titre SEO (60 max)</label>
                <Input value={form.seo_title} onChange={e => setForm(prev => ({ ...prev, seo_title: e.target.value }))} className="text-xs mt-1" maxLength={60} />
                <p className="text-xs text-muted-foreground mt-0.5">{form.seo_title.length}/60</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Meta description (155 max)</label>
                <Textarea value={form.seo_description} onChange={e => setForm(prev => ({ ...prev, seo_description: e.target.value }))} className="text-xs mt-1" rows={3} maxLength={155} />
                <p className="text-xs text-muted-foreground mt-0.5">{form.seo_description.length}/155</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["general", "productivite", "ia", "management", "commercial", "tutoriel"].map(c => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Mots-clés</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.seo_keywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs cursor-pointer"
                      onClick={() => setForm(prev => ({ ...prev, seo_keywords: prev.seo_keywords.filter((_, j) => j !== i) }))}>
                      {kw} ✕
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Image OG</label>
                <Input type="url" placeholder="URL image OG" value={form.og_image_url}
                  onChange={e => setForm(prev => ({ ...prev, og_image_url: e.target.value }))} className="text-xs mt-1" />
              </div>
              <ArticleImageGallery articleId={article?.id} />
            </TabsContent>

            <TabsContent value="magnet" className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.has_lead_magnet} onCheckedChange={v => setForm(prev => ({ ...prev, has_lead_magnet: v }))} />
                <label className="text-xs font-medium">Activer leads magnet</label>
              </div>
              {form.has_lead_magnet && (
                <LeadMagnetPicker value={form.lead_magnet_id} onChange={(id: string) => setForm(prev => ({ ...prev, lead_magnet_id: id }))} />
              )}
            </TabsContent>
          </Tabs>
        </aside>

        {/* GrapeJS Editor */}
        <div className="flex-1 overflow-hidden relative">
          {!contentLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <div ref={gjsContainerRef} className="h-full [&_.gjs-cv-canvas]:!w-full" />
        </div>

        {/* AI Panel right */}
        <aside className="w-72 border-l border-border/30 overflow-y-auto hidden lg:flex flex-col">
          <AIAssistantPanel
            form={form}
            aiLoading={aiLoading}
            onGenerateArticle={generateArticle}
            onGenerateImagePrompt={generateImagePrompt}
            onOptimizeSEO={optimizeSEO}
            onApplyContent={applyContent}
          />
        </aside>
      </div>
    </div>
  );
}

// ─── AI Assistant Panel ─────────────────────────────────────

function AIAssistantPanel({ form, aiLoading, onGenerateArticle, onGenerateImagePrompt, onOptimizeSEO, onApplyContent }: any) {
  const [genParams, setGenParams] = useState({
    topic: "", keywords: "", type: "guide pratique", wordCount: 1500, phone: "", website: "https://rapidomeet.io",
  });
  const [imageContext, setImageContext] = useState("");
  const [imagePrompts, setImagePrompts] = useState<any[]>([]);
  const [seoResult, setSeoResult] = useState<any>(null);

  return (
    <div className="p-3 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">🤖 Assistant IA</h3>

      {/* Generate article */}
      <div className="rounded-lg border border-border/30 p-3 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Générer l'article</h4>
        <Input placeholder="Sujet..." value={genParams.topic} onChange={e => setGenParams(p => ({ ...p, topic: e.target.value }))} className="text-xs" />
        <Input placeholder="Mots-clés (virgule)" value={genParams.keywords} onChange={e => setGenParams(p => ({ ...p, keywords: e.target.value }))} className="text-xs" />
        <Input placeholder="Téléphone (SEO local)" value={genParams.phone} onChange={e => setGenParams(p => ({ ...p, phone: e.target.value }))} className="text-xs" />
        <Select value={genParams.type} onValueChange={v => setGenParams(p => ({ ...p, type: v }))}>
          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["guide pratique", "liste conseils", "étude de cas", "comparatif", "tutoriel", "tendances"].map(t => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="w-full text-xs" size="sm" disabled={!genParams.topic || aiLoading}
          onClick={async () => {
            const result = await onGenerateArticle({
              topic: genParams.topic, keywords: genParams.keywords.split(",").map((k: string) => k.trim()).filter(Boolean),
              type: genParams.type, wordCount: genParams.wordCount, phone: genParams.phone, website: genParams.website,
            });
            if (result?.content_html) onApplyContent(result.content_html);
          }}>
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <span className="mr-1">✨</span>}
          Générer l'article
        </Button>
      </div>

      {/* Image prompts */}
      <div className="rounded-lg border border-border/30 p-3 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Prompt image IA</h4>
        <Textarea placeholder="Décrivez le paragraphe à illustrer..." value={imageContext}
          onChange={e => setImageContext(e.target.value)} rows={3} className="text-xs" />
        <Button className="w-full text-xs" size="sm" variant="outline" disabled={!imageContext || aiLoading}
          onClick={async () => {
            const result = await onGenerateImagePrompt(imageContext);
            if (result?.prompts) setImagePrompts(result.prompts);
          }}>
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <span className="mr-1">🎨</span>}
          Générer prompts
        </Button>
        {imagePrompts.map((p: any, i: number) => (
          <div key={i} className="rounded-lg bg-muted/20 p-2 text-xs space-y-1">
            <p className="font-medium">{p.label}</p>
            <p className="text-muted-foreground line-clamp-3">{p.prompt}</p>
            <Button size="sm" variant="ghost" className="text-xs h-6 w-full"
              onClick={() => { navigator.clipboard.writeText(p.prompt); toast.success("Prompt copié !"); }}>
              📋 Copier
            </Button>
          </div>
        ))}
      </div>

      {/* SEO */}
      <div className="rounded-lg border border-border/30 p-3 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Optimisation SEO</h4>
        <Button className="w-full text-xs" size="sm" variant="outline" disabled={!form.title || aiLoading}
          onClick={async () => { const r = await onOptimizeSEO(); if (r) setSeoResult(r); }}>
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <span className="mr-1">🔍</span>}
          Analyser et optimiser
        </Button>
        {seoResult && (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lisibilité</span>
              <span className="font-bold">{seoResult.readability_score || "—"}/100</span>
            </div>
            {seoResult.improvements?.map((tip: string, i: number) => (
              <div key={i} className="flex gap-1 text-muted-foreground"><span>•</span><span>{tip}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Article Image Gallery ──────────────────────────────────

function ArticleImageGallery({ articleId }: { articleId?: string }) {
  const [images, setImages] = useState<any[]>([]);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    if (!articleId) return;
    supabase.from("blog_images").select("*").eq("article_id", articleId)
      .then(({ data }) => setImages(data || []));
  }, [articleId]);

  const addImageByUrl = async () => {
    if (!urlInput.trim() || !articleId) return;
    const { data } = await supabase.from("blog_images")
      .insert({ article_id: articleId, url: urlInput, generated_by_ai: false })
      .select().single();
    if (data) { setImages(prev => [...prev, data]); setUrlInput(""); }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <Input placeholder="URL de l'image..." value={urlInput} onChange={e => setUrlInput(e.target.value)} className="text-xs flex-1" />
        <Button size="sm" onClick={addImageByUrl} disabled={!articleId}>+</Button>
      </div>
      {!articleId && <p className="text-xs text-muted-foreground">Sauvegardez d'abord l'article</p>}
      <div className="grid grid-cols-2 gap-1">
        {images.map(img => (
          <div key={img.id} className="relative group aspect-video rounded overflow-hidden bg-muted/30">
            <img src={img.url} alt={img.alt_text || ""} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <Button size="sm" variant="ghost" className="text-white h-7 text-xs"
                onClick={() => { navigator.clipboard.writeText(img.url); toast.success("URL copiée"); }}>📋</Button>
              <Button size="sm" variant="ghost" className="text-white h-7 text-xs"
                onClick={async () => {
                  await supabase.from("blog_images").delete().eq("id", img.id);
                  setImages(prev => prev.filter(i => i.id !== img.id));
                }}>🗑</Button>
            </div>
            {img.generated_by_ai && <Badge className="absolute top-1 left-1 text-xs">AI</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Lead Magnet Picker ─────────────────────────────────────

function LeadMagnetPicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const [magnets, setMagnets] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("leads_magnets").select("id,title,type").eq("is_active", true)
      .then(({ data }) => setMagnets(data || []));
  }, []);

  return (
    <div className="space-y-2">
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="text-xs"><SelectValue placeholder="Choisir un leads magnet" /></SelectTrigger>
        <SelectContent>
          {magnets.map(m => (
            <SelectItem key={m.id} value={m.id} className="text-xs">{m.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!magnets.length && <p className="text-xs text-muted-foreground">Créez d'abord un leads magnet</p>}
    </div>
  );
}
