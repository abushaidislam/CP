"use client";

import React, { useState } from "react";
import LivePingStatusPill from "./component";

export default function Demo() {
  const [latency, setLatency] = useState(14);

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-4 font-sans">
      <LivePingStatusPill status="healthy" serviceName="Core API Gateway" latencyMs={latency} region="IAD1" />
      <LivePingStatusPill status="evaluating" serviceName="AST Compiler Worker" latencyMs={latency + 8} region="SFO3" />
      <LivePingStatusPill status="degraded" serviceName="WebSocket Relay" latencyMs={88} region="FRA1" />

      <button
        type="button"
        onClick={() => setLatency((l) => (l >= 40 ? 12 : l + 6))}
        className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
      >
        Simulate Network Fluctuation
      </button>
    </div>
  );
}
