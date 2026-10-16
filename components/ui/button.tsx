"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "primary-pill"
    | "secondary-pill"
    | "app-primary"
    | "app-ghost"
    | "circular";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",

          // Authentic shadcn variants
          variant === "default" &&
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]",

          variant === "destructive" &&
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm active:scale-[0.98]",

          variant === "outline" &&
            "border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-xs active:scale-[0.98]",

          variant === "secondary" &&
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs active:scale-[0.98]",

          variant === "ghost" &&
            "text-muted-foreground hover:bg-accent hover:text-foreground",

          variant === "link" &&
            "text-primary underline-offset-4 hover:underline",

          // Vercel Aesthetic archetypes
          variant === "primary-pill" &&
            "rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]",

          variant === "secondary-pill" &&
            "rounded-full border border-border bg-background text-foreground hover:bg-accent shadow-xs active:scale-[0.98]",

          variant === "app-primary" &&
            "rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-[0.98]",

          variant === "app-ghost" &&
            "rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground shadow-xs active:scale-[0.98]",

          variant === "circular" &&
            "rounded-full border border-border bg-background text-foreground hover:bg-accent shadow-xs active:scale-[0.98]",

          // Sizes
          size === "default" && "h-8 px-3.5 text-xs [&_svg]:size-3.5",
          size === "sm" && "h-7 px-2.5 text-[11px] gap-1.5 [&_svg]:size-3",
          size === "lg" && "h-9 px-4 text-xs gap-2 [&_svg]:size-4",
          size === "icon" && "size-8 p-0 [&_svg]:size-3.5",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
