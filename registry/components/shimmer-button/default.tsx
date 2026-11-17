import React, { useState } from "react";
import ShimmerButton from "./component";

export default function Demo() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-6 font-sans">
      <ShimmerButton onClick={() => setCount((c) => c + 1)}>
        Launch Component Studio
      </ShimmerButton>
      <p className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
        Triggered <span className="font-mono tabular-nums font-semibold text-zinc-700 dark:text-zinc-300">{count}</span> times
      </p>
    </div>
  );
}
