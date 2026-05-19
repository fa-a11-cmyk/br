import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, Users, Loader2, Settings } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { useAdminActions } from "../hooks/useAdminActions";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { supabase } from "@/integrations/supabase/client";

export default function AdminUsers() {
  const { fetchSection, loading } = useAdminData();
  const { executeAction, loadingUserId } = useAdminActions();
  const { user: currentUser } = useAuth();
  const { startImpersonation } = useImpersonation();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [planDialog, setPlanDialog] = useState<{ open: boolean; userId: string; currentPlan: string }>({ open: false, userId: "", currentPlan: "free" });
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: "", userName: "" });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [impersonateDialog, setImpersonateDialog] = useState<{ open: boolean; userId: string; userName: string; email: string }>({ open: false, userId: "", userName: "", email: "" });
  const [impersonateLoading, setImpersonateLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    const d = await fetchSection("users");
    if (d) { setProfiles(d.profiles || []); setSubs(d.subscriptions || []); setRoles(d.roles || []); }
  }, [fetchSection]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const getPlan = (userId: string) => subs.find((s: any) => s.user_id === userId)?.plan || "free";
  const isAdmin = (userId: string) => roles.some((r: any) => r.user_id === userId && r.role === "admin");
  const isSuspended = (p: any) => p.is_suspended === true;
  const isSelf = (userId: string) => currentUser?.id === userId;

  const handleAction = async (action: string, userId: string, payload?: any) => {
    const success = await executeAction(action, userId, payload);
    if (success) loadUsers();
  };

  const handleImpersonate = async () => {
    setImpersonateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-actions", {
        body: { action: "start_impersonation", userId: "system", payload: { targetUserId: impersonateDialog.userId, targetEmail: impersonateDialog.email } },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      if (data?.actionLink) startImpersonation(data.actionLink, data.sessionId, impersonateDialog.userId, data.expiresAt);
    } catch (e: any) {
      const { toast } = await import("sonner");
      toast.error(e.message || "Erreur d'impersonation");
    } finally {
      setImpersonateLoading(false);
      setImpersonateDialog({ open: false, userId: "", userName: "", email: "" });
    }
  };

  const filtered = profiles.filter((p) => {
    const term = search.toLowerCase();
    return (p.first_name || "").toLowerCase().includes(term) || (p.last_name || "").toLowerCase().includes(term) || (p.company || "").toLowerCase().includes(term) || p.user_id.includes(term);
  });

  const planColors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    starter: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[#F59E0B]/30",
    pro: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))] border-[hsl(var(--fuchsia))]/30",
  };

  const renderActionsMenu = (p: any) => {
    const suspended = isSuspended(p);
    const admin = isAdmin(p.user_id);
    const self = isSelf(p.user_id);
    const isLoading = loadingUserId === p.user_id;
    const plan = getPlan(p.user_id);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-border">
          {suspended ? (
            <DropdownMenuItem onClick={() => handleAction("unsuspend_user", p.user_id)} className="cursor-pointer gap-2">✅ Réactiver le compte</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => !self && handleAction("suspend_user", p.user_id)} disabled={self} className="cursor-pointer gap-2">🚫 Suspendre le compte</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setSelectedPlan(plan); setPlanDialog({ open: true, userId: p.user_id, currentPlan: plan }); }} className="cursor-pointer gap-2">💳 Changer le plan</DropdownMenuItem>
          <DropdownMenuSeparator />
          {admin ? (
            <DropdownMenuItem onClick={() => !self && setConfirmDialog({ open: true, title: "Retirer le rôle Admin", description: `Retirer le rôle admin à ${p.first_name || ""} ${p.last_name || ""} ?`, onConfirm: () => handleAction("remove_admin_role", p.user_id) })} disabled={self} className="cursor-pointer gap-2">❌ Retirer rôle Admin</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, title: "Assigner le rôle Admin", description: `Promouvoir ${p.first_name || ""} ${p.last_name || ""} en admin ?`, onConfirm: () => handleAction("assign_admin_role", p.user_id) })} className="cursor-pointer gap-2">👑 Assigner rôle Admin</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => !admin && !self && setImpersonateDialog({ open: true, userId: p.user_id, userName: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.user_id.slice(0, 8), email: "" })} disabled={admin || self} className="cursor-pointer gap-2">🎭 Impersonner</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => !self && setDeleteDialog({ open: true, userId: p.user_id, userName: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.user_id.slice(0, 8) })} disabled={self} className="cursor-pointer gap-2 text-destructive focus:text-destructive">🗑️ Supprimer l'utilisateur</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="font-display font-extrabold text-xl md:text-2xl text-foreground">
          <Users className="inline h-5 w-5 md:h-6 md:w-6 mr-2" />
          Utilisateurs ({profiles.length})
        </h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, entreprise..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30 border-border/30 w-full" />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Aucun utilisateur</p>
        ) : filtered.map((p) => {
          const suspended = isSuspended(p);
          const admin = isAdmin(p.user_id);
          const plan = getPlan(p.user_id);
          return (
            <Card key={p.id} className={`border-border/30 ${suspended ? "bg-destructive/5" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm">{p.first_name || "—"} {p.last_name || "—"}</span>
                      {suspended && <Badge variant="destructive" className="text-[9px]">Suspendu</Badge>}
                      {admin && <Badge className="text-[9px] bg-[rgba(245,158,11,0.15)] text-[#F59E0B]">👑 Admin</Badge>}
                    </div>
                    {p.company && <p className="text-xs text-muted-foreground truncate">{p.company}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-[10px] capitalize ${planColors[plan] || ""}`}>{plan}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  {renderActionsMenu(p)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop table */}
      <Card className="border-border/30 hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/20">
                {["Prénom", "Nom", "Entreprise", "Plan", "Inscrit le", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucun utilisateur</td></tr>
              ) : filtered.map((p) => {
                const suspended = isSuspended(p);
                const admin = isAdmin(p.user_id);
                const plan = getPlan(p.user_id);
                return (
                  <tr key={p.id} className={`border-b border-border/10 hover:bg-muted/10 ${suspended ? "bg-destructive/5" : ""}`}>
                    <td className="px-4 py-3 font-body text-xs text-foreground">
                      <span className="flex items-center gap-1.5">
                        {p.first_name || "—"}
                        {suspended && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Suspendu</Badge>}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-foreground">{p.last_name || "—"}</td>
                    <td className="px-4 py-3 font-body text-xs text-muted-foreground">{p.company || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[10px] capitalize ${planColors[plan] || ""}`}>{plan}</Badge>
                        {admin && <Badge className="text-[9px] px-1.5 py-0 bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[rgba(245,158,11,0.2)]">👑 Admin</Badge>}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">{renderActionsMenu(p)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Dialogs — same as before */}
      <Dialog open={planDialog.open} onOpenChange={(o) => setPlanDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">💳 Changer le plan</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">⚠️ Changement manuel, non synchronisé avec Stripe</p>
          </DialogHeader>
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="gap-3 py-4">
            {[{ value: "free", label: "Free", desc: "2 réunions, 0 scénarios" }, { value: "starter", label: "Starter", desc: "5 réunions, 1 scénario" }, { value: "pro", label: "Pro", desc: "Illimité" }].map((p) => (
              <div key={p.value} className="flex items-center space-x-3">
                <RadioGroupItem value={p.value} id={`plan-${p.value}`} />
                <Label htmlFor={`plan-${p.value}`} className="cursor-pointer">
                  <span className="font-display font-bold text-sm">{p.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{p.desc}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPlanDialog((p) => ({ ...p, open: false }))}>Annuler</Button>
            <Button onClick={async () => { await handleAction("change_plan", planDialog.userId, { newPlan: selectedPlan }); setPlanDialog({ open: false, userId: "", currentPlan: "free" }); }} className="bg-gradient-primary text-white">Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(o) => { setDeleteDialog((p) => ({ ...p, open: o })); setDeleteConfirmText(""); }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-destructive">🗑️ Supprimer l'utilisateur</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est <strong>irréversible</strong>.</p>
          <p className="text-sm text-foreground mt-2">Tapez <strong className="text-destructive">{deleteDialog.userName}</strong> pour confirmer :</p>
          <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={deleteDialog.userName} className="mt-2" />
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setDeleteDialog({ open: false, userId: "", userName: "" }); setDeleteConfirmText(""); }}>Annuler</Button>
            <Button variant="destructive" disabled={deleteConfirmText !== deleteDialog.userName} onClick={async () => { await handleAction("delete_user", deleteDialog.userId); setDeleteDialog({ open: false, userId: "", userName: "" }); setDeleteConfirmText(""); }}>Supprimer définitivement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">{confirmDialog.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{confirmDialog.description}</p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog((p) => ({ ...p, open: false }))}>Annuler</Button>
            <Button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} }); }} className="bg-gradient-primary text-white">Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={impersonateDialog.open} onOpenChange={(o) => setImpersonateDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-destructive">🎭 Impersonation</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Vous allez accéder au compte de <strong>{impersonateDialog.userName}</strong>. Cette action est enregistrée. La session expire dans 30 minutes.</p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setImpersonateDialog({ open: false, userId: "", userName: "", email: "" })}>Annuler</Button>
            <Button onClick={handleImpersonate} disabled={impersonateLoading} className="bg-gradient-primary text-white">{impersonateLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}Impersonner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
