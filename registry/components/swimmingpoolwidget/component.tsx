"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface PoolSession {
  id: string;
  title: string;
  timeRange: string;
  active?: boolean;
}

export interface SwimmingPoolWidgetProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: [string, string];
  sessions?: PoolSession[];
  activeDotIndex?: number;
  totalDots?: number;
  onShowQrCode?: () => void;
}

const DEFAULT_SESSIONS: PoolSession[] = [
  {
    id: "beginners",
    title: "Beginners session",
    timeRange: "10:00 – 10:45",
    active: true,
  },
  {
    id: "senior",
    title: "Senior",
    timeRange: "11:00 –",
    active: false,
  },
];

function SwimmerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 78 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Head */}
      <circle cx="56.5" cy="12" r="5.5" fill="currentColor" />
      {/* Bent arm & torso */}
      <path
        d="M14.5 23.5L25.8 7.6C27.2 5.6 30.1 5.6 31.6 7.5L42.8 21.8C43.6 22.8 42.9 24.3 41.6 24.3H34.2L28.7 16.8L22.5 25.2C21.6 26.4 19.9 26.6 18.7 25.8L14.5 23.5Z"
        fill="currentColor"
      />
      {/* Solid upper wave */}
      <path
        d="M4 32.5C8.5 27.5 14.5 27.5 19.5 32.5C24.5 37.5 30.5 37.5 35.5 32.5C40.5 27.5 46.5 27.5 51.5 32.5C56.5 37.5 62.5 37.5 67.5 32.5C70 30 72.2 29.3 74 29.8"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dotted lower wave */}
      <path
        d="M5 42C9.5 37 15.5 37 20.5 42C25.5 47 31.5 47 36.5 42C41.5 37 47.5 37 52.5 42C57.5 47 63.5 47 68.5 42C70.8 39.7 72.5 39 74 39.3"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeDasharray="0.1 6.8"
      />
    </svg>
  );
}

function QrCodeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 66 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top-left finder */}
      <rect
        x="3"
        y="3"
        width="23"
        height="23"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="5.5"
      />
      <rect x="11" y="11" width="7" height="7" rx="1.2" fill="currentColor" />

      {/* Top-right finder */}
      <rect
        x="40"
        y="3"
        width="23"
        height="23"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="5.5"
      />
      <rect x="48" y="11" width="7" height="7" rx="1.2" fill="currentColor" />

      {/* Bottom-left finder */}
      <rect
        x="3"
        y="39"
        width="23"
        height="23"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="5.5"
      />
      <rect x="11" y="47" width="7" height="7" rx="1.2" fill="currentColor" />

      {/* Bottom-right 5-dot matrix */}
      <rect x="38" y="38" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
      <rect x="56" y="38" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
      <rect x="47" y="47" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
      <rect x="38" y="56" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
      <rect x="56" y="56" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export const SwimmingPoolWidget: React.FC<SwimmingPoolWidgetProps> = ({
  title = ["Swimming", "pool"],
  sessions = DEFAULT_SESSIONS,
  activeDotIndex = 1,
  totalDots = 4,
  onShowQrCode,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-sans antialiased",
        className
      )}
      {...props}
    >
      {/* Outer Device Bezel (400x400, 0.5x of 800x800 reference) */}
      <div className="flex h-[400px] w-[400px] flex-col items-center rounded-[80px] bg-[#02020E] px-[6px] pt-[6px] dark:ring-1 dark:ring-white/10">
        {/* Inner Periwinkle Card (388x341) */}
        <section
          aria-label={`${title[0]} ${title[1]}`}
          className="flex h-[341px] w-[388px] flex-col overflow-hidden rounded-[74px] bg-[#788BF1] px-[22px] pb-[22px] pt-[17px]"
        >
          {/* Header Row */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-[20px]">
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.16] text-white">
                <SwimmerIcon className="h-[24px] w-[39px]" />
              </div>
              <h1 className="text-[25.5px] font-medium leading-[1.06] tracking-[-0.02em] text-white">
                <span className="block">{title[0]}</span>
                <span className="block">{title[1]}</span>
              </h1>
            </div>

            <div
              aria-hidden="true"
              className="mr-[15.5px] h-[39.5px] w-[39.5px] shrink-0 rounded-full bg-[#6071C3]"
            />
          </header>

          {/* Horizontal Sessions Carousel */}
          <div className="mt-[24px] flex items-stretch">
            {sessions.map((session, idx) => {
              const isActive = session.active ?? idx === 0;
              return (
                <div
                  key={session.id}
                  className={cn(
                    "flex shrink-0 items-center",
                    idx > 0 && "ml-[47px]"
                  )}
                >
                  <div
                    aria-hidden="true"
                    className={cn(
                      "h-[91px] w-[4px] shrink-0 rounded-full",
                      isActive ? "bg-[#E2E3F7]" : "bg-white/[0.22]"
                    )}
                  />
                  <div className="ml-[20px] flex flex-col justify-center gap-[12px]">
                    <p
                      className={cn(
                        "whitespace-nowrap text-[22px] font-medium leading-[1.1] tracking-[-0.02em]",
                        isActive ? "text-white" : "text-white/[0.28]"
                      )}
                    >
                      {session.title}
                    </p>
                    <p
                      className={cn(
                        "whitespace-nowrap text-[21px] font-normal leading-[1.1] tracking-[-0.015em] tabular-nums",
                        isActive ? "text-[#ECEFFF]" : "text-white/[0.24]"
                      )}
                    >
                      {session.timeRange}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Pill Action Button */}
          <button
            type="button"
            onClick={onShowQrCode}
            className="mt-[27px] flex h-[84px] w-full cursor-pointer items-center justify-center gap-[13px] rounded-full bg-[#8F9FF4] text-[21.5px] font-medium leading-none tracking-[-0.015em] text-white transition-colors hover:bg-[#9BA9F6] active:scale-[0.99]"
          >
            <QrCodeIcon className="h-[32.5px] w-[33px] shrink-0" />
            <span>Show QR code</span>
          </button>
        </section>

        {/* Bottom Pagination Dots */}
        <nav
          aria-label="Widget pages"
          className="flex h-[53px] w-full items-center justify-center gap-[10px] pb-[6px]"
        >
          {Array.from({ length: totalDots }).map((_, index) => {
            const isActive = index === activeDotIndex;
            return (
              <span
                key={index}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "h-[11.5px] w-[11.5px] rounded-full",
                  isActive ? "bg-[#768EE8]" : "bg-[#313967]"
                )}
              />
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default SwimmingPoolWidget;
