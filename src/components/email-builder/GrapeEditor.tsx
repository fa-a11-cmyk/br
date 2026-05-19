import { useEffect, useRef, useState } from "react";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import newsletterPreset from "grapesjs-preset-newsletter";
import { EmailTemplate } from "./EmailTemplates";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Smartphone, Tablet, Undo2, Redo2, Save, Send, Eye, Code, Layers, Paintbrush, ChevronLeft, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  template: EmailTemplate;
  onBack: () => void;
}

const GrapeEditor = ({ template, onBack }: Props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const gjsRef = useRef<Editor | null>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activePanel, setActivePanel] = useState<"blocks" | "styles" | "layers" | "none">(isMobile ? "none" : "blocks");
  const [previewMode, setPreviewMode] = useState(false);
  const [viewCode, setViewCode] = useState(false);
  const [htmlCode, setHtmlCode] = useState("");

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = grapesjs.init({
      container: editorRef.current,
      height: "100%",
      width: "auto",
      fromElement: false,
      storageManager: false,
      plugins: [newsletterPreset],
      pluginsOpts: {
        [newsletterPreset as any]: {
          modalTitleImport: "Importer le template",
          modalBtnImport: "Importer",
          importPlaceholder: "<table><!-- Votre HTML ici --></table>",
          cellStyle: { "font-size": "14px", "font-family": "'DM Sans', Arial, sans-serif" },
        },
      },
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono&family=Syne:wght@700;800&display=swap",
        ],
      },
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Tablet", width: "768px", widthMedia: "768px" },
          { name: "Mobile", width: "375px", widthMedia: "480px" },
        ],
      },
      panels: { defaults: [] },
      blockManager: {
        custom: true,
      },
      styleManager: {
        sectors: [
          {
            name: "Typographie",
            open: true,
            properties: [
              { type: "select", property: "font-family", options: [
                { id: "'DM Sans', sans-serif", label: "DM Sans" },
                { id: "'Syne', sans-serif", label: "Syne" },
                { id: "'DM Mono', monospace", label: "DM Mono" },
                { id: "Arial, sans-serif", label: "Arial" },
              ]},
              "font-size", "font-weight", "letter-spacing", "color", "line-height", "text-align", "text-decoration",
            ],
          },
          {
            name: "Espacement",
            open: false,
            properties: ["padding", "margin"],
          },
          {
            name: "Fond & Bordure",
            open: false,
            properties: ["background-color", "background", "border-radius", "border"],
          },
          {
            name: "Dimensions",
            open: false,
            properties: ["width", "max-width", "height", "min-height"],
          },
        ],
      },
    });

    // Load template
    editor.setComponents(template.html);
    editor.setStyle(template.css);

    // Add custom RapidoMeet blocks
    const bm = editor.BlockManager;
    
    bm.add("rm-header", {
      label: "Header RapidoMeet",
      category: "RapidoMeet",
      content: `<div style="background: linear-gradient(135deg, #E91E8C, #7C3AED); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">RapidoMeet ™</h1>
        <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 8px 0 0;">Sous-titre</p>
      </div>`,
      attributes: { class: "fa fa-header" },
    });

    bm.add("rm-summary", {
      label: "Résumé IA",
      category: "RapidoMeet",
      content: `<div style="background: #F8F8FC; border-radius: 10px; padding: 20px; margin: 16px 24px;">
        <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #9898B0; margin: 0 0 10px;">Résumé exécutif</p>
        <p style="color: #1a1a2e; font-size: 14px; line-height: 1.7; margin: 0;">{{ai_summary}}</p>
      </div>`,
    });

    bm.add("rm-tasks", {
      label: "Tâches",
      category: "RapidoMeet",
      content: `<div style="background: #F8F8FC; border-radius: 10px; padding: 20px; margin: 16px 24px;">
        <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #9898B0; margin: 0 0 10px;">✅ Tâches assignées</p>
        <p style="font-size: 14px; color: #1a1a2e; padding: 4px 0;">☐ {{task_1_title}} → {{task_1_assignee}}</p>
        <p style="font-size: 14px; color: #1a1a2e; padding: 4px 0;">☐ {{task_2_title}} → {{task_2_assignee}}</p>
      </div>`,
    });

    bm.add("rm-decisions", {
      label: "Décisions",
      category: "RapidoMeet",
      content: `<div style="background: #F8F8FC; border-radius: 10px; padding: 20px; margin: 16px 24px;">
        <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #9898B0; margin: 0 0 10px;">📋 Décisions</p>
        <p style="font-size: 14px; color: #1a1a2e; padding: 4px 0;">→ {{decision_1}}</p>
        <p style="font-size: 14px; color: #1a1a2e; padding: 4px 0;">→ {{decision_2}}</p>
      </div>`,
    });

    bm.add("rm-sentiment", {
      label: "Sentiment",
      category: "RapidoMeet",
      content: `<div style="background: #F8F8FC; border-radius: 10px; padding: 20px; margin: 16px 24px;">
        <p style="font-size: 14px; color: #1a1a2e; margin: 0;">😊 Sentiment : {{sentiment_score}}% Positif</p>
        <div style="height: 8px; border-radius: 4px; background: #E8E8EC; overflow: hidden; margin-top: 8px;">
          <div style="height: 100%; width: 87%; border-radius: 4px; background: #10B981;"></div>
        </div>
      </div>`,
    });

    bm.add("rm-cta", {
      label: "Bouton CTA",
      category: "RapidoMeet",
      content: `<div style="text-align: center; padding: 24px;">
        <a href="#" style="display: inline-block; background: linear-gradient(135deg, #E91E8C, #7C3AED); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px;">Voir le rapport complet →</a>
      </div>`,
    });

    bm.add("rm-footer", {
      label: "Footer",
      category: "RapidoMeet",
      content: `<div style="padding: 24px; text-align: center; border-top: 1px solid #E8E8EC;">
        <p style="color: #9898B0; font-size: 11px; margin: 4px 0;">© {{year}} {{company_name}} · Généré par RapidoMeet</p>
        <p style="color: #9898B0; font-size: 10px; margin: 4px 0;">Se désabonner · Politique de confidentialité</p>
      </div>`,
    });

    bm.add("rm-spacer", {
      label: "Espace",
      category: "Structure",
      content: `<div style="height: 32px;"></div>`,
    });

    bm.add("rm-divider", {
      label: "Séparateur",
      category: "Structure",
      content: `<hr style="border: none; border-top: 1px solid #E8E8EC; margin: 16px 24px;" />`,
    });

    bm.add("rm-image", {
      label: "Image",
      category: "Structure",
      content: { type: "image", style: { "max-width": "100%", padding: "16px 24px" } },
    });

    bm.add("rm-text", {
      label: "Texte",
      category: "Structure",
      content: `<p style="color: #55556A; font-size: 14px; line-height: 1.7; padding: 0 24px; margin: 0 0 16px;">Votre texte ici...</p>`,
    });

    bm.add("rm-heading", {
      label: "Titre",
      category: "Structure",
      content: `<h2 style="color: #1a1a2e; font-size: 20px; font-weight: 700; padding: 0 24px; margin: 0 0 12px;">Titre de section</h2>`,
    });

    gjsRef.current = editor;

    return () => {
      editor.destroy();
      gjsRef.current = null;
    };
  }, [template]);

  const handleDevice = (device: string) => {
    gjsRef.current?.setDevice(device);
  };

  const handleUndo = () => gjsRef.current?.UndoManager.undo();
  const handleRedo = () => gjsRef.current?.UndoManager.redo();

  const handlePreview = () => {
    if (gjsRef.current) {
      if (previewMode) {
        gjsRef.current.stopCommand("preview");
      } else {
        gjsRef.current.runCommand("preview");
      }
      setPreviewMode(!previewMode);
    }
  };

  const handleViewCode = () => {
    if (gjsRef.current) {
      const html = gjsRef.current.getHtml();
      const css = gjsRef.current.getCss();
      setHtmlCode(`<style>${css}</style>\n${html}`);
      setViewCode(!viewCode);
    }
  };

  const handleSave = async () => {
    if (!gjsRef.current || !user) return;
    const html = gjsRef.current.getHtml();
    const css = gjsRef.current.getCss() || "";
    const gjsdata = gjsRef.current.getProjectData();

    // Save to localStorage as fallback
    localStorage.setItem(`rm-email-template-${template.id}`, JSON.stringify({ html, css }));

    // Save to DB
    const { error } = await supabase.from("email_templates").upsert({
      id: template.id,
      user_id: user.id,
      name: template.name,
      category: "custom",
      html_content: html,
      css_content: css,
      gjsdata: gjsdata as any,
    }, { onConflict: "id" });

    if (error) {
      toast.error("Erreur de sauvegarde: " + error.message);
    } else {
      toast.success("Template sauvegardé en base !");
    }
  };

  const [testEmail, setTestEmail] = useState("");
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const handleSendTest = async () => {
    if (!showTestDialog) {
      setShowTestDialog(true);
      return;
    }
    if (!testEmail.trim()) {
      toast.error("Entrez un email de test");
      return;
    }
    setSendingTest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const html = gjsRef.current?.getHtml() || "";
      const css = gjsRef.current?.getCss() || "";
      const res = await fetch(`${supabaseUrl}/functions/v1/send-email-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ to: testEmail, subject: "Test email — RapidoMeet", html: `<style>${css}</style>${html}` }),
      });
      if (res.ok) {
        toast.success(`Email de test envoyé à ${testEmail} ✓`);
        setShowTestDialog(false);
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (e: any) {
      toast.error("Erreur d'envoi: " + e.message);
    } finally {
      setSendingTest(false);
    }
  };

  const togglePanel = (panel: typeof activePanel) => {
    setActivePanel(prev => prev === panel ? "none" : panel);
  };

  const [blockCategories, setBlockCategories] = useState<Record<string, any[]>>({});

  // Update block categories after editor init
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gjsRef.current) return;
      const allBlocks = gjsRef.current.BlockManager.getAll();
      const cats: Record<string, any[]> = {};
      allBlocks.forEach((block: any) => {
        const cat = (block.getCategoryLabel?.() || block.get("category") || "Autre") as string;
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(block);
      });
      setBlockCategories(cats);
    }, 500);
    return () => clearTimeout(timer);
  }, [template]);

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-2 sm:px-4 border-b border-border/30 bg-card/80 backdrop-blur shrink-0 gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 text-xs px-2 sm:px-3">
            <ArrowLeft className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <span className="font-display font-bold text-xs text-foreground hidden md:block truncate max-w-[140px]">
            {template.emoji} {template.name}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} title="Annuler">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} title="Rétablir">
            <Redo2 className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-border/30 mx-0.5 hidden sm:block" />

          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={() => handleDevice("Desktop")} title="Desktop">
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={() => handleDevice("Tablet")} title="Tablette">
            <Tablet className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDevice("Mobile")} title="Mobile">
            <Smartphone className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-border/30 mx-0.5" />

          <Button
            variant={activePanel === "blocks" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => togglePanel("blocks")}
            title="Blocs"
          >
            <Layers className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={activePanel === "styles" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => togglePanel("styles")}
            title="Styles"
          >
            <Paintbrush className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-border/30 mx-0.5" />

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreview} title="Aperçu">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleViewCode} title="Code">
            <Code className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs px-2 sm:px-3" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Sauver</span>
          </Button>
          <Button size="sm" className="h-8 text-xs bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] text-white px-2 sm:px-3" onClick={handleSendTest}>
            <Send className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Test</span>
          </Button>
        </div>
      </div>

      {/* Editor layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Side panel (blocks / styles) */}
        {activePanel !== "none" && (
          <div className={`
            ${isMobile ? "absolute inset-y-0 left-0 z-20 w-[260px]" : "w-[240px]"}
            border-r border-border/30 bg-card overflow-y-auto shrink-0 flex flex-col
          `}>
            <div className="flex items-center justify-between p-3 border-b border-border/20">
              <span className="font-display font-bold text-xs text-foreground">
                {activePanel === "blocks" ? "📦 Blocs" : "🎨 Styles"}
              </span>
              {isMobile && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActivePanel("none")}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {activePanel === "blocks" && (
              <div className="p-3 space-y-4" id="gjs-blocks">
                {Object.entries(blockCategories).map(([cat, catBlocks]) => (
                  <div key={cat}>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{cat}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {catBlocks.map((block: any) => (
                        <div
                          key={block.getId()}
                          className="h-16 rounded-lg bg-muted/30 border border-border/30 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 cursor-grab transition-colors text-center p-1"
                          draggable
                          onDragStart={(e) => {
                            const content = block.get("content");
                            if (typeof content === "string") {
                              e.dataTransfer.setData("text/html", content);
                            }
                          }}
                          onClick={() => {
                            // Add block to canvas on click
                            const editor = gjsRef.current;
                            if (editor) {
                              const content = block.get("content");
                              if (content) {
                                editor.addComponents(content);
                              }
                            }
                          }}
                        >
                          <span className="text-xs">
                            {block.get("attributes")?.class?.includes("fa-header") ? "📐" : "📦"}
                          </span>
                          <span className="font-mono text-[8px] text-muted-foreground leading-tight">
                            {block.getLabel()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-border/20">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Variables dynamiques
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {["meeting_title", "meeting_date", "ai_summary", "tasks_count", "participant_names", "sentiment_score", "company_name", "year"].map((v) => (
                      <span
                        key={v}
                        className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-muted text-primary cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => navigator.clipboard.writeText(`{{${v}}}`).then(() => toast.info(`{{${v}}} copié`))}
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === "styles" && (
              <div className="p-3" id="gjs-styles">
                <p className="text-muted-foreground text-xs">
                  Sélectionnez un élément dans l'éditeur pour modifier ses styles.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Backdrop mobile */}
        {isMobile && activePanel !== "none" && (
          <div
            className="absolute inset-0 z-10 bg-black/30"
            onClick={() => setActivePanel("none")}
          />
        )}

        {/* GrapeJS canvas */}
        <div className="flex-1 overflow-hidden" ref={editorRef} />
      </div>

      {/* Code modal */}
      {viewCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewCode(false)}>
          <div
            className="bg-card rounded-2xl border border-border/30 w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <span className="font-display font-bold text-sm">Code HTML</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(htmlCode);
                    toast.success("Code copié !");
                  }}
                >
                  Copier
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewCode(false)}>✕</Button>
              </div>
            </div>
            <pre className="p-4 overflow-auto flex-1 text-xs font-mono text-muted-foreground bg-muted/20">
              {htmlCode}
            </pre>
          </div>
        </div>
      )}

      {/* Test email dialog */}
      {showTestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowTestDialog(false)}>
          <div className="bg-card rounded-2xl border border-border/30 w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-sm">📧 Envoyer un email de test</h3>
            <input
              type="email"
              placeholder="votre@email.com"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border/30 bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs" onClick={handleSendTest} disabled={sendingTest || !testEmail.trim()}>
                {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                Envoyer
              </Button>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowTestDialog(false)}>Annuler</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrapeEditor;
