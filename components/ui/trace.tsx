"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Trace = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="trace"
      className={cn("flex flex-col gap-1 text-xs font-sans", className)}
      {...props}
    />
  );
});
Trace.displayName = "Trace";

interface TraceLineProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: "running" | "error" | "pending" | "done";
}

const TraceLine = React.forwardRef<HTMLDivElement, TraceLineProps>(
  ({ className, status, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="trace-line"
        data-status={status}
        className={cn(
          "flex w-full items-center gap-2 text-xs font-medium text-foreground",
          status === "running" && "text-primary animate-pulse",
          status === "error" && "text-destructive",
          status === "pending" && "text-muted-foreground",
          status === "done" && "text-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
TraceLine.displayName = "TraceLine";

const TraceIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="trace-icon"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-3.5",
        className
      )}
      {...props}
    />
  );
});
TraceIcon.displayName = "TraceIcon";

const TraceTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="trace-title"
      className={cn("flex-1 truncate text-xs font-medium", className)}
      {...props}
    />
  );
});
TraceTitle.displayName = "TraceTitle";

const TraceDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="trace-description"
      className={cn(
        "inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal",
        className
      )}
      {...props}
    />
  );
});
TraceDescription.displayName = "TraceDescription";

const TraceCollapsible = CollapsiblePrimitive.Root;

const TraceCollapsibleTriggerChevron = React.forwardRef<
  SVGSVGElement,
  React.ComponentPropsWithoutRef<typeof ChevronDown>
>(({ className, ...props }, ref) => (
  <ChevronDown
    ref={ref}
    data-slot="trace-collapsible-trigger-chevron"
    className={cn(
      "size-3 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180",
      className
    )}
    {...props}
  />
));
TraceCollapsibleTriggerChevron.displayName = "TraceCollapsibleTriggerChevron";

const TraceCollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>
>(({ className, children, ...props }, ref) => {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      ref={ref}
      data-slot="trace-collapsible-trigger"
      className={cn(
        "group/trigger flex w-full items-center justify-between gap-2 text-left select-none text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      {...props}
    >
      {children}
      <TraceCollapsibleTriggerChevron />
    </CollapsiblePrimitive.CollapsibleTrigger>
  );
});
TraceCollapsibleTrigger.displayName = "TraceCollapsibleTrigger";

const TraceCollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    data-slot="trace-collapsible-content"
    className={cn(
      "overflow-hidden pt-2 text-xs leading-relaxed data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
      className
    )}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleContent>
));
TraceCollapsibleContent.displayName = "TraceCollapsibleContent";

export {
  Trace,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
};
