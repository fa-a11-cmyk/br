import { usePendingActions, type PendingAction, type ActionStatus } from "@/hooks/usePendingActions";
import { Loader2 } from "lucide-react";

const ACTION_ICONS: Record<string, string> = {
  calendar_event: "📅",
  send_email: "📧",
  send_telegram: "✈️",
  send_whatsapp: "💬",
  send_slack: "💬",
  create_task: "✅",
  trigger_webhook: "🔁",
  custom: "⚡",
};

const ACTION_LABELS: Record<string, string> = {
  calendar_event: "Événement calendrier",
  send_email: "Envoi email",
  send_telegram: "Message Telegram",
  send_whatsapp: "Message WhatsApp",
  send_slack: "Message Slack",
  create_task: "Création de tâche",
  trigger_webhook: "Déclenchement webhook",
  custom: "Action personnalisée",
};

const STATUS_CONFIG: Record<ActionStatus, { label: string; cls: string; icon: string }> = {
  pending: { label: "En attente", cls: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]", icon: "⏳" },
  confirmed: { label: "Approuvé", cls: "bg-[rgba(59,130,246,0.12)] text-[#3B82F6]", icon: "✅" },
  refused: { label: "Refusé", cls: "bg-[hsl(var(--dark-4))] text-muted-foreground", icon: "❌" },
  executing: { label: "En cours…", cls: "bg-violet-d text-[hsl(var(--violet-l))]", icon: "⚡" },
  executed: { label: "Exécuté", cls: "bg-success-d text-[hsl(var(--success))]", icon: "✓" },
  error: { label: "Erreur", cls: "bg-destructive/20 text-destructive", icon: "⚠️" },
};

const ActionRow = ({
  action,
  processing,
  onConfirm,
  onRefuse,
}: {
  action: PendingAction;
  processing: string | null;
  onConfirm: () => void;
  onRefuse: () => void;
}) => {
  const isPending = action.status === "pending";
  const isProcessing = processing === action.id;
  const status = STATUS_CONFIG[action.status];

  return (
    <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-[12px] hover:border-[hsl(var(--fuchsia))]/20 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg shrink-0">
        {ACTION_ICONS[action.action_type] || "⚡"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-bold text-[14px] text-foreground">{action.title}</span>
          <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${status.cls}`}>
            {status.icon} {status.label}
          </span>
        </div>
        <p className="font-body text-[13px] text-muted-foreground leading-relaxed mb-1">
          {action.summary}
        </p>
        <div className="flex items-center gap-3 text-[12px] font-mono text-muted-foreground/60">
          <span>{ACTION_LABELS[action.action_type] || action.action_type}</span>
          <span>→ {action.destination}</span>
        </div>
        {action.status === "error" && action.error_message && (
          <p className="font-body text-[12px] text-destructive mt-1">⚠️ {action.error_message}</p>
        )}
      </div>
      {isPending && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefuse}
            disabled={isProcessing}
            className="font-body text-[12px] text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
          >
            Refuser
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="font-body text-[12px] font-semibold text-white bg-gradient-primary px-3.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
          >
            {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
            Approuver
          </button>
        </div>
      )}
    </div>
  );
};

interface ConfirmationGateProps {
  /** Express session ID — primary identifier */
  sessionId: string;
  /** @deprecated Use sessionId instead */
  meetingId?: string;
}

export const ConfirmationGate = ({ sessionId, meetingId }: ConfirmationGateProps) => {
  const effectiveId = sessionId || meetingId;
  const {
    actions,
    loading,
    processing,
    pendingCount,
    executedCount,
    errorCount,
    confirmAction,
    refuseAction,
    confirmAll,
    refuseAll,
  } = usePendingActions(effectiveId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">🎯</p>
        <p className="font-body text-sm text-muted-foreground">
          Aucune action en attente pour cette session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-bold text-[16px] text-foreground">
            Actions post-réunion
          </h3>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <span className="font-mono text-[10px] bg-[rgba(245,158,11,0.12)] text-[#F59E0B] px-2 py-0.5 rounded-full">
                ⏳ {pendingCount} en attente
              </span>
            )}
            {executedCount > 0 && (
              <span className="font-mono text-[10px] bg-success-d text-[hsl(var(--success))] px-2 py-0.5 rounded-full">
                ✓ {executedCount} exécutée(s)
              </span>
            )}
            {errorCount > 0 && (
              <span className="font-mono text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                ⚠️ {errorCount} erreur(s)
              </span>
            )}
          </div>
        </div>
        {pendingCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={refuseAll}
              disabled={processing === "all"}
              className="font-body text-[12px] text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors disabled:opacity-50"
            >
              Tout refuser
            </button>
            <button
              onClick={confirmAll}
              disabled={processing === "all"}
              className="font-body text-[12px] font-semibold text-white bg-gradient-primary px-3.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            >
              {processing === "all" && <Loader2 className="w-3 h-3 animate-spin" />}
              Tout approuver ({pendingCount})
            </button>
          </div>
        )}
      </div>

      <div className="bg-secondary rounded-[10px] px-4 py-3 flex items-start gap-2">
        <span className="text-sm">🔒</span>
        <p className="font-body text-[12px] text-muted-foreground leading-relaxed">
          Les actions ne sont jamais exécutées automatiquement. Vérifiez chaque action avant de l'approuver.
          Les identifiants et tokens sont stockés de manière sécurisée côté serveur.
        </p>
      </div>

      <div className="space-y-2">
        {actions.map(action => (
          <ActionRow
            key={action.id}
            action={action}
            processing={processing}
            onConfirm={() => confirmAction(action.id)}
            onRefuse={() => refuseAction(action.id)}
          />
        ))}
      </div>
    </div>
  );
};
