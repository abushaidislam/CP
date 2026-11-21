"use client";

import React, { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface FooterLinkItem {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

export interface SocialLinkItem {
  name: "discord" | "x" | "linkedin" | "github";
  href: string;
  label?: string;
}

export interface BentoBrandFooterProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Brand display name shown in the gradient card, copyright, newsletter, and watermark */
  brandName?: string;
  /** First line of the brand tagline in crisp white */
  taglinePrimary?: string;
  /** Second line of the brand tagline in soft translucent ice-blue */
  taglineSecondary?: string;
  /** Handwritten prompt next to the social buttons */
  socialPrompt?: string;
  /** Social links rendered in the dark rounded icon buttons */
  socialLinks?: SocialLinkItem[];
  /** Navigation link columns inside the right bento card */
  columns?: FooterColumn[];
  /** Copyright year */
  copyrightYear?: number;
  /** Muted first line of the newsletter heading */
  newsletterEyebrow?: string;
  /** Bold second line of the newsletter heading */
  newsletterHeading?: string;
  /** Placeholder for the email input */
  emailPlaceholder?: string;
  /** Submit button label */
  subscribeLabel?: string;
  /** Toggle the 3D glossy floating badge in the top-right corner */
  showFloatingBadge?: boolean;
  /** Script caption beneath the 3D floating badge */
  badgeCaption?: string;
  /** Toggle the oversized full-width watermark wordmark below the bento cards */
  showWatermark?: boolean;
  /** Optional custom handler for newsletter subscription */
  onSubscribe?: (email: string) => void | Promise<void>;
  /** Optional custom handler when the 3D "Feeling lucky?" badge is clicked */
  onLuckyClick?: () => void;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Navigation",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", href: "#blog" },
      { label: "About", href: "#about" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Privacy Policy", href: "#privacy" },
    ],
  },
];

const DEFAULT_SOCIALS: SocialLinkItem[] = [
  { name: "discord", href: "#discord", label: "Discord" },
  { name: "x", href: "#x", label: "X (Twitter)" },
  { name: "linkedin", href: "#linkedin", label: "LinkedIn" },
  { name: "github", href: "#github", label: "GitHub" },
];

const LUCKY_FORTUNES = [
  "Workflow tip: Automate follow-ups to save 5+ hours weekly.",
  "Product boost: Ship smaller iterations for faster feedback.",
  "Automation win: Zero manual handoffs this sprint.",
  "Focus mode: Let smart triggers handle the busywork.",
];

function BrandMark({
  className,
  fill = "currentColor",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M20 3.5C22.4 3.5 24.4 5.2 24.8 7.5L25.6 11.8C25.9 13.1 26.9 14.1 28.2 14.4L32.5 15.2C34.8 15.6 36.5 17.6 36.5 20C36.5 22.4 34.8 24.4 32.5 24.8L28.2 25.6C26.9 25.9 25.9 26.9 25.6 28.2L24.8 32.5C24.4 34.8 22.4 36.5 20 36.5C17.6 36.5 15.6 34.8 15.2 32.5L14.4 28.2C14.1 26.9 13.1 25.9 11.8 25.6L7.5 24.8C5.2 24.4 3.5 22.4 3.5 20C3.5 17.6 5.2 15.6 7.5 15.2L11.8 14.4C13.1 14.1 14.1 13.1 14.4 11.8L15.2 7.5C15.6 5.2 17.6 3.5 20 3.5Z"
        fill={fill}
      />
    </svg>
  );
}

function SocialGlyph({ name }: { name: SocialLinkItem["name"] }) {
  switch (name) {
    case "discord":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[17px] w-[17px]" aria-hidden="true">
          <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px]" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[16px] w-[16px]" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[17px] w-[17px]" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
        </svg>
      );
  }
}

export const BentoBrandFooter = React.forwardRef<
  HTMLElement,
  BentoBrandFooterProps
>(function BentoBrandFooter(
  {
    brandName = "Nuvora",
    taglinePrimary = "Smarter workflow automation,",
    taglineSecondary = "powered by AI.",
    socialPrompt = "Stay in touch!",
    socialLinks = DEFAULT_SOCIALS,
    columns = DEFAULT_COLUMNS,
    copyrightYear = 2026,
    newsletterEyebrow = "Workflows evolve fast.",
    newsletterHeading,
    emailPlaceholder = "Enter email address",
    subscribeLabel = "Subscribe",
    showFloatingBadge = true,
    badgeCaption = "Feeling lucky?",
    showWatermark = true,
    onSubscribe,
    onLuckyClick,
    className,
    ...rest
  },
  ref
) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [luckyIndex, setLuckyIndex] = useState<number | null>(null);
  const [badgeSpin, setBadgeSpin] = useState(0);

  const resolvedNewsletterHeading =
    newsletterHeading ?? `Stay ahead with ${brandName}.`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmed || !emailPattern.test(trimmed)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      if (onSubscribe) {
        await onSubscribe(trimmed);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  const handleLuckyTrigger = () => {
    setBadgeSpin((prev) => prev + 1);
    setLuckyIndex((prev) =>
      prev === null ? 0 : (prev + 1) % LUCKY_FORTUNES.length
    );
    onLuckyClick?.();
  };

  return (
    <footer
      ref={ref}
      className={cn(
        "relative w-full max-w-[1040px] mx-auto pt-10 sm:pt-12 pb-2 px-2 sm:px-4 select-none",
        className
      )}
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
      }}
      {...rest}
    >
      {/* Top Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Brand Gradient Card */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "lg:col-span-4 relative overflow-hidden rounded-[22px] p-6 sm:p-7",
            "min-h-[300px] sm:min-h-[348px] flex flex-col justify-between",
            "ring-1 ring-inset ring-white/15 shadow-[0_14px_34px_-16px_rgba(9,45,158,0.45)]"
          )}
          style={{
            background:
              "radial-gradient(125% 115% at 88% 96%, #6cb8ff 0%, #3d8ef5 32%, #1352c9 64%, #022a92 100%)",
          }}
        >
          {/* Subtle tactile grain overlay */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.11] mix-blend-overlay"
          >
            <filter id={`noise-${uid}`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.82"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter={`url(#noise-${uid})`} />
          </svg>

          {/* Subtle top-left depth sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(160,215,255,0.14) 100%)",
            }}
          />

          {/* Brand Lockup */}
          <div className="relative z-10 flex items-center gap-2.5">
            <BrandMark className="h-[26px] w-[26px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]" />
            <span className="text-[24px] font-bold tracking-[-0.03em] text-white leading-none">
              {brandName}
            </span>
          </div>

          {/* Tagline + Social Row */}
          <div className="relative z-10 mt-16 flex flex-col gap-6">
            <p className="text-[17px] sm:text-[18px] font-medium leading-[1.35] tracking-[-0.015em]">
              <span className="block text-white/95">{taglinePrimary}</span>
              <span className="block text-white/55">{taglineSecondary}</span>
            </p>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span
                className="text-[17px] sm:text-[18px] leading-none text-white/85 italic tracking-[0.01em]"
                style={{
                  fontFamily:
                    "'Caveat', 'Bradley Hand', 'Segoe Script', cursive",
                }}
              >
                {socialPrompt}
              </span>

              <div className="flex items-center gap-1.5">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    aria-label={social.label ?? social.name}
                    whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 360, damping: 26 }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-[10px]",
                      "bg-[#1a1b1f] text-white/95 hover:bg-[#272930] hover:text-white",
                      "ring-1 ring-inset ring-white/12 shadow-[0_3px_8px_rgba(0,0,0,0.22)]",
                      "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c66db]"
                    )}
                  >
                    <SocialGlyph name={social.name} />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Navigation & Newsletter Card */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "lg:col-span-8 relative rounded-[22px] p-6 sm:p-8",
            "min-h-[320px] sm:min-h-[348px] flex flex-col justify-between",
            "bg-[#f3f3f4] dark:bg-[#141418]",
            "border border-black/[0.04] dark:border-white/[0.08]"
          )}
        >
          {/* Floating 3D Glossy Squircle Badge (Overlapping Top-Right Corner) */}
          {showFloatingBadge && (
            <div className="flex flex-col items-center absolute -top-7 right-5 sm:-top-10 sm:right-9 z-20">
              <motion.button
                type="button"
                onClick={handleLuckyTrigger}
                aria-label={`${badgeCaption} — click for a lucky workflow tip`}
                initial={{ rotate: -12 }}
                animate={{
                  rotate: prefersReducedMotion ? -12 : -12 + badgeSpin * 360,
                }}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : { scale: 1.06, rotate: -7 + badgeSpin * 360, y: -3 }
                }
                whileTap={
                  prefersReducedMotion
                    ? undefined
                    : { scale: 0.94, rotate: -15 + badgeSpin * 360 }
                }
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className={cn(
                  "group relative flex h-[78px] w-[78px] sm:h-[112px] sm:w-[112px] items-center justify-center rounded-[20px] sm:rounded-[26px]",
                  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#267df7] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                )}
                style={{
                  background:
                    "linear-gradient(145deg, #69beff 0%, #2a80f8 46%, #1248d8 100%)",
                  boxShadow:
                    "0 20px 30px -10px rgba(18, 72, 216, 0.44), 0 8px 14px -6px rgba(0, 0, 0, 0.16), inset 0 2.5px 4px rgba(255, 255, 255, 0.72), inset 0 -5px 10px rgba(7, 36, 134, 0.55)",
                  border: "1.5px solid rgba(255, 255, 255, 0.45)",
                }}
              >
                {/* Specular glass reflection */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[3px] rounded-[17px] sm:rounded-[22px] opacity-80"
                  style={{
                    background:
                      "linear-gradient(155deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,0) 60%)",
                  }}
                />
                {/* Large embossed white geometric brand mark */}
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  aria-hidden="true"
                  className="relative z-10 h-[48px] w-[48px] sm:h-[68px] sm:w-[68px] drop-shadow-[0_3px_6px_rgba(12,48,150,0.34)]"
                >
                  <defs>
                    <linearGradient
                      id={`badge-mark-${uid}`}
                      x1="6"
                      y1="4"
                      x2="34"
                      y2="36"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#dceaff" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M20 3.5C22.4 3.5 24.4 5.2 24.8 7.5L25.6 11.8C25.9 13.1 26.9 14.1 28.2 14.4L32.5 15.2C34.8 15.6 36.5 17.6 36.5 20C36.5 22.4 34.8 24.4 32.5 24.8L28.2 25.6C26.9 25.9 25.9 26.9 25.6 28.2L24.8 32.5C24.4 34.8 22.4 36.5 20 36.5C17.6 36.5 15.6 34.8 15.2 32.5L14.4 28.2C14.1 26.9 13.1 25.9 11.8 25.6L7.5 24.8C5.2 24.4 3.5 22.4 3.5 20C3.5 17.6 5.2 15.6 7.5 15.2L11.8 14.4C13.1 14.1 14.1 13.1 14.4 11.8L15.2 7.5C15.6 5.2 17.6 3.5 20 3.5Z"
                    fill={`url(#badge-mark-${uid})`}
                  />
                </svg>
              </motion.button>

              <span
                className="mt-2 sm:mt-2.5 text-[13px] sm:text-[15px] text-zinc-400 dark:text-zinc-500 italic leading-none -rotate-[11deg] tracking-[0.01em]"
                style={{
                  fontFamily:
                    "'Caveat', 'Bradley Hand', 'Segoe Script', cursive",
                }}
              >
                {badgeCaption}
              </span>

              <AnimatePresence mode="wait">
                {luckyIndex !== null && (
                  <motion.div
                    key={luckyIndex}
                    role="status"
                    aria-live="polite"
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.22 }}
                    className="mt-2 max-w-[210px] rounded-xl bg-white/95 dark:bg-zinc-900/95 px-3 py-1.5 text-center text-[11px] font-medium text-zinc-700 dark:text-zinc-200 shadow-md ring-1 ring-black/[0.06] dark:ring-white/10"
                  >
                    {LUCKY_FORTUNES[luckyIndex]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Top Navigation Columns */}
          <div className="flex flex-wrap gap-x-14 sm:gap-x-16 gap-y-8 pr-20 sm:pr-36">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title} className="min-w-[110px]">
                <h3
                  className="mb-3 text-[17px] text-zinc-500 dark:text-zinc-400 italic leading-none"
                  style={{
                    fontFamily:
                      "'Caveat', 'Bradley Hand', 'Segoe Script', cursive",
                  }}
                >
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className={cn(
                          "inline-block text-[14px] font-medium text-zinc-900 dark:text-zinc-100",
                          "hover:text-[#1557d0] dark:hover:text-[#6cb8ff] transition-colors duration-150",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1557d0] rounded-sm"
                        )}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Bottom Row: Copyright + Newsletter */}
          <div className="mt-10 flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-6">
            <p className="text-[11px] font-normal tabular-nums text-zinc-400 dark:text-zinc-500 leading-none pb-1">
              © {copyrightYear} {brandName}. All rights reserved.
            </p>

            <div className="w-full sm:w-auto sm:min-w-[300px] sm:max-w-[330px]">
              <div className="mb-3">
                <p className="text-[17px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-500 dark:text-zinc-400">
                  {newsletterEyebrow}
                </p>
                <p className="text-[17px] font-semibold leading-[1.3] tracking-[-0.02em] text-zinc-950 dark:text-white">
                  {resolvedNewsletterHeading}
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="relative">
                <label htmlFor={`email-${uid}`} className="sr-only">
                  {emailPlaceholder}
                </label>
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-[12px] p-1.5 pl-3.5",
                    "bg-white dark:bg-zinc-900",
                    "border transition-colors duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                    status === "error"
                      ? "border-red-400 dark:border-red-500/70"
                      : "border-black/[0.06] dark:border-white/[0.1] focus-within:border-[#267df7]/60"
                  )}
                >
                  <input
                    id={`email-${uid}`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status !== "idle") {
                        setStatus("idle");
                        setErrorMessage("");
                      }
                    }}
                    placeholder={emailPlaceholder}
                    disabled={status === "submitting"}
                    aria-invalid={status === "error"}
                    aria-describedby={
                      status === "error" || status === "success"
                        ? `email-msg-${uid}`
                        : undefined
                    }
                    className={cn(
                      "w-full min-w-0 bg-transparent text-[13px] text-zinc-900 dark:text-zinc-100",
                      "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                      "focus:outline-none disabled:opacity-60"
                    )}
                  />
                  <motion.button
                    type="submit"
                    disabled={status === "submitting"}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    className={cn(
                      "shrink-0 inline-flex items-center justify-center gap-1.5",
                      "rounded-[8px] px-4 py-2 text-[12.5px] font-medium text-white",
                      "bg-gradient-to-b from-[#2f3036] to-[#17181c] hover:from-[#3a3c44] hover:to-[#1f2026]",
                      "dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-950 dark:hover:from-white dark:hover:to-zinc-100",
                      "shadow-[0_2px_6px_rgba(0,0,0,0.18)] ring-1 ring-inset ring-white/10 dark:ring-black/10",
                      "transition-colors duration-150 cursor-pointer disabled:opacity-70",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#267df7] focus-visible:ring-offset-1"
                    )}
                  >
                    {status === "submitting" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : status === "success" ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Joined</span>
                      </>
                    ) : (
                      <span>{subscribeLabel}</span>
                    )}
                  </motion.button>
                </div>

                <div
                  id={`email-msg-${uid}`}
                  aria-live="polite"
                  className="min-h-[16px] mt-1 pl-1"
                >
                  {status === "error" && errorMessage && (
                    <p className="text-[11px] font-medium text-red-500 dark:text-red-400">
                      {errorMessage}
                    </p>
                  )}
                  {status === "success" && (
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      You&apos;re on the list! Welcome to {brandName}.
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Oversized Full-Width Watermark Wordmark */}
      {showWatermark && (
        <div
          aria-hidden="true"
          className="pointer-events-none select-none overflow-hidden w-full mt-0.5"
          style={{ containerType: "inline-size" }}
        >
          <div
            className={cn(
              "w-full text-center font-bold tracking-[-0.045em] leading-[0.82] whitespace-nowrap",
              "bg-gradient-to-b from-zinc-200/80 via-zinc-200/55 to-zinc-100/35",
              "dark:from-white/[0.08] dark:via-white/[0.045] dark:to-white/[0.015]",
              "bg-clip-text text-transparent"
            )}
            style={{
              fontSize: "clamp(4.5rem, 29cqi, 18.5rem)",
            }}
          >
            {brandName}
          </div>
        </div>
      )}
    </footer>
  );
});

BentoBrandFooter.displayName = "BentoBrandFooter";

export { BentoBrandFooter as component, BentoBrandFooter as Component };
export default BentoBrandFooter;
