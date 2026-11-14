"use client";

import React, { useId } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface VerifiedBadgeProps extends React.SVGProps<SVGSVGElement> {
  /** Size of the badge in pixels or CSS units. Defaults to 24 */
  size?: number | string;
  /** Primary fill color of the scalloped badge. Defaults to Twitter/X Blue (#1D9BF0) */
  badgeColor?: string;
  /** Fill/stroke color of the inner checkmark icon. Defaults to #2F3336 */
  checkColor?: string;
}

const BADGE_PATH =
  "M 14.43 2.92 C 13.71 2.73 12.70 4.00 12.00 4.00 C 11.30 4.00 10.29 2.73 9.57 2.92 C 8.85 3.11 8.69 4.73 8.00 5.07 C 7.31 5.42 5.79 4.74 5.21 5.21 C 4.64 5.69 5.32 7.21 5.07 8.00 C 4.83 8.79 3.11 8.85 2.92 9.57 C 2.73 10.29 4.00 11.30 4.00 12.00 C 4.00 12.70 2.73 13.71 2.92 14.43 C 3.11 15.15 4.73 15.31 5.07 16.00 C 5.42 16.69 4.74 18.21 5.21 18.79 C 5.69 19.36 7.21 18.68 8.00 18.93 C 8.79 19.17 8.85 20.89 9.57 21.08 C 10.29 21.27 11.30 20.00 12.00 20.00 C 12.70 20.00 13.71 21.27 14.43 21.08 C 15.15 20.89 15.31 19.27 16.00 18.93 C 16.69 18.58 18.21 19.26 18.79 18.79 C 19.36 18.31 18.68 16.79 18.93 16.00 C 19.17 15.21 20.89 15.15 21.08 14.43 C 21.27 13.71 20.00 12.70 20.00 12.00 C 20.00 11.30 21.27 10.29 21.08 9.57 C 20.89 8.85 19.27 8.69 18.93 8.00 C 18.58 7.31 19.26 5.79 18.79 5.21 C 18.31 4.64 16.79 5.32 16.00 5.07 C 15.21 4.83 15.15 3.11 14.43 2.92 Z";

export const VerifiedBadge = React.forwardRef<SVGSVGElement, VerifiedBadgeProps>(
  (
    {
      size = 24,
      badgeColor = "#1D9BF0",
      checkColor = "#2F3336",
      className,
      ...props
    },
    ref
  ) => {
    const rawId = useId();
    const cleanId = rawId.replace(/[^a-zA-Z0-9-_]/g, "");
    const gradId = `badge-grad-${cleanId}`;
    const clipId = `badge-clip-${cleanId}`;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("inline-block shrink-0 select-none align-middle", className)}
        aria-label="Verified"
        role="img"
        focusable="false"
        {...props}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={BADGE_PATH} />
          </clipPath>

          <linearGradient id={gradId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {/* Base solid background */}
        <path d={BADGE_PATH} fill={badgeColor} />

        {/* Dynamic lighting overlay */}
        <path d={BADGE_PATH} fill={`url(#${gradId})`} />

        {/* Crisp inner border edge */}
        <path
          d={BADGE_PATH}
          stroke="#FFFFFF"
          strokeOpacity="0.28"
          strokeWidth="0.7"
          clipPath={`url(#${clipId})`}
        />

        {/* Centered Checkmark */}
        <path
          d="M 8.6 12.35 L 10.9 14.55 L 15.65 9.75"
          stroke={checkColor}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
);

VerifiedBadge.displayName = "VerifiedBadge";

export default VerifiedBadge;
