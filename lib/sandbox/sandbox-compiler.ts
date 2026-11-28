import { transform } from "sucrase";
import { extractCodeImports } from "@/lib/sandbox/package-utils";
import { buildVideoStudioRuntimeScript } from "@/lib/sandbox/video-choreography-runtime";

export type PreviewFitMode = "normal" | "scale" | "crop";

export interface CompileSandboxOptions {
  videoStudio?: boolean;
  initialDemoProps?: Record<string, unknown>;
  fitMode?: PreviewFitMode;
}

export interface CompileResult {
  html: string;
  error: string | null;
  detectedDependencies?: string[];
}

/**
 * Normalizes package URL from esm.sh with React 19 compatibility
 */
function buildPackageUrl(pkg: string): string {
  const clean = pkg.trim();
  if (clean === "lucide-react") return "https://esm.sh/lucide-react@0.475.0?deps=react@19";
  if (clean === "framer-motion" || clean === "motion" || clean === "motion/react")
    return "https://esm.sh/framer-motion@11.11.17?deps=react@19";
  if (clean === "canvas-confetti") return "https://esm.sh/canvas-confetti@1.9.4";
  if (clean === "clsx") return "https://esm.sh/clsx@2.1.1";
  if (clean === "tailwind-merge") return "https://esm.sh/tailwind-merge@3.0.1";
  if (clean === "class-variance-authority") return "https://esm.sh/class-variance-authority@0.7.1";
  if (clean.startsWith("@radix-ui/")) return `https://esm.sh/${clean}?deps=react@19,react-dom@19`;

  return `https://esm.sh/${clean}?deps=react@19`;
}

/**
 * Transpiles user TSX code to browser-compatible ES modules using Sucrase
 */
export function transpileTsx(code: string): { js: string; error: string | null } {
  try {
    const res = transform(code, {
      transforms: ["typescript", "jsx"],
      jsxRuntime: "automatic",
      production: true,
    });
    return { js: res.code, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { js: "", error: message };
  }
}

/**
 * Compiles files into a complete, standalone, sandboxed HTML document with theme support
 */
export function compileSandboxHtml(
  componentCode: string,
  demoCode: string,
  cssCode: string,
  dependencies: string[],
  canvasBg: string = "dark",
  previewTheme: "dark" | "light" = "dark",
  options?: CompileSandboxOptions
): CompileResult {
  const isDark = previewTheme === "dark";
  const isVideoStudio = Boolean(options?.videoStudio);
  const initialDemoPropsJson = JSON.stringify(options?.initialDemoProps || {}).replace(/<\/script>/gi, "<\\/script>");
  const initialFitMode: PreviewFitMode = options?.fitMode || "normal";

  // Transpile component.tsx
  const compTranspiled = transpileTsx(componentCode);
  if (compTranspiled.error) {
    const errHtml = generateErrorHtml(
      "Syntax Error in component.tsx",
      compTranspiled.error,
      canvasBg,
      previewTheme
    );
    return { html: errHtml, error: compTranspiled.error };
  }

  // Transpile demo.tsx
  const demoTranspiled = transpileTsx(demoCode);
  if (demoTranspiled.error) {
    // If demo has an error, we don't crash - we can still render component.tsx!
    console.warn("Error in demo.tsx, will render component.tsx directly:", demoTranspiled.error);
  }

  // Clean CSS imports from JavaScript so browser doesn't try to fetch them as JS modules
  const cleanedComponentJs = compTranspiled.js
    .replace(/import\s+['"][^'"]+\.css['"];?/g, "/* css imported */")
    .replace(/(from\s+['"])(?:(?:\.\.|\.)\/|@\/)+(?:(?:lib|src\/lib)\/)?utils(?:\.ts|\.js|\.tsx|\.jsx)?(['"])/g, "$1@utils$2")
    .replace(/(import\s*\(\s*['"])(?:(?:\.\.|\.)\/|@\/)+(?:(?:lib|src\/lib)\/)?utils(?:\.ts|\.js|\.tsx|\.jsx)?(['"]\s*\))/g, "$1@utils$2");

  // Ensure 100% 21st.dev compatibility: resolve "../components/ui/component", "@/components/ui/component", "./component"
  const cleanedDemoJs = (demoTranspiled.js || "")
    .replace(/import\s+['"][^'"]+.css['"];?/g, "/* css imported */")
    .replace(/(from\s+['"])(?:(?:\.\.|\.)\/|@\/)+(?:(?:components|src\/components)\/)?(?:ui\/)?component(?:\.tsx|\.jsx|\.js)?(['"])/g, "$1@component$2")
    .replace(/(import\s*\(\s*['"])(?:(?:\.\.|\.)\/|@\/)+(?:(?:components|src\/components)\/)?(?:ui\/)?component(?:\.tsx|\.jsx|\.js)?(['"]\s*\))/g, "$1@component$2")
    .replace(/(from\s+['"])(?:(?:\.\.|\.)\/|@\/)+(?:(?:lib|src\/lib)\/)?utils(?:\.ts|\.js|\.tsx|\.jsx)?(['"])/g, "$1@utils$2")
    .replace(/(import\s*\(\s*['"])(?:(?:\.\.|\.)\/|@\/)+(?:(?:lib|src\/lib)\/)?utils(?:\.ts|\.js|\.tsx|\.jsx)?(['"]\s*\))/g, "$1@utils$2");

  // Synthesize default/named exports in component.tsx so both `import Component from ...` and `import { Component } from ...` succeed
  let exportAugmentedComponentJs = cleanedComponentJs;
  if (!/export\s+default\b/.test(cleanedComponentJs)) {
    const namedMatch = cleanedComponentJs.match(/export\s+(?:function|const|class)\s+([A-Za-z0-9_$]+)/);
    if (namedMatch && namedMatch[1]) {
      exportAugmentedComponentJs += `\nexport default ${namedMatch[1]};\nexport { ${namedMatch[1]} as Component };`;
    }
  } else {
    const defMatch = cleanedComponentJs.match(/export\s+default\s+function\s+([A-Za-z0-9_$]+)/);
    if (defMatch && defMatch[1] && defMatch[1] !== "Component") {
      exportAugmentedComponentJs += `\nexport { ${defMatch[1]} as Component };`;
    }
  }

  // Auto-detect any imported dependencies in both files
  const detectedDeps = Array.from(
    new Set([
      ...dependencies,
      ...extractCodeImports(componentCode),
      ...extractCodeImports(demoCode),
    ])
  );

  // In-memory alias for @/lib/utils cn()
  const cnModuleDataUri =
    "data:text/javascript;charset=utf-8," +
    encodeURIComponent(
      'import { clsx } from "clsx";\n' +
      'import { twMerge } from "tailwind-merge";\n' +
      'export function cn(...inputs) { return twMerge(clsx(inputs)); }\n' +
      'export default cn;'
    );

  // In-memory alias for component.tsx
  const componentDataUri =
    "data:text/javascript;charset=utf-8," +
    encodeURIComponent(exportAugmentedComponentJs);

  const demoDataUri =
    "data:text/javascript;charset=utf-8," +
    encodeURIComponent(cleanedDemoJs);

  // Build comprehensive ESM import map
  const importsMap: Record<string, string> = {
    react: "https://esm.sh/react@19",
    "react/": "https://esm.sh/react@19/",
    "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@19/jsx-dev-runtime",
    "react-dom": "https://esm.sh/react-dom@19",
    "react-dom/": "https://esm.sh/react-dom@19/",
    "react-dom/client": "https://esm.sh/react-dom@19/client",
    clsx: "https://esm.sh/clsx@2.1.1",
    "tailwind-merge": "https://esm.sh/tailwind-merge@3.0.1",
    "lucide-react": "https://esm.sh/lucide-react@0.475.0?deps=react@19",
    "framer-motion": "https://esm.sh/framer-motion@11.11.17?deps=react@19",
    motion: "https://esm.sh/framer-motion@11.11.17?deps=react@19",
    "motion/react": "https://esm.sh/framer-motion@11.11.17?deps=react@19",
    "canvas-confetti": "https://esm.sh/canvas-confetti@1.9.4",
    "@/lib/utils": cnModuleDataUri,
    "@/utils": cnModuleDataUri,
    "@utils": cnModuleDataUri,
    "./utils": cnModuleDataUri,
    "../utils": cnModuleDataUri,
    "@component": componentDataUri,
    "@demo": demoDataUri,
    "../components/ui/component": componentDataUri,
    "../components/ui/component.tsx": componentDataUri,
    "../../components/ui/component": componentDataUri,
    "@/components/ui/component": componentDataUri,
    "@/components/ui/component.tsx": componentDataUri,
    "@/components/component": componentDataUri,
    "./component": componentDataUri,
    "./component.tsx": componentDataUri,
    "../component": componentDataUri,
  };

  for (const dep of detectedDeps) {
    if (!importsMap[dep]) {
      importsMap[dep] = buildPackageUrl(dep);
    }
  }

  // Safe JSON serialization of the code strings (protects against backticks, ${}, quotes, and </script>)
  const safeCompJs = JSON.stringify(cleanedComponentJs).replace(/<\/script>/gi, "<\\/script>");
  const safeDemoJs = JSON.stringify(cleanedDemoJs).replace(/<\/script>/gi, "<\\/script>");
  const safeDemoDataUri = JSON.stringify(demoDataUri).replace(/<\/script>/gi, "<\\/script>");
  const safeCssCode = (cssCode || "").replace(/<\/style/gi, "<\\/style");

  // Base background attribute inside preview according to canvasBg and previewTheme
  const safeCanvasBg = canvasBg || "dark";

  const html = `<!DOCTYPE html>
<html lang="en" class="h-full ${isDark ? "dark" : ""}" data-fit-mode="${initialFitMode}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>21st.dev Component Preview</title>
  <script>
    (function() {
      try {
        if (!HTMLCanvasElement.prototype.__studioPatchedGetContext) {
          var origGetContext = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function(type, attributes) {
            if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
              attributes = Object.assign({}, attributes || {}, { preserveDrawingBuffer: true });
            }
            return origGetContext.call(this, type, attributes);
          };
          Object.defineProperty(HTMLCanvasElement.prototype, "__studioPatchedGetContext", {
            value: true,
            configurable: true
          });
        }
      } catch (e) {}
      try {
        window.localStorage.getItem("__test__");
      } catch (e) {
        var mem = {};
        var fakeStorage = {
          getItem: function(k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
          setItem: function(k, v) { mem[k] = String(v); },
          removeItem: function(k) { delete mem[k]; },
          clear: function() { mem = {}; },
          key: function(i) { return Object.keys(mem)[i] || null; },
          get length() { return Object.keys(mem).length; }
        };
        try { Object.defineProperty(window, "localStorage", { value: fakeStorage }); } catch (err) {}
        try { Object.defineProperty(window, "sessionStorage", { value: fakeStorage }); } catch (err) {}
      }
    })();
  </script>
  
  <!-- Tailwind CSS CDN with Dynamic MutationObserver scanning -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: 'var(--border)',
            input: 'var(--input)',
            ring: 'var(--ring)',
            background: 'var(--background)',
            foreground: 'var(--foreground)',
            primary: {
              DEFAULT: 'var(--primary)',
              foreground: 'var(--primary-foreground)',
            },
            secondary: {
              DEFAULT: 'var(--secondary)',
              foreground: 'var(--secondary-foreground)',
            },
            destructive: {
              DEFAULT: 'var(--destructive)',
              foreground: 'var(--destructive-foreground)',
            },
            muted: {
              DEFAULT: 'var(--muted)',
              foreground: 'var(--muted-foreground)',
            },
            accent: {
              DEFAULT: 'var(--accent)',
              foreground: 'var(--accent-foreground)',
            },
            popover: {
              DEFAULT: 'var(--popover)',
              foreground: 'var(--popover-foreground)',
            },
            card: {
              DEFAULT: 'var(--card)',
              foreground: 'var(--card-foreground)',
            },
            zinc: {
              950: '#09090b',
              900: '#18181b',
              800: '#27272a',
              700: '#3f3f46',
            }
          }
        }
      }
    };
  </script>
  
  <!-- Custom Component CSS & Theme Variables -->
  <style>
    :root {
      --background: #ffffff;
      --foreground: #09090b;
      --card: #ffffff;
      --card-foreground: #09090b;
      --popover: #ffffff;
      --popover-foreground: #09090b;
      --primary: #18181b;
      --primary-foreground: #fafafa;
      --secondary: #f4f4f5;
      --secondary-foreground: #18181b;
      --muted: #f4f4f5;
      --muted-foreground: #71717a;
      --accent: #f4f4f5;
      --accent-foreground: #18181b;
      --destructive: #ef4444;
      --destructive-foreground: #fafafa;
      --border: #e4e4e7;
      --input: #e4e4e7;
      --ring: #18181b;
      --radius: 0.5rem;
    }

    .dark {
      --background: #09090b;
      --foreground: #fafafa;
      --card: #09090b;
      --card-foreground: #fafafa;
      --popover: #09090b;
      --popover-foreground: #fafafa;
      --primary: #fafafa;
      --primary-foreground: #18181b;
      --secondary: #27272a;
      --secondary-foreground: #fafafa;
      --muted: #27272a;
      --muted-foreground: #a1a1aa;
      --accent: #27272a;
      --accent-foreground: #fafafa;
      --destructive: #7f1d1d;
      --destructive-foreground: #fafafa;
      --border: #27272a;
      --input: #27272a;
      --ring: #d4d4d8;
    }

    *, ::before, ::after { box-sizing: border-box; }
    html, body {
      min-height: 100%;
      margin: 0;
      padding: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    #root {
      min-height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
    }
    html[data-fit-mode="scale"] #root {
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    html[data-fit-mode="crop"] #root {
      align-items: flex-start;
      justify-content: flex-start;
      overflow: hidden;
      mask-image: linear-gradient(to bottom, black 82%, transparent 100%);
      -webkit-mask-image: linear-gradient(to bottom, black 82%, transparent 100%);
    }
    html[data-fit-mode="scale"] [data-fit-hide],
    html[data-fit-mode="crop"] [data-fit-hide] {
      display: none !important;
    }
    ${isVideoStudio ? "html, body { overflow-x: hidden; }" : ""}

    /* Clean scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(140, 140, 140, 0.25);
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(140, 140, 140, 0.45);
    }
    
    /* Adaptive Canvas Backgrounds */
    body {
      transition: background-color 0.2s ease, color 0.2s ease;
    }
    
    /* Default / Neutral Dark */
    body[data-canvas-bg="dark"],
    body:not([data-canvas-bg]) {
      background-color: #ffffff;
      color: #09090b;
    }
    .dark body[data-canvas-bg="dark"],
    .dark body:not([data-canvas-bg]) {
      background-color: #09090b;
      color: #fafafa;
    }

    /* Dot Grid */
    body[data-canvas-bg="grid"],
    .canvas-grid-light {
      background-color: #fafafa;
      background-image: radial-gradient(circle, rgba(0, 0, 0, 0.12) 1px, transparent 1px);
      background-size: 20px 20px;
      color: #09090b;
    }
    .dark body[data-canvas-bg="grid"],
    .canvas-grid-dark {
      background-color: #09090b;
      background-image: radial-gradient(circle, rgba(255, 255, 255, 0.13) 1px, transparent 1px);
      background-size: 20px 20px;
      color: #fafafa;
    }

    /* Ambient Mesh */
    body[data-canvas-bg="mesh"],
    .canvas-mesh-light {
      background-color: #fafafa;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.12) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(236, 72, 153, 0.08) 0px, transparent 50%);
      color: #09090b;
    }
    .dark body[data-canvas-bg="mesh"],
    .canvas-mesh {
      background-color: #09090b;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.2) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.2) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(236, 72, 153, 0.12) 0px, transparent 50%);
      color: #fafafa;
    }

    /* Solid Light */
    body[data-canvas-bg="light"] {
      background-color: #f4f4f5;
      color: #09090b;
    }
    .dark body[data-canvas-bg="light"] {
      background-color: #18181b;
      color: #fafafa;
    }

    /* Pure Black */
    body[data-canvas-bg="black"] {
      background-color: #f4f4f5;
      color: #09090b;
    }
    .dark body[data-canvas-bg="black"] {
      background-color: #000000;
      color: #ffffff;
    }

    ${safeCssCode}
  </style>

  <!-- Import Map -->
  <script type="importmap">
    ${JSON.stringify({ imports: importsMap }, null, 2)}
  </script>
</head>
<body data-canvas-bg="${safeCanvasBg}" class="select-none antialiased min-h-full">
  <div id="root" class="min-h-full w-full flex flex-col"></div>

  <!-- Early Global Error & Lifecycle Handler -->
  <script>
    function notifyParent(data) {
      try {
        window.parent.postMessage(data, "*");
      } catch (e) {}
    }

    function escapeHtmlText(str) {
      return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    notifyParent({
      type: "SANDBOX_STAGE",
      stage: "hydrating-deps",
      packages: ${JSON.stringify(detectedDeps)}
    });

    function renderErrorOverlay(title, msg) {
      console.error("[Runtime Error]:", msg);
      const rootEl = document.getElementById("root");
      if (rootEl) {
        rootEl.innerHTML = \`
          <div style="padding: 20px; max-width: 550px; font-family: ui-monospace, monospace; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; color: #fca5a5; font-size: 12px; line-height: 1.6; margin: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <div style="font-weight: 700; color: #f87171; margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span>
              <span>\${escapeHtmlText(title)}</span>
            </div>
            <div style="white-space: pre-wrap; word-break: break-word;">\${escapeHtmlText(msg)}</div>
          </div>
        \`;
      }
      notifyParent({ type: "RUNTIME_ERROR", message: msg });
    }

    window.addEventListener("error", function(e) {
      const errMsg = e.error ? (e.error.stack || e.error.message) : e.message;
      renderErrorOverlay("Runtime JavaScript Error", errMsg);
    });

    window.addEventListener("unhandledrejection", function(e) {
      const reason = e.reason ? (e.reason.stack || e.reason.message || String(e.reason)) : "Unknown rejection";
      renderErrorOverlay("Unhandled Promise Rejection", String(reason));
    });
  </script>

  <!-- Runtime Execution Script -->
  <script type="module">
    import React from "react";
    import ReactDOM from "react-dom/client";

    function notifyParent(data) {
      try {
        window.parent.postMessage(data, "*");
      } catch (e) {}
    }

    function serializeArg(arg) {
      if (arg === null) return "null";
      if (arg === undefined) return "undefined";
      if (arg instanceof Error) return arg.stack || arg.message;
      if (typeof arg === "function") return arg.toString();
      if (typeof arg === "object") {
        const seen = new WeakSet();
        try {
          return JSON.stringify(arg, (key, value) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) return "[Circular]";
              seen.add(value);
            }
            if (typeof value === "function") return "[Function]";
            return value;
          }, 2);
        } catch (e) {
          return Object.prototype.toString.call(arg);
        }
      }
      return String(arg);
    }

    function sendConsoleLog(level, args) {
      try {
        const message = args.map(serializeArg).join(" ");
        notifyParent({
          type: "SANDBOX_CONSOLE",
          level: level,
          message: message,
        });
      } catch (e) {}
    }

    const _origLog = console.log;
    const _origWarn = console.warn;
    const _origError = console.error;
    const _origInfo = console.info;

    console.log = function(...args) {
      _origLog.apply(console, args);
      sendConsoleLog("log", args);
    };
    console.warn = function(...args) {
      _origWarn.apply(console, args);
      sendConsoleLog("warn", args);
    };
    console.error = function(...args) {
      _origError.apply(console, args);
      sendConsoleLog("error", args);
    };
    console.info = function(...args) {
      _origInfo.apply(console, args);
      sendConsoleLog("info", args);
    };

    function escapeModuleHtmlText(str) {
      return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderErrorOverlay(title, msg) {
      _origError("[Runtime Error]:", msg);
      const rootEl = document.getElementById("root");
      if (rootEl) {
        rootEl.innerHTML = \`
          <div style="padding: 20px; max-width: 550px; font-family: ui-monospace, monospace; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; color: #fca5a5; font-size: 12px; line-height: 1.6; margin: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <div style="font-weight: 700; color: #f87171; margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span>
              <span>\${escapeModuleHtmlText(title)}</span>
            </div>
            <div style="white-space: pre-wrap; word-break: break-word;">\${escapeModuleHtmlText(msg)}</div>
          </div>
        \`;
      }
      notifyParent({ type: "RUNTIME_ERROR", message: msg });
    }

    window.addEventListener("error", (e) => {
      const errMsg = e.error ? (e.error.stack || e.error.message) : e.message;
      sendConsoleLog("error", [errMsg]);
    });

    window.addEventListener("unhandledrejection", (e) => {
      const reason = e.reason ? (e.reason.stack || e.reason.message || String(e.reason)) : "Unknown rejection";
      sendConsoleLog("error", [String(reason)]);
    });

    // Error boundary for React tree
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
        notifyParent({ type: "RUNTIME_ERROR", message: error.message });
      }
      render() {
        if (this.state.hasError) {
          if (this.props.fallback) {
            return this.props.fallback(this.state.error);
          }
          return React.createElement(
            "div",
            { style: { padding: 20, color: "#f87171", fontFamily: "monospace", fontSize: 12 } },
            "Component Render Error: " + (this.state.error ? this.state.error.message : "Unknown error")
          );
        }
        return this.props.children;
      }
    }

    async function bootstrap() {
      try {
        notifyParent({
          type: "SANDBOX_STAGE",
          stage: "mounting",
          packages: ${JSON.stringify(detectedDeps)}
        });

        const createdBlobUrls = [];
        window.addEventListener("beforeunload", () => {
          for (const url of createdBlobUrls) {
            try { URL.revokeObjectURL(url); } catch (e) {}
          }
        });

        // 1. Import component.tsx module (try import map bare specifier first, then relative, fallback to blob)
        let componentModule;
        try {
          componentModule = await import("@component");
        } catch (compErr1) {
          try {
            componentModule = await import("./component");
          } catch (compErr2) {
            try {
              const componentCode = ${safeCompJs};
              const componentBlob = new Blob([componentCode], { type: "text/javascript" });
              const componentUrl = URL.createObjectURL(componentBlob);
              createdBlobUrls.push(componentUrl);
              componentModule = await import(componentUrl);
            } catch (blobErr) {
              renderErrorOverlay("Failed to import component.tsx", blobErr.message);
              return;
            }
          }
        }

        // Find primary component from component.tsx
        const ComponentFromCode =
          componentModule.default ||
          componentModule.Component ||
          Object.values(componentModule).find((v) => typeof v === "function") ||
          null;

        // 2. Prepare and import demo.tsx module directly via import map bare specifier or data URI
        const rawDemoCode = ${safeDemoJs};
        let DemoComponent = null;

        if (rawDemoCode && rawDemoCode.trim().length > 0) {
          try {
            let demoModule;
            try {
              demoModule = await import("@demo");
            } catch (demoErr1) {
              try {
                demoModule = await import(${safeDemoDataUri});
              } catch (demoErr2) {
                const demoBlob = new Blob([rawDemoCode], { type: "text/javascript" });
                const demoUrl = URL.createObjectURL(demoBlob);
                createdBlobUrls.push(demoUrl);
                demoModule = await import(demoUrl);
              }
            }
            DemoComponent =
              demoModule.default ||
              demoModule.Demo ||
              Object.values(demoModule).find((v) => typeof v === "function") ||
              null;
          } catch (demoErr) {
            console.warn("demo.tsx failed to load, falling back to component.tsx:", demoErr);
          }
        }

        // 3. Determine what component to render
        const rootEl = document.getElementById("root");
        if (!rootEl) return;
        const root = ReactDOM.createRoot(rootEl);

        const initialDemoProps = ${initialDemoPropsJson};
        let activeDemoProps = initialDemoProps && typeof initialDemoProps === "object" ? { ...initialDemoProps } : {};
        const demoPropsListeners = new Set();

        window.__STUDIO_SET_DEMO_PROPS__ = (nextProps) => {
          activeDemoProps = nextProps && typeof nextProps === "object" ? { ...nextProps } : {};
          demoPropsListeners.forEach((fn) => fn(activeDemoProps));
        };

        window.__STUDIO_RESET_DEMO_PROPS__ = () => {
          activeDemoProps = {};
          demoPropsListeners.forEach((fn) => fn(activeDemoProps));
        };

        function App() {
          const [demoProps, setDemoProps] = React.useState(activeDemoProps);

          React.useEffect(() => {
            const listener = (next) => setDemoProps(next);
            demoPropsListeners.add(listener);
            window.__STUDIO_COMPONENT_MOUNTED__ = true;
            window.dispatchEvent(new CustomEvent("__STUDIO_COMPONENT_MOUNTED__"));
            notifyParent({ type: "RENDER_SUCCESS" });
            return () => {
              demoPropsListeners.delete(listener);
            };
          }, []);

          const renderFallbackComponent = (err) => {
            if (!ComponentFromCode) {
              return React.createElement(
                "div",
                { style: { padding: 24, textAlign: "center", color: "#a1a1aa", fontSize: 13, fontFamily: "monospace" } },
                "No export found in component.tsx. Export default or named function component."
              );
            }
            return React.createElement(
              ErrorBoundary,
              null,
              React.createElement(
                "div",
                { className: "min-h-full w-full flex flex-col items-center justify-center p-6" },
                React.createElement(ComponentFromCode, demoProps)
              )
            );
          };

          if (!DemoComponent) {
            return renderFallbackComponent();
          }

          return React.createElement(
            ErrorBoundary,
            { fallback: renderFallbackComponent },
            React.createElement(DemoComponent, demoProps)
          );
        }

        root.render(React.createElement(App));
        notifyParent({ type: "RENDER_SUCCESS" });
      } catch (err) {
        renderErrorOverlay("Bootstrap Error", err.message);
      }
    }

    bootstrap();

    // Stitch Simulated Interaction, Theme, and Interactive Command REPL Handler
    let simulationTimer = null;
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent) return;
      if (event.data && event.data.type === "TRIGGER_SIMULATED_HOVER") {
        runSimulatedHover(event.data.durationMs || 4000);
      }
      if (event.data && event.data.type === "SET_DEMO_PROPS") {
        if (typeof window.__STUDIO_SET_DEMO_PROPS__ === "function") {
          window.__STUDIO_SET_DEMO_PROPS__(event.data.props || {});
        }
      }
      if (event.data && event.data.type === "RESET_DEMO_PROPS") {
        if (typeof window.__STUDIO_RESET_DEMO_PROPS__ === "function") {
          window.__STUDIO_RESET_DEMO_PROPS__();
        }
      }
      if (event.data && event.data.type === "SET_FIT_MODE") {
        const mode = event.data.fitMode || "normal";
        document.documentElement.setAttribute("data-fit-mode", mode);
      }
      if (event.data && event.data.type === "SET_PREVIEW_THEME") {
        const theme = event.data.theme;
        const html = document.documentElement;
        if (theme === "dark") {
          html.classList.add("dark");
        } else {
          html.classList.remove("dark");
        }
      }
      if (event.data && event.data.type === "SET_CANVAS_BG") {
        const bg = event.data.canvasBg || "dark";
        document.body.setAttribute("data-canvas-bg", bg);
      }
      if (event.data && event.data.type === "EVAL_COMMAND") {
        const { code, id } = event.data;
        try {
          // Evaluate in global context
          const evalResult = (0, eval)(code);
          notifyParent({
            type: "COMMAND_RESULT",
            id: id,
            success: true,
            result: serializeArg(evalResult),
          });
        } catch (err) {
          notifyParent({
            type: "COMMAND_RESULT",
            id: id,
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      if (event.data && event.data.type === "CAPTURE_PREVIEW") {
        captureLivePreview(event.data.componentId);
      }
    });

    function renderDomFallbackToPng(root, width, height, baseBgColor) {
      try {
        const canvas = document.createElement("canvas");
        const maxOutW = 1200;
        const scale = width > maxOutW ? maxOutW / width : 1;
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.save();
        ctx.scale(scale, scale);
        ctx.fillStyle = baseBgColor || "#09090b";
        ctx.fillRect(0, 0, width, height);

        function isTransparent(c) {
          return !c || c === "transparent" || c === "rgba(0, 0, 0, 0)" || c === "rgba(0,0,0,0)";
        }

        function roundedRect(c, x, y, w, h, tl, tr, br, bl) {
          const maxR = Math.min(w, h) * 0.5;
          const rTL = Math.max(0, Math.min(maxR, tl || 0));
          const rTR = Math.max(0, Math.min(maxR, tr || 0));
          const rBR = Math.max(0, Math.min(maxR, br || 0));
          const rBL = Math.max(0, Math.min(maxR, bl || 0));
          c.beginPath();
          if (rTL === 0 && rTR === 0 && rBR === 0 && rBL === 0) {
            c.rect(x, y, w, h);
            return;
          }
          c.moveTo(x + rTL, y);
          c.lineTo(x + w - rTR, y);
          if (rTR > 0) c.arcTo(x + w, y, x + w, y + rTR, rTR);
          c.lineTo(x + w, y + h - rBR);
          if (rBR > 0) c.arcTo(x + w, y + h, x + w - rBR, y + h, rBR);
          c.lineTo(x + rBL, y + h);
          if (rBL > 0) c.arcTo(x, y + h, x, y + h - rBL, rBL);
          c.lineTo(x, y + rTL);
          if (rTL > 0) c.arcTo(x, y, x + rTL, y, rTL);
          c.closePath();
        }

        const items = [];
        let order = 0;
        function collect(el, op, z) {
          if (!el || !(el instanceof Element)) return;
          if (el.id === "__video_studio_overlay__") return;
          const tag = el.tagName.toUpperCase();
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "LINK" || tag === "META" || tag === "HEAD" || tag === "DEFS" || tag === "CLIPPATH") return;
          let cs;
          try { cs = window.getComputedStyle(el); } catch (e) { return; }
          if (!cs || cs.display === "none" || cs.visibility === "hidden") return;
          const curOp = parseFloat(cs.opacity || "1") * op;
          if (curOp <= 0.01) return;
          let curZ = z;
          if (cs.position !== "static" && cs.zIndex && cs.zIndex !== "auto") {
            const pz = parseInt(cs.zIndex, 10);
            if (!Number.isNaN(pz)) curZ = pz;
          }
          const r = el.getBoundingClientRect();
          if (r.width >= 0.5 && r.height >= 0.5 && r.bottom >= -4 && r.top <= height + 4 && r.right >= -4 && r.left <= width + 4) {
            items.push({ el, tag, cs, rect: r, opacity: curOp, z: curZ, order: order++ });
          }
          if (tag === "SVG") return;
          for (let i = 0; i < el.children.length; i++) {
            collect(el.children[i], curOp, curZ);
          }
        }
        collect(root, 1, 0);
        items.sort((a, b) => (a.z !== b.z ? a.z - b.z : a.order - b.order));

        const textRange = typeof document.createRange === "function" ? document.createRange() : null;

        for (let i = 0; i < items.length; i++) {
          const { el, tag, cs, rect, opacity } = items[i];
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
          const rTL = parseFloat(cs.borderTopLeftRadius) || 0;
          const rTR = parseFloat(cs.borderTopRightRadius) || 0;
          const rBR = parseFloat(cs.borderBottomRightRadius) || 0;
          const rBL = parseFloat(cs.borderBottomLeftRadius) || 0;

          if (cs.backgroundColor && !isTransparent(cs.backgroundColor)) {
            roundedRect(ctx, rect.left, rect.top, rect.width, rect.height, rTL, rTR, rBR, rBL);
            ctx.fillStyle = cs.backgroundColor;
            ctx.fill();
          }

          const bTop = parseFloat(cs.borderTopWidth) || 0;
          if (bTop > 0 && cs.borderTopStyle !== "none" && !isTransparent(cs.borderTopColor)) {
            roundedRect(ctx, rect.left + bTop * 0.5, rect.top + bTop * 0.5, Math.max(0, rect.width - bTop), Math.max(0, rect.height - bTop), rTL, rTR, rBR, rBL);
            ctx.strokeStyle = cs.borderTopColor;
            ctx.lineWidth = bTop;
            ctx.stroke();
          }

          if (tag === "CANVAS" && el.width > 0 && el.height > 0) {
            try {
              ctx.save();
              if (rTL > 0 || rTR > 0 || rBR > 0 || rBL > 0) {
                roundedRect(ctx, rect.left, rect.top, rect.width, rect.height, rTL, rTR, rBR, rBL);
                ctx.clip();
              }
              ctx.drawImage(el, rect.left, rect.top, rect.width, rect.height);
              ctx.restore();
            } catch (e) {}
          } else if (tag === "IMG" && el.complete && el.naturalWidth > 0) {
            try {
              ctx.save();
              if (rTL > 0 || rTR > 0 || rBR > 0 || rBL > 0) {
                roundedRect(ctx, rect.left, rect.top, rect.width, rect.height, rTL, rTR, rBR, rBL);
                ctx.clip();
              }
              ctx.drawImage(el, rect.left, rect.top, rect.width, rect.height);
              ctx.restore();
            } catch (e) {}
          }

          if (textRange && el.childNodes && el.childNodes.length > 0) {
            const fontSizePx = parseFloat(cs.fontSize) || 14;
            ctx.font = (cs.fontStyle || "normal") + " " + (cs.fontWeight || "400") + " " + (cs.fontSize || "14px") + " " + (cs.fontFamily || "sans-serif");
            ctx.fillStyle = cs.color || "#fafafa";
            ctx.textBaseline = "alphabetic";
            for (let c = 0; c < el.childNodes.length; c++) {
              const node = el.childNodes[c];
              if (!node || node.nodeType !== 3) continue;
              let str = (node.nodeValue || "").replace(/\\s+/g, " ").trim();
              if (!str) continue;
              if (cs.textTransform === "uppercase") str = str.toUpperCase();
              else if (cs.textTransform === "lowercase") str = str.toLowerCase();
              try {
                textRange.selectNodeContents(node);
                const rects = textRange.getClientRects();
                if (rects && rects.length > 0) {
                  const r0 = rects[0];
                  if (r0.width >= 1 && r0.height >= 1) {
                    ctx.fillText(str, r0.left, r0.top + (r0.height + fontSizePx * 0.72) * 0.5);
                  }
                }
              } catch (e) {}
            }
          }
          ctx.restore();
        }
        ctx.restore();
        return canvas.toDataURL("image/png");
      } catch (e) {
        return null;
      }
    }

    async function captureLivePreview(componentId) {
      try {
        const root = document.getElementById("root");
        if (!root) {
          notifyParent({
            type: "PREVIEW_CAPTURED",
            dataUrl: null,
            error: "Root element not found",
            componentId: componentId,
          });
          return;
        }
        const rootText = root.textContent || "";
        if (
          rootText.includes("Runtime JavaScript Error") ||
          rootText.includes("Component Render Error") ||
          rootText.includes("Bootstrap Error")
        ) {
          notifyParent({
            type: "PREVIEW_CAPTURED",
            dataUrl: null,
            error: "Skipped preview capture because an error overlay is displayed",
            componentId: componentId,
          });
          return;
        }

        // Wait for web fonts & one animation frame so 2D/WebGL canvases and Framer Motion settle
        if (document.fonts && document.fonts.ready) {
          try {
            await Promise.race([
              document.fonts.ready,
              new Promise((r) => setTimeout(r, 120)),
            ]);
          } catch (e) {}
        }
        await new Promise((r) => requestAnimationFrame(() => r()));

        // 1. Snapshot any live <canvas> inside #root (and composite into clonedRoot rather than discarding DOM layout)
        const innerCanvas = root.querySelector("canvas");
        let fallbackSingleCanvasUrl = null;
        if (innerCanvas) {
          try {
            const dataUrl = innerCanvas.toDataURL("image/png");
            if (dataUrl && dataUrl.startsWith("data:image/png")) {
              fallbackSingleCanvasUrl = dataUrl;
            }
          } catch (canvasErr) {
            // Canvas export failed or tainted, continue to SVG fallback
          }
        }

        // 2. Capture the full #root DOM + embedded <canvas> + <svg> layout using SVG <foreignObject>
        const rect = root.getBoundingClientRect();
        const vw = window.innerWidth || Math.ceil(rect.width) || 800;
        const vh = window.innerHeight || Math.ceil(rect.height) || 600;
        const width = Math.max(Math.ceil(rect.width) || vw || 800, 320);
        const rawHeight = Math.max(Math.ceil(rect.height) || 0, vh || 0) || 600;
        // Clamp height to a crisp thumbnail frame (max ~4:3 / 0.85 aspect) so tall scrolling demos never capture as thin slivers
        const height = Math.max(Math.min(rawHeight, Math.round(width * 0.85)), 240);

        let stylesText = "";
        const styleElements = document.querySelectorAll("style");
        for (const el of styleElements) {
          if (el.id === "__video_studio_styles__" || el.id === "__video_studio_hover_mirror__") continue;
          if (el.innerHTML) {
            stylesText += el.innerHTML + "\\n";
          } else if (el.sheet && el.sheet.cssRules) {
            try {
              for (let r = 0; r < el.sheet.cssRules.length; r++) {
                stylesText += el.sheet.cssRules[r].cssText + "\\n";
              }
            } catch (e) {}
          }
        }
        // Sanitize styles so external @import / url(http...) never block or taint <foreignObject> rasterization
        // Also alias :root / html / body selectors to .__capture_root__ so Tailwind v4 CSS variables resolve inside <foreignObject>
        stylesText = stylesText
          .replace(/\\]\\]>/g, "")
          .replace(/@import\\s+[^;]+;/gi, "")
          .replace(/@charset\\s+[^;]+;/gi, "")
          .replace(/url\\(\\s*['"]?(?!data:|#)[^'")]+['"]?\\s*\\)/gi, "none")
          .replace(/:root\\b/g, ":root, .__capture_root__");
        stylesText += "\\n*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }\\n";

        const clonedRoot = root.cloneNode(true);

        // Remove elements that are invalid or slow inside static SVG <foreignObject>
        const removable = clonedRoot.querySelectorAll(
          "script, style, link, iframe, object, embed, video, audio, source, track, feTurbulence"
        );
        for (let i = 0; i < removable.length; i++) {
          removable[i].remove();
        }

        // Composite all live <canvas> bitmaps directly into clonedRoot as <img> elements
        const liveCanvases = root.querySelectorAll("canvas");
        const clonedCanvases = clonedRoot.querySelectorAll("canvas");
        for (let i = 0; i < liveCanvases.length && i < clonedCanvases.length; i++) {
          const liveC = liveCanvases[i];
          const cloneC = clonedCanvases[i];
          if (liveC && liveC.width > 0 && liveC.height > 0) {
            try {
              const cDataUrl = liveC.toDataURL("image/png");
              if (cDataUrl && cDataUrl.startsWith("data:image/png")) {
                const imgRep = document.createElement("img");
                imgRep.setAttribute("src", cDataUrl);
                if (liveC.className) {
                  imgRep.setAttribute("class", liveC.className);
                }
                const cRect = liveC.getBoundingClientRect();
                const prevStyle = liveC.getAttribute("style") || "";
                imgRep.setAttribute(
                  "style",
                  prevStyle +
                    (prevStyle && !prevStyle.endsWith(";") ? ";" : "") +
                    (cRect.width > 0 ? "width:" + Math.round(cRect.width) + "px;" : "") +
                    (cRect.height > 0 ? "height:" + Math.round(cRect.height) + "px;" : "")
                );
                cloneC.replaceWith(imgRep);
              }
            } catch (e) {}
          }
        }

        // Inline any non-data: <img> elements so <foreignObject> never taints or shows broken images
        const liveImgs = root.querySelectorAll("img");
        const clonedImgs = clonedRoot.querySelectorAll("img");
        let scratchCanvas = null;
        let scratchCtx = null;
        for (let i = 0; i < clonedImgs.length; i++) {
          const cloneImg = clonedImgs[i];
          const src = cloneImg.getAttribute("src") || "";
          cloneImg.removeAttribute("crossorigin");
          cloneImg.removeAttribute("loading");
          cloneImg.removeAttribute("decoding");
          cloneImg.removeAttribute("srcset");
          if (src && src.startsWith("data:")) continue;

          let inlinedUrl = null;
          // Find matching live <img> by src attribute
          for (let j = 0; j < liveImgs.length; j++) {
            const lImg = liveImgs[j];
            if ((lImg.getAttribute("src") || "") === src && lImg.complete && lImg.naturalWidth > 0) {
              try {
                if (!scratchCanvas) {
                  scratchCanvas = document.createElement("canvas");
                  scratchCtx = scratchCanvas.getContext("2d");
                }
                if (scratchCtx) {
                  const iw = Math.min(640, Math.max(16, lImg.naturalWidth));
                  const ih = Math.min(640, Math.max(16, lImg.naturalHeight));
                  scratchCanvas.width = iw;
                  scratchCanvas.height = ih;
                  scratchCtx.clearRect(0, 0, iw, ih);
                  scratchCtx.drawImage(lImg, 0, 0, iw, ih);
                  inlinedUrl = scratchCanvas.toDataURL("image/png");
                }
              } catch (e) {
                scratchCanvas = null;
                scratchCtx = null;
              }
              break;
            }
          }
          if (inlinedUrl && inlinedUrl.startsWith("data:image/")) {
            cloneImg.setAttribute("src", inlinedUrl);
          } else {
            cloneImg.setAttribute(
              "src",
              "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%2327272a' fill-opacity='0.35'/%3E%3C/svg%3E"
            );
          }
        }

        // Sync live computed grid/flex layout, SVG dimensions, and Framer Motion / CSS animation states
        const validXmlAttrRe = /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/;
        const liveQueue = [root];
        const cloneQueue = [clonedRoot];
        let visited = 0;
        while (liveQueue.length > 0 && visited < 650) {
          const liveEl = liveQueue.shift();
          const cloneEl = cloneQueue.shift();
          if (!liveEl || !cloneEl || !(liveEl instanceof Element) || !(cloneEl instanceof Element)) continue;
          visited++;

          if (cloneEl.attributes) {
            for (let a = cloneEl.attributes.length - 1; a >= 0; a--) {
              const attr = cloneEl.attributes[a];
              if (!attr) continue;
              const name = attr.name || "";
              const lower = name.toLowerCase();
              if (!validXmlAttrRe.test(name) || lower.startsWith("on")) {
                try { cloneEl.removeAttribute(name); } catch (e) {}
              } else if (lower === "style" && attr.value && attr.value.indexOf("url(") !== -1) {
                try {
                  cloneEl.setAttribute(
                    "style",
                    attr.value.replace(/url\\(\\s*['"]?(?!data:|#)[^'")]+['"]?\\s*\\)/gi, "none")
                  );
                } catch (e) {}
              }
            }
          }

          let cs = null;
          try { cs = window.getComputedStyle(liveEl); } catch (e) {}
          if (cs) {
            if (cs.display === "none") {
              cloneEl.style.display = "none";
              continue;
            }
            const tag = liveEl.tagName.toUpperCase();
            if (tag === "SVG") {
              const svgRect = liveEl.getBoundingClientRect();
              const sw = Math.round(svgRect.width || parseFloat(cs.width) || 0);
              const sh = Math.round(svgRect.height || parseFloat(cs.height) || 0);
              if (sw > 0 && sh > 0) {
                if (!cloneEl.getAttribute("width")) cloneEl.setAttribute("width", String(sw));
                if (!cloneEl.getAttribute("height")) cloneEl.setAttribute("height", String(sh));
              }
            }
            if (cs.display === "grid" || cs.display === "inline-grid") {
              cloneEl.style.display = cs.display;
              if (cs.gridTemplateColumns && cs.gridTemplateColumns !== "none") {
                cloneEl.style.gridTemplateColumns = cs.gridTemplateColumns;
              }
              if (cs.gap && cs.gap !== "normal") {
                cloneEl.style.gap = cs.gap;
              }
            }
            const hasAnim =
              (cs.animationName && cs.animationName !== "none") ||
              (typeof liveEl.getAnimations === "function" && liveEl.getAnimations().length > 0);
            if (hasAnim) {
              if (cs.transform && cs.transform !== "none") cloneEl.style.transform = cs.transform;
              if (cs.opacity) cloneEl.style.opacity = cs.opacity;
              if (cs.filter && cs.filter !== "none") cloneEl.style.filter = cs.filter;
              cloneEl.style.animation = "none";
            }
          }

          const lChildren = liveEl.children;
          const cChildren = cloneEl.children;
          const count = Math.min(lChildren.length, cChildren.length);
          for (let i = 0; i < count; i++) {
            liveQueue.push(lChildren[i]);
            cloneQueue.push(cChildren[i]);
          }
        }

        const rawSerialized = new XMLSerializer().serializeToString(clonedRoot);
        const serializedHtml = String(rawSerialized || "")
          .replace(/&nbsp;/g, "&#160;")
          .replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]/g, "");

        const isDark = document.documentElement.classList.contains("dark");
        const bodyCs = window.getComputedStyle(document.body);
        const stageBgColor =
          bodyCs.backgroundColor &&
          bodyCs.backgroundColor !== "rgba(0, 0, 0, 0)" &&
          bodyCs.backgroundColor !== "transparent"
            ? bodyCs.backgroundColor
            : isDark
            ? "#09090b"
            : "#ffffff";
        const stageTextColor = bodyCs.color || (isDark ? "#fafafa" : "#09090b");

        const wrapperClasses = (document.documentElement.className + " " + document.body.className)
          .replace(/__vs_hide_native_cursor__/g, "")
          .replace(/["<>]/g, "")
          .trim();
        const bodyStyles = document.body.style.cssText ? document.body.style.cssText + ";" : "";
        const centerAlignStyle =
          rect.height > 0 && rect.height < height
            ? "display:flex;flex-direction:column;justify-content:center;"
            : "";

        const svgString =
          '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">' +
          '<foreignObject width="100%" height="100%">' +
          '<div xmlns="http://www.w3.org/1999/xhtml" class="__capture_root__ ' + wrapperClasses + '" style="width:100%;height:100%;overflow:hidden;background-color:' + stageBgColor + ';color:' + stageTextColor + ';' + centerAlignStyle + bodyStyles + '">' +
          '<style>/* <![CDATA[ */\\n' + stylesText + '\\n/* ]]> */</style>' +
          serializedHtml +
          '</div>' +
          '</foreignObject>' +
          '</svg>';

        const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

        function isCanvasBlank(canvas) {
          try {
            const c = canvas.getContext("2d", { willReadFrequently: true });
            if (!c || canvas.width < 4 || canvas.height < 4) return true;
            const sw = Math.min(48, canvas.width);
            const sh = Math.min(36, canvas.height);
            const probe = document.createElement("canvas");
            probe.width = sw;
            probe.height = sh;
            const pCtx = probe.getContext("2d", { willReadFrequently: true });
            if (!pCtx) return false;
            pCtx.drawImage(canvas, 0, 0, sw, sh);
            const data = pCtx.getImageData(0, 0, sw, sh).data;
            const r0 = data[0], g0 = data[1], b0 = data[2];
            let maxDelta = 0;
            for (let i = 4; i < data.length; i += 4) {
              const d = Math.abs(data[i] - r0) + Math.abs(data[i + 1] - g0) + Math.abs(data[i + 2] - b0);
              if (d > maxDelta) maxDelta = d;
              if (maxDelta > 18) return false;
            }
            return true;
          } catch (e) {
            return false;
          }
        }

        // 3. Attempt offscreen Image -> Canvas conversion for clean PNG
        const convertToPng = new Promise((resolve) => {
          const img = new Image();
          const timer = setTimeout(() => {
            img.onload = null;
            img.onerror = null;
            resolve(null);
          }, 1500);

          img.onload = () => {
            clearTimeout(timer);
            try {
              const offCanvas = document.createElement("canvas");
              const maxOutW = 1200;
              const scale = width > maxOutW ? maxOutW / width : 1;
              offCanvas.width = Math.round(width * scale);
              offCanvas.height = Math.round(height * scale);
              const ctx = offCanvas.getContext("2d");
              if (!ctx) {
                resolve(null);
                return;
              }
              ctx.fillStyle = stageBgColor;
              ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
              ctx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);
              if (isCanvasBlank(offCanvas)) {
                resolve(null);
                return;
              }
              const pngDataUrl = offCanvas.toDataURL("image/png");
              resolve(pngDataUrl);
            } catch (e) {
              resolve(null);
            }
          };

          img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
          };

          img.src = svgDataUrl;
        });

        let pngResult = await convertToPng;
        if (!pngResult) {
          pngResult = renderDomFallbackToPng(root, width, height, stageBgColor);
        }
        const finalDataUrl = pngResult || fallbackSingleCanvasUrl || null;

        notifyParent({
          type: "PREVIEW_CAPTURED",
          dataUrl: finalDataUrl,
          componentId: componentId,
        });
      } catch (err) {
        console.warn("Failed to capture preview snapshot:", err);
        notifyParent({
          type: "PREVIEW_CAPTURED",
          dataUrl: null,
          error: err instanceof Error ? err.message : String(err),
          componentId: componentId,
        });
      }
    }

    function runSimulatedHover(totalDuration) {
      if (simulationTimer) clearInterval(simulationTimer);
      const root = document.getElementById("root");
      if (!root) return;

      const target = root.firstElementChild || root;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let elapsed = 0;
      const interval = 25;

      simulationTimer = setInterval(() => {
        elapsed += interval;
        const progress = Math.min(1, elapsed / (totalDuration * 0.85));
        const angle = progress * Math.PI * 4;
        const currentX = centerX + Math.cos(angle) * (rect.width * 0.35);
        const currentY = centerY + Math.sin(angle * 2) * (rect.height * 0.25);

        const elemUnder = document.elementFromPoint(currentX, currentY) || target;

        elemUnder.dispatchEvent(new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          clientX: currentX,
          clientY: currentY,
        }));

        if (Math.abs(progress - 0.5) < 0.02) {
          elemUnder.dispatchEvent(new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX: currentX,
            clientY: currentY,
          }));
        }

        if (elapsed >= totalDuration) {
          clearInterval(simulationTimer);
        }
      }, interval);
    }
  </script>
  ${isVideoStudio ? `<script>${buildVideoStudioRuntimeScript()}</script>` : ""}
</body>
</html>`;

  return { html, error: null, detectedDependencies: detectedDeps };
}

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Creates visual error preview instead of a blank white/dark screen
 */
function generateErrorHtml(
  title: string,
  message: string,
  canvasBg: string,
  previewTheme: "dark" | "light" = "dark"
): string {
  const isDark = previewTheme === "dark";
  const bgClass = isDark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900";
  const cardBorder = isDark ? "border-red-500/30 bg-red-500/10" : "border-red-400/40 bg-red-50/90";
  const titleColor = isDark ? "text-red-400" : "text-red-600";
  const descColor = isDark ? "text-red-300" : "text-red-700";
  const hintColor = isDark ? "text-zinc-500 border-red-500/20" : "text-zinc-600 border-red-200";
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  return `<!DOCTYPE html>
<html lang="en" class="h-full ${isDark ? "dark" : ""}">
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="h-full ${bgClass} flex items-center justify-center p-6 font-mono select-none">
  <div class="max-w-md w-full rounded-2xl border ${cardBorder} p-5 shadow-2xl backdrop-blur-md">
    <div class="flex items-center gap-2 ${titleColor} font-semibold text-sm mb-2">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <span>${safeTitle}</span>
    </div>
    <p class="text-xs ${descColor} leading-relaxed whitespace-pre-wrap break-all">${safeMessage}</p>
    <div class="mt-4 pt-3 border-t ${hintColor} text-[11px] font-sans">
      Fix the syntax in your editor panel to restore live preview.
    </div>
  </div>
</body>
</html>`;
}
