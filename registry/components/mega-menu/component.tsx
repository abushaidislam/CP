"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  Variants,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Github,
  Menu,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

// --------------------------------------------------
// 1. Data Structures matching exact Medusa UI
// --------------------------------------------------

interface MenuLink {
  title: string;
  href: string;
}

interface MenuColumn {
  heading: string;
  description: string;
  links: MenuLink[];
}

interface MenuContent {
  columns: MenuColumn[];
  featuredCard?: {
    category: string;
    title: string;
    href: string;
  };
}

type MenuKey = "product" | "resources";

const MENU_CONFIG: Record<MenuKey, { index: number; content: MenuContent }> = {
  product: {
    index: 0,
    content: {
      columns: [
        {
          heading: "Medusa Commerce",
          description: "Everything you need to build custom commerce applications.",
          links: [
            { title: "Commerce", href: "#" },
            { title: "Framework", href: "#" },
            { title: "Admin", href: "#" },
            { title: "Starters", href: "#" },
            { title: "Integrations", href: "#" },
          ],
        },
        {
          heading: "Medusa Cloud",
          description: "Your go-to solution for reliable commerce infrastructure.",
          links: [
            { title: "Storefront & backend hosting", href: "#" },
            { title: "Autoscaling", href: "#" },
            { title: "Previews", href: "#" },
            { title: "Pre-production environments", href: "#" },
          ],
        },
        {
          heading: "Cloud services",
          description: "Features purpose-built for scalable commerce.",
          links: [
            { title: "Cache", href: "#" },
            { title: "Emails", href: "#" },
            { title: "RBAC, SSO", href: "#" },
            { title: "Search", href: "#" },
          ],
        },
        {
          heading: "Agents",
          description: "Build Medusa applications with coding agents.",
          links: [
            { title: "Quickstart", href: "#" },
            { title: "MCP server", href: "#" },
            { title: "Skills", href: "#" },
            { title: "Cloud CLI", href: "#" },
            { title: "Platform migration", href: "#" },
          ],
        },
      ],
    },
  },
  resources: {
    index: 1,
    content: {
      columns: [
        {
          heading: "Solutions",
          description: "Tooling to support any use case.",
          links: [
            { title: "B2C", href: "#" },
            { title: "B2B", href: "#" },
            { title: "Marketplaces", href: "#" },
            { title: "Distributors", href: "#" },
          ],
        },
        {
          heading: "Explore",
          description: "Learn more about building with Medusa.",
          links: [
            { title: "Blog", href: "#" },
            { title: "Case studies", href: "#" },
            { title: "User guides", href: "#" },
            { title: "Medusa Experts", href: "#" },
          ],
        },
        {
          heading: "Ecosystem",
          description: "Built by developers for developers.",
          links: [
            { title: "Documentation", href: "#" },
            { title: "Changelog", href: "#" },
            { title: "Open-source repository", href: "#" },
            { title: "Community", href: "#" },
          ],
        },
      ],
      featuredCard: {
        category: "Blog",
        title: "Medusa Security is a new suite of...",
        href: "#",
      },
    },
  },
};

// --------------------------------------------------
// 2. Animation Variants
// --------------------------------------------------

// শাটার রিলিজ (শুধুমাত্র প্রথমবার ওপেন ও ক্লোজ হওয়ার জন্য)
const shutterVariants: Variants = {
  hidden: {
    clipPath: "inset(0% 0% 100% 0%)",
    opacity: 0.9,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 1, 1],
    },
  },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    opacity: 1,
    transition: {
      duration: 0.34,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    clipPath: "inset(0% 0% 100% 0%)",
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.6, 1],
    },
  },
};

// এক মেনু থেকে আরেক মেনুতে যাওয়ার ডিরেকশন-অ্যাওয়ার মরফিং ট্রানজিশন
const morphVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 35 : -35,
    opacity: 0,
    filter: "blur(3px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      x: { type: "spring", stiffness: 380, damping: 32 },
      opacity: { duration: 0.2 },
      filter: { duration: 0.2 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -35 : 35,
    opacity: 0,
    filter: "blur(3px)",
    transition: {
      x: { type: "spring", stiffness: 380, damping: 32 },
      opacity: { duration: 0.16 },
      filter: { duration: 0.16 },
    },
  }),
};

// --------------------------------------------------
// 3. Sub-Components
// --------------------------------------------------

function MedusaSecurityPreviewCard({
  category,
  title,
  href,
}: {
  category: string;
  title: string;
  href: string;
}) {
  return (
    <a href={href} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/90 bg-[#f9fafb] p-3 transition-all duration-200 hover:border-neutral-300 hover:shadow-sm">
        {/* Mock UI Canvas matching screenshot */}
        <div className="relative h-[120px] w-full overflow-hidden rounded-lg border border-neutral-200/70 bg-white p-3 shadow-xs">
          <div className="mb-2.5 flex items-center justify-between border-b border-neutral-100 pb-1.5">
            <span className="text-[11.5px] font-semibold tracking-tight text-neutral-900">
              Medusa Security
            </span>
            <span className="text-[9px] text-neutral-400">Available on all plans</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div className="col-span-1 rounded-md bg-blue-600 p-2 text-white">
              <Shield size={12} className="mb-2 text-white/80" />
              <div className="text-[8.5px] font-medium leading-tight">
                Medusa Instant Protection
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-1.5">
              <div className="rounded border border-neutral-100 bg-neutral-50/70 p-1.5">
                <span className="text-[8px] font-medium text-neutral-700">
                  Basic Protection
                </span>
              </div>
              <div className="rounded border border-neutral-100 bg-neutral-50/70 p-1.5">
                <span className="text-[8px] font-medium text-neutral-700">
                  DDoS protection
                </span>
              </div>
              <div className="col-span-2 rounded border border-neutral-100 bg-neutral-50/70 p-1.5">
                <span className="text-[8px] font-medium text-neutral-700">
                  Database IP allowlist
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Text Info */}
        <div className="mt-3">
          <span className="text-[11px] font-medium text-neutral-400">
            {category}
          </span>
          <p className="mt-0.5 text-[13px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 transition-colors group-hover:text-black">
            {title}
          </p>
        </div>
      </div>
    </a>
  );
}

// --------------------------------------------------
// 4. Main Nav Component with Directional Morphing
// --------------------------------------------------

export default function MedusaNavbarMorph() {
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [direction, setDirection] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const prevMenuRef = useRef<MenuKey | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuId = useId();
  const prefersReducedMotion = useReducedMotion();

  const handleMouseEnter = (nextMenu: MenuKey) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (activeMenu && activeMenu !== nextMenu) {
      const prevIdx = MENU_CONFIG[activeMenu].index;
      const nextIdx = MENU_CONFIG[nextMenu].index;
      setDirection(nextIdx > prevIdx ? 1 : -1);
    } else {
      setDirection(0);
    }

    prevMenuRef.current = activeMenu;
    setActiveMenu(nextMenu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
      prevMenuRef.current = null;
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const currentConfig = activeMenu ? MENU_CONFIG[activeMenu] : null;

  return (
    <div className="relative w-full min-h-[720px] overflow-hidden rounded-xl border border-neutral-200/80 bg-white font-sans text-neutral-950 antialiased selection:bg-neutral-200">
      <header
        onMouseLeave={handleMouseLeave}
        className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md"
      >
        {/* Navigation Bar Header Row */}
        <div className="mx-auto flex h-[58px] max-w-[1240px] items-center justify-between px-6">
          <div className="flex h-full items-center gap-8">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 rounded-sm">
              <svg
                width="26"
                height="26"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
                className="text-neutral-950"
              >
                <circle cx="16" cy="16" r="15" fill="currentColor" />
                <circle cx="16" cy="16" r="6" fill="white" />
              </svg>
            </a>

            {/* Desktop Navigation Links */}
            <nav
              aria-label="Main navigation"
              className="hidden h-full items-center gap-1.5 md:flex"
            >
              {(["product", "resources"] as MenuKey[]).map((menu) => {
                const isOpen = activeMenu === menu;
                return (
                  <div
                    key={menu}
                    className="relative py-2.5"
                    onMouseEnter={() => handleMouseEnter(menu)}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${menuId}-${menu}`}
                      onClick={() =>
                        setActiveMenu(isOpen ? null : menu)
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13.5px] font-[450] tracking-[-0.015em] transition-all duration-150 focus:outline-none ${
                        isOpen
                          ? "text-neutral-950 bg-neutral-100/70"
                          : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
                      }`}
                    >
                      <span className="capitalize">{menu}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ChevronDown
                          size={12}
                          strokeWidth={2}
                          className="text-neutral-400"
                        />
                      </motion.span>
                    </button>
                  </div>
                );
              })}

              <a
                href="#enterprise"
                onMouseEnter={() => setActiveMenu(null)}
                className="rounded-md px-3 py-1.5 text-[13.5px] font-[450] tracking-[-0.015em] text-neutral-600 transition-all duration-150 hover:bg-neutral-50 hover:text-neutral-950"
              >
                Enterprise
              </a>

              <a
                href="#pricing"
                onMouseEnter={() => setActiveMenu(null)}
                className="rounded-md px-3 py-1.5 text-[13.5px] font-[450] tracking-[-0.015em] text-neutral-600 transition-all duration-150 hover:bg-neutral-50 hover:text-neutral-950"
              >
                Pricing
              </a>

              <a
                href="#documentation"
                onMouseEnter={() => setActiveMenu(null)}
                className="rounded-md px-3 py-1.5 text-[13.5px] font-[450] tracking-[-0.015em] text-neutral-600 transition-all duration-150 hover:bg-neutral-50 hover:text-neutral-950"
              >
                Documentation
              </a>
            </nav>
          </div>

          {/* Right Action Stack */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="https://github.com/medusajs/medusa"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-neutral-200/90 px-2.5 py-1 text-[12.5px] font-[450] text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-neutral-300 hover:bg-neutral-50"
            >
              <Github size={13.5} strokeWidth={2} />
              <span className="font-mono text-[11.5px] tabular-nums text-neutral-800">
                37.1k
              </span>
            </a>

            <a
              href="#demo"
              className="rounded-md px-3 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-neutral-700 transition-colors duration-150 hover:bg-neutral-100/60 hover:text-neutral-950"
            >
              View demo
            </a>

            <a
              href="#start"
              className="rounded-md bg-neutral-950 px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.015em] text-white shadow-sm transition-all duration-150 hover:bg-neutral-800 active:scale-[0.985]"
            >
              Start for free
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 md:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* --------------------------------------------------
            Morphing Shutter Shell:
            The outer container does NOT re-render on activeMenu switch.
            It stays open and morphs content inside.
        --------------------------------------------------- */}
        <AnimatePresence>
          {activeMenu && (
            <motion.div
              key="persistent-shutter-shell"
              initial={prefersReducedMotion ? { opacity: 0 } : "hidden"}
              animate={prefersReducedMotion ? { opacity: 1 } : "visible"}
              exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
              variants={shutterVariants}
              onMouseEnter={() => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
              }}
              onMouseLeave={handleMouseLeave}
              className="absolute left-0 top-full hidden w-full overflow-hidden border-b border-neutral-200/80 bg-white shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] md:block"
            >
              <motion.div
                layout="position"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto max-w-[1240px] px-6 pb-9 pt-7"
              >
                {/* Direction-Aware Morphing Inner Track */}
                <div className="relative min-h-[220px]">
                  <AnimatePresence
                    mode="popLayout"
                    custom={direction}
                    initial={false}
                  >
                    {currentConfig && (
                      <motion.div
                        key={activeMenu}
                        custom={direction}
                        variants={morphVariants}
                        initial={direction === 0 ? false : "enter"}
                        animate="center"
                        exit="exit"
                        className="grid grid-cols-4 gap-x-12"
                      >
                        {currentConfig.content.columns.map((column) => (
                          <div key={column.heading} className="min-w-0">
                            <h3 className="text-[13px] font-semibold tracking-[-0.02em] text-neutral-950">
                              {column.heading}
                            </h3>
                            <p className="mt-1.5 max-w-[240px] text-[12px] leading-[1.6] tracking-[-0.01em] text-neutral-500">
                              {column.description}
                            </p>

                            <ul className="mt-4 space-y-1.5">
                              {column.links.map((link) => (
                                <li key={link.title}>
                                  <a
                                    href={link.href}
                                    className="block text-[13px] font-normal tracking-[-0.015em] text-neutral-600 transition-colors duration-150 hover:text-neutral-950"
                                  >
                                    {link.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {currentConfig.content.featuredCard && (
                          <div className="min-w-0">
                            <MedusaSecurityPreviewCard
                              category={currentConfig.content.featuredCard.category}
                              title={currentConfig.content.featuredCard.title}
                              href={currentConfig.content.featuredCard.href}
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 21st.dev Mock Showcase Area */}
      <main className="relative mx-auto flex max-w-[1240px] flex-col items-center px-6 pb-28 pt-20 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[580px] -translate-x-1/2 rounded-full bg-gradient-to-b from-neutral-100 to-transparent blur-3xl opacity-60" />

        <div className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-neutral-50 px-3 py-1 text-[12px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <Sparkles size={13} className="text-neutral-500" />
          <span>Medusa Continuous Shutter Morph</span>
          <ArrowRight size={12} className="text-neutral-400" />
        </div>

        <h1 className="relative max-w-[760px] text-4xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
          Build and operate your commerce stack with agents.
        </h1>

        <p className="relative mt-5 max-w-[540px] text-[15px] leading-relaxed tracking-[-0.01em] text-neutral-500">
          Hover between <span className="font-medium text-neutral-900">Product</span> and{" "}
          <span className="font-medium text-neutral-900">Resources</span> to experience the fluid directional morph without shutter collapse.
        </p>

        <div className="relative mt-8 flex items-center gap-3">
          <a
            href="#get-started"
            className="flex items-center gap-1.5 rounded-lg bg-neutral-950 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all duration-150 hover:bg-neutral-800 active:scale-[0.98]"
          >
            <span>Get Started</span>
            <ArrowRight size={13} />
          </a>
          <a
            href="#docs"
            className="rounded-lg border border-neutral-200/90 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition-all duration-150 hover:border-neutral-300 hover:bg-neutral-50"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}