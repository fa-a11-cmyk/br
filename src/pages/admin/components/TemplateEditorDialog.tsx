import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy } from "lucide-react";
import { useAdminActions } from "@/pages/admin/hooks/useAdminActions";
import { useToast } from "@/hooks/use-toast";

interface TemplateVariable {
  id: string;
  category: string;
  variable_key: string;
  label: string;
  description: string | null;
  example_value: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any | null;
  variables: TemplateVariable[];
  onSaved: () => void;
}

const SAMPLE_DATA: Record<string, string> = {
  meeting_title: "Réunion commerciale Q2",
  meeting_date: "15 mars 2026",
  meeting_type: "commercial",
  meeting_duration: "45 min",
  summary: "La réunion a porté sur les objectifs commerciaux du trimestre.",
  tasks_count: "5",
  decisions_count: "3",
  sentiment_label: "Positif",
  report_url: "https://app.rapidomeet.io/app/reunions/demo",
  task_title: "Préparer la présentation",
  task_priority: "high",
  task_assignee: "Sophie Martin",
  task_deadline: "20 mars 2026",
  user_name: "Jean Dupont",
  company_name: "Acme Corp",
  app_name: "RapidoMeet",
  current_date: new Date().toLocaleDateString("fr-FR"),
};

export default function TemplateEditorDialog({ open, onOpenChange, template, variables, onSaved }: Props) {
  const { executeAction } = useAdminActions();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [previewText, setPreviewText] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [editorTab, setEditorTab] = useState("html");

  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setCategory(template.category || "general");
      setPreviewText(template.preview_text || "");
      setIsGlobal(template.is_global || false);
      setHtmlContent(template.html_content || "");
    } else {
      setName("");
      setCategory("general");
      setPreviewText("");
      setIsGlobal(false);
      setHtmlContent('<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">\n  <h1>Titre</h1>\n  <p>Bonjour {{user_name}},</p>\n  <p>Votre contenu ici.</p>\n</div>');
    }
  }, [template, open]);

  const filteredVars = variables.filter(
    v => v.category === category || v.category === "general"
  );

  const copyVariable = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Copié ✓", description: key });
  };

  const interpolatedHtml = useCallback(() => {
    let html = htmlContent;
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      html = html.replace(
        re,
        `<span style="background:#f59e0b;color:#fff;padding:1px 4px;border-radius:3px;font-size:12px;">${value}</span>`
      );
    });
    return html;
  }, [htmlContent]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Nom requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const action = template ? "update_template" : "create_template";
      const payload: any = {
        name: name.trim(),
        category,
        html_content: htmlContent,
        preview_text: previewText || null,
        is_global: isGlobal,
      };
      if (template) payload.templateId = template.id;

      const ok = await executeAction(action, "", payload);
      if (ok) onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full rounded-none sm:rounded-lg sm:max-w-6xl sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? "Modifier le template" : "Nouveau template"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[300px_1fr] gap-4 overflow-hidden">
          {/* Left panel — metadata */}
          <details className="lg:hidden border border-border/30 rounded-lg p-3 mb-2">
            <summary className="cursor-pointer text-sm font-medium">⚙️ Paramètres du template</summary>
            <div className="mt-3 space-y-4">
              <div>
                <Label>Nom du template *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Rapport standard" />
              </div>
              <div>
                <Label>Catégorie</Label>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="general">Général</option>
                  <option value="rapport">Rapport</option>
                  <option value="tache">Tâche</option>
                  <option value="decision">Décision</option>
                  <option value="commercial">Commercial</option>
                  <option value="rh">RH</option>
                  <option value="technique">Technique</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
              <div>
                <Label>Texte de prévisualisation</Label>
                <Input value={previewText} onChange={e => setPreviewText(e.target.value)} placeholder="Aperçu dans les clients email" maxLength={150} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
                <Label>Template global</Label>
              </div>
            </div>
          </details>
          <ScrollArea className="pr-2 hidden lg:block">
            <div className="space-y-4">
              <div>
                <Label>Nom du template *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Rapport standard" />
              </div>
              <div>
                <Label>Catégorie</Label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="general">Général</option>
                  <option value="rapport">Rapport</option>
                  <option value="tache">Tâche</option>
                  <option value="decision">Décision</option>
                  <option value="commercial">Commercial</option>
                  <option value="rh">RH</option>
                  <option value="technique">Technique</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
              <div>
                <Label>Texte de prévisualisation</Label>
                <Input
                  value={previewText}
                  onChange={e => setPreviewText(e.target.value)}
                  placeholder="Aperçu dans les clients email"
                  maxLength={150}
                />
                <p className="text-[10px] text-muted-foreground mt-1">{previewText.length}/150</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
                <Label>Template global (visible par tous)</Label>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-foreground mb-2">Variables disponibles</p>
                <div className="space-y-1.5">
                  {filteredVars.map(v => (
                    <button
                      key={v.id}
                      onClick={() => copyVariable(v.variable_key)}
                      className="w-full text-left p-2 rounded border border-border/30 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <code className="text-[11px] font-mono text-primary">{v.variable_key}</code>
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{v.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Right panel — editor + preview */}
          <div className="flex flex-col overflow-hidden">
            <Tabs value={editorTab} onValueChange={setEditorTab}>
              <TabsList className="mb-2">
                <TabsTrigger value="html">HTML brut</TabsTrigger>
                <TabsTrigger value="preview">Aperçu</TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="flex-1">
                <Textarea
                  value={htmlContent}
                  onChange={e => setHtmlContent(e.target.value)}
                  className="font-mono text-xs h-[250px] sm:h-[400px] resize-none"
                  placeholder="<div>Votre HTML ici...</div>"
                />
              </TabsContent>

              <TabsContent value="preview" className="flex-1">
                <div className="border border-border rounded-lg overflow-hidden h-[250px] sm:h-[400px]">
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;}</style></head><body>${interpolatedHtml()}</body></html>`}
                    className="w-full h-full bg-white"
                    sandbox="allow-same-origin"
                    title="Preview"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Les variables sont affichées en orange avec des valeurs d'exemple.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
