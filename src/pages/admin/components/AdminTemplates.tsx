import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Plus, MoreVertical, Globe, User, Eye, Pencil, Trash2, Search } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { useAdminActions } from "@/pages/admin/hooks/useAdminActions";
import { useToast } from "@/hooks/use-toast";
import TemplateEditorDialog from "./TemplateEditorDialog";
import TemplatePreviewDialog from "./TemplatePreviewDialog";

interface TemplateData {
  id: string;
  name: string;
  category: string;
  preview_text: string | null;
  is_global: boolean;
  usage_count: number;
  html_content: string;
  css_content: string;
  gjsdata: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface TemplateVariable {
  id: string;
  category: string;
  variable_key: string;
  label: string;
  description: string | null;
  example_value: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  rapport: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  tache: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  decision: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  commercial: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  rh: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  technique: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  notification: "bg-red-500/10 text-red-700 dark:text-red-300",
};

export default function AdminTemplates() {
  const { fetchSection, loading } = useAdminData();
  const { executeAction } = useAdminActions();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [tab, setTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateData | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateData | null>(null);

  const loadData = () => {
    fetchSection("templates").then((d) => {
      if (d) {
        setTemplates(d.templates || []);
        setVariables(d.variables || []);
      }
    });
  };

  useEffect(() => { loadData(); }, [fetchSection]);

  const globalCount = templates.filter(t => t.is_global).length;

  const filtered = useMemo(() => {
    let list = templates;
    if (tab === "global") list = list.filter(t => t.is_global);
    if (tab === "personal") list = list.filter(t => !t.is_global);
    if (categoryFilter !== "all") list = list.filter(t => t.category === categoryFilter);
    if (search) list = list.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [templates, tab, categoryFilter, search]);

  const handleToggleGlobal = async (tpl: TemplateData) => {
    const ok = await executeAction("toggle_global_template", "", {
      templateId: tpl.id,
      isGlobal: !tpl.is_global,
    });
    if (ok) loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await executeAction("delete_template", "", {
      templateId: deleteTarget.id,
    });
    if (ok) {
      setDeleteTarget(null);
      loadData();
    }
  };

  const handleSaved = () => {
    setEditorOpen(false);
    setEditingTemplate(null);
    loadData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-extrabold text-2xl text-foreground flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Templates Email
          <Badge variant="secondary" className="ml-2 text-xs">
            {templates.length} templates · {globalCount} globaux
          </Badge>
        </h1>
        <Button onClick={() => { setEditingTemplate(null); setEditorOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nouveau template
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="global">🌐 Globaux</TabsTrigger>
            <TabsTrigger value="personal">👤 Personnels</TabsTrigger>
          </TabsList>
        </Tabs>
        <select
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">Toutes catégories</option>
          <option value="general">Général</option>
          <option value="rapport">Rapport</option>
          <option value="tache">Tâche</option>
          <option value="decision">Décision</option>
          <option value="commercial">Commercial</option>
          <option value="rh">RH</option>
          <option value="technique">Technique</option>
          <option value="notification">Notification</option>
        </select>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-48" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement…</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="p-8 text-center text-muted-foreground">
            {search || categoryFilter !== "all" ? "Aucun template correspondant." : "Aucun template. Créez-en un !"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tpl => (
            <Card key={tpl.id} className="border-border/30 group hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={tpl.is_global ? "border-amber-500/50 text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                      {tpl.is_global ? "🌐 Global" : "👤 Personnel"}
                    </Badge>
                    <Badge className={CATEGORY_COLORS[tpl.category] || CATEGORY_COLORS.general}>
                      {tpl.category}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewTemplate(tpl)}>
                        <Eye className="h-4 w-4 mr-2" /> Prévisualiser
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingTemplate(tpl); setEditorOpen(true); }}>
                        <Pencil className="h-4 w-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleGlobal(tpl)}>
                        {tpl.is_global ? <><User className="h-4 w-4 mr-2" /> Rendre personnel</> : <><Globe className="h-4 w-4 mr-2" /> Rendre global</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTarget(tpl)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="font-display font-bold text-sm text-foreground mb-1 line-clamp-1">{tpl.name}</p>
                {tpl.preview_text && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{tpl.preview_text}</p>
                )}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                  <span>{tpl.usage_count || 0} utilisation{(tpl.usage_count || 0) > 1 ? "s" : ""}</span>
                  <span>{new Date(tpl.updated_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={(open) => { if (!open) { setEditorOpen(false); setEditingTemplate(null); } }}
        template={editingTemplate}
        variables={variables}
        onSaved={handleSaved}
      />

      {/* Preview Dialog */}
      {previewTemplate && (
        <TemplatePreviewDialog
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
          template={previewTemplate}
          variables={variables}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le template ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le template &quot;{deleteTarget?.name}&quot; sera supprimé définitivement.
              {deleteTarget?.is_global && " Ce template est global — les utilisateurs n'y auront plus accès."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
