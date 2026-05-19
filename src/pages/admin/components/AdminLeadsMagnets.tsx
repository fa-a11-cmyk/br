import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAGNET_TYPES = [
  "pdf_guide", "checklist", "template_meeting", "template_tasks",
  "template_decisions", "ebook", "toolkit", "swipe_file", "calculator", "script", "framework",
];

export default function AdminLeadsMagnets() {
  const [magnets, setMagnets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", type: "checklist", file_url: "", is_active: true, requires_form: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("leads_magnets").select("*").order("created_at", { ascending: false });
    setMagnets(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", type: "checklist", file_url: "", is_active: true, requires_form: true });
    setEditDialog(true);
  };

  const openEdit = (m: any) => {
    setEditing(m);
    setForm({ title: m.title, description: m.description || "", type: m.type, file_url: m.file_url || "", is_active: m.is_active, requires_form: m.requires_form });
    setEditDialog(true);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editing?.id) {
        await supabase.from("leads_magnets").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editing.id);
      } else {
        await supabase.from("leads_magnets").insert(form);
      }
      toast.success("Leads magnet sauvegardé ✓");
      setEditDialog(false);
      load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Leads Magnets</h2>
          <p className="text-sm text-muted-foreground">{magnets.length} leads magnets</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Nouveau</Button>
      </div>

      {loading ? (
        [1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />)
      ) : magnets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">🎁</p>
          <p className="text-sm">Aucun leads magnet</p>
        </div>
      ) : magnets.map(m => (
        <Card key={m.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{m.title}</h3>
                <Badge variant="outline" className="text-xs">{m.type}</Badge>
                <Badge variant={m.is_active ? "default" : "secondary"} className="text-xs">
                  {m.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {m.download_count || 0} téléchargements · {m.description?.substring(0, 80) || "Pas de description"}
              </p>
            </div>
            <div className="flex gap-1 ml-4">
              <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                if (confirm("Supprimer ?")) { await supabase.from("leads_magnets").delete().eq("id", m.id); load(); }
              }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </Card>
      ))}

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} Leads Magnet</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Titre" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MAGNET_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="URL du fichier (PDF, etc.)" value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))} />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                <span className="text-sm">Actif</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.requires_form} onCheckedChange={v => setForm(p => ({ ...p, requires_form: v }))} />
                <span className="text-sm">Formulaire requis</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Annuler</Button>
            <Button onClick={save} disabled={!form.title.trim() || saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
