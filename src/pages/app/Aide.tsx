import { useState } from "react";
import { useTranslation } from "react-i18next";

const systemStatus = [
  { name: "Transcription STT", ok: true },
  { name: "OpenClaw Gateway", ok: true },
  { name: "N8N Workflows", ok: true },
  { name: "Email / WhatsApp", ok: true },
];

const videos = [
  { titleKey: 0, duration: "9:42" },
  { titleKey: 1, duration: "4:18" },
  { titleKey: 2, duration: "7:31" },
  { titleKey: 3, duration: "5:15" },
];

const videoTitles: Record<string, string[]> = {
  fr: ["Démarrer en 5 minutes", "Connecter RapidoCRM", "Créer un scénario N8N", "Personnaliser un Skill Markdown"],
  en: ["Get started in 5 minutes", "Connect RapidoCRM", "Create an N8N scenario", "Customize a Markdown Skill"],
  tn: ["ابدا في 5 دقائق", "وصّل RapidoCRM", "اخلق سيناريو N8N", "خصّص Skill Markdown"],
};

const Aide = () => {
  const { t, i18n } = useTranslation("app");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const faqItems = t("aide.faqItems", { returnObjects: true }) as Array<{ q: string; a: string }>;
  const quickStartItems = t("aide.quickStartItems", { returnObjects: true }) as Array<{ icon: string; title: string; desc: string }>;
  const vTitles = videoTitles[i18n.language] || videoTitles.fr;

  const filteredFaq = Array.isArray(faqItems)
    ? faqItems.filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="p-6 md:p-10 max-w-[1100px]">
      <h1 className="font-display font-extrabold text-[28px] tracking-tight text-foreground mb-1">{t("aide.title")}</h1>

      <div className="relative mb-8 max-w-2xl">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("aide.searchPlaceholder")} className="w-full bg-secondary border border-border rounded-[10px] pl-10 pr-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[hsl(var(--fuchsia))] outline-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <div>
            <p className="font-mono text-[11px] text-[hsl(var(--fuchsia))] uppercase tracking-[2px] mb-3">{t("aide.quickStart")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Array.isArray(quickStartItems) && quickStartItems.map(c => (
                <div key={c.title} className="bg-card border border-border rounded-[12px] p-5 hover:border-[hsl(var(--fuchsia))]/40 transition-all cursor-pointer group">
                  <span className="text-2xl block mb-3">{c.icon}</span>
                  <p className="font-display font-bold text-sm text-foreground group-hover:text-[hsl(var(--fuchsia-l))] transition-colors">{c.title}</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-[2px] mb-3">{t("aide.faq")}</p>
            <div className="space-y-1">
              {filteredFaq.map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                    <span className="font-display font-semibold text-[14px] text-foreground">{f.q}</span>
                    <span className={`text-muted-foreground transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {openFaq === i && <div className="px-5 pb-4"><p className="font-body text-sm text-muted-foreground leading-relaxed">{f.a}</p></div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-[2px] mb-3">{t("aide.videos")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videos.map((v, i) => (
                <div key={i} className="bg-card border border-border rounded-[12px] overflow-hidden cursor-pointer group hover:border-[hsl(var(--fuchsia))]/40 transition-all">
                  <div className="h-32 bg-secondary flex items-center justify-center relative">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <span className="text-white text-xl ml-0.5">▶</span>
                    </div>
                    <span className="absolute bottom-2 right-2 font-mono text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">{v.duration}</span>
                  </div>
                  <div className="p-4">
                    <p className="font-body text-sm text-foreground font-medium">{vTitles[v.titleKey]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Lien Tutoriels */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
            <h3 className="font-display font-bold text-base text-foreground mb-2">🎓 Centre de formation</h3>
            <p className="font-body text-sm text-muted-foreground mb-4">Maîtrisez RapidoMeet avec nos tutoriels vidéo interactifs et obtenez vos certificats.</p>
            <a href="/app/tutoriels">
              <button className="w-full font-display font-bold text-sm text-white bg-gradient-primary py-3 rounded-[10px] shadow-fuchsia">Accéder aux tutoriels →</button>
            </a>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-base text-foreground mb-4">{t("aide.contactSupport")}</h3>
            <div className="space-y-3">
              <button className="w-full font-display font-bold text-sm text-white bg-gradient-primary py-3 rounded-[10px] shadow-fuchsia">{t("aide.liveChat")}</button>
              <p className="font-mono text-[10px] text-muted-foreground text-center">{t("aide.responseTime")}</p>
              <button className="w-full font-body text-sm text-muted-foreground border border-border py-2.5 rounded-lg hover:text-foreground">{t("aide.email")}</button>
              <button className="w-full font-body text-sm text-muted-foreground border border-border py-2.5 rounded-lg hover:text-foreground">{t("aide.scheduleCall")}</button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-base text-foreground mb-3">{t("aide.allSystemsOk")}</h3>
            <div className="space-y-2">
              {systemStatus.map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="font-body text-[13px] text-muted-foreground">{s.name}</span>
                  <span className={`font-mono text-[10px] ${s.ok ? "text-[hsl(var(--success))]" : "text-destructive"}`}>● {s.ok ? t("aide.operational") : t("aide.degraded")}</span>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground/40 mt-3">{t("aide.lastCheck")}</p>
            <button className="font-body text-[13px] text-[hsl(var(--fuchsia-l))] hover:underline mt-2">{t("aide.statusPage")}</button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-base text-foreground mb-3">{t("aide.latestUpdates")}</h3>
            <div className="space-y-4">
              <div>
                <p className="font-display font-bold text-[13px] text-foreground">v1.2.0 — 15 mars 2026</p>
                <ul className="mt-1 space-y-0.5">
                  <li className="font-body text-xs text-muted-foreground">+ Skill multilangue AR</li>
                  <li className="font-body text-xs text-muted-foreground">+ Export SRT sous-titres</li>
                  <li className="font-body text-xs text-muted-foreground">✓ Fix diarisation &gt; 4 voix</li>
                </ul>
              </div>
              <div>
                <p className="font-display font-bold text-[13px] text-foreground">v1.1.0 — 01 mars 2026</p>
                <ul className="mt-1 space-y-0.5">
                  <li className="font-body text-xs text-muted-foreground">+ OpenClaw v2.4 support</li>
                  <li className="font-body text-xs text-muted-foreground">+ Scénario N9 (translate)</li>
                </ul>
              </div>
            </div>
            <button className="font-body text-[13px] text-[hsl(var(--fuchsia-l))] hover:underline mt-3">{t("aide.viewChangelog")}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aide;
