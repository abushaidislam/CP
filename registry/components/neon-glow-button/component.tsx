"use client";

import React, { useState, MouseEvent } from "react";
import { Zap } from "lucide-react";

export interface NeonGlowButtonProps {
  children?: React.ReactNode;
  variant?: "cyan" | "violet" | "emerald";
  className?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export default function NeonGlowButton({
  children = "Activate Protocol",
  variant = "cyan",
  className = "",
  onClick,
  icon,
}: NeonGlowButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const variantStyles = {
    cyan: {
      border: "border-cyan-500/50 hover:border-cyan-400",
      glow: "shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]",
      bg: "bg-cyan-950/40 hover:bg-cyan-900/50",
      text: "text-cyan-300 group-hover:text-cyan-100",
      indicator: "bg-cyan-400",
    },
    violet: {
      border: "border-violet-500/50 hover:border-violet-400",
      glow: "shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]",
      bg: "bg-violet-950/40 hover:bg-violet-900/50",
      text: "text-violet-300 group-hover:text-violet-100",
      indicator: "bg-violet-400",
    },
    emerald: {
      border: "border-emerald-500/50 hover:border-emerald-400",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]",
      bg: "bg-emerald-950/40 hover:bg-emerald-900/50",
      text: "text-emerald-300 group-hover:text-emerald-100",
      indicator: "bg-emerald-400",
    },
  }[variant];

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleId = Date.now();

    setRipples((prev) => [...prev, { id: rippleId, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        "group relative isolate inline-flex h-12 items-center justify-center gap-2.5 overflow-hidden rounded-xl border px-6 text-sm font-semibold tracking-wide backdrop-blur-xl transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 font-sans " +
        variantStyles.border + " " +
        variantStyles.glow + " " +
        variantStyles.bg + " " +
        variantStyles.text + " " +
        className
      }
    >
      {/* Corner Tech Accents */}
      <span className="absolute left-1.5 top-1.5 h-1 w-1 rounded-full bg-white/40" />
      <span className="absolute right-1.5 bottom-1.5 h-1 w-1 rounded-full bg-white/40" />

      {/* Ripple Animation Spans */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-white/20"
          style={{ left: r.x, top: r.y }}
        />
      ))}

      {/* Button Content */}
      <span className={"h-2 w-2 rounded-full " + variantStyles.indicator + " animate-pulse"} />
      {icon || <Zap className="h-4 w-4" />}
      <span>{children}</span>
    </button>
  );
}
