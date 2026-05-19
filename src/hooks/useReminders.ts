import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useReminders() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callTwilio = async (action: string, payload: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/twilio-sender`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const loadReminders = async (bookingId?: string) => {
    setLoading(true);
    let q = supabase.from("reminder_schedules").select("*").order("scheduled_at");
    if (bookingId) {
      q = q.eq("booking_id", bookingId);
    } else {
      q = q.gte("scheduled_at", new Date(Date.now() - 7 * 86400000).toISOString());
    }
    const { data } = await q.limit(100);
    setReminders(data || []);
    setLoading(false);
  };

  const sendManual = async (bookingId: string, channel: string, message: string, toPhone?: string, toEmail?: string) => {
    setLoading(true);
    try {
      await callTwilio("send_manual", { booking_id: bookingId, channel, message, to_phone: toPhone, to_email: toEmail });
      toast({ title: `${channel} envoyé ✓` });
    } catch (e: any) {
      toast({ title: "Erreur d'envoi", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const testConfig = async (toPhone?: string) => {
    setLoading(true);
    try {
      return await callTwilio("test_config", { to_phone: toPhone });
    } finally {
      setLoading(false);
    }
  };

  const cancelReminder = async (reminderId: string) => {
    await supabase.from("reminder_schedules").update({ status: "canceled" }).eq("id", reminderId);
    await loadReminders();
    toast({ title: "Rappel annulé ✓" });
  };

  return { reminders, loading, loadReminders, sendManual, testConfig, cancelReminder };
}
