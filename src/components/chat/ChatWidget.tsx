import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { ContactCard } from "./ContactCard";
import { PricingCard } from "./PricingCard";
import { CTACard } from "./CTACard";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  card?: string | null;
  links?: { icon: string; label: string; url: string }[];
  suggestions?: string[];
  time: string;
}

function formatTime(): string {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="bg-accent/15 px-1 rounded text-xs">$1</code>')
    .replace(/\n/g, "<br/>");
}

function getPageSuggestions(pathname: string, t: (key: string) => string): string[] {
  const map: Record<string, string[]> = {
    "/": ["Comment fonctionne RapidoMeet exactement ?", "Combien coûte RapidoMeet tout compris ?", "Qu'est-ce qu'OpenClaw ?"],
    "/tarifs": ["Quelle différence entre Découverte et Medium ?", "Pourquoi les frais OpenClaw sont séparés (99€) ?", "Comment fonctionne l'essai gratuit 14 jours ?"],
    "/cas-d-usage": ["Quel est le cas d'usage le plus populaire ?", "Comment fonctionne le cas commercial avec le CRM ?", "RapidoMeet fonctionne pour les entretiens RH ?"],
    "/openclaw": ["OpenClaw est vraiment open-source ?", "Comment OpenClaw apprend de mes réunions ?", "Puis-je ajouter mes propres MCPs ?"],
    "/docs": ["Comment obtenir ma clé API ?", "Y a-t-il un SDK Node.js ?", "L'API est-elle disponible en sandbox ?"],
    "/faq": ["Mes données sont-elles hébergées en France ?", "RapidoMeet est-il conforme au RGPD ?", "Que se passe-t-il si je dépasse mon quota ?"],
    "/a-propos": ["Qui est Michael Kebail-Ali ?", "Comment devenir partenaire BraindCode ?", "RapidoMeet sera-t-il à VivaTech 2026 ?"],
  };
  if (map[pathname]) return map[pathname];
  for (const [path, suggestions] of Object.entries(map)) {
    if (pathname.startsWith(path) && path !== "/") return suggestions;
  }
  return map["/"];
}

function getWelcomeMessage(pathname: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    "/": t("chat.welcomeHome"),
    "/tarifs": t("chat.welcomePricing"),
    "/openclaw": t("chat.welcomeOpenClaw"),
    "/docs": t("chat.welcomeDocs"),
    "/faq": t("chat.welcomeFaq"),
  };
  return map[pathname] || t("chat.welcomeDefault");
}

export function ChatWidget() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation("app");
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("chatwidget_dismissed") === "true");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) {
      setConversationId(null);
      setHistoryLoaded(false);
      initWelcome();
      return;
    }

    (async () => {
      try {
        const { data: convos } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (convos && convos.length > 0) {
          const convoId = convos[0].id;
          setConversationId(convoId);

          const { data: dbMessages } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("conversation_id", convoId)
            .order("created_at", { ascending: true })
            .limit(100);

          if (dbMessages && dbMessages.length > 0) {
            const loaded: ChatMessage[] = dbMessages.map((m) => ({
              id: m.id,
              role: m.role as "bot" | "user",
              content: m.content,
              card: m.card,
              links: (m.links as any[]) || [],
              suggestions: (m.suggestions as string[]) || [],
              time: new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            }));
            setMessages(loaded);
            setShowQuickActions(false);
            setHistoryLoaded(true);
            return;
          }
        }

        const { data: newConvo } = await supabase
          .from("chat_conversations")
          .insert({ user_id: user.id, title: "RapidoBot" })
          .select("id")
          .single();

        if (newConvo) setConversationId(newConvo.id);
        initWelcome();
        setHistoryLoaded(true);
      } catch (err) {
        console.error("Failed to load chat history:", err);
        initWelcome();
        setHistoryLoaded(true);
      }
    })();
  }, [user]);

  function initWelcome() {
    const suggestions = getPageSuggestions(location.pathname, t);
    setMessages([{
      id: crypto.randomUUID(),
      role: "bot",
      content: getWelcomeMessage(location.pathname, t),
      suggestions,
      links: [],
      card: null,
      time: formatTime(),
    }]);
  }

  const persistMessage = useCallback(async (msg: ChatMessage) => {
    if (!user || !conversationId) return;
    try {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: msg.role,
        content: msg.content,
        card: msg.card || null,
        links: (msg.links || []) as any,
        suggestions: (msg.suggestions || []) as any,
      });
      await supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } catch (err) {
      console.error("Failed to persist message:", err);
    }
  }, [user, conversationId]);

  useEffect(() => {
    const shown = sessionStorage.getItem("rm-teaser-shown");
    if (!shown) {
      const timer = setTimeout(() => {
        if (!isOpen) {
          setTeaserVisible(true);
          setHasNewMessage(true);
          sessionStorage.setItem("rm-teaser-shown", "1");
        }
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem("chatwidget_dismissed", "true");
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((p) => !p);
    setTeaserVisible(false);
    setHasNewMessage(false);
  }, []);

  const startNewConversation = useCallback(async () => {
    if (user) {
      const { data: newConvo } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title: "RapidoBot" })
        .select("id")
        .single();
      if (newConvo) setConversationId(newConvo.id);
    }
    setShowQuickActions(true);
    initWelcome();
  }, [user, location.pathname]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text?.trim()) return;
    const userMsg = text.trim();
    setInputValue("");
    setShowQuickActions(false);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMsg,
      time: formatTime(),
    };
    setMessages((prev) => [...prev, userMessage]);
    persistMessage(userMessage);
    setIsTyping(true);

    try {
      const history = [...messages, userMessage].map((m) => ({
        role: m.role === "bot" ? "assistant" as const : "user" as const,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("rapidobot-chat", {
        body: { messages: history, currentPage: location.pathname },
      });

      setIsTyping(false);
      if (error) throw error;

      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        content: data.message || t("chat.fallback"),
        card: data.card || null,
        links: data.links || [],
        suggestions: data.suggestions || [],
        time: formatTime(),
      };

      setMessages((prev) => [...prev, botMessage]);
      persistMessage(botMessage);
    } catch (err) {
      setIsTyping(false);
      console.error("RapidoBot error:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        content: t("chat.errorMessage"),
        card: "contact_card",
        links: [],
        suggestions: [],
        time: formatTime(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      persistMessage(errorMsg);
    }
  }, [messages, location.pathname, persistMessage, t]);

  const renderCard = (cardType: string) => {
    switch (cardType) {
      case "contact_card": return <ContactCard />;
      case "pricing_card": return <PricingCard />;
      case "cta_card": return <CTACard />;
      default: return null;
    }
  };

  const quickActions = [
    { icon: "🚀", label: t("chat.qa1Label"), msg: t("chat.qa1Msg") },
    { icon: "💰", label: t("chat.qa2Label"), msg: t("chat.qa2Msg") },
    { icon: "🔌", label: t("chat.qa3Label"), msg: t("chat.qa3Msg") },
    { icon: "⚡", label: t("chat.qa4Label"), msg: t("chat.qa4Msg") },
    { icon: "📞", label: t("chat.qa5Label"), msg: t("chat.qa5Msg") },
    { icon: "🎁", label: t("chat.qa6Label"), msg: t("chat.qa6Msg") },
  ];

  if (dismissed) return null;

  return (
    <>
      {/* Teaser bubble */}
      {teaserVisible && !isOpen && (
        <div onClick={toggleChat}
          className="fixed z-[9998] cursor-pointer animate-fade-in bg-card border border-border rounded-2xl rounded-br-sm px-4 py-3 shadow-xl max-w-[260px]"
          style={{ bottom: "100px", right: "28px" }}>
          <p className="font-body text-sm text-foreground font-semibold">{t("chat.teaser")}</p>
          <p className="font-body text-xs text-muted-foreground mt-1">{t("chat.teaserSub")}</p>
          <button onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            className="absolute top-1 right-2 text-muted-foreground hover:text-foreground text-xs">×</button>
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed z-[9998] flex flex-col overflow-hidden bg-background border border-border shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(233,30,140,0.08)]"
          style={{
            bottom: "100px", right: "28px",
            width: "min(380px, calc(100vw - 24px))",
            height: "min(580px, 70vh)",
            borderRadius: "20px",
            animation: "chatOpen 0.3s ease forwards",
          }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 shrink-0 border-b border-border"
            style={{ height: "64px", background: "linear-gradient(135deg, hsl(var(--fuchsia) / 0.1), hsl(var(--violet) / 0.1))" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))" }}>🤖</div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold text-foreground">{t("chat.headerName")}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rm-success" style={{ animation: "blink 2s infinite" }} />
                <span className="font-body text-[11px] text-muted-foreground">
                  {user ? t("chat.onlineAuth") : t("chat.online")}
                </span>
              </div>
            </div>
            {user && messages.length > 1 && (
              <button onClick={startNewConversation}
                title={t("chat.newConversation")}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground text-sm">
                ＋
              </button>
            )}
            <a href="https://wa.me/33614189225" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-sm">💬</a>
            <button onClick={toggleChat}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground text-lg">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scrollbar-hide">
            {user && historyLoaded && messages.length > 1 && (
              <p className="text-center font-mono text-[9px] text-muted-foreground/60 mb-1">
                {t("chat.historyRestored", { count: messages.length })}
              </p>
            )}
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                {idx === 0 && <p className="text-center font-mono text-[10px] text-muted-foreground mb-3">{msg.time}</p>}
                {msg.role === "bot" ? (
                  <div className="flex gap-2 items-start animate-fade-in">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))" }}>🤖</div>
                    <div className="flex flex-col gap-2 max-w-[85%]">
                      <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 bg-secondary border border-border">
                        <div className="font-body text-[13px] text-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      </div>
                      {msg.links && msg.links.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.links.map((link, i) => (
                            <a key={i} href={link.url}
                              className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                              {link.icon} {link.label} →
                            </a>
                          ))}
                        </div>
                      )}
                      {msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          {msg.suggestions.map((q, i) => (
                            <button key={i} onClick={() => sendMessage(q)}
                              className="text-left font-body text-xs px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:border-primary hover:text-foreground transition-all">
                              💬 {q}
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.card && renderCard(msg.card)}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end animate-fade-in">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2.5"
                      style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))" }}>
                      <p className="font-body text-[13px] text-white leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 items-start animate-fade-in">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))" }}>🤖</div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-secondary border border-border">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-muted-foreground"
                        style={{ animation: `typingDot 1.2s ease infinite ${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {showQuickActions && messages.length <= 1 && (
            <div className="px-4 pb-2 shrink-0 border-t border-border">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider py-2">{t("chat.quickActionsTitle")}</p>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {quickActions.map((a, i) => (
                  <button key={i} onClick={() => sendMessage(a.msg)}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 font-body text-xs text-foreground bg-secondary border border-border hover:border-primary hover:bg-primary/10 transition-all whitespace-nowrap">
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 px-3 py-3 shrink-0 border-t border-border bg-card">
            <textarea ref={inputRef} value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue); } }}
              placeholder={t("chat.placeholder")}
              rows={1}
              className="flex-1 font-body text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none bg-secondary border border-border rounded-xl px-3 py-2.5 focus:border-primary transition-colors scrollbar-hide"
              style={{ maxHeight: "100px", lineHeight: "1.5" }}
            />
            <button onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={{
                background: inputValue.trim() ? "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))" : "hsl(var(--muted))",
                cursor: inputValue.trim() ? "pointer" : "default",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <div className="fixed z-[9999] flex flex-col items-end gap-2" style={{ bottom: "28px", right: "28px" }}>
        <div className="relative">
          {!isOpen && (
            <>
              <span className="absolute inset-0 rounded-full"
                style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))", animation: "pulseRing 2.5s ease infinite" }} />
              <button
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center text-xs z-10 transition-colors"
                title="Masquer le chatbot"
              >
                ×
              </button>
            </>
          )}
          <button onClick={toggleChat}
            className="relative w-[60px] h-[60px] rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{ background: "linear-gradient(135deg, hsl(var(--fuchsia)), hsl(var(--violet)))", boxShadow: "0 4px 20px rgba(233,30,140,0.3)" }}>
            {isOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
                <rect x="20" y="4" width="8" height="22" rx="4" fill="white" />
                <path d="M14 18v4a10 10 0 0020 0v-4" stroke="white" strokeWidth="3" strokeLinecap="round" />
                <line x1="24" y1="32" x2="24" y2="38" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
          </button>
          {!isOpen && hasNewMessage && (
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-rm-fuchsia text-white text-[10px] font-bold flex items-center justify-center">1</span>
          )}
        </div>
      </div>
    </>
  );
}
