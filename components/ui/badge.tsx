import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors select-none focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-2xs hover:bg-primary/80",
        secondary:
          "border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border border-transparent bg-destructive text-destructive-foreground shadow-2xs hover:bg-destructive/80",
        outline:
          "border border-border text-foreground",
        eyebrow:
          "rounded-md border border-border bg-muted/60 px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
        blue:
          "border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
        success:
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning:
          "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
