import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROVIDER_MAP: Record<string, { id: string; label: string }> = {
  google: { id: "google_meet", label: "Google Meet" },
  zoom: { id: "zoom", label: "Zoom" },
};

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // Extract provider from URL path
  const path = window.location.pathname;
  const providerKey = path.includes("/google/") ? "google" : path.includes("/zoom/") ? "zoom" : "";
  const provider = PROVIDER_MAP[providerKey];

  useEffect(() => {
    const handle = async () => {
      if (!provider) { setStatus("error"); setMessage("Provider inconnu"); return; }

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(error === "access_denied" ? `Accès refusé. Vous avez annulé la connexion ${provider.label}.` : `Erreur : ${error}`);
        return;
      }
      if (!code || !state) { setStatus("error"); setMessage("Paramètres manquants"); return; }

      const savedState = sessionStorage.getItem("oauth_state");
      if (state !== savedState) { setStatus("error"); setMessage("State OAuth invalide. Réessayez la connexion."); return; }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/oauth-handler`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ action: "exchange_code", payload: { provider: provider.id, code, state } }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("oauth_provider");
        setStatus("success");
        setMessage(`${provider.label} connecté (${data.email})`);
        setTimeout(() => navigate("/app/configuration"), 2000);
      } catch (e: any) {
        setStatus("error");
        setMessage(e.message);
      }
    };
    handle();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="font-medium">Connexion {provider?.label} en cours...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">Connecté !</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm mt-2">Redirection en cours...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold mb-2">Erreur de connexion</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <Button onClick={() => navigate("/app/configuration")}>Retour aux paramètres</Button>
          </>
        )}
      </div>
    </div>
  );
}
