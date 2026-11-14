"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Handcrafted Memoji Avatar Component (Exact vector geometry)
 */
const MemojiAvatar: React.FC = () => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full select-none pointer-events-none"
  >
    {/* Body / Dark Crewneck Collar */}
    <path
      d="M28 120C28 102 42 98 60 98C78 98 92 102 92 120H28Z"
      fill="#16171A"
    />
    <path
      d="M48 99C52 103 68 103 72 99"
      stroke="#27282D"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Neck */}
    <rect x="52" y="80" width="16" height="20" rx="4" fill="#EDB991" />

    {/* Ears */}
    <ellipse cx="37" cy="65" rx="6.5" ry="9" fill="#EDB991" />
    <ellipse cx="37" cy="65" rx="3.5" ry="5.5" fill="#DC9F75" />
    <ellipse cx="83" cy="65" rx="6.5" ry="9" fill="#EDB991" />
    <ellipse cx="83" cy="65" rx="3.5" ry="5.5" fill="#DC9F75" />

    {/* Head Base */}
    <path
      d="M40 54C40 40 49 32 60 32C71 32 80 40 80 54C80 72 73 84 60 84C47 84 40 72 40 54Z"
      fill="#F5C7A3"
    />

    {/* Beard & Stubble Contour */}
    <path
      d="M42 60C42 74 48 83 60 83C72 83 78 74 78 60C78 64 77 75 69 80C65 82 55 82 51 80C43 75 42 64 42 60Z"
      fill="#2A221E"
    />
    {/* Chin Goatee Shading */}
    <path
      d="M54 75C54 78 66 78 66 75C66 81 54 81 54 75Z"
      fill="#1C1714"
    />

    {/* Mouth & Smile */}
    <path
      d="M51 66C51 72 69 72 69 66Z"
      fill="#5A1A1A"
    />
    {/* White Teeth */}
    <path
      d="M53 66.5C55 69 65 69 67 66.5H53Z"
      fill="#FFFFFF"
    />
    {/* Mustache */}
    <path
      d="M49 63.5C53 61.5 58 63 60 64C62 63 67 61.5 71 63.5C68 65.5 63 65 60 65.5C57 65 52 65.5 49 63.5Z"
      fill="#231B17"
    />

    {/* Nose */}
    <path
      d="M58 55C58 58 62 58 62 55"
      stroke="#D8996F"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Eyes */}
    <circle cx="50" cy="52" r="3" fill="#1C1816" />
    <circle cx="70" cy="52" r="3" fill="#1C1816" />
    <circle cx="51" cy="51" r="1" fill="#FFFFFF" />
    <circle cx="71" cy="51" r="1" fill="#FFFFFF" />

    {/* Eyebrows */}
    <path
      d="M45 46C48 44 53 45 55 47"
      stroke="#201A17"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M65 47C67 45 72 44 75 46"
      stroke="#201A17"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Modern Translucent Glasses */}
    {/* Left Rim */}
    <rect
      x="43"
      y="45"
      width="15"
      height="14"
      rx="4.5"
      stroke="#E2E8F0"
      strokeWidth="2"
      fill="rgba(255,255,255,0.12)"
    />
    {/* Right Rim */}
    <rect
      x="62"
      y="45"
      width="15"
      height="14"
      rx="4.5"
      stroke="#E2E8F0"
      strokeWidth="2"
      fill="rgba(255,255,255,0.12)"
    />
    {/* Glasses Bridge & Temples */}
    <path d="M58 50H62" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
    <path d="M43 49L37 48" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M77 49L83 48" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />

    {/* Hair (Volumetric Pompadour / Quiff with Faded Sides) */}
    <path
      d="M38 52V42C38 32 46 22 60 22C74 22 82 32 82 42V52C82 46 80 40 76 36C70 31 50 31 44 36C40 40 38 46 38 52Z"
      fill="#241C18"
    />
    <path
      d="M44 36C50 26 70 26 76 36C71 27 49 27 44 36Z"
      fill="#362923"
    />
  </svg>
);

export interface PassiveIncomeCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onActionClick?: () => void;
}

export default function PassiveIncomeCard({
  className,
  onActionClick,
  ...props
}: PassiveIncomeCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full items-center justify-center bg-[#050507] p-4 font-sans antialiased select-none",
        className
      )}
      {...props}
    >
      {/* 1:1 Square Target Canvas Frame */}
      <div className="relative aspect-square w-full max-w-[480px] overflow-hidden rounded-[20px] bg-[#08080A] border border-white/[0.04] shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col items-center justify-between py-[68px] px-6">
        
        {/* 1. Precision Background Dot Grid Pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)",
            backgroundSize: "14px 14px",
            backgroundPosition: "center center",
          }}
        />

        {/* Subtle Ambient Vignette & Center Radial Glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.025) 0%, transparent 68%)",
          }}
        />

        {/* 2. Headline: Exact Text & Line Breaks */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center pt-1">
          <h1 className="text-[20px] font-normal leading-[1.28] tracking-[-0.015em] text-[#E4E4E8]">
            Passive income generated
            <br />
            while you sleep.
          </h1>
        </div>

        {/* 3. Notification Card Stack (Underlying Tray + Main Floating Card) */}
        <div className="relative z-10 flex items-center justify-center w-full my-auto">
          <div className="relative flex items-center justify-center w-full max-w-[392px]">
            
            {/* Underlying Stack Tray Peeking Downwards */}
            <div
              className="absolute top-[8px] w-[93%] h-[98px] rounded-[24px] bg-[#111214] border border-white/[0.035]"
              style={{
                boxShadow: "0 18px 36px rgba(0, 0, 0, 0.85)",
              }}
            />

            {/* Main Foreground Card */}
            <div
              className="relative w-full h-[98px] rounded-[24px] px-[18px] flex items-center gap-[16px] cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
              style={{
                background:
                  "linear-gradient(180deg, #222327 0%, #191A1D 50%, #111214 100%)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderTop: "1px solid rgba(255, 255, 255, 0.22)",
                boxShadow:
                  "inset 0 1px 1px 0 rgba(255, 255, 255, 0.16), 0 24px 48px -12px rgba(0, 0, 0, 0.95), 0 12px 24px -6px rgba(0, 0, 0, 0.75)",
              }}
            >
              {/* Memoji Avatar Squircle Container */}
              <div
                className="relative w-[62px] h-[62px] flex-shrink-0 rounded-[18px] overflow-hidden flex items-end justify-center border border-white/[0.12]"
                style={{
                  background:
                    "linear-gradient(180deg, #1A2849 0%, #173B8A 55%, #1D53C9 100%)",
                  boxShadow:
                    "inset 0 1px 1.5px rgba(255, 255, 255, 0.25), 0 4px 12px rgba(0, 0, 0, 0.4)",
                }}
              >
                <div className="w-[56px] h-[56px] mb-[-2px]">
                  <MemojiAvatar />
                </div>
              </div>

              {/* Text Meta Content */}
              <div className="flex flex-col justify-center gap-[3px]">
                {/* Metric Amount Row */}
                <div className="flex items-baseline gap-[6px] leading-none">
                  <span className="text-[22px] font-[500] text-[#7E8B9F] select-none">
                    +
                  </span>
                  <span className="text-[26px] font-[600] tracking-[-0.025em] text-[#FFFFFF] tabular-nums">
                    $2400
                  </span>
                </div>

                {/* Status Message Verbatim */}
                <p className="text-[15px] font-normal tracking-[-0.01em] text-[#7B7C84] leading-tight">
                  Has been received at your bank!
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* 4. Bottom Tactile Arrow Action Button */}
        <div className="relative z-10 flex items-center justify-center pb-2">
          <button
            type="button"
            aria-label="Continue"
            onClick={onActionClick}
            className="group relative w-[52px] h-[52px] rounded-[16px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95"
            style={{
              background:
                "linear-gradient(180deg, #25262B 0%, #17181B 60%, #101113 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderTop: "1px solid rgba(255, 255, 255, 0.28)",
              boxShadow:
                "inset 0 1px 1px 0 rgba(255, 255, 255, 0.18), 0 10px 24px -4px rgba(0, 0, 0, 0.8), 0 4px 6px -2px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Arrow SVG Icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-[22px] h-[22px] text-[#F3F4F6] transition-transform duration-200 group-hover:translate-x-0.5"
            >
              <path
                d="M5 12H19M13 6L19 12L13 18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Soft Edge Shadow Mask */}
        <div className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[inset_0_0_50px_rgba(0,0,0,0.85)]" />
      </div>
    </div>
  );
}
