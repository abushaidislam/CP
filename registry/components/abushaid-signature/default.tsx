import React from "react";
import { AbushaidSignature } from "@/components/ui/component";

const settings = {
  speedScale: 1,
  showPen: true,
  showShadow: true,
  showSoundToggle: true,
  showHint: true,
  hintText: "Click the signature to sign again",
  theme: "auto",
};

export default function Demo(props: Partial<typeof settings>) {
  const merged = { ...settings, ...props };
  const validTheme =
    merged.theme === "light" || merged.theme === "dark" || merged.theme === "auto"
      ? merged.theme
      : "auto";

  return (
    <div className="flex min-h-[360px] w-full items-center justify-center p-6 sm:p-10">
      <AbushaidSignature
        speedScale={Number(merged.speedScale) || 1}
        showPen={Boolean(merged.showPen)}
        showShadow={Boolean(merged.showShadow)}
        showSoundToggle={Boolean(merged.showSoundToggle)}
        showHint={Boolean(merged.showHint)}
        hintText={String(merged.hintText)}
        theme={validTheme}
      />
    </div>
  );
}

export const demo = Demo;
export { Demo };