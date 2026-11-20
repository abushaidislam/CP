"use client";

import React, { useId, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link2 } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export interface SocialLink {
  id: "x" | "linkedin" | "bluesky";
  label: string;
  href: string;
}

export interface BrandProfileCardProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Brand or profile display name */
  name?: string;
  /** Uppercase tracked subtitle rendered inside the banner */
  subtitle?: string;
  /** Short tagline rendered beneath the subtitle inside the banner */
  tagline?: string;
  /** Social handle (e.g. "@hushlever") */
  handle?: string;
  /** Profile biography text */
  bio?: string;
  /** Show verified checkmark badge beside the display name */
  verified?: boolean;
  /** Number of accounts followed */
  followingCount?: number;
  /** Number of followers (increments by 1 when followed) */
  followersCount?: number;
  /** Display label for the website link */
  website?: string;
  /** Full URL for the website link */
  websiteUrl?: string;
  /** Social profile links displayed in the banner action row */
  socials?: SocialLink[];
  /** Toggle visibility of the social icon links */
  showSocials?: boolean;
  /** Controlled follow state */
  following?: boolean;
  /** Uncontrolled initial follow state */
  initialFollowing?: boolean;
  /** Callback fired when follow state toggles */
  onFollowChange?: (following: boolean) => void;
  /** Surface color theme ("auto" follows Tailwind dark mode) */
  theme?: "auto" | "light" | "dark";
  /** Optional custom avatar element */
  avatar?: React.ReactNode;
  /** Optional custom decorative banner emblem */
  bannerEmblem?: React.ReactNode;
}

const DEFAULT_SOCIALS: SocialLink[] = [
  { id: "x", label: "X (Twitter)", href: "https://x.com/hushlever" },
  { id: "linkedin", label: "LinkedIn", href: "https://linkedin.com/company/hushlever" },
  { id: "bluesky", label: "Bluesky", href: "https://bsky.app/profile/hushlever.com" },
];

function BrandStepMark({
  idPrefix,
  variant = "avatar",
  className,
}: {
  idPrefix: string;
  variant?: "avatar" | "banner";
  className?: string;
}) {
  const upperGradId = `${idPrefix}-upper-grad`;
  const lowerGradId = `${idPrefix}-lower-grad`;

  if (variant === "banner") {
    return (
      <svg
        viewBox="0 0 144 132"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <defs>
          <linearGradient
            id={upperGradId}
            x1="88"
            y1="8"
            x2="88"
            y2="92"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#D7F752" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#B8E446" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#8DBB3A" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient
            id={lowerGradId}
            x1="46"
            y1="48"
            x2="46"
            y2="126"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#C9EC4A" stopOpacity="0.92" />
            <stop offset="45%" stopColor="#7EA838" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#1B3C2B" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        {/* Upper-right stepped lever */}
        <path
          d="M66 10H124C131.732 10 138 16.268 138 24V78C138 85.732 131.732 92 124 92H106C101.582 92 98 88.418 98 84V56C98 51.582 94.418 48 90 48H66C58.268 48 52 41.732 52 34V24C52 16.268 58.268 10 66 10Z"
          fill={`url(#${upperGradId})`}
        />
        {/* Lower-left stepped lever */}
        <path
          d="M18 52H72C79.732 52 86 58.268 86 66V74C86 81.732 79.732 88 72 88H56C51.582 88 48 91.582 48 96V116C48 122.627 42.627 128 36 128H18C11.373 128 6 122.627 6 116V66C6 58.268 12.268 52 18 52Z"
          fill={`url(#${lowerGradId})`}
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 80 74"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Upper-right solid lime lever */}
      <path
        d="M36 6H68C72.418 6 76 9.582 76 14V44C76 48.418 72.418 52 68 52H58C55.791 52 54 50.209 54 48V32C54 29.791 52.209 28 50 28H36C31.582 28 28 24.418 28 20V14C28 9.582 31.582 6 36 6Z"
        fill="#D4F553"
      />
      {/* Lower-left solid lime lever */}
      <path
        d="M12 28H40C44.418 28 48 31.582 48 36V42C48 46.418 44.418 50 40 50H30C27.791 50 26 51.791 26 54V62C26 66.418 22.418 70 18 70H12C7.582 70 4 66.418 4 62V36C4 31.582 7.582 28 12 28Z"
        fill="#D4F553"
      />
    </svg>
  );
}

function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Verified account"
      role="img"
      className={className}
    >
      <path
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        fill="#1F9EE1"
      />
      <path
        d="M9.75 16.25l-3.4-3.4 1.41-1.41 1.99 1.99 5.49-5.49 1.41 1.41-6.9 6.9z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function SocialGlyph({ id, className }: { id: SocialLink["id"]; className?: string }) {
  switch (id) {
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    case "bluesky":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
        </svg>
      );
  }
}

function formatCompactCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 10_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toLocaleString("en-US");
}

export const BrandProfileCard = React.forwardRef<HTMLElement, BrandProfileCardProps>(
  function BrandProfileCard(
    {
      name = "hushlever",
      subtitle = "AI AUTOMATION STUDIO",
      tagline = "Built around your business.",
      handle = "@hushlever",
      bio = "AI automation studio helping businesses streamline operations, hand off repetitive work, and move forward with clarity.",
      verified = true,
      followingCount = 188,
      followersCount = 968,
      website = "hushlever.com",
      websiteUrl = "https://hushlever.com",
      socials = DEFAULT_SOCIALS,
      showSocials = true,
      following: controlledFollowing,
      initialFollowing = false,
      onFollowChange,
      theme = "auto",
      avatar,
      bannerEmblem,
      className,
      ...rest
    },
    ref
  ) {
    const rawId = useId();
    const safeId = rawId.replace(/:/g, "");
    const prefersReducedMotion = useReducedMotion();

    const isControlled = controlledFollowing !== undefined;
    const [internalFollowing, setInternalFollowing] = useState(initialFollowing);
    const [isHoveringFollow, setIsHoveringFollow] = useState(false);

    useEffect(() => {
      if (!isControlled) {
        setInternalFollowing(initialFollowing);
      }
    }, [initialFollowing, isControlled]);

    const isFollowing = isControlled ? controlledFollowing : internalFollowing;
    const displayedFollowers = followersCount + (isFollowing ? 1 : 0);

    const handleToggleFollow = useCallback(() => {
      const next = !isFollowing;
      if (!isControlled) {
        setInternalFollowing(next);
      }
      onFollowChange?.(next);
    }, [isFollowing, isControlled, onFollowChange]);

    const normalizedHandle = handle.startsWith("@") ? handle : `@${handle}`;
    const safeWebsiteHref =
      websiteUrl || (website.startsWith("http") ? website : `https://${website}`);

    const surfaceClasses =
      theme === "dark"
        ? "bg-[#0d1514] text-[#f3f6f4] border-white/10"
        : theme === "light"
          ? "bg-[#f6f8f5] text-[#0d1917] border-black/[0.06]"
          : "bg-[#f6f8f5] text-[#0d1917] border-black/[0.06] dark:bg-[#0d1514] dark:text-[#f3f6f4] dark:border-white/10";

    const mutedTextClasses =
      theme === "dark"
        ? "text-[#92a39e]"
        : theme === "light"
          ? "text-[#78827f]"
          : "text-[#78827f] dark:text-[#92a39e]";

    const bioTextClasses =
      theme === "dark"
        ? "text-[#dbe4e0]"
        : theme === "light"
          ? "text-[#1a2421]"
          : "text-[#1a2421] dark:text-[#dbe4e0]";

    const linkTextClasses =
      theme === "dark"
        ? "text-[#a9d959] hover:text-[#c7f279]"
        : theme === "light"
          ? "text-[#2d5016] hover:text-[#1f390e]"
          : "text-[#2d5016] hover:text-[#1f390e] dark:text-[#a9d959] dark:hover:text-[#c7f279]";

    const avatarRingClasses =
      theme === "dark"
        ? "ring-1 ring-white/20 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
        : theme === "light"
          ? "ring-1 ring-white/40 shadow-[0_8px_24px_rgba(6,24,24,0.22)]"
          : "ring-1 ring-white/40 shadow-[0_8px_24px_rgba(6,24,24,0.22)] dark:ring-white/20 dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)]";

    return (
      <article
        ref={ref}
        aria-labelledby={`${safeId}-name`}
        className={cn(
          "group relative w-full max-w-[408px] overflow-hidden rounded-[26px] border",
          "shadow-[0_22px_54px_-16px_rgba(5,20,20,0.34),0_2px_8px_rgba(5,20,20,0.08)]",
          "transition-shadow duration-300 hover:shadow-[0_28px_64px_-16px_rgba(5,20,20,0.42),0_4px_12px_rgba(5,20,20,0.1)]",
          "font-['Plus_Jakarta_Sans','Inter',ui-sans-serif,system-ui,sans-serif] antialiased",
          surfaceClasses,
          className
        )}
        {...rest}
      >
        {/* Top specular 1px rim highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-gradient-to-r from-white/30 via-white/45 to-[#e5fa70]/50"
        />

        {/* Upper Brand Banner (~49% height proportion) */}
        <div className="relative h-[282px] w-full overflow-hidden bg-[#071f1f] select-none">
          {/* Layered radial mesh gradients matching reference lighting */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                "radial-gradient(62% 58% at 98% 4%, rgba(215, 248, 86, 0.92) 0%, rgba(168, 224, 62, 0.45) 34%, rgba(7, 31, 31, 0) 74%)",
                "radial-gradient(46% 42% at 6% 96%, rgba(206, 240, 84, 0.78) 0%, rgba(114, 174, 58, 0.34) 42%, rgba(7, 31, 31, 0) 76%)",
                "radial-gradient(44% 44% at 4% 4%, rgba(196, 232, 92, 0.36) 0%, rgba(43, 84, 66, 0.22) 38%, rgba(7, 31, 31, 0) 72%)",
                "radial-gradient(50% 50% at 96% 94%, rgba(25, 76, 74, 0.55) 0%, rgba(7, 31, 31, 0) 70%)",
                "linear-gradient(155deg, #071d1d 0%, #061818 52%, #0a2626 100%)",
              ].join(", "),
            }}
          />

          {/* Subtle organic film grain overlay */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14] mix-blend-overlay"
          >
            <filter id={`${safeId}-grain`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.82"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${safeId}-grain)`} />
          </svg>

          {/* Decorative Right Brand Mark */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute right-[22px] top-[52px] w-[124px]"
            initial={false}
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            {bannerEmblem ?? (
              <BrandStepMark
                idPrefix={`${safeId}-banner`}
                variant="banner"
                className="h-auto w-full drop-shadow-[0_14px_24px_rgba(4,16,16,0.35)]"
              />
            )}
          </motion.div>

          {/* Banner Left Copy Block */}
          <div className="relative z-10 flex h-full flex-col justify-between px-7 pb-5 pt-[76px]">
            <div className="max-w-[220px]">
              <div className="text-[31px] font-extrabold leading-[1.02] tracking-[-0.045em] text-white">
                {name}
              </div>
              {subtitle && (
                <p className="mt-2.5 text-[9.5px] font-medium uppercase tracking-[0.23em] text-white/80">
                  {subtitle}
                </p>
              )}
              {tagline && (
                <p className="mt-1.5 text-[12.5px] font-normal leading-snug text-white/85">
                  {tagline}
                </p>
              )}
            </div>

            {/* Banner Bottom-Right Socials + Follow Action Row */}
            <div className="flex items-center justify-end gap-3.5">
              {showSocials && socials.length > 0 && (
                <nav
                  aria-label={`${name} social links`}
                  className="flex items-center gap-3"
                >
                  {socials.map((social) => (
                    <a
                      key={social.id}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-white/90",
                        "transition-colors duration-150 hover:bg-white/10 hover:text-white",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4f553] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071f1f]"
                      )}
                    >
                      <SocialGlyph
                        id={social.id}
                        className={social.id === "linkedin" ? "h-[17px] w-[17px]" : "h-[16px] w-[16px]"}
                      />
                    </a>
                  ))}
                </nav>
              )}

              <motion.button
                type="button"
                aria-pressed={isFollowing}
                onClick={handleToggleFollow}
                onMouseEnter={() => setIsHoveringFollow(true)}
                onMouseLeave={() => setIsHoveringFollow(false)}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={cn(
                  "relative inline-flex h-[34px] min-w-[84px] items-center justify-center rounded-full px-5 text-[13.5px] font-semibold",
                  "transition-colors duration-200 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4f553] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071f1f]",
                  isFollowing
                    ? isHoveringFollow
                      ? "border border-rose-400/50 bg-rose-500/20 text-rose-100"
                      : "border border-white/25 bg-white/14 text-white backdrop-blur-sm"
                    : "bg-[#f8faf7] text-[#0b1716] hover:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={
                      isFollowing
                        ? isHoveringFollow
                          ? "unfollow"
                          : "following"
                        : "follow"
                    }
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                  >
                    {isFollowing
                      ? isHoveringFollow
                        ? "Unfollow"
                        : "Following"
                      : "Follow"}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Lower Profile Body */}
        <div className="relative px-7 pb-7 pt-[62px]">
          {/* Overlapping Rounded-Square Avatar */}
          <div
            className={cn(
              "absolute -top-[53px] left-7 z-20 flex h-[106px] w-[106px] items-center justify-center overflow-hidden rounded-[22px] bg-[#082121]",
              avatarRingClasses
            )}
          >
            {avatar ? (
              avatar
            ) : (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(80% 80% at 15% 88%, rgba(162, 212, 68, 0.24) 0%, rgba(10, 38, 38, 0) 65%), linear-gradient(145deg, #0b2c2b 0%, #061b1b 100%)",
                  }}
                />
                <BrandStepMark
                  idPrefix={`${safeId}-avatar`}
                  variant="avatar"
                  className="relative z-10 h-[56px] w-[56px]"
                />
              </>
            )}
          </div>

          {/* Identity Heading + Verified Badge */}
          <div className="flex items-center gap-1.5">
            <h2
              id={`${safeId}-name`}
              className="truncate text-[23px] font-extrabold leading-tight tracking-[-0.03em]"
            >
              {name}
            </h2>
            {verified && <VerifiedBadge className="h-[20px] w-[20px] shrink-0" />}
          </div>

          {/* Handle */}
          <p className={cn("mt-0.5 text-[14.5px] font-normal leading-snug", mutedTextClasses)}>
            {normalizedHandle}
          </p>

          {/* Bio */}
          {bio && (
            <p className={cn("mt-4 text-[14.5px] font-normal leading-[1.52]", bioTextClasses)}>
              {bio}
            </p>
          )}

          {/* Following / Followers Metrics */}
          <div className="mt-4 flex items-center gap-5 text-[14.5px]">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold tabular-nums">
                {formatCompactCount(followingCount)}
              </span>
              <span className={mutedTextClasses}>Following</span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="inline-flex min-w-[2ch] overflow-hidden font-semibold tabular-nums">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={displayedFollowers}
                    initial={
                      prefersReducedMotion
                        ? false
                        : { y: isFollowing ? 8 : -8, opacity: 0 }
                    }
                    animate={{ y: 0, opacity: 1 }}
                    exit={
                      prefersReducedMotion
                        ? undefined
                        : { y: isFollowing ? -8 : 8, opacity: 0 }
                    }
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    {formatCompactCount(displayedFollowers)}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className={mutedTextClasses}>Followers</span>
            </div>
          </div>

          {/* Website Link */}
          {website && (
            <div className="mt-4">
              <a
                href={safeWebsiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 text-[14.5px] font-medium transition-colors duration-150 hover:underline underline-offset-4",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5016] rounded-sm",
                  linkTextClasses
                )}
              >
                <Link2 className={cn("h-4 w-4 shrink-0 -rotate-45", mutedTextClasses)} aria-hidden="true" />
                <span>{website}</span>
              </a>
            </div>
          )}
        </div>
      </article>
    );
  }
);

BrandProfileCard.displayName = "BrandProfileCard";

export { BrandProfileCard as component, BrandProfileCard as Component };
export default BrandProfileCard;