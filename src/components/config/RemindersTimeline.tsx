import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";

export function RemindersTimeline({ bookingId }: { bookingId: string }) {
  const { reminders, loading, loadReminders, cancelReminder, sendManual } = useReminders();
  const [sendingManual, setSendingManual] = useState(false);
  const [manualForm, setManualForm] = useState<any>(null);

  useEffect(() => { loadReminders(bookingId); }, [bookingId]);

  const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    sent: "bg-green-500/10 text-green-600",
    failed: "bg-red-500/10 text-red-500",
    canceled: "bg-muted text-muted-foreground",
  };

  const CHANNEL_ICONS: Record<string, string> = { sms: "📱", whatsapp: "💬", voice: "📞", email: "✉️" };
  const TYPE_LABELS: Record<string, string> = {
    confirmation: "Confirmation", reminder_24h: "Rappel J-1", reminder_1h: "Rappel H-1",
    reminder_15min: "Rappel 15min", followup_2h: "Suivi 2h", followup_24h: "Relance J+1", no_show: "Absent",
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold">🔔 Rappels programmés</h4>
        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setManualForm({ channel: "sms", message: "" })}>+ Envoyer</Button>
      </div>

      <div className="space-y-2">
        {reminders.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucun rappel programmé.</p>
        ) : reminders.map(rem => (
          <div key={rem.id} className="flex items-center gap-2 text-xs">
            <span>{CHANNEL_ICONS[rem.channel] || "📨"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-medium">{TYPE_LABELS[rem.reminder_type] || rem.reminder_type}</span>
                <Badge className={`text-xs scale-90 ${STATUS_STYLES[rem.status] || ""}`}>{rem.status}</Badge>
              </div>
              <p className="text-muted-foreground">{new Date(rem.scheduled_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
              {rem.error_message && <p className="text-red-500">⚠️ {rem.error_message}</p>}
            </div>
            {rem.status === "pending" && (
              <button onClick={() => cancelReminder(rem.id)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
            )}
          </div>
        ))}
      </div>

      {manualForm && (
        <div className="space-y-2 p-3 bg-muted/20 rounded-xl">
          <p className="text-xs font-medium">Envoyer un message</p>
          <Select value={manualForm.channel} onValueChange={v => setManualForm((p: any) => ({ ...p, channel: v }))}>
            <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sms" className="text-xs">📱 SMS</SelectItem>
              <SelectItem value="whatsapp" className="text-xs">💬 WhatsApp</SelectItem>
              <SelectItem value="voice" className="text-xs">📞 Appel</SelectItem>
              <SelectItem value="email" className="text-xs">✉️ Email</SelectItem>
            </SelectContent>
          </Select>
          <Textarea value={manualForm.message} onChange={e => setManualForm((p: any) => ({ ...p, message: e.target.value }))} rows={3} className="text-xs" placeholder="Votre message..." />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 text-xs" disabled={!manualForm.message.trim() || sendingManual} onClick={async () => {
              setSendingManual(true);
              const { data: booking } = await supabase.from("landing_bookings").select("prospect_phone, prospect_email").eq("id", bookingId).single();
              await sendManual(bookingId, manualForm.channel, manualForm.message, booking?.prospect_phone, booking?.prospect_email);
              setManualForm(null);
              setSendingManual(false);
              await loadReminders(bookingId);
            }}>
              {sendingManual ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Envoyer
            </Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setManualForm(null)}>Annuler</Button>
          </div>
        </div>
      )}
    </div>
  );
}
