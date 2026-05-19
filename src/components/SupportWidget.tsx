import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Minimize2, CheckCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupportChat } from "@/hooks/useSupportChat";

function ChatMessage({ message, onQuickReply }: { message: any; onQuickReply: (v: string) => void }) {
  const isUser = message.sender_type === "user";
  const isSystem = message.sender_type === "system";

  if (isSystem) {
    return <div className="text-center text-xs text-muted-foreground py-1">{message.content}</div>;
  }

  const quickReplies = message.payload?.quick_replies;
  const card = message.payload?.card;

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm shrink-0">
          {message.sender_type === "bot" ? "⚡" : "👤"}
        </div>
      )}
      <div className={`flex-1 max-w-[80%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-3 py-2 text-sm ${isUser ? "bg-primary text-primary-foreground" : "bg-muted/30 text-foreground"}`}>
          {message.content}
        </div>
        {quickReplies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {quickReplies.map((qr: any) => (
              <button key={qr.value} onClick={() => onQuickReply(qr.value)}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors">
                {qr.label}
              </button>
            ))}
          </div>
        )}
        {card && (
          <div className="mt-2 border border-border/30 rounded-xl overflow-hidden max-w-full">
            <div className="p-3">
              <p className="font-medium text-sm">{card.title}</p>
              {card.desc && <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>}
              {card.cta_url && <a href={card.cta_url} className="text-xs text-primary hover:underline mt-2 block">{card.cta_label} →</a>}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export function SupportWidget() {
  const { isOpen, messages, loading, sending, unreadCount, openChat, closeChat, sendMessage, resolve } = useSupportChat();
  const [input, setInput] = useState("");
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("chatbot_dismissed") === "true");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    sendMessage(input);
    setInput("");
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("chatbot_dismissed", "true");
    closeChat();
  };

  if (dismissed) return null;

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {!isOpen && (
          <div className="bg-background border border-border/30 rounded-2xl p-3 shadow-lg max-w-[200px] text-sm cursor-pointer relative" onClick={() => openChat()}>
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center text-xs transition-colors"
              title="Masquer le chatbot"
            >
              ×
            </button>
            <p className="font-medium text-xs">👋 Besoin d'aide ?</p>
            <p className="text-xs text-muted-foreground">Réponse en quelques secondes</p>
          </div>
        )}
        <button onClick={() => isOpen ? closeChat() : openChat()}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-110 relative">
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {unreadCount > 0 && !isOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-[500px] bg-background border border-border/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center text-lg">⚡</div>
              <div>
                <p className="font-semibold text-sm text-primary-foreground">Support RapidoMeet</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <p className="text-xs text-primary-foreground/80">En ligne · Réponse rapide</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSatisfaction(true)} className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-colors" title="Résoudre">
                <CheckCircle className="w-4 h-4 text-primary-foreground/80" />
              </button>
              <button onClick={closeChat} className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-colors">
                <Minimize2 className="w-4 h-4 text-primary-foreground/80" />
              </button>
            </div>
          </div>

          {showSatisfaction ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <p className="font-medium mb-4">Votre problème est résolu ? 😊</p>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setSatisfaction(s)}
                    className={`w-10 h-10 rounded-full text-xl transition-all ${satisfaction === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                    {s === 1 ? "😞" : s === 2 ? "😕" : s === 3 ? "😐" : s === 4 ? "😊" : "😍"}
                  </button>
                ))}
              </div>
              <Button onClick={() => resolve(satisfaction || undefined)} className="w-full">Terminer la conversation</Button>
              <button onClick={() => setShowSatisfaction(false)} className="text-xs text-muted-foreground mt-2 hover:underline">Continuer la conversation</button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {messages.map(msg => (
                      <ChatMessage key={msg.id} message={msg} onQuickReply={(v) => sendMessage(v)} />
                    ))}
                    {sending && (
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">⚡</div>
                        <div className="bg-muted/30 rounded-2xl px-4 py-2">
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              <div className="border-t border-border/30 p-3 shrink-0">
                <div className="flex gap-2">
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Écrivez votre message..."
                    className="flex-1 text-sm bg-muted/20 border border-border/30 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  <button onClick={handleSend} disabled={!input.trim() || sending}
                    className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 text-center">Propulsé par ⚡ RapidoMeet</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
