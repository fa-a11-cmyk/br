import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSkillsMarketplace() {
  const [skills, setSkills] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const [{ data: skillsData }, { data: installData }] = await Promise.all([
      supabase
        .from("openclaw_skills" as any)
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("install_count", { ascending: false }),
      user
        ? supabase
            .from("skill_installations" as any)
            .select("skill_id, is_active, config, use_count")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
    ]);

    setSkills((skillsData as any[]) || []);
    setInstallations((installData as any[]) || []);
    setLoading(false);
  };

  const isInstalled = (skillId: string) =>
    installations.some((i: any) => i.skill_id === skillId && i.is_active);

  const getInstallation = (skillId: string) =>
    installations.find((i: any) => i.skill_id === skillId);

  const install = async (skill: any) => {
    setInstalling(skill.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Connectez-vous pour installer un skill");

      await supabase
        .from("skill_installations" as any)
        .upsert({
          user_id: user.id,
          skill_id: skill.id,
          skill_slug: skill.slug,
          is_active: true,
          installed_at: new Date().toISOString(),
        } as any, { onConflict: "user_id,skill_id" });

      setInstallations(prev => {
        const exists = prev.find((i: any) => i.skill_id === skill.id);
        if (exists) {
          return prev.map((i: any) =>
            i.skill_id === skill.id ? { ...i, is_active: true } : i
          );
        }
        return [...prev, { skill_id: skill.id, is_active: true, use_count: 0 }];
      });

      toast({
        title: `${skill.icon} ${skill.name} installé ✓`,
        description: "Disponible dans OpenClaw",
      });
    } catch (e: any) {
      toast({ title: "Erreur d'installation", description: e.message, variant: "destructive" });
    } finally {
      setInstalling(null);
    }
  };

  const uninstall = async (skillId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("skill_installations" as any)
      .update({ is_active: false } as any)
      .eq("skill_id", skillId)
      .eq("user_id", user.id);

    setInstallations(prev =>
      prev.map((i: any) => i.skill_id === skillId ? { ...i, is_active: false } : i)
    );
    toast({ title: "Skill désinstallé ✓" });
  };

  const rateSkill = async (skillId: string, rating: number, review?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("skill_ratings" as any).upsert({
      user_id: user.id,
      skill_id: skillId,
      rating,
      review: review || null,
    } as any, { onConflict: "user_id,skill_id" });

    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      const newCount = (s.rating_count || 0) + 1;
      const newAvg = ((s.rating_avg || 0) * (s.rating_count || 0) + rating) / newCount;
      return { ...s, rating_avg: Math.round(newAvg * 10) / 10, rating_count: newCount };
    }));

    toast({ title: "Note enregistrée ✓" });
  };

  const installedSkills = skills.filter(s => isInstalled(s.id));

  return {
    skills, installations, loading, installing,
    isInstalled, getInstallation, install, uninstall,
    rateSkill, installedSkills, reload: load,
  };
}
