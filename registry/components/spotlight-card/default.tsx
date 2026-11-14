"use client";

import React, { useState } from "react";
import Component from "../components/ui/component";
import { Code2, Play, Flame } from "lucide-react";

export default function Demo() {
  const [clicked, setClicked] = useState(0);

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 font-sans">
      <div className="w-full flex items-center justify-center">
        <Component
          title="Dynamic Radial Spotlight"
          description="Move your cursor across this surface. Notice the subtle glass highlights and dynamic luminosity response."
          badge="Interactive Preview"
          onClick={() => setClicked((c) => c + 1)}
        >
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/70 bg-zinc-100/80 dark:bg-zinc-900/40 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                Trigger Count
              </span>
              <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 font-mono text-zinc-800 dark:text-zinc-200">
                {clicked} clicks
              </span>
            </div>
          </div>
        </Component>
      </div>
    </div>
  );
}
