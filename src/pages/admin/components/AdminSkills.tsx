import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export default function AdminSkills() {
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("openclaw_skills" as any)
      .select("*")
      .order("install_count", { ascending: false })
      .then(({ data }) => setSkills((data as any[]) || []));
  }, []);

  const toggleField = async (skillId: string, field: string, current: boolean) => {
    await supabase.from("openclaw_skills" as any).update({ [field]: !current } as any).eq("id", skillId);
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, [field]: !current } : s));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">⚡ Gestion Skills Marketplace</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Skills publiés", value: skills.filter(s => s.is_published).length },
          { label: "Total installations", value: skills.reduce((s, sk) => s + (sk.install_count || 0), 0) },
          { label: "Mieux noté", value: skills.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0))[0]?.name || "—" },
        ].map(kpi => (
          <Card key={kpi.label} className="p-3">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="font-bold text-lg mt-0.5">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border/30">
            <tr>
              {["Skill", "Catégorie", "Installations", "Note", "Plan", "Featured", "Publié"].map(h => (
                <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skills.map(skill => (
              <tr key={skill.id} className="border-b border-border/20 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{skill.icon}</span>
                    <span className="font-medium">{skill.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{skill.category}</td>
                <td className="px-4 py-3 text-center">{skill.install_count || 0}</td>
                <td className="px-4 py-3">{skill.rating_count > 0 ? `⭐ ${skill.rating_avg}` : "—"}</td>
                <td className="px-4 py-3"><Badge className="text-xs">{skill.required_plan}</Badge></td>
                <td className="px-4 py-3">
                  <Switch checked={skill.is_featured} onCheckedChange={() => toggleField(skill.id, "is_featured", skill.is_featured)} />
                </td>
                <td className="px-4 py-3">
                  <Switch checked={skill.is_published} onCheckedChange={() => toggleField(skill.id, "is_published", skill.is_published)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
