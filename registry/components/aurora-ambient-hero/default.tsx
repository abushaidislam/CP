"use client";

import React, { useState } from "react";
import AuroraAmbientHero from "./component";

export default function Demo() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <AuroraAmbientHero
        onPrimaryCta={() => setMessage("Primary Action triggered: Welcome aboard!")}
        onSecondaryCta={() => setMessage("Workflow preview video opened.")}
      />
      {message && (
        <div className="mt-4 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-4 py-2 text-xs font-medium text-indigo-300">
          {message}
        </div>
      )}
    </div>
  );
}
