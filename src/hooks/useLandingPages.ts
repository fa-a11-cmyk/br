import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLandingPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { data: pagesData },
      { data: bookingsData },
      { data: templatesData },
    ] = await Promise.all([
      supabase.from("landing_pages")
        .select("id,slug,title,status,view_count,booking_count,has_booking_form,has_video_room,created_at,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase.from("landing_bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("booked_date", { ascending: true })
        .gte("booked_date", new Date().toISOString().split("T")[0])
        .limit(50),
      supabase.from("landing_templates")
        .select("*")
        .eq("is_published", true)
        .order("order_index"),
    ]);

    setPages(pagesData || []);
    setBookings(bookingsData || []);
    setTemplates(templatesData || []);
    setLoading(false);
  };

  const callBooking = async (action: string, payload: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/landing-booking`, {
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

  const savePage = async (pageData: any, pageId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = pageData.slug ||
      pageData.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 40) + "-" +
      Math.random().toString(36).substring(2, 6);

    if (pageId) {
      const { data } = await supabase.from("landing_pages")
        .update({ ...pageData, updated_at: new Date().toISOString() })
        .eq("id", pageId)
        .eq("user_id", user.id)
        .select().single();
      await load();
      return data;
    } else {
      const { data } = await supabase.from("landing_pages")
        .insert({ ...pageData, user_id: user.id, slug })
        .select().single();
      await load();
      return data;
    }
  };

  const publishPage = async (pageId: string) => {
    await supabase.from("landing_pages").update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", pageId);
    toast({ title: "Page publiée ✓" });
    await load();
  };

  const deletePage = async (pageId: string) => {
    await supabase.from("landing_pages").delete().eq("id", pageId);
    toast({ title: "Page supprimée ✓" });
    await load();
  };

  const cancelBooking = async (bookingId: string, reason?: string) => {
    await callBooking("cancel_booking", { booking_id: bookingId, reason });
    toast({ title: "RDV annulé ✓" });
    await load();
  };

  const generateLandingAI = async (params: any) => {
    return callBooking("generate_landing", params);
  };

  return {
    pages, bookings, templates, loading,
    savePage, publishPage, deletePage,
    cancelBooking, generateLandingAI,
    callBooking, reload: load,
  };
}
