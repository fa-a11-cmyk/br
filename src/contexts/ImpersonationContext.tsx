import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImpersonationState {
  isImpersonating: boolean;
  sessionId: string | null;
  targetUserId: string | null;
  expiresAt: string | null;
  startImpersonation: (actionLink: string, sessionId: string, targetUserId: string, expiresAt: string) => void;
  endImpersonation: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationState>({
  isImpersonating: false, sessionId: null, targetUserId: null, expiresAt: null,
  startImpersonation: () => {}, endImpersonation: async () => {},
});

const STORAGE_KEY = "rapidomeet_impersonation";

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ sessionId: string | null; targetUserId: string | null; expiresAt: string | null }>({
    sessionId: null, targetUserId: null, expiresAt: null,
  });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
          setState(parsed);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}
  }, []);

  const isImpersonating = !!state.sessionId && !!state.expiresAt && new Date(state.expiresAt) > new Date();

  const startImpersonation = useCallback((actionLink: string, sessionId: string, targetUserId: string, expiresAt: string) => {
    const data = { sessionId, targetUserId, expiresAt };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setState(data);
    window.location.href = actionLink;
  }, []);

  const endImpersonation = useCallback(async () => {
    if (state.sessionId) {
      try {
        await supabase.functions.invoke("admin-actions", {
          body: { action: "end_impersonation", userId: "system", payload: { sessionId: state.sessionId } },
        });
      } catch {}
    }
    sessionStorage.removeItem(STORAGE_KEY);
    setState({ sessionId: null, targetUserId: null, expiresAt: null });
    await supabase.auth.signOut();
    toast.success("Session d'impersonation terminée");
    window.location.href = "/admin";
  }, [state.sessionId]);

  return (
    <ImpersonationContext.Provider value={{ isImpersonating, ...state, startImpersonation, endImpersonation }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export const useImpersonation = () => useContext(ImpersonationContext);
