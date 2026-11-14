import React from "react";
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
      className={`relative inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 active:scale-95 transition-transform ${className}`}
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
