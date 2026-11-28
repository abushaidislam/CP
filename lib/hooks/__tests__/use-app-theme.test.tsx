import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { useStudioStore } from "@/lib/store/studio-store";
import { useAppTheme } from "../use-app-theme";

describe("useAppTheme", () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  let classSet = new Set<string>(["dark"]);
  let styleMap = new Map<string, string>();
  let storageMap = new Map<string, string>();
  let metaContent = "#050506";
  let startViewTransitionCalls = 0;
  let resolveTransition: (() => void) | null = null;
  let reducedMotion = false;

  beforeEach(() => {
    classSet = new Set<string>(["dark"]);
    styleMap = new Map<string, string>();
    storageMap = new Map<string, string>();
    metaContent = "#050506";
    startViewTransitionCalls = 0;
    resolveTransition = null;
    reducedMotion = false;

    useStudioStore.setState({ appTheme: "dark" });

    (globalThis as any).window = {
      innerWidth: 1200,
      innerHeight: 800,
      localStorage: {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => storageMap.set(k, v),
        removeItem: (k: string) => storageMap.delete(k),
      },
      matchMedia: (query: string) => ({
        matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
      }),
      requestAnimationFrame: (cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      },
    };

    (globalThis as any).document = {
      documentElement: {
        classList: {
          add: (cls: string) => classSet.add(cls),
          remove: (cls: string) => classSet.delete(cls),
          contains: (cls: string) => classSet.has(cls),
        },
        style: {
          colorScheme: "dark",
          setProperty: (k: string, v: string) => styleMap.set(k, v),
        },
      },
      querySelector: (selector: string) =>
        selector === 'meta[name="theme-color"]'
          ? {
              setAttribute: (_name: string, value: string) => {
                metaContent = value;
              },
            }
          : null,
      startViewTransition: (cb: () => void) => {
        startViewTransitionCalls += 1;
        cb();
        return {
          finished: new Promise<void>((resolve) => {
            resolveTransition = resolve;
          }),
        };
      },
    };
  });

  afterEach(() => {
    (globalThis as any).document = originalDocument;
    (globalThis as any).window = originalWindow;
  });

  it("uses View Transitions API with button geometry and cleans up theme-switching class", async () => {
    let latestApi: ReturnType<typeof useAppTheme> | null = null;

    function Harness() {
      latestApi = useAppTheme();
      return <div data-dark={String(latestApi.isDark)} />;
    }

    renderToString(<Harness />);
    expect(latestApi).not.toBeNull();

    const fakeTarget = {
      getBoundingClientRect: () => ({
        left: 1100,
        top: 10,
        width: 32,
        height: 32,
      }),
    };

    latestApi!.toggleTheme({ currentTarget: fakeTarget } as unknown as React.MouseEvent);

    expect(startViewTransitionCalls).toBe(1);
    expect(useStudioStore.getState().appTheme).toBe("light");
    expect(classSet.has("dark")).toBe(false);
    expect(classSet.has("theme-switching")).toBe(true);
    expect(storageMap.get("cp-app-theme")).toBe("light");
    expect(metaContent).toBe("#f8f9fa");
    expect(styleMap.get("--vt-x")).toBe("1116px");
    expect(styleMap.get("--vt-y")).toBe("26px");
    expect(styleMap.get("--vt-r")).toBeTruthy();

    resolveTransition?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(classSet.has("theme-switching")).toBe(false);
  });

  it("bypasses startViewTransition when prefers-reduced-motion is enabled", () => {
    reducedMotion = true;
    let latestApi: ReturnType<typeof useAppTheme> | null = null;

    function Harness() {
      latestApi = useAppTheme();
      return <div />;
    }

    renderToString(<Harness />);
    latestApi!.toggleTheme();

    expect(startViewTransitionCalls).toBe(0);
    expect(useStudioStore.getState().appTheme).toBe("light");
    expect(classSet.has("dark")).toBe(false);
    expect(classSet.has("theme-switching")).toBe(false);
  });
});
