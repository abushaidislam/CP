"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { useStudioStore } from "@/lib/store/studio-store";

export type AppTheme = "dark" | "light";

const FAST_THEME_STORAGE_KEY = "cp-app-theme";
const META_THEME_COLORS: Record<AppTheme, string> = {
  light: "#f8f9fa",
  dark: "#050506",
};

interface ViewTransitionLike {
  finished: Promise<void>;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (updateCallback: () => void) => ViewTransitionLike;
};

/**
 * Synchronizes the active theme class, color-scheme, theme-color meta tag, and
 * fast-boot localStorage key with the document root.
 */
function applyThemeToDom(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!root) return;

  if (theme === "dark") {
    root.classList?.add("dark");
  } else {
    root.classList?.remove("dark");
  }

  if (root.style) {
    root.style.colorScheme = theme;
  }

  if (typeof document.querySelector === "function") {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", META_THEME_COLORS[theme]);
  }

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(FAST_THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }
}

/**
 * Resolves the circular View Transition origin and radius from the triggering element or pointer event.
 */
function getTransitionGeometry(
  trigger?: React.MouseEvent | HTMLElement | null
): { x: number; y: number; r: number } {
  const width = typeof window !== "undefined" ? window.innerWidth || 1280 : 1280;
  const height = typeof window !== "undefined" ? window.innerHeight || 720 : 720;

  let x = width - 40;
  let y = 24;

  if (trigger) {
    const maybeEvent = trigger as React.MouseEvent;
    const currentTarget = maybeEvent.currentTarget as
      | { getBoundingClientRect?: () => DOMRect }
      | undefined;
    const directTarget = trigger as { getBoundingClientRect?: () => DOMRect };
    const rectSource =
      typeof currentTarget?.getBoundingClientRect === "function"
        ? currentTarget
        : typeof directTarget?.getBoundingClientRect === "function"
          ? directTarget
          : null;

    if (rectSource?.getBoundingClientRect) {
      const rect = rectSource.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (
      typeof maybeEvent.clientX === "number" &&
      typeof maybeEvent.clientY === "number" &&
      (maybeEvent.clientX !== 0 || maybeEvent.clientY !== 0)
    ) {
      x = maybeEvent.clientX;
      y = maybeEvent.clientY;
    }
  }

  const r = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
  return { x, y, r };
}

/**
 * Shared hook managing application dark/light mode with zero-flash persistence
 * and smooth View Transitions API circular reveal.
 */
export function useAppTheme() {
  const { appTheme, setAppTheme } = useStudioStore(
    useShallow((state) => ({
      appTheme: state.appTheme,
      setAppTheme: state.setAppTheme,
    }))
  );

  // Start deterministic on SSR and initial hydration, then reconcile with store/DOM.
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const resolved: AppTheme = appTheme === "light" ? "light" : "dark";
    setIsDark(resolved === "dark");
    applyThemeToDom(resolved);
  }, [appTheme]);

  const setThemeWithTransition = useCallback(
    (nextTheme: AppTheme, trigger?: React.MouseEvent | HTMLElement | null) => {
      if (typeof document === "undefined") {
        setAppTheme(nextTheme);
        setIsDark(nextTheme === "dark");
        return;
      }

      const doc = document as DocumentWithViewTransition;
      const root = doc.documentElement;
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
      const startViewTransition =
        typeof doc.startViewTransition === "function"
          ? doc.startViewTransition.bind(doc)
          : null;

      if (!startViewTransition || prefersReducedMotion || !root?.style) {
        root?.classList?.add("theme-switching");
        applyThemeToDom(nextTheme);
        setAppTheme(nextTheme);
        setIsDark(nextTheme === "dark");

        if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(() => {
            root?.classList?.remove("theme-switching");
          });
        } else {
          root?.classList?.remove("theme-switching");
        }
        return;
      }

      const { x, y, r } = getTransitionGeometry(trigger);
      root.style.setProperty("--vt-x", `${x}px`);
      root.style.setProperty("--vt-y", `${y}px`);
      root.style.setProperty("--vt-r", `${r}px`);
      root.classList?.add("theme-switching");

      try {
        const transition = startViewTransition(() => {
          flushSync(() => {
            applyThemeToDom(nextTheme);
            setAppTheme(nextTheme);
            setIsDark(nextTheme === "dark");
          });
        });

        Promise.resolve(transition?.finished)
          .catch(() => {
            // Ignore AbortError when toggling rapidly
          })
          .finally(() => {
            root.classList?.remove("theme-switching");
          });
      } catch {
        applyThemeToDom(nextTheme);
        setAppTheme(nextTheme);
        setIsDark(nextTheme === "dark");
        root.classList?.remove("theme-switching");
      }
    },
    [setAppTheme]
  );

  const toggleTheme = useCallback(
    (trigger?: React.MouseEvent | HTMLElement | null) => {
      const nextTheme: AppTheme = appTheme === "dark" ? "light" : "dark";
      setThemeWithTransition(nextTheme, trigger);
    },
    [appTheme, setThemeWithTransition]
  );

  return {
    appTheme,
    isDark,
    toggleTheme,
    setThemeWithTransition,
  };
}
