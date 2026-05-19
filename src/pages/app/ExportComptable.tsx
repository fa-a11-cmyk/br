import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { ExportMenu } from "@/components/ExportMenu";

interface StripeInvoice {
  id: string; number: string; created: number; status: string; currency: string;
  subtotal: number; tax: number; total: number; invoice_pdf: string;
  lines?: { data: Array<{ description: string }> };
}

const ExportComptable = () => {
  const { t } = useTranslation("app");
  const { isEnabled } = useFeatureFlags();
  const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchInvoices(); }, []);

  if (!isEnabled("export_comptable")) return <Navigate to="/app/dashboard" replace />;

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ type: "invoices", format: "json" }),
      });
      const data = await res.json();
      if (data.invoices) setInvoices(data.invoices);
      else if (data.error) setError(data.error);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const totalHT = invoices.reduce((sum, i) => sum + (i.subtotal || 0), 0) / 100;
  const totalTVA = invoices.reduce((sum, i) => sum + ((i.tax || 0)), 0) / 100;
  const totalTTC = invoices.reduce((sum, i) => sum + (i.total || 0), 0) / 100;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(t("exportComptable.pdfTitle"), 14, 22);
    doc.setFontSize(10); doc.text(t("exportComptable.generatedOn", { date: new Date().toLocaleDateString("fr-FR") }), 14, 30);
    let y = 45; doc.setFontSize(8); doc.setFont("helvetica", "bold");
    ["Date", "Description", "HT", "TVA", "TTC"].forEach((h, i) => doc.text(h, 14 + i * 38, y));
    y += 6; doc.setFont("helvetica", "normal");
    invoices.forEach((inv) => {
      doc.text(new Date(inv.created * 1000).toLocaleDateString("fr-FR"), 14, y);
      doc.text((inv.lines?.data?.[0]?.description || "Abonnement").substring(0, 30), 52, y);
      doc.text(`${(inv.subtotal / 100).toFixed(2)}€`, 90, y);
      doc.text(`${((inv.tax || 0) / 100).toFixed(2)}€`, 128, y);
      doc.text(`${(inv.total / 100).toFixed(2)}€`, 166, y);
      y += 6;
    });
    doc.save(`recap_comptable_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: t("exportComptable.pdfDownloaded") });
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-[1100px]">
      <p className="font-mono text-[11px] uppercase tracking-[2px] text-muted-foreground/60 mb-4">{t("exportComptable.breadcrumb")}</p>
      <h1 className="font-display font-extrabold text-2xl sm:text-[28px] md:text-[32px] tracking-tight text-foreground mb-1">{t("exportComptable.title")}</h1>
      <p className="font-body text-[15px] text-muted-foreground mb-8">{t("exportComptable.subtitle")}</p>

      <Card className="border-border/30 mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg">{t("exportComptable.invoicesTitle")}</CardTitle>
            <ExportMenu type="invoices" label="Exporter" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-2">{error}</p>
              {error.includes("Aucun") && <p className="text-sm text-muted-foreground">Souscrivez à un plan payant pour voir vos factures.</p>}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">📄</p>
              <p className="text-muted-foreground">Aucune facture disponible.</p>
              <p className="text-sm text-muted-foreground mt-1">Souscrivez à un plan payant pour voir vos factures.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20">
                      <th className="py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-left">N° Facture</th>
                      <th className="py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-left">Date</th>
                      <th className="py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-left">Description</th>
                      <th className="py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">HT</th>
                      <th className="py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">TVA</th>
                      <th className="py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">TTC</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/10">
                        <td className="py-3 font-mono text-xs text-muted-foreground">{inv.number || inv.id.slice(0, 12)}</td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">{new Date(inv.created * 1000).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 font-body text-foreground text-xs sm:text-sm">{inv.lines?.data?.[0]?.description || "Abonnement RapidoMeet"}</td>
                        <td className="py-3 text-right font-mono text-xs text-foreground">{(inv.subtotal / 100).toFixed(2)}€</td>
                        <td className="py-3 text-right font-mono text-xs text-muted-foreground">{((inv.tax || 0) / 100).toFixed(2)}€</td>
                        <td className="py-3 text-right font-mono text-xs text-foreground font-medium">{(inv.total / 100).toFixed(2)}€</td>
                        <td className="py-3 text-right">
                          {inv.invoice_pdf && (
                            <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary"><Download className="h-3 w-3 mr-1" /> PDF</Button>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td className="py-3" colSpan={3}><span className="font-body text-xs text-foreground">{t("exportComptable.total")}</span></td>
                      <td className="py-3 text-right font-mono text-xs text-foreground">{totalHT.toFixed(2)}€</td>
                      <td className="py-3 text-right font-mono text-xs text-muted-foreground">{totalTVA.toFixed(2)}€</td>
                      <td className="py-3 text-right font-mono text-xs text-foreground font-bold">{totalTTC.toFixed(2)}€</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <Button variant="outline" className="text-xs" onClick={exportPDF}><FileText className="h-3 w-3 mr-1" /> {t("exportComptable.recapPDF")}</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportComptable;
