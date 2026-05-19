import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHead from "@/components/PageHead";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Blog = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    let q = supabase
      .from("blog_articles")
      .select("id,title,slug,excerpt,category,published_at,reading_time_minutes,og_image_url,view_count,tags,has_lead_magnet")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (category !== "all") q = q.eq("category", category);

    q.then(({ data }) => { setArticles(data || []); setLoading(false); });
  }, [category]);

  const categories = ["all", "productivite", "ia", "management", "commercial", "tutoriel"];

  return (
    <div className="bg-rm-black min-h-screen">
      <PageHead title="Blog" description="Actualités, guides et tutoriels sur la transcription IA, l'automatisation post-réunion et la productivité d'équipe." path="/blog" />
      <Navbar />

      <section className="pt-[140px] pb-[60px] px-5 md:px-[60px]">
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-rm-fuchsia mb-4">Blog</p>
          <h1 className="font-display font-extrabold tracking-[-1px] text-rm-white mb-4" style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>
            Actualités, guides et <span className="text-gradient">bonnes pratiques.</span>
          </h1>
          <p className="font-body text-base text-rm-gray-1 max-w-xl mx-auto">
            Découvrez nos derniers articles sur l'IA, l'automatisation et la productivité en réunion.
          </p>
        </div>
      </section>

      {/* Category filters */}
      <section className="px-5 md:px-[60px] pb-8">
        <div className="max-w-[1200px] mx-auto flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wide transition-colors ${category === cat ? "bg-rm-fuchsia text-rm-white" : "bg-rm-dark-2 text-rm-gray-1 hover:bg-rm-dark-3"}`}>
              {cat === "all" ? "Tous" : cat}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-[60px] pb-[100px]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 rounded-[16px] bg-rm-dark-2 animate-pulse" />
            ))
          ) : articles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-rm-gray-1">Aucun article dans cette catégorie.</p>
            </div>
          ) : articles.map(article => (
            <Link key={article.id} to={`/blog/${article.slug}`}
              className="bg-rm-dark-2 border border-rm-dark-4 rounded-[16px] overflow-hidden hover:border-rm-fuchsia/40 hover:-translate-y-1 transition-all duration-300 flex flex-col group">
              {/* Image */}
              <div className="aspect-video bg-gradient-to-br from-rm-fuchsia/10 to-rm-violet/20 relative flex items-center justify-center">
                {article.og_image_url ? (
                  <img src={article.og_image_url} alt={article.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-4xl">⚡</span>
                )}
                {article.has_lead_magnet && (
                  <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">🎁 Ressource gratuite</span>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-rm-dark-3 text-rm-gray-1">{article.category}</span>
                  <span className="font-mono text-[11px] text-rm-gray-2">{article.reading_time_minutes} min</span>
                </div>
                <h3 className="font-display font-bold text-[16px] text-rm-white mb-3 leading-snug line-clamp-2 group-hover:text-rm-fuchsia-l transition-colors">{article.title}</h3>
                <p className="font-body text-sm text-rm-gray-1 leading-relaxed flex-1 line-clamp-3">{article.excerpt}</p>
                <div className="flex items-center justify-between mt-4 text-[11px] text-rm-gray-2">
                  <span>{article.published_at ? new Date(article.published_at).toLocaleDateString("fr-FR") : ""}</span>
                  <span>{article.view_count || 0} vues</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
