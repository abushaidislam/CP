"use client"

import { SpotlightQKLogo } from "./component"

const settings = {
  soundEnabled: true,
  spotlightRadius: 210,
}

export default function SpotlightQKLogoDemo(
  props: Partial<typeof settings>
) {
  const s = { ...settings, ...props }

  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center bg-background p-8 text-foreground">
      <div className="w-full max-w-xl">
        <SpotlightQKLogo
          soundEnabled={s.soundEnabled}
          spotlightRadius={s.spotlightRadius}
        />
      </div>
      <p className="mt-6 text-xs tracking-wide text-muted-foreground">
        Move cursor to trace the spotlight &middot; Click or press to feel the tactile drop
      </p>
    </div>
  )
}