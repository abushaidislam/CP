"use client";

import React, { useState } from "react";
import NeonGlowButton from "./component";

export default function Demo() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-6 font-sans">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <NeonGlowButton variant="cyan" onClick={() => setClickCount((c) => c + 1)}>
          Cyber Protocol
        </NeonGlowButton>
        <NeonGlowButton variant="violet" onClick={() => setClickCount((c) => c + 1)}>
          Quantum Mesh
        </NeonGlowButton>
        <NeonGlowButton variant="emerald" onClick={() => setClickCount((c) => c + 1)}>
          Hyper Matrix
        </NeonGlowButton>
      </div>

      <p className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
        Total Pulses Triggered: <span className="font-mono tabular-nums font-semibold text-zinc-700 dark:text-zinc-300">{clickCount}</span>
      </p>
    </div>
  );
}
