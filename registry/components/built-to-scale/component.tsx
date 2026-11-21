"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Monitor,
  MousePointerClick,
  Receipt,
  Smartphone,
  User,
  UserPlus,
} from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type BuiltToScaleTheme = "auto" | "light" | "dark";

export type TelemetryEventType = "signup" | "sale" | "click";

export type CountryCode =
  | "BD"
  | "TR"
  | "US"
  | "DE"
  | "JP"
  | "GB"
  | "SG"
  | "BR";

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  /** Masked email for "signup" events (e.g. "****@hooli.com") */
  email?: string;
  /** Avatar accent tint for "signup" events */
  avatarTone?: "amber" | "emerald" | "neutral";
  /** Sale dollar amount for "sale" events */
  amount?: number;
  /** Country display name for "click" events */
  country?: string;
  /** ISO country code for inline SVG flag */
  countryCode?: CountryCode;
  /** Device label for "click" events */
  device?: "Desktop" | "Mobile";
  /** Geographic coordinates [lat, lon] to highlight on the 3D globe */
  coordinates: [number, number];
}

export interface ScaleMetrics {
  linksCreated: number;
  eventsTracked: number;
  revenueTracked: number;
}

export interface BuiltToScaleProps extends React.HTMLAttributes<HTMLElement> {
  /** Main section headline */
  title?: string;
  /** Supporting infrastructure description */
  description?: string;
  /** Baseline metrics displayed in the left telemetry column */
  initialMetrics?: ScaleMetrics;
  /** Color theme mode ("auto" follows Tailwind dark: class / system theme) */
  theme?: BuiltToScaleTheme;
  /** Continuously rotate the 3D dotted globe */
  autoRotate?: boolean;
  /** Globe angular rotation speed in radians per second */
  rotationSpeed?: number;
  /** Stream live incoming telemetry cards and increment counters */
  liveEvents?: boolean;
  /** Milliseconds between incoming live telemetry events */
  eventInterval?: number;
  /** Optional custom event pool for the live feed */
  events?: TelemetryEvent[];
}

interface GlobeMarker {
  id: string;
  label: string;
  lat: number;
  lon: number;
  isBangladesh?: boolean;
}

interface LandPoint {
  latRad: number;
  lonRad: number;
  cosLat: number;
  sinLat: number;
  isBangladesh?: boolean;
}

const DEFAULT_METRICS: ScaleMetrics = {
  linksCreated: 274_638_663,
  eventsTracked: 4_463_794_170,
  revenueTracked: 2_837_353_788.49,
};

const GLOBE_MARKERS: GlobeMarker[] = [
  { id: "dhk", label: "Dhaka, Bangladesh", lat: 23.8103, lon: 90.4125, isBangladesh: true },
  { id: "sf", label: "San Francisco", lat: 37.7749, lon: -122.4194 },
  { id: "nyc", label: "New York", lat: 40.7128, lon: -74.006 },
  { id: "lon", label: "London", lat: 51.5074, lon: -0.1278 },
  { id: "fra", label: "Frankfurt", lat: 50.1109, lon: 8.6821 },
  { id: "ist", label: "Istanbul", lat: 41.0082, lon: 28.9784 },
  { id: "sin", label: "Singapore", lat: 1.3521, lon: 103.8198 },
  { id: "tok", label: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { id: "sao", label: "São Paulo", lat: -23.5505, lon: -46.6333 },
  { id: "syd", label: "Sydney", lat: -33.8688, lon: 151.2093 },
];

const INITIAL_FEED: TelemetryEvent[] = [
  {
    id: "init-1",
    type: "click",
    country: "Bangladesh",
    countryCode: "BD",
    device: "Desktop",
    coordinates: [23.8103, 90.4125],
  },
  {
    id: "init-2",
    type: "signup",
    email: "****@hooli.com",
    avatarTone: "amber",
    coordinates: [23.8103, 90.4125],
  },
  {
    id: "init-3",
    type: "sale",
    amount: 49.0,
    coordinates: [1.3521, 103.8198],
  },
  {
    id: "init-4",
    type: "sale",
    amount: 98.88,
    coordinates: [50.1109, 8.6821],
  },
];

const DEFAULT_EVENT_QUEUE: Omit<TelemetryEvent, "id">[] = [
  {
    type: "click",
    country: "Bangladesh",
    countryCode: "BD",
    device: "Mobile",
    coordinates: [23.8103, 90.4125],
  },
  {
    type: "signup",
    email: "****@acme.com",
    avatarTone: "emerald",
    coordinates: [40.7128, -74.006],
  },
  {
    type: "sale",
    amount: 79.0,
    coordinates: [23.8103, 90.4125],
  },
  {
    type: "click",
    country: "Turkey",
    countryCode: "TR",
    device: "Desktop",
    coordinates: [41.0082, 28.9784],
  },
  {
    type: "click",
    country: "United States",
    countryCode: "US",
    device: "Mobile",
    coordinates: [37.7749, -122.4194],
  },
  {
    type: "signup",
    email: "****@vercel.com",
    avatarTone: "emerald",
    coordinates: [51.5074, -0.1278],
  },
  {
    type: "click",
    country: "Bangladesh",
    countryCode: "BD",
    device: "Desktop",
    coordinates: [23.8103, 90.4125],
  },
  {
    type: "sale",
    amount: 199.0,
    coordinates: [35.6762, 139.6503],
  },
  {
    type: "click",
    country: "Germany",
    countryCode: "DE",
    device: "Desktop",
    coordinates: [50.1109, 8.6821],
  },
  {
    type: "click",
    country: "Japan",
    countryCode: "JP",
    device: "Desktop",
    coordinates: [35.6762, 139.6503],
  },
  {
    type: "sale",
    amount: 24.5,
    coordinates: [1.3521, 103.8198],
  },
  {
    type: "click",
    country: "United Kingdom",
    countryCode: "GB",
    device: "Mobile",
    coordinates: [51.5074, -0.1278],
  },
];

// Accurate Bangladesh polygon [lat, lon] rendered distinctly on top of the 3D world globe
const BANGLADESH_POLYGON: Array<[number, number]> = [
  [26.63, 88.4],
  [26.48, 88.65],
  [26.32, 88.95],
  [26.25, 89.38],
  [26.12, 89.72],
  [25.85, 89.86],
  [25.45, 89.85],
  [25.22, 89.88],
  [25.18, 90.35],
  [25.16, 90.85],
  [25.19, 91.42],
  [25.18, 92.05],
  [25.05, 92.42],
  [24.82, 92.48],
  [24.55, 92.22],
  [24.28, 92.08],
  [24.12, 91.78],
  [24.08, 91.42],
  [23.78, 91.26],
  [23.45, 91.28],
  [23.15, 91.36],
  [22.96, 91.5],
  [23.22, 91.72],
  [23.58, 91.95],
  [23.72, 92.18],
  [23.42, 92.42],
  [22.85, 92.48],
  [22.3, 92.55],
  [21.75, 92.62],
  [21.28, 92.48],
  [20.82, 92.32],
  [20.73, 92.34],
  [21.05, 92.12],
  [21.45, 91.95],
  [21.95, 91.85],
  [22.35, 91.76],
  [22.72, 91.52],
  [22.82, 91.15],
  [22.72, 90.82],
  [22.35, 90.68],
  [21.95, 90.42],
  [21.82, 90.08],
  [21.7, 89.62],
  [21.66, 89.2],
  [21.72, 89.02],
  [22.25, 88.95],
  [22.85, 88.9],
  [23.35, 88.78],
  [23.78, 88.62],
  [24.08, 88.75],
  [24.38, 88.55],
  [24.55, 88.25],
  [24.72, 88.06],
  [24.98, 88.22],
  [25.18, 88.58],
  [25.25, 88.88],
  [25.45, 88.82],
  [25.62, 88.62],
  [25.85, 88.32],
  [26.05, 88.14],
  [26.38, 88.2],
];

// Simplified geographic continent polygons [lat, lon] for zero-dependency 3D halftone globe
const CONTINENT_POLYGONS: Array<Array<[number, number]>> = [
  // North America
  [
    [70, -162], [71, -156], [69, -135], [68, -120], [65, -105], [62, -92],
    [58, -94], [55, -82], [51, -79], [53, -74], [60, -77], [62, -72],
    [58, -64], [53, -56], [47, -53], [45, -61], [44, -66], [41, -70],
    [39, -74], [35, -75], [30, -81], [25, -80], [25, -82], [29, -84],
    [30, -89], [29, -95], [26, -97], [21, -97], [18, -94], [21, -90],
    [21, -87], [16, -88], [15, -83], [10, -83], [8, -77], [9, -80],
    [10, -85], [14, -92], [16, -99], [20, -105], [24, -108], [31, -114],
    [23, -110], [28, -115], [32, -117], [38, -123], [42, -124], [48, -125],
    [54, -130], [59, -138], [60, -148], [55, -162], [60, -166], [66, -168],
  ],
  // Greenland
  [
    [60, -44], [65, -38], [70, -22], [76, -18], [81, -20],
    [83, -35], [81, -52], [76, -68], [70, -54], [64, -52],
  ],
  // Cuba / Caribbean
  [
    [23, -84], [23, -80], [20, -74], [20, -78], [22, -83],
  ],
  // South America
  [
    [11, -75], [12, -70], [10, -62], [6, -53], [0, -50], [-5, -35],
    [-10, -36], [-16, -39], [-23, -42], [-26, -48], [-34, -53], [-38, -58],
    [-42, -64], [-47, -66], [-52, -68], [-55, -67], [-54, -72], [-48, -75],
    [-40, -73], [-30, -71], [-18, -71], [-12, -77], [-5, -81], [1, -80], [8, -77],
  ],
  // Europe
  [
    [36, -9], [38, -9], [43, -9], [43, -2], [46, -1], [48, -5],
    [49, 0], [51, 2], [54, 8], [57, 9], [55, 12], [54, 19],
    [57, 21], [60, 22], [60, 28], [65, 25], [68, 16], [71, 26],
    [69, 34], [67, 42], [68, 58], [60, 60], [50, 55], [46, 48],
    [45, 38], [47, 35], [45, 30], [41, 29], [40, 26], [37, 23],
    [38, 20], [41, 19], [45, 14], [44, 12], [40, 18], [38, 15],
    [41, 12], [44, 9], [43, 5], [41, 2], [36, -5],
  ],
  // Great Britain & Ireland
  [
    [50, -5], [54, -5], [58, -5], [58, -2], [55, -1], [52, 2], [50, 1],
  ],
  [
    [51, -10], [55, -8], [54, -6], [52, -6],
  ],
  // Iceland
  [
    [64, -24], [66, -23], [66, -14], [64, -14],
  ],
  // Africa
  [
    [35, -6], [37, 10], [33, 12], [31, 20], [32, 32], [27, 34],
    [20, 38], [12, 44], [11, 51], [4, 47], [-2, 41], [-10, 40],
    [-18, 36], [-26, 33], [-34, 26], [-35, 20], [-33, 18], [-22, 14],
    [-12, 13], [-5, 12], [4, 9], [5, 2], [5, -7], [8, -13],
    [15, -17], [22, -17], [30, -10],
  ],
  // Madagascar
  [
    [-12, 49], [-16, 50], [-25, 47], [-25, 44], [-16, 44],
  ],
  // Asia
  [
    [41, 29], [42, 41], [46, 48], [50, 55], [60, 60], [68, 58],
    [72, 72], [73, 85], [77, 104], [73, 125], [70, 145], [69, 165],
    [66, 178], [60, 166], [55, 160], [52, 156], [55, 140], [50, 140],
    [43, 135], [38, 128], [35, 129], [35, 126], [39, 125], [40, 121],
    [38, 118], [35, 120], [31, 122], [25, 119], [22, 114], [20, 106],
    [16, 108], [11, 109], [9, 105], [13, 100], [7, 100], [1, 104],
    [5, 100], [10, 98], [16, 97], [22, 91], [20, 86], [15, 80],
    [8, 77], [15, 74], [22, 69], [25, 66], [25, 57], [29, 48],
    [25, 51], [22, 59], [15, 52], [12, 44], [20, 40], [28, 35],
    [32, 35], [36, 36], [37, 27],
  ],
  // Japan
  [
    [31, 130], [34, 132], [35, 136], [36, 140], [41, 141],
    [44, 145], [45, 142], [42, 140], [38, 139], [35, 135], [33, 130],
  ],
  // Maritime Southeast Asia
  [
    [5, 95], [1, 103], [-6, 105], [-6, 104], [1, 98],
  ],
  [
    [-6, 106], [-7, 114], [-8, 114], [-7, 106],
  ],
  [
    [6, 117], [1, 118], [-3, 116], [-3, 110], [2, 109],
  ],
  [
    [-1, 131], [-4, 138], [-9, 148], [-10, 149], [-6, 142], [-2, 135],
  ],
  [
    [18, 121], [14, 123], [7, 126], [7, 122], [14, 120],
  ],
  // Australia
  [
    [-12, 131], [-12, 136], [-15, 136], [-12, 142], [-19, 147], [-26, 153],
    [-34, 151], [-38, 147], [-38, 141], [-35, 135], [-32, 132], [-32, 125],
    [-35, 117], [-32, 115], [-22, 114], [-18, 122], [-14, 126],
  ],
  // New Zealand
  [
    [-35, 173], [-38, 178], [-41, 175], [-46, 167], [-45, 166], [-41, 172], [-37, 174],
  ],
];

function pointInPolygon(
  lat: number,
  lon: number,
  polygon: Array<[number, number]>
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersects =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-9) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function isBangladeshPoint(lat: number, lon: number): boolean {
  if (lat < 20.6 || lat > 26.7 || lon < 87.9 || lon > 92.8) return false;
  return pointInPolygon(lat, lon, BANGLADESH_POLYGON);
}

function isLand(lat: number, lon: number): boolean {
  for (let i = 0; i < CONTINENT_POLYGONS.length; i++) {
    if (pointInPolygon(lat, lon, CONTINENT_POLYGONS[i])) {
      return true;
    }
  }
  return false;
}

let cachedLandPoints: LandPoint[] | null = null;
let cachedBdBorderRad: Array<{ latRad: number; lonRad: number; cosLat: number; sinLat: number }> | null = null;

function getBangladeshBorderRad() {
  if (cachedBdBorderRad) return cachedBdBorderRad;
  cachedBdBorderRad = BANGLADESH_POLYGON.map(([lat, lon]) => {
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    return {
      latRad,
      lonRad,
      cosLat: Math.cos(latRad),
      sinLat: Math.sin(latRad),
    };
  });
  return cachedBdBorderRad;
}

function getLandPoints(): LandPoint[] {
  if (cachedLandPoints) return cachedLandPoints;
  const points: LandPoint[] = [];
  const totalSamples = 11500;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < totalSamples; i++) {
    const y = 1 - (i / (totalSamples - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    const latRad = Math.asin(y);
    const lonRad = Math.atan2(x, z);
    const latDeg = (latRad * 180) / Math.PI;
    const lonDeg = (lonRad * 180) / Math.PI;

    const inBd = isBangladeshPoint(latDeg, lonDeg);
    if (inBd || isLand(latDeg, lonDeg)) {
      points.push({
        latRad,
        lonRad,
        cosLat: Math.cos(latRad),
        sinLat: y,
        isBangladesh: inBd,
      });
    }
  }

  // Add high-density Bangladesh surface dots so Bangladesh's silhouette is crisp on the 3D globe
  for (let lat = 20.75; lat <= 26.6; lat += 0.28) {
    for (let lon = 88.1; lon <= 92.6; lon += 0.28) {
      if (isBangladeshPoint(lat, lon)) {
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        points.push({
          latRad,
          lonRad,
          cosLat: Math.cos(latRad),
          sinLat: Math.sin(latRad),
          isBangladesh: true,
        });
      }
    }
  }

  cachedLandPoints = points;
  return points;
}

function formatInteger(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function CountryFlag({ code, uid }: { code?: CountryCode; uid: string }) {
  const clipId = `${uid}-flag-${code ?? "BD"}`;

  switch (code) {
    case "BD":
      return (
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          className="shrink-0 rounded-[2px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
          aria-hidden="true"
        >
          <rect width="16" height="12" fill="#006A4E" />
          <circle cx="7.2" cy="6" r="3.3" fill="#F42A41" />
        </svg>
      );
    case "TR":
      return (
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          className="shrink-0 rounded-[2px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
          aria-hidden="true"
        >
          <rect width="16" height="12" fill="#E30A17" />
          <circle cx="6.2" cy="6" r="2.7" fill="#FFFFFF" />
          <circle cx="7.05" cy="6" r="2.15" fill="#E30A17" />
          <path
            d="M9.6 4.75L10.05 5.65L11.05 5.75L10.3 6.4L10.5 7.35L9.6 6.85L8.75 7.35L8.95 6.4L8.2 5.75L9.15 5.65Z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case "US":
      return (
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          className="shrink-0 rounded-[2px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
          aria-hidden="true"
        >
          <rect width="16" height="12" fill="#FFFFFF" />
          <rect y="0" width="16" height="1.7" fill="#B22234" />
          <rect y="3.4" width="16" height="1.7" fill="#B22234" />
          <rect y="6.8" width="16" height="1.7" fill="#B22234" />
          <rect y="10.2" width="16" height="1.8" fill="#B22234" />
          <rect width="7.2" height="6.8" fill="#3C3B6E" />
        </svg>
      );
    case "DE":
      return (
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          className="shrink-0 rounded-[2px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
          aria-hidden="true"
        >
          <rect width="16" height="4" y="0" fill="#171717" />
          <rect width="16" height="4" y="4" fill="#DD0000" />
          <rect width="16" height="4" y="8" fill="#FFCE00" />
        </svg>
      );
    case "JP":
      return (
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          className="shrink-0 rounded-[2px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]"
          aria-hidden="true"
        >
          <rect width="16" height="12" fill="#FFFFFF" />
          <circle cx="8" cy="6" r="3.2" fill="#BC002D" />
        </svg>
      );
    case "GB":
      return (
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          className="shrink-0 rounded-[2px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <rect width="16" height="12" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="16" height="12" fill="#012169" />
            <path
              d="M0 0L16 12M16 0L0 12"
              stroke="#FFFFFF"
              strokeWidth="2.4"
            />
            <path
              d="M0 0L16 12M16 0L0 12"
              stroke="#C8102E"
              strokeWidth="1.2"
            />
            <path d="M8 0V12M0 6H16" stroke="#FFFFFF" strokeWidth="3.6" />
            <path d="M8 0V12M0 6H16" stroke="#C8102E" strokeWidth="2" />
          </g>
        </svg>
      );
    default:
      return (
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          className="shrink-0 rounded-[2px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
          aria-hidden="true"
        >
          <rect width="16" height="12" fill="#006A4E" />
          <circle cx="7.2" cy="6" r="3.3" fill="#F42A41" />
        </svg>
      );
  }
}

function PaymentBadge() {
  return (
    <span
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-[#ede9fe] dark:bg-violet-500/20"
      aria-hidden="true"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <rect x="1.5" y="1.5" width="9" height="9" rx="2.5" fill="#635BFF" />
        <path
          d="M4.2 6.2C4.2 5.3 5.1 4.9 6.1 4.9C6.8 4.9 7.4 5.1 7.8 5.4V4.2C7.3 4 6.7 3.8 6.1 3.8C4.5 3.8 3.2 4.7 3.2 6.2C3.2 7.7 4.4 8.3 5.8 8.3C6.6 8.3 7.3 8.1 7.8 7.8V6.6C7.3 6.9 6.7 7.1 6 7.1C5 7.1 4.2 6.8 4.2 6.2Z"
          fill="#FFFFFF"
        />
      </svg>
    </span>
  );
}

function SignupAvatar({ tone }: { tone?: "amber" | "emerald" | "neutral" }) {
  if (tone === "neutral") return null;

  const isEmerald = tone === "emerald";
  return (
    <span
      className={cn(
        "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
        isEmerald
          ? "bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400"
          : "bg-amber-100 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400"
      )}
      aria-hidden="true"
    >
      <User className="h-3 w-3 fill-current stroke-[1.75]" />
    </span>
  );
}

interface DottedGlobeProps {
  isDark: boolean;
  autoRotate: boolean;
  rotationSpeed: number;
  reducedMotion: boolean;
  focusTarget: { lat: number; lon: number; ts: number } | null;
}

function DottedGlobeCanvas({
  isDark,
  autoRotate,
  rotationSpeed,
  reducedMotion,
  focusTarget,
}: DottedGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const landPoints = useMemo(() => getLandPoints(), []);
  const bdBorder = useMemo(() => getBangladeshBorderRad(), []);

  // Start the 3D globe directly facing Bangladesh (90.4E, 23.7N)
  const rotRef = useRef({
    lon: (90.4 * Math.PI) / 180,
    lat: (23.7 * Math.PI) / 180,
    velLon: 0,
    velLat: 0,
    targetLon: null as number | null,
    targetLat: null as number | null,
    pulseLat: 23.8103,
    pulseLon: 90.4125,
    pulseStart: 0,
  });

  const dragRef = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    pointerId: -1,
  });

  const [isDragging, setIsDragging] = useState(false);

  // Focus globe smoothly when a live event fires or is clicked
  useEffect(() => {
    if (!focusTarget) return;
    const r = rotRef.current;
    r.pulseLat = focusTarget.lat;
    r.pulseLon = focusTarget.lon;
    r.pulseStart = performance.now();

    if (focusTarget.ts > 0 && !dragRef.current.active) {
      const targetLonRad = (focusTarget.lon * Math.PI) / 180;
      const targetLatRad = Math.max(
        -0.55,
        Math.min(0.65, (focusTarget.lat * Math.PI) / 180)
      );
      let diff = targetLonRad - r.lon;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      r.targetLon = r.lon + diff;
      r.targetLat = targetLatRad;
    }
  }, [focusTarget]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      dragRef.current = {
        active: true,
        lastX: e.clientX,
        lastY: e.clientY,
        pointerId: e.pointerId,
      };
      rotRef.current.targetLon = null;
      rotRef.current.targetLat = null;
      setIsDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture is unsupported
      }
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;

      const sensitivity = 0.0052;
      rotRef.current.lon -= dx * sensitivity;
      rotRef.current.lat = Math.max(
        -0.75,
        Math.min(0.85, rotRef.current.lat + dy * sensitivity)
      );
      rotRef.current.velLon = -dx * sensitivity * 0.45;
      rotRef.current.velLat = dy * sensitivity * 0.35;
    },
    []
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if already released
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      const step = 0.14;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        rotRef.current.targetLon = null;
        rotRef.current.lon -= step;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        rotRef.current.targetLon = null;
        rotRef.current.lon += step;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        rotRef.current.targetLat = null;
        rotRef.current.lat = Math.min(0.85, rotRef.current.lat + step * 0.6);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        rotRef.current.targetLat = null;
        rotRef.current.lat = Math.max(-0.75, rotRef.current.lat - step * 0.6);
      }
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let width = 620;
    let height = 620;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const size = Math.max(280, Math.round(rect.width));
      width = size;
      height = size;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const r = rotRef.current;

      if (!dragRef.current.active) {
        if (r.targetLon !== null && r.targetLat !== null) {
          const ease = 1 - Math.exp(-5.5 * dt);
          r.lon += (r.targetLon - r.lon) * ease;
          r.lat += (r.targetLat - r.lat) * ease;
          if (
            Math.abs(r.targetLon - r.lon) < 0.004 &&
            Math.abs(r.targetLat - r.lat) < 0.004
          ) {
            r.targetLon = null;
            r.targetLat = null;
          }
        } else {
          r.lon += r.velLon;
          r.lat = Math.max(-0.75, Math.min(0.85, r.lat + r.velLat));
          r.velLon *= Math.pow(0.08, dt);
          r.velLat *= Math.pow(0.08, dt);

          if (autoRotate && !reducedMotion) {
            r.lon += rotationSpeed * dt;
          }
        }
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;
      const radius = width * 0.455;

      // 1. Subtle outer ambient shadow & sphere base
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);

      const sphereGrad = ctx.createRadialGradient(
        cx - radius * 0.22,
        cy - radius * 0.24,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      if (isDark) {
        sphereGrad.addColorStop(0, "#1c1c1e");
        sphereGrad.addColorStop(0.72, "#121214");
        sphereGrad.addColorStop(1, "#0a0a0c");
      } else {
        sphereGrad.addColorStop(0, "#ffffff");
        sphereGrad.addColorStop(0.78, "#fcfcfc");
        sphereGrad.addColorStop(0.95, "#f3f3f3");
        sphereGrad.addColorStop(1, "#eaeaea");
      }

      ctx.shadowColor = isDark
        ? "rgba(0, 0, 0, 0.45)"
        : "rgba(0, 0, 0, 0.055)";
      ctx.shadowBlur = radius * 0.14;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = radius * 0.02;
      ctx.fillStyle = sphereGrad;
      ctx.fill();
      ctx.restore();

      // 2. Crisp 1px specular rim stroke
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isDark
        ? "rgba(255, 255, 255, 0.09)"
        : "rgba(0, 0, 0, 0.055)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const cosLatRot = Math.cos(r.lat);
      const sinLatRot = Math.sin(r.lat);

      // 3. Halftone world land dots (with Bangladesh highlighted in emerald)
      const dotBase = Math.max(0.85, radius * 0.0046);
      for (let i = 0; i < landPoints.length; i++) {
        const pt = landPoints[i];
        const dLon = pt.lonRad - r.lon;
        const rx = pt.cosLat * Math.sin(dLon);
        const rz0 = pt.cosLat * Math.cos(dLon);
        const ry = pt.sinLat * cosLatRot - rz0 * sinLatRot;
        const rz = pt.sinLat * sinLatRot + rz0 * cosLatRot;

        if (rz <= 0.02) continue;

        const px = cx + rx * radius * 0.985;
        const py = cy - ry * radius * 0.985;

        if (pt.isBangladesh) {
          const bdDotR = dotBase * (0.95 + rz * 0.65);
          const bdAlpha = Math.min(1, Math.pow(rz, 0.5) * 0.98);
          ctx.fillStyle = isDark
            ? `rgba(16, 185, 129, ${bdAlpha.toFixed(3)})`
            : `rgba(0, 106, 78, ${bdAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, bdDotR, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const dotR = dotBase * (0.68 + rz * 0.56);
          const alpha = Math.pow(rz, 0.65) * (isDark ? 0.52 : 0.48);
          ctx.fillStyle = isDark
            ? `rgba(212, 212, 216, ${alpha.toFixed(3)})`
            : `rgba(82, 82, 91, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3b. Crisp projected 3D spherical border contour around Bangladesh
      let bdVisibleCount = 0;
      let bdAvgRz = 0;
      const bdProjected: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < bdBorder.length; i++) {
        const pt = bdBorder[i];
        const dLon = pt.lonRad - r.lon;
        const rx = pt.cosLat * Math.sin(dLon);
        const rz0 = pt.cosLat * Math.cos(dLon);
        const ry = pt.sinLat * cosLatRot - rz0 * sinLatRot;
        const rz = pt.sinLat * sinLatRot + rz0 * cosLatRot;
        if (rz > 0.04) {
          bdVisibleCount += 1;
          bdAvgRz += rz;
          bdProjected.push({
            x: cx + rx * radius * 0.985,
            y: cy - ry * radius * 0.985,
          });
        }
      }

      if (bdVisibleCount === bdBorder.length && bdProjected.length > 2) {
        const avgRz = bdAvgRz / bdVisibleCount;
        const borderAlpha = Math.min(1, Math.pow(avgRz, 0.55) * 0.95);
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < bdProjected.length; i++) {
          const p = bdProjected[i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = isDark
          ? `rgba(16, 185, 129, ${(0.22 * borderAlpha).toFixed(3)})`
          : `rgba(0, 106, 78, ${(0.18 * borderAlpha).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = isDark
          ? `rgba(52, 211, 153, ${(0.9 * borderAlpha).toFixed(3)})`
          : `rgba(0, 106, 78, ${(0.88 * borderAlpha).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Infrastructure beacons (Dhaka highlighted in Bangladesh crimson-red, global hubs in coral)
      const pulseElapsed = (now - r.pulseStart) / 1000;
      for (let i = 0; i < GLOBE_MARKERS.length; i++) {
        const m = GLOBE_MARKERS[i];
        const mLat = (m.lat * Math.PI) / 180;
        const mLon = (m.lon * Math.PI) / 180;
        const dLon = mLon - r.lon;
        const cosM = Math.cos(mLat);
        const sinM = Math.sin(mLat);

        const rx = cosM * Math.sin(dLon);
        const rz0 = cosM * Math.cos(dLon);
        const ry = sinM * cosLatRot - rz0 * sinLatRot;
        const rz = sinM * sinLatRot + rz0 * cosLatRot;

        if (rz <= 0.04) continue;

        const px = cx + rx * radius * 0.985;
        const py = cy - ry * radius * 0.985;
        const depthAlpha = Math.min(1, Math.pow(rz, 0.55) * 1.12);
        const markerR =
          Math.max(3.6, radius * (m.isBangladesh ? 0.0195 : 0.0175)) *
          (0.78 + rz * 0.28);

        const rgb = m.isBangladesh ? "244, 42, 65" : "240, 109, 66";

        const isPulsing =
          !reducedMotion &&
          pulseElapsed >= 0 &&
          pulseElapsed < 1.6 &&
          Math.abs(m.lat - r.pulseLat) < 1 &&
          Math.abs(m.lon - r.pulseLon) < 1;

        if (isPulsing) {
          const p = pulseElapsed / 1.6;
          const ringR = markerR + p * markerR * 3.4;
          const ringAlpha = (1 - p) * 0.5 * depthAlpha;
          ctx.beginPath();
          ctx.arc(px, py, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb}, ${ringAlpha.toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Subtle outer halo
        ctx.beginPath();
        ctx.arc(px, py, markerR * 1.65, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${(0.22 * depthAlpha).toFixed(3)})`;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(px, py, markerR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${depthAlpha.toFixed(3)})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [autoRotate, bdBorder, isDark, landPoints, reducedMotion, rotationSpeed]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full max-w-[600px] select-none"
      style={{
        maskImage:
          "linear-gradient(to bottom, black 0%, black 66%, transparent 98%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black 66%, transparent 98%)",
      }}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label="Interactive global infrastructure globe with Bangladesh highlighted. Drag or use arrow keys to rotate."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-full w-full touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#d9531e]/50 focus-visible:ring-offset-2",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
      />
    </div>
  );
}

export const BuiltToScale = forwardRef<HTMLElement, BuiltToScaleProps>(
  function BuiltToScale(
    {
      title = "Built to scale",
      description = "Our powerful, battle-tested infrastructure handles hundreds of millions of links & events monthly and can scale infinitely with your business needs.",
      initialMetrics = DEFAULT_METRICS,
      theme = "auto",
      autoRotate = true,
      rotationSpeed = 0.35,
      liveEvents = true,
      eventInterval = 3800,
      events,
      className,
      ...rest
    },
    ref
  ) {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const prefersReducedMotion = Boolean(useReducedMotion());

    const [systemDark, setSystemDark] = useState(false);
    const [metrics, setMetrics] = useState<ScaleMetrics>(initialMetrics);
    const [feed, setFeed] = useState<TelemetryEvent[]>(() =>
      events && events.length > 0 ? events.slice(0, 4) : INITIAL_FEED
    );
    const [isFeedPaused, setIsFeedPaused] = useState(false);
    const [focusTarget, setFocusTarget] = useState<{
      lat: number;
      lon: number;
      ts: number;
    } | null>(null);

    const queueIndexRef = useRef(0);
    const seqRef = useRef(100);

    // Sync baseline metrics if parent updates them
    useEffect(() => {
      setMetrics(initialMetrics);
    }, [
      initialMetrics.linksCreated,
      initialMetrics.eventsTracked,
      initialMetrics.revenueTracked,
    ]);

    // Detect active dark mode for canvas rendering when theme === "auto"
    useEffect(() => {
      if (theme !== "auto" || typeof window === "undefined") return;

      const checkDark = () => {
        const htmlDark = document.documentElement.classList.contains("dark");
        const mediaDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        setSystemDark(htmlDark || mediaDark);
      };

      checkDark();
      const observer = new MutationObserver(checkDark);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", checkDark);

      return () => {
        observer.disconnect();
        mq.removeEventListener("change", checkDark);
      };
    }, [theme]);

    const isDark = theme === "dark" || (theme === "auto" && systemDark);

    // Stream live events and synchronize metrics
    useEffect(() => {
      if (!liveEvents || isFeedPaused || prefersReducedMotion) return;

      const safeInterval = Math.max(1200, Math.min(15000, eventInterval));
      const pool =
        events && events.length > 0 ? events : DEFAULT_EVENT_QUEUE;

      const timer = window.setInterval(() => {
        const template = pool[queueIndexRef.current % pool.length];
        queueIndexRef.current += 1;
        seqRef.current += 1;

        const nextEvent: TelemetryEvent = {
          ...template,
          id: `${uid}-ev-${seqRef.current}`,
        };

        setFeed((prev) => [nextEvent, ...prev.slice(0, 3)]);

        setMetrics((prev) => ({
          linksCreated:
            prev.linksCreated + (nextEvent.type === "signup" ? 1 : 0),
          eventsTracked: prev.eventsTracked + 1,
          revenueTracked:
            prev.revenueTracked +
            (nextEvent.type === "sale" && nextEvent.amount
              ? nextEvent.amount
              : 0),
        }));

        // Pulse the matching globe beacon without hijacking user's manual rotation
        setFocusTarget({
          lat: nextEvent.coordinates[0],
          lon: nextEvent.coordinates[1],
          ts: 0,
        });
      }, safeInterval);

      return () => window.clearInterval(timer);
    }, [
      liveEvents,
      isFeedPaused,
      prefersReducedMotion,
      eventInterval,
      events,
      uid,
    ]);

    const handleCardClick = useCallback((event: TelemetryEvent) => {
      setFocusTarget({
        lat: event.coordinates[0],
        lon: event.coordinates[1],
        ts: Date.now(),
      });
    }, []);

    const themeWrapperClass =
      theme === "dark"
        ? "dark bg-neutral-950 text-neutral-50"
        : theme === "light"
          ? "bg-[#fafafa] text-[#171717]"
          : "bg-[#fafafa] text-[#171717] dark:bg-neutral-950 dark:text-neutral-50";

    return (
      <section
        ref={ref}
        aria-labelledby={`${uid}-heading`}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20",
          themeWrapperClass,
          className
        )}
        {...rest}
      >
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Copy + Tabular Telemetry Counters */}
          <div className="relative z-10 flex flex-col lg:col-span-5">
            <h2
              id={`${uid}-heading`}
              className="text-[36px] font-medium leading-[1.12] tracking-[-0.03em] text-[#171717] dark:text-neutral-50 sm:text-[42px]"
            >
              {title}
            </h2>
            <p className="mt-4 max-w-[360px] text-[16px] leading-[1.58] text-[#737373] dark:text-neutral-400 sm:text-[17.5px]">
              {description}
            </p>

            <dl className="mt-10 space-y-7 sm:mt-12 sm:space-y-8">
              <div>
                <dt className="text-[12.5px] font-medium uppercase tracking-[0.06em] text-[#737373] dark:text-neutral-400">
                  Links Created
                </dt>
                <dd className="mt-2 font-mono text-[26px] font-medium leading-none tracking-[-0.02em] text-[#d9531e] tabular-nums dark:text-[#f97316] sm:text-[31px]">
                  {formatInteger(metrics.linksCreated)}
                </dd>
              </div>

              <div>
                <dt className="text-[12.5px] font-medium uppercase tracking-[0.06em] text-[#737373] dark:text-neutral-400">
                  Events Tracked
                </dt>
                <dd className="mt-2 font-mono text-[26px] font-medium leading-none tracking-[-0.02em] text-[#d9531e] tabular-nums dark:text-[#f97316] sm:text-[31px]">
                  {formatInteger(metrics.eventsTracked)}
                </dd>
              </div>

              <div>
                <dt className="text-[12.5px] font-medium uppercase tracking-[0.06em] text-[#737373] dark:text-neutral-400">
                  Revenue Tracked
                </dt>
                <dd className="mt-2 font-mono text-[26px] font-medium leading-none tracking-[-0.02em] text-[#d9531e] tabular-nums dark:text-[#f97316] sm:text-[31px]">
                  {formatCurrency(metrics.revenueTracked)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Right Column: Interactive 3D Dotted Globe + Floating Live Event Stack */}
          <div className="relative flex min-h-[460px] items-center justify-center sm:min-h-[560px] lg:col-span-7 lg:min-h-[600px]">
            {/* 3D Dotted Globe with Bangladesh Highlighted */}
            <div className="w-full max-w-[540px] lg:-ml-16 lg:max-w-[600px]">
              <DottedGlobeCanvas
                isDark={isDark}
                autoRotate={autoRotate}
                rotationSpeed={rotationSpeed}
                reducedMotion={prefersReducedMotion}
                focusTarget={focusTarget}
              />
            </div>

            {/* Floating Live Event Feed Stack */}
            <div
              role="region"
              aria-label="Live infrastructure events"
              aria-live="polite"
              onMouseEnter={() => setIsFeedPaused(true)}
              onMouseLeave={() => setIsFeedPaused(false)}
              className="pointer-events-auto absolute bottom-0 right-0 z-20 w-[260px] sm:bottom-2 sm:right-2 sm:w-[292px]"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
              }}
            >
              <div className="flex flex-col gap-2.5 pb-6">
                <AnimatePresence initial={false} mode="popLayout">
                  {feed.map((event) => (
                    <motion.button
                      key={event.id}
                      type="button"
                      layout={!prefersReducedMotion}
                      initial={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: -18, scale: 0.97 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 12, scale: 0.97 }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 360,
                        damping: 34,
                        mass: 0.85,
                      }}
                      onClick={() => handleCardClick(event)}
                      title="Focus region on globe"
                      className={cn(
                        "group w-full rounded-[14px] border border-neutral-200/85 bg-white/90 p-3 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-colors duration-150",
                        "hover:border-neutral-300/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9531e]/40",
                        "dark:border-neutral-800/90 dark:bg-neutral-900/90 dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)] dark:hover:border-neutral-700"
                      )}
                    >
                      {/* Card Header */}
                      <div className="mb-2.5 flex items-center gap-2 px-0.5 text-[13px] font-medium text-neutral-700 dark:text-neutral-200">
                        {event.type === "signup" && (
                          <>
                            <UserPlus
                              className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400"
                              aria-hidden="true"
                            />
                            <span>New sign up</span>
                          </>
                        )}
                        {event.type === "sale" && (
                          <>
                            <Receipt
                              className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400"
                              aria-hidden="true"
                            />
                            <span>New sale</span>
                          </>
                        )}
                        {event.type === "click" && (
                          <>
                            <MousePointerClick
                              className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400"
                              aria-hidden="true"
                            />
                            <span>New click</span>
                          </>
                        )}
                      </div>

                      {/* Card Body Inset Pill(s) */}
                      {event.type === "signup" && (
                        <div className="flex items-center gap-2.5 rounded-[9px] border border-neutral-200/80 bg-white px-3 py-2 text-[13px] text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:border-neutral-800 dark:bg-neutral-950/80 dark:text-neutral-200">
                          <SignupAvatar tone={event.avatarTone} />
                          <span className="truncate font-normal">
                            {event.email ?? "****@acme.com"}
                          </span>
                        </div>
                      )}

                      {event.type === "sale" && (
                        <div className="flex items-center gap-2.5 rounded-[9px] border border-neutral-200/80 bg-white px-3 py-2 text-[13px] font-medium text-neutral-800 tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:border-neutral-800 dark:bg-neutral-950/80 dark:text-neutral-100">
                          <PaymentBadge />
                          <span>{formatCurrency(event.amount ?? 0)}</span>
                        </div>
                      )}

                      {event.type === "click" && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 rounded-[9px] border border-neutral-200/80 bg-white px-3 py-2 text-[13px] text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:border-neutral-800 dark:bg-neutral-950/80 dark:text-neutral-200">
                            <CountryFlag code={event.countryCode} uid={uid} />
                            <span className="truncate">
                              {event.country ?? "Bangladesh"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 rounded-[9px] border border-neutral-200/80 bg-white px-3 py-2 text-[13px] text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:border-neutral-800 dark:bg-neutral-950/80 dark:text-neutral-200">
                            {event.device === "Mobile" ? (
                              <Smartphone
                                className="h-3.5 w-3.5 shrink-0 text-neutral-500 dark:text-neutral-400"
                                aria-hidden="true"
                              />
                            ) : (
                              <Monitor
                                className="h-3.5 w-3.5 shrink-0 text-neutral-500 dark:text-neutral-400"
                                aria-hidden="true"
                              />
                            )}
                            <span>{event.device ?? "Desktop"}</span>
                          </div>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

BuiltToScale.displayName = "BuiltToScale";

export { BuiltToScale as component, BuiltToScale as Component };
export default BuiltToScale;
