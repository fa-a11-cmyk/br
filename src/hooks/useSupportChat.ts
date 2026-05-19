import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const visitorId = useMemo(() => {
    let id = localStorage.getItem("rapidomeet_visitor_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("rapidomeet_visitor_id", id);
    }
    return id;
  }, []);

  const callSupport = useCallback(async (action: string, payload: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/support-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
      },
      body: JSON.stringify({ action, payload }),
    });
    return res.json();
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    const data = await callSupport("get_messages", { conversation_id: convId });
    if (data.messages) {
      setMessages(data.messages);
      setUnreadCount(0);
    }
  }, [callSupport]);

  const openChat = useCallback(async (initialMessage?: string) => {
    setIsOpen(true);
    if (!conversationId) {
      setLoading(true);
      const data = await callSupport("start_conversation", {
        visitor_id: visitorId,
        page_url: window.location.href,
        initial_message: initialMessage,
      });
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
        await loadMessages(data.conversation_id);
      }
      setLoading(false);
    }
  }, [conversationId, callSupport, visitorId, loadMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`support-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (!isOpen) setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, isOpen]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !conversationId) return;
    setSending(true);

    const tempMsg = {
      id: "temp-" + Date.now(),
      conversation_id: conversationId,
      sender_type: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await callSupport("send_message", { conversation_id: conversationId, content });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  }, [conversationId, callSupport]);

  const resolve = useCallback(async (satisfaction?: number) => {
    if (!conversationId) return;
    await callSupport("resolve", { conversation_id: conversationId, satisfaction });
    setIsOpen(false);
  }, [conversationId, callSupport]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setUnreadCount(0);
  }, []);

  return { isOpen, conversationId, messages, loading, sending, unreadCount, openChat, closeChat, sendMessage, resolve };
}
