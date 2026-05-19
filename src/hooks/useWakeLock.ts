import { useState, useEffect, useRef, useCallback } from "react";

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const isSupported = "wakeLock" in navigator;
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!isSupported) return false;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setIsActive(true);
      wakeLockRef.current.addEventListener("release", () => setIsActive(false));
      return true;
    } catch {
      return false;
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && isActive && !wakeLockRef.current) {
        await acquire();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isActive, acquire]);

  useEffect(() => () => { release(); }, [release]);

  return { isActive, isSupported, acquire, release };
}
