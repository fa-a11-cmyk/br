import { useCallback } from "react";

export function useAppBadge() {
  const isSupported = "setAppBadge" in navigator;

  const setBadge = useCallback(async (count: number) => {
    if (!isSupported) return;
    try {
      if (count > 0) {
        await (navigator as any).setAppBadge(Math.min(count, 99));
      } else {
        await (navigator as any).clearAppBadge();
      }
    } catch (e) {
      console.error("[Badge] Error:", e);
    }
  }, [isSupported]);

  const clearBadge = useCallback(async () => {
    if (!isSupported) return;
    try {
      await (navigator as any).clearAppBadge();
    } catch (e) {
      console.error("[Badge] Clear error:", e);
    }
  }, [isSupported]);

  return { setBadge, clearBadge, isSupported };
}
