import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Meeting } from "@/hooks/useMeetings";

export function useMeetingRealtime(meetingId: string | undefined) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!meetingId) return;
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single();
    if (data) setMeeting(data as Meeting);
    setLoading(false);
  }, [meetingId]);

  useEffect(() => {
    if (!meetingId) return;
    reload();

    const channel = supabase
      .channel(`meeting-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "meetings",
          filter: `id=eq.${meetingId}`,
        },
        (payload) => {
          setMeeting(payload.new as Meeting);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, reload]);

  return { meeting, loading, reload };
}
