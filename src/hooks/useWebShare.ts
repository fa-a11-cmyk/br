import { useCallback } from "react";

export function useWebShare() {
  const isSupported = "share" in navigator;

  const shareReport = useCallback(
    async ({ title, text, url }: { title: string; text: string; url: string }) => {
      if (!isSupported) {
        await navigator.clipboard.writeText(url);
        return { success: true, method: "clipboard" as const };
      }
      try {
        await navigator.share({ title: `Rapport RapidoMeet — ${title}`, text, url });
        return { success: true, method: "share" as const };
      } catch {
        return { success: false, method: "share" as const };
      }
    },
    [isSupported]
  );

  const shareText = useCallback(
    async (text: string) => {
      if (!isSupported) {
        await navigator.clipboard.writeText(text);
        return { success: true };
      }
      try {
        await navigator.share({ text });
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    [isSupported]
  );

  return { isSupported, shareReport, shareText };
}
