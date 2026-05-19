import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-600",
  high: "bg-orange-500/10 text-orange-600",
  medium: "bg-amber-500/10 text-amber-600",
  low: "bg-blue-500/10 text-blue-600",
};

const EVENT_ICONS: Record<string, string> = {
  rate_limit_exceeded: "⚡",
  unauthorized_access: "🚫",
  sql_injection_attempt: "💉",
  xss_attempt: "🎯",
  brute_force: "🔨",
  api_abuse: "🤖",
  auth_failure: "🔑",
  suspicious_input: "⚠️",
  data_export: "📤",
  admin_action: "👑",
  privilege_escalation: "🚀",
  invalid_token: "🔒",
};

export default function AdminSecurity() {
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [newBlockIp, setNewBlockIp] = useState("");
  const { toast } = useToast();

  useEffect(() => { runAudit(); }, []);

  const runAudit = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/security-audit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: "full_audit" }),
      });
      const data = await res.json();
      setAudit(data);
      setBlockedIps(data.blocked_ips?.list || []);
      setEvents(data.security_events?.recent || []);
    } catch (e: any) {
      toast({ title: "Erreur audit", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const blockIp = async () => {
    if (!newBlockIp.trim()) return;
    await supabase.from("blocked_ips" as any).insert({
      ip_address: newBlockIp.trim(),
      reason: "Bloqué manuellement par admin",
    } as any);
    toast({ title: `IP ${newBlockIp} bloquée ✓` });
    setNewBlockIp("");
    await runAudit();
  };

  const unblockIp = async (ip: string) => {
    await supabase.from("blocked_ips" as any).delete().eq("ip_address", ip);
    toast({ title: `IP ${ip} débloquée ✓` });
    await runAudit();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Shield className="w-5 h-5" /> Sécurité & Audit
        </h2>
        <Button size="sm" variant="outline" onClick={runAudit}>🔄 Relancer l'audit</Button>
      </div>

      {/* Score */}
      {audit?.security_score && (
        <Card className={`p-6 border-2 ${
          audit.security_score.status === "ok" ? "border-green-500/30 bg-green-500/5"
          : audit.security_score.status === "warning" ? "border-amber-500/30 bg-amber-500/5"
          : "border-red-500/30 bg-red-500/5"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Score de sécurité</h3>
              <p className="text-sm text-muted-foreground">Basé sur 5 critères clés</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-black ${
                audit.security_score.status === "ok" ? "text-green-500"
                : audit.security_score.status === "warning" ? "text-amber-500"
                : "text-red-500"
              }`}>{audit.security_score.grade}</div>
              <div className="text-lg font-bold">{audit.security_score.score}/100</div>
            </div>
          </div>
        </Card>
      )}

      {/* Checks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Secrets", status: audit?.secrets_check?.status, value: `${audit?.secrets_check?.configured || 0}/${audit?.secrets_check?.total || 0}`, warning: audit?.secrets_check?.missing?.join(", ") },
          { label: "RLS", status: audit?.rls_check?.status, value: (audit?.rls_check?.tables_without_rls?.length || 0) === 0 ? "Toutes protégées" : `${audit?.rls_check?.tables_without_rls?.length} tables` },
          { label: "Admins", status: audit?.auth_check?.status, value: `${audit?.auth_check?.admin_count || 0} compte(s)` },
          { label: "IP bloquées", status: "ok", value: `${audit?.blocked_ips?.active || 0} actives` },
        ].map(check => (
          <Card key={check.label} className={`p-4 ${check.status === "ok" ? "border-green-500/20" : "border-amber-500/20"}`}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">{check.label}</span>
              <span>{check.status === "ok" ? "✅" : "⚠️"}</span>
            </div>
            <p className="font-semibold text-sm">{check.value}</p>
            {check.warning && <p className="text-xs text-red-500 mt-0.5 truncate">{check.warning}</p>}
          </Card>
        ))}
      </div>

      {/* Events */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <h3 className="font-medium">🚨 Événements récents</h3>
          <div className="flex gap-2 text-xs">
            {Object.entries(audit?.security_events?.by_severity || {}).map(([sev, count]) => (
              <Badge key={sev} className={SEVERITY_STYLES[sev]}>{sev}: {count as number}</Badge>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border/20">
          {events.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">✅ Aucun événement suspect détecté</div>
          ) : events.map((ev: any, i: number) => (
            <div key={i} className="p-3 flex items-start gap-3 text-sm">
              <span className="text-xl shrink-0">{EVENT_ICONS[ev.event_type] || "⚠️"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-xs">{ev.event_type.replace(/_/g, " ")}</span>
                  <Badge className={`text-xs ${SEVERITY_STYLES[ev.severity]}`}>{ev.severity}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {ev.ip_address && <span className="mr-2">IP: {ev.ip_address}</span>}
                  <span>{new Date(ev.created_at).toLocaleString("fr-FR")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Blocked IPs */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/30">
          <h3 className="font-medium mb-3">🚫 IP bloquées</h3>
          <div className="flex gap-2">
            <Input placeholder="Adresse IP à bloquer..." value={newBlockIp} onChange={e => setNewBlockIp(e.target.value)} className="text-sm" />
            <Button size="sm" onClick={blockIp} disabled={!newBlockIp.trim()} variant="destructive">Bloquer</Button>
          </div>
        </div>
        <div className="divide-y divide-border/20 max-h-60 overflow-y-auto">
          {blockedIps.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Aucune IP bloquée</p>
          ) : blockedIps.map((ip: any) => (
            <div key={ip.ip_address} className="p-3 flex items-center justify-between text-sm">
              <div>
                <code className="font-mono text-sm">{ip.ip_address}</code>
                <p className="text-xs text-muted-foreground">
                  {ip.reason}{ip.blocked_until ? ` · jusqu'au ${new Date(ip.blocked_until).toLocaleDateString("fr-FR")}` : " · Permanent"}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => unblockIp(ip.ip_address)}>Débloquer</Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Secrets manquants */}
      {(audit?.secrets_check?.missing?.length || 0) > 0 && (
        <Card className="p-4 border-red-500/30 bg-red-500/5">
          <h3 className="font-semibold text-sm text-red-700 mb-2">⚠️ Secrets manquants</h3>
          <div className="space-y-1">
            {audit.secrets_check.missing.map((s: string) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                <span className="text-red-500">✗</span>
                <code className="font-mono">{s}</code>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
