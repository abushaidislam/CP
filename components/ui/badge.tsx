import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "eyebrow" | "success" | "blue" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors select-none",
        
        variant === "default" &&
          "border border-transparent bg-primary text-primary-foreground shadow-xs",

        variant === "secondary" &&
          "border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",

        variant === "destructive" &&
          "border border-transparent bg-destructive text-destructive-foreground shadow-xs",

        variant === "outline" &&
          "border border-border text-foreground",

        variant === "eyebrow" &&
          "rounded-md border border-border bg-muted/60 px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground",

        variant === "blue" &&
          "border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",

        variant === "success" &&
          "border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

        variant === "warning" &&
          "border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",

        className
      )}
      {...props}
    />
  );
}
