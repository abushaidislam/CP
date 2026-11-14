"use client";

import React from "react";
import MedusaNavbar from "./medusa-navbar"; // আপনার মূল কম্পোনেন্টের পাথ
import { ArrowRight, Sparkles } from "lucide-react";

export default function MedusaNavbarDemo() {
  return (
    <div className="relative w-full min-h-[680px] overflow-hidden rounded-xl border border-neutral-200/80 bg-white font-sans text-neutral-950 antialiased shadow-sm">
      {/* 1. The Navbar Component */}
      <MedusaNavbar />

      {/* 2. Mock Hero Background & Showcase Area */}
      <div className="relative mx-auto flex max-w-[1240px] flex-col items-center px-6 pt-20 pb-28 text-center">
        {/* Subtle Background Radial Glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[350px] w-[600px] rounded-full bg-gradient-to-b from-neutral-100 to-transparent blur-3xl opacity-60" />

        {/* Release Pill Badge */}
        <div className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-neutral-50 px-3 py-1 text-[12px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <Sparkles size={13} className="text-neutral-500" />
          <span>Medusa 2.0 Architectural Overhaul</span>
          <ArrowRight size={12} className="text-neutral-400" />
        </div>

        {/* Hero Title */}
        <h1 className="relative max-w-[760px] text-4xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
          Build and scale commerce applications with autonomous agents.
        </h1>

        {/* Hero Subtitle */}
        <p className="relative mt-5 max-w-[520px] text-[15px] leading-relaxed tracking-[-0.01em] text-neutral-500">
          A high-performance rolling-shutter navigation menu built with Framer Motion, 
          Tailwind CSS, and accessible keyboard mechanics.
        </p>

        {/* Call-to-action Buttons */}
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
            className="rounded-lg border border-neutral-200/90 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition-all duration-150 hover:bg-neutral-50 hover:border-neutral-300"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}