import { Link } from "react-router-dom";

const OpenClawStatusCard = () => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⚡</span>
          <div>
            <h3 className="font-display font-bold text-[15px] text-foreground">OpenClaw Gateway</h3>
            <p className="font-mono text-[10px] text-muted-foreground">openclaw.braindcode.com · v2.3.1</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          <span className="font-mono text-[11px] text-[hsl(var(--success))]">Actif</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-1">23ms</span>
        </div>
      </div>

      <div className="bg-secondary rounded-xl p-4 space-y-2 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground/60 mb-2">Aujourd'hui</p>
        <div className="flex items-center gap-2">
          <span className="text-sm">📨</span>
          <span className="font-body text-[13px] text-foreground">12 messages envoyés</span>
          <span className="font-mono text-[10px] text-muted-foreground">· 4 canaux actifs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <span className="font-body text-[13px] text-foreground">3 scénarios N8N</span>
          <span className="font-mono text-[10px] text-[hsl(var(--success))]">· 99.2% succès</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">🧠</span>
          <span className="font-body text-[13px] text-foreground">47 contextes actifs</span>
          <span className="font-mono text-[10px] text-muted-foreground">· 38 Mo RAG</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link to="/app/openclaw" className="flex-1 font-body text-[13px] text-center text-[hsl(var(--violet-l))] border border-[hsl(var(--violet))]/30 py-2 rounded-lg hover:bg-violet-d transition-colors">
          Console OpenClaw →
        </Link>
        <Link to="/app/skills-marketplace" className="flex-1 font-body text-[13px] text-center text-muted-foreground border border-border py-2 rounded-lg hover:text-foreground hover:border-muted-foreground/30 transition-colors">
          Gérer les Skills →
        </Link>
      </div>
    </div>
  );
};

export default OpenClawStatusCard;
