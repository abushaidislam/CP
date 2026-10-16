export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  files: {
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  };
  dependencies: string[];
}

export const DEFAULT_TEMPLATES: ComponentTemplate[] = [
  {
    id: "spotlight-card",
    name: "Interactive Spotlight Card",
    description: "A high-performance modern card with dynamic pointer-following radial glow, border gradient, and micro-interactions.",
    category: "Cards",
    dependencies: ["framer-motion", "lucide-react", "clsx", "tailwind-merge"],
    files: {
      "component.tsx": `import React, { useRef, useState, MouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpotlightCardProps {
  /** Title of the card */
  title?: string;
  /** Description or subtitle text */
  description?: string;
  /** Tag or badge label */
  badge?: string;
  /** Color of the mouse spotlight effect */
  spotlightColor?: string;
  /** Custom children elements */
  children?: React.ReactNode;
  /** Extra CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export default function SpotlightCard({
  title = "Next-Gen Component",
  description = "Crafted with precision physics and real-time cursor light emission. Optimized for 60fps interaction.",
  badge = "21st.dev Verified",
  spotlightColor = "rgba(120, 119, 198, 0.2)",
  children,
  className,
  onClick,
}: SpotlightCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "group relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 text-zinc-900 dark:text-zinc-100 shadow-xl transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 cursor-pointer",
        className
      )}
    >
      {/* Dynamic Cursor Spotlight Overlay */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate\`
            radial-gradient(
              450px circle at \${mouseX}px \${mouseY}px,
              \${spotlightColor},
              transparent 80%
            )
          \`,
        }}
      />

      {/* Subtle border glow gradient */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useMotionTemplate\`
            radial-gradient(
              250px circle at \${mouseX}px \${mouseY}px,
              rgba(120, 119, 198, 0.25),
              transparent 70%
            )
          \`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            <span>{badge}</span>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-300 transition-colors">
            {description}
          </p>
        </div>

        {children && <div className="mt-2">{children}</div>}

        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5 font-mono text-zinc-600 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Active Signal
          </span>
          <span className="font-mono text-zinc-500 dark:text-zinc-400">TypeScript TSX</span>
        </div>
      </div>
    </div>
  );
}
`,
      "demo.tsx": `import React, { useState } from "react";
import SpotlightCard from "./component";
import { Code2, Play, Flame } from "lucide-react";

export default function Demo() {
  const [clicked, setClicked] = useState(0);

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 font-sans">
      <div className="w-full flex items-center justify-center">
        <SpotlightCard
          title="Dynamic Radial Spotlight"
          description="Move your cursor across this surface. Notice the subtle glass highlights and dynamic luminosity response."
          badge="Interactive Preview"
          onClick={() => setClicked((c) => c + 1)}
        >
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/70 bg-zinc-100/80 dark:bg-zinc-900/40 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                Trigger Count
              </span>
              <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 font-mono text-zinc-800 dark:text-zinc-200">
                {clicked} clicks
              </span>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
`,
      "index.css": `@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse-subtle {
  animation: pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
`,
    },
  },
  {
    id: "shimmer-button",
    name: "Aurora Shimmer Button",
    description: "High-contrast border shimmer button with glowing conic gradient aura and micro-press physics.",
    category: "Buttons",
    dependencies: ["framer-motion", "lucide-react"],
    files: {
      "component.tsx": `import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export interface ShimmerButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function ShimmerButton({
  children = "Explore 21st.dev",
  className = "",
  onClick,
}: ShimmerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={\`relative inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 active:scale-95 transition-transform \${className}\`}
    >
      {/* Rotating Conic Shimmer */}
      <span className="absolute inset-[-1000%] animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#8b5cf6_50%,#ec4899_100%)]" />

      {/* Button Interior */}
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-950 px-6 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 backdrop-blur-3xl hover:bg-zinc-100 dark:hover:bg-zinc-900/90 transition-colors">
        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        {children}
      </span>
    </button>
  );
}
`,
      "demo.tsx": `import React, { useState } from "react";
import ShimmerButton from "./component";

export default function Demo() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-6 font-sans">
      <ShimmerButton onClick={() => setCount((c) => c + 1)}>
        Launch Component Studio
      </ShimmerButton>
      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
        Triggered {count} times
      </p>
    </div>
  );
}
`,
      "index.css": `@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
`,
    },
  },
  {
    id: "metric-badge",
    name: "Live Status Radar Badge",
    description: "Compact telemetry badge with animated pulsing ping, status tooltip, and gradient border.",
    category: "Badges",
    dependencies: ["lucide-react"],
    files: {
      "component.tsx": `import React from "react";
import { Activity } from "lucide-react";

export interface StatusRadarBadgeProps {
  status?: "online" | "syncing" | "idle";
  label?: string;
  count?: number;
}

export default function StatusRadarBadge({
  status = "online",
  label = "Operational",
  count = 99.98,
}: StatusRadarBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 px-4 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-black/40">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="tracking-wide">{label}</span>
      <span className="h-3 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
      <span className="font-mono text-zinc-500 dark:text-zinc-400">{count}% SLA</span>
    </div>
  );
}
`,
      "demo.tsx": `import React from "react";
import StatusRadarBadge from "./component";

export default function Demo() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-4 font-sans">
      <StatusRadarBadge status="online" label="Preview Stream 60 FPS" count={100} />
      <StatusRadarBadge status="syncing" label="AST Node Analysis" count={99.94} />
    </div>
  );
}
`,
      "index.css": ``,
    },
  },
];
