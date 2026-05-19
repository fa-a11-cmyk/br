import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Shield } from "lucide-react";

type ConnectionType = "oauth" | "api_key" | "webhook" | "native";

interface ConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationName: string;
  integrationId: string;
  connectionType: ConnectionType;
  onConnect: (credentials: Record<string, string>, accountLabel: string) => Promise<boolean | undefined>;
  onOAuthStart?: (provider: string) => void;
}

const API_KEY_FIELDS: Record<string, { fields: { key: string; label: string; placeholder: string; required: boolean; type?: string }[]; helpUrl: string; helpLabel: string }> = {
  telegram: {
    fields: [
      { key: "bot_token", label: "Bot Token", placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", required: true, type: "password" },
      { key: "chat_id", label: "Chat ID (optionnel)", placeholder: "-1001234567890", required: false },
    ],
    helpUrl: "https://t.me/BotFather",
    helpLabel: "Créer un bot via @BotFather",
  },
  notion: {
    fields: [
      { key: "api_token", label: "Token d'intégration", placeholder: "secret_xxxxxxxxx", required: true, type: "password" },
      { key: "database_id", label: "Database ID (optionnel)", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: false },
    ],
    helpUrl: "https://www.notion.so/my-integrations",
    helpLabel: "Créer une intégration Notion",
  },
  slack: {
    fields: [
      { key: "bot_token", label: "Bot OAuth Token", placeholder: "xoxb-xxxxxxxxxxxxx", required: true, type: "password" },
      { key: "channel_id", label: "Channel ID", placeholder: "C0XXXXXXXXX", required: false },
    ],
    helpUrl: "https://api.slack.com/apps",
    helpLabel: "Créer une app Slack",
  },
  discord: {
    fields: [
      { key: "webhook_url", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/...", required: true },
    ],
    helpUrl: "https://support.discord.com/hc/en-us/articles/228383668",
    helpLabel: "Créer un webhook Discord",
  },
  hubspot: {
    fields: [
      { key: "api_key", label: "Clé API / Access Token", placeholder: "pat-na1-xxxxxxxx", required: true, type: "password" },
    ],
    helpUrl: "https://app.hubspot.com/settings/api-key",
    helpLabel: "Obtenir votre clé API HubSpot",
  },
  stripe: {
    fields: [
      { key: "api_key", label: "Clé secrète Stripe", placeholder: "sk_live_xxxxxxxxxxxx", required: true, type: "password" },
    ],
    helpUrl: "https://dashboard.stripe.com/apikeys",
    helpLabel: "Obtenir vos clés Stripe",
  },
  github: {
    fields: [
      { key: "api_key", label: "Personal Access Token", placeholder: "ghp_xxxxxxxxxxxx", required: true, type: "password" },
    ],
    helpUrl: "https://github.com/settings/tokens",
    helpLabel: "Créer un token GitHub",
  },
  elevenlabs: {
    fields: [
      { key: "api_key", label: "Clé API ElevenLabs", placeholder: "xi-xxxxxxxx", required: true, type: "password" },
    ],
    helpUrl: "https://elevenlabs.io/api",
    helpLabel: "Obtenir votre clé API",
  },
};

const WEBHOOK_INFO: Record<string, { placeholder: string }> = {
  n8n: { placeholder: "https://n8n.votredomaine.com/webhook/xxx" },
  webhook: { placeholder: "https://votre-service.com/webhook" },
};

const OAUTH_PROVIDERS = new Set([
  "google-meet", "google-calendar", "gmail", "outlook", "google-drive", "microsoft-teams",
]);

const ConnectionModal = ({
  open, onOpenChange, integrationName, integrationId, connectionType, onConnect, onOAuthStart,
}: ConnectionModalProps) => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [accountLabel, setAccountLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const isOAuth = OAUTH_PROVIDERS.has(integrationId);
  const apiKeyConfig = API_KEY_FIELDS[integrationId];
  const webhookConfig = WEBHOOK_INFO[integrationId];

  const updateField = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const clearForm = () => {
    setFields({});
    setAccountLabel("");
  };

  const handleOAuthStart = () => {
    if (onOAuthStart) {
      onOAuthStart(integrationId);
    }
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (connectionType === "api_key" && apiKeyConfig) {
      const missing = apiKeyConfig.fields.filter(f => f.required && !fields[f.key]?.trim());
      if (missing.length > 0) {
        toast({ title: "Champs requis", description: `Veuillez remplir : ${missing.map(f => f.label).join(", ")}`, variant: "destructive" });
        return;
      }
    } else if (connectionType === "webhook") {
      if (!fields.webhook_url?.trim()) {
        toast({ title: "Champ requis", description: "L'URL webhook est obligatoire.", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    const result = await onConnect(fields, accountLabel);
    setSaving(false);
    if (result) {
      clearForm(); // CRITICAL: Clear sensitive inputs after successful submission
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) clearForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Connecter {integrationName}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isOAuth && "Autorisez l'accès via votre compte. Aucun mot de passe n'est stocké côté client."}
            {!isOAuth && connectionType === "api_key" && "Entrez vos identifiants. Ils seront chiffrés et stockés de manière sécurisée côté serveur."}
            {connectionType === "webhook" && "Configurez l'URL webhook pour recevoir les événements."}
            {connectionType === "native" && "Connexion automatique au service natif."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Security notice */}
          <div className="flex items-start gap-2 bg-secondary rounded-lg p-3">
            <Shield className="w-4 h-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
            <p className="font-body text-[12px] text-muted-foreground leading-relaxed">
              {isOAuth
                ? "La connexion OAuth se fait directement avec le fournisseur. RapidoMeet n'a jamais accès à votre mot de passe."
                : "Vos identifiants sont chiffrés (AES-256) et stockés côté serveur. Ils ne sont jamais exposés dans le navigateur."
              }
            </p>
          </div>

          {/* OAuth mode — redirect to server */}
          {isOAuth && (
            <div className="space-y-3">
              <button
                onClick={handleOAuthStart}
                className="w-full font-body text-[14px] font-semibold text-white bg-gradient-primary px-4 py-3 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Connecter {integrationName} via OAuth
              </button>
              <p className="font-body text-[11px] text-muted-foreground/60 text-center">
                Vous serez redirigé vers {integrationName} pour autoriser l'accès
              </p>
            </div>
          )}

          {/* API Key mode — provider-specific fields */}
          {!isOAuth && connectionType === "api_key" && (
            <>
              {/* Account label */}
              <div>
                <label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                  Libellé du compte (optionnel)
                </label>
                <Input
                  value={accountLabel}
                  onChange={e => setAccountLabel(e.target.value)}
                  placeholder="ex: Mon bot Telegram"
                  className="mt-1 bg-secondary border-border"
                />
              </div>

              {apiKeyConfig ? (
                <>
                  {apiKeyConfig.fields.map(field => (
                    <div key={field.key}>
                      <label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                        {field.label} {field.required && "*"}
                      </label>
                      <Input
                        type={field.type || "text"}
                        value={fields[field.key] || ""}
                        onChange={e => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="mt-1 bg-secondary border-border"
                        autoComplete="off"
                      />
                    </div>
                  ))}
                  <a
                    href={apiKeyConfig.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--fuchsia-l))] font-body text-[13px] hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {apiKeyConfig.helpLabel}
                  </a>
                </>
              ) : (
                <div>
                  <label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">Clé API *</label>
                  <Input
                    type="password"
                    value={fields.api_key || ""}
                    onChange={e => updateField("api_key", e.target.value)}
                    placeholder="Votre clé API"
                    className="mt-1 bg-secondary border-border"
                    autoComplete="off"
                  />
                </div>
              )}
            </>
          )}

          {/* Webhook mode */}
          {!isOAuth && connectionType === "webhook" && (
            <>
              <div>
                <label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                  Libellé (optionnel)
                </label>
                <Input
                  value={accountLabel}
                  onChange={e => setAccountLabel(e.target.value)}
                  placeholder="ex: Workflow post-réunion"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">URL Webhook *</label>
                <Input
                  value={fields.webhook_url || ""}
                  onChange={e => updateField("webhook_url", e.target.value)}
                  placeholder={webhookConfig?.placeholder || "https://votre-service.com/webhook"}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
            </>
          )}

          {/* Native mode */}
          {!isOAuth && connectionType === "native" && (
            <div className="bg-secondary rounded-lg p-4">
              <p className="font-body text-[13px] text-foreground">
                Ce service fait partie de la suite RapidoSoftware et sera connecté automatiquement.
              </p>
            </div>
          )}

          {/* Submit button (not for OAuth which has its own button) */}
          {!isOAuth && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full font-body text-[14px] font-semibold text-white bg-gradient-primary px-4 py-2.5 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Connexion en cours..." : connectionType === "native" ? "Activer" : "Connecter"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper to determine connection type for a given integration
export function getConnectionType(integrationId: string): "oauth" | "api_key" | "webhook" | "native" {
  const oauthIds = ["google-meet", "google-calendar", "microsoft-teams", "slack", "gmail", "outlook", "google-drive"];
  const nativeIds = ["rapidocrm", "rapidocms", "rapidorh", "rapidoats", "openclaw", "whisper-local", "claude"];
  const webhookIds = ["webhook", "n8n"];
  if (oauthIds.includes(integrationId)) return "oauth";
  if (nativeIds.includes(integrationId)) return "native";
  if (webhookIds.includes(integrationId)) return "webhook";
  return "api_key";
}

export default ConnectionModal;
