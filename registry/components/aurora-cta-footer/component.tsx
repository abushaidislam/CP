"use client";

import React, { useId, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export interface FooterLinkItem {
  label: string;
  href: string;
}

export interface FooterLinkColumn {
  title: string;
  links: FooterLinkItem[];
}

export interface AuroraCtaFooterProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSubmit"> {
  headline?: string;
  subheadline?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  brandName?: string;
  newsletterHeading?: string;
  newsletterPlaceholder?: string;
  newsletterButtonLabel?: string;
  consentPrefix?: string;
  privacyPolicyLabel?: string;
  privacyPolicyHref?: string;
  consentSuffix?: string;
  copyrightText?: string;
  columns?: FooterLinkColumn[];
  theme?: "auto" | "light" | "dark";
  onPrimaryCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
  onNewsletterSubmit?: (email: string) => void | Promise<void>;
  onLinkClick?: (item: FooterLinkItem, columnTitle: string) => void;
}

const DEFAULT_COLUMNS: FooterLinkColumn[] = [
  {
    title: "Care Plans",
    links: [
      { label: "Sexual Health", href: "#sexual-health" },
      { label: "Weight Loss", href: "#weight-loss" },
      { label: "Travel Kit", href: "#travel-kit" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Blogs", href: "#blogs" },
      { label: "Research & Education", href: "#research-education" },
      { label: "Certifications", href: "#certifications" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Providers", href: "#providers" },
      { label: "About Us", href: "#about-us" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ's", href: "#faqs" },
      { label: "Contact Us", href: "#contact-us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "#terms" },
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Risk & Benefits", href: "#risk-benefits" },
      { label: "Telehealth Consent", href: "#telehealth-consent" },
      { label: "Prescription Policy", href: "#prescription-policy" },
    ],
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StarburstMark({ className }: { className?: string }) {
  const spokes = Array.from({ length: 12 }, (_, idx) => idx * 30);
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={cn("h-[26px] w-[26px] shrink-0", className)}
    >
      {spokes.map((angle) => (
        <rect
          key={angle}
          x="12.7"
          y="2"
          width="2.6"
          height="6.4"
          rx="1.3"
          fill="currentColor"
          transform={`rotate(${angle} 14 14)`}
        />
      ))}
    </svg>
  );
}

export const AuroraCtaFooter = React.forwardRef<HTMLElement, AuroraCtaFooterProps>(
  function AuroraCtaFooter(
    {
      headline = "Ready to Take Control\nof Your Health?",
      subheadline = "Get expert care for weight loss, sexual health, wellness, and more — all from the comfort of home, no insurance needed.",
      primaryCtaLabel = "Start Now",
      secondaryCtaLabel = "Contact Us",
      brandName = "Nietzsche",
      newsletterHeading = "Sign up to receive health tips.",
      newsletterPlaceholder = "Enter your email",
      newsletterButtonLabel = "Submit",
      consentPrefix = "By subscribing you agree to our ",
      privacyPolicyLabel = "Privacy Policy",
      privacyPolicyHref = "#privacy",
      consentSuffix = " and provide consent to receive updates from our company.",
      copyrightText = "© 2025 joey med, All rights reserved.",
      columns = DEFAULT_COLUMNS,
      theme = "auto",
      onPrimaryCtaClick,
      onSecondaryCtaClick,
      onNewsletterSubmit,
      onLinkClick,
      className,
      ...rest
    },
    ref
  ) {
    const rawId = useId();
    const safeId = rawId.replace(/:/g, "");
    const emailInputId = `aurora-footer-email-${safeId}`;
    const emailStatusId = `aurora-footer-status-${safeId}`;
    const headingId = `aurora-footer-heading-${safeId}`;

    const prefersReducedMotion = useReducedMotion();

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");
    const [activeActionNote, setActiveActionNote] = useState<string | null>(null);

    const isForcedDark = theme === "dark";
    const isForcedLight = theme === "light";

    const headlineLines = headline.split("\n");

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = email.trim();

      if (!trimmed) {
        setStatus("error");
        setStatusMessage("Please enter an email address.");
        return;
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        setStatus("error");
        setStatusMessage("Please enter a valid email address.");
        return;
      }

      setStatus("submitting");
      setStatusMessage("");

      try {
        if (onNewsletterSubmit) {
          await onNewsletterSubmit(trimmed);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 420));
        }
        setStatus("success");
        setStatusMessage("You're subscribed to health tips.");
        setEmail("");
      } catch {
        setStatus("error");
        setStatusMessage("Something went wrong. Please try again.");
      }
    };

    const handlePrimaryClick = () => {
      if (onPrimaryCtaClick) {
        onPrimaryCtaClick();
      } else {
        setActiveActionNote("Starting your care assessment...");
        setTimeout(() => setActiveActionNote(null), 2600);
      }
    };

    const handleSecondaryClick = () => {
      if (onSecondaryCtaClick) {
        onSecondaryCtaClick();
      } else {
        setActiveActionNote("Opening support contact options...");
        setTimeout(() => setActiveActionNote(null), 2600);
      }
    };

    const easeCurve = [0.22, 1, 0.36, 1] as const;

    return (
      <section
        ref={ref}
        aria-labelledby={headingId}
        className={cn(
          "relative w-full max-w-[1182px] mx-auto overflow-hidden rounded-[28px]",
          "font-['Plus_Jakarta_Sans',Inter,system-ui,sans-serif] antialiased selection:bg-[#2456db]/20 selection:text-[#141821]",
          "border shadow-[0_18px_50px_-20px_rgba(15,23,42,0.12)]",
          isForcedDark && "dark bg-[#090e1c] border-white/10 text-slate-50",
          isForcedLight && "bg-[#f3f8ff] border-white/80 text-[#141821]",
          !isForcedDark &&
            !isForcedLight &&
            "bg-[#f3f8ff] dark:bg-[#090e1c] border-white/80 dark:border-white/10 text-[#141821] dark:text-slate-50",
          className
        )}
        {...rest}
      >
        {/* Atmospheric pastel aurora backdrop (light) */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            isForcedDark && "hidden",
            !isForcedDark && !isForcedLight && "dark:hidden"
          )}
          style={{
            background: [
              "radial-gradient(62% 72% at 6% 88%, rgba(196, 212, 253, 0.92) 0%, rgba(196, 212, 253, 0) 70%)",
              "radial-gradient(60% 70% at 96% 86%, rgba(191, 245, 255, 0.95) 0%, rgba(191, 245, 255, 0) 70%)",
              "radial-gradient(56% 52% at 50% 42%, rgba(224, 242, 254, 0.72) 0%, rgba(244, 249, 255, 0) 75%)",
              "linear-gradient(180deg, #f3f7ff 0%, #eaf3fe 44%, #d5e6fc 100%)",
            ].join(", "),
          }}
        />

        {/* Atmospheric midnight aurora backdrop (dark) */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            isForcedLight && "hidden",
            !isForcedDark && !isForcedLight && "hidden dark:block"
          )}
          style={{
            background: [
              "radial-gradient(60% 70% at 8% 88%, rgba(59, 91, 219, 0.32) 0%, rgba(15, 23, 42, 0) 70%)",
              "radial-gradient(58% 68% at 94% 86%, rgba(14, 165, 233, 0.26) 0%, rgba(15, 23, 42, 0) 70%)",
              "radial-gradient(50% 48% at 50% 30%, rgba(30, 58, 138, 0.22) 0%, rgba(9, 14, 28, 0) 72%)",
              "linear-gradient(180deg, #090e1c 0%, #0d152a 50%, #0b1325 100%)",
            ].join(", "),
          }}
        />

        {/* Upper Hero CTA Section */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-14 sm:pt-20 sm:pb-16 md:pt-24 md:pb-20">
          <motion.h2
            id={headingId}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.48, ease: easeCurve }}
            className={cn(
              "max-w-[680px] text-[32px] sm:text-[42px] md:text-[48px] font-normal leading-[1.12] tracking-[-0.032em]",
              isForcedDark && "text-slate-50",
              isForcedLight && "text-[#141821]",
              !isForcedDark && !isForcedLight && "text-[#141821] dark:text-slate-50"
            )}
          >
            {headlineLines.map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < headlineLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </motion.h2>

          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.48, delay: 0.06, ease: easeCurve }}
            className={cn(
              "mt-4 max-w-[445px] text-[13px] sm:text-[14px] leading-[1.55] font-normal",
              isForcedDark && "text-slate-300",
              isForcedLight && "text-[#515966]",
              !isForcedDark && !isForcedLight && "text-[#515966] dark:text-slate-300"
            )}
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.48, delay: 0.12, ease: easeCurve }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3.5"
          >
            <motion.button
              type="button"
              onClick={handlePrimaryClick}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={cn(
                "inline-flex h-[40px] items-center justify-center rounded-full px-5",
                "bg-gradient-to-b from-[#2f66f5] to-[#2050d8] hover:from-[#386ef7] hover:to-[#2456db]",
                "text-[13px] font-medium tracking-[-0.01em] text-white",
                "shadow-[0_6px_18px_-3px_rgba(36,86,219,0.5),inset_0_1px_0_rgba(255,255,255,0.28)]",
                "ring-4 ring-white/40 dark:ring-white/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2456db] focus-visible:ring-offset-2",
                "cursor-pointer transition-shadow duration-150"
              )}
            >
              {primaryCtaLabel}
            </motion.button>

            <motion.button
              type="button"
              onClick={handleSecondaryClick}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={cn(
                "inline-flex h-[40px] items-center justify-center rounded-full px-5",
                "text-[13px] font-medium tracking-[-0.01em]",
                "cursor-pointer transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2456db] focus-visible:ring-offset-2",
                isForcedDark &&
                  "bg-white/10 hover:bg-white/15 text-slate-100 border border-white/15 ring-4 ring-white/5",
                isForcedLight &&
                  "bg-white/95 hover:bg-white text-[#1d2330] border border-[#e3eaf2] shadow-[0_4px_14px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] ring-4 ring-white/35",
                !isForcedDark &&
                  !isForcedLight &&
                  "bg-white/95 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-[#1d2330] dark:text-slate-100 border border-[#e3eaf2] dark:border-white/15 shadow-[0_4px_14px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none ring-4 ring-white/35 dark:ring-white/5"
              )}
            >
              {secondaryCtaLabel}
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {activeActionNote && (
              <motion.p
                role="status"
                aria-live="polite"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -2 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "mt-3 text-[12px] font-medium",
                  isForcedDark && "text-sky-300",
                  isForcedLight && "text-[#2456db]",
                  !isForcedDark && !isForcedLight && "text-[#2456db] dark:text-sky-300"
                )}
              >
                {activeActionNote}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Lower Floating Frosted Glass Footer Card */}
        <div className="relative z-10 px-3.5 pb-3.5 sm:px-5 sm:pb-5">
          <footer
            className={cn(
              "relative z-10 rounded-[22px] sm:rounded-[24px] backdrop-blur-xl",
              "px-6 pt-8 pb-6 sm:px-10 sm:pt-9 sm:pb-6 transition-colors duration-200",
              isForcedDark &&
                "bg-[#0f172a]/82 border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.4)]",
              isForcedLight &&
                "bg-white/84 border border-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
              !isForcedDark &&
                !isForcedLight &&
                "bg-white/84 dark:bg-[#0f172a]/82 border border-white/90 dark:border-white/10 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)]"
            )}
          >
            {/* Brand Lockup */}
            <div className="flex items-center gap-2.5">
              <StarburstMark
                className={cn(
                  isForcedDark && "text-white",
                  isForcedLight && "text-[#111622]",
                  !isForcedDark && !isForcedLight && "text-[#111622] dark:text-white"
                )}
              />
              <span
                className={cn(
                  "text-[18px] font-semibold tracking-[-0.025em]",
                  isForcedDark && "text-white",
                  isForcedLight && "text-[#111622]",
                  !isForcedDark && !isForcedLight && "text-[#111622] dark:text-white"
                )}
              >
                {brandName}
              </span>
            </div>

            {/* Newsletter + 5-Column Navigation Grid */}
            <div className="mt-7 sm:mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(265px,305px)_1fr] lg:gap-12">
              {/* Newsletter Column */}
              <div>
                <label
                  htmlFor={emailInputId}
                  className={cn(
                    "block text-[13px] font-medium tracking-[-0.01em]",
                    isForcedDark && "text-slate-100",
                    isForcedLight && "text-[#181c25]",
                    !isForcedDark && !isForcedLight && "text-[#181c25] dark:text-slate-100"
                  )}
                >
                  {newsletterHeading}
                </label>

                <form
                  onSubmit={handleFormSubmit}
                  noValidate
                  className="mt-3.5"
                >
                  <div
                    className={cn(
                      "flex items-center rounded-full p-1 pl-4 transition-colors duration-150",
                      "border focus-within:ring-2",
                      status === "error"
                        ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/20"
                        : isForcedDark
                          ? "bg-white/5 border-white/15 focus-within:border-sky-400/70 focus-within:ring-sky-400/20"
                          : isForcedLight
                            ? "bg-white/65 border-[#ccd5e1] focus-within:border-[#2456db] focus-within:ring-[#2456db]/15"
                            : "bg-white/65 dark:bg-white/5 border-[#ccd5e1] dark:border-white/15 focus-within:border-[#2456db] dark:focus-within:border-sky-400/70 focus-within:ring-[#2456db]/15 dark:focus-within:ring-sky-400/20"
                    )}
                  >
                    <input
                      id={emailInputId}
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status !== "idle") {
                          setStatus("idle");
                          setStatusMessage("");
                        }
                      }}
                      placeholder={newsletterPlaceholder}
                      aria-invalid={status === "error"}
                      aria-describedby={statusMessage ? emailStatusId : undefined}
                      className={cn(
                        "w-full min-w-0 bg-transparent text-[12.5px] outline-none",
                        isForcedDark && "text-slate-100 placeholder:text-slate-400",
                        isForcedLight && "text-[#181c25] placeholder:text-[#6f7784]",
                        !isForcedDark &&
                          !isForcedLight &&
                          "text-[#181c25] dark:text-slate-100 placeholder:text-[#6f7784] dark:placeholder:text-slate-400"
                      )}
                    />
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className={cn(
                        "ml-2 inline-flex h-[34px] shrink-0 items-center justify-center gap-1.5 rounded-full px-4",
                        "text-[12.5px] font-medium transition-colors duration-150 cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2456db] focus-visible:ring-offset-1",
                        "disabled:opacity-70 disabled:cursor-not-allowed",
                        isForcedDark &&
                          "bg-white text-[#0f172a] hover:bg-slate-200 shadow-[0_2px_10px_rgba(255,255,255,0.12)]",
                        isForcedLight &&
                          "bg-[#101522] text-white hover:bg-[#1e2638] shadow-[0_2px_10px_rgba(16,21,34,0.22)]",
                        !isForcedDark &&
                          !isForcedLight &&
                          "bg-[#101522] dark:bg-white text-white dark:text-[#0f172a] hover:bg-[#1e2638] dark:hover:bg-slate-200 shadow-[0_2px_10px_rgba(16,21,34,0.22)] dark:shadow-[0_2px_10px_rgba(255,255,255,0.12)]"
                      )}
                    >
                      {status === "submitting" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : status === "success" ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Joined</span>
                        </>
                      ) : (
                        newsletterButtonLabel
                      )}
                    </button>
                  </div>

                  {statusMessage && (
                    <p
                      id={emailStatusId}
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "mt-2 text-[11.5px] font-medium",
                        status === "error"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {statusMessage}
                    </p>
                  )}
                </form>

                <p
                  className={cn(
                    "mt-3 text-[11px] leading-[1.48]",
                    isForcedDark && "text-slate-400",
                    isForcedLight && "text-[#5f6875]",
                    !isForcedDark && !isForcedLight && "text-[#5f6875] dark:text-slate-400"
                  )}
                >
                  {consentPrefix}
                  <a
                    href={privacyPolicyHref}
                    onClick={(e) => {
                      if (onLinkClick) {
                        e.preventDefault();
                        onLinkClick(
                          { label: privacyPolicyLabel, href: privacyPolicyHref },
                          "Legal"
                        );
                      }
                    }}
                    className={cn(
                      "underline decoration-current/40 underline-offset-2 transition-colors duration-150 hover:decoration-current",
                      isForcedDark && "text-slate-200 hover:text-white",
                      isForcedLight && "text-[#323a46] hover:text-[#2456db]",
                      !isForcedDark &&
                        !isForcedLight &&
                        "text-[#323a46] dark:text-slate-200 hover:text-[#2456db] dark:hover:text-white"
                    )}
                  >
                    {privacyPolicyLabel}
                  </a>
                  {consentSuffix}
                </p>
              </div>

              {/* Navigation Link Columns */}
              <nav
                aria-label="Footer navigation"
                className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 md:grid-cols-5 lg:pl-10"
              >
                {columns.map((column) => (
                  <div key={column.title}>
                    <h3
                      className={cn(
                        "text-[12px] font-normal tracking-[-0.005em]",
                        isForcedDark && "text-slate-400",
                        isForcedLight && "text-[#6b7280]",
                        !isForcedDark && !isForcedLight && "text-[#6b7280] dark:text-slate-400"
                      )}
                    >
                      {column.title}
                    </h3>
                    <ul className="mt-3.5 space-y-2.5">
                      {column.links.map((item) => (
                        <li key={item.label}>
                          <a
                            href={item.href}
                            onClick={(e) => {
                              if (onLinkClick) {
                                e.preventDefault();
                                onLinkClick(item, column.title);
                              }
                            }}
                            className={cn(
                              "inline-block text-[12.5px] font-medium leading-[1.35] transition-colors duration-150",
                              "focus-visible:outline-none focus-visible:underline",
                              isForcedDark && "text-slate-200 hover:text-sky-300",
                              isForcedLight && "text-[#1d2330] hover:text-[#2456db]",
                              !isForcedDark &&
                                !isForcedLight &&
                                "text-[#1d2330] dark:text-slate-200 hover:text-[#2456db] dark:hover:text-sky-300"
                            )}
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            {/* Bottom Copyright Bar */}
            <div
              className={cn(
                "mt-9 border-t pt-5 text-center",
                isForcedDark && "border-white/10",
                isForcedLight && "border-[#e2e8f0]/85",
                !isForcedDark && !isForcedLight && "border-[#e2e8f0]/85 dark:border-white/10"
              )}
            >
              <p
                className={cn(
                  "text-[11.5px] font-normal tabular-nums",
                  isForcedDark && "text-slate-400",
                  isForcedLight && "text-[#6b7280]",
                  !isForcedDark && !isForcedLight && "text-[#6b7280] dark:text-slate-400"
                )}
              >
                {copyrightText}
              </p>
            </div>
          </footer>
        </div>
      </section>
    );
  }
);

AuroraCtaFooter.displayName = "AuroraCtaFooter";

export { AuroraCtaFooter as component, AuroraCtaFooter as Component };
export default AuroraCtaFooter;