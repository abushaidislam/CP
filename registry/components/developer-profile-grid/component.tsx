"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlarmClock, Check, Copy, PlusCircle, Zap } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type TrayAccent = "lime" | "mint" | "amber" | "sky";

export interface DeveloperProfileGridItem {
  id: string;
  name: string;
  role: string;
  statusText: string;
  available: boolean;
  bannerText: string;
  email: string;
  timeLabel: string;
  avatarUrl?: string;
  avatarVariant?: 0 | 1 | 2 | 3;
  accent?: TrayAccent;
}

export interface DeveloperProfileGridProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of developer profiles to display in the grid */
  profiles?: DeveloperProfileGridItem[];
  /** Number of desktop grid columns (1 to 3) */
  columns?: 1 | 2 | 3;
  /** Tray accent style: "lime" keeps uniform neon-lime, "multicolor" uses per-card accents */
  accentMode?: "lime" | "multicolor";
  /** Show interactive All / Available / Booked filter bar above the grid */
  showFilter?: boolean;
  /** Display live local clock instead of static timeLabel */
  liveClock?: boolean;
  /** Fired when Hire Me is clicked on any card */
  onHireProfile?: (profile: DeveloperProfileGridItem) => void;
  /** Fired when Copy Email is clicked on any card */
  onCopyProfileEmail?: (profile: DeveloperProfileGridItem) => void;
}

const DEFAULT_PROFILES: DeveloperProfileGridItem[] = [
  {
    id: "dev-1",
    name: "Prasanjit Dey",
    role: "Software Engineer",
    statusText: "Available for work",
    available: true,
    bannerText: "Currently High on Creativity",
    email: "prasanjit@example.com",
    timeLabel: "8:30PM",
    avatarVariant: 0,
    accent: "lime",
  },
  {
    id: "dev-2",
    name: "Amina Rahman",
    role: "Design Engineer",
    statusText: "Available for work",
    available: true,
    bannerText: "Crafting Micro-Interactions",
    email: "amina@example.com",
    timeLabel: "6:15PM",
    avatarVariant: 1,
    accent: "mint",
  },
  {
    id: "dev-3",
    name: "Kenji Sato",
    role: "Creative Developer",
    statusText: "Booked till June",
    available: false,
    bannerText: "Shipping 60fps Motion UI",
    email: "kenji@example.com",
    timeLabel: "10:45PM",
    avatarVariant: 2,
    accent: "amber",
  },
  {
    id: "dev-4",
    name: "Maya Lin",
    role: "Staff Frontend",
    statusText: "Available for work",
    available: true,
    bannerText: "Building Design Systems",
    email: "maya@example.com",
    timeLabel: "9:00AM",
    avatarVariant: 3,
    accent: "sky",
  },
];

const ACCENT_STYLES: Record<
  TrayAccent,
  {
    tray: string;
    text: string;
    dot: string;
    copiedText: string;
  }
> = {
  lime: {
    tray: "bg-gradient-to-b from-[#a7f75b] to-[#a9f95d] border-[#88dc3c]",
    text: "text-[#111c06]",
    dot: "bg-[#a0ff63]",
    copiedText: "text-[#b2fc68]",
  },
  mint: {
    tray: "bg-gradient-to-b from-[#6df5c4] to-[#7cf8cc] border-[#4cd9a6]",
    text: "text-[#062017]",
    dot: "bg-[#6df5c4]",
    copiedText: "text-[#7cf8cc]",
  },
  amber: {
    tray: "bg-gradient-to-b from-[#ffd859] to-[#ffdf6e] border-[#e4bc3b]",
    text: "text-[#261c04]",
    dot: "bg-[#ffd859]",
    copiedText: "text-[#ffdf6e]",
  },
  sky: {
    tray: "bg-gradient-to-b from-[#8cc0ff] to-[#9bc9ff] border-[#6ba4ea]",
    text: "text-[#08192e]",
    dot: "bg-[#8cc0ff]",
    copiedText: "text-[#9bc9ff]",
  },
};

function formatCurrentTime(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes}${suffix}`;
}

function MonochromeAvatar({
  variant = 0,
  className,
}: {
  variant?: 0 | 1 | 2 | 3;
  className?: string;
}) {
  if (variant === 1) {
    return (
      <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" className={className}>
        <rect width="80" height="80" fill="#f5f5f5" />
        <path d="M10 80C13 61 23 51 40 51C57 51 67 61 70 80H10Z" fill="#141416" />
        <path d="M24 56C30 62 50 62 56 56" stroke="#f5f5f5" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M20 42C19 24 26 11 40 11C54 11 61 24 60 42C58 50 53 54 49 54H31C27 54 22 50 20 42Z" fill="#141416" />
        <path d="M28 27C28 21 33 18 40 18C47 18 52 21 52 27V36C52 43 46.5 48 40 48C33.5 48 28 43 28 36V27Z" fill="#fafafa" stroke="#141416" strokeWidth="2" />
        <path d="M26 27C30 22 36 20 44 21C49 22 52 24 54 28C51 17 45 13 38 14C31 15 27 20 26 27Z" fill="#141416" />
        <circle cx="35" cy="33" r="1.4" fill="#141416" />
        <circle cx="45" cy="33" r="1.4" fill="#141416" />
        <path d="M37.5 41C39 42.2 41 42.2 42.5 41" stroke="#141416" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" className={className}>
        <rect width="80" height="80" fill="#f5f5f5" />
        <path d="M8 80C12 60 22 50 40 50C58 50 68 60 72 80H8Z" fill="#141416" />
        <path d="M26 52L40 65L54 52" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 30C22 17 30 11 40 11C50 11 58 17 58 30V36H22V30Z" fill="#141416" />
        <path d="M28 26C28 21 33 19 40 19C47 19 52 21 52 26V36C52 43 46.5 48 40 48C33.5 48 28 43 28 36V26Z" fill="#fafafa" stroke="#141416" strokeWidth="2" />
        <rect x="30.5" y="30" width="8" height="5.5" rx="1.8" stroke="#141416" strokeWidth="1.7" />
        <rect x="41.5" y="30" width="8" height="5.5" rx="1.8" stroke="#141416" strokeWidth="1.7" />
        <path d="M38.5 32.5H41.5" stroke="#141416" strokeWidth="1.7" />
        <path d="M37.5 41.5H42.5" stroke="#141416" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === 3) {
    return (
      <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" className={className}>
        <rect width="80" height="80" fill="#f5f5f5" />
        <path d="M10 80C14 61 23 51 40 51C57 51 66 61 70 80H10Z" fill="#141416" />
        <circle cx="40" cy="14" r="7" fill="#141416" />
        <path d="M23 33C23 20 30 14 40 14C50 14 57 20 57 33V39H23V33Z" fill="#141416" />
        <path d="M28 26C28 21 33 19 40 19C47 19 52 21 52 26V36C52 43 46.5 48 40 48C33.5 48 28 43 28 36V26Z" fill="#fafafa" stroke="#141416" strokeWidth="2" />
        <path d="M33 32.5H36.8M43.2 32.5H47" stroke="#141416" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M37 41C38.8 42.3 41.2 42.3 43 41" stroke="#141416" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" className={className}>
      <rect width="80" height="80" fill="#f7f7f7" />
      <path d="M6 18L18 22M74 26L62 29M68 42L76 44" stroke="#18181b" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      <path d="M6 80C9 60 19 49 39 49C59 49 69 59 73 80H6Z" fill="#111113" />
      <path d="M19 52C26 60 34 65 48 64M16 58C24 66 36 72 56 69M24 49C31 55 42 57 54 54M14 66C20 72 28 76 38 78M48 56C54 61 59 68 62 77" stroke="#f7f7f7" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M21 44C17 31 20 14 34 10C48 7 60 16 61 32C62 39 59 45 55 49L23 48L21 44Z" fill="#111113" />
      <path d="M28 24C28 19 33 17 40 17C47 17 52 20 52 26V35C52 42 46.5 47 40 47C33.5 47 28 42 28 35V24Z" fill="#fafafa" stroke="#111113" strokeWidth="2" />
      <path d="M24 28C26 16 33 10 42 11C51 12 57 19 57 29C54 24 51 21 48 20L46 27L43 20L38 28L36 20L30 27L29 22L24 28Z" fill="#111113" />
      <path d="M32 30.5L37.5 31.2M43 31.2L48.5 30.5" stroke="#111113" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="35.2" cy="33.3" r="1.35" fill="#111113" />
      <circle cx="45.2" cy="33.3" r="1.35" fill="#111113" />
      <path d="M40 35V38.2M37.5 41.5C39 42.3 41.5 42.3 43 41.5" stroke="#111113" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface GridProfileCardProps {
  profile: DeveloperProfileGridItem;
  accentKey: TrayAccent;
  liveClock: boolean;
  prefersReducedMotion: boolean;
  onHire?: (profile: DeveloperProfileGridItem) => void;
  onCopy?: (profile: DeveloperProfileGridItem) => void;
}

function GridProfileCard({
  profile,
  accentKey,
  liveClock,
  prefersReducedMotion,
  onHire,
  onCopy,
}: GridProfileCardProps) {
  const [copied, setCopied] = useState(false);
  const [hireAck, setHireAck] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const [clockText, setClockText] = useState(profile.timeLabel);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!liveClock) {
      setClockText(profile.timeLabel);
      return;
    }
    setClockText(formatCurrentTime());
    const id = setInterval(() => setClockText(formatCurrentTime()), 15000);
    return () => clearInterval(id);
  }, [liveClock, profile.timeLabel]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (hireTimerRef.current) clearTimeout(hireTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profile.email);
      }
    } catch {
      // Clipboard may be restricted in sandboxed previews
    }
    setCopied(true);
    onCopy?.(profile);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [onCopy, profile]);

  const handleHire = useCallback(() => {
    if (onHire) {
      onHire(profile);
    } else if (typeof window !== "undefined" && profile.email) {
      window.location.href = `mailto:${encodeURIComponent(profile.email)}?subject=${encodeURIComponent(`Project Inquiry for ${profile.name}`)}`;
    }
    setHireAck(true);
    if (hireTimerRef.current) clearTimeout(hireTimerRef.current);
    hireTimerRef.current = setTimeout(() => setHireAck(false), 1800);
  }, [onHire, profile]);

  const style = ACCENT_STYLES[accentKey];
  const springTransition = prefersReducedMotion
    ? { duration: 0.12 }
    : { type: "spring" as const, stiffness: 380, damping: 30 };

  const hasCustomAvatar = Boolean(
    profile.avatarUrl && profile.avatarUrl.trim().length > 0 && !avatarErr
  );

  return (
    <motion.article
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      transition={springTransition}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full select-none"
    >
      <motion.div
        animate={isHovered && !prefersReducedMotion ? { y: -3 } : { y: 0 }}
        transition={springTransition}
        className={cn(
          "relative z-10 rounded-[34px] bg-[#212121] px-5 sm:px-6 pt-5 pb-5",
          "shadow-[0_16px_30px_-8px_rgba(0,0,0,0.48),0_2px_6px_rgba(0,0,0,0.22)]",
          "ring-1 ring-inset ring-white/[0.06]"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 min-w-0">
            <span className="relative flex h-[7px] w-[7px] shrink-0">
              {profile.available && !prefersReducedMotion && (
                <motion.span
                  aria-hidden="true"
                  className={cn("absolute inset-0 rounded-full", style.dot)}
                  animate={{ scale: [1, 2.3], opacity: [0.65, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <span
                className={cn(
                  "relative inline-flex h-[7px] w-[7px] rounded-full",
                  profile.available ? style.dot : "bg-[#71717a]"
                )}
              />
            </span>
            <span className="text-[13px] font-normal tracking-[-0.005em] text-[#9c9ca1] truncate">
              {profile.statusText}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 shrink-0 text-[13px] font-normal tracking-[-0.005em] text-[#9c9ca1] tabular-nums">
            <AlarmClock className="h-[13.5px] w-[13.5px] opacity-85" strokeWidth={1.8} />
            <span>{clockText}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3.5">
          <div className="relative h-[50px] w-[50px] shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 bg-[#f7f7f7]">
            {hasCustomAvatar ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                onError={() => setAvatarErr(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <MonochromeAvatar variant={profile.avatarVariant ?? 0} className="h-full w-full" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[20px] sm:text-[22px] font-medium leading-[1.2] tracking-[-0.018em] text-[#f3f3f4] truncate">
              {profile.name}
            </h3>
            <p className="mt-0.5 text-[13.5px] font-normal leading-[1.3] text-[#8d8d92] truncate">
              {profile.role}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <motion.button
            type="button"
            onClick={handleHire}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.975 }}
            transition={{ type: "spring", stiffness: 520, damping: 30 }}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[14px] px-3 py-2.5 text-[14px] font-normal tracking-[-0.005em] text-[#f5f5f5]",
              "bg-[#484848] hover:bg-[#525252] transition-colors duration-150",
              "border border-white/[0.17]",
              "shadow-[0_6px_14px_-4px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.12)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7f75b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#212121]"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {hireAck ? (
                <motion.span
                  key="ack"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Check className="h-[15px] w-[15px] text-[#a7f75b]" strokeWidth={2.3} />
                  <span>Let&apos;s talk</span>
                </motion.span>
              ) : (
                <motion.span
                  key="hire"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="h-[15px] w-[15px] opacity-90" strokeWidth={1.75} />
                  <span>Hire Me</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            type="button"
            onClick={handleCopy}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.975 }}
            transition={{ type: "spring", stiffness: 520, damping: 30 }}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[14px] px-3 py-2.5 text-[14px] font-normal tracking-[-0.005em] text-[#f2f2f2]",
              "bg-[#2d2d2d] hover:bg-[#373737] transition-colors duration-150",
              "border border-white/[0.12]",
              "shadow-[0_6px_14px_-4px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.07)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7f75b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#212121]"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="copied"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className={cn("inline-flex items-center gap-1.5", style.copiedText)}
                >
                  <Check className="h-[15px] w-[15px]" strokeWidth={2.3} />
                  <span>Copied!</span>
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Copy className="h-[15px] w-[15px] opacity-85" strokeWidth={1.75} />
                  <span>Copy Email</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      <div
        className={cn(
          "relative z-0 -mt-[44px] pt-[55px] pb-[12px] px-4 rounded-b-[34px] rounded-t-[24px] border-x border-b",
          "shadow-[0_16px_32px_-14px_rgba(0,0,0,0.2)] dark:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.62)]",
          "flex items-center justify-center gap-1.5 text-[13.5px] font-medium tracking-[-0.01em]",
          style.tray,
          style.text
        )}
      >
        <motion.span
          className="inline-flex items-center justify-center"
          animate={
            isHovered && !prefersReducedMotion
              ? { rotate: [0, -12, 10, 0], scale: [1, 1.15, 1] }
              : { rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Zap className="h-[14.5px] w-[14.5px]" strokeWidth={1.9} />
        </motion.span>
        <span className="truncate">{profile.bannerText}</span>
      </div>
    </motion.article>
  );
}

type FilterKey = "all" | "available" | "booked";

export const DeveloperProfileGrid = React.forwardRef<
  HTMLDivElement,
  DeveloperProfileGridProps
>(function DeveloperProfileGrid(
  {
    profiles = DEFAULT_PROFILES,
    columns = 2,
    accentMode = "lime",
    showFilter = true,
    liveClock = false,
    onHireProfile,
    onCopyProfileEmail,
    className,
    ...rest
  },
  ref
) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const [filter, setFilter] = useState<FilterKey>("all");

  const availableCount = profiles.filter((p) => p.available).length;
  const bookedCount = profiles.length - availableCount;

  const filteredProfiles = profiles.filter((p) => {
    if (filter === "available") return p.available;
    if (filter === "booked") return !p.available;
    return true;
  });

  const maxWidthClass =
    columns === 1
      ? "max-w-[468px]"
      : columns === 3
      ? "max-w-[1260px]"
      : "max-w-[900px]";

  const gridColsClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";

  const filters: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: "all", label: "All", count: profiles.length },
    { key: "available", label: "Available", count: availableCount },
    { key: "booked", label: "Booked", count: bookedCount },
  ];

  return (
    <section
      ref={ref}
      aria-label="Developer availability profiles"
      className={cn("w-full mx-auto", maxWidthClass, className)}
      {...rest}
    >
      {showFilter && (
        <div className="mb-6 flex justify-center">
          <div
            role="tablist"
            aria-label="Filter profiles by availability"
            className="inline-flex items-center gap-1 rounded-full bg-black/[0.06] dark:bg-white/[0.06] p-1 ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
          >
            {filters.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7f75b]",
                    active
                      ? "text-white dark:text-[#111c06]"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`${uid}-filter-pill`}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.1 }
                          : { type: "spring", stiffness: 460, damping: 34 }
                      }
                      className="absolute inset-0 rounded-full bg-[#212121] dark:bg-[#a7f75b]"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span className="relative z-10 text-[11.5px] tabular-nums opacity-75">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={cn("grid gap-6", gridColsClass)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredProfiles.map((profile) => (
            <GridProfileCard
              key={profile.id}
              profile={profile}
              accentKey={accentMode === "multicolor" ? profile.accent ?? "lime" : "lime"}
              liveClock={liveClock}
              prefersReducedMotion={prefersReducedMotion}
              onHire={onHireProfile}
              onCopy={onCopyProfileEmail}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
});

DeveloperProfileGrid.displayName = "DeveloperProfileGrid";

export { DeveloperProfileGrid as component, DeveloperProfileGrid as Component };
export default DeveloperProfileGrid;