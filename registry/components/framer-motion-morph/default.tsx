"use client";

import React, { useState } from "react";
import {
  Flashlight,
  Camera,
  Wifi,
  Battery,
  Signal,
  Sparkles,
  RotateCcw,
  MessageSquare,
  GitPullRequest,
  Calendar,
  Layers,
} from "lucide-react";
import IOSNotificationCenter, {
  type NotificationItem,
} from "@/components/ui/ios-notification-center";

const demoNotifications: NotificationItem[] = [
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
    app: "Linear",
    title: "Design System v2.4",
    message: "Token sync completed across 14 spatial UI components",
    time: "24m ago",
    icon: <Layers className="w-4 h-4 text-white" />,
    iconBg: "bg-gradient-to-b from-indigo-500 to-violet-600",
    unread: true,
  },
  {
    id: "notif-4",
    app: "Calendar",
    title: "Sprint Retrospective",
    message: "Starting in 15 minutes via Apple FaceTime link",
    time: "32m ago",
    icon: <Calendar className="w-4 h-4 text-white" />,
    iconBg: "bg-gradient-to-b from-rose-400 to-rose-600",
    unread: false,
  },
];

export default function IOSNotificationCenterDemo() {
  const [key, setKey] = useState(0);
  const [wallpaper, setWallpaper] = useState<"aurora" | "sunset" | "midnight">("aurora");

  const wallpapers = {
    aurora:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.45),transparent_45%),radial-gradient(circle_at_80%_25%,rgba(244,63,94,0.4),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.5),transparent_55%)] bg-neutral-950",
    sunset:
      "bg-[radial-gradient(circle_at_25%_15%,rgba(251,146,60,0.5),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(225,29,72,0.45),transparent_50%),radial-gradient(circle_at_40%_85%,rgba(147,51,234,0.45),transparent_55%)] bg-neutral-950",
    midnight:
      "bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.38),transparent_50%),radial-gradient(circle_at_85%_80%,rgba(16,185,129,0.28),transparent_50%)] bg-black",
  };

  return (
    <div className="relative w-full min-h-[680px] flex flex-col items-center justify-center p-4 sm:p-8 bg-neutral-950 font-sans select-none overflow-hidden">
      {/* Top Floating Demo Controls (Wallpaper Switcher & Reset) */}
      <div className="relative z-20 flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-xl text-xs text-white/70">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-medium text-white/60 mr-1">
          Wallpaper:
        </span>
        {(["aurora", "sunset", "midnight"] as const).map((wp) => (
          <button
            key={wp}
            onClick={() => setWallpaper(wp)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize transition-all ${
              wallpaper === wp
                ? "bg-white/20 text-white border border-white/25 shadow-sm"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {wp}
          </button>
        ))}
        <div className="h-3 w-[1px] bg-white/10 mx-1" />
        <button
          onClick={() => setKey((prev) => prev + 1)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Reset notifications"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* iOS 18 Screen Frame */}
      <div
        className={`relative w-full max-w-[440px] h-[580px] rounded-[48px] border-[6px] border-neutral-800/90 shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.12),inset_0_0_24px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-between p-6 transition-colors duration-700 ${wallpapers[wallpaper]}`}
      >
        {/* Subtle Noise / Specular Screen Glare */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.07] pointer-events-none" />

        {/* iOS Status Bar & Dynamic Island */}
        <div className="relative z-10 flex items-center justify-between px-2 pt-0.5 text-white/90 text-[12px] font-semibold tracking-tight">
          <span>9:41</span>
          <div className="w-24 h-6 rounded-full bg-black border border-white/[0.08] shadow-inner flex items-center justify-end px-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500/80 ring-2 ring-emerald-500/20" />
          </div>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* iOS Lock Screen Clock Header */}
        <div className="relative z-10 flex flex-col items-center text-center mt-2">
          <p className="text-[13px] font-medium text-white/75 tracking-wide">
            Tuesday, October 27
          </p>
          <h1 className="text-[68px] font-bold leading-none tracking-tighter bg-gradient-to-b from-white via-white/95 to-white/65 bg-clip-text text-transparent drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)] mt-1">
            09:41
          </h1>
        </div>

        {/* Center Showcase Area: Notification Center Component */}
        <div className="relative z-20 my-auto flex flex-col items-center justify-center">
          <IOSNotificationCenter
            key={key}
            notifications={demoNotifications}
            title="Notifications"
            portalMode="contained"
          />
          <p className="text-[11px] text-white/45 mt-3 font-medium tracking-tight">
            Click pill to expand • Swipe cards left or right to dismiss
          </p>
        </div>

        {/* iOS Bottom Lock Screen Actions & Home Bar */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between px-3">
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/85 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
              <Flashlight className="w-4 h-4" />
            </div>
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/85 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="w-32 h-1.5 rounded-full bg-white/80 shadow-sm" />
        </div>
      </div>
    </div>
  );
}