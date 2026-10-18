"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Message Row Primitive
interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, align = "start", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-align={align}
        className={cn(
          "flex w-full gap-2.5 items-start",
          align === "end" ? "justify-end" : "justify-start",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Message.displayName = "Message";

const MessageAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("shrink-0 pt-0.5", className)} {...props} />
));
MessageAvatar.displayName = "MessageAvatar";

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
}

const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ className, align = "start", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1 min-w-0",
        align === "end" ? "items-end max-w-[85%]" : "items-start w-full max-w-full",
        className
      )}
      {...props}
    />
  )
);
MessageContent.displayName = "MessageContent";

const MessageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground",
      className
    )}
    {...props}
  />
));
MessageHeader.displayName = "MessageHeader";

const MessageFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-1.5 text-[10px] text-muted-foreground/70 px-1 pt-0.5 font-sans",
      className
    )}
    {...props}
  />
));
MessageFooter.displayName = "MessageFooter";

// Bubble Surface Primitive - Sleek, refined, non-cheap
const bubbleVariants = cva(
  "relative text-xs transition-colors duration-150 leading-relaxed font-sans",
  {
    variants: {
      variant: {
        editorial:
          "w-full bg-transparent text-foreground py-0.5 px-0 border-0 shadow-none",
        user:
          "rounded-xl bg-muted/80 dark:bg-muted/50 text-foreground border border-border/60 px-3.5 py-2 shadow-2xs",
        default:
          "rounded-xl bg-primary text-primary-foreground shadow-2xs font-normal px-3.5 py-2",
        secondary:
          "rounded-xl bg-secondary text-secondary-foreground border border-border/50 px-3.5 py-2",
        muted:
          "rounded-xl bg-muted/60 text-foreground border border-border/40 px-3.5 py-2",
        outline:
          "rounded-xl bg-background text-foreground border border-border/80 px-3.5 py-2.5 shadow-2xs",
        tinted:
          "rounded-xl bg-primary/5 text-foreground border border-primary/20 px-3.5 py-2",
      },
      align: {
        start: "text-left",
        end: "text-left",
      },
    },
    defaultVariants: {
      variant: "editorial",
      align: "start",
    },
  }
);

interface BubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bubbleVariants> {}

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ className, variant, align, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(bubbleVariants({ variant, align, className }))}
        {...props}
      />
    );
  }
);
Bubble.displayName = "Bubble";

const BubbleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("break-words leading-relaxed font-sans", className)}
    {...props}
  />
));
BubbleContent.displayName = "BubbleContent";

// System Marker & Divider
interface MarkerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "separator";
}

const Marker = React.forwardRef<HTMLDivElement, MarkerProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    if (variant === "separator") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex w-full items-center gap-2.5 py-2 text-[10px] font-medium text-muted-foreground/70 select-none",
            className
          )}
          {...props}
        >
          <div className="h-px flex-1 bg-border/50" />
          <span className="font-sans uppercase tracking-wider text-[9px] text-muted-foreground/60">{children}</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-1.5 py-1 text-[11px] text-muted-foreground text-center font-sans",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Marker.displayName = "Marker";

export {
  Trace,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
} from "./trace";

export {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
  Bubble,
  BubbleContent,
  Marker,
};
