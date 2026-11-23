"use client"

import { useCallback, useEffect, useId, useMemo, useRef } from "react"
import type { Transition } from "framer-motion"
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"

import { cn } from "@/lib/utils"

type Point2D = readonly [number, number]

const UX = 44
const UY = 25.4
const OX = 12
const OY = 240
const EXTRUDE_NORMAL = 28
const EXTRUDE_PRESSED = 14
const PRESS_OFFSET = EXTRUDE_NORMAL - EXTRUDE_PRESSED

const VIEWBOX_WIDTH = 600
const VIEWBOX_HEIGHT = 382

const transition: Transition = {
  type: "spring",
  mass: 0.5,
  damping: 18,
  stiffness: 200,
}

// Isometric projection: `a` runs left-to-right (up-right), `b` runs top-to-bottom (down-right)
function project([a, b]: Point2D): [number, number] {
  return [
    Number((OX + (a + b) * UX).toFixed(2)),
    Number((OY + (b - a) * UY).toFixed(2)),
  ]
}

// Letter Q (clockwise outer contour + counter-clockwise inner hole)
const Q_OUTER: Point2D[] = [
  [0, 0],
  [4, 0],
  [4, 3.2],
  [4.8, 4.0],
  [4.0, 4.8],
  [3.2, 4.0],
  [0, 4],
]

const Q_HOLE: Point2D[] = [
  [1, 1],
  [1, 3],
  [2.3, 3],
  [1.9, 2.6],
  [2.6, 1.9],
  [3, 2.3],
  [3, 1],
]

// Letter K (clockwise outer contour)
const K_OUTER: Point2D[] = [
  [5.2, 0],
  [6.2, 0],
  [6.2, 1.5],
  [7.7, 0],
  [9.0, 0],
  [7.2, 1.85],
  [9.1, 4],
  [7.8, 4],
  [6.5, 2.55],
  [6.2, 2.85],
  [6.2, 4],
  [5.2, 4],
]

function polygonToPath(points: [number, number][]): string {
  return (
    points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`)
      .join(" ") + " Z"
  )
}

function buildSideWallData(rings: [number, number][][], topYOffset: number) {
  const fillPaths: string[] = []
  const strokeSegments: string[] = []

  for (const ring of rings) {
    const n = ring.length
    for (let i = 0; i < n; i++) {
      const [x1, y1Base] = ring[i]
      const [x2, y2Base] = ring[(i + 1) % n]

      // Front-facing side walls (both outer CW and inner CCW hole walls) have x2 < x1
      if (x2 < x1 - 0.01) {
        const y1Top = Number((y1Base + topYOffset).toFixed(2))
        const y2Top = Number((y2Base + topYOffset).toFixed(2))
        const y1Bot = Number((y1Base + EXTRUDE_NORMAL).toFixed(2))
        const y2Bot = Number((y2Base + EXTRUDE_NORMAL).toFixed(2))

        fillPaths.push(
          `M${x1} ${y1Top} L${x2} ${y2Top} L${x2} ${y2Bot} L${x1} ${y1Bot} Z`
        )
        strokeSegments.push(
          `M${x1} ${y1Top} L${x1} ${y1Bot} L${x2} ${y2Bot} L${x2} ${y2Top}`
        )
      }
    }
  }

  return {
    fillD: fillPaths.join(" "),
    strokeD: strokeSegments.join(" "),
  }
}

function playMetalClick() {
  if (typeof window === "undefined") return
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.045)

    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.055)

    const clickOsc = ctx.createOscillator()
    const clickGain = ctx.createGain()
    clickOsc.type = "sine"
    clickOsc.frequency.setValueAtTime(3200, now)
    clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.02)

    clickGain.gain.setValueAtTime(0.09, now)
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

    clickOsc.connect(clickGain)
    clickGain.connect(ctx.destination)
    clickOsc.start(now)
    clickOsc.stop(now + 0.03)

    window.setTimeout(() => {
      ctx.close().catch(() => {})
    }, 120)
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}

export interface SpotlightQKLogoProps {
  className?: string
  soundEnabled?: boolean
  spotlightRadius?: number
}

/**
 * An isometric 3D "QK" SVG mark whose outline is traced by a radial gradient
 * spotlight that follows the cursor, paired with a springy press effect and
 * synthesized tactile click sound.
 */
export function SpotlightQKLogo({
  className,
  soundEnabled = true,
  spotlightRadius = 210,
}: SpotlightQKLogoProps) {
  const id = useId()
  const ids = {
    facePattern: `spotlight-qk-face-pattern-${id}`,
    faceFill: `spotlight-qk-face-fill-${id}`,
    topStroke: `spotlight-qk-top-stroke-${id}`,
    sideStroke: `spotlight-qk-side-stroke-${id}`,
    radialGradient: `spotlight-qk-radial-gradient-${id}`,
  }

  const ref = useRef<SVGSVGElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const isInView = useInView(ref, { margin: "80px" })

  const geometry = useMemo(() => {
    const qOuterProj = Q_OUTER.map(project)
    const qHoleProj = Q_HOLE.map(project)
    const kOuterProj = K_OUTER.map(project)

    const qTopPath = `${polygonToPath(qOuterProj)} ${polygonToPath(qHoleProj)}`
    const kTopPath = polygonToPath(kOuterProj)
    const topStrokeD = `${qTopPath} ${kTopPath}`

    const allRings = [qHoleProj, qOuterProj, kOuterProj]
    const sideNormal = buildSideWallData(allRings, 0)
    const sidePressed = buildSideWallData(allRings, PRESS_OFFSET)

    return {
      qTopPath,
      kTopPath,
      topStrokeD,
      sideNormal,
      sidePressed,
    }
  }, [])

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const cx = useSpring(useTransform(mouseX, [0, 1], [0, VIEWBOX_WIDTH]), {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  })

  const cy = useSpring(useTransform(mouseY, [0, 1], [0, VIEWBOX_HEIGHT]), {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  })

  useEffect(() => {
    if (shouldReduceMotion || !isInView) {
      return
    }

    if (window.matchMedia("(hover: none)").matches) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth)
      mouseY.set(e.clientY / window.innerHeight)
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [shouldReduceMotion, isInView, mouseX, mouseY])

  const handleTap = useCallback(() => {
    if (soundEnabled) {
      playMetalClick()
    }
  }, [soundEnabled])

  return (
    <motion.svg
      ref={ref}
      className={cn(
        "h-auto w-full cursor-pointer select-none touch-manipulation [--pattern:color-mix(in_oklab,var(--foreground)_12%,var(--background))] [--stroke:color-mix(in_oklab,var(--foreground)_16%,var(--background))]",
        className
      )}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="QK Isometric Spotlight Logo"
      initial="normal"
      whileTap="pressed"
      onTap={handleTap}
    >
      <defs>
        <pattern
          id={ids.facePattern}
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M-1 1l2 -2M0 10l10 -10M9 11l2 -2"
            stroke="var(--pattern)"
            strokeWidth="1"
          />
        </pattern>

        <motion.g
          id={ids.faceFill}
          variants={{
            normal: { y: 0 },
            pressed: { y: PRESS_OFFSET },
          }}
          transition={transition}
        >
          <path d={geometry.qTopPath} fillRule="evenodd" clipRule="evenodd" />
          <path d={geometry.kTopPath} />
        </motion.g>

        <motion.path
          id={ids.sideStroke}
          variants={{
            normal: { d: geometry.sideNormal.strokeD },
            pressed: { d: geometry.sidePressed.strokeD },
          }}
          transition={transition}
        />

        <motion.g
          id={ids.topStroke}
          variants={{
            normal: { y: 0 },
            pressed: { y: PRESS_OFFSET },
          }}
          transition={transition}
        >
          <path d={geometry.topStrokeD} />
        </motion.g>

        <motion.radialGradient
          id={ids.radialGradient}
          cx={cx}
          cy={cy}
          r={spotlightRadius}
          gradientUnits="userSpaceOnUse"
        >
          <stop className="dark:[stop-color:#fff]" stopColor="#3f3f46" />
          <stop
            className="dark:[stop-color:#52525b]"
            offset="1"
            stopColor="#a1a1aa"
            stopOpacity="0"
          />
        </motion.radialGradient>
      </defs>

      {/* Extruded 3D side walls */}
      <g className="fill-background">
        <motion.path
          variants={{
            normal: { d: geometry.sideNormal.fillD },
            pressed: { d: geometry.sidePressed.fillD },
          }}
          transition={transition}
        />
      </g>

      {/* Side wall strokes (behind top face for automatic hidden-line removal) */}
      <use
        href={`#${ids.sideStroke}`}
        stroke="var(--stroke)"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <use
        href={`#${ids.sideStroke}`}
        stroke={`url(#${ids.radialGradient})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Top face background + diagonal hatch pattern */}
      <use href={`#${ids.faceFill}`} className="fill-background" />
      <use href={`#${ids.faceFill}`} fill={`url(#${ids.facePattern})`} />

      {/* Top face outline + cursor-tracking spotlight gradient */}
      <use
        href={`#${ids.topStroke}`}
        stroke="var(--stroke)"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <use
        href={`#${ids.topStroke}`}
        stroke={`url(#${ids.radialGradient})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </motion.svg>
  )
}

export default SpotlightQKLogo