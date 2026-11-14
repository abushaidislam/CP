"use client";

import React from "react";
import { motion } from "framer-motion";
import RadioHeadArtwork from "./component";

export default function Demo() {
  return (
    <div className="min-h-screen w-full bg-[#f2eee5] text-[#1a1a1a] flex flex-col justify-between selection:bg-neutral-900 selection:text-white font-sans antialiased overflow-hidden relative">
      {/* Soft warm vignette matching the aesthetic */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 65% 50%, rgba(255, 255, 255, 0.6) 0%, rgba(242, 238, 229, 0.3) 50%, rgba(230, 224, 214, 0.7) 100%)",
        }}
      />

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 pt-8 pb-4 flex items-center justify-between z-20">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 select-none"
        >
          404
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex items-center space-x-6 sm:space-x-10 text-sm font-medium text-neutral-700 select-none"
        >
          <a
            href="#home"
            className="hover:text-black transition-colors duration-150 relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-sm"
          >
            Home
          </a>
          <a
            href="#about"
            className="hover:text-black transition-colors duration-150 relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-sm"
          >
            About
          </a>
          <a
            href="#contact"
            className="hover:text-black transition-colors duration-150 relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-sm"
          >
            Contact
          </a>
        </motion.nav>
      </header>

      {/* Main 404 Hero Section - Anchored tightly to the bottom */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 flex flex-col lg:flex-row items-center lg:items-end justify-between pt-4 lg:pt-0 pb-0 gap-6 lg:gap-8 z-10 min-h-0">
        {/* Left Column: Typography & Action */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:max-w-md xl:max-w-lg flex flex-col items-start justify-center py-6 sm:py-10 lg:pb-32 lg:pt-0"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 leading-[1.08] text-balance">
            Page Not Found
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-neutral-600 max-w-md leading-relaxed text-pretty">
            Looks like the signal is lost. The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <motion.div
            className="mt-8 sm:mt-10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <a
              href="#home"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#121212] text-[#fbfbfb] text-sm font-medium tracking-wide shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-neutral-800 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 active:scale-[0.98]"
            >
              <span>Go Back Home</span>
            </a>
          </motion.div>

          {/* Subtle status caption under CTA */}
          <div className="mt-10 lg:mt-14 flex items-center gap-3 text-xs text-neutral-500 font-medium select-none">
            <span>Lost Broadcast Studio &copy; {new Date().getFullYear()}</span>
            <span className="h-2.5 w-px bg-neutral-300" />
            <span className="font-mono tabular-nums">STATUS: 404_OFFLINE</span>
          </div>
        </motion.div>

        {/* Right Column: High-Scale Character Artwork pinned with ZERO bottom space */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[58%] xl:w-[62%] flex items-end justify-center lg:justify-end relative self-end -mb-1 pb-0 overflow-visible leading-none"
        >
          {/* Stylized 'No Signal' Broken Broadcast Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="absolute top-2 sm:top-6 lg:top-8 right-6 sm:right-12 lg:right-16 z-20 text-neutral-900 select-none"
            title="Signal Lost"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 sm:w-12 sm:h-12"
              aria-hidden="true"
            >
              {/* Outer wave */}
              <path
                d="M10 18C14.2 13.8 20 11.5 26 11.5C30.5 11.5 34.8 13 38.4 15.8"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Middle wave */}
              <path
                d="M15 24C18 21 21.8 19.5 26 19.5C28.8 19.5 31.6 20.3 34 22"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Diamond origin dot */}
              <rect
                x="22"
                y="29"
                width="5.5"
                height="5.5"
                rx="1"
                transform="rotate(45 22 29)"
                fill="currentColor"
              />
              {/* Disconnected Cross 'X' mark */}
              <path
                d="M33 30L41 38M41 30L33 38"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>

          {/* Glitch Horizontal Scan Lines around suit body */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end items-center pb-20 opacity-85 select-none"
          >
            <div className="w-full max-w-[620px] relative h-[320px]">
              <span className="absolute left-4 top-28 w-16 sm:w-24 h-[3px] bg-neutral-400/60 rounded-sm" />
              <span className="absolute left-12 top-36 w-10 sm:w-14 h-[2px] bg-neutral-300/80 rounded-sm" />
              <span className="absolute left-0 top-48 w-20 sm:w-28 h-[3.5px] bg-neutral-500/40 rounded-sm" />
              <span className="absolute left-8 top-56 w-12 sm:w-16 h-[2px] bg-neutral-400/50 rounded-sm" />

              <span className="absolute right-8 top-32 w-16 sm:w-24 h-[3px] bg-neutral-400/60 rounded-sm" />
              <span className="absolute right-4 top-44 w-24 sm:w-32 h-[3.5px] bg-neutral-500/45 rounded-sm" />
              <span className="absolute right-12 top-52 w-12 sm:w-20 h-[2px] bg-neutral-300/70 rounded-sm" />
              <span className="absolute right-2 top-64 w-16 sm:w-24 h-[3px] bg-neutral-400/50 rounded-sm" />
            </div>
          </div>

          {/* Large Scaled Radio Man Artwork flush to bottom */}
          <div className="w-full max-w-[600px] sm:max-w-[700px] lg:max-w-[820px] xl:max-w-[880px] relative z-10 flex items-end justify-center translate-y-1">
            <RadioHeadArtwork
              interactive={true}
              showControls={false}
              transparentBg={true}
              className="w-full"
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
