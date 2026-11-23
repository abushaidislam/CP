"use client"

import { useEffect, useEffectEvent, useRef } from "react"
import type { AnimationPlaybackControls, MotionValue } from "motion/react"
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"

import { decodeAudioData, playSound } from "@/lib/soundcn/sound-engine"
import type { SoundPlayback } from "@/lib/soundcn/sound-engine"
import { cn } from "@/lib/utils"

// Ordered strokes matching the "Abushaid.." signature image
const STROKES = [
  // 1. "A" main body (bottom-left hook -> apex -> right leg)
  "M42 92 C44 102 54 102 64 88 C76 70 88 44 95 22 C93 48 96 72 102 92",
  // 2. "A" left decorative loop sweeping into the right leg
  "M52 68 C32 68 28 52 44 46 C62 40 82 58 102 92",
  // 3. Cursive "bushaid"
  "M110 84 C112 62 118 36 123 38 C127 40 120 66 112 84 C116 74 126 64 128 72 C130 80 120 88 115 84 C122 82 132 74 138 66 C135 78 138 82 144 76 C148 72 152 64 152 64 C150 76 154 80 160 72 C164 66 168 58 172 58 C174 58 170 64 166 68 C170 74 166 84 158 84 C154 84 156 76 166 72 C178 66 190 46 195 34 C198 28 190 38 186 54 C182 68 180 78 180 80 C184 70 190 62 193 64 C195 66 194 76 200 76 C206 76 212 64 216 58 C210 56 202 66 204 74 C206 80 214 70 218 58 C216 70 218 76 224 72 C228 68 232 58 234 56 C232 66 234 72 240 68 C246 64 252 54 256 54 C248 52 240 62 242 70 C244 76 254 66 260 44 C264 28 268 20 264 22 C258 26 256 56 258 70 C259 76 262 76 265 74",
  // 4. Long crossbar of "A" sweeping across the entire name
  "M64 70 C58 72 68 70 96 64 C146 56 216 50 274 46",
  // 5. Dot on "i"
  "M234 44 L235 44",
  // 6. First trailing dot "."
  "M270 63 L271 63",
  // 7. Second trailing dot "."
  "M280 61 L281 61",
  // 8. Upper underline
  "M78 106 C142 94 214 82 286 76",
  // 9. Lower underline
  "M114 106 C168 94 222 86 274 82",
] as const

const DRAW_DURATION = 2.6

const DRAW_EASE = [0.35, 0, 0.65, 0.65] as const

const INK_FADE_DURATION = 0.3

const PEN_EASE = [0.25, 0.46, 0.45, 0.94] as const

const PEN_LAND_DURATION = 0.15

const PEN_LIFT_DURATION = 0.2

const PEN_LIFT_OVERLAP = 0.06

const PEN_LIFT_DISTANCE = 12

const PEN_ANGLE = 45

const IN_VIEW_MARGIN = "0px 0px -96px 0px"

const SCRATCH_VOLUME = 0.13

const SCRATCH_PRELOAD_MARGIN = "0px 0px 400px 0px"

type SignatureValues = {
  progress: MotionValue<number>
  inkOpacity: MotionValue<number>
  penLift: MotionValue<number>
}

export function AbushaidSignature({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const ref = useRef<HTMLButtonElement>(null)
  const pathRefs = useRef<(SVGPathElement | null)[]>([])
  const controlsRef = useRef<AnimationPlaybackControls | null>(null)

  const isInView = useInView(ref, {
    once: true,
    amount: "all",
    margin: IN_VIEW_MARGIN,
  })
  const shouldReduceMotion = useReducedMotion()
  const playScratch = usePenScratch(ref, !shouldReduceMotion)

  const progress = useMotionValue(0)
  const inkOpacity = useMotionValue(0)
  // 0 = nib on the paper, 1 = lifted away and hidden.
  const penLift = useMotionValue(1)

  const nibPoint = useTransform(() =>
    getMultiStrokeNibPoint(pathRefs.current, progress.get(), penLift.get())
  )
  const penX = useTransform(nibPoint, (point) => point.x)
  const penY = useTransform(nibPoint, (point) => point.y)
  const penOpacity = useTransform(penLift, [0, 1], [1, 0])

  function sign() {
    controlsRef.current?.stop()
    const values = { progress, inkOpacity, penLift }
    controlsRef.current = shouldReduceMotion
      ? fadeInSignature(values)
      : drawSignature(values)
  }

  const onFirstView = useEffectEvent(() => {
    if (!controlsRef.current) sign()
  })

  useEffect(() => {
    if (isInView) onFirstView()
  }, [isInView])

  useEffect(() => {
    return () => controlsRef.current?.stop()
  }, [])

  function handleClick() {
    playScratch()
    sign()
  }

  return (
    <button
      type="button"
      className={cn(
        "rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
      ref={ref}
      onClick={handleClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="block h-full w-auto"
        fill="none"
        viewBox="0 0 315 120"
        overflow="visible"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.8"
        aria-hidden
      >
        {STROKES.map((d, index) => (
          <StrokePath
            key={index}
            d={d}
            index={index}
            pathRefs={pathRefs}
            progress={progress}
            inkOpacity={inkOpacity}
          />
        ))}

        <motion.g style={{ x: penX, y: penY, opacity: penOpacity }}>
          <TechnicalPen transform={`rotate(${PEN_ANGLE})`} />
        </motion.g>
      </svg>

      <span className="sr-only">Sign again</span>
    </button>
  )
}

function StrokePath({
  d,
  index,
  pathRefs,
  progress,
  inkOpacity,
}: {
  d: string
  index: number
  pathRefs: React.RefObject<(SVGPathElement | null)[]>
  progress: MotionValue<number>
  inkOpacity: MotionValue<number>
}) {
  const pathLength = useTransform(progress, (globalProgress) => {
    const metrics = getStrokeMetrics(pathRefs.current)
    if (!metrics.totalLength) return 0

    const currentDist = globalProgress * metrics.totalLength
    const { start, length } = metrics.segments[index] ?? { start: 0, length: 1 }

    if (currentDist <= start) return 0
    if (currentDist >= start + length) return 1
    return (currentDist - start) / length
  })

  const strokeOpacity = useTransform(
    [pathLength, inkOpacity],
    ([len, opacity]: number[]) => (len > 0 ? opacity : 0)
  )

  return (
    <motion.path
      ref={(el) => {
        pathRefs.current[index] = el
      }}
      d={d}
      initial={{ pathSpacing: 2 }}
      style={{ pathLength, opacity: strokeOpacity }}
    />
  )
}

function usePenScratch(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean
) {
  const isNear = useInView(ref, { once: true, margin: SCRATCH_PRELOAD_MARGIN })
  const dataUriRef = useRef<string | null>(null)
  const playbackRef = useRef<Promise<SoundPlayback> | null>(null)

  useEffect(() => {
    if (!isNear || !enabled) return

    let cancelled = false
    void import("@/lib/soundcn/pen-scratch").then(
      async ({ penScratchSound }) => {
        await decodeAudioData(penScratchSound.dataUri)
        if (!cancelled) dataUriRef.current = penScratchSound.dataUri
      }
    )
    return () => {
      cancelled = true
    }
  }, [isNear, enabled])

  useEffect(() => {
    return () => void playbackRef.current?.then((playback) => playback.stop())
  }, [])

  return function play() {
    const dataUri = dataUriRef.current
    if (!enabled || !dataUri) return

    void playbackRef.current?.then((playback) => playback.stop())
    playbackRef.current = playSound(dataUri, { volume: SCRATCH_VOLUME })
  }
}

function drawSignature({ progress, inkOpacity, penLift }: SignatureValues) {
  return animate([
    [penLift, 0, { duration: PEN_LAND_DURATION, ease: PEN_EASE }],
    [inkOpacity, [0, 1], { duration: 0 }],
    [progress, [0, 1], { duration: DRAW_DURATION, ease: DRAW_EASE }],
    [
      penLift,
      1,
      {
        duration: PEN_LIFT_DURATION,
        ease: PEN_EASE,
        at: `-${PEN_LIFT_OVERLAP}`,
      },
    ],
  ])
}

function fadeInSignature({ progress, inkOpacity }: SignatureValues) {
  progress.set(1)
  return animate(inkOpacity, [0, 1], { duration: INK_FADE_DURATION })
}

type StrokeMetrics = {
  totalLength: number
  segments: { start: number; length: number }[]
}

let cachedMetrics: StrokeMetrics | null = null

function getStrokeMetrics(paths: (SVGPathElement | null)[]): StrokeMetrics {
  if (cachedMetrics && cachedMetrics.totalLength > 0) return cachedMetrics

  let totalLength = 0
  const segments = paths.map((path) => {
    const length = path ? Math.max(path.getTotalLength(), 1) : 0
    const segment = { start: totalLength, length }
    totalLength += length
    return segment
  })

  if (totalLength > 0) {
    cachedMetrics = { totalLength, segments }
  }

  return { totalLength, segments }
}

function getMultiStrokeNibPoint(
  paths: (SVGPathElement | null)[],
  progress: number,
  lift: number
) {
  let point = { x: 42, y: 92 }
  const metrics = getStrokeMetrics(paths)

  if (metrics.totalLength > 0) {
    const targetDist = Math.min(
      Math.max(progress * metrics.totalLength, 0),
      metrics.totalLength
    )

    for (let i = 0; i < metrics.segments.length; i++) {
      const seg = metrics.segments[i]
      const path = paths[i]
      if (path && targetDist <= seg.start + seg.length) {
        const localDist = Math.max(0, targetDist - seg.start)
        point = path.getPointAtLength(localDist)
        break
      }
    }
  }

  const distance = lift * PEN_LIFT_DISTANCE
  const angle = (PEN_ANGLE * Math.PI) / 180

  return {
    x: point.x + distance * Math.sin(angle),
    y: point.y - distance * Math.cos(angle),
  }
}

function TechnicalPen(props: React.ComponentProps<"g">) {
  return (
    <g className="fill-background" strokeWidth="1.5" {...props}>
      <path d="M-5 -34V-74Q-5 -76 -3 -76H3Q5 -76 5 -74V-34Z" />
      <path className="fill-current" d="M-5.5 -30H5.5V-34H-5.5Z" />
      <path d="M-4.5 -14H4.5V-30H-4.5Z" />
      <path d="M-1.5 -6L-4.5 -14H4.5L1.5 -6Z" />
      <path d="M0 0V-6" />
    </g>
  )
}