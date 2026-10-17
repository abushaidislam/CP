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
          "flex w-full gap-2.5",
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
        "flex max-w-[88%] flex-col gap-1",
        align === "end" ? "items-end" : "items-start",
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
      "flex items-center gap-1.5 text-[10px] text-muted-foreground/80 px-1 pt-0.5",
      className
    )}
    {...props}
  />
));
MessageFooter.displayName = "MessageFooter";

// Bubble Surface Primitive
const bubbleVariants = cva(
  "relative rounded-2xl px-3.5 py-2.5 text-xs transition-colors duration-150",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs font-normal",
        secondary:
          "bg-secondary text-secondary-foreground border border-border/40",
        muted:
          "bg-muted/70 text-foreground border border-border/50",
        outline:
          "bg-background text-foreground border border-border shadow-2xs",
        tinted:
          "bg-primary/10 text-foreground border border-primary/20",
      },
      align: {
        start: "rounded-tl-xs",
        end: "rounded-tr-xs",
      },
    },
    defaultVariants: {
      variant: "muted",
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
    className={cn("whitespace-pre-wrap break-words leading-relaxed", className)}
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
            "flex w-full items-center gap-3 py-2 text-[10px] font-medium text-muted-foreground",
            className
          )}
          {...props}
        >
          <div className="h-px flex-1 bg-border/60" />
          <span>{children}</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-1.5 py-1 text-[11px] text-muted-foreground text-center",
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

