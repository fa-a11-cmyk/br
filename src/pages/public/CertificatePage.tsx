import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import PageHead from "@/components/PageHead";

const CertificatePage = () => {
  const { id } = useParams();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("tutorial_certificates").select("*").eq("id", id).single()
      .then(({ data }) => { setCert(data); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!cert) return (
    <div className="text-center py-20 min-h-screen bg-background">
      <h1 className="text-2xl font-bold mb-2">Certificat introuvable</h1>
      <p className="text-muted-foreground">Ce certificat n'existe pas ou a été révoqué.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHead title={`Certificat — ${cert.user_name}`} description={`Certificat RapidoMeet pour ${cert.course_title}`} path={`/certificat/${id}`} />
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="border-4 border-primary rounded-2xl p-8">
          <div className="text-5xl mb-4">⚡</div>
          <p className="font-bold text-primary text-xl mb-2">RapidoMeet</p>
          <h1 className="text-3xl font-bold mb-2">Certificat de Réussite</h1>
          <p className="text-muted-foreground mb-6">Ce certificat confirme que</p>
          <p className="text-3xl font-bold text-primary mb-2">{cert.user_name}</p>
          <p className="text-muted-foreground mb-2">a complété avec succès</p>
          <p className="text-xl font-semibold mb-8">{cert.course_title}</p>
          <div className="text-5xl mb-6">🎓</div>
          <p className="text-sm text-muted-foreground">
            Délivré le {new Date(cert.issued_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-2">{cert.id}</p>
          <div className="mt-6 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-green-600 text-sm font-medium">✅ Certificat vérifié et authentique</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePage;
