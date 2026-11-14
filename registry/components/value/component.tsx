"use client";

import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ValueItem {
  name: string;
  description: React.ReactNode;
}

export interface CareersValuesProps
  extends React.HTMLAttributes<HTMLElement> {
  heading?: string;
  subheading?: string;
  items?: ValueItem[];
  dayCloudImageUrl?: string;
  nightSkyImageUrl?: string;
}

const DEFAULT_VALUE_ITEMS: ValueItem[] = [
  {
    name: "Obsess over the details",
    description:
      "Exceptional products are built through deep craftsmanship, relentless iteration, and an obsessive focus on micro-interactions.",
  },
  {
    name: "Bias towards action",
    description:
      "Velocity is our competitive advantage. We prefer shipping and learning quickly over protracted debates and theoretical alignment.",
  },
  {
    name: "Default to transparency",
    description:
      "We share context openly, communicate candidly, and build trust through radical honesty across the entire organization.",
  },
  {
    name: "Customer-first mindset",
    description:
      "Everything we design and engineer starts and ends with real customer pain points and driving tangible business value.",
  },
  {
    name: "Think in first principles",
    description:
      "We question conventional assumptions, deconstruct complex problems, and engineer solutions from the ground up.",
  },
  {
    name: "Craft with passion",
    description:
      "We care deeply about our work. We take pride in building software that is elegant, durable, and genuinely delightful to use.",
  },
  {
    name: "High velocity, high quality",
    description:
      "Speed without quality creates tech debt. Quality without speed creates missed opportunities. We hold the bar high for both.",
  },
  {
    name: "Radical ownership",
    description:
      "No task is beneath anyone. We take full responsibility from inception to deployment without waiting to be told what to do.",
  },
  {
    name: "Win as a team",
    description:
      "We achieve greatness collectively. We celebrate individual contributions while optimizing for the shared mission.",
  },
];

// Mathematical SVG Crosshair for grid intersections
function GridCrosshair({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className={cn(
        "pointer-events-none absolute z-30 size-3 -translate-x-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600",
        className
      )}
    >
      <path d="M6.5 1.5v10M1.5 6.5h10" strokeLinecap="round" />
    </svg>
  );
}

interface ValueCardProps {
  name: string;
  description: React.ReactNode;
  idx: number;
  shouldReduceMotion: boolean | null;
}

function ValueCard({
  name,
  description,
  idx,
  shouldReduceMotion,
}: ValueCardProps) {
  const col = idx % 3;
  const row = Math.floor(idx / 3);

  const isLastCol = col === 2;
  const isBottomRow = row === 2;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.5,
        delay: shouldReduceMotion ? 0 : 0.05 * idx,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={cn(
        "group relative flex flex-col justify-between border-t border-neutral-200/90 p-8 sm:p-10 font-satoshi dark:border-neutral-800/90",
        !isLastCol && "md:border-r"
      )}
    >
      {/* Vercel-style interactive spotlight glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                320px circle at ${mouseX}px ${mouseY}px,
                rgba(249, 115, 22, 0.08),
                transparent 80%
              )
            `,
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -inset-px hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:block"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                260px circle at ${mouseX}px ${mouseY}px,
                rgba(255, 255, 255, 0.05),
                transparent 75%
              )
            `,
          }}
        />
      </div>

      {/* Grid Joints Crosshairs */}
      <GridCrosshair
        className={cn("left-0 top-0", col > 0 && "hidden md:block")}
      />
      {isLastCol && (
        <GridCrosshair className="left-full top-0 hidden md:block" />
      )}
      {isBottomRow && (
        <GridCrosshair
          className={cn("left-0 top-full", col > 0 && "hidden md:block")}
        />
      )}
      {idx === 8 && (
        <GridCrosshair className="left-full top-full hidden md:block" />
      )}

      {/* Card Content - Pure Satoshi */}
      <div className="relative z-10 font-satoshi">
        {/* Serial Number */}
        <span className="inline-block font-satoshi text-xs font-semibold tracking-wider tabular-nums text-orange-600 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-orange-500">
          0{idx + 1}
        </span>

        {/* Card Heading */}
        <h3 className="mt-5 font-satoshi text-lg font-medium tracking-tight text-neutral-900 transition-colors duration-200 group-hover:text-black sm:text-xl dark:text-neutral-100 dark:group-hover:text-white">
          {name}
        </h3>

        {/* Card Body */}
        <div className="mt-3 font-satoshi text-pretty text-sm leading-relaxed text-neutral-500 transition-colors duration-200 group-hover:text-neutral-600 dark:text-neutral-400 dark:group-hover:text-neutral-300">
          {description}
        </div>
      </div>
    </motion.div>
  );
}

export function CareersValues({
  heading = "Our values",
  subheading,
  items = DEFAULT_VALUE_ITEMS,
  dayCloudImageUrl = "https://assets.dub.co/about/clouds-pattern.png",
  nightSkyImageUrl = "https://cdn.pixabay.com/photo/2017/09/22/12/24/moon-2775385_640.jpg",
  className,
  ...props
}: CareersValuesProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="careers-values-title"
      className={cn(
        "font-satoshi relative w-full overflow-hidden border-y border-neutral-200/90 bg-white px-4 sm:px-6 lg:px-8 dark:border-neutral-800/90 dark:bg-neutral-950",
        className
      )}
      {...props}
    >
      {/* Fontshare Satoshi Global Font Injector */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap');
            .font-satoshi {
              font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
          `,
        }}
      />

      <div className="relative mx-auto max-w-6xl border-x border-neutral-200/90 dark:border-neutral-800/90">
        {/* Top Outer Crosshairs */}
        <GridCrosshair className="left-0 top-0" />
        <GridCrosshair className="left-full top-0" />

        <div className="w-full">
          {/* Header Area with Day / Night Animated Sky Background */}
          <div className="relative flex flex-col items-center justify-center pt-28 pb-20">
            
            {/* Sky Background Container with Soft Radial Feathering */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1 h-[270px] w-full max-w-2xl -translate-x-1/2 overflow-hidden select-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
            >
              {/* --- 1. DAY MODE: ONLY DAY CLOUDS LOOP --- */}
              <div className="absolute inset-0 transition-opacity duration-700 dark:opacity-0">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-300/40 via-sky-200/20 to-transparent" />
                
                <motion.div
                  className="flex w-max opacity-60 saturate-[1.2]"
                  animate={shouldReduceMotion ? { x: 0 } : { x: [0, -887] }}
                  transition={{
                    repeat: Infinity,
                    duration: 50,
                    ease: "linear",
                  }}
                >
                  <img
                    alt=""
                    src={dayCloudImageUrl}
                    width={887}
                    height={267}
                    className="h-[240px] w-[887px] max-w-none flex-none select-none object-cover"
                  />
                  <img
                    alt=""
                    src={dayCloudImageUrl}
                    width={887}
                    height={267}
                    className="-ml-px h-[240px] w-[887px] max-w-none flex-none select-none object-cover"
                  />
                </motion.div>
              </div>

              {/* --- 2. NIGHT MODE: ONLY NIGHT MOON IMAGE SEAMLESS LOOP --- */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-700 dark:opacity-100">
                <motion.div
                  className="flex h-full w-[400%]"
                  animate={shouldReduceMotion ? { x: 0 } : { x: ["0%", "-50%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 45,
                    ease: "linear",
                  }}
                >
                  {/* Panel 1: Normal Night Sky */}
                  <div className="h-full w-1/4 flex-shrink-0">
                    <img
                      alt="Night Moon Sky"
                      src={nightSkyImageUrl}
                      className="h-full w-full object-cover object-center pointer-events-none opacity-85 contrast-110"
                    />
                  </div>

                  {/* Panel 2: Mirrored Night Sky */}
                  <div className="h-full w-1/4 flex-shrink-0 -scale-x-100">
                    <img
                      alt="Night Moon Sky"
                      src={nightSkyImageUrl}
                      className="h-full w-full object-cover object-center pointer-events-none opacity-85 contrast-110"
                    />
                  </div>

                  {/* Panel 3: Normal Night Sky */}
                  <div className="h-full w-1/4 flex-shrink-0">
                    <img
                      alt="Night Moon Sky"
                      src={nightSkyImageUrl}
                      className="h-full w-full object-cover object-center pointer-events-none opacity-85 contrast-110"
                    />
                  </div>

                  {/* Panel 4: Mirrored Night Sky */}
                  <div className="h-full w-1/4 flex-shrink-0 -scale-x-100">
                    <img
                      alt="Night Moon Sky"
                      src={nightSkyImageUrl}
                      className="h-full w-full object-cover object-center pointer-events-none opacity-85 contrast-110"
                    />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Header Title & Flag Icon - Pure Satoshi */}
            <div className="relative z-10 flex flex-col items-center text-center px-4 font-satoshi">
              <div className="flex size-10 items-center justify-center rounded-full border border-neutral-200/90 bg-white/80 shadow-sm backdrop-blur-md dark:border-neutral-800/90 dark:bg-neutral-900/80">
                <svg
                  aria-hidden="true"
                  height="18"
                  width="18"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4.5 text-neutral-800 dark:text-neutral-200"
                >
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  >
                    <path d="M3.75,3.25h7.5c.552,0,1,.448,1,1v5H3.75" />
                    <path d="M12.25,5.75h2c.552,0,1,.448,1,1v4c0,.552-.448,1-1,1h-3.5c-.552,0-1-.448-1-1v-1.5" />
                    <line x1="10.043" x2="12.25" y1="11.457" y2="9.25" />
                    <line x1="3.75" x2="3.75" y1="1.75" y2="16.25" />
                  </g>
                </svg>
              </div>

              <h2
                id="careers-values-title"
                className="mt-4 font-satoshi text-balance text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50"
              >
                {heading}
              </h2>

              {subheading && (
                <p className="mt-3 max-w-lg font-satoshi text-balance text-sm text-neutral-500 sm:text-base dark:text-neutral-400">
                  {subheading}
                </p>
              )}
            </div>
          </div>

          {/* 3x3 Values Grid with 16 Joint Crosshairs */}
          <div className="grid w-full grid-cols-1 md:grid-cols-3">
            {items.map((item, idx) => (
              <ValueCard
                key={item.name}
                name={item.name}
                description={item.description}
                idx={idx}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CareersValues;