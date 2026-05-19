import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  skills_used?: string[];
  timestamp: string;
  isLoading?: boolean;
}

interface Skill {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  mcp_tool_name: string;
  usage_count: number;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  skills_used: string[];
}

export function useOpenClaw() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: sk } = await supabase
        .from("openclaw_skills" as any)
        .select("*")
        .eq("is_active", true)
        .order("usage_count", { ascending: false });
      if (sk) {
        setSkills(sk as any);
        setSelectedSkills((sk as any[]).slice(0, 3).map((s) => s.slug));
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: convs } = await supabase
        .from("openclaw_conversations" as any)
        .select("id,title,updated_at,skills_used")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (convs) setConversations(convs as any);
    };
    init();
  }, []);

  const createConversation = async (msg: string): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const title = msg.length > 50 ? msg.substring(0, 47) + "..." : msg;
    const { data } = await supabase
      .from("openclaw_conversations" as any)
      .insert({ user_id: user.id, title, messages: [], skills_used: [] } as any)
      .select()
      .single();
    if (data) {
      const conv = data as any;
      setCurrentConvId(conv.id);
      setConversations((prev) => [conv, ...prev]);
      return conv.id;
    }
    return null;
  };

  const sendMessage = async (input: string) => {
    if (!input.trim() || loading) return;

    let convId = currentConvId;
    if (!convId) convId = await createConversation(input);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const history = [...messages.filter((m) => !m.isLoading), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${supabaseUrl}/functions/v1/openclaw-gateway`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: history,
          conversation_id: convId,
          selected_skills: selectedSkills,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        skills_used: data.skills_used || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev.filter((m) => !m.isLoading), assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => !m.isLoading));
      toast({ title: "Erreur OpenClaw", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    const { data } = await supabase
      .from("openclaw_conversations" as any)
      .select("messages")
      .eq("id", id)
      .single();
    if (data) {
      setCurrentConvId(id);
      const msgs = ((data as any).messages as Message[]) || [];
      setMessages(msgs.map((m) => ({ ...m, id: m.id || crypto.randomUUID() })));
    }
  };

  const newConversation = () => {
    setCurrentConvId(null);
    setMessages([]);
  };

  const toggleSkill = (slug: string) => {
    setSelectedSkills((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return {
    conversations,
    currentConvId,
    messages,
    skills,
    selectedSkills,
    loading,
    sendMessage,
    loadConversation,
    newConversation,
    toggleSkill,
  };
}
