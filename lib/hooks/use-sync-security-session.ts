"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/lib/store/studio-store";

let hasRequestedInitialSessionSync = false;

/**
 * Syncs owner authentication & daily quota telemetry from /api/auth/session
 * once on initial page load without needing to mount SecurityShieldModal.
 */
export function useSyncSecuritySession() {
  const setSecurityTelemetry = useStudioStore(
    (state) => state.setSecurityTelemetry
  );

  useEffect(() => {
    if (hasRequestedInitialSessionSync) return;
    hasRequestedInitialSessionSync = true;

    let cancelled = false;
    const sync = async () => {
      try {
        const headers: Record<string, string> = {
          "X-Studio-Client": "component-studio",
        };
        const currentToken = useStudioStore.getState().ownerSessionToken;
        if (currentToken) {
          headers["X-Studio-Owner-Token"] = currentToken;
        }
        const res = await fetch("/api/auth/session", {
          method: "GET",
          headers,
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setSecurityTelemetry(data);
        }
      } catch {
        // Allow retry on next mount if network failed
        hasRequestedInitialSessionSync = false;
      }
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [setSecurityTelemetry]);
}
