import { MOCK_CHANGELOG, MOCK_ROADMAP } from "@/data/mockData";
import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import PageHead from "@/components/PageHead";

const typeBadge = {
  new: { label: "NOUVEAU", bg: "bg-fuchsia-d", text: "text-[hsl(var(--fuchsia-l))]", prefix: "+" },
  improved: { label: "AMÉLIORÉ", bg: "bg-violet-d", text: "text-[hsl(var(--violet-l))]", prefix: "↑" },
  fixed: { label: "CORRIGÉ", bg: "bg-success-d", text: "text-[hsl(var(--success))]", prefix: "✓" },
} as const;

const Changelog = () => {
  const [tab, setTab] = useState<"changelog" | "roadmap">("changelog");

  return (
    <div className="min-h-screen bg-background">
      <PageHead title="Changelog & Roadmap" description="Suivez les dernières mises à jour, nouvelles fonctionnalités et la roadmap de RapidoMeet." path="/changelog" />
      {/* Header */}
      <div className="max-w-[800px] mx-auto px-6 pt-20 pb-10">
        <a href="/" className="font-display font-extrabold text-lg text-gradient mb-8 inline-block">RapidoMeet</a>
        <div className="flex gap-4 mb-8">
          {(["changelog", "roadmap"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-display font-extrabold text-[32px] tracking-tight transition-colors ${
                tab === t ? "text-foreground" : "text-muted-foreground/30 hover:text-muted-foreground/60"
              }`}
            >
              {t === "changelog" ? "Changelog" : "Roadmap"}
            </button>
          ))}
        </div>
        <p className="font-body text-[15px] text-muted-foreground">
          {tab === "changelog"
            ? "Toutes les nouveautés et corrections de RapidoMeet."
            : "Ce que nous construisons et ce qui arrive bientôt."}
        </p>
      </div>

      <div className="max-w-[800px] mx-auto px-6 pb-20">
        {tab === "changelog" ? (
          <div className="space-y-12">
            {MOCK_CHANGELOG.map((release) => (
              <div key={release.version}>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-display font-extrabold text-xl text-foreground">v{release.version}</span>
                  <span className="font-mono text-xs text-muted-foreground">— {release.date}</span>
                </div>
                <div className="border-l-2 border-border/40 pl-5 space-y-2">
                  {release.items.map((item, i) => {
                    const badge = typeBadge[item.type];
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`${badge.bg} ${badge.text} font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0 mt-0.5`}>
                          {badge.label}
                        </span>
                        <p className="font-body text-sm text-foreground/80">
                          {badge.prefix} {item.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              { key: "inProgress" as const, title: "🔄 En cours", items: MOCK_ROADMAP.inProgress },
              { key: "planned" as const, title: "📋 Planifié", items: MOCK_ROADMAP.planned },
              { key: "ideas" as const, title: "💡 Idées", items: MOCK_ROADMAP.ideas },
            ]).map((col) => (
              <div key={col.key}>
                <h3 className="font-display font-bold text-sm text-muted-foreground mb-4">{col.title}</h3>
                <div className="space-y-3">
                  {col.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-card border border-border/30 hover:border-accent/30 transition-colors"
                    >
                      <h4 className="font-display font-bold text-sm text-foreground mb-1">{item.title}</h4>
                      <p className="font-body text-xs text-muted-foreground mb-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {item.tags.map((tag) => (
                            <span key={tag} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <ThumbsUp className="h-3 w-3" />
                          <span className="font-mono text-[10px]">{item.votes}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Changelog;
