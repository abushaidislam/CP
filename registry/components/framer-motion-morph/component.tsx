"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Bell,
  X,
  MessageSquare,
  GitPullRequest,
  Calendar,
  CheckCheck,
  Trash2,
  Sparkles,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NotificationItem {
  id: string;
  app: string;
  title: string;
  message: string;
  time: string;
  icon: React.ReactNode;
  iconBg: string;
  unread?: boolean;
}

export interface IOSNotificationCenterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  notifications?: NotificationItem[];
  title?: string;
  defaultOpen?: boolean;
  /** "fixed" covers the full viewport; "contained" fits inside a parent relative frame (ideal for device mockups) */
  portalMode?: "fixed" | "contained";
  onClearAll?: () => void;
  onNotificationClick?: (item: NotificationItem) => void;
  onDismiss?: (id: string) => void;
}

const defaultNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    app: "Messages",
    title: "Sarah Jenkins",
    message: "Hey! Did you check out the new iOS spatial glassmorphism update?",
    time: "2m ago",
    icon: <MessageSquare className="w-4 h-4 text-white fill-white/20" />,
    iconBg: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    unread: true,
  },
  {
    id: "notif-2",
    app: "GitHub",
    title: "Pull Request #84",
    message: "Merged: dynamic specular highlights and spring physics optimization",
    time: "14m ago",
    icon: <GitPullRequest className="w-4 h-4 text-white" />,
    iconBg: "bg-gradient-to-b from-neutral-700 to-neutral-900",
    unread: true,
  },
  {
    id: "notif-3",
    app: "Calendar",
    title: "Sprint Retrospective",
    message: "Starting in 15 minutes via Apple FaceTime link",
    time: "32m ago",
    icon: <Calendar className="w-4 h-4 text-white" />,
    iconBg: "bg-gradient-to-b from-rose-400 to-rose-600",
    unread: false,
  },
];

const iosMorphSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85,
};

const itemSpring = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.7,
};

export default function IOSNotificationCenter({
  notifications = defaultNotifications,
  title = "Notifications",
  defaultOpen = false,
  portalMode = "fixed",
  onClearAll,
  onNotificationClick,
  onDismiss,
  className,
  ...props
}: IOSNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [items, setItems] = useState<NotificationItem[]>(notifications);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const unreadCount = useMemo(
    () => items.filter((n) => n.unread).length,
    [items]
  );

  const filteredItems = useMemo(
    () => (activeTab === "unread" ? items.filter((n) => n.unread) : items),
    [items, activeTab]
  );

  const handleClearAll = useCallback(() => {
    setItems([]);
    onClearAll?.();
    setTimeout(() => setIsOpen(false), 220);
  }, [onClearAll]);

  const handleMarkAllRead = useCallback(() => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  }, []);

  const handleDismissOne = useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setItems((prev) => prev.filter((item) => item.id !== id));
      onDismiss?.(id);
    },
    [onDismiss]
  );

  const handleItemClick = useCallback(
    (item: NotificationItem) => {
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
      );
      onNotificationClick?.(item);
    },
    [onNotificationClick]
  );

  const handleDragEnd = (
    id: string,
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 90;
    const velocityThreshold = 400;
    if (
      Math.abs(info.offset.x) > swipeThreshold ||
      Math.abs(info.velocity.x) > velocityThreshold
    ) {
      handleDismissOne(id);
    }
  };

  const isContained = portalMode === "contained";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-sans antialiased selection:bg-white/20 select-none",
        !isContained && "relative",
        className
      )}
      {...props}
    >
      {/* Collapsed Pill Trigger */}
      {!isOpen && (
        <motion.button
          layoutId="ios-notification-surface"
          transition={iosMorphSpring}
          onClick={() => setIsOpen(true)}
          className={cn(
            "group relative flex items-center gap-3 px-4 py-2.5 rounded-full",
            "bg-neutral-900/65 dark:bg-black/65 backdrop-blur-2xl backdrop-saturate-150",
            "border border-white/[0.18] shadow-[0_12px_36px_rgba(0,0,0,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.35),inset_0_-1px_0.5px_rgba(255,255,255,0.08)]",
            "hover:bg-neutral-900/75 hover:border-white/25 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          )}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Open Notification Center"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.15] via-white/[0.02] to-transparent pointer-events-none" />

          <div className="relative w-6 h-6 rounded-full bg-gradient-to-b from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-[0_2px_10px_rgba(244,63,94,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
            <Bell className="w-3.5 h-3.5 fill-white/15" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-neutral-900 animate-pulse" />
            )}
          </div>

          <motion.span
            layoutId="ios-notification-title"
            className="text-[13px] font-medium tracking-tight text-white/95"
          >
            {title}
          </motion.span>

          <motion.span
            layoutId="ios-notification-badge"
            className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors",
              unreadCount > 0
                ? "text-white bg-white/20 border-white/25 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)]"
                : "text-white/50 bg-white/[0.06] border-white/10"
            )}
          >
            {unreadCount > 0 ? unreadCount : items.length}
          </motion.span>
        </motion.button>
      )}

      {/* Expanded Spatial Glass Modal */}
      <AnimatePresence>
        {isOpen && (
          <div
            className={cn(
              "z-50 flex items-center justify-center p-3.5 sm:p-4",
              isContained ? "fixed inset-0" : "fixed inset-0"
            )}
            style={isContained ? { position: "fixed" } : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Frosted Ambient Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md"
            />

            {/* Main Notification Center Panel */}
            <motion.div
              layoutId="ios-notification-surface"
              transition={iosMorphSpring}
              className={cn(
                "relative w-full max-w-[400px] rounded-[34px] p-4 sm:p-5 z-10 overflow-hidden text-left",
                "bg-neutral-900/70 dark:bg-neutral-950/75 backdrop-blur-[52px] backdrop-saturate-150",
                "border border-white/[0.18]",
                "shadow-[0_32px_80px_-12px_rgba(0,0,0,0.75),0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.06)]"
              )}
            >
              {/* Ambient Top Glow & Specular Overlay */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-white/[0.08] blur-3xl rounded-full pointer-events-none" />
              <div className="absolute inset-0 rounded-[34px] bg-gradient-to-b from-white/[0.12] via-white/[0.02] to-transparent pointer-events-none" />

              {/* Header Section */}
              <div className="relative flex items-center justify-between pb-3.5 mb-2 border-b border-white/[0.1]">
                <div className="flex items-center gap-2">
                  <motion.span
                    layoutId="ios-notification-title"
                    className="text-[15px] sm:text-[16px] font-semibold tracking-tight text-white drop-shadow-sm"
                  >
                    {title}
                  </motion.span>
                  <motion.span
                    layoutId="ios-notification-badge"
                    className="text-[11px] font-semibold text-white/85 bg-white/15 border border-white/20 px-2 py-0.5 rounded-full shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
                  >
                    {unreadCount > 0 ? `${unreadCount} Unread` : items.length}
                  </motion.span>
                </div>

                <div className="flex items-center gap-1.5">
                  {items.length > 0 && (
                    <div className="flex items-center p-0.5 rounded-full bg-black/30 border border-white/10 text-[11px]">
                      {(["all", "unread"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            "relative px-2.5 py-1 rounded-full font-medium capitalize transition-colors",
                            activeTab === tab
                              ? "text-white"
                              : "text-white/50 hover:text-white/80"
                          )}
                        >
                          {activeTab === tab && (
                            <motion.div
                              layoutId="ios-tab-pill"
                              transition={itemSpring}
                              className="absolute inset-0 rounded-full bg-white/15 border border-white/15 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
                            />
                          )}
                          <span className="relative z-10">{tab}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/75 hover:text-white transition-all border border-white/15 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                    aria-label="Close Notification Center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification Stack List with Negative Margin Breathing Room */}
              <motion.div
                layout
                className="relative -mx-2 px-2 py-1.5 space-y-2.5 max-h-[340px] overflow-y-auto overflow-x-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredItems.length === 0 ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="py-12 flex flex-col items-center justify-center text-center"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-white/40 mb-2.5 shadow-inner">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <p className="text-[13px] font-medium text-white/70">
                        All Caught Up
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {activeTab === "unread"
                          ? "You have no unread notifications"
                          : "No new notifications right now"}
                      </p>
                    </motion.div>
                  ) : (
                    filteredItems.map((item) => (
                      <motion.div
                        layout="position"
                        key={item.id}
                        initial={{ opacity: 0, y: 14, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          scale: 0.92,
                          x: 60,
                          transition: { duration: 0.18 },
                        }}
                        transition={itemSpring}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.65}
                        onDragEnd={(e, info) => handleDragEnd(item.id, e, info)}
                        onClick={() => handleItemClick(item)}
                        whileHover={{ scale: 1.008 }}
                        whileTap={{ scale: 0.985 }}
                        className={cn(
                          "group relative flex items-start gap-3.5 p-3.5 rounded-[22px] cursor-pointer select-none touch-pan-y",
                          "bg-gradient-to-b from-white/[0.11] to-white/[0.05] hover:from-white/[0.15] hover:to-white/[0.08]",
                          "border border-white/[0.15] hover:border-white/[0.26]",
                          "shadow-[0_8px_20px_-4px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.28)]",
                          "transition-colors"
                        )}
                      >
                        {/* App Squircle Icon */}
                        <div
                          className={cn(
                            "relative w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0",
                            "shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.4)]",
                            item.iconBg
                          )}
                        >
                          {item.icon}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10.5px] font-semibold tracking-wider text-white/55 uppercase">
                                {item.app}
                              </span>
                              <AnimatePresence>
                                {item.unread && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]"
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            <span className="text-[10.5px] font-medium text-white/40 shrink-0 group-hover:opacity-0 transition-opacity">
                              {item.time}
                            </span>
                          </div>

                          <h4
                            className={cn(
                              "text-[13.5px] tracking-tight truncate mt-0.5 transition-colors",
                              item.unread
                                ? "font-semibold text-white"
                                : "font-medium text-white/80"
                            )}
                          >
                            {item.title}
                          </h4>

                          <p className="text-[12px] text-white/65 line-clamp-2 leading-relaxed mt-0.5 font-normal">
                            {item.message}
                          </p>
                        </div>

                        {/* Hover Dismiss Button */}
                        <button
                          onClick={(e) => handleDismissOne(item.id, e)}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white border border-white/15 transition-all"
                          aria-label={`Dismiss ${item.title} notification`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Footer Action Bar */}
              <AnimatePresence>
                {items.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="relative pt-3.5 mt-2 border-t border-white/[0.08] flex items-center gap-2.5"
                  >
                    <button
                      onClick={handleClearAll}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[18px] text-[12px] font-medium text-white/75 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] active:scale-[0.98] border border-white/15 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400/90" />
                      Clear All
                    </button>

                    <button
                      onClick={
                        unreadCount > 0
                          ? handleMarkAllRead
                          : () => setIsOpen(false)
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[18px] text-[12px] font-medium text-white bg-white/[0.14] hover:bg-white/[0.22] active:scale-[0.98] border border-white/25 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.3)] transition-all"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                      {unreadCount > 0 ? "Mark All Read" : "Done"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}