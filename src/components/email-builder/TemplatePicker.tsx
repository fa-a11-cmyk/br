import { useEffect, useState } from "react";
import { EMAIL_TEMPLATES, EmailTemplate } from "./EmailTemplates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onSelect: (template: EmailTemplate) => void;
  onBack: () => void;
}

interface GlobalTemplate {
  id: string;
  name: string;
  category: string;
  preview_text: string | null;
  html_content: string;
  gjsdata: any;
}

const TemplatePicker = ({ onSelect, onBack }: Props) => {
  const [globalTemplates, setGlobalTemplates] = useState<GlobalTemplate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("email_templates")
      .select("id, name, category, preview_text, html_content, gjsdata")
      .eq("is_global", true)
      .order("name")
      .then(({ data }) => {
        if (data) setGlobalTemplates(data as GlobalTemplate[]);
      });
  }, []);

  const handleUseGlobal = async (tpl: GlobalTemplate) => {
    // Increment usage count via RPC
    try {
      await supabase.rpc("increment_template_usage", { p_template_id: tpl.id });
    } catch {}

    // Convert to EmailTemplate format for GrapeJS
    const emailTemplate: EmailTemplate = {
      id: tpl.id,
      name: tpl.name,
      emoji: "🌐",
      description: tpl.preview_text || "Template global",
      html: tpl.html_content,
      css: "",
    };
    toast({ title: "Template chargé ✓" });
    onSelect(emailTemplate);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Configuration
        </Button>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground mb-2">
          Email Builder
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Choisissez un template pour commencer ou partez de zéro.
        </p>

        {/* Global templates section */}
        {globalTemplates.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-amber-500" />
              <h2 className="font-display font-bold text-sm text-foreground">Templates globaux</h2>
              <Badge variant="secondary" className="text-[10px]">{globalTemplates.length}</Badge>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {globalTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleUseGlobal(tpl)}
                  className="flex-shrink-0 w-56 text-left bg-card border border-amber-500/20 rounded-xl p-4 hover:border-amber-500/50 hover:shadow-md transition-all"
                >
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] mb-2">
                    {tpl.category}
                  </Badge>
                  <h3 className="font-display font-bold text-sm text-foreground mb-1 line-clamp-1">
                    {tpl.name}
                  </h3>
                  {tpl.preview_text && (
                    <p className="text-muted-foreground text-[11px] line-clamp-2">{tpl.preview_text}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EMAIL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="group text-left bg-card border border-border/40 rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <span className="text-3xl block mb-3">{t.emoji}</span>
              <h3 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors mb-1">
                {t.name}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplatePicker;
