import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const JoinWorkspace = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const accept = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        sessionStorage.setItem("pending_invitation", token || "");
        navigate(`/inscription?redirect=/workspace/join/${token}`);
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/workspace-actions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "accept_invitation",
            workspaceId: null,
            payload: { token },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setStatus("success");
        setMessage(`Vous avez rejoint "${data.workspace_name}" !`);
        setTimeout(() => navigate("/app/workspace"), 2000);
      } catch (e: any) {
        setStatus("error");
        setMessage(e.message);
      }
    };

    accept();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center max-w-md">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Vérification de l'invitation…</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">Bienvenue dans l'équipe !</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-2">Redirection en cours…</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold mb-2">Invitation invalide</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <Button onClick={() => navigate("/connexion")}>Se connecter →</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinWorkspace;
