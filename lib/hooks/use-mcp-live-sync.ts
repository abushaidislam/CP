"use client";

import { useEffect, useRef, useState } from "react";
import { useStudioStore } from "@/lib/store/studio-store";

export interface McpSyncBannerInfo {
  slug: string;
  action: "create" | "update" | "patch" | "restore" | "delete";
  version?: string;
  updatedAt: number;
  message: string;
}

/**
 * Watches for real-time MCP updates (from Gemini, Cursor, Claude, or Antigravity)
 * and automatically hydrates the latest version into Studio or Hub without page reload.
 */
export function useMcpLiveSync(activeSlug?: string) {
  const [lastSyncedEvent, setLastSyncedEvent] = useState<McpSyncBannerInfo | null>(null);
  const lastTimestampRef = useRef<number>(Date.now());
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkEvents = async () => {
      try {
        const query = new URLSearchParams({
          mode: "events",
          since: String(lastTimestampRef.current),
        });
        if (activeSlug) {
          query.set("slug", activeSlug);
        }

        const res = await fetch(`/api/mcp?${query.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;

        const data = (await res.json()) as {
          events?: McpSyncBannerInfo[];
          serverTime?: number;
        };

        if (Array.isArray(data.events) && data.events.length > 0) {
          const newest = data.events[0];
          lastTimestampRef.current = Math.max(
            lastTimestampRef.current,
            newest.updatedAt,
            data.serverTime || 0
          );

          const store = useStudioStore.getState();

          if (activeSlug && newest.slug === activeSlug && newest.action !== "delete") {
            // Only auto-hydrate if user doesn't have conflicting unsaved local edits
            if (store.repoSyncStatus !== "dirty") {
              const singleRes = await fetch(
                `/api/repo-sync?slug=${encodeURIComponent(activeSlug)}`,
                { cache: "no-store" }
              );
              if (singleRes.ok && !cancelled) {
                const singleData = await singleRes.json();
                if (singleData?.component) {
                  store.hydrateSingleComponentFromServer(
                    singleData.component,
                    singleData.manifest?.variants,
                    singleData.manifest?.activeVariantId
                  );
                }
              }
            }
          } else {
            // In Hub mode or when another component is created/updated, refresh summaries
            await store.hydrateFromProjectRepo?.();
          }

          if (!cancelled) {
            setLastSyncedEvent(newest);
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = setTimeout(() => {
              setLastSyncedEvent(null);
            }, 4500);
          }
        }
      } catch {
        // Ignore transient network errors during background poll
      }
    };

    const interval = setInterval(checkEvents, 3500);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [activeSlug]);

  return {
    lastSyncedEvent,
    dismissSyncEvent: () => setLastSyncedEvent(null),
  };
}
