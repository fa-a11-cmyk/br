import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Send, Loader2, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

const STARTERS = [
  { icon: "📊", text: "Résume ma semaine" },
  { icon: "🚨", text: "Tâches critiques en attente" },
  { icon: "👥", text: "Mes prospects les plus chauds" },
  { icon: "🏆", text: "Comment améliorer mes réunions ?" },
];

const OpenClaw = () => {
  const { isEnabled } = useFeatureFlags();
  const oc = useOpenClaw();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [oc.messages]);

  if (!isEnabled("openclaw")) return <Navigate to="/app/dashboard" replace />;

  const handleSend = () => {
    if (!input.trim() || oc.loading) return;
    oc.sendMessage(input);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h1 className="font-display font-bold text-lg">OpenClaw</h1>
          <Badge variant="outline" className="text-xs">Beta</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={oc.newConversation}>
          <Plus className="w-4 h-4 mr-1" />
          Nouveau
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar conversations — desktop */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-border/30 bg-muted/10">
          <div className="p-3 border-b border-border/30">
            <button
              onClick={oc.newConversation}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle conversation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {oc.conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => oc.loadConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                  oc.currentConvId === conv.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                  <span className="truncate">{conv.title}</span>
                </div>
              </button>
            ))}
            {!oc.conversations.length && (
              <p className="text-xs text-muted-foreground text-center p-4">Aucune conversation</p>
            )}
          </div>
        </aside>

        {/* Chat zone */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Empty state — suggestions */}
          {!oc.messages.length ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-xl font-display font-bold mb-2">OpenClaw</h2>
              <p className="text-muted-foreground mb-8 max-w-md text-sm font-body">
                Votre assistant IA qui connaît toutes vos réunions. Posez des questions, obtenez des insights.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-8">
                {STARTERS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => oc.sendMessage(s.text)}
                    className="p-3 rounded-xl border border-border/30 text-left text-sm hover:bg-muted/30 transition-colors font-body"
                  >
                    <span className="mr-2">{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
              {/* Skills summary on mobile */}
              <div className="lg:hidden w-full max-w-lg">
                <p className="text-xs text-muted-foreground mb-2">
                  ⚡ {oc.selectedSkills.length}/{oc.skills.length} Skills actifs
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {oc.skills.map((skill) => (
                    <button
                      key={skill.slug}
                      onClick={() => oc.toggleSkill(skill.slug)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        oc.selectedSkills.includes(skill.slug)
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/30 text-muted-foreground hover:bg-muted/20"
                      }`}
                    >
                      {skill.icon} {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {oc.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/10"
                    }`}
                  >
                    {msg.role === "user" ? "👤" : "⚡"}
                  </div>
                  <div
                    className={`flex-1 max-w-[80%] flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30"
                      }`}
                    >
                      {msg.isLoading ? (
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      ) : msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.skills_used && msg.skills_used.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {msg.skills_used.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary/80"
                          >
                            ⚡ {s.replace(/-/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border/30 p-4">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Posez votre question…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-border/30 bg-muted/20 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 max-h-32 font-body"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || oc.loading}
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {oc.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center font-mono">
              ⚡ Claude Sonnet + {oc.selectedSkills.length} MCP Skill(s)
            </p>
          </div>
        </div>

        {/* Skills panel — desktop */}
        <aside className="hidden lg:flex flex-col w-72 border-l border-border/30 bg-muted/10">
          <div className="p-4 border-b border-border/30">
            <h3 className="font-display font-semibold text-sm">Skills actifs</h3>
            <p className="text-xs text-muted-foreground font-body">
              {oc.selectedSkills.length}/{oc.skills.length} sélectionnés
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {oc.skills.map((skill) => (
              <button
                key={skill.slug}
                onClick={() => oc.toggleSkill(skill.slug)}
                className={`w-full text-left p-2.5 rounded-lg transition-all border ${
                  oc.selectedSkills.includes(skill.slug)
                    ? "border-primary/30 bg-primary/5"
                    : "border-transparent hover:bg-muted/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{skill.icon}</span>
                    <span className="text-xs font-medium truncate max-w-[140px]">{skill.name}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      oc.selectedSkills.includes(skill.slug)
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {oc.selectedSkills.includes(skill.slug) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {skill.usage_count} utilisations
                </p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OpenClaw;
