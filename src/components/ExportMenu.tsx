import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExportMenuProps {
  type: "meetings" | "tasks" | "invoices";
  label?: string;
}

export function ExportMenu({ type, label }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format = "csv") => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/export-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ type, format }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      if (format === "json") {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `export-${type}.json`; a.click(); URL.revokeObjectURL(url);
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = res.headers.get("Content-Disposition")?.split('filename="')[1]?.replace('"', "") || `export-${type}.csv`;
        a.click(); URL.revokeObjectURL(url);
      }
      toast({ title: "Export téléchargé ✓" });
    } catch (e: any) {
      toast({ title: "Erreur d'export", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting} className="text-xs">
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
          {label || "Exporter"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("csv")}>📊 CSV (Excel compatible)</DropdownMenuItem>
        {type === "invoices" && <DropdownMenuItem onClick={() => handleExport("json")}>🔧 JSON (API)</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
