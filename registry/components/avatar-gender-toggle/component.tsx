"use client";

import React, { useCallback, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type AvatarGenderValue = "female" | "male";
export type AvatarGenderToggleSize = "sm" | "md" | "lg";

export interface AvatarGenderToggleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** Controlled selected value ("female" | "male"). */
  value?: AvatarGenderValue;
  /** Uncontrolled initial selected value. Defaults to "female". */
  defaultValue?: AvatarGenderValue;
  /** Callback fired whenever the selected gender changes. */
  onValueChange?: (value: AvatarGenderValue) => void;
  /** Visual scale preset preserving the reference 204:348 pill geometry. */
  size?: AvatarGenderToggleSize;
  /** Toggle visibility of the interactive Female / Male labels beside the pill. */
  showLabels?: boolean;
  /** Custom label text for the top (female) state. */
  femaleLabel?: string;
  /** Custom label text for the bottom (male) state. */
  maleLabel?: string;
  /** Enable signature idle micro-animations (lens glint in female state, eye blink in male state). */
  idleAnimations?: boolean;
  /** Disable all pointer and keyboard interaction. */
  disabled?: boolean;
}

const SIZE_CONFIG: Record<
  AvatarGenderToggleSize,
  {
    pillWidth: number;
    pillHeight: number;
    gapClass: string;
    labelTextClass: string;
    labelTrackHeight: number;
    topOffset: number;
    bottomOffset: number;
  }
> = {
  sm: {
    pillWidth: 102,
    pillHeight: 174,
    gapClass: "gap-7",
    labelTextClass: "text-xl",
    labelTrackHeight: 174,
    topOffset: 42,
    bottomOffset: 42,
  },
  md: {
    pillWidth: 146,
    pillHeight: 249,
    gapClass: "gap-10",
    labelTextClass: "text-3xl",
    labelTrackHeight: 249,
    topOffset: 60,
    bottomOffset: 60,
  },
  lg: {
    pillWidth: 184,
    pillHeight: 314,
    gapClass: "gap-12",
    labelTextClass: "text-4xl",
    labelTrackHeight: 314,
    topOffset: 76,
    bottomOffset: 76,
  },
};

/**
 * Matching-topology cubic Bezier paths (7 C-segments) so Framer Motion
 * interpolates smoothly between the side-swept female bangs and the
 * short, crisp male haircut with tapered sideburns.
 */
const FEMALE_BANGS_PATH =
  "M 16 74 " +
  "C 16 40, 188 40, 188 74 " +
  "C 188 100, 186 130, 173 158 " +
  "C 155 148, 134 128, 121 96 " +
  "C 108 118, 86 131, 61 134 " +
  "C 61 126, 61 119, 63 113 " +
  "C 52 129, 39 144, 24 146 " +
  "C 20 130, 16 104, 16 74 Z";

const MALE_BANGS_PATH =
  "M 16 74 " +
  "C 16 40, 188 40, 188 74 " +
  "C 188 92, 185 112, 175 130 " +
  "C 169 124, 165 112, 160 104 " +
  "C 138 107, 108 102, 76 105 " +
  "C 64 106, 56 100, 50 105 " +
  "C 42 110, 35 122, 29 130 " +
  "C 19 112, 16 92, 16 74 Z";

/**
 * Matching 4-segment cubic Bezier lens paths:
 * Soft round frames (Female) morph cleanly into classic wayfarer frames (Male).
 */
const FEMALE_LEFT_LENS_PATH =
  "M 41 143 " +
  "C 41 127.8, 53.3 115.5, 68.5 115.5 " +
  "C 83.7 115.5, 96 127.8, 96 143 " +
  "C 96 158.2, 83.7 170.5, 68.5 170.5 " +
  "C 53.3 170.5, 41 158.2, 41 143 Z";

const MALE_LEFT_LENS_PATH =
  "M 38.5 138 " +
  "C 38.5 122, 45 119, 68.5 119 " +
  "C 91 119, 96.5 123, 96.5 139 " +
  "C 96.5 157, 85 167, 67.5 167 " +
  "C 50 167, 38.5 156, 38.5 138 Z";

const FEMALE_RIGHT_LENS_PATH =
  "M 108 143 " +
  "C 108 127.8, 120.3 115.5, 135.5 115.5 " +
  "C 150.7 115.5, 163 127.8, 163 143 " +
  "C 163 158.2, 150.7 170.5, 135.5 170.5 " +
  "C 120.3 170.5, 108 158.2, 108 143 Z";

const MALE_RIGHT_LENS_PATH =
  "M 107.5 139 " +
  "C 107.5 123, 113 119, 135.5 119 " +
  "C 159 119, 165.5 122, 165.5 138 " +
  "C 165.5 156, 154 167, 136.5 167 " +
  "C 119 167, 107.5 157, 107.5 139 Z";

const PALETTE = {
  female: {
    hair: "#cb662b",
    highlight: "#e58c58",
    shadow: "#ad4b11",
  },
  male: {
    hair: "#333231",
    highlight: "#4a4948",
    shadow: "#262524",
  },
} as const;

const FACE_TRAVEL_Y = 114;

export const AvatarGenderToggle = React.forwardRef<
  HTMLDivElement,
  AvatarGenderToggleProps
>(function AvatarGenderToggle(
  {
    value,
    defaultValue = "female",
    onValueChange,
    size = "md",
    showLabels = true,
    femaleLabel = "Female",
    maleLabel = "Male",
    idleAnimations = true,
    disabled = false,
    className,
    "aria-label": ariaLabel = "Gender selection",
    ...rest
  },
  ref
) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const prefersReducedMotion = useReducedMotion();

  const [internalValue, setInternalValue] =
    useState<AvatarGenderValue>(defaultValue);

  const isControlled = value !== undefined;
  const activeValue: AvatarGenderValue = isControlled ? value : internalValue;
  const isMale = activeValue === "male";

  const selectValue = useCallback(
    (next: AvatarGenderValue) => {
      if (disabled || next === activeValue) return;
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [disabled, activeValue, isControlled, onValueChange]
  );

  const toggleValue = useCallback(() => {
    selectValue(isMale ? "female" : "male");
  }, [isMale, selectValue]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        selectValue("male");
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        selectValue("female");
      } else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        toggleValue();
      }
    },
    [disabled, selectValue, toggleValue]
  );

  const metrics = SIZE_CONFIG[size] ?? SIZE_CONFIG.md;
  const activeColors = isMale ? PALETTE.male : PALETTE.female;

  const slideTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        type: "spring" as const,
        stiffness: 270,
        damping: 28,
        mass: 0.92,
      };

  const colorTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 0.36,
        ease: [0.4, 0, 0.2, 1] as const,
      };

  const wipeTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 0.32,
        ease: [0.4, 0, 0.2, 1] as const,
      };

  const pillClipId = `${uid}-pill-clip`;
  const leftRimMaskId = `${uid}-left-rim-mask`;
  const rightRimMaskId = `${uid}-right-rim-mask`;
  const lensClipId = `${uid}-lens-clip`;

  const shouldAnimateIdle = idleAnimations && !prefersReducedMotion;

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center select-none",
        metrics.gapClass,
        disabled && "opacity-60 pointer-events-none",
        className
      )}
      {...rest}
    >
      {/* Interactive Avatar Pill Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isMale}
        aria-label={`Selected: ${isMale ? maleLabel : femaleLabel}. Activate to switch to ${isMale ? femaleLabel : maleLabel}.`}
        disabled={disabled}
        onClick={toggleValue}
        className={cn(
          "relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-[#cb662b] dark:focus-visible:ring-zinc-300 dark:focus-visible:ring-offset-zinc-950 transition-transform duration-150",
          !disabled && "cursor-pointer active:scale-[0.985]"
        )}
        style={{
          width: metrics.pillWidth,
          height: metrics.pillHeight,
        }}
      >
        <svg
          viewBox="0 0 204 348"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="block overflow-visible"
        >
          <defs>
            {/* Outer pill silhouette */}
            <clipPath id={pillClipId}>
              <rect x="0" y="0" width="204" height="348" rx="102" />
            </clipPath>

            {/* Curved 7px left highlight crescent */}
            <mask id={leftRimMaskId}>
              <rect x="0" y="0" width="204" height="348" rx="102" fill="#ffffff" />
              <rect x="7" y="0" width="204" height="348" rx="102" fill="#000000" />
            </mask>

            {/* Curved 13px right shadow crescent */}
            <mask id={rightRimMaskId}>
              <rect x="0" y="0" width="204" height="348" rx="102" fill="#ffffff" />
              <rect x="-13" y="0" width="204" height="348" rx="102" fill="#000000" />
            </mask>

            {/* Clip path for female glasses lens specular glint */}
            <clipPath id={lensClipId}>
              <circle cx="68.5" cy="143" r="27.5" />
              <circle cx="135.5" cy="143" r="27.5" />
            </clipPath>
          </defs>

          <g clipPath={`url(#${pillClipId})`}>
            {/* Main pill hair track */}
            <motion.rect
              x="0"
              y="0"
              width="204"
              height="348"
              rx="102"
              initial={false}
              animate={{ fill: activeColors.hair }}
              transition={colorTransition}
            />

            {/* Left cylindrical highlight rim */}
            <motion.rect
              x="0"
              y="0"
              width="204"
              height="348"
              rx="102"
              mask={`url(#${leftRimMaskId})`}
              initial={false}
              animate={{ fill: activeColors.highlight }}
              transition={colorTransition}
            />

            {/* Right cylindrical shadow rim */}
            <motion.rect
              x="0"
              y="0"
              width="204"
              height="348"
              rx="102"
              mask={`url(#${rightRimMaskId})`}
              initial={false}
              animate={{ fill: activeColors.shadow }}
              transition={colorTransition}
            />

            {/* Sliding Character Face Thumb */}
            <motion.g
              initial={false}
              animate={{ y: isMale ? FACE_TRAVEL_Y : 0 }}
              transition={slideTransition}
            >
              {/* Left & right ears */}
              <path
                d="M 29 131 C 16 125, 11 139, 17 153 C 20 160, 26 163, 32 161 Z"
                fill="#fbd08d"
              />
              <path
                d="M 175 131 C 188 125, 193 139, 187 153 C 184 160, 178 163, 172 161 Z"
                fill="#fbd08d"
              />

              {/* Face base */}
              <ellipse cx="102" cy="146" rx="76" ry="67" fill="#fbd08d" />

              {/* Groomed Male Beard & Mustache (Male only) */}
              <motion.g
                initial={false}
                animate={{
                  opacity: isMale ? 1 : 0,
                  y: isMale ? 0 : 8,
                }}
                transition={colorTransition}
              >
                {/* Sculpted short boxed beard hugging the lower jawline & chin */}
                <path
                  d="M 27.5 152 C 29 194, 60 215, 102 215 C 144 215, 175 194, 176.5 152 C 173 164, 161 177, 144 179 C 134 180, 127 173, 119 170.5 C 109 167.5, 95 167.5, 85 170.5 C 77 173, 70 180, 60 179 C 43 177, 31 164, 27.5 152 Z"
                  fill="#333231"
                />
                {/* Clean mouth opening framed by mustache & chin beard */}
                <ellipse cx="102" cy="184.5" rx="19" ry="8.5" fill="#fbd08d" />
              </motion.g>

              {/* Soft blush cheeks (Female only) */}
              <motion.g
                initial={false}
                animate={{ opacity: isMale ? 0 : 0.72 }}
                transition={colorTransition}
              >
                <ellipse cx="64" cy="166" rx="15.5" ry="6.2" fill="#e49b60" />
                <ellipse cx="140" cy="166" rx="15.5" ry="6.2" fill="#e49b60" />
              </motion.g>

              {/* Defined Male Eyebrows (Male only) */}
              <motion.g
                initial={false}
                animate={{
                  opacity: isMale ? 1 : 0,
                  y: isMale ? 0 : 4,
                }}
                transition={colorTransition}
              >
                <path
                  d="M 52 113 Q 68.5 109.5 85 113.5"
                  stroke="#333231"
                  strokeWidth="4.6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 119 113.5 Q 135.5 109.5 152 113"
                  stroke="#333231"
                  strokeWidth="4.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </motion.g>

              {/* Eyes with Male idle blink */}
              <g>
                <motion.g
                  style={{ originX: "70px", originY: "137px" }}
                  animate={
                    shouldAnimateIdle && isMale
                      ? { scaleY: [1, 1, 0.08, 1, 1] }
                      : { scaleY: 1 }
                  }
                  transition={
                    shouldAnimateIdle && isMale
                      ? {
                          duration: 2.9,
                          repeat: Infinity,
                          times: [0, 0.86, 0.91, 0.96, 1],
                          ease: "easeInOut",
                        }
                      : { duration: 0.15 }
                  }
                >
                  <circle cx="70" cy="137" r="5.3" fill="#4b4c4e" />
                  <circle cx="68.3" cy="135.2" r="1.7" fill="#ffffff" />
                </motion.g>

                <motion.g
                  style={{ originX: "134px", originY: "137px" }}
                  animate={
                    shouldAnimateIdle && isMale
                      ? { scaleY: [1, 1, 0.08, 1, 1] }
                      : { scaleY: 1 }
                  }
                  transition={
                    shouldAnimateIdle && isMale
                      ? {
                          duration: 2.9,
                          repeat: Infinity,
                          times: [0, 0.86, 0.91, 0.96, 1],
                          ease: "easeInOut",
                        }
                      : { duration: 0.15 }
                  }
                >
                  <circle cx="134" cy="137" r="5.3" fill="#4b4c4e" />
                  <circle cx="132.3" cy="135.2" r="1.7" fill="#ffffff" />
                </motion.g>
              </g>

              {/* Nose */}
              <path
                d="M 95.5 154.5 Q 102 164 108.5 154.5 Q 102 158.8 95.5 154.5 Z"
                fill="#b59868"
              />

              {/* Gentle smile */}
              <path
                d="M 91.5 183.5 Q 102 190 112.5 183.5"
                stroke="#b59868"
                strokeWidth="4.4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Morphing Glasses Lenses (Round -> Wayfarer) */}
              <motion.path
                initial={false}
                animate={{
                  d: isMale ? MALE_LEFT_LENS_PATH : FEMALE_LEFT_LENS_PATH,
                }}
                transition={slideTransition}
                fill="rgba(255, 250, 238, 0.24)"
              />
              <motion.path
                initial={false}
                animate={{
                  d: isMale ? MALE_RIGHT_LENS_PATH : FEMALE_RIGHT_LENS_PATH,
                }}
                transition={slideTransition}
                fill="rgba(255, 250, 238, 0.24)"
              />

              {/* Female idle diagonal specular glint sweep across lenses */}
              <g clipPath={`url(#${lensClipId})`}>
                <motion.g
                  initial={false}
                  animate={
                    shouldAnimateIdle && !isMale
                      ? { x: [145, -145, -145], opacity: [0.85, 0.85, 0] }
                      : { x: 145, opacity: 0 }
                  }
                  transition={
                    shouldAnimateIdle && !isMale
                      ? {
                          duration: 3.4,
                          repeat: Infinity,
                          times: [0, 0.24, 0.28],
                          ease: [0.4, 0, 0.2, 1],
                        }
                      : { duration: 0.2 }
                  }
                >
                  <polygon
                    points="64,104 82,104 60,180 42,180"
                    fill="rgba(255, 255, 255, 0.72)"
                  />
                  <polygon
                    points="88,104 95,104 73,180 66,180"
                    fill="rgba(255, 255, 255, 0.55)"
                  />
                </motion.g>
              </g>

              {/* Morphing Glasses Frames & Bridge */}
              <motion.path
                initial={false}
                animate={{
                  d: isMale ? MALE_LEFT_LENS_PATH : FEMALE_LEFT_LENS_PATH,
                }}
                transition={slideTransition}
                stroke="#383b40"
                strokeWidth="4.6"
                fill="none"
              />
              <motion.path
                initial={false}
                animate={{
                  d: isMale ? MALE_RIGHT_LENS_PATH : FEMALE_RIGHT_LENS_PATH,
                }}
                transition={slideTransition}
                stroke="#383b40"
                strokeWidth="4.6"
                fill="none"
              />
              <path
                d="M 93.5 130.5 Q 102 126.5 110.5 130.5 L 111.5 139.5 Q 102 134 92.5 139.5 Z"
                fill="#383b40"
              />
              {/* Wayfarer temple hinge pins (Male state) */}
              <motion.g
                initial={false}
                animate={{ opacity: isMale ? 0.92 : 0 }}
                transition={colorTransition}
              >
                <circle cx="43.5" cy="124.5" r="1.7" fill="#ffffff" />
                <circle cx="160.5" cy="124.5" r="1.7" fill="#ffffff" />
              </motion.g>

              {/* Morphing Hair Bangs / Short Male Hairline */}
              <motion.path
                initial={false}
                animate={{
                  d: isMale ? MALE_BANGS_PATH : FEMALE_BANGS_PATH,
                  fill: activeColors.hair,
                }}
                transition={{
                  d: slideTransition,
                  fill: colorTransition,
                }}
              />

              {/* White Hoop Earrings (Female only) */}
              <motion.g
                initial={false}
                animate={{
                  opacity: isMale ? 0 : 1,
                  scale: isMale ? 0.5 : 1,
                }}
                style={{ originX: "23.5px", originY: "158px" }}
                transition={colorTransition}
              >
                <ellipse
                  cx="23.5"
                  cy="158"
                  rx="3.7"
                  ry="6.1"
                  stroke="#ffffff"
                  strokeWidth="2.8"
                  fill="none"
                />
              </motion.g>

              <motion.g
                initial={false}
                animate={{
                  opacity: isMale ? 0 : 1,
                  scale: isMale ? 0.5 : 1,
                }}
                style={{ originX: "180.5px", originY: "158px" }}
                transition={colorTransition}
              >
                <ellipse
                  cx="180.5"
                  cy="158"
                  rx="3.7"
                  ry="6.1"
                  stroke="#ffffff"
                  strokeWidth="2.8"
                  fill="none"
                />
              </motion.g>
            </motion.g>
          </g>
        </svg>
      </button>

      {/* Interactive Vertical-Wipe Labels */}
      {showLabels && (
        <div
          className="flex flex-col justify-between"
          style={{
            height: metrics.labelTrackHeight,
            paddingTop: metrics.topOffset,
            paddingBottom: metrics.bottomOffset,
          }}
        >
          {/* Female Label */}
          <button
            type="button"
            role="radio"
            aria-checked={!isMale}
            disabled={disabled}
            onClick={() => selectValue("female")}
            className={cn(
              "relative text-left font-extrabold tracking-tight leading-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-[#cb662b] dark:focus-visible:ring-zinc-300 dark:focus-visible:ring-offset-zinc-950",
              metrics.labelTextClass,
              !disabled && "cursor-pointer"
            )}
          >
            <span className="block text-[#c6b396] dark:text-zinc-600">
              {femaleLabel}
            </span>
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{
                clipPath: isMale
                  ? "inset(100% 0% 0% 0%)"
                  : "inset(0% 0% 0% 0%)",
              }}
              transition={wipeTransition}
              className="pointer-events-none absolute inset-0 block text-[#383737] dark:text-zinc-100"
            >
              {femaleLabel}
            </motion.span>
          </button>

          {/* Male Label */}
          <button
            type="button"
            role="radio"
            aria-checked={isMale}
            disabled={disabled}
            onClick={() => selectValue("male")}
            className={cn(
              "relative text-left font-extrabold tracking-tight leading-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-[#cb662b] dark:focus-visible:ring-zinc-300 dark:focus-visible:ring-offset-zinc-950",
              metrics.labelTextClass,
              !disabled && "cursor-pointer"
            )}
          >
            <span className="block text-[#c6b396] dark:text-zinc-600">
              {maleLabel}
            </span>
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{
                clipPath: isMale
                  ? "inset(0% 0% 0% 0%)"
                  : "inset(0% 0% 100% 0%)",
              }}
              transition={wipeTransition}
              className="pointer-events-none absolute inset-0 block text-[#383737] dark:text-zinc-100"
            >
              {maleLabel}
            </motion.span>
          </button>
        </div>
      )}
    </div>
  );
});

AvatarGenderToggle.displayName = "AvatarGenderToggle";

export { AvatarGenderToggle as component, AvatarGenderToggle as Component };
export default AvatarGenderToggle;
