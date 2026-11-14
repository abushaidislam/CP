import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Custom 2x3 Dot Matrix Icon (Replit Free/Power/Max Mode indicator)
const DotMatrixIcon = ({ className = "w-3.5 h-4.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 14 18"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <circle cx="3" cy="3" r="1.75" />
    <circle cx="11" cy="3" r="1.75" />
    <circle cx="3" cy="9" r="1.75" />
    <circle cx="11" cy="9" r="1.75" />
    <circle cx="3" cy="15" r="1.75" />
    <circle cx="11" cy="15" r="1.75" />
  </svg>
);

type ModeKey = "Free" | "Power" | "Max";

interface ModeData {
  badge: string;
  title: string;
  description: string;
}

const MODES: Record<ModeKey, ModeData> = {
  Free: {
    badge: "FREE MODE",
    title: "Create without\ntoken costs",
    description: "Brainstorm and create at no cost.",
  },
  Power: {
    badge: "POWER MODE",
    title: "High-speed\nagent compute",
    description: "Dedicated execution environments with no rate limits.",
  },
  Max: {
    badge: "MAX MODE",
    title: "Frontier reasoning\nfor deep tasks",
    description: "Multi-step complex system design with elite models.",
  },
};

export default function MeetReplitShowcase() {
  const [activeMode, setActiveMode] = useState<ModeKey>("Free");

  return (
    <section className="min-h-screen bg-[#FAF7F2] text-[#18181B] py-16 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-[#F23F0C] selection:text-white">
      <div className="max-w-[1240px] mx-auto">
        {/* Main Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-[46px] sm:text-[54px] font-[450] tracking-[-0.035em] text-[#18181B] leading-none mb-3">
            Meet <span className="text-[#F23F0C]">Replit</span>
          </h1>
          <p className="text-[20px] sm:text-[22px] text-[#71717A] font-normal tracking-[-0.015em]">
            Maximize Making on Replit
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ========================================================
              CARD 1: FREE / POWER / MAX MODE
             ======================================================== */}
          <div className="bg-[#F89E78] rounded-[32px] p-8 sm:p-10 min-h-[380px] flex flex-col justify-between overflow-hidden relative border-0">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start h-full">
              {/* Dynamic Content */}
              <div className="sm:col-span-7 flex flex-col justify-between h-full min-h-[220px]">
                <div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeMode}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.22, ease: [0.2, 0.0, 0.0, 1.0] }}
                    >
                      <span className="text-[11.5px] font-semibold tracking-[0.16em] text-[#24110A]/75 uppercase block mb-3.5">
                        {MODES[activeMode].badge}
                      </span>
                      <h2 className="text-[34px] sm:text-[36px] font-[450] tracking-[-0.03em] text-[#160A06] leading-[1.12] whitespace-pre-line mb-4">
                        {MODES[activeMode].title}
                      </h2>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeMode + "-desc"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[14px] text-[#24110A]/80 font-normal leading-[1.4] max-w-[260px]"
                  >
                    {MODES[activeMode].description}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Mode Selectors */}
              <div className="sm:col-span-5 flex flex-col gap-2 justify-center pt-2 sm:pt-0">
                {(["Free", "Power", "Max"] as ModeKey[]).map((mode) => {
                  const isSelected = activeMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setActiveMode(mode)}
                      className="relative w-full text-left py-3.5 px-5 rounded-[22px] transition-colors focus:outline-none flex items-center gap-3.5"
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-mode-pill"
                          className="absolute inset-0 bg-[#E23707] rounded-[22px] shadow-sm z-0"
                          transition={{
                            type: "tween",
                            ease: [0.2, 0.0, 0.0, 1.0],
                            duration: 0.32,
                          }}
                        />
                      )}
                      <span
                        className={`relative z-10 transition-colors duration-200 ${
                          isSelected ? "text-white" : "text-white/80 hover:text-white"
                        }`}
                      >
                        <DotMatrixIcon />
                      </span>
                      <span
                        className={`relative z-10 text-[22px] font-[450] tracking-tight transition-colors duration-200 ${
                          isSelected ? "text-white" : "text-white/90 hover:text-white"
                        }`}
                      >
                        {mode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================================
              CARD 2: REPLIT CHAT (PIXEL-PERFECT REPLICA)
             ======================================================== */}
          <div className="relative rounded-[32px] p-8 sm:p-10 min-h-[380px] overflow-hidden flex flex-col justify-between border-0 bg-[#0E1513]">
            {/* Cinematic Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-[center_top] pointer-events-none"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85")',
                filter: "brightness(0.68) contrast(1.05)",
              }}
            />
            {/* Soft dark vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30 pointer-events-none" />

            {/* Typography Header */}
            <div className="relative z-10 max-w-[340px]">
              <span className="text-[11.5px] font-semibold tracking-[0.16em] text-white/80 uppercase block mb-3.5">
                REPLIT CHAT
              </span>
              <h2 className="text-[36px] sm:text-[39px] font-[450] tracking-[-0.03em] text-white leading-[1.1] mb-3.5 whitespace-nowrap">
                Chat that flows
              </h2>
              <p className="text-[14px] text-white/85 font-normal leading-[1.42] max-w-[300px]">
                Just ask what you need, and Replit will take care of the rest.
              </p>
            </div>

            {/* Right-Side Chat Capsule Bubbles */}
            <div className="relative z-10 flex flex-col gap-3 mt-6 sm:mt-0 sm:absolute sm:right-9 sm:top-8 sm:bottom-8 sm:w-[310px] sm:justify-center">
              
              {/* Message 1: Sarah */}
              <div className="flex flex-col items-start gap-1.5 w-full">
                <div className="flex items-center gap-2 pl-2">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"
                    alt="Sarah"
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-white/30"
                  />
                  <span className="text-[11.5px] text-white font-normal tracking-tight">Sarah</span>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.13] border border-white/[0.15] text-white text-[13px] px-5 py-2.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] leading-normal max-w-[245px]">
                  Great! Here&apos;s the plan...
                </div>
              </div>

              {/* Message 2: User Prompt (Right Indented Pill) */}
              <div className="flex flex-col items-end w-full pl-6">
                <div className="backdrop-blur-xl bg-white/[0.13] border border-white/[0.15] text-white text-[13px] px-5 py-2.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] leading-normal text-left">
                  I have an idea to create a mood board.
                </div>
              </div>

              {/* Message 3: Sarah Response */}
              <div className="flex flex-col items-start gap-1.5 w-full">
                <div className="flex items-center gap-2 pl-2">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"
                    alt="Sarah"
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-white/30"
                  />
                  <span className="text-[11.5px] text-white font-normal tracking-tight">Sarah</span>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.13] border border-white/[0.15] text-white text-[13px] px-5 py-2.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] leading-normal">
                  Perfect! Let&apos;s create a project from here!
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================
              CARD 3: INFINITE CANVAS
             ======================================================== */}
          <div className="bg-[#F1EFEA] rounded-[32px] p-8 sm:p-10 min-h-[380px] overflow-hidden flex flex-col justify-between relative border-0">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 h-full items-center">
              {/* Copy */}
              <div className="sm:col-span-6 z-10 flex flex-col justify-between h-full">
                <div>
                  <span className="text-[11.5px] font-semibold tracking-[0.16em] text-[#55524D] uppercase block mb-3.5">
                    INFINITE CANVAS
                  </span>
                  <h2 className="text-[34px] sm:text-[37px] font-[450] tracking-[-0.03em] text-[#18181B] leading-[1.12] mb-3">
                    Design Freely
                  </h2>
                </div>
                <p className="text-[14px] text-[#55524D] font-normal leading-[1.45] max-w-[270px]">
                  Introducing a new space that allows you to explore and tweak designs visually, and then apply them directly to your app.
                </p>
              </div>

              {/* Canvas Preview Nodes */}
              <div className="sm:col-span-6 relative flex flex-col gap-3.5 items-center justify-center -mr-2 sm:-mr-6">
                <div className="w-[195px] h-[70px] rounded-[14px] bg-[#1A1A1A] overflow-hidden border border-black/10 shadow-sm relative p-2 flex items-center justify-between">
                  <div className="z-10 pl-1.5">
                    <span className="text-[8px] font-bold tracking-widest text-white/90 uppercase block leading-none">
                      CHROMATICA
                    </span>
                    <span className="text-[6.5px] text-white/60 tracking-tight leading-tight block mt-0.5">
                      INTERACTIVE GALLERIES
                    </span>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80"
                    alt="Gallery"
                    className="w-16 h-full object-cover rounded-[8px]"
                  />
                </div>

                <div className="w-[215px] py-5 px-4 rounded-[16px] bg-[#FAF0FE] border border-dashed border-[#C084FC] flex items-center justify-center shadow-[0_2px_12px_rgba(192,132,252,0.12)]">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-[#6B21A8] uppercase font-semibold">
                    EXPLORE A NEW VIBE
                  </span>
                </div>

                <div className="w-[195px] h-[64px] rounded-[14px] bg-[#EAE5DF] overflow-hidden border border-black/5 shadow-sm relative p-2 flex items-center justify-between">
                  <div className="z-10 pl-1.5">
                    <span className="text-[7.5px] font-bold tracking-widest text-[#44403C] uppercase block">
                      CURRENT EXHIBITION
                    </span>
                    <span className="text-[11px] font-serif text-[#1C1917] font-semibold leading-tight block">
                      BEYOND HORIZONS
                    </span>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80"
                    alt="Architecture"
                    className="w-16 h-full object-cover rounded-[8px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              CARD 4: INTELLIGENT MODEL ROUTING (PIXEL-PERFECT REPLICA)
             ======================================================== */}
          <div className="bg-[#FA6438] rounded-[32px] p-8 sm:p-10 min-h-[380px] overflow-hidden relative flex flex-col justify-between border-0">
            
            {/* Multi-tier Stepped Folding Surface Panels */}
            {/* Layer 1 (Starts at 60.5% width) */}
            <div 
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: "60.5%",
                right: 0,
                background: "linear-gradient(90deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.24) 100%)",
                boxShadow: "-8px 0 20px -4px rgba(230, 70, 20, 0.25)",
              }}
            />
            
            {/* Layer 2 (Starts at 84% width) */}
            <div 
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: "84%",
                right: 0,
                background: "linear-gradient(90deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.32) 100%)",
                boxShadow: "-8px 0 24px -4px rgba(220, 60, 15, 0.3)",
              }}
            />

            {/* Left Content Area with Exact Line Breaks */}
            <div className="relative z-10 max-w-[390px] flex flex-col justify-between h-full">
              <div>
                <span className="text-[11.5px] font-semibold tracking-[0.16em] text-[#1A0A04]/80 uppercase block mb-3.5">
                  INTELLIGENT MODEL ROUTING
                </span>
                
                {/* 2-Line Heading: 'The best model for \n every task' */}
                <h2 className="text-[37px] sm:text-[40px] font-[450] tracking-[-0.03em] text-[#160A06] leading-[1.08] mb-4">
                  The best model for<br />every task
                </h2>
              </div>

              {/* Exact 3-line description block */}
              <p className="text-[14px] text-[#1E0D07]/80 font-normal leading-[1.46] max-w-[370px] mt-8 sm:mt-12">
                Intelligent Model Routing lets you create the same quality output at 65% lower average cost than the previous version of Max Mode.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}