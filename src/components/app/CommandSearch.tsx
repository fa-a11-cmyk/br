import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command";
import { Mic, CheckSquare, LayoutDashboard, Calendar, Zap, Bot, Settings, Plug, HelpCircle, History, Plus, Upload, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string; type: string; title: string; subtitle: string;
  badge: string | null; link: string; icon: string;
}

const navigationItems = [
  { label: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, shortcut: "⌘⌥D" },
  { label: "Mes réunions", url: "/app/reunions", icon: Mic, shortcut: "⌘⌥R" },
  { label: "Tâches", url: "/app/taches", icon: CheckSquare, shortcut: "⌘⌥T" },
  { label: "Agenda", url: "/app/agenda", icon: Calendar, shortcut: "⌘⌥A" },
  { label: "Analytics", url: "/app/analytics", icon: BarChart3, shortcut: "⌘⌥N" },
  { label: "Intégrations", url: "/app/integrations", icon: Plug, shortcut: "⌘⌥I" },
  { label: "Scénarios N8N", url: "/app/scenarios", icon: Zap },
  { label: "Console OpenClaw", url: "/app/openclaw", icon: Bot },
  { label: "Historique", url: "/app/historique", icon: History },
  { label: "Configuration", url: "/app/configuration", icon: Settings },
  { label: "Aide", url: "/app/aide", icon: HelpCircle },
];

const quickActions = [
  { label: "Nouvelle réunion", url: "/app/reunions/nouvelle", icon: Plus },
  { label: "Importer un audio", url: "/app/reunions/nouvelle", icon: Upload },
  { label: "Planifier une réunion", url: "/app/agenda", icon: Calendar },
  { label: "Ouvrir la configuration", url: "/app/configuration", icon: Settings },
];

const typeIcons: Record<string, string> = { meeting: "🎙", task: "✅", contact: "👤", decision: "🎯" };

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(o => !o); }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => { return () => clearTimeout(debounceRef.current); }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (url: string) => { setOpen(false); setQuery(""); setResults([]); navigate(url); };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] = acc[r.type] || []).push(r);
    return acc;
  }, {});

  const groupLabels: Record<string, string> = { meeting: "Réunions", task: "Tâches", contact: "Contacts", decision: "Décisions" };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border border-border/50 bg-muted/30 text-muted-foreground text-sm font-body hover:bg-muted/50 transition-colors">
        <span className="text-xs">🔍</span>
        <span className="text-muted-foreground/60">Rechercher...</span>
        <kbd className="ml-4 pointer-events-none h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground flex">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher dans RapidoMeet..." value={query} onValueChange={handleQueryChange} />
        <CommandList>
          {loading && <div className="py-6 text-center text-sm text-muted-foreground">Recherche…</div>}
          {!loading && query.length >= 2 && results.length === 0 && <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>}

          {Object.entries(grouped).map(([type, items]) => (
            <CommandGroup key={type} heading={`${groupLabels[type] || type} (${items.length})`}>
              {items.map(r => (
                <CommandItem key={r.id} value={`${r.type}-${r.title}`} onSelect={() => handleSelect(r.link)} className="flex items-center gap-3 py-2.5">
                  <span className="text-base shrink-0">{typeIcons[r.type] || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.subtitle}</p>
                  </div>
                  {r.badge && <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{r.badge}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          {!query && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Actions rapides">
                {quickActions.map(a => (
                  <CommandItem key={a.label} value={a.label} onSelect={() => handleSelect(a.url)} className="flex items-center gap-3 py-2">
                    <a.icon className="h-4 w-4 shrink-0 text-primary" /><span className="text-sm">{a.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Navigation">
            {navigationItems.map(n => (
              <CommandItem key={n.label} value={n.label} onSelect={() => handleSelect(n.url)} className="flex items-center gap-3 py-2">
                <n.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm flex-1">{n.label}</span>
                {n.shortcut && <span className="text-[10px] font-mono text-muted-foreground/50">{n.shortcut}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
