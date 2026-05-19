import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any;
  variables: any[];
}

export default function TemplatePreviewDialog({ open, onOpenChange, template }: Props) {
  const { toast } = useToast();

  const interpolatedHtml = useMemo(() => {
    let html = template?.html_content || "";
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      html = html.replace(re, value);
    });
    return html;
  }, [template]);

  const copyHtml = () => {
    navigator.clipboard.writeText(template?.html_content || "");
    toast({ title: "HTML copié ✓" });
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle>{template.name}</DialogTitle>
            <Badge variant="outline">{template.category}</Badge>
            {template.is_global && <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">🌐 Global</Badge>}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span>Créé : {new Date(template.created_at).toLocaleDateString("fr-FR")}</span>
            <span>Modifié : {new Date(template.updated_at).toLocaleDateString("fr-FR")}</span>
            <span>{template.usage_count || 0} utilisation(s)</span>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="preview">Aperçu rendu</TabsTrigger>
              <TabsTrigger value="source">HTML source</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={copyHtml}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copier le HTML
            </Button>
          </div>

          <TabsContent value="preview" className="flex-1 mt-3">
            <div className="border border-border rounded-lg overflow-hidden h-[450px]">
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;}</style></head><body>${interpolatedHtml}</body></html>`}
                className="w-full h-full bg-white"
                sandbox="allow-same-origin"
                title="Template Preview"
              />
            </div>
          </TabsContent>

          <TabsContent value="source" className="flex-1 mt-3">
            <pre className="p-4 rounded-lg bg-muted/50 border border-border overflow-auto h-[450px] text-xs font-mono whitespace-pre-wrap">
              {template.html_content}
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
