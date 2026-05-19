import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAdminActions() {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const executeAction = async (
    action: string,
    userId: string,
    payload?: Record<string, any>
  ): Promise<boolean> => {
    setLoadingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-actions", {
        body: { action, userId, payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "✅ Action réussie",
        description: data?.message || "Opération effectuée.",
      });
      return true;
    } catch (e: any) {
      toast({
        title: "❌ Erreur",
        description: e.message || "L'action a échoué.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoadingUserId(null);
    }
  };

  return { executeAction, loadingUserId };
}
