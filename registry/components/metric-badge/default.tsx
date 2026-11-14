import React from "react";
import StatusRadarBadge from "./component";

export default function Demo() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-4 font-sans">
      <StatusRadarBadge status="online" label="Preview Stream 60 FPS" count={100} />
      <StatusRadarBadge status="syncing" label="AST Node Analysis" count={99.94} />
    </div>
  );
}
