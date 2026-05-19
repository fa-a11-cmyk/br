import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const typeConfig: Record<string, { icon: string; color: string }> = {
  meeting_completed: { icon: "✅", color: "bg-success-d text-[hsl(var(--success))]" },
  meeting_failed: { icon: "❌", color: "bg-destructive/20 text-destructive" },
  task_assigned: { icon: "📋", color: "bg-violet-d text-[hsl(var(--violet-l))]" },
  task_due_soon: { icon: "⏰", color: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]" },
  subscription_expiring: { icon: "💳", color: "bg-violet-d text-[hsl(var(--violet-l))]" },
  subscription_renewed: { icon: "💳", color: "bg-success-d text-[hsl(var(--success))]" },
  quota_warning: { icon: "⚠️", color: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]" },
  quota_exceeded: { icon: "🚫", color: "bg-destructive/20 text-destructive" },
  report_shared: { icon: "🔗", color: "bg-fuchsia-d text-[hsl(var(--fuchsia-l))]" },
  system: { icon: "ℹ️", color: "bg-secondary text-muted-foreground" },
};

const Notifications = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  const filtered = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;

  const clearRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id).eq("is_read", true);
    toast({ title: "Notifications lues supprimées ✓" });
    window.location.reload();
  };

  const relativeTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-[800px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-foreground">Notifications</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{unreadCount} non lue(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>Tout marquer lu</Button>
          <Button variant="outline" size="sm" onClick={clearRead}>Supprimer les lues</Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-mono text-[11px] px-3 py-1.5 rounded-full transition-colors ${filter === f ? "bg-fuchsia-d border border-primary/30 text-primary" : "bg-secondary border border-border text-muted-foreground"}`}>
            {f === "all" ? "Toutes" : "Non lues"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[hsl(var(--fuchsia))] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">🔔</span>
          <p className="font-body text-muted-foreground">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const cfg = typeConfig[n.type] || typeConfig.system;
            return (
              <div key={n.id}
                onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); }}
                className={`bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all ${!n.is_read ? "border-l-2 border-l-[hsl(var(--fuchsia))]" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-display text-sm ${!n.is_read ? "font-bold text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                      <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{relativeTime(n.created_at)}</span>
                    </div>
                    {n.message && <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-[9px] ${cfg.color}`}>{n.type.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="text-muted-foreground/50 hover:text-destructive text-xs shrink-0">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
