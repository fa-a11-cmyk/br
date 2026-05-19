import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import ReportFeedback from "@/components/app/ReportFeedback";
import { downloadReportPDF } from "@/lib/pdfExport";
import { PDFReportGenerator } from "@/components/PDFReportGenerator";

const tabs = ["Aperçu", "Contenu", "Partage", "Historique"];

const RapportDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Aperçu");

  return (
    <div className="p-6 md:p-10 max-w-[1100px]">
      {/* Breadcrumb */}
      <p className="font-mono text-[11px] uppercase tracking-[2px] text-muted-foreground/60 mb-4">
        <Link to="/app/rapports" className="hover:text-foreground transition-colors">Rapports</Link> › Rapport #{id}
      </p>
      <h1 className="font-display font-extrabold text-2xl md:text-[28px] tracking-tight text-foreground mb-1">
        Rapport #{id}
      </h1>
      <p className="font-body text-sm text-muted-foreground mb-6">Généré le 18 mars 2026 · Sprint 12 BraindCode</p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`font-body text-sm px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === t ? "border-[hsl(var(--fuchsia))] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Aperçu" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Durée", value: "47 min", color: "text-[hsl(var(--fuchsia))]" },
              { label: "Participants", value: "5", color: "text-[hsl(var(--violet-l))]" },
              { label: "Tâches extraites", value: "8", color: "text-[hsl(var(--success))]" },
              { label: "Sentiment", value: "87% ↗", color: "text-[hsl(var(--success))]" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-[14px] p-4">
                <p className="font-mono text-[10px] uppercase text-muted-foreground/60 mb-1">{s.label}</p>
                <p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <h3 className="font-display font-bold text-[15px] text-foreground mb-3">Résumé exécutif</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Réunion productive centrée sur le sprint 12. Validation du déploiement staging pour vendredi 21/03. Ahmed prend en charge la PR review avant jeudi. Prospect StartupX identifié — Thomas Dupont contacté et ajouté au CRM. Sentiment globalement positif avec un bon alignement d'équipe sur les priorités.
            </p>
          </div>

          {/* Decisions & Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-[14px] p-6">
              <h3 className="font-display font-bold text-[15px] text-foreground mb-3">📌 Décisions clés</h3>
              <ul className="space-y-2">
                {["Déploiement staging vendredi 21/03", "Migration DB reportée au sprint 13", "Nouveau design system validé", "Budget marketing Q2 approuvé"].map((d, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                    <span className="text-[hsl(var(--success))] mt-0.5">✓</span>{d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-[14px] p-6">
              <h3 className="font-display font-bold text-[15px] text-foreground mb-3">✅ Tâches extraites</h3>
              <ul className="space-y-2">
                {[
                  { task: "PR review composant Auth", who: "Ahmed", deadline: "20/03" },
                  { task: "Maquette dashboard v2", who: "Sarah", deadline: "22/03" },
                  { task: "Contacter Thomas Dupont", who: "Michael", deadline: "19/03" },
                  { task: "Mise à jour documentation API", who: "Youssef", deadline: "24/03" },
                ].map((t, i) => (
                  <li key={i} className="font-body text-sm text-muted-foreground">
                    <span className="text-foreground">{t.task}</span>
                    <span className="font-mono text-[11px] text-muted-foreground/60 ml-2">→ {t.who} · {t.deadline}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <PDFReportGenerator
              data={{
                meeting: {
                  id: id || "",
                  title: "Sprint 12 BraindCode",
                  created_at: new Date().toISOString(),
                  duration_seconds: 2820,
                  participants: ["Michael K.", "Ahmed B.", "Souhail M.", "Raja T.", "Lilia F."],
                },
                report: {
                  summary: "Réunion productive centrée sur le sprint 12. Validation du déploiement staging pour vendredi 21/03. Ahmed prend en charge la PR review avant jeudi. Prospect StartupX identifié — Thomas Dupont contacté et ajouté au CRM. Sentiment globalement positif avec un bon alignement d'équipe sur les priorités.",
                  key_decisions: ["Déploiement staging vendredi 21/03", "Migration DB reportée au sprint 13", "Nouveau design system validé", "Budget marketing Q2 approuvé"],
                  meeting_score: 87,
                },
                tasks: [
                  { title: "PR review composant Auth", assignee: "Ahmed", priority: "high", status: "pending", due_date: "2026-03-20" },
                  { title: "Maquette dashboard v2", assignee: "Sarah", priority: "medium", status: "pending", due_date: "2026-03-22" },
                  { title: "Contacter Thomas Dupont", assignee: "Michael", priority: "high", status: "done", due_date: "2026-03-19" },
                  { title: "Mise à jour documentation API", assignee: "Youssef", priority: "medium", status: "pending", due_date: "2026-03-24" },
                ],
              }}
              trigger={
                <button className="bg-gradient-primary text-white font-display font-bold text-sm py-2.5 px-6 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform">
                  📄 Télécharger PDF Premium
                </button>
              }
            />
            <button className="bg-secondary border border-border text-muted-foreground font-body text-sm py-2.5 px-6 rounded-lg hover:text-foreground transition-colors">
              Partager par email
            </button>
            <button className="bg-secondary border border-border text-muted-foreground font-body text-sm py-2.5 px-6 rounded-lg hover:text-foreground transition-colors">
              Envoyer sur WhatsApp
            </button>
          </div>

          {/* Feedback */}
          <ReportFeedback reportId={id} />
        </div>
      )}

      {activeTab === "Contenu" && (
        <div className="bg-card border border-border rounded-[14px] p-6">
          <div className="bg-white rounded-lg p-8 text-rm-dark-1">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">RM</span>
              </div>
              <div>
                <p className="font-display font-bold text-sm">Rapport de réunion</p>
                <p className="font-body text-xs text-gray-500">Sprint 12 BraindCode · 18 mars 2026</p>
              </div>
            </div>
            <h2 className="font-display font-bold text-xl mb-4" style={{ color: "#E91E8C" }}>Résumé de votre réunion</h2>
            <p className="font-body text-sm text-gray-700 leading-relaxed mb-4">
              Réunion de sprint hebdomadaire avec l'équipe technique et commerciale. Durée : 47 minutes, 5 participants. Sentiment global : positif (87%).
            </p>
            <h3 className="font-display font-bold text-base mb-2">Décisions</h3>
            <ul className="font-body text-sm text-gray-700 space-y-1 mb-4 list-disc pl-5">
              <li>Déploiement staging vendredi 21/03</li>
              <li>Migration DB reportée au sprint 13</li>
              <li>Nouveau design system validé</li>
            </ul>
            <h3 className="font-display font-bold text-base mb-2">Tâches</h3>
            <ul className="font-body text-sm text-gray-700 space-y-1 list-disc pl-5">
              <li>Ahmed — PR review composant Auth (deadline : 20/03)</li>
              <li>Sarah — Maquette dashboard v2 (deadline : 22/03)</li>
              <li>Michael — Contacter Thomas Dupont (deadline : 19/03)</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "Partage" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-[14px] p-6">
            <h3 className="font-display font-bold text-[15px] text-foreground mb-4">Canaux de diffusion</h3>
            <div className="space-y-3">
              {[
                { icon: "💬", name: "WhatsApp", status: "✅ Envoyé", time: "18/03 · 14:52" },
                { icon: "✈️", name: "Telegram", status: "✅ Envoyé", time: "18/03 · 14:52" },
                { icon: "📧", name: "Email HTML", status: "✅ Envoyé", time: "18/03 · 14:53" },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span>{c.icon}</span>
                    <span className="font-body text-sm text-foreground">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground/60">{c.time}</span>
                    <span className="font-mono text-[11px] text-[hsl(var(--success))]">{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-[14px] p-6">
            <h3 className="font-display font-bold text-[15px] text-foreground mb-3">Lien de partage</h3>
            <div className="flex gap-2">
              <input readOnly value={`https://app.rapidomeet.com/rapports/${id}`} className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 font-mono text-sm text-muted-foreground" />
              <button className="bg-secondary border border-border text-muted-foreground font-body text-sm px-4 py-2 rounded-lg hover:text-foreground transition-colors">Copier</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Historique" && (
        <div className="bg-card border border-border rounded-[14px] p-6">
          <h3 className="font-display font-bold text-[15px] text-foreground mb-4">Historique des événements</h3>
          <div className="space-y-4">
            {[
              { time: "14:53", event: "Rapport envoyé par email à michael@braindcode.com", type: "success" },
              { time: "14:52", event: "Rapport distribué sur WhatsApp + Telegram via OpenClaw", type: "success" },
              { time: "14:51", event: "8 tâches extraites et assignées", type: "success" },
              { time: "14:50", event: "Analyse IA terminée — 4 décisions, 1 prospect détecté", type: "success" },
              { time: "14:48", event: "Transcription terminée — 47 min, 5 intervenants", type: "success" },
              { time: "14:01", event: "Réunion démarrée — Google Meet", type: "info" },
            ].map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${e.type === "success" ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--fuchsia))]"}`} />
                <div>
                  <p className="font-body text-sm text-foreground">{e.event}</p>
                  <p className="font-mono text-[11px] text-muted-foreground/60">{e.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RapportDetail;
