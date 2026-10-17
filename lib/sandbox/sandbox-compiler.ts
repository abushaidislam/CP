import { transform } from "sucrase";
import { extractCodeImports } from "@/lib/sandbox/package-utils";

export interface CompileResult {
  html: string;
  error: string | null;
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
  previewTheme: "dark" | "light" = "dark"
): CompileResult {
  const isDark = previewTheme === "dark";

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
  const cleanedComponentJs = compTranspiled.js.replace(
    /import\s+['"][^'"]+\.css['"];?/g,
    "/* css imported */"
  );
  const cleanedDemoJs = (demoTranspiled.js || "").replace(
    /import\s+['"][^'"]+\.css['"];?/g,
    "/* css imported */"
  );

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
    "framer-motion/": "https://esm.sh/framer-motion@11.11.17/?deps=react@19",
    motion: "https://esm.sh/framer-motion@11.11.17?deps=react@19",
    "motion/react": "https://esm.sh/framer-motion@11.11.17?deps=react@19",
    "canvas-confetti": "https://esm.sh/canvas-confetti@1.9.4",
    "@/lib/utils": cnModuleDataUri,
    "@/utils": cnModuleDataUri,
    "./utils": cnModuleDataUri,
    "../utils": cnModuleDataUri,
  };

  for (const dep of detectedDeps) {
    if (!importsMap[dep]) {
      importsMap[dep] = buildPackageUrl(dep);
    }
  }

  // Safe JSON serialization of the code strings (protects against backticks, ${}, quotes, and </script>)
  const safeCompJs = JSON.stringify(cleanedComponentJs).replace(/<\/script>/gi, "<\\/script>");
  const safeDemoJs = JSON.stringify(cleanedDemoJs).replace(/<\/script>/gi, "<\\/script>");

  // Base background style inside preview according to canvasBg and previewTheme
  let bgClass = isDark ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900";
  if (canvasBg === "black") {
    bgClass = isDark ? "bg-black text-white" : "bg-zinc-100 text-zinc-900";
  } else if (canvasBg === "light") {
    bgClass = isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900";
  } else if (canvasBg === "grid") {
    bgClass = isDark
      ? "bg-zinc-950 text-zinc-100 canvas-grid-dark"
      : "bg-zinc-50 text-zinc-900 canvas-grid-light";
  } else if (canvasBg === "mesh") {
    bgClass = isDark
      ? "bg-zinc-950 text-zinc-100 canvas-mesh"
      : "bg-zinc-50 text-zinc-900 canvas-mesh-light";
  }

  const html = `<!DOCTYPE html>
<html lang="en" class="h-full ${isDark ? "dark" : ""}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>21st.dev Component Preview</title>
  
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
    
    .canvas-grid-light {
      background-color: #fafafa;
      background-image: radial-gradient(rgba(0, 0, 0, 0.09) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .canvas-grid-dark {
      background-color: #09090b;
      background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .canvas-mesh-light {
      background-color: #fafafa;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.12) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(236, 72, 153, 0.08) 0px, transparent 50%);
    }
    .canvas-mesh {
      background-color: #09090b;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.2) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.2) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(236, 72, 153, 0.12) 0px, transparent 50%);
    }

    ${cssCode}
  </style>

  <!-- Import Map -->
  <script type="importmap">
    ${JSON.stringify({ imports: importsMap }, null, 2)}
  </script>
</head>
<body class="${bgClass} select-none antialiased min-h-full">
  <div id="root" class="min-h-full w-full flex flex-col"></div>

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

    function renderErrorOverlay(title, msg) {
      _origError("[Runtime Error]:", msg);
      const rootEl = document.getElementById("root");
      if (rootEl) {
        rootEl.innerHTML = \`
          <div style="padding: 20px; max-width: 550px; font-family: ui-monospace, monospace; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; color: #fca5a5; font-size: 12px; line-height: 1.6; margin: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <div style="font-weight: 700; color: #f87171; margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span>
              <span>\${title}</span>
            </div>
            <div style="white-space: pre-wrap; word-break: break-word;">\${msg}</div>
          </div>
        \`;
      }
      notifyParent({ type: "RUNTIME_ERROR", message: msg });
    }

    window.addEventListener("error", (e) => {
      const errMsg = e.error ? (e.error.stack || e.error.message) : e.message;
      renderErrorOverlay("Runtime JavaScript Error", errMsg);
      sendConsoleLog("error", [errMsg]);
    });

    window.addEventListener("unhandledrejection", (e) => {
      const reason = e.reason ? (e.reason.stack || e.reason.message || String(e.reason)) : "Unknown rejection";
      renderErrorOverlay("Unhandled Promise Rejection", String(reason));
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
        // 1. Create component Blob Module
        const componentCode = ${safeCompJs};
        const componentBlob = new Blob([componentCode], { type: "text/javascript" });
        const componentUrl = URL.createObjectURL(componentBlob);

        // 2. Import component.tsx module
        let componentModule;
        try {
          componentModule = await import(componentUrl);
        } catch (compErr) {
          renderErrorOverlay("Failed to import component.tsx", compErr.message);
          return;
        }

        // Find primary component from component.tsx
        const ComponentFromCode =
          componentModule.default ||
          componentModule.Component ||
          Object.values(componentModule).find((v) => typeof v === "function") ||
          null;

        // 3. Prepare and import demo.tsx module (redirecting ./component imports to blob url)
        const rawDemoCode = ${safeDemoJs};
        let DemoComponent = null;

        if (rawDemoCode && rawDemoCode.trim().length > 0) {
          try {
            const adjustedDemoCode = rawDemoCode
              .replace(/from\\s+['"](?:\.\\/component(?:\\.tsx)?|@\\/components\\/[^'"]+)['"]/g, 'from "' + componentUrl + '"')
              .replace(/import\\s+['"](?:\.\\/component(?:\\.tsx)?|@\\/components\\/[^'"]+)['"]/g, 'import "' + componentUrl + '"');

            const demoBlob = new Blob([adjustedDemoCode], { type: "text/javascript" });
            const demoUrl = URL.createObjectURL(demoBlob);
            const demoModule = await import(demoUrl);
            DemoComponent =
              demoModule.default ||
              demoModule.Demo ||
              Object.values(demoModule).find((v) => typeof v === "function") ||
              null;
          } catch (demoErr) {
            console.warn("demo.tsx failed to load, falling back to component.tsx:", demoErr);
          }
        }

        // 4. Determine what component to render
        const rootEl = document.getElementById("root");
        if (!rootEl) return;
        const root = ReactDOM.createRoot(rootEl);

        function App() {
          const renderFallbackComponent = (err) => {
            if (!ComponentFromCode) {
              return React.createElement(
                "div",
                { style: { padding: 24, textAlign: "center", color: "#a1a1aa", fontSize: 13, fontFamily: "monospace" } },
                "No export found in component.tsx. Export default or named function component."
              );
            }
            return React.createElement(
              "div",
              { className: "min-h-full w-full flex flex-col items-center justify-center p-6" },
              React.createElement(ComponentFromCode, null)
            );
          };

          if (!DemoComponent) {
            return renderFallbackComponent();
          }

          return React.createElement(
            ErrorBoundary,
            { fallback: renderFallbackComponent },
            React.createElement(DemoComponent, null)
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
      if (event.data && event.data.type === "TRIGGER_SIMULATED_HOVER") {
        runSimulatedHover(event.data.durationMs || 4000);
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
    });

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
</body>
</html>`;

  return { html, error: null };
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
      <span>${title}</span>
    </div>
    <p class="text-xs ${descColor} leading-relaxed whitespace-pre-wrap break-all">${message}</p>
    <div class="mt-4 pt-3 border-t ${hintColor} text-[11px] font-sans">
      Fix the syntax in your editor panel to restore live preview.
    </div>
  </div>
</body>
</html>`;
}
