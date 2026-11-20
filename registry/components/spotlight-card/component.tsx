import React, { useRef, useState, MouseEvent } from "react";
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
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
        }}
      />

      {/* Subtle border glow gradient */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              250px circle at ${mouseX}px ${mouseY}px,
              rgba(120, 119, 198, 0.25),
              transparent 70%
            )
          `,
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
