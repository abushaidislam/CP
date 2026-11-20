import React from "react";
import StatusRadarBadge from "../components/ui/component";

const settings = {
  status: "online" as "online" | "syncing" | "idle",
  label: "Preview Stream 60 FPS",
  count: 99.98,
  showSecondary: true,
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-4 font-sans">
      <StatusRadarBadge status={s.status} label={s.label} count={s.count} />
      {s.showSecondary && (
        <StatusRadarBadge status="syncing" label="AST Node Analysis" count={99.94} />
      )}
    </div>
  );
}
