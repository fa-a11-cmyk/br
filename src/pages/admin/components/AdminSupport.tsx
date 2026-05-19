import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600",
  pending: "bg-amber-500/10 text-amber-600",
  resolved: "bg-green-500/10 text-green-600",
  spam: "bg-muted text-muted-foreground",
};

export default function AdminSupport() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("open");
  const [stats, setStats] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadConversations(); loadStats(); }, [filter]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-support")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, () => { loadConversations(); loadStats(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.conversation_id === selected?.id) {
          setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected?.id]);

  const loadConversations = async () => {
    let q = supabase.from("support_conversations").select("*").order("updated_at", { ascending: false }).limit(50);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setConversations(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase.from("support_stats").select("*").single();
    setStats(data);
  };

  const loadConversationMessages = async (conv: any) => {
    setSelected(conv);
    const { data } = await supabase.from("support_messages").select("*").eq("conversation_id", conv.id).order("created_at");
    setMessages(data || []);
  };

  const sendReply = async (isInternal = false) => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("support_messages").insert({
        conversation_id: selected.id,
        sender_type: "agent",
        sender_id: user?.id,
        content: reply,
        is_internal: isInternal,
      });
      if (!selected.first_response_at) {
        await supabase.from("support_conversations").update({
          first_response_at: new Date().toISOString(),
          status: "open",
          updated_at: new Date().toISOString(),
        }).eq("id", selected.id);
      }
      setReply("");
      toast({ title: isInternal ? "Note interne ajoutée ✓" : "Réponse envoyée ✓" });
    } finally { setSending(false); }
  };

  const updateStatus = async (status: string) => {
    await supabase.from("support_conversations").update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id);
    setSelected((prev: any) => ({ ...prev, status }));
    loadConversations();
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
          {[
            { label: "Ouvertes", value: stats.open_count, color: "text-blue-600" },
            { label: "En attente", value: stats.pending_count, color: "text-amber-600" },
            { label: "Résolues aujourd'hui", value: stats.resolved_today, color: "text-green-600" },
            { label: "Tps réponse moy.", value: stats.avg_first_response_minutes ? `${stats.avg_first_response_minutes}min` : "—", color: "" },
            { label: "Satisfaction", value: stats.avg_satisfaction ? `${stats.avg_satisfaction}/5 ⭐` : "—", color: "text-amber-500" },
          ].map(kpi => (
            <Card key={kpi.label} className="p-3">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${kpi.color}`}>{kpi.value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Conversation list */}
        <div className="w-80 flex flex-col border border-border/30 rounded-xl overflow-hidden shrink-0">
          <div className="p-3 border-b border-border/30 flex gap-1 flex-wrap">
            {["open", "pending", "resolved", "all"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-2 py-1 rounded-lg transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "hover:bg-muted/30"}`}>
                {s === "all" ? "Toutes" : s === "open" ? "Ouvertes" : s === "pending" ? "En attente" : "Résolues"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <button key={conv.id} onClick={() => loadConversationMessages(conv)}
                className={`w-full text-left p-3 border-b border-border/20 hover:bg-muted/20 transition-colors ${selected?.id === conv.id ? "bg-muted/30" : ""}`}>
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-sm truncate">{conv.subject || "Visiteur"}</span>
                  <Badge className={`text-xs shrink-0 ml-1 ${STATUS_COLORS[conv.status]}`}>{conv.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(conv.updated_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
              </button>
            ))}
            {conversations.length === 0 && <div className="text-center text-muted-foreground py-8 text-sm">Aucune conversation</div>}
          </div>
        </div>

        {/* Messages area */}
        {selected ? (
          <div className="flex-1 flex flex-col border border-border/30 rounded-xl overflow-hidden min-w-0">
            <div className="p-4 border-b border-border/30 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-medium text-sm">{selected.subject}</h3>
                <p className="text-xs text-muted-foreground">
                  {selected.metadata?.user_context?.plan ? `Plan : ${selected.metadata.user_context.plan}` : "Non connecté"}
                </p>
              </div>
              <Select value={selected.status} onValueChange={updateStatus}>
                <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["open", "pending", "resolved", "spam"].map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender_type === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    msg.sender_type === "user" ? "bg-primary/10" : msg.sender_type === "bot" ? "bg-primary text-primary-foreground" : msg.is_internal ? "bg-amber-500/10" : "bg-muted"
                  }`}>
                    {msg.sender_type === "user" ? "👤" : msg.sender_type === "bot" ? "⚡" : "🛡"}
                  </div>
                  <div className="max-w-[75%]">
                    <div className={`rounded-2xl px-3 py-2 text-sm ${
                      msg.sender_type === "user" ? "bg-primary/10" : msg.is_internal ? "bg-amber-500/10 border border-amber-300/30" : "bg-muted/30"
                    }`}>
                      {msg.is_internal && <p className="text-xs text-amber-600 font-medium mb-1">🔒 Note interne</p>}
                      {msg.content}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/30 p-4 shrink-0">
              <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Rédigez votre réponse..." rows={3} className="text-sm mb-3" />
              <div className="flex gap-2">
                <Button onClick={() => sendReply(false)} disabled={!reply.trim() || sending} className="flex-1">
                  {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Envoyer au client
                </Button>
                <Button variant="outline" onClick={() => sendReply(true)} disabled={!reply.trim() || sending} title="Note interne">
                  🔒 Note interne
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground border border-border/30 rounded-xl">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
