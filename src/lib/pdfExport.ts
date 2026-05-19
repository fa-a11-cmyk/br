/**
 * Generates a styled PDF in the browser using jsPDF.
 * Works for both transcription and report downloads.
 */
import { jsPDF } from "jspdf";

interface TranscriptionLine {
  time: string;
  speaker: string;
  text: string;
}

interface TaskItem {
  text: string;
  assignee: string;
  deadline: string;
  priority: string;
}

interface ReportData {
  title: string;
  date: string;
  duration: string;
  participants: string[];
  summary: string;
  decisions: string[];
  tasks: TaskItem[];
  sentiment?: number;
}

const FUCHSIA: [number, number, number] = [233, 30, 140];
const VIOLET: [number, number, number] = [124, 58, 237];
const DARK: [number, number, number] = [8, 8, 13];
const GRAY: [number, number, number] = [152, 152, 176];
const WHITE: [number, number, number] = [245, 245, 250];
const SUCCESS: [number, number, number] = [16, 185, 129];

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  // Gradient bar
  const w = doc.internal.pageSize.getWidth();
  for (let i = 0; i < w; i++) {
    const t = i / w;
    const r = Math.round(FUCHSIA[0] * (1 - t) + VIOLET[0] * t);
    const g = Math.round(FUCHSIA[1] * (1 - t) + VIOLET[1] * t);
    const b = Math.round(FUCHSIA[2] * (1 - t) + VIOLET[2] * t);
    doc.setFillColor(r, g, b);
    doc.rect(i, 0, 1.5, 6, "F");
  }

  // Logo text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...FUCHSIA);
  doc.text("Rapido", 20, 22);
  doc.setTextColor(...DARK);
  doc.text("Meet", 20 + doc.getTextWidth("Rapido"), 22);

  // Title
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text(title, 20, 34);

  // Subtitle
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(subtitle, 20, 42);

  // Separator
  doc.setDrawColor(...FUCHSIA);
  doc.setLineWidth(0.5);
  doc.line(20, 47, w - 20, 47);

  return 55; // y position after header
}

function addFooter(doc: jsPDF, pageNum: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`RapidoMeet · Généré le ${new Date().toLocaleDateString("fr-FR")}`, 20, h - 10);
  doc.text(`Page ${pageNum}`, w - 35, h - 10);
}

function checkNewPage(doc: jsPDF, y: number, margin: number, pageNum: { val: number }): number {
  const h = doc.internal.pageSize.getHeight();
  if (y > h - margin) {
    addFooter(doc, pageNum.val);
    doc.addPage();
    pageNum.val++;
    return 20;
  }
  return y;
}

export function downloadTranscriptionPDF(
  title: string,
  date: string,
  lines: TranscriptionLine[]
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const pageNum = { val: 1 };

  let y = addHeader(doc, `Transcription — ${title}`, `${date} · ${lines.length} interventions`);

  for (const line of lines) {
    y = checkNewPage(doc, y, 30, pageNum);

    // Timestamp
    doc.setFontSize(8);
    doc.setTextColor(...VIOLET);
    doc.setFont("courier", "normal");
    doc.text(line.time, 20, y);

    // Speaker
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...FUCHSIA);
    doc.text(line.speaker, 42, y);

    // Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const textLines = doc.splitTextToSize(line.text, w - 65);
    doc.text(textLines, 42, y + 5);
    y += 5 + textLines.length * 4.5 + 4;
  }

  addFooter(doc, pageNum.val);
  doc.save(`transcription-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function downloadReportPDF(data: ReportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const pageNum = { val: 1 };

  let y = addHeader(doc, data.title, `${data.date} · ${data.duration} · ${data.participants.length} participants`);

  // Stats bar
  const stats = [
    { label: "Durée", value: data.duration },
    { label: "Participants", value: String(data.participants.length) },
    { label: "Tâches", value: String(data.tasks.length) },
    { label: "Décisions", value: String(data.decisions.length) },
  ];
  if (data.sentiment) stats.push({ label: "Sentiment", value: `${data.sentiment}%` });

  const boxW = (w - 40 - (stats.length - 1) * 4) / stats.length;
  stats.forEach((s, i) => {
    const x = 20 + i * (boxW + 4);
    doc.setFillColor(245, 240, 250);
    doc.roundedRect(x, y, boxW, 16, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(s.label.toUpperCase(), x + boxW / 2, y + 5, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(...FUCHSIA);
    doc.setFont("helvetica", "bold");
    doc.text(s.value, x + boxW / 2, y + 13, { align: "center" });
  });
  y += 24;

  // Summary
  doc.setFontSize(11);
  doc.setTextColor(...FUCHSIA);
  doc.setFont("helvetica", "bold");
  doc.text("Résumé exécutif", 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(data.summary, w - 40);
  doc.text(summaryLines, 20, y);
  y += summaryLines.length * 4.5 + 8;

  // Decisions
  y = checkNewPage(doc, y, 40, pageNum);
  doc.setFontSize(11);
  doc.setTextColor(...VIOLET);
  doc.setFont("helvetica", "bold");
  doc.text("📌 Décisions clés", 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (const d of data.decisions) {
    y = checkNewPage(doc, y, 20, pageNum);
    doc.setTextColor(...SUCCESS);
    doc.text("✓", 22, y);
    doc.setTextColor(...DARK);
    doc.text(d, 28, y);
    y += 5.5;
  }
  y += 6;

  // Tasks
  y = checkNewPage(doc, y, 40, pageNum);
  doc.setFontSize(11);
  doc.setTextColor(...FUCHSIA);
  doc.setFont("helvetica", "bold");
  doc.text("✅ Tâches extraites", 20, y);
  y += 8;

  // Table header
  doc.setFillColor(240, 237, 250);
  doc.roundedRect(20, y - 4, w - 40, 8, 1, 1, "F");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "bold");
  doc.text("TÂCHE", 22, y);
  doc.text("ASSIGNÉ", w - 90, y);
  doc.text("DEADLINE", w - 60, y);
  doc.text("PRIORITÉ", w - 35, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const t of data.tasks) {
    y = checkNewPage(doc, y, 20, pageNum);
    doc.setTextColor(...DARK);
    const taskLines = doc.splitTextToSize(t.text, 60);
    doc.text(taskLines, 22, y);
    doc.setTextColor(...GRAY);
    doc.text(t.assignee, w - 90, y);
    doc.text(t.deadline, w - 60, y);
    const pColor = t.priority === "Haute" ? FUCHSIA : t.priority === "Moyenne" ? VIOLET : GRAY;
    doc.setTextColor(...pColor);
    doc.text(t.priority, w - 35, y);
    y += Math.max(taskLines.length * 4, 5) + 3;
  }

  // Participants
  y += 6;
  y = checkNewPage(doc, y, 40, pageNum);
  doc.setFontSize(11);
  doc.setTextColor(...VIOLET);
  doc.setFont("helvetica", "bold");
  doc.text("👥 Participants", 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text(data.participants.join(" · "), 20, y);

  addFooter(doc, pageNum.val);
  doc.save(`rapport-${data.title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
