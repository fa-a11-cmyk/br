import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Download, GripVertical, Eye, EyeOff, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

const PdfBuilder = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("app");

  const defaultSections = [
    { id: "info", label: t("pdfBuilder.sectionInfo"), enabled: true },
    { id: "summary", label: t("pdfBuilder.sectionSummary"), enabled: true },
    { id: "speakers", label: t("pdfBuilder.sectionSpeakers"), enabled: true },
    { id: "decisions", label: t("pdfBuilder.sectionDecisions"), enabled: true },
    { id: "tasks", label: t("pdfBuilder.sectionTasks"), enabled: true },
    { id: "contacts", label: t("pdfBuilder.sectionContacts"), enabled: true },
    { id: "sentiment", label: t("pdfBuilder.sectionSentiment"), enabled: false },
    { id: "talktime", label: t("pdfBuilder.sectionTalktime"), enabled: false },
    { id: "nextsteps", label: t("pdfBuilder.sectionNextsteps"), enabled: true },
    { id: "transcript", label: t("pdfBuilder.sectionTranscript"), enabled: false },
  ];

  const [sections, setSections] = useState(defaultSections);
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [accentColor, setAccentColor] = useState("#E91E8C");

  const toggleSection = (id: string) => setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      <div className="h-12 flex items-center justify-between px-4 border-b border-border/30 bg-card/50 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/configuration")}><ArrowLeft className="h-4 w-4 mr-1" /> {t("pdfBuilder.back")}</Button>
          <span className="font-display font-bold text-sm text-foreground">{t("pdfBuilder.title")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">{t("pdfBuilder.duplicate")}</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">{t("pdfBuilder.save")}</Button>
          <Button size="sm" className="h-8 text-xs bg-gradient-primary text-white shadow-fuchsia"><Download className="h-3.5 w-3.5 mr-1" /> {t("pdfBuilder.downloadTest")}</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[420px] border-r border-border/30 overflow-y-auto p-5 shrink-0">
          <Accordion type="multiple" defaultValue={["page", "header", "sections", "footer"]} className="space-y-2">
            <AccordionItem value="page" className="border border-border/30 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-display font-bold hover:no-underline">{t("pdfBuilder.pageMargins")}</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("pdfBuilder.format")}</label>
                  <div className="flex gap-2">
                    {["A4 Portrait", "A4 Paysage", "Letter"].map((f) => <Button key={f} variant="outline" size="sm" className="text-xs flex-1 h-8">{f}</Button>)}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[t("pdfBuilder.top"), t("pdfBuilder.bottom"), t("pdfBuilder.left"), t("pdfBuilder.right")].map((m) => (
                    <div key={m}><label className="font-mono text-[9px] text-muted-foreground block mb-1">{m}</label><Input className="h-7 text-xs bg-muted/30" defaultValue="20" /></div>
                  ))}
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("pdfBuilder.accentColor")}</label>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded border border-border/30" style={{ background: accentColor }} />
                    <Input className="h-7 text-xs bg-muted/30 flex-1" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("pdfBuilder.mainFont")}</label>
                  <Input className="h-7 text-xs bg-muted/30" defaultValue="DM Sans" />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="header" className="border border-border/30 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-display font-bold hover:no-underline">{t("pdfBuilder.headerSection")}</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body text-foreground">{t("pdfBuilder.showHeader")}</span>
                  <Switch checked={showHeader} onCheckedChange={setShowHeader} />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("pdfBuilder.reportTitle")}</label>
                  <Input className="h-7 text-xs bg-muted/30" defaultValue="COMPTE-RENDU DE RÉUNION" />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("pdfBuilder.subtitleLabel")}</label>
                  <Input className="h-7 text-xs bg-muted/30" defaultValue="{{meeting_title}}" />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sections" className="border border-border/30 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-display font-bold hover:no-underline">{t("pdfBuilder.sections")}</AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-1.5">
                  {sections.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/20">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab" />
                      <Switch checked={s.enabled} onCheckedChange={() => toggleSection(s.id)} className="scale-75" />
                      <span className={`text-xs font-body flex-1 ${s.enabled ? "text-foreground" : "text-muted-foreground/40"}`}>{s.label}</span>
                      <button className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center">
                        {s.enabled ? <Eye className="h-3 w-3 text-muted-foreground" /> : <EyeOff className="h-3 w-3 text-muted-foreground/40" />}
                      </button>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-3 text-xs text-primary w-full">{t("pdfBuilder.addCustomSection")}</Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="footer" className="border border-border/30 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-display font-bold hover:no-underline">{t("pdfBuilder.footerSection")}</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body text-foreground">{t("pdfBuilder.showFooter")}</span>
                  <Switch checked={showFooter} onCheckedChange={setShowFooter} />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("pdfBuilder.leftText")}</label>
                  <Input className="h-7 text-xs bg-muted/30" defaultValue="© 2026 BraindCode" />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">{t("pdfBuilder.centerText")}</label>
                  <Input className="h-7 text-xs bg-muted/30" defaultValue="Généré par RapidoMeet" />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="watermark" className="border border-border/30 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-display font-bold hover:no-underline">{t("pdfBuilder.watermark")}</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body text-foreground">{t("pdfBuilder.enableWatermark")}</span>
                  <Switch checked={showWatermark} onCheckedChange={setShowWatermark} />
                </div>
                {showWatermark && (
                  <>
                    <Input className="h-7 text-xs bg-muted/30" defaultValue="CONFIDENTIEL" />
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="font-mono text-[9px] text-muted-foreground block mb-1">{t("pdfBuilder.opacity")}</label><Input className="h-7 text-xs bg-muted/30" defaultValue="0.08" /></div>
                      <div><label className="font-mono text-[9px] text-muted-foreground block mb-1">{t("pdfBuilder.rotation")}</label><Input className="h-7 text-xs bg-muted/30" defaultValue="-45°" /></div>
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="flex-1 overflow-y-auto p-8" style={{ background: "#1a1a28" }}>
          <div className="mx-auto bg-white rounded shadow-2xl overflow-hidden" style={{ width: 595, minHeight: 842 }}>
            {showHeader && (
              <div className="px-10 pt-10 pb-6 border-b-2" style={{ borderColor: accentColor }}>
                <p className="font-display font-extrabold text-xl" style={{ color: "#1a1a2e" }}>COMPTE-RENDU DE RÉUNION</p>
                <p className="font-body text-sm mt-1" style={{ color: "#55556A" }}>Sprint 12 BraindCode · 18 mars 2026</p>
              </div>
            )}
            <div className="px-10 py-6 space-y-6">
              {sections.filter((s) => s.enabled).map((s) => (
                <div key={s.id}>
                  <p className="font-display font-bold text-xs uppercase tracking-wider mb-3" style={{ color: accentColor }}>{s.label}</p>
                  {s.id === "info" && <div className="grid grid-cols-2 gap-2 text-xs font-body" style={{ color: "#1a1a2e" }}><p><strong>Date :</strong> 18 mars 2026</p><p><strong>Durée :</strong> 47 min</p><p><strong>Type :</strong> Tech</p><p><strong>Participants :</strong> 5</p></div>}
                  {s.id === "summary" && <p className="text-xs font-body leading-relaxed" style={{ color: "#1a1a2e" }}>La réunion Sprint 12 a permis de valider le déploiement staging vendredi 21 mars.</p>}
                  {s.id === "speakers" && <div className="text-xs font-body space-y-1" style={{ color: "#1a1a2e" }}>{["Michael K. (42%)", "Ahmed B. (28%)", "Souhail M. (12%)"].map((p) => <p key={p}>• {p}</p>)}</div>}
                  {s.id === "decisions" && <div className="text-xs font-body space-y-1" style={{ color: "#1a1a2e" }}><p>→ Déploiement staging validé</p><p>→ PR Docker avant jeudi</p></div>}
                  {s.id === "tasks" && <div className="text-xs font-body space-y-1.5" style={{ color: "#1a1a2e" }}><p>☐ PR review module Docker — Ahmed B.</p><p>☐ CDC RapidoRH v2 — Lilia F.</p></div>}
                  {s.id === "contacts" && <p className="text-xs font-body" style={{ color: "#1a1a2e" }}>Thomas Dupont (StartupX) — Score : 8/10</p>}
                  {s.id === "nextsteps" && <div className="text-xs font-body space-y-1" style={{ color: "#1a1a2e" }}><p>1. Merge PR Docker</p><p>2. Envoi proposition Thomas Dupont</p></div>}
                  {(s.id === "sentiment" || s.id === "talktime" || s.id === "transcript") && <p className="text-xs font-body italic" style={{ color: "#9898B0" }}>{t("pdfBuilder.simulatedData")}</p>}
                </div>
              ))}
            </div>
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-7xl font-display font-extrabold rotate-[-45deg] select-none" style={{ color: accentColor, opacity: 0.08 }}>CONFIDENTIEL</span>
              </div>
            )}
            {showFooter && (
              <div className="px-10 py-4 border-t mt-auto" style={{ borderColor: "#E8E8EC" }}>
                <div className="flex justify-between text-[10px] font-body" style={{ color: "#9898B0" }}>
                  <span>© 2026 BraindCode</span><span>Généré par RapidoMeet</span><span>Page 1 / 1</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfBuilder;
