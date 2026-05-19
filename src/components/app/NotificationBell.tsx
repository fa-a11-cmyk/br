import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";

const typeIcon: Record<string, string> = {
  meeting_completed: "✅", meeting_failed: "❌", task_assigned: "📋", task_due_soon: "⏰",
  subscription_expiring: "💳", subscription_renewed: "💳", quota_warning: "⚠️",
  quota_exceeded: "🚫", report_shared: "🔗", system: "ℹ️",
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const relativeTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-white font-mono text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 animate-pulse">{unreadCount}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[min(400px,calc(100vw-2rem))] bg-card border border-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-50 overflow-hidden max-h-[560px] flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-border">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-base text-foreground">Notifications</h3>
                <button onClick={markAllAsRead} className="font-body text-[13px] text-[hsl(var(--fuchsia-l))] hover:underline">Tout marquer lu</button>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">{unreadCount} non lue(s)</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <span className="text-3xl mb-2">🔔</span>
                  <p className="font-body text-sm">Aucune notification</p>
                  <p className="font-mono text-[11px] mt-1">Les mises à jour apparaîtront ici</p>
                </div>
              ) : (
                notifications.slice(0, 15).map(n => (
                  <div key={n.id}
                    className={`px-5 py-3.5 border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer ${!n.is_read ? "bg-fuchsia-d/30" : ""}`}
                    onClick={() => { markAsRead(n.id); if (n.link) { setOpen(false); navigate(n.link); } }}>
                    <div className="flex gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon[n.type] || "ℹ️"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-display text-[13px] leading-tight ${!n.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                          <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">{relativeTime(n.created_at)}</span>
                        </div>
                        {n.message && <p className="font-body text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      </div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-[hsl(var(--fuchsia))] flex-shrink-0 mt-1.5" />}
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="text-muted-foreground/30 hover:text-destructive text-xs shrink-0">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-border text-center">
                <button onClick={() => { setOpen(false); navigate("/app/notifications"); }}
                  className="font-body text-[13px] text-[hsl(var(--fuchsia-l))] hover:underline">
                  Voir toutes les notifications →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
