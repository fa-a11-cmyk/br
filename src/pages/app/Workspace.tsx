import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserPlus, Send, Loader2, MoreHorizontal, ChevronRight, Users, Plus } from "lucide-react";

/* ── Invite Dialog ── */
function InviteMemberDialog({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (email: string, role: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await onInvite(email, role);
      setEmail("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <Input type="email" placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Rôle</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">🛡 Admin — peut inviter des membres</SelectItem>
                <SelectItem value="member">👤 Membre — peut partager des réunions</SelectItem>
                <SelectItem value="viewer">👁 Lecteur — lecture seule</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Un email d'invitation sera envoyé. Le lien est valable 7 jours.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!email.trim() || loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Envoyer l'invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Members List ── */
const ROLE_COLORS: Record<string, string> = {
  owner: "text-amber-500 bg-amber-500/10",
  admin: "text-blue-500 bg-blue-500/10",
  member: "text-green-500 bg-green-500/10",
  viewer: "text-muted-foreground bg-muted",
};
const ROLE_LABELS: Record<string, string> = {
  owner: "👑 Propriétaire",
  admin: "🛡 Admin",
  member: "👤 Membre",
  viewer: "👁 Lecteur",
};

function MembersList({ members, invitations, isAdmin, onRemove, onChangeRole, onInvite }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {members.map((m: any) => (
          <Card key={m.user_id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">{m.profiles?.first_name?.[0] || "?"}</div>
                <div>
                  <p className="font-medium text-sm">{m.profiles?.first_name} {m.profiles?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{m.profiles?.company || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${ROLE_COLORS[m.role] || ""}`}>{ROLE_LABELS[m.role] || m.role}</Badge>
                {isAdmin && m.role !== "owner" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
                      {["admin", "member", "viewer"].filter(r => r !== m.role).map(r => (
                        <DropdownMenuItem key={r} onClick={() => onChangeRole(m.user_id, r)}>{ROLE_LABELS[r]}</DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => onRemove(m.user_id)}>Retirer du workspace</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {invitations.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Invitations en attente ({invitations.length})</p>
          {invitations.map((inv: any) => (
            <Card key={inv.id} className="p-3 mb-2 border-dashed border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">Expire le {new Date(inv.expires_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <Badge variant="outline" className="text-xs">En attente</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && (
        <Button variant="outline" onClick={onInvite} className="w-full">
          <UserPlus className="w-4 h-4 mr-2" />Inviter un membre
        </Button>
      )}
    </div>
  );
}

/* ── Shared Meetings ── */
function SharedMeetingsList({ meetings }: { meetings: any[] }) {
  const navigate = useNavigate();

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎙</div>
        <h3 className="font-semibold mb-2">Aucune réunion partagée</h3>
        <p className="text-sm text-muted-foreground">Partagez vos réunions depuis la page de détail → bouton "Partager avec l'équipe"</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((sm: any) => {
        const m = sm.meetings;
        if (!m) return null;
        return (
          <Card key={sm.meeting_id} className="p-4 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => navigate(`/app/reunions/${m.id}`)}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{m.title}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{m.meeting_type}</Badge>
                </div>
                {m.summary && <p className="text-xs text-muted-foreground line-clamp-2">{m.summary}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>Partagé par {sm.sharer_profile?.first_name || "—"}</span>
                  <span>·</span>
                  <span>{new Date(sm.created_at).toLocaleDateString("fr-FR")}</span>
                  {m.efficiency_score && (<><span>·</span><span>⚡ {m.efficiency_score}/100</span></>)}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Badge className="text-xs shrink-0" variant={sm.permissions === "view" ? "outline" : "default"}>
                  {sm.permissions === "view" ? "👁 Lecture" : "✏️ Édition"}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Settings ── */
function WorkspaceSettings({ workspace, onUpdate }: { workspace: any; onUpdate: () => void }) {
  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workspace-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ action: "update_workspace", workspaceId: workspace.id, payload: { name, description } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Workspace mis à jour ✓" });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="text-sm font-medium block mb-1">Nom du workspace</label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Description</label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description optionnelle" />
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Plan : <strong className="text-foreground capitalize">{workspace?.plan}</strong></span>
        <span>·</span>
        <span>Max membres : <strong className="text-foreground">{workspace?.max_members}</strong></span>
      </div>
      <Button onClick={handleSave} disabled={saving || !name.trim()}>
        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Enregistrer
      </Button>
    </div>
  );
}

/* ── Main Page ── */
const Workspace = () => {
  const ws = useWorkspace();
  const [tab, setTab] = useState("meetings");
  const [showInvite, setShowInvite] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const { toast } = useToast();

  if (ws.loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🏢</div>
          <div>
            <h1 className="text-xl font-bold">{ws.currentWorkspace?.name || "Workspace"}</h1>
            <p className="text-sm text-muted-foreground">{ws.members.length} membre(s) · Plan {ws.currentWorkspace?.plan}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ws.workspaces.length > 1 && (
            <Select value={ws.currentWorkspace?.id} onValueChange={ws.loadWorkspaceDetail}>
              <SelectTrigger className="w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ws.workspaces.map((w: any) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />Nouveau
          </Button>
          {ws.isAdmin && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="w-4 h-4 mr-1" />Inviter
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="meetings">🎙 Réunions partagées ({ws.sharedMeetings.length})</TabsTrigger>
          <TabsTrigger value="members">👥 Membres ({ws.members.length})</TabsTrigger>
          {ws.isAdmin && <TabsTrigger value="settings">⚙️ Paramètres</TabsTrigger>}
        </TabsList>

        <TabsContent value="meetings">
          <SharedMeetingsList meetings={ws.sharedMeetings} />
        </TabsContent>
        <TabsContent value="members">
          <MembersList members={ws.members} invitations={ws.invitations} currentWorkspace={ws.currentWorkspace} isAdmin={ws.isAdmin} onRemove={ws.removeMember} onChangeRole={ws.changeRole} onInvite={() => setShowInvite(true)} />
        </TabsContent>
        {ws.isAdmin && (
          <TabsContent value="settings">
            <WorkspaceSettings workspace={ws.currentWorkspace} onUpdate={() => ws.loadWorkspaceDetail(ws.currentWorkspace.id)} />
          </TabsContent>
        )}
      </Tabs>

      {/* Invite Dialog */}
      <InviteMemberDialog open={showInvite} onClose={() => setShowInvite(false)} onInvite={ws.inviteMember} />

      {/* Create Workspace Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nouveau workspace</DialogTitle></DialogHeader>
          <div className="py-2">
            <Input placeholder="Nom de l'équipe" value={newWsName} onChange={e => setNewWsName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newWsName.trim()) { ws.createWorkspace(newWsName).then(() => { setNewWsName(""); setShowCreate(false); }); } }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button disabled={!newWsName.trim()} onClick={async () => { await ws.createWorkspace(newWsName); setNewWsName(""); setShowCreate(false); }}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workspace;
