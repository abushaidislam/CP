"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Check, RotateCcw, Sparkles } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type WorkflowTheme = "auto" | "light" | "dark";
export type TechToolId =
  | "pulse-chat"
  | "relay-mail"
  | "vector-studio"
  | "motion-canvas"
  | "sprint-up"
  | "orbit-tasks";

export type WorkflowNodeId =
  | "client"
  | "task"
  | "notes"
  | "subtasks"
  | "subtask1"
  | "rolesPill"
  | "pm"
  | "ux";

export interface ProjectWorkflowTreeProps {
  clientName?: string;
  onboardedDate?: string;
  taskTitle?: string;
  notesUpdated?: string;
  notesPreview?: string;
  subtaskTitle?: string;
  animateFlow?: boolean;
  interactive?: boolean;
  showGrid?: boolean;
  theme?: WorkflowTheme;
  onNodeSelect?: (nodeId: WorkflowNodeId | null) => void;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

interface NodeSize {
  w: number;
  h: number;
}

const DESIGN_W = 780;
const DESIGN_H = 600;

const NODE_SIZES: Record<WorkflowNodeId, NodeSize> = {
  client: { w: 296, h: 56 },
  task: { w: 254, h: 122 },
  notes: { w: 258, h: 56 },
  subtasks: { w: 256, h: 86 },
  subtask1: { w: 250, h: 114 },
  rolesPill: { w: 124, h: 32 },
  pm: { w: 252, h: 112 },
  ux: { w: 252, h: 112 },
};

const INITIAL_OFFSETS: Record<WorkflowNodeId, Point> = {
  client: { x: 212, y: 18 },
  task: { x: 233, y: 108 },
  notes: { x: 518, y: 141 },
  subtasks: { x: 32, y: 306 },
  subtask1: { x: 46, y: 374 },
  rolesPill: { x: 506, y: 292 },
  pm: { x: 442, y: 344 },
  ux: { x: 442, y: 476 },
};

const INITIAL_Z: Record<WorkflowNodeId, number> = {
  client: 12,
  task: 14,
  notes: 13,
  subtasks: 16,
  subtask1: 18,
  rolesPill: 11,
  pm: 15,
  ux: 14,
};

const TOOL_META: Record<TechToolId, { label: string; bg: string }> = {
  "pulse-chat": { label: "Pulse Chat", bg: "#3F0E40" },
  "relay-mail": { label: "Relay Mail", bg: "#FFFFFF" },
  "vector-studio": { label: "Vector Studio", bg: "#18181B" },
  "motion-canvas": { label: "Motion Canvas", bg: "#0088FF" },
  "sprint-up": { label: "Sprint Board", bg: "#FFFFFF" },
  "orbit-tasks": { label: "Orbit Tasks", bg: "#F46B6B" },
};

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function buildVerticalCurve(x1: number, y1: number, x2: number, y2: number) {
  const dy = Math.max(24, Math.abs(y2 - y1) * 0.55);
  return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
}

function buildHorizontalCurve(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(24, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function buildElbowPath(x1: number, y1: number, x2: number, y2: number) {
  const midY = y1 + clamp((y2 - y1) * 0.48, 18, 56);
  const dx = x2 - x1;
  if (Math.abs(dx) < 6) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  const r = clamp(
    Math.min(Math.abs(dx) / 2, Math.abs(midY - y1), Math.abs(y2 - midY)),
    4,
    14
  );
  const dir = dx > 0 ? 1 : -1;
  const down1 = midY >= y1 ? 1 : -1;
  const down2 = y2 >= midY ? 1 : -1;
  return [
    `M ${x1} ${y1}`,
    `L ${x1} ${midY - r * down1}`,
    `Q ${x1} ${midY} ${x1 + r * dir} ${midY}`,
    `L ${x2 - r * dir} ${midY}`,
    `Q ${x2} ${midY} ${x2} ${midY + r * down2}`,
    `L ${x2} ${y2}`,
  ].join(" ");
}

function buildDashedBranch(x1: number, y1: number, x2: number, y2: number) {
  const c1x = x1 - (x1 - x2) * 0.14;
  const c1y = y1 + Math.max(36, (y2 - y1) * 0.55);
  const c2x = x2 + (x1 - x2) * 0.08;
  const c2y = y2 - Math.max(46, (y2 - y1) * 0.62);
  const angle = Math.atan2(y2 - c2y, x2 - c2x);
  const arrowLen = 6.5;
  const leftX = x2 - arrowLen * Math.cos(angle - Math.PI / 5.5);
  const leftY = y2 - arrowLen * Math.sin(angle - Math.PI / 5.5);
  const rightX = x2 - arrowLen * Math.cos(angle + Math.PI / 5.5);
  const rightY = y2 - arrowLen * Math.sin(angle + Math.PI / 5.5);
  return {
    path: `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`,
    arrow: `M ${leftX.toFixed(1)} ${leftY.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${rightX.toFixed(1)} ${rightY.toFixed(1)}`,
  };
}

function TechIcon({
  tool,
  interactive,
  isDark,
  isLight,
}: {
  tool: TechToolId;
  interactive: boolean;
  isDark: boolean;
  isLight: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const meta = TOOL_META[tool];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        role="img"
        aria-label={meta.label}
        tabIndex={interactive ? 0 : -1}
        onFocus={() => interactive && setHovered(true)}
        onBlur={() => setHovered(false)}
        className={cn(
          "relative flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-[7px] transition-transform duration-150",
          interactive &&
            "cursor-pointer hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
          tool === "relay-mail" || tool === "sprint-up"
            ? isDark
              ? "bg-zinc-800 ring-1 ring-white/10 shadow-sm"
              : isLight
                ? "bg-white ring-1 ring-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                : "bg-white dark:bg-zinc-800 ring-1 ring-slate-200/90 dark:ring-white/10 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
            : "shadow-[0_1px_3px_rgba(15,23,42,0.16)]"
        )}
        style={
          tool !== "relay-mail" && tool !== "sprint-up"
            ? { backgroundColor: meta.bg }
            : undefined
        }
      >
        {tool === "pulse-chat" && (
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" aria-hidden="true">
            <rect x="4" y="9.5" width="6.5" height="3" rx="1.5" fill="#36C5F0" />
            <circle cx="9" cy="6.2" r="1.7" fill="#36C5F0" />
            <rect x="11.5" y="4" width="3" height="6.5" rx="1.5" fill="#2EB67D" />
            <circle cx="17.8" cy="9" r="1.7" fill="#2EB67D" />
            <rect x="13.5" y="11.5" width="6.5" height="3" rx="1.5" fill="#ECB22E" />
            <circle cx="15" cy="17.8" r="1.7" fill="#ECB22E" />
            <rect x="9.5" y="13.5" width="3" height="6.5" rx="1.5" fill="#E01E5A" />
            <circle cx="6.2" cy="15" r="1.7" fill="#E01E5A" />
          </svg>
        )}
        {tool === "relay-mail" && (
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" aria-hidden="true">
            <path
              d="M4 7.5V17a1.5 1.5 0 0 0 1.5 1.5H7V11l5 3.6 5-3.6v7.5h1.5A1.5 1.5 0 0 0 20 17V7.5"
              stroke="#EA4335"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 7.5a1.5 1.5 0 0 1 2.4-1.2L12 10.5l5.6-4.2A1.5 1.5 0 0 1 20 7.5"
              stroke="#4285F4"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M4 11v6a1.5 1.5 0 0 0 1.5 1.5H7V11H4Z" fill="#34A853" />
            <path d="M20 11v6a1.5 1.5 0 0 1-1.5 1.5H17V11h3Z" fill="#FBBC05" />
          </svg>
        )}
        {tool === "vector-studio" && (
          <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" aria-hidden="true">
            <rect x="6" y="4" width="6" height="5.3" rx="2.65" fill="#F24E1E" />
            <rect x="12" y="4" width="6" height="5.3" rx="2.65" fill="#FF7262" />
            <rect x="6" y="9.35" width="6" height="5.3" rx="2.65" fill="#A259FF" />
            <circle cx="15" cy="12" r="2.65" fill="#1ABCFE" />
            <path
              d="M6 17.35A2.65 2.65 0 0 1 8.65 14.7H12v2.65a2.65 2.65 0 0 1-6 0Z"
              fill="#0ACF83"
            />
          </svg>
        )}
        {tool === "motion-canvas" && (
          <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" aria-hidden="true">
            <path d="M6.5 5h11v4.6h-5.5L6.5 5Z" fill="#FFFFFF" />
            <path d="M6.5 9.6h5.5l5.5 4.7h-11V9.6Z" fill="#CFE8FF" />
            <path d="M6.5 14.3H12V19l-5.5-4.7Z" fill="#93C5FD" />
          </svg>
        )}
        {tool === "sprint-up" && (
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" aria-hidden="true">
            <path
              d="M6.5 11.2 12 6.5l5.5 4.7"
              stroke="#F43F5E"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 15.8c1.6 1.7 3.5 2.5 5.5 2.5s3.9-.8 5.5-2.5"
              stroke="#6366F1"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        )}
        {tool === "orbit-tasks" && (
          <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" aria-hidden="true">
            <circle cx="12" cy="7.5" r="2.7" fill="#FFFFFF" />
            <circle cx="7.4" cy="15.5" r="2.7" fill="#FFFFFF" fillOpacity="0.92" />
            <circle cx="16.6" cy="15.5" r="2.7" fill="#FFFFFF" fillOpacity="0.92" />
          </svg>
        )}
      </div>

      <span className="pointer-events-none absolute -top-7 left-1/2 z-50 -translate-x-1/2">
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ opacity: 0, y: 4, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 3, scale: 0.94 }}
              transition={{ duration: 0.14 }}
              className="block whitespace-nowrap rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-medium tracking-[-0.01em] text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900"
            >
              {meta.label}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}

function IllustratedAvatar({
  variant,
  size = "sm",
}: {
  variant: "pm" | "ux" | "dev";
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "h-[42px] w-[42px]" : "h-[21px] w-[21px]";

  if (variant === "pm") {
    return (
      <div
        className={cn(
          dim,
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FBF0DA] ring-1 ring-amber-200/70 dark:bg-amber-950/60 dark:ring-amber-700/40"
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
          <circle cx="20" cy="17.5" r="7.2" fill="#F2C29B" />
          <path
            d="M13.2 18.2c0 4.6 3 7.6 6.8 7.6s6.8-3 6.8-7.6c-1.4 1.8-3.8 2.4-6.8 2.4s-5.4-.6-6.8-2.4Z"
            fill="#3B2314"
          />
          <path
            d="M16.5 16.2h1.6M21.9 16.2h1.6"
            stroke="#2D1A10"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M18.6 19.8c.8.6 2 .6 2.8 0"
            stroke="#F8D9C0"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path d="M10 37c1.6-6 5.2-9 10-9s8.4 3 10 9" fill="#5B4636" />
        </svg>
      </div>
    );
  }

  if (variant === "ux") {
    return (
      <div
        className={cn(
          dim,
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEE9FB] ring-1 ring-violet-200/70 dark:bg-violet-950/60 dark:ring-violet-700/40"
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
          <path
            d="M12.5 16.5c0-5 3.3-8.5 7.5-8.5s7.5 3.5 7.5 8.5v2.5h-15v-2.5Z"
            fill="#3F3D56"
          />
          <circle cx="20" cy="18.2" r="6.8" fill="#F3C9A8" />
          <path
            d="M13 15.6c2.2-2.6 5.4-3.8 10.2-3.4 2 .2 3.2 1.2 4 2.8-2.6-.7-5.6-1-8.2-.8-2.2.2-4.2.7-6 1.4Z"
            fill="#2C2A3E"
          />
          <circle cx="17.5" cy="18.2" r="1.5" stroke="#2C2A3E" strokeWidth="1.1" />
          <circle cx="22.5" cy="18.2" r="1.5" stroke="#2C2A3E" strokeWidth="1.1" />
          <path d="M19 18.2h2" stroke="#2C2A3E" strokeWidth="1.1" />
          <path d="M10.5 37c1.5-5.8 4.8-8.8 9.5-8.8s8 3 9.5 8.8" fill="#8B7EC8" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        dim,
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FBE9E7] ring-1 ring-rose-200/70 dark:bg-rose-950/60 dark:ring-rose-700/40"
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
        <circle cx="20" cy="18" r="6.8" fill="#E8B490" />
        <path
          d="M13 15c1-4.2 3.5-6.5 7-6.5s6 2.3 7 6.5c-2.5-1.5-4.8-2-7-2s-4.5.5-7 2Z"
          fill="#1F2937"
        />
        <path
          d="M17.2 17.5h1.4M21.4 17.5h1.4"
          stroke="#1F2937"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M10.5 37c1.5-5.8 4.8-8.6 9.5-8.6s8 2.8 9.5 8.6" fill="#374151" />
      </svg>
    </div>
  );
}

function TechStackBadge({
  isDark,
  isLight,
}: {
  isDark: boolean;
  isLight: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[25px] shrink-0 items-center rounded-[7px] px-2.5 text-[10.5px] font-semibold tracking-[-0.01em]",
        isDark
          ? "bg-amber-500/12 text-amber-300 ring-1 ring-amber-400/20"
          : isLight
            ? "bg-[#FEF7DF] text-[#C4921E] ring-1 ring-amber-200/50"
            : "bg-[#FEF7DF] text-[#C4921E] ring-1 ring-amber-200/50 dark:bg-amber-500/12 dark:text-amber-300 dark:ring-amber-400/20"
      )}
    >
      Tech-Stack
    </span>
  );
}

const ProjectWorkflowTree = React.forwardRef<HTMLDivElement, ProjectWorkflowTreeProps>(
  (
    {
      clientName = "Nuvora",
      onboardedDate = "25 Jun",
      taskTitle = "Web Design",
      notesUpdated = "Today",
      notesPreview = "Prioritize minimal hero hierarchy & mobile checkout flow.",
      subtaskTitle = "Create Wireframe",
      animateFlow = true,
      interactive = true,
      showGrid = true,
      theme = "auto",
      onNodeSelect,
      className,
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const shouldReduceMotion = useReducedMotion();
    const motionEnabled = animateFlow && !shouldReduceMotion;

    const canvasRef = useRef<HTMLDivElement | null>(null);
    const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
      w: DESIGN_W,
      h: DESIGN_H,
    });

    const [nodeDeltas, setNodeDeltas] = useState<Record<WorkflowNodeId, Point>>({
      client: { x: 0, y: 0 },
      task: { x: 0, y: 0 },
      notes: { x: 0, y: 0 },
      subtasks: { x: 0, y: 0 },
      subtask1: { x: 0, y: 0 },
      rolesPill: { x: 0, y: 0 },
      pm: { x: 0, y: 0 },
      ux: { x: 0, y: 0 },
    });
    const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
    const [zOrders, setZOrders] = useState<Record<WorkflowNodeId, number>>(INITIAL_Z);
    const [draggingId, setDraggingId] = useState<WorkflowNodeId | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [activeNode, setActiveNode] = useState<WorkflowNodeId | null>(null);
    const [wireframeDone, setWireframeDone] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);

    const topZRef = useRef(24);
    const dragMetaRef = useRef<{
      id: WorkflowNodeId;
      startX: number;
      startY: number;
      originDx: number;
      originDy: number;
      moved: boolean;
    } | null>(null);
    const panMetaRef = useRef<{
      startX: number;
      startY: number;
      originPanX: number;
      originPanY: number;
      moved: boolean;
    } | null>(null);

    useEffect(() => {
      const el = canvasRef.current;
      if (!el) return;
      const updateSize = () => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setCanvasSize({ w: rect.width, h: rect.height });
        }
      };
      updateSize();
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(updateSize);
        ro.observe(el);
        return () => ro.disconnect();
      }
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }, []);

    const isDark = theme === "dark";
    const isLight = theme === "light";

    const originX = Math.max(12, Math.round((canvasSize.w - DESIGN_W) / 2)) + panOffset.x;
    const originY = Math.max(16, Math.round((canvasSize.h - DESIGN_H) / 2)) + panOffset.y;

    const getPos = (id: WorkflowNodeId): Point => ({
      x: originX + INITIAL_OFFSETS[id].x + nodeDeltas[id].x,
      y: originY + INITIAL_OFFSETS[id].y + nodeDeltas[id].y,
    });

    const positions: Record<WorkflowNodeId, Point> = {
      client: getPos("client"),
      task: getPos("task"),
      notes: getPos("notes"),
      subtasks: getPos("subtasks"),
      subtask1: getPos("subtask1"),
      rolesPill: getPos("rolesPill"),
      pm: getPos("pm"),
      ux: getPos("ux"),
    };

    const bringToFront = useCallback((nodeId: WorkflowNodeId) => {
      topZRef.current += 1;
      const nextZ = topZRef.current;
      setZOrders((prev) => ({ ...prev, [nodeId]: nextZ }));
    }, []);

    const toggleSelect = useCallback(
      (nodeId: WorkflowNodeId) => {
        if (!interactive) return;
        bringToFront(nodeId);
        setActiveNode((prev) => {
          const next = prev === nodeId ? null : nodeId;
          onNodeSelect?.(next);
          return next;
        });
      },
      [interactive, bringToFront, onNodeSelect]
    );

    const handleNodePointerDown = useCallback(
      (nodeId: WorkflowNodeId, e: React.PointerEvent<HTMLDivElement>) => {
        if (!interactive) return;
        if ((e.target as HTMLElement).closest("button[data-no-drag='true']")) {
          return;
        }
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        bringToFront(nodeId);
        setDraggingId(nodeId);
        dragMetaRef.current = {
          id: nodeId,
          startX: e.clientX,
          startY: e.clientY,
          originDx: nodeDeltas[nodeId].x,
          originDy: nodeDeltas[nodeId].y,
          moved: false,
        };
      },
      [interactive, bringToFront, nodeDeltas]
    );

    const handleNodePointerMove = useCallback(
      (nodeId: WorkflowNodeId, e: React.PointerEvent<HTMLDivElement>) => {
        const meta = dragMetaRef.current;
        if (!meta || meta.id !== nodeId) return;
        const dx = e.clientX - meta.startX;
        const dy = e.clientY - meta.startY;
        if (!meta.moved && Math.hypot(dx, dy) > 4) {
          meta.moved = true;
          setHasMoved(true);
        }
        if (meta.moved) {
          const size = NODE_SIZES[nodeId];
          const baseX = originX + INITIAL_OFFSETS[nodeId].x;
          const baseY = originY + INITIAL_OFFSETS[nodeId].y;
          const nextAbsX = clamp(
            baseX + meta.originDx + dx,
            8,
            Math.max(8, canvasSize.w - size.w - 8)
          );
          const nextAbsY = clamp(
            baseY + meta.originDy + dy,
            8,
            Math.max(8, canvasSize.h - size.h - 8)
          );
          setNodeDeltas((prev) => ({
            ...prev,
            [nodeId]: {
              x: nextAbsX - baseX,
              y: nextAbsY - baseY,
            },
          }));
        }
      },
      [originX, originY, canvasSize.w, canvasSize.h]
    );

    const handleNodePointerUp = useCallback(
      (nodeId: WorkflowNodeId, e: React.PointerEvent<HTMLDivElement>) => {
        const meta = dragMetaRef.current;
        if (!meta || meta.id !== nodeId) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        const wasDragged = meta.moved;
        dragMetaRef.current = null;
        setDraggingId(null);
        if (!wasDragged) {
          toggleSelect(nodeId);
        }
      },
      [toggleSelect]
    );

    const handleCanvasPointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!interactive) return;
        if (e.target !== e.currentTarget) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsPanning(true);
        panMetaRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          originPanX: panOffset.x,
          originPanY: panOffset.y,
          moved: false,
        };
      },
      [interactive, panOffset]
    );

    const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      const meta = panMetaRef.current;
      if (!meta) return;
      const dx = e.clientX - meta.startX;
      const dy = e.clientY - meta.startY;
      if (!meta.moved && Math.hypot(dx, dy) > 4) {
        meta.moved = true;
        setHasMoved(true);
      }
      if (meta.moved) {
        setPanOffset({
          x: clamp(meta.originPanX + dx, -360, 360),
          y: clamp(meta.originPanY + dy, -220, 220),
        });
      }
    }, []);

    const handleCanvasPointerUp = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const meta = panMetaRef.current;
        if (!meta) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        const wasPanned = meta.moved;
        panMetaRef.current = null;
        setIsPanning(false);
        if (!wasPanned && activeNode !== null) {
          setActiveNode(null);
          onNodeSelect?.(null);
        }
      },
      [activeNode, onNodeSelect]
    );

    const handleResetLayout = useCallback(() => {
      setNodeDeltas({
        client: { x: 0, y: 0 },
        task: { x: 0, y: 0 },
        notes: { x: 0, y: 0 },
        subtasks: { x: 0, y: 0 },
        subtask1: { x: 0, y: 0 },
        rolesPill: { x: 0, y: 0 },
        pm: { x: 0, y: 0 },
        ux: { x: 0, y: 0 },
      });
      setPanOffset({ x: 0, y: 0 });
      setZOrders(INITIAL_Z);
      setHasMoved(false);
      setActiveNode(null);
      onNodeSelect?.(null);
    }, [onNodeSelect]);

    const surfaceClass = isDark
      ? "bg-zinc-900/95 border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.4),0_12px_28px_-6px_rgba(0,0,0,0.55)]"
      : isLight
        ? "bg-white border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_28px_-6px_rgba(15,23,42,0.08)]"
        : "bg-white dark:bg-zinc-900/95 border-slate-200/80 dark:border-white/[0.08] shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_28px_-6px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.55)]";

    const draggingClass = isDark
      ? "shadow-[0_20px_44px_-8px_rgba(0,0,0,0.75)] ring-2 ring-sky-400/70"
      : isLight
        ? "shadow-[0_20px_44px_-8px_rgba(15,23,42,0.16)] ring-2 ring-sky-400/60"
        : "shadow-[0_20px_44px_-8px_rgba(15,23,42,0.16)] dark:shadow-[0_20px_44px_-8px_rgba(0,0,0,0.75)] ring-2 ring-sky-400/60";

    const titleClass = isDark
      ? "text-zinc-50"
      : isLight
        ? "text-zinc-900"
        : "text-zinc-900 dark:text-zinc-50";

    const mutedClass = isDark
      ? "text-zinc-400"
      : isLight
        ? "text-slate-400"
        : "text-slate-400 dark:text-zinc-400";

    const subtleMutedClass = isDark
      ? "text-zinc-500"
      : isLight
        ? "text-slate-400/85"
        : "text-slate-400/85 dark:text-zinc-500";

    const activeRingClass = isDark
      ? "ring-2 ring-sky-400/75 border-sky-400/50"
      : isLight
        ? "ring-2 ring-sky-400/65 border-sky-300"
        : "ring-2 ring-sky-400/65 border-sky-300 dark:border-sky-400/50";

    const portFillClass = isDark
      ? "fill-zinc-900"
      : isLight
        ? "fill-white"
        : "fill-white dark:fill-zinc-900";

    const springTransition = shouldReduceMotion
      ? { duration: 0.01 }
      : { type: "spring" as const, stiffness: 380, damping: 30, mass: 0.85 };

    const isPathActive = (targets: WorkflowNodeId[]) =>
      (activeNode !== null && targets.includes(activeNode)) ||
      (draggingId !== null && targets.includes(draggingId));

    const clientPort = {
      x: positions.client.x + NODE_SIZES.client.w / 2,
      y: positions.client.y + NODE_SIZES.client.h,
    };
    const taskTop = {
      x: positions.task.x + NODE_SIZES.task.w / 2,
      y: positions.task.y,
    };
    const taskRight = {
      x: positions.task.x + NODE_SIZES.task.w,
      y: positions.task.y + NODE_SIZES.task.h / 2,
    };
    const notesLeft = {
      x: positions.notes.x,
      y: positions.notes.y + NODE_SIZES.notes.h / 2,
    };
    const taskBottom = {
      x: positions.task.x + NODE_SIZES.task.w / 2,
      y: positions.task.y + NODE_SIZES.task.h,
    };
    const subtasksTop = {
      x: positions.subtasks.x + NODE_SIZES.subtasks.w * 0.54,
      y: positions.subtasks.y + 4,
    };
    const subtasksBottom = {
      x: positions.subtasks.x + NODE_SIZES.subtasks.w / 2,
      y: positions.subtasks.y + NODE_SIZES.subtasks.h,
    };
    const subtask1Top = {
      x: positions.subtask1.x + NODE_SIZES.subtask1.w / 2,
      y: positions.subtask1.y,
    };
    const rolesPillTop = {
      x: positions.rolesPill.x + NODE_SIZES.rolesPill.w / 2,
      y: positions.rolesPill.y,
    };
    const rolesPillBottom = {
      x: positions.rolesPill.x + NODE_SIZES.rolesPill.w / 2,
      y: positions.rolesPill.y + NODE_SIZES.rolesPill.h,
    };
    const pmTop = {
      x: positions.pm.x + NODE_SIZES.pm.w / 2,
      y: positions.pm.y,
    };
    const pmBottom = {
      x: positions.pm.x + NODE_SIZES.pm.w / 2,
      y: positions.pm.y + NODE_SIZES.pm.h,
    };
    const uxTop = {
      x: positions.ux.x + NODE_SIZES.ux.w / 2,
      y: positions.ux.y,
    };

    const clientToTaskPath = buildVerticalCurve(clientPort.x, clientPort.y, taskTop.x, taskTop.y);
    const taskToNotesPath = buildHorizontalCurve(taskRight.x, taskRight.y, notesLeft.x, notesLeft.y);
    const dashedBranch = buildDashedBranch(taskBottom.x, taskBottom.y + 3, subtasksTop.x, subtasksTop.y - 6);
    const subtasksToSubtask1Path = buildVerticalCurve(
      subtasksBottom.x,
      subtasksBottom.y,
      subtask1Top.x,
      subtask1Top.y
    );
    const taskToRolesPath = buildElbowPath(taskBottom.x, taskBottom.y + 3, rolesPillTop.x, rolesPillTop.y);
    const rolesToPmPath = buildVerticalCurve(rolesPillBottom.x, rolesPillBottom.y, pmTop.x, pmTop.y);
    const pmToUxPath = buildVerticalCurve(pmBottom.x, pmBottom.y, uxTop.x, uxTop.y);

    const subtaskMoved = Math.hypot(nodeDeltas.subtasks.x, nodeDeltas.subtasks.y) > 10;
    const subtask1Moved = Math.hypot(nodeDeltas.subtask1.x, nodeDeltas.subtask1.y) > 10;
    const subtasksSeparated =
      subtask1Top.y > subtasksBottom.y - 6 ||
      Math.abs(subtask1Top.x - subtasksBottom.x) > 36 ||
      subtaskMoved ||
      subtask1Moved;

    return (
      <div
        ref={ref}
        role="region"
        aria-label={`Interactive project workflow canvas for ${clientName} ${taskTitle}`}
        className={cn(
          "relative h-full min-h-[640px] w-full select-none overflow-hidden antialiased",
          className
        )}
        style={{
          fontFamily:
            "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {showGrid && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0",
              isDark
                ? "opacity-35"
                : isLight
                  ? "opacity-75"
                  : "opacity-75 dark:opacity-35"
            )}
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(148, 163, 184, 0.30) 1.25px, transparent 1.25px)",
              backgroundSize: "20px 20px",
              backgroundPosition: `${panOffset.x % 20}px ${panOffset.y % 20}px`,
            }}
          />
        )}

        {/* FULL-VIEWPORT INTERACTIVE DRAG & PAN CANVAS */}
        <div
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          className={cn(
            "relative hidden h-full min-h-[640px] w-full overflow-hidden md:block",
            interactive && (isPanning ? "cursor-grabbing" : "cursor-grab")
          )}
          style={{ touchAction: "none" }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`${uid}-flow`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* 1. Client -> Task */}
            <path
              d={clientToTaskPath}
              stroke={isPathActive(["client", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["client", "task"]) ? "2" : "1.6"}
              strokeLinecap="round"
            />
            <circle
              cx={clientPort.x}
              cy={clientPort.y}
              r="3.8"
              className={portFillClass}
              stroke={isPathActive(["client", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth="1.75"
            />

            {/* 2. Task -> Client Notes */}
            <path
              d={taskToNotesPath}
              stroke={isPathActive(["notes", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["notes", "task"]) ? "2" : "1.6"}
              strokeLinecap="round"
            />
            <circle
              cx={taskRight.x}
              cy={taskRight.y}
              r="3.8"
              className={portFillClass}
              stroke={isPathActive(["notes", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth="1.75"
            />

            {/* 3. Task -> Subtasks dashed curved S-arrow */}
            <motion.path
              d={dashedBranch.path}
              stroke={isPathActive(["subtasks", "subtask1", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["subtasks", "subtask1", "task"]) ? "2" : "1.6"}
              strokeDasharray="4.5 4.5"
              strokeLinecap="round"
              animate={motionEnabled ? { strokeDashoffset: [0, -18] } : undefined}
              transition={
                motionEnabled
                  ? { duration: 1.8, repeat: Infinity, ease: "linear" }
                  : undefined
              }
            />
            <path
              d={dashedBranch.arrow}
              stroke={isPathActive(["subtasks", "subtask1", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["subtasks", "subtask1", "task"]) ? "2" : "1.6"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 3B. Subtasks -> Subtask 1 live connector */}
            {subtasksSeparated && (
              <>
                <path
                  d={subtasksToSubtask1Path}
                  stroke={isPathActive(["subtasks", "subtask1"]) ? "#38BDF8" : "#8CC2F8"}
                  strokeWidth={isPathActive(["subtasks", "subtask1"]) ? "2" : "1.6"}
                  strokeLinecap="round"
                />
                <circle
                  cx={subtasksBottom.x}
                  cy={subtasksBottom.y}
                  r="3.8"
                  className={portFillClass}
                  stroke={isPathActive(["subtasks", "subtask1"]) ? "#38BDF8" : "#8CC2F8"}
                  strokeWidth="1.75"
                />
              </>
            )}

            {/* 4. Task -> Assigned Roles orthogonal branch */}
            <path
              d={taskToRolesPath}
              stroke={isPathActive(["rolesPill", "pm", "ux", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["rolesPill", "pm", "ux", "task"]) ? "2" : "1.6"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {motionEnabled && (
              <motion.path
                d={taskToRolesPath}
                stroke="#38BDF8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="24 260"
                animate={{ strokeDashoffset: [284, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                opacity={0.72}
              />
            )}

            <circle
              cx={taskBottom.x}
              cy={taskBottom.y}
              r="3.8"
              className={portFillClass}
              stroke={
                isPathActive(["subtasks", "subtask1", "rolesPill", "pm", "ux", "task"])
                  ? "#38BDF8"
                  : "#8CC2F8"
              }
              strokeWidth="1.75"
            />

            {/* 5. Assigned Roles -> Project Manager */}
            <path
              d={rolesToPmPath}
              stroke={isPathActive(["rolesPill", "pm", "ux"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["rolesPill", "pm", "ux"]) ? "2" : "1.6"}
              strokeLinecap="round"
            />

            {/* 6. Project Manager -> UX Designer */}
            <path
              d={pmToUxPath}
              stroke={isPathActive(["pm", "ux"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["pm", "ux"]) ? "2" : "1.6"}
              strokeLinecap="round"
            />
            <circle
              cx={pmBottom.x}
              cy={pmBottom.y}
              r="3.8"
              className={portFillClass}
              stroke={isPathActive(["pm", "ux"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth="1.75"
            />
          </svg>

          {/* NODE 1: CLIENT PILL */}
          <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`Client ${clientName}, onboarded ${onboardedDate}`}
            aria-pressed={interactive ? activeNode === "client" : undefined}
            onPointerDown={(e) => handleNodePointerDown("client", e)}
            onPointerMove={(e) => handleNodePointerMove("client", e)}
            onPointerUp={(e) => handleNodePointerUp("client", e)}
            onPointerCancel={(e) => handleNodePointerUp("client", e)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                toggleSelect("client");
              }
            }}
            style={{
              left: positions.client.x,
              top: positions.client.y,
              width: NODE_SIZES.client.w,
              height: NODE_SIZES.client.h,
              zIndex: zOrders.client,
              touchAction: "none",
            }}
            className={cn(
              "absolute flex items-center justify-between rounded-[16px] border px-4 text-left transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              surfaceClass,
              activeNode === "client" && activeRingClass,
              draggingId === "client" && draggingClass,
              interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("text-[13px] font-medium tracking-[-0.01em]", mutedClass)}>
                Client:
              </span>
              <span
                className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-[#6D73F5] to-[#4F46E5] shadow-[0_2px_8px_rgba(79,70,229,0.34)]"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="none">
                  <path
                    d="M13.2 3.5 6.8 13h4.5l-.6 7.5 6.5-9.5h-4.5l.5-7.5Z"
                    fill="#FFFFFF"
                  />
                </svg>
              </span>
              <span className={cn("text-[14.5px] font-semibold tracking-[-0.025em]", titleClass)}>
                {clientName}
              </span>
            </div>
            <span className={cn("tabular-nums whitespace-nowrap text-[11px] font-medium tracking-[-0.01em]", subtleMutedClass)}>
              Onboarded: {onboardedDate}
            </span>
          </div>

          {/* NODE 2: MAIN TASK CARD */}
          <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`Task: ${taskTitle}`}
            aria-pressed={interactive ? activeNode === "task" : undefined}
            onPointerDown={(e) => handleNodePointerDown("task", e)}
            onPointerMove={(e) => handleNodePointerMove("task", e)}
            onPointerUp={(e) => handleNodePointerUp("task", e)}
            onPointerCancel={(e) => handleNodePointerUp("task", e)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                toggleSelect("task");
              }
            }}
            style={{
              left: positions.task.x,
              top: positions.task.y,
              width: NODE_SIZES.task.w,
              height: NODE_SIZES.task.h,
              zIndex: zOrders.task,
              touchAction: "none",
            }}
            className={cn(
              "absolute flex flex-col justify-between rounded-[18px] border px-[18px] py-[15px] text-left transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              surfaceClass,
              activeNode === "task" && activeRingClass,
              draggingId === "task" && draggingClass,
              interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            )}
          >
            <div>
              <h3 className={cn("text-[15px] font-semibold leading-snug tracking-[-0.025em]", titleClass)}>
                Task: {taskTitle}
              </h3>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={cn("text-[11.5px] font-medium tracking-[-0.01em]", mutedClass)}>
                  Assigned to
                </span>
                <div className="flex items-center gap-1">
                  <IllustratedAvatar variant="pm" size="sm" />
                  <IllustratedAvatar variant="ux" size="sm" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <TechStackBadge isDark={isDark} isLight={isLight} />
              <div className="flex items-center gap-1">
                <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="sprint-up" interactive={interactive} isDark={isDark} isLight={isLight} />
              </div>
            </div>
          </div>

          {/* NODE 3: CLIENT NOTES PILL */}
          <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`Client Notes, updated ${notesUpdated}`}
            aria-pressed={interactive ? activeNode === "notes" : undefined}
            onPointerDown={(e) => handleNodePointerDown("notes", e)}
            onPointerMove={(e) => handleNodePointerMove("notes", e)}
            onPointerUp={(e) => handleNodePointerUp("notes", e)}
            onPointerCancel={(e) => handleNodePointerUp("notes", e)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                toggleSelect("notes");
              }
            }}
            style={{
              left: positions.notes.x,
              top: positions.notes.y,
              width: NODE_SIZES.notes.w,
              height: NODE_SIZES.notes.h,
              zIndex: activeNode === "notes" ? 45 : zOrders.notes,
              touchAction: "none",
            }}
            className={cn(
              "absolute flex items-center gap-2.5 rounded-[16px] border px-3.5 text-left transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              surfaceClass,
              activeNode === "notes" && activeRingClass,
              draggingId === "notes" && draggingClass,
              interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            )}
          >
            <span
              className={cn(
                "flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6.5px]",
                isDark
                  ? "bg-zinc-700"
                  : isLight
                    ? "bg-[#C7CCD6]"
                    : "bg-[#C7CCD6] dark:bg-zinc-700"
              )}
              aria-hidden="true"
            >
              <span className="h-[10px] w-[10px] rounded-full border-[2px] border-white" />
            </span>
            <span className={cn("whitespace-nowrap text-[13.5px] font-semibold tracking-[-0.02em]", titleClass)}>
              Client Notes
            </span>
            <span
              className={cn(
                "h-4 w-px shrink-0",
                isDark ? "bg-zinc-800" : isLight ? "bg-slate-200/80" : "bg-slate-200/80 dark:bg-zinc-800"
              )}
              aria-hidden="true"
            />
            <span className={cn("whitespace-nowrap text-[11px] font-medium tracking-[-0.01em]", subtleMutedClass)}>
              Updated: {notesUpdated}
            </span>

            <AnimatePresence>
              {activeNode === "notes" && interactive && draggingId !== "notes" && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={springTransition}
                  className={cn(
                    "pointer-events-none absolute left-0 top-[64px] w-[258px] rounded-xl border p-3 text-[11.5px] leading-relaxed",
                    surfaceClass,
                    mutedClass
                  )}
                >
                  <div className={cn("mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-[-0.01em]", titleClass)}>
                    <Sparkles className="h-3 w-3 text-sky-500" />
                    Latest Brief Note
                  </div>
                  {notesPreview}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* NODE 4A: SUBTASKS LIST CARD */}
          <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label="Subtasks: List Below"
            aria-pressed={interactive ? activeNode === "subtasks" : undefined}
            onPointerDown={(e) => handleNodePointerDown("subtasks", e)}
            onPointerMove={(e) => handleNodePointerMove("subtasks", e)}
            onPointerUp={(e) => handleNodePointerUp("subtasks", e)}
            onPointerCancel={(e) => handleNodePointerUp("subtasks", e)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                toggleSelect("subtasks");
              }
            }}
            style={{
              left: positions.subtasks.x,
              top: positions.subtasks.y,
              width: NODE_SIZES.subtasks.w,
              height: NODE_SIZES.subtasks.h,
              zIndex: zOrders.subtasks,
              touchAction: "none",
              transform: `rotate(${draggingId === "subtasks" ? 1.5 : subtaskMoved ? 0 : 5.2}deg)`,
            }}
            className={cn(
              "absolute flex flex-col justify-center rounded-[18px] border px-[18px] py-[14px] text-left transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              surfaceClass,
              activeNode === "subtasks" && activeRingClass,
              draggingId === "subtasks" && draggingClass,
              interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            )}
          >
            {interactive && !hasMoved && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-3.5 right-6 flex h-7 w-7 items-center justify-center drop-shadow-sm"
              >
                <svg viewBox="0 0 28 28" className="h-[23px] w-[23px]" fill="none">
                  <path
                    d="M9.5 14.5v-5a1.6 1.6 0 0 1 3.2 0v3.2m0-4.4a1.6 1.6 0 0 1 3.2 0v4.4m0-3.5a1.6 1.6 0 0 1 3.2 0v4.2m0-2.4a1.6 1.6 0 0 1 3.1.5v4.3c0 4-2.8 6.8-6.8 6.8h-1.6c-2.8 0-4.6-1.4-6-3.7l-1.9-3.1a1.5 1.5 0 0 1 2.4-1.8l1.2 1.3v-3.2Z"
                    fill="#FFFFFF"
                    stroke="#111827"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}

            <h4 className={cn("text-[14.5px] font-semibold tracking-[-0.025em]", titleClass)}>
              Subtasks: List Below
            </h4>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={cn("text-[11.5px] font-medium tracking-[-0.01em]", mutedClass)}>
                Assigned to
              </span>
              <div className="flex items-center gap-1">
                <IllustratedAvatar variant="pm" size="sm" />
                <IllustratedAvatar variant="ux" size="sm" />
                <IllustratedAvatar variant="dev" size="sm" />
              </div>
            </div>
          </div>

          {/* NODE 4B: SUBTASK 1 CARD */}
          <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`Subtask 1: ${subtaskTitle}`}
            aria-pressed={interactive ? activeNode === "subtask1" : undefined}
            onPointerDown={(e) => handleNodePointerDown("subtask1", e)}
            onPointerMove={(e) => handleNodePointerMove("subtask1", e)}
            onPointerUp={(e) => handleNodePointerUp("subtask1", e)}
            onPointerCancel={(e) => handleNodePointerUp("subtask1", e)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                toggleSelect("subtask1");
              }
            }}
            style={{
              left: positions.subtask1.x,
              top: positions.subtask1.y,
              width: NODE_SIZES.subtask1.w,
              height: NODE_SIZES.subtask1.h,
              zIndex: zOrders.subtask1,
              touchAction: "none",
              transform: `rotate(${draggingId === "subtask1" ? 1.5 : subtask1Moved ? 0 : 6.0}deg)`,
            }}
            className={cn(
              "absolute flex flex-col justify-between rounded-[18px] border px-[17px] py-[14px] text-left transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              surfaceClass,
              activeNode === "subtask1" && activeRingClass,
              draggingId === "subtask1" && draggingClass,
              interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            )}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4
                  className={cn(
                    "tabular-nums text-[14px] font-semibold leading-snug tracking-[-0.025em]",
                    titleClass,
                    wireframeDone && "line-through opacity-55"
                  )}
                >
                  Subtask 1: {subtaskTitle}
                </h4>
                {interactive && (
                  <button
                    type="button"
                    data-no-drag="true"
                    aria-label={wireframeDone ? "Mark subtask incomplete" : "Mark subtask complete"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setWireframeDone((prev) => !prev);
                    }}
                    className={cn(
                      "mt-0.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border transition-colors",
                      wireframeDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isDark
                          ? "border-zinc-700 hover:border-sky-400"
                          : isLight
                            ? "border-slate-300 hover:border-sky-400"
                            : "border-slate-300 dark:border-zinc-700 hover:border-sky-400"
                    )}
                  >
                    {wireframeDone && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </button>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <span className={cn("text-[11px] font-medium tracking-[-0.01em]", mutedClass)}>
                  Assigned to
                </span>
                <IllustratedAvatar variant="ux" size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <TechStackBadge isDark={isDark} isLight={isLight} />
              <div className="flex items-center gap-1">
                <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
              </div>
            </div>
          </div>

          {/* NODE 5: ASSIGNED ROLES PILL */}
          <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label="Assigned Roles"
            onPointerDown={(e) => handleNodePointerDown("rolesPill", e)}
            onPointerMove={(e) => handleNodePointerMove("rolesPill", e)}
            onPointerUp={(e) => handleNodePointerUp("rolesPill", e)}
            onPointerCancel={(e) => handleNodePointerUp("rolesPill", e)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                toggleSelect("rolesPill");
              }
            }}
            style={{
              left: positions.rolesPill.x,
              top: positions.rolesPill.y,
              width: NODE_SIZES.rolesPill.w,
              height: NODE_SIZES.rolesPill.h,
              zIndex: zOrders.rolesPill,
              touchAction: "none",
            }}
            className={cn(
              "absolute flex items-center justify-center rounded-[10px] border px-3 text-[11px] font-medium tracking-[-0.01em] transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              surfaceClass,
              mutedClass,
              activeNode === "rolesPill" && activeRingClass,
              draggingId === "rolesPill" && draggingClass,
              interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            )}
          >
            Assigned Roles
          </div>

          {/* NODE 6: PROJECT MANAGER ROLE CARD */}
          <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label="Project Manager role card"
            aria-pressed={interactive ? activeNode === "pm" : undefined}
            onPointerDown={(e) => handleNodePointerDown("pm", e)}
            onPointerMove={(e) => handleNodePointerMove("pm", e)}
            onPointerUp={(e) => handleNodePointerUp("pm", e)}
            onPointerCancel={(e) => handleNodePointerUp("pm", e)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                toggleSelect("pm");
              }
            }}
            style={{
              left: positions.pm.x,
              top: positions.pm.y,
              width: NODE_SIZES.pm.w,
              height: NODE_SIZES.pm.h,
              zIndex: zOrders.pm,
              touchAction: "none",
            }}
            className={cn(
              "absolute flex flex-col justify-between rounded-[18px] border px-[17px] py-[14px] text-left transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              surfaceClass,
              activeNode === "pm" && activeRingClass,
              draggingId === "pm" && draggingClass,
              interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            )}
          >
            <div className="flex items-center gap-3">
              <IllustratedAvatar variant="pm" size="lg" />
              <div className="min-w-0">
                <h4 className={cn("truncate text-[14.5px] font-semibold leading-tight tracking-[-0.025em]", titleClass)}>
                  Project Manager
                </h4>
                <p className={cn("mt-0.5 truncate text-[11.5px] font-medium tracking-[-0.01em]", mutedClass)}>
                  Managing Project Progress
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <TechStackBadge isDark={isDark} isLight={isLight} />
              <div className="flex items-center gap-1">
                <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="orbit-tasks" interactive={interactive} isDark={isDark} isLight={isLight} />
              </div>
            </div>
          </div>

          {/* NODE 7: UX DESIGNER ROLE CARD */}
          <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label="UX Designer role card"
            aria-pressed={interactive ? activeNode === "ux" : undefined}
            onPointerDown={(e) => handleNodePointerDown("ux", e)}
            onPointerMove={(e) => handleNodePointerMove("ux", e)}
            onPointerUp={(e) => handleNodePointerUp("ux", e)}
            onPointerCancel={(e) => handleNodePointerUp("ux", e)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                toggleSelect("ux");
              }
            }}
            style={{
              left: positions.ux.x,
              top: positions.ux.y,
              width: NODE_SIZES.ux.w,
              height: NODE_SIZES.ux.h,
              zIndex: zOrders.ux,
              touchAction: "none",
            }}
            className={cn(
              "absolute flex flex-col justify-between rounded-[18px] border px-[17px] py-[14px] text-left transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              surfaceClass,
              activeNode === "ux" || draggingId === "ux"
                ? activeRingClass
                : "opacity-92 hover:opacity-100",
              draggingId === "ux" && draggingClass,
              interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            )}
          >
            <div className="flex items-center gap-3">
              <IllustratedAvatar variant="ux" size="lg" />
              <div className="min-w-0">
                <h4 className={cn("truncate text-[14.5px] font-semibold leading-tight tracking-[-0.025em]", titleClass)}>
                  UX Designer
                </h4>
                <p className={cn("mt-0.5 truncate text-[11.5px] font-medium tracking-[-0.01em]", mutedClass)}>
                  Designing UX Elements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <TechStackBadge isDark={isDark} isLight={isLight} />
              <div className="flex items-center gap-1">
                <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
              </div>
            </div>
          </div>

          {/* Subtle Reset Canvas Button */}
          <AnimatePresence>
            {interactive && hasMoved && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.16 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetLayout();
                }}
                aria-label="Reset canvas layout"
                className={cn(
                  "absolute bottom-4 left-4 z-50 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-[-0.01em] backdrop-blur-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  surfaceClass,
                  mutedClass,
                  isDark
                    ? "hover:text-zinc-100"
                    : isLight
                      ? "hover:text-zinc-900"
                      : "hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <RotateCcw className="h-3 w-3" />
                Reset Canvas
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* MOBILE / COMPACT STACKED TREE (< 768px) */}
        <div className="relative flex w-full flex-col items-center gap-3 px-4 py-6 md:hidden">
          <div className={cn("flex w-full max-w-[320px] items-center justify-between rounded-2xl border px-4 py-3", surfaceClass)}>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-medium", mutedClass)}>Client:</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#6D73F5] to-[#4F46E5]">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                  <path d="M13.2 3.5 6.8 13h4.5l-.6 7.5 6.5-9.5h-4.5l.5-7.5Z" fill="#FFFFFF" />
                </svg>
              </span>
              <span className={cn("text-sm font-semibold tracking-[-0.02em]", titleClass)}>{clientName}</span>
            </div>
            <span className={cn("tabular-nums text-[11px] font-medium", mutedClass)}>
              Onboarded: {onboardedDate}
            </span>
          </div>

          <div className="h-5 w-0.5 bg-sky-300/80" aria-hidden="true" />

          <div className={cn("w-full max-w-[320px] rounded-2xl border p-4", surfaceClass)}>
            <h3 className={cn("text-[15px] font-semibold tracking-[-0.02em]", titleClass)}>Task: {taskTitle}</h3>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={cn("text-xs font-medium", mutedClass)}>Assigned to</span>
              <IllustratedAvatar variant="pm" size="sm" />
              <IllustratedAvatar variant="ux" size="sm" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <TechStackBadge isDark={isDark} isLight={isLight} />
              <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="sprint-up" interactive={interactive} isDark={isDark} isLight={isLight} />
            </div>
          </div>

          <div className={cn("flex w-full max-w-[320px] items-center justify-between rounded-2xl border px-4 py-3", surfaceClass)}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-300 dark:bg-zinc-700">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-white" />
              </span>
              <span className={cn("text-sm font-semibold tracking-[-0.02em]", titleClass)}>Client Notes</span>
            </div>
            <span className={cn("text-[11px] font-medium", mutedClass)}>Updated: {notesUpdated}</span>
          </div>

          <div className="h-5 w-0.5 border-l-2 border-dashed border-sky-300/80" aria-hidden="true" />

          <div className={cn("w-full max-w-[320px] rounded-2xl border p-4", surfaceClass)}>
            <h4 className={cn("tabular-nums text-sm font-semibold tracking-[-0.02em]", titleClass)}>
              Subtask 1: {subtaskTitle}
            </h4>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={cn("text-xs font-medium", mutedClass)}>Assigned to</span>
              <IllustratedAvatar variant="ux" size="sm" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <TechStackBadge isDark={isDark} isLight={isLight} />
              <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
            </div>
          </div>

          <div className={cn("rounded-lg border px-3 py-1 text-[11px] font-medium", surfaceClass, mutedClass)}>
            Assigned Roles
          </div>

          <div className="grid w-full max-w-[320px] grid-cols-1 gap-3">
            <div className={cn("rounded-2xl border p-4", surfaceClass)}>
              <div className="flex items-center gap-3">
                <IllustratedAvatar variant="pm" size="lg" />
                <div>
                  <h4 className={cn("text-sm font-semibold tracking-[-0.02em]", titleClass)}>Project Manager</h4>
                  <p className={cn("text-xs font-medium", mutedClass)}>Managing Project Progress</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <TechStackBadge isDark={isDark} isLight={isLight} />
                <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="orbit-tasks" interactive={interactive} isDark={isDark} isLight={isLight} />
              </div>
            </div>

            <div className={cn("rounded-2xl border p-4", surfaceClass)}>
              <div className="flex items-center gap-3">
                <IllustratedAvatar variant="ux" size="lg" />
                <div>
                  <h4 className={cn("text-sm font-semibold tracking-[-0.02em]", titleClass)}>UX Designer</h4>
                  <p className={cn("text-xs font-medium", mutedClass)}>Designing UX Elements</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <TechStackBadge isDark={isDark} isLight={isLight} />
                <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProjectWorkflowTree.displayName = "ProjectWorkflowTree";

export {
  ProjectWorkflowTree,
  ProjectWorkflowTree as component,
  ProjectWorkflowTree as Component,
};
export default ProjectWorkflowTree;
