"use client";

import React from "react";
import LivePingStatusPill from "../components/ui/component";

const settings = {
  status: "healthy" as "healthy" | "degraded" | "evaluating",
  serviceName: "Core API Gateway",
  latencyMs: 14,
  region: "IAD1",
  showClusterRow: true,
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-4 font-sans">
      <LivePingStatusPill
        status={s.status}
        serviceName={s.serviceName}
        latencyMs={s.latencyMs}
        region={s.region}
      />
      {s.showClusterRow && (
        <>
          <LivePingStatusPill status="evaluating" serviceName="AST Compiler Worker" latencyMs={s.latencyMs + 8} region="SFO3" />
          <LivePingStatusPill status="degraded" serviceName="WebSocket Relay" latencyMs={88} region="FRA1" />
        </>
      )}
    </div>
  );
}
