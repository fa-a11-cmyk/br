import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHead from "@/components/PageHead";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const BlogArticle = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [magnet, setMagnet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("blog_articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (data) {
        setArticle(data);
        // Increment views
        await supabase.from("blog_articles")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", data.id);

        if (data.has_lead_magnet && data.lead_magnet_id) {
          const { data: m } = await supabase
            .from("leads_magnets")
            .select("*")
            .eq("id", data.lead_magnet_id)
            .eq("is_active", true)
            .maybeSingle();
          setMagnet(m);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return (
    <div className="bg-rm-black min-h-screen">
      <Navbar />
      <div className="pt-[140px] pb-[100px] px-5 md:px-[60px]">
        <div className="max-w-[720px] mx-auto space-y-4">
          <div className="h-10 bg-rm-dark-2 rounded animate-pulse" />
          <div className="h-4 bg-rm-dark-2 w-1/3 rounded animate-pulse" />
          <div className="h-64 bg-rm-dark-2 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (!article) return (
    <div className="bg-rm-black min-h-screen">
      <Navbar />
      <div className="pt-[140px] text-center">
        <h1 className="text-2xl font-bold text-rm-white mb-4">Article introuvable</h1>
        <Link to="/blog" className="text-rm-fuchsia-l hover:underline">← Retour au blog</Link>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="bg-rm-black min-h-screen">
      <PageHead
        title={article.seo_title || article.title}
        description={article.seo_description || article.excerpt || ""}
        path={`/blog/${article.slug}`}
      />
      <Navbar />

      <article className="pt-[140px] pb-[100px] px-5 md:px-[60px]">
        <div className="max-w-[720px] mx-auto">
          {/* Breadcrumb */}
          <nav className="font-mono text-[11px] text-rm-gray-2 mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-rm-white">Accueil</Link>
            <span>›</span>
            <Link to="/blog" className="hover:text-rm-white">Blog</Link>
            <span>›</span>
            <span className="text-rm-gray-1 truncate max-w-[200px]">{article.title}</span>
          </nav>

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs capitalize bg-rm-dark-3 text-rm-gray-1 border-rm-dark-4">{article.category}</Badge>
            <span className="font-mono text-[11px] text-rm-gray-2">{article.reading_time_minutes} min de lecture</span>
          </div>

          <h1 className="font-display font-extrabold text-2xl md:text-4xl text-rm-white mb-4 tracking-[-1px] leading-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="font-body text-lg text-rm-gray-1 mb-6">{article.excerpt}</p>
          )}

          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-rm-dark-4 font-mono text-[11px] text-rm-gray-2">
            <span>📅 {article.published_at ? new Date(article.published_at).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}</span>
            <span>👁 {article.view_count || 0} vues</span>
          </div>

          {/* Hero image */}
          {article.og_image_url && (
            <div className="mb-8 rounded-[14px] overflow-hidden">
              <img src={article.og_image_url} alt={article.title} className="w-full object-cover max-h-96" />
            </div>
          )}

          {/* Lead magnet top */}
          {magnet && <div className="mb-8"><LeadMagnetForm magnet={magnet} articleId={article.id} /></div>}

          {/* Article content */}
          <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-a:text-rm-fuchsia-l prose-img:rounded-xl prose-p:text-rm-gray-1 prose-p:font-body prose-p:leading-relaxed prose-li:text-rm-gray-1"
            dangerouslySetInnerHTML={{ __html: article.content_html || "" }} />

          {/* Lead magnet bottom */}
          {magnet && <div className="mt-12"><LeadMagnetForm magnet={magnet} articleId={article.id} /></div>}

          {/* CTA */}
          <div className="mt-12 rounded-[14px] bg-gradient-to-r from-rm-fuchsia/10 to-rm-violet/10 border border-rm-fuchsia/20 p-8 text-center">
            <h3 className="font-display font-bold text-xl text-rm-white mb-3">Prêt à transformer vos réunions ?</h3>
            <p className="font-body text-rm-gray-1 mb-6">Rejoignez les équipes qui utilisent RapidoMeet pour gagner du temps.</p>
            <Link to="/inscription" className="inline-block bg-gradient-primary text-rm-white font-display font-bold text-sm py-3 px-8 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform">
              Essayer gratuitement →
            </Link>
          </div>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {article.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs bg-rm-dark-3 text-rm-gray-1 border-rm-dark-4">#{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Schema.org */}
      {article.schema_markup && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article.schema_markup) }} />
      )}

      <Footer />
    </div>
  );
};

export default BlogArticle;

// ─── Lead Magnet Form ─────────────────────────────────────

function LeadMagnetForm({ magnet, articleId }: { magnet: any; articleId: string }) {
  const [form, setForm] = useState({ first_name: "", company_name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fields: string[] = Array.isArray(magnet.form_fields) ? magnet.form_fields : (() => { try { return JSON.parse(magnet.form_fields || "[]"); } catch { return ["email"]; } })();

  const handleSubmit = async () => {
    if (!form.email) { setError("L'email est requis"); return; }
    setSubmitting(true);
    setError("");
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const params = new URLSearchParams(window.location.search);
      const res = await fetch(`${supabaseUrl}/functions/v1/leads-capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "" },
        body: JSON.stringify({
          lead_magnet_id: magnet.id, article_id: articleId,
          ...form,
          utm_source: params.get("utm_source") || undefined,
          utm_medium: params.get("utm_medium") || undefined,
          utm_campaign: params.get("utm_campaign") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      if (magnet.file_url) window.open(magnet.file_url, "_blank");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-900/30 border-2 border-green-500/40 rounded-[14px] p-6 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="font-display font-bold text-lg text-green-300 mb-2">Merci {form.first_name || ""} !</h3>
        <p className="font-body text-green-200/80 text-sm">
          {magnet.file_url ? "Votre téléchargement a démarré. Vérifiez aussi votre email !" : "Votre ressource a été envoyée par email !"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-900/20 border-2 border-amber-500/40 rounded-[14px] p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="text-4xl shrink-0">📥</div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-xl text-amber-200 mb-1">Téléchargez gratuitement</h3>
          <p className="font-display font-semibold text-amber-100 text-lg mb-1">{magnet.title}</p>
          {magnet.description && <p className="font-body text-amber-200/70 text-sm mb-4">{magnet.description}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.includes("first_name") && (
              <input type="text" placeholder="Votre prénom *" value={form.first_name}
                onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-amber-500/30 rounded-xl bg-rm-dark-2 text-rm-white text-sm focus:outline-none focus:border-amber-500" />
            )}
            {fields.includes("company_name") && (
              <input type="text" placeholder="Nom de votre entreprise" value={form.company_name}
                onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-amber-500/30 rounded-xl bg-rm-dark-2 text-rm-white text-sm focus:outline-none focus:border-amber-500" />
            )}
            {fields.includes("email") && (
              <input type="email" placeholder="Email professionnel *" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-amber-500/30 rounded-xl bg-rm-dark-2 text-rm-white text-sm focus:outline-none focus:border-amber-500" />
            )}
            {fields.includes("phone") && (
              <input type="tel" placeholder="Téléphone (optionnel)" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-amber-500/30 rounded-xl bg-rm-dark-2 text-rm-white text-sm focus:outline-none focus:border-amber-500" />
            )}
          </div>

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

          <button onClick={handleSubmit} disabled={submitting || !form.email}
            className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-rm-black font-display font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 text-base flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>📥 Télécharger gratuitement →</>}
          </button>

          <p className="font-mono text-[10px] text-amber-200/50 mt-2 text-center">🔒 Vos données sont protégées. Pas de spam.</p>
        </div>
      </div>
    </div>
  );
}
