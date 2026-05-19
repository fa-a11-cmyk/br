import { useState, useEffect } from "react";
import { useKanban } from "@/hooks/useKanban";
import { useConfetti } from "@/hooks/useConfetti";
import { ExportMenu } from "@/components/ExportMenu";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search } from "lucide-react";

// ── Priority config ──
const PRIORITY_STYLES: Record<string, { border: string; badge: string; label: string }> = {
  critical: { border: "border-l-4 border-l-destructive", badge: "bg-destructive/10 text-destructive", label: "🔴 Critique" },
  high: { border: "border-l-4 border-l-[hsl(var(--fuchsia))]", badge: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]", label: "🟠 Haute" },
  medium: { border: "border-l-4 border-l-[hsl(var(--violet))]", badge: "bg-violet-d text-[hsl(var(--violet-l))]", label: "🟡 Moyenne" },
  low: { border: "border-l-4 border-l-[hsl(var(--success))]", badge: "bg-success-d text-[hsl(var(--success))]", label: "🟢 Faible" },
};

// ── KanbanCard ──
function KanbanCard({ card, onClick, isDragging }: { card: any; onClick: () => void; isDragging?: boolean }) {
  const style = PRIORITY_STYLES[card.priority] || PRIORITY_STYLES.medium;
  const isOverdue = card.due_date && new Date(card.due_date) < new Date() && !card.completed_at;
  const checklistDone = (card.checklist || []).filter((i: any) => i.done).length;
  const checklistTotal = (card.checklist || []).length;

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-lg p-3 border border-border cursor-pointer hover:shadow-md transition-all select-none ${style.border} ${isDragging ? "shadow-xl rotate-2 opacity-80" : ""} ${isOverdue ? "bg-destructive/5" : ""}`}
    >
      {card.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((l: string) => (
            <span key={l} className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{l}</span>
          ))}
        </div>
      )}
      <p className="text-sm font-medium line-clamp-2 mb-2 text-foreground">{card.title}</p>
      <div className="flex items-center flex-wrap gap-2">
        <Badge className={`text-xs ${style.badge}`}>{style.label}</Badge>
        {card.due_date && (
          <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            📅 {new Date(card.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
            {isOverdue && " ⚠️"}
          </span>
        )}
        {card.assignee && <span className="text-xs text-muted-foreground">👤 {card.assignee}</span>}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {checklistTotal > 0 && <span>☑ {checklistDone}/{checklistTotal}</span>}
          {(card.comments_count || 0) > 0 && <span>💬 {card.comments_count}</span>}
        </div>
      </div>
    </div>
  );
}

// ── SortableKanbanCard ──
function SortableKanbanCard({ card, columnId, onClick }: { card: any; columnId: string; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", columnId },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard card={card} onClick={onClick} />
    </div>
  );
}

// ── KanbanColumn ──
function KanbanColumn({ column, cards, onCreateCard, onCardClick }: any) {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: "column", columnId: column.id } });
  const isOverWip = column.wip_limit && cards.length >= column.wip_limit;

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-72 flex flex-col rounded-xl bg-secondary/50 border border-border max-h-full">
      <div className="flex items-center justify-between p-3 shrink-0">
        <div className="flex items-center gap-2">
          <span>{column.icon}</span>
          <span className="font-display font-bold text-sm text-foreground">{column.name}</span>
          <Badge variant="outline" className={`text-xs ${isOverWip ? "bg-destructive/10 text-destructive" : ""}`}>
            {cards.length}{column.wip_limit ? `/${column.wip_limit}` : ""}
          </Badge>
        </div>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCreateCard}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <SortableContext items={cards.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]" data-column-id={column.id}>
          {cards.map((card: any) => (
            <SortableKanbanCard key={card.id} card={card} columnId={column.id} onClick={() => onCardClick(card)} />
          ))}
          {cards.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg">
              Glissez une tâche ici
            </div>
          )}
        </div>
      </SortableContext>
      <button onClick={onCreateCard} className="flex items-center gap-2 p-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors rounded-b-xl shrink-0">
        <Plus className="w-4 h-4" /> Ajouter une tâche
      </button>
    </div>
  );
}

// ── AddColumnButton ──
function AddColumnButton({ onAdd }: { onAdd: (data: any) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (!adding) {
    return (
      <button onClick={() => setAdding(true)} className="flex-shrink-0 w-64 h-12 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-2 text-sm">
        <Plus className="w-4 h-4" /> Ajouter une colonne
      </button>
    );
  }

  return (
    <div className="flex-shrink-0 w-64 p-3 rounded-xl bg-secondary/50 border border-border space-y-2">
      <Input placeholder="Nom de la colonne..." value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && name.trim()) { onAdd({ name }); setName(""); setAdding(false); } if (e.key === "Escape") setAdding(false); }}
        autoFocus className="text-sm" />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => { if (name.trim()) { onAdd({ name }); setName(""); setAdding(false); } }}>Créer</Button>
        <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>✕</Button>
      </div>
    </div>
  );
}

// ── TaskListView ──
function TaskListView({ columns, cards, onCardClick }: any) {
  return (
    <div className="space-y-6">
      {columns.map((col: any) => {
        const colCards = cards.filter((c: any) => c.column_id === col.id);
        if (!colCards.length) return null;
        return (
          <div key={col.id}>
            <h3 className="font-display font-bold text-sm mb-2 flex items-center gap-2 text-foreground">
              <span>{col.icon}</span> {col.name}
              <Badge variant="outline" className="text-xs">{colCards.length}</Badge>
            </h3>
            <div className="space-y-1">
              {colCards.map((card: any) => (
                <div key={card.id} onClick={() => onCardClick(card)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${card.priority === "critical" ? "bg-destructive" : card.priority === "high" ? "bg-[hsl(var(--fuchsia))]" : card.priority === "medium" ? "bg-[hsl(var(--violet))]" : "bg-[hsl(var(--success))]"}`} />
                  <span className="flex-1 text-sm truncate text-foreground">{card.title}</span>
                  {card.assignee && <span className="text-xs text-muted-foreground hidden sm:block">👤 {card.assignee}</span>}
                  {card.due_date && (
                    <span className={`text-xs hidden md:block ${new Date(card.due_date) < new Date() ? "text-destructive" : "text-muted-foreground"}`}>
                      📅 {new Date(card.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── CardDetailDialog ──
function CardDetailDialog({ card, columns, onClose, onUpdate, onArchive, onMove }: any) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: card.title, description: card.description || "", priority: card.priority,
    assignee: card.assignee || "", due_date: card.due_date || "", checklist: card.checklist || [],
  });
  const [newCheckItem, setNewCheckItem] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    supabase.from("kanban_comments").select("*").eq("card_id", card.id).order("created_at")
      .then(({ data }) => setComments(data || []));
  }, [card.id]);

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    const item = { id: crypto.randomUUID(), text: newCheckItem, done: false, created_at: new Date().toISOString() };
    const newChecklist = [...form.checklist, item];
    setForm(p => ({ ...p, checklist: newChecklist }));
    onUpdate({ checklist: newChecklist });
    setNewCheckItem("");
  };

  const toggleCheckItem = (itemId: string) => {
    const newChecklist = form.checklist.map((i: any) => i.id === itemId ? { ...i, done: !i.done } : i);
    setForm(p => ({ ...p, checklist: newChecklist }));
    onUpdate({ checklist: newChecklist });
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kanban-actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ action: "add_comment", payload: { cardId: card.id, content: newComment } }),
    });
    const data = await res.json();
    if (data.comment) { setComments(prev => [...prev, data.comment]); setNewComment(""); }
  };

  const completionPct = form.checklist.length > 0
    ? Math.round(form.checklist.filter((i: any) => i.done).length / form.checklist.length * 100) : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          {editing ? (
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              onBlur={() => { onUpdate({ title: form.title }); setEditing(false); }} autoFocus className="text-lg font-bold" />
          ) : (
            <h2 className="text-lg font-bold cursor-pointer hover:bg-muted/30 rounded p-1" onClick={() => setEditing(true)}>{form.title}</h2>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Priorité</label>
              <Select value={form.priority} onValueChange={v => { setForm(p => ({ ...p, priority: v })); onUpdate({ priority: v }); }}>
                <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["critical", "high", "medium", "low"].map(p => (
                    <SelectItem key={p} value={p} className="text-xs">{PRIORITY_STYLES[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Assigné à</label>
              <Input value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                onBlur={() => onUpdate({ assignee: form.assignee })} placeholder="Nom..." className="text-xs h-8" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Deadline</label>
              <Input type="date" value={form.due_date} onChange={e => { setForm(p => ({ ...p, due_date: e.target.value })); onUpdate({ due_date: e.target.value }); }} className="text-xs h-8" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Déplacer vers</label>
              <Select onValueChange={onMove}>
                <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Colonne..." /></SelectTrigger>
                <SelectContent>
                  {columns.map((col: any) => <SelectItem key={col.id} value={col.id} className="text-xs">{col.icon} {col.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              onBlur={() => onUpdate({ description: form.description })} rows={3} placeholder="Ajouter une description..." className="text-sm" />
          </div>

          {/* Checklist */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">
              Checklist {form.checklist.length > 0 && `(${completionPct}%)`}
            </label>
            {form.checklist.length > 0 && (
              <div className="mb-2"><div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-[hsl(var(--success))] rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div></div>
            )}
            <div className="space-y-1.5">
              {form.checklist.map((item: any) => (
                <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={item.done} onChange={() => toggleCheckItem(item.id)} className="rounded" />
                  <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.text}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input placeholder="Ajouter un élément..." value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCheckItem()} className="text-sm" />
              <Button size="sm" onClick={addCheckItem}>+</Button>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">Commentaires ({comments.length})</label>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {comments.map((c: any) => (
                <div key={c.id} className="bg-muted/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">Vous</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <p className="text-sm text-foreground">{c.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Ajouter un commentaire..." value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addComment()} className="text-sm" />
              <Button size="sm" onClick={addComment}>Envoyer</Button>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-border">
            <Button variant="ghost" className="text-destructive text-xs" onClick={() => { if (confirm("Archiver cette tâche ?")) onArchive(); }}>
              🗑 Archiver
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── CreateCardDialog ──
function CreateCardDialog({ columnId, onClose, onCreate }: { columnId: string; onClose: () => void; onCreate: (data: any) => void }) {
  const [form, setForm] = useState({ title: "", priority: "medium", assignee: "", due_date: "" });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nouvelle tâche</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Input placeholder="Titre de la tâche *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Priorité</label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["critical", "high", "medium", "low"].map(p => <SelectItem key={p} value={p}>{PRIORITY_STYLES[p].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Assigné à</label>
              <Input value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} placeholder="Nom..." className="mt-1 h-8 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Deadline</label>
            <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button disabled={!form.title.trim()} onClick={() => onCreate(form)}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ImportMeetingDialog ──
function ImportMeetingDialog({ columns, onClose, onImport }: any) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState("");
  const [selectedColumn, setSelectedColumn] = useState(columns[0]?.id || "");

  useEffect(() => {
    supabase.from("meetings").select("id, title, meeting_type, created_at")
      .eq("status", "completed").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setMeetings(data || []));
  }, []);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Importer les tâches d'une réunion</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Réunion source</label>
            <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir une réunion" /></SelectTrigger>
              <SelectContent>
                {meetings.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Colonne de destination</label>
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {columns.map((col: any) => <SelectItem key={col.id} value={col.id}>{col.icon} {col.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button disabled={!selectedMeeting} onClick={() => onImport(selectedMeeting, selectedColumn)}>Importer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Taches Page ──
const Taches = () => {
  const { t } = useTranslation("app");
  const kanban = useKanban();
  const { fireConfetti } = useConfetti();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeCard, setActiveCard] = useState<any>(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [showCardDetail, setShowCardDetail] = useState<any>(null);
  const [showCreateCard, setShowCreateCard] = useState<string | null>(null);
  const [showImportMeeting, setShowImportMeeting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filterCards = (crds: any[]) => crds.filter(c => {
    const matchPriority = filterPriority === "all" || c.priority === filterPriority;
    const matchSearch = !filterSearch || c.title.toLowerCase().includes(filterSearch.toLowerCase());
    return matchPriority && matchSearch;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const card = kanban.cards.find(c => c.id === event.active.id);
    setActiveCard(card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over || active.id === over.id) return;

    const sourceCard = kanban.cards.find(c => c.id === active.id);
    if (!sourceCard) return;

    const targetColumnId = (over.data?.current as any)?.columnId || kanban.cards.find(c => c.id === over.id)?.column_id;
    if (!targetColumnId) return;

    const targetCards = kanban.getColumnCards(targetColumnId).filter(c => c.id !== active.id);
    const overCard = targetCards.find(c => c.id === over.id);
    const newPosition = overCard ? overCard.position : targetCards.length;

    await kanban.moveCard(active.id as string, targetColumnId, newPosition, sourceCard.column_id);

    // Fire confetti when task moved to a "done" column
    const targetColumn = kanban.columns.find(c => c.id === targetColumnId);
    if (targetColumn?.is_done_column && sourceCard.column_id !== targetColumnId) {
      fireConfetti({ type: "success" });
    }
  };

  if (kanban.loading && !kanban.currentBoard) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center flex-wrap gap-3 px-3 sm:px-4 md:px-6 py-3 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl">
        {kanban.boards.length > 1 && (
          <Select value={kanban.currentBoard?.id} onValueChange={kanban.loadBoard}>
            <SelectTrigger className="w-48 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {kanban.boards.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <h1 className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-foreground">
          {kanban.boards.length <= 1 ? t("tasks.title") : ""}
        </h1>

        {kanban.stats && (
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
            <span>📋 {kanban.stats.active_cards || 0} actives</span>
            {(kanban.stats.overdue_count || 0) > 0 && <span className="text-destructive">⚠️ {kanban.stats.overdue_count} en retard</span>}
            {(kanban.stats.critical_count || 0) > 0 && <span className="text-destructive font-medium">🚨 {kanban.stats.critical_count} critiques</span>}
            <span className="text-[hsl(var(--success))]">✅ {kanban.stats.completion_rate || 0}%</span>
          </div>
        )}

        <div className="flex-1" />

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("tasks.search")} value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="pl-9 w-40 h-8 text-xs" />
        </div>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="critical">🔴 Critique</SelectItem>
            <SelectItem value="high">🟠 Haute</SelectItem>
            <SelectItem value="medium">🟡 Moyenne</SelectItem>
            <SelectItem value="low">🟢 Faible</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setViewMode("kanban")} className={`px-3 py-1.5 text-xs transition-colors ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted/30 text-muted-foreground"}`}>
            ⬛ {t("tasks.kanban")}
          </button>
          <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted/30 text-muted-foreground"}`}>
            ☰ {t("tasks.list")}
          </button>
        </div>

        <Button size="sm" variant="outline" onClick={() => setShowImportMeeting(true)}>
          <Plus className="w-4 h-4 mr-1" /> Importer
        </Button>
        <Button size="sm" onClick={() => setShowCreateCard(kanban.columns[0]?.id)}>
          <Plus className="w-4 h-4 mr-1" /> Nouvelle
        </Button>
        <ExportMenu type="tasks" />
      </div>

      {/* Body */}
      {viewMode === "kanban" ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 flex gap-4 overflow-x-auto p-4">
            {kanban.columns.map(column => (
              <KanbanColumn key={column.id} column={column} cards={filterCards(kanban.getColumnCards(column.id))}
                onCreateCard={() => setShowCreateCard(column.id)} onCardClick={setShowCardDetail} />
            ))}
            <AddColumnButton onAdd={kanban.createColumn} />
          </div>
          <DragOverlay>{activeCard && <KanbanCard card={activeCard} isDragging onClick={() => {}} />}</DragOverlay>
        </DndContext>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 max-w-[1200px]">
          <TaskListView columns={kanban.columns} cards={filterCards(kanban.cards)} onCardClick={setShowCardDetail} />
        </div>
      )}

      {/* Dialogs */}
      {showCardDetail && (
        <CardDetailDialog card={showCardDetail} columns={kanban.columns} onClose={() => setShowCardDetail(null)}
          onUpdate={async (updates: any) => { await kanban.updateCard(showCardDetail.id, updates); setShowCardDetail((prev: any) => ({ ...prev, ...updates })); }}
          onArchive={async () => { await kanban.archiveCard(showCardDetail.id); setShowCardDetail(null); }}
          onMove={async (targetColumnId: string) => {
            const targetCards = kanban.getColumnCards(targetColumnId);
            await kanban.moveCard(showCardDetail.id, targetColumnId, targetCards.length, showCardDetail.column_id);
            setShowCardDetail((prev: any) => ({ ...prev, column_id: targetColumnId }));
          }}
        />
      )}
      {showCreateCard && <CreateCardDialog columnId={showCreateCard} onClose={() => setShowCreateCard(null)} onCreate={async (data: any) => { await kanban.createCard(showCreateCard, data); setShowCreateCard(null); }} />}
      {showImportMeeting && <ImportMeetingDialog columns={kanban.columns} onClose={() => setShowImportMeeting(false)} onImport={async (meetingId: string, columnId: string) => { await kanban.importMeetingTasks(meetingId, columnId); setShowImportMeeting(false); }} />}
    </div>
  );
};

export default Taches;
