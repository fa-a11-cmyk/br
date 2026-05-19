import { useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface PDFReportData {
  meeting: {
    id: string;
    title: string;
    created_at: string;
    duration_seconds?: number | null;
    participants?: string | any[];
    meeting_type?: string;
  };
  report?: {
    summary?: string | null;
    key_decisions?: string[];
    action_items?: string[];
    next_steps?: string | null;
    meeting_score?: number | null;
    sentiment?: string | null;
  };
  tasks?: Array<{
    title: string;
    assignee?: string | null;
    priority?: string;
    status?: string;
    due_date?: string | null;
  }>;
  transcription?: {
    content?: string | null;
    language?: string | null;
  } | null;
  contacts?: Array<{
    name: string;
    role?: string | null;
    company?: string | null;
  }>;
}

interface PDFReportGeneratorProps {
  data: PDFReportData;
  trigger?: React.ReactNode;
}

// Brand colors as RGB tuples
const BRAND = {
  primary: [99, 102, 241] as [number, number, number],
  secondary: [139, 92, 246] as [number, number, number],
  accent: [245, 158, 11] as [number, number, number],
  text: [26, 26, 46] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [16, 185, 129] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
};

function formatDuration(seconds?: number | null) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m}min`;
  return `${m} min`;
}

function formatDateFR(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function getScoreColor(score?: number | null): [number, number, number] {
  if (!score) return BRAND.muted;
  if (score >= 80) return BRAND.green;
  if (score >= 60) return BRAND.accent;
  return BRAND.red;
}

function addGradientBar(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  for (let i = 0; i < w; i++) {
    const t = i / w;
    const r = Math.round(BRAND.primary[0] * (1 - t) + BRAND.secondary[0] * t);
    const g = Math.round(BRAND.primary[1] * (1 - t) + BRAND.secondary[1] * t);
    const b = Math.round(BRAND.primary[2] * (1 - t) + BRAND.secondary[2] * t);
    doc.setFillColor(r, g, b);
    doc.rect(i, 0, 1.5, 8, "F");
  }
}

function addPremiumHeader(doc: jsPDF, data: PDFReportData): number {
  const w = doc.internal.pageSize.getWidth();
  addGradientBar(doc);

  // Logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND.primary);
  doc.text("RapidoMeet", 20, 22);
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text("Rapport de réunion", 20, 28);

  // Date de génération
  doc.setFontSize(8);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, w - 20, 22, { align: "right" });
  doc.text("hello@rapidomeet.io", w - 20, 27, { align: "right" });

  // Separator
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(0.5);
  doc.line(20, 33, w - 20, 33);

  // Meeting title
  let y = 42;
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.text);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(data.meeting.title || "Réunion sans titre", w - 40);
  doc.text(titleLines, 20, y);
  y += titleLines.length * 7 + 4;

  // Meta info
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.setFont("helvetica", "normal");
  const metaParts: string[] = [];
  metaParts.push(`📅 ${formatDateFR(data.meeting.created_at)}`);
  if (data.meeting.duration_seconds) metaParts.push(`⏱ ${formatDuration(data.meeting.duration_seconds)}`);
  if (data.meeting.participants) {
    const count = Array.isArray(data.meeting.participants) ? data.meeting.participants.length : String(data.meeting.participants);
    metaParts.push(`👥 ${count} participants`);
  }
  if (data.meeting.meeting_type) metaParts.push(`🏷 ${data.meeting.meeting_type}`);
  doc.text(metaParts.join("  ·  "), 20, y);
  y += 8;

  return y;
}

function addFooter(doc: jsPDF, pageNum: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(20, h - 18, w - 20, h - 18);
  doc.setFontSize(7);
  doc.setTextColor(...BRAND.muted);
  doc.text("⚡ RapidoMeet · BraindCode SASU · hello@rapidomeet.io", 20, h - 12);
  doc.text(`Page ${pageNum}`, w - 20, h - 12, { align: "right" });
}

function checkPage(doc: jsPDF, y: number, pageNum: { val: number }, margin = 30): number {
  if (y > doc.internal.pageSize.getHeight() - margin) {
    addFooter(doc, pageNum.val);
    doc.addPage();
    pageNum.val++;
    addGradientBar(doc);
    return 18;
  }
  return y;
}

function generatePremiumPDF(data: PDFReportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const pageNum = { val: 1 };

  let y = addPremiumHeader(doc, data);
  const { report, tasks, contacts, transcription } = data;
  const score = report?.meeting_score;
  const decisionsCount = report?.key_decisions?.length || 0;
  const tasksCount = tasks?.length || 0;

  // Score cards
  const cards: Array<{ label: string; value: string; color: [number, number, number] }> = [];
  if (score) cards.push({ label: "SCORE EFFICACITÉ", value: `${score}%`, color: getScoreColor(score) });
  cards.push({ label: "TÂCHES EXTRAITES", value: String(tasksCount), color: BRAND.primary });
  cards.push({ label: "DÉCISIONS", value: String(decisionsCount), color: BRAND.secondary });
  if (contacts?.length) cards.push({ label: "CONTACTS", value: String(contacts.length), color: BRAND.accent });

  if (cards.length > 0) {
    const boxW = (w - 40 - (cards.length - 1) * 4) / cards.length;
    cards.forEach((c, i) => {
      const x = 20 + i * (boxW + 4);
      doc.setFillColor(...BRAND.bg);
      doc.roundedRect(x, y, boxW, 20, 3, 3, "F");
      doc.setFontSize(20);
      doc.setTextColor(...c.color);
      doc.setFont("helvetica", "bold");
      doc.text(c.value, x + boxW / 2, y + 12, { align: "center" });
      doc.setFontSize(6);
      doc.setTextColor(...BRAND.muted);
      doc.setFont("helvetica", "normal");
      doc.text(c.label, x + boxW / 2, y + 18, { align: "center" });
    });
    y += 28;
  }

  // Summary
  if (report?.summary) {
    y = checkPage(doc, y, pageNum);
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.primary);
    doc.setFont("helvetica", "bold");
    doc.text("📋 Résumé exécutif", 20, y);
    y += 6;

    // Background box
    doc.setFillColor(...BRAND.bg);
    const summaryLines = doc.splitTextToSize(report.summary, w - 48);
    const boxH = summaryLines.length * 4.5 + 8;
    doc.roundedRect(20, y - 2, w - 40, boxH, 2, 2, "F");
    // Left accent bar
    doc.setFillColor(...BRAND.primary);
    doc.rect(20, y - 2, 1.5, boxH, "F");

    doc.setFontSize(9);
    doc.setTextColor(...BRAND.text);
    doc.setFont("helvetica", "normal");
    doc.text(summaryLines, 26, y + 4);
    y += boxH + 8;
  }

  // Decisions
  if (report?.key_decisions?.length) {
    y = checkPage(doc, y, pageNum);
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.secondary);
    doc.setFont("helvetica", "bold");
    doc.text("🎯 Décisions clés", 20, y);
    y += 7;

    for (const [i, d] of report.key_decisions.entries()) {
      y = checkPage(doc, y, pageNum, 15);
      doc.setFillColor(...BRAND.bg);
      const dLines = doc.splitTextToSize(d, w - 56);
      const dH = Math.max(dLines.length * 4.5 + 4, 10);
      doc.roundedRect(20, y - 3, w - 40, dH, 2, 2, "F");

      // Numbered circle
      doc.setFillColor(...BRAND.primary);
      doc.circle(28, y + 1, 3, "F");
      doc.setFontSize(7);
      doc.setTextColor(...BRAND.white);
      doc.setFont("helvetica", "bold");
      doc.text(String(i + 1), 28, y + 2.5, { align: "center" });

      doc.setFontSize(9);
      doc.setTextColor(...BRAND.text);
      doc.setFont("helvetica", "normal");
      doc.text(dLines, 34, y + 1);
      y += dH + 3;
    }
    y += 5;
  }

  // Tasks table
  if (tasks?.length) {
    y = checkPage(doc, y, pageNum, 40);
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.primary);
    doc.setFont("helvetica", "bold");
    doc.text("✅ Tâches et actions", 20, y);
    y += 8;

    // Table header
    doc.setFillColor(...BRAND.primary);
    doc.roundedRect(20, y - 4, w - 40, 8, 1, 1, "F");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.white);
    doc.setFont("helvetica", "bold");
    doc.text("TÂCHE", 24, y);
    doc.text("RESPONSABLE", w - 88, y);
    doc.text("PRIORITÉ", w - 58, y);
    doc.text("STATUT", w - 36, y);
    y += 7;

    const priorityColors: Record<string, [number, number, number]> = {
      critical: BRAND.red, high: BRAND.accent, medium: BRAND.primary, low: BRAND.muted,
    };
    const priorityLabels: Record<string, string> = {
      critical: "Critique", high: "Haute", medium: "Moyenne", low: "Faible",
    };
    const statusLabels: Record<string, string> = {
      done: "✓ Terminé", in_progress: "⏳ En cours", pending: "○ À faire",
    };

    for (const [i, task] of tasks.entries()) {
      y = checkPage(doc, y, pageNum, 12);
      if (i % 2 === 0) {
        doc.setFillColor(...BRAND.bg);
        doc.rect(20, y - 3.5, w - 40, 8, "F");
      }
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.text);
      doc.setFont("helvetica", "normal");
      const tLines = doc.splitTextToSize(task.title, 65);
      doc.text(tLines[0], 24, y);

      doc.setTextColor(...BRAND.muted);
      doc.text(task.assignee || "—", w - 88, y);

      const prio = task.priority || "medium";
      doc.setTextColor(...(priorityColors[prio] || BRAND.muted));
      doc.text(priorityLabels[prio] || prio, w - 58, y);

      const st = task.status || "pending";
      const stColor = st === "done" ? BRAND.green : st === "in_progress" ? BRAND.accent : BRAND.muted;
      doc.setTextColor(...stColor);
      doc.text(statusLabels[st] || st, w - 36, y);

      y += 7;
    }
    y += 5;
  }

  // Next steps
  if (report?.next_steps) {
    y = checkPage(doc, y, pageNum);
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.accent);
    doc.setFont("helvetica", "bold");
    doc.text("🚀 Prochaines étapes", 20, y);
    y += 6;
    doc.setFillColor(...BRAND.bg);
    const nsLines = doc.splitTextToSize(report.next_steps, w - 48);
    const nsH = nsLines.length * 4.5 + 8;
    doc.roundedRect(20, y - 2, w - 40, nsH, 2, 2, "F");
    doc.setFillColor(...BRAND.accent);
    doc.rect(20, y - 2, 1.5, nsH, "F");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.text);
    doc.setFont("helvetica", "normal");
    doc.text(nsLines, 26, y + 4);
    y += nsH + 8;
  }

  // Contacts
  if (contacts?.length) {
    y = checkPage(doc, y, pageNum);
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.secondary);
    doc.setFont("helvetica", "bold");
    doc.text("👥 Contacts mentionnés", 20, y);
    y += 7;
    for (const c of contacts) {
      y = checkPage(doc, y, pageNum, 12);
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.text);
      doc.setFont("helvetica", "bold");
      doc.text(c.name, 24, y);
      if (c.role || c.company) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...BRAND.muted);
        doc.text(` — ${[c.role, c.company].filter(Boolean).join(", ")}`, 24 + doc.getTextWidth(c.name + " "), y);
      }
      y += 5.5;
    }
    y += 5;
  }

  // Transcription excerpt
  if (transcription?.content) {
    y = checkPage(doc, y, pageNum, 40);
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.muted);
    doc.setFont("helvetica", "bold");
    doc.text("🎙 Extrait de transcription", 20, y);
    y += 6;
    doc.setFillColor(...BRAND.bg);
    const excerpt = transcription.content.substring(0, 600);
    const tLines = doc.splitTextToSize(excerpt + (transcription.content.length > 600 ? "..." : ""), w - 48);
    const tH = Math.min(tLines.length * 4.2 + 6, 60);
    doc.roundedRect(20, y - 2, w - 40, tH, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "normal");
    doc.text(tLines.slice(0, 14), 24, y + 3);
    y += tH + 4;
    if (transcription.content.length > 600) {
      doc.setFontSize(7);
      doc.setTextColor(...BRAND.muted);
      doc.text("Transcription complète disponible dans l'application", w / 2, y, { align: "center" });
    }
  }

  addFooter(doc, pageNum.val);
  return doc;
}

export function PDFReportGenerator({ data, trigger }: PDFReportGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const doc = generatePremiumPDF(data);
      const fileName = `RapidoMeet-Rapport-${data.meeting.title.replace(/[^a-z0-9]/gi, "-").substring(0, 30)}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast({ title: "PDF généré ✓", description: fileName });
    } catch (error: any) {
      toast({ title: "Erreur génération PDF", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const previewSections = [];
  const { meeting, report, tasks, contacts, transcription } = data;

  if (report?.summary) previewSections.push({ title: "📋 Résumé exécutif", content: report.summary });
  if (report?.key_decisions?.length) previewSections.push({ title: "🎯 Décisions clés", content: report.key_decisions.join("\n• ") });
  if (tasks?.length) previewSections.push({ title: "✅ Tâches", content: `${tasks.length} tâche(s) extraite(s)` });
  if (contacts?.length) previewSections.push({ title: "👥 Contacts", content: contacts.map(c => c.name).join(", ") });

  return (
    <>
      <div onClick={() => setPreview(true)} className="cursor-pointer">
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <span>📄</span>
            Exporter PDF Premium
          </Button>
        )}
      </div>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <span>📄</span>
                Rapport PDF Premium
                <Badge className="text-xs bg-primary/10 text-primary">Aperçu</Badge>
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Meeting header preview */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-5">
              <h3 className="font-bold text-lg text-foreground">{meeting.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                📅 {formatDateFR(meeting.created_at)}
                {meeting.duration_seconds ? ` · ⏱ ${formatDuration(meeting.duration_seconds)}` : ""}
              </p>
            </div>

            {/* Score cards preview */}
            <div className="grid grid-cols-3 gap-3">
              {report?.meeting_score && (
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{report.meeting_score}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Score</p>
                </div>
              )}
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{tasks?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Tâches</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{report?.key_decisions?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Décisions</p>
              </div>
            </div>

            {/* Sections preview */}
            {previewSections.map((s, i) => (
              <div key={i} className="border border-border/50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">{s.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground">Format A4 · Haute résolution</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreview(false)}>
                Fermer
              </Button>
              <Button size="sm" disabled={generating} onClick={handleGenerate}>
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "📥 "}
                {generating ? "Génération..." : "Télécharger PDF"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
