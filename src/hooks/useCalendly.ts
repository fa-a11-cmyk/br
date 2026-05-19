import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useCalendly() {
  const [connection, setConnection] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadConnection(); }, []);

  const callCalendly = async (action: string, payload: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/calendly-api`, {
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

  const loadConnection = async () => {
    try {
      const data = await callCalendly("get_connection", {});
      setConnection(data.connection);
      if (data.connection?.is_active) {
        await loadEvents();
        await loadEventTypes();
        await loadLinks();
      }
    } catch {}
  };

  const loadEvents = async () => {
    const { data } = await supabase
      .from("calendly_events" as any)
      .select("*")
      .gte("end_time", new Date().toISOString())
      .eq("status", "active")
      .order("start_time")
      .limit(20);
    setEvents((data as any) || []);
  };

  const loadEventTypes = async () => {
    try {
      const data = await callCalendly("get_event_types", {});
      setEventTypes(data.event_types || []);
    } catch {}
  };

  const loadLinks = async () => {
    const { data } = await supabase
      .from("calendly_scheduling_links" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setLinks((data as any) || []);
  };

  const connectWithPAT = async (token: string) => {
    setLoading(true);
    try {
      const result = await callCalendly("connect_pat", { token });
      setConnection(result);
      toast({ title: "Calendly connecté ! 📅", description: `Compte : ${result.email}` });
      await loadConnection();
    } catch (e: any) {
      toast({ title: "Erreur de connexion", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    await callCalendly("disconnect", {});
    setConnection(null);
    setEvents([]);
    setEventTypes([]);
    toast({ title: "Calendly déconnecté ✓" });
  };

  const syncEvents = async () => {
    setLoading(true);
    try {
      const result = await callCalendly("sync_events", { days_back: 30, days_ahead: 60 });
      toast({ title: `${result.synced} événement(s) synchronisé(s) ✓` });
      await loadEvents();
    } catch (e: any) {
      toast({ title: "Erreur de sync", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (eventTypeUri: string, context?: string, meetingId?: string) => {
    setLoading(true);
    try {
      const result = await callCalendly("create_link", {
        event_type_uri: eventTypeUri, max_count: 1, context, meeting_id: meetingId,
      });
      toast({ title: "Lien Calendly créé ! 🔗", description: result.booking_url });
      await loadLinks();
      return result.booking_url;
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const cancelEvent = async (eventUri: string, reason?: string) => {
    await callCalendly("cancel_event", { event_uri: eventUri, reason });
    await loadEvents();
    toast({ title: "Événement annulé ✓" });
  };

  const isConnected = !!connection?.is_active;

  return {
    connection, events, eventTypes, links, loading, isConnected,
    connectWithPAT, disconnect, syncEvents, createLink, cancelEvent,
  };
}
