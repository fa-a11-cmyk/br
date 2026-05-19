import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DomainSettings({ pageId, pageSlug }: { pageId: string; pageSlug: string }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [checking, setChecking] = useState(false);
  const [subdomainAvail, setSubdomainAvail] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<"idle" | "cname_pending" | "verified">("idle");
  const { toast } = useToast();

  useEffect(() => {
    if (pageId) loadConfig();
  }, [pageId]);

  const callDomain = async (action: string, payload: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/domain-manager`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await callDomain("get_domain_config", { page_id: pageId });
      setConfig(data);
      if (data.config?.subdomain) setSubdomain(data.config.subdomain);
      if (data.config?.custom_domain) {
        setCustomDomain(data.config.custom_domain);
        setStep(data.config.domain_verified ? "verified" : "cname_pending");
      }
    } catch {}
    setLoading(false);
  };

  const checkSubdomain = async () => {
    if (!subdomain.trim()) return;
    setChecking(true);
    try {
      const data = await callDomain("check_subdomain", { subdomain });
      setSubdomainAvail(data);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setChecking(false);
  };

  const saveSubdomain = async () => {
    if (!subdomainAvail?.available) return;
    try {
      const data = await callDomain("set_subdomain", { page_id: pageId, subdomain });
      toast({ title: data.message });
      await loadConfig();
      setSubdomainAvail(null);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const addCustomDomain = async () => {
    if (!customDomain.trim()) return;
    try {
      await callDomain("add_custom_domain", { page_id: pageId, domain: customDomain });
      setStep("cname_pending");
      await loadConfig();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const verifyDomain = async () => {
    setVerifying(true);
    try {
      const data = await callDomain("verify_domain", { page_id: pageId });
      toast({ title: data.message });
      if (data.verified) setStep("verified");
      await loadConfig();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setVerifying(false);
  };

  const removeCustomDomain = async () => {
    if (!confirm("Supprimer le domaine custom ?")) return;
    try {
      await callDomain("remove_custom_domain", { page_id: pageId });
      setStep("idle");
      setCustomDomain("");
      await loadConfig();
      toast({ title: "Domaine supprimé ✓" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="p-4 text-center">
      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current URL */}
      <div className="p-3 bg-muted/20 rounded-xl">
        <p className="text-xs font-medium text-muted-foreground mb-1">URL par défaut</p>
        <a href={`/p/${pageSlug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
          rapidomeet.lovable.app/p/{pageSlug}
        </a>
      </div>

      {/* Subdomain */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">🆓 Sous-domaine gratuit</h4>
        {config?.config?.subdomain ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <a href={config.subdomain_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline break-all">
                {config.subdomain_url}
              </a>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-xs flex-1" onClick={() => {
                navigator.clipboard.writeText(config.subdomain_url);
                toast({ title: "Lien copié ! 📋" });
              }}>📋 Copier</Button>
              <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={async () => {
                await supabase.from("landing_pages").update({ subdomain: null, subdomain_active: false } as any).eq("id", pageId);
                await loadConfig();
              }}>Changer</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-1 items-center">
              <div className="flex-1 relative">
                <Input value={subdomain} onChange={e => { setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); setSubdomainAvail(null); }} placeholder="votre-nom" className="text-xs pr-32" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">.rapidomeet.io</span>
              </div>
              <Button size="sm" disabled={!subdomain.trim() || checking} onClick={checkSubdomain}>
                {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : "Vérifier"}
              </Button>
            </div>
            {subdomainAvail && (
              <div className={`p-2 rounded-lg text-xs flex items-center justify-between ${subdomainAvail.available ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-600"}`}>
                <span>{subdomainAvail.available ? `✅ "${subdomainAvail.subdomain}" est disponible !` : `❌ Déjà pris. Suggestion : "${subdomainAvail.suggestion}"`}</span>
                {subdomainAvail.available && <Button size="sm" className="text-xs h-6 ml-2" onClick={saveSubdomain}>Activer</Button>}
                {!subdomainAvail.available && subdomainAvail.suggestion && (
                  <Button size="sm" variant="ghost" className="text-xs h-6 ml-2" onClick={() => { setSubdomain(subdomainAvail.suggestion); setSubdomainAvail(null); }}>Utiliser</Button>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Exemple : sophie-martin → sophie-martin.rapidomeet.io</p>
          </div>
        )}
      </div>

      <div className="border-t border-border/30" />

      {/* Custom domain */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">🌐 Domaine custom</h4>
          <Badge className="text-xs bg-amber-500/10 text-amber-600">Plan Pro</Badge>
        </div>

        {step === "idle" && (
          <div className="space-y-2">
            <Input value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="www.monsite.com" className="text-xs" />
            <Button size="sm" className="w-full text-xs" disabled={!customDomain.trim()} onClick={addCustomDomain}>Connecter ce domaine →</Button>
            <p className="text-xs text-muted-foreground">Nécessite l'accès à votre gestionnaire DNS (OVH, Gandi, Cloudflare...).</p>
          </div>
        )}

        {step === "cname_pending" && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/10 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-amber-700">⚠️ Configuration DNS requise</p>
              <div className="bg-background rounded-lg p-2 space-y-1">
                <p className="text-xs font-medium">1. Enregistrement CNAME</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="bg-muted/20 rounded px-2 py-1"><span className="text-muted-foreground">Nom :</span> <code className="ml-1 font-mono">{customDomain.startsWith("www.") ? "www" : "@"}</code></div>
                  <div className="bg-muted/20 rounded px-2 py-1"><span className="text-muted-foreground">Valeur :</span> <code className="ml-1 font-mono text-primary">pages.rapidomeet.io</code></div>
                </div>
              </div>
              <div className="bg-background rounded-lg p-2 space-y-1">
                <p className="text-xs font-medium">2. Enregistrement TXT (vérification)</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="bg-muted/20 rounded px-2 py-1"><span className="text-muted-foreground">Nom :</span> <code className="ml-1 font-mono text-xs">_rapidomeet-verify</code></div>
                  <div className="bg-muted/20 rounded px-2 py-1 break-all"><span className="text-muted-foreground">Valeur :</span> <code className="ml-1 font-mono text-xs text-primary">{config?.config?.domain_txt_record || "rapidomeet-verify=..."}</code></div>
                </div>
              </div>
              <p className="text-xs text-amber-700">⏱ Propagation DNS : 5 minutes à 48 heures.</p>
            </div>
            <RegistrarGuide />
            <Button size="sm" className="w-full text-xs" onClick={verifyDomain} disabled={verifying}>
              {verifying ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "🔍"} Vérifier la configuration DNS
            </Button>
            <Button size="sm" variant="ghost" className="w-full text-xs text-destructive" onClick={removeCustomDomain}>Annuler et supprimer</Button>
          </div>
        )}

        {step === "verified" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-700">✅ Domaine vérifié et actif</p>
                <a href={`https://${customDomain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">https://{customDomain}</a>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => { navigator.clipboard.writeText(`https://${customDomain}`); toast({ title: "Lien copié ! 📋" }); }}>📋 Copier le lien</Button>
              <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={removeCustomDomain}>Supprimer</Button>
            </div>
          </div>
        )}
      </div>

      {/* QR Code */}
      {(config?.subdomain_url || config?.custom_url) && (
        <div className="border-t border-border/30 pt-4">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">📱 QR Code</h4>
          <QRCodeDisplay url={config.custom_url || config.subdomain_url} />
        </div>
      )}
    </div>
  );
}

function RegistrarGuide() {
  const [open, setOpen] = useState(false);
  const guides = [
    { name: "OVH", url: "https://help.ovhcloud.com/csm/fr-dns-edit-dns-zone", icon: "🇫🇷" },
    { name: "Gandi", url: "https://docs.gandi.net/fr/noms_domaine/dns/", icon: "🔐" },
    { name: "Cloudflare", url: "https://developers.cloudflare.com/dns/manage-dns-records/", icon: "☁️" },
    { name: "Namecheap", url: "https://www.namecheap.com/support/knowledgebase/article.aspx/9645/", icon: "🌍" },
    { name: "Ionos", url: "https://www.ionos.fr/aide/dns/", icon: "🇩🇪" },
  ];

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-xs text-primary hover:underline">
        {open ? "▼" : "▶"} Guide par registrar
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {guides.map(g => (
            <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs hover:bg-muted/30 rounded-lg px-2 py-1.5 transition-colors">
              <span>{g.icon}</span>
              <span className="text-primary">Guide DNS {g.name} →</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function QRCodeDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(url)}&choe=UTF-8&chld=H|2`;
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0, 160, 160);
    };
  }, [url]);

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qr-rapidomeet.png";
    link.href = canvas.toDataURL();
    link.click();
    toast({ title: "QR Code téléchargé ✓" });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 bg-background rounded-xl border border-border/30">
        <canvas ref={canvasRef} width={160} height={160} />
      </div>
      <p className="text-xs text-muted-foreground text-center">Partagez ce QR code !</p>
      <Button size="sm" variant="outline" className="text-xs w-full" onClick={downloadQR}>📥 Télécharger le QR Code</Button>
    </div>
  );
}
