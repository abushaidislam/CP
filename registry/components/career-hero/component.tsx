"use client";

import React, {
  useState,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --------------------------------------------------------------------------
// Types & Interfaces (21st.dev Component Standards)
// --------------------------------------------------------------------------
export interface PhotoItem {
  src: string;
  alt: string;
  width: number;
  height: number;
  rotation?: number;
}

export interface TeamAvatar {
  name: string;
  src: string;
}

export type PhotoCoordinate = [string, string, number];

export interface CareersHeroProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  teamLinkText?: string;
  teamLinkHref?: string;
  photos?: PhotoItem[];
  coords?: PhotoCoordinate[];
  teamAvatars?: TeamAvatar[];
}

// --------------------------------------------------------------------------
// 1:1 Exact Coordinates & Photo Data (Syed Original Layout)
// --------------------------------------------------------------------------
export const DEFAULT_COORDS: PhotoCoordinate[] = [
  ["-118%", "-48%", -4], // 1. Far left portrait (Sunset)
  ["-78%", "-78%", -3],  // 2. Top-left landscape (Foliage)
  ["-2%", "-16%", -2],   // 3. Bottom-right background (Beach)
  ["-104%", "-44%", 1],  // 4. Mid-left landscape (Working indoors)
  ["-82%", "-12%", -4],  // 5. Bottom-left foreground (Kayaking)
  ["-44%", "-50%", 3],   // 6. Center landscape (Board game / Catan)
  ["-38%", "-96%", 0],   // 7. Top-center landscape (Hiking)
  ["-4%", "-80%", 2],    // 8. Top-right landscape (Team chatting)
  ["14%", "-50%", 3],    // 9. Front-right landscape (Patio dinner table)
];

export const DEFAULT_PHOTOS: PhotoItem[] = [
  {
    src: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80",
    alt: "Sunset on the beach",
    width: 200,
    height: 260,
    rotation: -4,
  },
  {
    src: "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=600&q=80",
    alt: "Tropical foliage",
    width: 300,
    height: 200,
    rotation: -3,
  },
  {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    alt: "Sandy beach",
    width: 300,
    height: 200,
    rotation: -2,
  },
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
    alt: "Team working together",
    width: 300,
    height: 200,
    rotation: 1,
  },
  {
    src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    alt: "Team kayaking",
    width: 300,
    height: 200,
    rotation: -4,
  },
  {
    src: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80",
    alt: "Playing board games",
    width: 300,
    height: 200,
    rotation: 3,
  },
  {
    src: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80",
    alt: "Team hiking",
    width: 300,
    height: 200,
    rotation: 0,
  },
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
    alt: "Team chatting outdoors",
    width: 300,
    height: 200,
    rotation: 2,
  },
  {
    src: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80",
    alt: "Team dinner meeting",
    width: 300,
    height: 200,
    rotation: 3,
  },
];

export const DEFAULT_TEAM_AVATARS: TeamAvatar[] = [
  { name: "Steven Tey", src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" },
  { name: "Marcus Farrell", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" },
  { name: "Pedro Ladeira", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80" },
  { name: "Rafi Hasan", src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&h=100&q=80" },
  { name: "Kiran Krishnan", src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80" },
];

// --------------------------------------------------------------------------
// CareersHero Component
// --------------------------------------------------------------------------
export function CareersHero({
  title = "Careers at Syed",
  subtitle = "We are a global, fully remote team on a mission to reimagine marketing attribution for the modern web.",
  ctaText = "View open roles",
  ctaHref = "#open-roles",
  onCtaClick,
  teamLinkText = "About Syed and the team",
  teamLinkHref = "/about",
  photos = DEFAULT_PHOTOS,
  coords = DEFAULT_COORDS,
  teamAvatars = DEFAULT_TEAM_AVATARS,
  className,
  ...props
}: CareersHeroProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const stackContainerRef = useRef<HTMLDivElement>(null);

  // Click-outside & Escape key handlers with safe SSR checks
  useEffect(() => {
    if (selectedPhoto === null) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        stackContainerRef.current &&
        !stackContainerRef.current.contains(event.target as Node)
      ) {
        setSelectedPhoto(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto]);

  const handleDefaultCtaClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onCtaClick) {
      onCtaClick(e);
      return;
    }
    if (ctaHref.startsWith("#")) {
      e.preventDefault();
      const targetElement = document.getElementById(ctaHref.slice(1));
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section
      aria-label="Careers Hero"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedPhoto(null);
        }
      }}
      className={cn(
        "grid-section font-['Satoshi',sans-serif] relative overflow-clip border-b border-neutral-200 bg-white pt-12 text-neutral-900 transition-colors duration-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 sm:pt-20",
        className
      )}
      {...props}
    >
      {/* Satoshi Font and Syed Custom Keyframe Animations */}
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');

        @keyframes scale-in-fade {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slide-up-fade {
          0% {
            opacity: 0;
            transform: translateY(var(--offset, 10px));
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-scale-in-fade {
          animation-name: scale-in-fade;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slide-up-fade {
          animation-name: slide-up-fade;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in {
          animation-name: fade-in;
          animation-timing-function: ease-out;
        }
      `}</style>

      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-x-px inset-y-0 overflow-hidden [mask-image:linear-gradient(transparent,black)] opacity-80">
        <svg
          className="pointer-events-none absolute inset-[unset] bottom-0 left-1/2 h-[600px] w-full max-w-[1200px] -translate-x-1/2 text-neutral-200/80 dark:text-neutral-800/60"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="careers-grid-pattern"
              x="-1"
              y="0"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect fill="url(#careers-grid-pattern)" width="100%" height="100%" />
        </svg>
      </div>

      {/* 9 Floating Layered Photos Stack with Click to Bring-In-Front */}
      <div
        ref={stackContainerRef}
        className="group relative mx-auto h-[358px] w-full max-w-screen-md max-md:scale-75 max-sm:scale-[0.6]"
      >
        {photos.map((photo, s) => {
          const isSelected = selectedPhoto === s;
          const coord = coords[s];
          return (
            <div
              key={`${photo.src}-${s}`}
              className="absolute left-1/2 top-1/2 animate-scale-in-fade [animation-duration:300ms] [animation-fill-mode:both] motion-reduce:animate-fade-in"
              style={{
                animationDelay: `${50 * s}ms`,
                zIndex: isSelected ? 1000 : s + 1,
                pointerEvents: "none",
              }}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={`Photo: ${photo.alt}`}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPhoto(isSelected ? null : s);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhoto(isSelected ? null : s);
                }}
                className={cn(
                  "cursor-pointer select-none rounded-lg bg-white p-1 ring-2 ring-black/5 shadow-md group-hover:scale-105 transition-all duration-200 dark:bg-neutral-900 dark:ring-white/10",
                  "translate-x-[calc(var(--x)-3%)] translate-y-[var(--y)] rotate-[var(--rotation)]",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600",
                  photo.width > photo.height ? "w-[300px]" : "h-[260px]",
                  isSelected && "scale-105 ring-black/20 shadow-2xl !z-[1000] dark:ring-white/30"
                )}
                style={
                  {
                    aspectRatio: `${photo.width} / ${photo.height}`,
                    "--rotation": `${coord?.[2] ?? photo.rotation ?? 0}deg`,
                    "--x": coord?.[0] ?? "-50%",
                    "--y": coord?.[1] ?? "-50%",
                    pointerEvents: "auto",
                  } as React.CSSProperties
                }
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading={s < 4 ? "eager" : "lazy"}
                  draggable={false}
                  className="size-full rounded object-cover pointer-events-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hero Title & Subtitle */}
      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-4 text-center sm:px-12 md:mt-10">
        <h1 className="mt-5 text-center text-4xl font-medium text-neutral-900 dark:text-white sm:text-5xl sm:leading-[1.15] animate-slide-up-fade [--offset:20px] [animation-duration:1s] [animation-fill-mode:both] motion-reduce:animate-fade-in [animation-delay:200ms]">
          {title}
        </h1>
        <p className="mt-5 text-balance text-base text-neutral-500 dark:text-neutral-400 sm:text-xl animate-slide-up-fade [--offset:10px] [animation-delay:300ms] [animation-duration:1s] [animation-fill-mode:both] motion-reduce:animate-fade-in">
          {subtitle}
        </p>

        <div className="relative mx-auto mt-10 flex max-w-fit space-x-4 animate-slide-up-fade [--offset:5px] [animation-delay:400ms] [animation-duration:1s] [animation-fill-mode:both] motion-reduce:animate-fade-in">
          <button
            type="button"
            onClick={handleDefaultCtaClick}
            className="mx-auto max-w-fit cursor-pointer whitespace-nowrap rounded-lg border border-black bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200 active:scale-95 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:hover:ring-neutral-800"
          >
            {ctaText}
          </button>
        </div>
      </div>

      {/* Overlapping Avatars Bar */}
      <div className="relative mx-px mt-16 flex h-[60px] justify-center border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
        <a
          className="group flex h-full items-center gap-4 px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-md"
          href={teamLinkHref}
        >
          <div className="ml-2.5 flex flex-row-reverse items-center">
            {teamAvatars.map((m, idx) => (
              <div
                key={`${m.name}-${idx}`}
                className="relative -ml-2.5 size-7 overflow-hidden rounded-full border-2 border-neutral-50 shadow-xs transition-transform duration-200 group-hover:scale-105 animate-slide-up-fade [--offset:10px] [animation-duration:1s] [animation-fill-mode:both] motion-reduce:animate-fade-in dark:border-neutral-900"
                style={{ animationDelay: `${650 - idx * 50}ms` }}
              >
                <img
                  alt={m.name}
                  src={m.src}
                  width={28}
                  height={28}
                  className="size-full object-cover"
                />
              </div>
            ))}
          </div>
          <span className="text-sm font-medium text-neutral-600 transition-colors group-hover:text-neutral-800 animate-slide-up-fade [--offset:8px] [animation-delay:600ms] [animation-duration:1s] [animation-fill-mode:both] motion-reduce:animate-fade-in dark:text-neutral-400 dark:group-hover:text-neutral-200">
            {teamLinkText} &rarr;
          </span>
        </a>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------
// 21st.dev Component Preview Demo Export
// --------------------------------------------------------------------------
export default function CareersHeroDemo() {
  return (
    <div className="w-full bg-white dark:bg-neutral-950">
      <CareersHero />
    </div>
  );
}