"use client";

import React, { useId, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Exact n=5 continuous superellipse squircle path (0..512 viewBox).
 */
const SQUIRCLE_PATH =
  "M 510.9 256.0 C 510.9 294.2 511.6 332.5 510.0 370.6 C 508.5 408.8 505.0 451.0 478.0 478.0 C 451.0 504.9 408.8 508.2 370.6 510.0 C 332.5 511.8 294.2 510.8 256.0 510.7 C 217.8 510.7 179.6 511.7 141.4 510.0 C 103.2 508.4 60.8 504.9 33.9 478.0 C 7.1 451.0 3.6 408.8 2.0 370.7 C 0.3 332.5 1.1 294.2 0.9 256.0 C 0.8 217.8 0.5 179.6 2.0 141.4 C 3.4 103.1 7.1 60.7 34.0 33.9 C 61.0 7.2 103.2 3.6 141.3 2.0 C 179.5 0.3 217.8 1.0 256.0 0.9 C 294.2 0.8 332.4 0.5 370.6 2.0 C 408.8 3.4 451.0 7.0 478.0 34.0 C 504.9 61.0 508.4 103.2 510.0 141.4 C 511.6 179.5 510.9 217.8 510.9 256.0 Z";

/**
 * Main flowing calligraphic S-ribbon path (0..512 viewBox).
 */
const RIBBON_PATH =
  "M 320.7 73.5 C 297.9 75.2 278.9 88.5 262.2 104.8 C 245.5 121.1 233.7 140.3 224.7 160.1 C 215.7 179.9 209.1 200.7 205.4 222.8 C 201.7 244.9 199.8 271.2 213.0 288.6 C 226.3 305.9 254.1 296.4 271.2 280.2 C 288.3 264.0 309.2 253.6 332.4 256.3 C 355.5 259.0 367.4 285.6 353.3 303.6 C 339.2 321.6 316.8 329.1 295.3 334.9 C 273.8 340.7 250.9 343.0 227.0 343.1 C 203.1 343.1 179.5 343.6 160.3 355.2 C 141.0 366.9 130.3 394.8 145.0 411.6 C 159.7 428.4 187.0 426.4 209.7 423.5 C 232.5 420.6 253.9 415.2 275.1 408.6 C 296.2 402.0 317.0 394.1 336.6 383.8 C 356.2 373.5 374.9 360.9 391.1 345.0 C 407.3 329.1 420.5 310.0 425.2 288.7 C 430.0 267.3 424.9 242.8 410.4 226.0 C 396.0 209.2 372.8 200.0 350.2 200.3 C 327.5 200.6 306.0 209.1 287.9 222.5 C 269.8 236.0 248.7 269.5 232.9 256.7 C 217.2 243.8 251.0 221.3 269.8 209.5 C 288.5 197.6 308.2 186.5 325.5 171.4 C 342.9 156.4 357.4 137.7 360.0 115.5 C 362.7 93.4 343.5 71.7 320.7 73.5 Z";

/**
 * Tilted floating calligraphic seed / oval dot path (0..512 viewBox).
 */
const OVAL_PATH =
  "M 166.3 260.5 C 155.9 261.4 146.5 267.6 138.5 274.5 C 130.6 281.3 124.0 289.5 120.3 299.2 C 116.6 309.0 115.7 320.6 120.8 329.3 C 125.9 337.9 137.3 342.8 147.9 341.8 C 158.4 340.8 168.0 335.2 175.9 328.2 C 183.8 321.3 190.2 313.0 193.7 303.2 C 197.3 293.4 198.0 281.6 193.0 273.1 C 187.9 264.6 176.7 259.6 166.3 260.5 Z";

export interface ObsidianCalligraphicIconProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
  > {
  /** Pixel width and height of the squircle app icon. */
  size?: number;
  /** Intensity of the anodized sandblasted film grain (0 to 1). */
  grainIntensity?: number;
  /** Enables 3D pointer tilt, cursor-tracked specular sheen, and tactile tap detent. */
  interactive?: boolean;
  /** Maximum 3D tilt angle in degrees when hovering. */
  tiltStrength?: number;
  /** Renders a realistic soft ambient elevation shadow beneath the squircle. */
  showElevation?: boolean;
  /** Accessible label describing the app icon. */
  label?: string;
}

const SPRING_CONFIG = { stiffness: 260, damping: 28, mass: 0.6 };

const ObsidianCalligraphicIcon = React.forwardRef<
  HTMLButtonElement,
  ObsidianCalligraphicIconProps
>(
  (
    {
      size = 280,
      grainIntensity = 0.46,
      interactive = true,
      tiltStrength = 12,
      showElevation = true,
      label = "Obsidian Calligraphic App Icon",
      className,
      style,
      onClick,
      onPointerMove,
      onPointerLeave,
      onPointerEnter,
      disabled = false,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
    const prefersReducedMotion = useReducedMotion();
    const containerRef = useRef<HTMLButtonElement | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const safeSize = Number.isFinite(size) ? Math.min(Math.max(size, 48), 512) : 280;
    const safeGrain = Number.isFinite(grainIntensity)
      ? Math.min(Math.max(grainIntensity, 0), 1)
      : 0.46;
    const safeTilt = Number.isFinite(tiltStrength)
      ? Math.min(Math.max(tiltStrength, 0), 24)
      : 12;

    const motionEnabled = interactive && !disabled && !prefersReducedMotion;

    const rotateXRaw = useMotionValue(0);
    const rotateYRaw = useMotionValue(0);
    const sheenXRaw = useMotionValue(24);
    const sheenYRaw = useMotionValue(16);

    const rotateX = useSpring(rotateXRaw, SPRING_CONFIG);
    const rotateY = useSpring(rotateYRaw, SPRING_CONFIG);
    const sheenX = useSpring(sheenXRaw, { stiffness: 200, damping: 26 });
    const sheenY = useSpring(sheenYRaw, { stiffness: 200, damping: 26 });

    const dynamicSheen = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 36%, rgba(255, 255, 255, 0) 68%)`;

    const setRefs = (node: HTMLButtonElement | null) => {
      containerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerMove?.(e);
      if (!motionEnabled || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;

      const clampedX = Math.min(Math.max(relX, 0), 1);
      const clampedY = Math.min(Math.max(relY, 0), 1);

      rotateYRaw.set((clampedX - 0.5) * 2 * safeTilt);
      rotateXRaw.set((0.5 - clampedY) * 2 * safeTilt);
      sheenXRaw.set(clampedX * 100);
      sheenYRaw.set(clampedY * 100);
    };

    const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(e);
      if (!motionEnabled) return;
      setIsHovered(true);
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(e);
      setIsHovered(false);
      rotateXRaw.set(0);
      rotateYRaw.set(0);
      sheenXRaw.set(24);
      sheenYRaw.set(16);
    };

    const sqPathId = `sq-path-${uid}`;
    const sqClipId = `sq-clip-${uid}`;
    const bgGradId = `obsidian-bg-${uid}`;
    const bounceGradId = `bounce-bg-${uid}`;
    const rimSpecId = `rim-specular-${uid}`;
    const rimInnerId = `rim-inner-${uid}`;
    const ribbonGradId = `ribbon-grad-${uid}`;
    const ovalGradId = `oval-grad-${uid}`;
    const glyphShadowId = `glyph-shadow-${uid}`;
    const grainFilterId = `anodized-grain-${uid}`;

    return (
      <div
        className="inline-flex items-center justify-center select-none"
        style={{ perspective: "900px" }}
      >
        <motion.button
          ref={setRefs}
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          whileTap={motionEnabled ? { scale: 0.965 } : undefined}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className={cn(
            "relative block shrink-0 appearance-none border-0 bg-transparent p-0 outline-none",
            "focus-visible:ring-2 focus-visible:ring-zinc-800/80 dark:focus-visible:ring-zinc-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
            interactive && !disabled ? "cursor-pointer" : "cursor-default",
            disabled && "opacity-60",
            className
          )}
          style={{
            width: safeSize,
            height: safeSize,
            borderRadius: "22.5%",
            transformStyle: "preserve-3d",
            rotateX: motionEnabled ? rotateX : 0,
            rotateY: motionEnabled ? rotateY : 0,
            filter: showElevation
              ? "drop-shadow(0 18px 28px rgba(0, 0, 0, 0.34)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.22))"
              : undefined,
            ...style,
          }}
          {...rest}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="block h-full w-full"
          >
            <defs>
              <path id={sqPathId} d={SQUIRCLE_PATH} />

              <clipPath id={sqClipId}>
                <use href={`#${sqPathId}`} />
              </clipPath>

              {/* Top-left studio key light across obsidian anodized surface */}
              <radialGradient
                id={bgGradId}
                cx="24%"
                cy="16%"
                r="86%"
                fx="22%"
                fy="14%"
              >
                <stop offset="0%" stopColor="#2c2c2e" />
                <stop offset="28%" stopColor="#1c1c1e" />
                <stop offset="62%" stopColor="#0b0b0c" />
                <stop offset="100%" stopColor="#040405" />
              </radialGradient>

              {/* Subtle lower-right ambient bounce light */}
              <radialGradient id={bounceGradId} cx="84%" cy="88%" r="48%">
                <stop offset="0%" stopColor="#1b1b1d" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#040405" stopOpacity="0" />
              </radialGradient>

              {/* Crisp metallic bezel specular rim highlight */}
              <linearGradient
                id={rimSpecId}
                x1="12%"
                y1="4%"
                x2="88%"
                y2="94%"
              >
                <stop offset="0%" stopColor="#f4f4f6" stopOpacity="0.96" />
                <stop offset="18%" stopColor="#d2d2d6" stopOpacity="0.72" />
                <stop offset="46%" stopColor="#525256" stopOpacity="0.32" />
                <stop offset="76%" stopColor="#1e1e20" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#8a8a90" stopOpacity="0.48" />
              </linearGradient>

              {/* Soft inner bezel roll-off chamfer */}
              <linearGradient
                id={rimInnerId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
                <stop offset="32%" stopColor="#a1a1a6" stopOpacity="0.12" />
                <stop offset="70%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.14" />
              </linearGradient>

              {/* Sculptural brushed-platinum calligraphic ribbon shading */}
              <linearGradient
                id={ribbonGradId}
                x1="22%"
                y1="16%"
                x2="82%"
                y2="74%"
              >
                <stop offset="0%" stopColor="#f5f5f7" />
                <stop offset="32%" stopColor="#dedee0" />
                <stop offset="68%" stopColor="#b4b4b8" />
                <stop offset="100%" stopColor="#8e8e94" />
              </linearGradient>

              {/* Sculptural brushed-platinum tilted oval shading */}
              <linearGradient
                id={ovalGradId}
                x1="15%"
                y1="12%"
                x2="88%"
                y2="88%"
              >
                <stop offset="0%" stopColor="#f7f7f8" />
                <stop offset="55%" stopColor="#dedee1" />
                <stop offset="100%" stopColor="#bcbcc0" />
              </linearGradient>

              {/* Subtle embossed drop shadow beneath calligraphic glyph */}
              <filter
                id={glyphShadowId}
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
              >
                <feDropShadow
                  dx="2"
                  dy="6"
                  stdDeviation="6"
                  floodColor="#000000"
                  floodOpacity="0.58"
                />
              </filter>

              {/* High-frequency monochromatic sandblasted anodized grain */}
              <filter
                id={grainFilterId}
                x="0%"
                y="0%"
                width="100%"
                height="100%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.82"
                  numOctaves={3}
                  seed={11}
                  stitchTiles="stitch"
                  result="noise"
                />
                <feColorMatrix
                  type="saturate"
                  values="0"
                  in="noise"
                  result="grayNoise"
                />
                <feComponentTransfer in="grayNoise" result="contrastNoise">
                  <feFuncR type="linear" slope={1.75} intercept={-0.38} />
                  <feFuncG type="linear" slope={1.75} intercept={-0.38} />
                  <feFuncB type="linear" slope={1.75} intercept={-0.38} />
                </feComponentTransfer>
              </filter>
            </defs>

            <g clipPath={`url(#${sqClipId})`}>
              {/* Base anodized obsidian surface */}
              <rect width="512" height="512" fill={`url(#${bgGradId})`} />
              <rect width="512" height="512" fill={`url(#${bounceGradId})`} />

              {/* Soft inner bezel roll-off */}
              <use
                href={`#${sqPathId}`}
                fill="none"
                stroke={`url(#${rimInnerId})`}
                strokeWidth="14"
              />

              {/* Embossed brushed-platinum calligraphic mark */}
              <g filter={`url(#${glyphShadowId})`}>
                <path d={RIBBON_PATH} fill={`url(#${ribbonGradId})`} />
                <path d={OVAL_PATH} fill={`url(#${ovalGradId})`} />
              </g>

              {/* Unified monochromatic sandblasted grain across obsidian & glyph */}
              {safeGrain > 0 && (
                <>
                  <rect
                    width="512"
                    height="512"
                    filter={`url(#${grainFilterId})`}
                    opacity={safeGrain}
                    style={{ mixBlendMode: "overlay" }}
                  />
                  <rect
                    width="512"
                    height="512"
                    filter={`url(#${grainFilterId})`}
                    opacity={safeGrain * 0.38}
                    style={{ mixBlendMode: "soft-light" }}
                  />
                </>
              )}

              {/* Crisp specular metallic bezel rim */}
              <use
                href={`#${sqPathId}`}
                fill="none"
                stroke={`url(#${rimSpecId})`}
                strokeWidth="5"
              />
            </g>

            {/* Hairline outer anodized edge definition */}
            <use
              href={`#${sqPathId}`}
              fill="none"
              stroke="#080809"
              strokeWidth="2"
              strokeOpacity="0.88"
            />
          </svg>

          {/* Zero-rerender pointer-tracked specular sheen overlay */}
          {motionEnabled && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                borderRadius: "22.5%",
                backgroundImage: dynamicSheen,
              }}
            />
          )}
        </motion.button>
      </div>
    );
  }
);

ObsidianCalligraphicIcon.displayName = "ObsidianCalligraphicIcon";

export {
  ObsidianCalligraphicIcon,
  ObsidianCalligraphicIcon as component,
  ObsidianCalligraphicIcon as Component,
};
export default ObsidianCalligraphicIcon;