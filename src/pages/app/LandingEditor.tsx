import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DomainSettings } from "@/components/DomainSettings";
import { ReminderConfig } from "@/components/config/ReminderConfig";
import { useLandingPages } from "@/hooks/useLandingPages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Rocket, ArrowLeft, Eye, Undo2, Redo2, Monitor, Smartphone } from "lucide-react";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

function getDefaultLandingHTML(): string {
  return `<section style="min-height:100vh;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%);display:flex;align-items:center;justify-content:center;padding:80px 20px;text-align:center"><div style="max-width:680px;margin:0 auto"><div style="display:inline-block;background:rgba(255,255,255,0.15);color:white;padding:6px 16px;border-radius:99px;font-size:13px;font-weight:600;margin-bottom:20px;letter-spacing:0.5px">⚡ DISPONIBLE MAINTENANT</div><h1 style="font-size:clamp(36px,6vw,64px);font-weight:900;color:white;line-height:1.1;margin:0 0 20px;letter-spacing:-1px">Votre titre principal accrocheur</h1><p style="font-size:20px;color:rgba(255,255,255,0.85);line-height:1.6;margin:0 0 40px;max-width:520px;margin-left:auto;margin-right:auto">Décrivez votre offre en une phrase. Ce que vous faites, pour qui, et quel résultat.</p><a href="#booking" style="display:inline-block;background:white;color:#6366f1;font-weight:800;font-size:18px;padding:18px 48px;border-radius:14px;text-decoration:none;box-shadow:0 8px 32px rgba(0,0,0,0.15)">📅 Réserver un appel gratuit →</a><p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.65)">Sans engagement · Réponse sous 24h</p></div></section><section style="padding:80px 20px;background:#f8fafc"><div style="max-width:900px;margin:0 auto"><h2 style="text-align:center;font-size:36px;font-weight:800;color:#1a1a2e;margin:0 0 12px">Pourquoi choisir cette solution ?</h2><p style="text-align:center;color:#6b7280;font-size:18px;margin:0 0 56px">Trois raisons concrètes</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px"><div style="background:white;border-radius:20px;padding:32px 24px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.06)"><div style="font-size:44px;margin-bottom:16px">⚡</div><h3 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 10px">Rapide</h3><p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0">Description courte du bénéfice concret pour votre client.</p></div><div style="background:white;border-radius:20px;padding:32px 24px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.06)"><div style="font-size:44px;margin-bottom:16px">🎯</div><h3 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 10px">Précis</h3><p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0">Description courte du bénéfice concret pour votre client.</p></div><div style="background:white;border-radius:20px;padding:32px 24px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.06)"><div style="font-size:44px;margin-bottom:16px">🏆</div><h3 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 10px">Prouvé</h3><p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0">Description courte du bénéfice concret pour votre client.</p></div></div></div></section><section id="booking" style="padding:80px 20px;background:white"><div style="max-width:600px;margin:0 auto;text-align:center"><h2 style="font-size:36px;font-weight:800;color:#1a1a2e;margin:0 0 12px">Réservez votre appel</h2><p style="color:#6b7280;font-size:18px;margin:0 0 40px">Choisissez un créneau qui vous convient</p><div id="booking-widget" style="background:#f8fafc;border-radius:20px;padding:40px;border:2px dashed #e5e7eb"><p style="color:#9ca3af;font-size:14px;margin:0">[Le formulaire de réservation s'affiche ici automatiquement]</p></div></div></section><section style="padding:80px 20px;background:#f8fafc"><div style="max-width:800px;margin:0 auto"><h2 style="text-align:center;font-size:36px;font-weight:800;color:#1a1a2e;margin:0 0 48px">Ils nous font confiance</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px"><div style="background:white;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.05)"><div style="color:#f59e0b;font-size:20px;margin-bottom:12px">⭐⭐⭐⭐⭐</div><p style="color:#374151;font-size:15px;line-height:1.7;font-style:italic;margin:0 0 16px">"Résultat concret et rapide. Je recommande vivement."</p><p style="font-weight:700;color:#1a1a2e;font-size:14px;margin:0">— Marie D., Directrice Marketing</p></div><div style="background:white;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.05)"><div style="color:#f59e0b;font-size:20px;margin-bottom:12px">⭐⭐⭐⭐⭐</div><p style="color:#374151;font-size:15px;line-height:1.7;font-style:italic;margin:0 0 16px">"ROI visible dès le premier mois."</p><p style="font-weight:700;color:#1a1a2e;font-size:14px;margin:0">— Ahmed K., CEO Startup</p></div></div></div></section>`;
}

export default function LandingEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { templates, savePage, publishPage, generateLandingAI } = useLandingPages();

  const [page, setPage] = useState<any>({
    title: "Ma Landing Page",
    subtitle: "",
    description: "",
    status: "draft",
    content_html: "",
    has_booking_form: true,
    has_video_room: true,
    primary_color: "#6366f1",
    seo_title: "",
    seo_description: "",
    booking_config: {
      title: "Réserver un appel",
      duration_options: [30, 60],
      available_days: [1, 2, 3, 4, 5],
      available_hours: { start: "09:00", end: "18:00" },
      fields: ["name", "email", "phone", "company", "message"],
    },
    jitsi_config: {
      domain: "meet.jit.si",
      subject: "Appel de découverte",
      auto_record: false,
    },
  });

  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiParams, setAiParams] = useState({ topic: "", keywords: "", audience: "" });
  const [showTemplates, setShowTemplates] = useState(!id);
  const [loadingPage, setLoadingPage] = useState(!!id);
  const [activeTab, setActiveTab] = useState("editor");

  const gjsContainerRef = useRef<HTMLDivElement>(null);
  const gjsRef = useRef<Editor | null>(null);

  useEffect(() => {
    if (id) {
      supabase.from("landing_pages").select("*").eq("id", id).single().then(({ data }) => {
        if (data) setPage(data);
        setLoadingPage(false);
      });
    }
  }, [id]);

  // Init GrapeJS when editor tab is active
  useEffect(() => {
    if (activeTab !== "editor" || showTemplates || !gjsContainerRef.current) return;
    if (gjsRef.current) return; // already initialized

    const editor = grapesjs.init({
      container: gjsContainerRef.current,
      height: "100%",
      width: "auto",
      fromElement: false,
      storageManager: false,
      components: page.content_html || getDefaultLandingHTML(),
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap",
        ],
      },
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Mobile", width: "375px", widthMedia: "480px" },
        ],
      },
      panels: { defaults: [] },
      blockManager: { custom: false },
    });

    // Landing page blocks
    const bm = editor.BlockManager;
    bm.add("lp-hero", {
      label: "🚀 Hero + CTA",
      category: "Landing",
      content: `<section style="padding:80px 40px;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:16px;margin:16px">
        <h1 style="font-size:48px;font-weight:800;margin-bottom:16px">Votre titre accrocheur</h1>
        <p style="font-size:20px;opacity:0.9;margin-bottom:32px">Votre proposition de valeur</p>
        <a href="#booking" style="background:white;color:#6366f1;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">📅 Prendre RDV</a>
      </section>`,
    });
    bm.add("lp-stats", {
      label: "📊 Statistiques",
      category: "Landing",
      content: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:40px 20px">
        <div style="text-align:center;padding:24px;background:#f8fafc;border-radius:12px"><div style="font-size:36px;font-weight:800;color:#6366f1">10+</div><p style="color:#6b7280;margin-top:8px">Années d'expérience</p></div>
        <div style="text-align:center;padding:24px;background:#f8fafc;border-radius:12px"><div style="font-size:36px;font-weight:800;color:#6366f1">50+</div><p style="color:#6b7280;margin-top:8px">Clients satisfaits</p></div>
        <div style="text-align:center;padding:24px;background:#f8fafc;border-radius:12px"><div style="font-size:36px;font-weight:800;color:#6366f1">98%</div><p style="color:#6b7280;margin-top:8px">Satisfaction</p></div>
      </div>`,
    });
    bm.add("lp-testimonials", {
      label: "⭐ Témoignages",
      category: "Landing",
      content: `<section style="padding:48px 20px"><h2 style="text-align:center;font-size:28px;font-weight:700;margin-bottom:32px">Ils me font confiance</h2>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:800px;margin:0 auto">
          <div style="background:#f8fafc;border-radius:12px;padding:20px"><div style="color:#f59e0b;font-size:18px;margin-bottom:8px">⭐⭐⭐⭐⭐</div><p style="color:#374151;font-style:italic;margin-bottom:12px">"Excellent accompagnement."</p><p style="font-weight:600;font-size:14px">— Marie D.</p></div>
          <div style="background:#f8fafc;border-radius:12px;padding:20px"><div style="color:#f59e0b;font-size:18px;margin-bottom:8px">⭐⭐⭐⭐⭐</div><p style="color:#374151;font-style:italic;margin-bottom:12px">"ROI visible dès le premier mois."</p><p style="font-weight:600;font-size:14px">— Ahmed K.</p></div>
        </div></section>`,
    });
    bm.add("lp-booking", {
      label: "📅 Section RDV",
      category: "Landing",
      content: `<section id="booking" style="padding:60px 20px;text-align:center;background:#f8fafc">
        <h2 style="font-size:28px;font-weight:700;margin-bottom:8px">Réservez votre appel</h2>
        <p style="color:#6b7280;margin-bottom:32px">Choisissez un créneau qui vous convient</p>
        <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;padding:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">[Formulaire RDV injecté automatiquement]</div>
      </section>`,
    });
    bm.add("lp-video", {
      label: "🎥 Salle Visio",
      category: "Landing",
      content: `<section style="padding:40px 20px;text-align:center"><div style="background:#f0f0ff;border-radius:16px;padding:40px;max-width:640px;margin:0 auto"><p style="font-size:20px;margin-bottom:8px">🎥 Salle de visioconférence</p><p style="color:#6b7280;font-size:14px">Jitsi Meet intégré — aucune installation requise</p></div></section>`,
    });
    bm.add("lp-text", {
      label: "📝 Texte",
      category: "Structure",
      content: `<p style="color:#374151;font-size:16px;line-height:1.7;padding:0 24px;margin:16px 0">Votre texte ici...</p>`,
    });
    bm.add("lp-heading", {
      label: "📌 Titre",
      category: "Structure",
      content: `<h2 style="color:#1a1a2e;font-size:28px;font-weight:700;padding:0 24px;margin:24px 0 12px;text-align:center">Titre de section</h2>`,
    });
    bm.add("lp-spacer", {
      label: "⬜ Espace",
      category: "Structure",
      content: `<div style="height:40px"></div>`,
    });
    bm.add("lp-image", {
      label: "🖼 Image",
      category: "Structure",
      content: { type: "image", style: { "max-width": "100%", padding: "16px 24px", "border-radius": "12px" } },
    });
    bm.add("lp-cta-button", {
      label: "🔘 Bouton CTA",
      category: "Structure",
      content: `<div style="text-align:center;padding:24px"><a href="#booking" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:16px">Réserver maintenant →</a></div>`,
    });
    bm.add("lp-benefits", {
      label: "✨ 3 avantages",
      category: "Landing",
      content: `<section style="padding:72px 20px;background:#f8fafc"><div style="max-width:900px;margin:0 auto"><h2 style="text-align:center;font-size:34px;font-weight:800;color:#1a1a2e;margin:0 0 48px">Pourquoi nous choisir ?</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px"><div style="background:white;border-radius:16px;padding:28px;text-align:center"><p style="font-size:40px;margin:0 0 12px">⚡</p><p style="font-weight:700;font-size:18px;color:#1a1a2e;margin:0 0 8px">Titre</p><p style="color:#6b7280;font-size:14px;margin:0">Description du bénéfice</p></div><div style="background:white;border-radius:16px;padding:28px;text-align:center"><p style="font-size:40px;margin:0 0 12px">🎯</p><p style="font-weight:700;font-size:18px;color:#1a1a2e;margin:0 0 8px">Titre</p><p style="color:#6b7280;font-size:14px;margin:0">Description du bénéfice</p></div><div style="background:white;border-radius:16px;padding:28px;text-align:center"><p style="font-size:40px;margin:0 0 12px">🏆</p><p style="font-weight:700;font-size:18px;color:#1a1a2e;margin:0 0 8px">Titre</p><p style="color:#6b7280;font-size:14px;margin:0">Description du bénéfice</p></div></div></div></section>`,
    });
    bm.add("lp-faq", {
      label: "❓ FAQ",
      category: "Landing",
      content: `<section style="padding:72px 20px;background:white"><div style="max-width:680px;margin:0 auto"><h2 style="text-align:center;font-size:34px;font-weight:800;color:#1a1a2e;margin:0 0 48px">Questions fréquentes</h2><div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:12px"><p style="font-weight:700;color:#1a1a2e;margin:0 0 8px">Votre question ici ?</p><p style="color:#6b7280;font-size:15px;margin:0;line-height:1.6">Votre réponse détaillée ici.</p></div><div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:12px"><p style="font-weight:700;color:#1a1a2e;margin:0 0 8px">Autre question ?</p><p style="color:#6b7280;font-size:15px;margin:0;line-height:1.6">Réponse claire et concise.</p></div></div></section>`,
    });
    bm.add("lp-cta-final", {
      label: "🎯 CTA final",
      category: "Landing",
      content: `<section style="padding:80px 20px;background:#1a1a2e;text-align:center"><div style="max-width:600px;margin:0 auto"><h2 style="font-size:40px;font-weight:900;color:white;margin:0 0 16px">Prêt à commencer ?</h2><p style="color:rgba(255,255,255,0.7);font-size:18px;margin:0 0 40px;line-height:1.6">Prenez rendez-vous maintenant. Premier appel gratuit.</p><a href="#booking" style="display:inline-block;background:#6366f1;color:white;font-weight:800;font-size:18px;padding:18px 52px;border-radius:14px;text-decoration:none">Réserver maintenant →</a></div></section>`,
    });

    gjsRef.current = editor;

    return () => {
      editor.destroy();
      gjsRef.current = null;
    };
  }, [activeTab, showTemplates]);

  const updatePage = (key: string, value: any) => setPage((p: any) => ({ ...p, [key]: value }));
  const updateBookingConfig = (key: string, value: any) =>
    setPage((p: any) => ({ ...p, booking_config: { ...p.booking_config, [key]: value } }));

  const handleSave = async (publish = false) => {
    setSaving(true);
    try {
      // Sync HTML from GrapeJS
      if (gjsRef.current) {
        const html = gjsRef.current.getHtml();
        const css = gjsRef.current.getCss();
        page.content_html = css ? `<style>${css}</style>${html}` : html;
      }
      const saved = await savePage(page, id);
      if (publish && saved?.id) {
        await publishPage(saved.id);
      }
      navigate("/app/landing");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const result = await generateLandingAI({
        topic: aiParams.topic,
        keywords: aiParams.keywords.split(",").map(k => k.trim()),
        target_audience: aiParams.audience,
      });
      if (result?.content_html) {
        updatePage("content_html", result.content_html);
        if (result.title) updatePage("title", result.title);
        if (result.seo_description) updatePage("seo_description", result.seo_description);
        // Load into GrapeJS if active
        if (gjsRef.current) {
          gjsRef.current.setComponents(result.content_html);
        }
      }
    } finally {
      setAiLoading(false);
    }
  };

  const applyTemplate = (template: any) => {
    setPage((prev: any) => ({
      ...prev,
      content_html: template.content_html,
      ...(template.default_config || {}),
    }));
    setShowTemplates(false);
  };

  if (loadingPage) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (showTemplates) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Choisir un template</h1>
        <p className="text-muted-foreground mb-6">Commencez avec un template ou créez depuis zéro.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-dashed border-2" onClick={() => setShowTemplates(false)}>
            <p className="text-3xl mb-3">✏️</p>
            <h3 className="font-semibold mb-1">Page vierge</h3>
            <p className="text-xs text-muted-foreground">Commencer depuis zéro avec l'éditeur visuel</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-primary/30" onClick={() => { setShowTemplates(false); }}>
            <p className="text-3xl mb-3">🤖</p>
            <h3 className="font-semibold mb-1">Générer avec IA</h3>
            <p className="text-xs text-muted-foreground">Décrivez votre activité, l'IA crée la page</p>
          </Card>
          {templates.map(t => (
            <Card key={t.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => applyTemplate(t)}>
              <p className="text-3xl mb-3">📄</p>
              <h3 className="font-semibold mb-1">{t.name}</h3>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col overflow-hidden">
      {/* Top toolbar */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-border/30 bg-card/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate("/app/landing")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Retour
          </Button>
          <Input
            value={page.title}
            onChange={e => updatePage("title", e.target.value)}
            className="h-8 text-xs font-semibold w-48 bg-transparent border-none focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-1">
          {activeTab === "editor" && gjsRef.current && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => gjsRef.current?.UndoManager.undo()}>
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => gjsRef.current?.UndoManager.redo()}>
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => gjsRef.current?.setDevice("Desktop")}>
                <Monitor className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => gjsRef.current?.setDevice("Mobile")}>
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                if (gjsRef.current) gjsRef.current.runCommand("preview");
              }}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <div className="w-px h-5 bg-border/30 mx-1" />
            </>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Sauver
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => handleSave(true)} disabled={saving}>
            <Rocket className="w-3.5 h-3.5 mr-1" /> Publier
          </Button>
        </div>
      </div>

      {/* Tabs row */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="h-9 rounded-none border-b border-border/30 bg-card/50 px-2 justify-start">
          <TabsTrigger value="editor" className="text-xs">🎨 Éditeur visuel</TabsTrigger>
          <TabsTrigger value="config" className="text-xs">⚙️ Configuration</TabsTrigger>
          <TabsTrigger value="booking" className="text-xs">📅 RDV</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">🔍 SEO</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">🤖 IA</TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs">🔔 Rappels</TabsTrigger>
          {id && <TabsTrigger value="domain" className="text-xs">🌐 Domaine</TabsTrigger>}
        </TabsList>

        {/* GrapeJS visual editor */}
        <TabsContent value="editor" className="flex-1 overflow-hidden m-0 p-0">
          <div className="h-full" ref={gjsContainerRef} />
        </TabsContent>

        {/* Config tab */}
        <TabsContent value="config" className="overflow-y-auto p-4">
          <Card className="p-4 space-y-4 max-w-2xl mx-auto">
            <div>
              <Label>Titre</Label>
              <Input value={page.title} onChange={e => updatePage("title", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input value={page.subtitle || ""} onChange={e => updatePage("subtitle", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={page.description || ""} onChange={e => updatePage("description", e.target.value)} className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Couleur principale</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={page.primary_color || "#6366f1"} onChange={e => updatePage("primary_color", e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                <Input value={page.primary_color || ""} onChange={e => updatePage("primary_color", e.target.value)} className="w-32 font-mono text-xs" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Salle de visioconférence</Label>
                <p className="text-xs text-muted-foreground">Jitsi Meet — gratuit, open source</p>
              </div>
              <Switch checked={page.has_video_room} onCheckedChange={v => updatePage("has_video_room", v)} />
            </div>
            {page.has_video_room && (
              <div>
                <Label>Domaine Jitsi</Label>
                <Input value={page.jitsi_config?.domain || "meet.jit.si"} onChange={e => setPage((p: any) => ({ ...p, jitsi_config: { ...p.jitsi_config, domain: e.target.value } }))} className="mt-1" />
              </div>
            )}
            <div className="pt-4 border-t border-border/30">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  if (confirm("Réinitialiser avec le template par défaut ? Le contenu actuel sera perdu.")) {
                    const html = getDefaultLandingHTML();
                    updatePage("content_html", html);
                    if (gjsRef.current) gjsRef.current.setComponents(html);
                  }
                }}>
                🔄 Réinitialiser le template
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Booking tab */}
        <TabsContent value="booking" className="overflow-y-auto p-4">
          <Card className="p-4 space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <Label>Activer le formulaire de RDV</Label>
              <Switch checked={page.has_booking_form} onCheckedChange={v => updatePage("has_booking_form", v)} />
            </div>
            {page.has_booking_form && (
              <>
                <div>
                  <Label>Titre du formulaire</Label>
                  <Input value={page.booking_config?.title || ""} onChange={e => updateBookingConfig("title", e.target.value)} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Heure de début</Label>
                    <Input type="time" value={page.booking_config?.available_hours?.start || "09:00"} onChange={e => updateBookingConfig("available_hours", { ...page.booking_config?.available_hours, start: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Heure de fin</Label>
                    <Input type="time" value={page.booking_config?.available_hours?.end || "18:00"} onChange={e => updateBookingConfig("available_hours", { ...page.booking_config?.available_hours, end: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Durées proposées (minutes)</Label>
                  <Input value={(page.booking_config?.duration_options || [30]).join(", ")} onChange={e => updateBookingConfig("duration_options", e.target.value.split(",").map(v => parseInt(v.trim())).filter(Boolean))} className="mt-1" />
                </div>
                <div>
                  <Label>Jours disponibles</Label>
                  <div className="flex gap-2 mt-1">
                    {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day, i) => (
                      <button key={i} onClick={() => {
                        const days = page.booking_config?.available_days || [1,2,3,4,5];
                        updateBookingConfig("available_days", days.includes(i) ? days.filter((d: number) => d !== i) : [...days, i]);
                      }} className={`px-2 py-1 rounded text-xs transition-colors ${(page.booking_config?.available_days || []).includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* SEO tab */}
        <TabsContent value="seo" className="overflow-y-auto p-4">
          <Card className="p-4 space-y-4 max-w-2xl mx-auto">
            <div>
              <Label>Titre SEO</Label>
              <Input value={page.seo_title || ""} onChange={e => updatePage("seo_title", e.target.value)} className="mt-1" placeholder={page.title} />
              <p className="text-xs text-muted-foreground mt-1">{(page.seo_title || page.title || "").length}/60</p>
            </div>
            <div>
              <Label>Description SEO</Label>
              <Textarea value={page.seo_description || ""} onChange={e => updatePage("seo_description", e.target.value)} className="mt-1" rows={3} />
              <p className="text-xs text-muted-foreground mt-1">{(page.seo_description || "").length}/160</p>
            </div>
            <div>
              <Label>Image OG</Label>
              <Input value={page.og_image_url || ""} onChange={e => updatePage("og_image_url", e.target.value)} className="mt-1" placeholder="https://..." />
            </div>
          </Card>
        </TabsContent>

        {/* AI tab */}
        <TabsContent value="ai" className="overflow-y-auto p-4">
          <Card className="p-4 space-y-4 max-w-2xl mx-auto">
            <h3 className="font-semibold text-sm">🤖 Générer le contenu avec l'IA</h3>
            <div>
              <Label>Votre activité / sujet</Label>
              <Input value={aiParams.topic} onChange={e => setAiParams(p => ({ ...p, topic: e.target.value }))} className="mt-1" placeholder="Ex: Coach business pour entrepreneurs" />
            </div>
            <div>
              <Label>Mots-clés (séparés par des virgules)</Label>
              <Input value={aiParams.keywords} onChange={e => setAiParams(p => ({ ...p, keywords: e.target.value }))} className="mt-1" placeholder="coaching, business, stratégie" />
            </div>
            <div>
              <Label>Audience cible</Label>
              <Input value={aiParams.audience} onChange={e => setAiParams(p => ({ ...p, audience: e.target.value }))} className="mt-1" placeholder="Ex: Dirigeants de PME" />
            </div>
            <Button onClick={handleGenerateAI} disabled={aiLoading || !aiParams.topic} className="w-full">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "🤖"} Générer le contenu
            </Button>
          </Card>
        </TabsContent>

        {/* Reminders tab */}
        <TabsContent value="reminders" className="overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            <ReminderConfig
              config={page.reminder_config || {}}
              onChange={(reminderConfig) => updatePage("reminder_config", reminderConfig)}
            />
          </div>
        </TabsContent>

        {/* Domain tab */}
        {id && (
          <TabsContent value="domain" className="overflow-y-auto p-4">
            <Card className="p-4 max-w-2xl mx-auto">
              <DomainSettings pageId={id} pageSlug={page.slug || ""} />
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
