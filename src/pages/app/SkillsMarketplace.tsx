import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useSkillsMarketplace } from "@/hooks/useSkillsMarketplace";

const CATEGORIES = [
  { key: "all", label: "Tous" },
  { key: "productivity", label: "⚡ Productivité" },
  { key: "crm", label: "👥 CRM" },
  { key: "automation", label: "🤖 Automatisation" },
  { key: "analytics", label: "📊 Analytics" },
  { key: "custom", label: "🛠 Custom" },
];

const PLAN_COLORS: Record<string, string> = {
  free: "bg-green-500/10 text-green-600",
  starter: "bg-blue-500/10 text-blue-600",
  pro: "bg-purple-500/10 text-purple-600",
};

const SkillsMarketplace = () => {
  const { isEnabled } = useFeatureFlags();
  const {
    skills, loading, installing, isInstalled,
    install, uninstall, rateSkill, installedSkills,
  } = useSkillsMarketplace();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [view, setView] = useState<"grid" | "installed">("grid");

  if (!isEnabled("skills_marketplace")) return <Navigate to="/app/dashboard" replace />;

  const filtered = skills.filter(s => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      (s.tags || []).some((t: string) => t.includes(search.toLowerCase()));
    const matchCat = filterCat === "all" || s.category === filterCat;
    return matchSearch && matchCat;
  });

  const featured = filtered.filter(s => s.is_featured);
  const regular = filtered.filter(s => !s.is_featured);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">⚡ Skills Marketplace</h1>
          <p className="text-muted-foreground text-sm">
            {skills.length} skills disponibles · {installedSkills.length} installés
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "grid" ? "default" : "outline"} size="sm" onClick={() => setView("grid")}>
            🏪 Marketplace
          </Button>
          <Button variant={view === "installed" ? "default" : "outline"} size="sm" onClick={() => setView("installed")}>
            ✅ Installés ({installedSkills.length})
          </Button>
        </div>
      </div>

      {view === "installed" ? (
        <InstalledSkillsView skills={installedSkills} onUninstall={uninstall} onSelect={setSelectedSkill} />
      ) : (
        <>
          {/* Search + filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher un skill..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setFilterCat(cat.key)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${filterCat === cat.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Featured */}
          {featured.length > 0 && filterCat === "all" && !search && (
            <div>
              <h2 className="font-semibold text-sm mb-3">⭐ Skills recommandés</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featured.map(skill => (
                  <SkillCard key={skill.id} skill={skill} installed={isInstalled(skill.id)} installing={installing === skill.id}
                    onInstall={() => install(skill)} onUninstall={() => uninstall(skill.id)} onSelect={() => setSelectedSkill(skill)} />
                ))}
              </div>
            </div>
          )}

          {/* All skills */}
          {(featured.length === 0 || filterCat !== "all" || search ? filtered : regular).length > 0 && (
            <div>
              {featured.length > 0 && filterCat === "all" && !search && (
                <h2 className="font-semibold text-sm mb-3">Tous les skills</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(featured.length === 0 || filterCat !== "all" || search ? filtered : regular).map(skill => (
                  <SkillCard key={skill.id} skill={skill} installed={isInstalled(skill.id)} installing={installing === skill.id}
                    onInstall={() => install(skill)} onUninstall={() => uninstall(skill.id)} onSelect={() => setSelectedSkill(skill)} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-muted-foreground">Aucun skill trouvé pour "{search}"</p>
            </div>
          )}
        </>
      )}

      {/* Skill detail dialog */}
      {selectedSkill && (
        <SkillDetailDialog
          skill={selectedSkill} installed={isInstalled(selectedSkill.id)} installing={installing === selectedSkill.id}
          onInstall={() => install(selectedSkill)} onUninstall={() => uninstall(selectedSkill.id)}
          onRate={(rating, review) => rateSkill(selectedSkill.id, rating, review)}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
};

function SkillCard({ skill, installed, installing, onInstall, onUninstall, onSelect }: any) {
  return (
    <Card className={`p-4 flex flex-col hover:shadow-md transition-shadow cursor-pointer ${installed ? "border-primary/30 bg-primary/5" : ""}`} onClick={onSelect}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{skill.icon}</span>
          <div>
            <h3 className="font-semibold text-sm">{skill.name}</h3>
            <p className="text-xs text-muted-foreground">par {skill.author}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={`text-xs ${PLAN_COLORS[skill.required_plan] || ""}`}>
            {skill.required_plan === "free" ? "Gratuit" : skill.required_plan}
          </Badge>
          {skill.is_featured && <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">⭐</Badge>}
        </div>
      </div>

      <p className="text-sm text-muted-foreground flex-1 line-clamp-2 mb-3">{skill.description}</p>

      {skill.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {skill.tags.slice(0, 3).map((t: string) => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">#{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>⬇️ {skill.install_count || 0}</span>
        {skill.rating_count > 0 && <span>⭐ {skill.rating_avg}/5 ({skill.rating_count})</span>}
      </div>

      <Button size="sm" variant={installed ? "outline" : "default"} className="w-full text-xs" disabled={installing}
        onClick={e => { e.stopPropagation(); installed ? onUninstall() : onInstall(); }}>
        {installing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : installed ? "✅ Installé" : "⬇️ Installer"}
      </Button>
    </Card>
  );
}

function InstalledSkillsView({ skills, onUninstall, onSelect }: any) {
  if (skills.length === 0) return (
    <div className="text-center py-12">
      <p className="text-5xl mb-4">📭</p>
      <h3 className="font-semibold mb-2">Aucun skill installé</h3>
      <p className="text-muted-foreground text-sm">Explorez le marketplace et installez des skills pour enrichir OpenClaw.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {skills.map((skill: any) => (
        <Card key={skill.id} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => onSelect(skill)}>
            <span className="text-2xl shrink-0">{skill.icon}</span>
            <div className="min-w-0">
              <p className="font-medium text-sm">{skill.name}</p>
              <p className="text-xs text-muted-foreground truncate">{skill.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="text-xs bg-green-500/10 text-green-600">✅ Actif</Badge>
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => onUninstall(skill.id)}>
              Désinstaller
            </Button>
          </div>
        </Card>
      ))}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
        <p className="text-sm text-muted-foreground mb-2">Vos skills installés sont disponibles dans OpenClaw</p>
        <a href="/app/openclaw"><Button size="sm" variant="outline">⚡ Ouvrir OpenClaw →</Button></a>
      </div>
    </div>
  );
}

function SkillDetailDialog({ skill, installed, installing, onInstall, onUninstall, onRate, onClose }: any) {
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [showRating, setShowRating] = useState(false);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{skill.icon}</span>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{skill.name}</h2>
                <p className="text-sm text-muted-foreground">par {skill.author}{skill.version && ` · v${skill.version}`}</p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <Badge className={PLAN_COLORS[skill.required_plan] || ""}>{skill.required_plan === "free" ? "Gratuit" : skill.required_plan}</Badge>
                {skill.is_featured && <Badge className="bg-amber-500/10 text-amber-600 text-xs border-amber-500/30">⭐ Recommandé</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>⬇️ {skill.install_count || 0} installations</span>
              {skill.rating_count > 0 && <span>⭐ {skill.rating_avg}/5 ({skill.rating_count} avis)</span>}
            </div>
          </div>
        </div>

        {skill.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skill.tags.map((t: string) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted/50">#{t}</span>)}
          </div>
        )}

        {skill.readme && (
          <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/10 rounded-xl p-4">
            <div dangerouslySetInnerHTML={{
              __html: skill.readme
                .replace(/\n\n/g, "<br/><br/>")
                .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/^- (.+)$/gm, "<li>$1</li>")
                .replace(/`(.+?)`/g, "<code>$1</code>"),
            }} />
          </div>
        )}

        {installed && !showRating && (
          <button onClick={() => setShowRating(true)} className="text-sm text-primary hover:underline text-center w-full">
            ⭐ Laisser un avis
          </button>
        )}

        {showRating && (
          <div className="space-y-3 p-4 bg-muted/10 rounded-xl">
            <p className="text-sm font-medium">Votre note</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setUserRating(s)} className={`text-2xl transition-transform hover:scale-110 ${s <= userRating ? "opacity-100" : "opacity-30"}`}>
                  ⭐
                </button>
              ))}
            </div>
            <Textarea placeholder="Votre avis (optionnel)" value={userReview} onChange={e => setUserReview(e.target.value)} rows={2} className="text-sm" />
            <div className="flex gap-2">
              <Button size="sm" disabled={userRating === 0} onClick={() => { onRate(userRating, userReview); setShowRating(false); }}>Envoyer</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowRating(false)}>Annuler</Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button disabled={installing} variant={installed ? "outline" : "default"}
            onClick={installed ? onUninstall : onInstall}>
            {installing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {installed ? "Désinstaller" : "⬇️ Installer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SkillsMarketplace;
