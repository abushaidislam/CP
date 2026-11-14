"use client";

import React, { useId, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const MIN_FREQUENCY = 87.5;
const MAX_FREQUENCY = 108;
const FREQUENCY_RANGE = MAX_FREQUENCY - MIN_FREQUENCY;
const KNOB_ROTATION_RANGE = 270;

type KnobKind = "volume" | "frequency";

interface ActiveKnobDrag {
  kind: KnobKind;
  pointerId: number;
  lastAngle: number;
}

interface SpringState {
  value: number;
  velocity: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

const lerp = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
};

const piecewiseLerp3 = (
  value: number,
  outLeft: number,
  outCenter: number,
  outRight: number
) => {
  if (value <= 0) {
    return lerp(value, -1, 0, outLeft, outCenter);
  }
  return lerp(value, 0, 1, outCenter, outRight);
};

const stepSpring = (
  state: SpringState,
  target: number,
  stiffness: number,
  damping: number,
  mass: number,
  dt: number
): boolean => {
  const subSteps = 2;
  const stepDt = dt / subSteps;

  for (let i = 0; i < subSteps; i += 1) {
    const displacement = state.value - target;
    const acceleration = (-stiffness * displacement - damping * state.velocity) / mass;
    state.velocity += acceleration * stepDt;
    state.value += state.velocity * stepDt;
  }

  if (
    Math.abs(state.value - target) < 0.0005 &&
    Math.abs(state.velocity) < 0.0005
  ) {
    state.value = target;
    state.velocity = 0;
    return true;
  }
  return false;
};

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

export interface RadioHeadArtworkProps
  extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  showControls?: boolean;
  transparentBg?: boolean;
  initialFrequency?: number;
  initialVolume?: number;
}

export default function RadioHeadArtwork({
  className,
  interactive = true,
  showControls = false,
  transparentBg = false,
  initialFrequency = 98.5,
  initialVolume = 63,
  style,
  ...props
}: RadioHeadArtworkProps) {
  const instanceId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ActiveKnobDrag | null>(null);
  const suppressNextClickRef = useRef(false);

  // Animated element refs for zero-re-render 60fps pointer tracking
  const bodySvgRef = useRef<SVGSVGElement>(null);
  const neckShadowRef = useRef<SVGEllipseElement>(null);
  const headContainerRef = useRef<HTMLDivElement>(null);
  const antennaGroupRef = useRef<SVGGElement>(null);
  const leftSideRef = useRef<SVGPathElement>(null);
  const rightSideRef = useRef<SVGPathElement>(null);
  const faceGroupRef = useRef<SVGGElement>(null);
  const glareGroupRef = useRef<SVGGElement>(null);
  const controlsGroupRef = useRef<SVGGElement>(null);

  // Animated element refs for controls
  const tuningNeedleRef = useRef<SVGLineElement>(null);
  const volumeKnobRotorRef = useRef<SVGGElement>(null);
  const frequencyKnobRotorRef = useRef<SVGGElement>(null);

  // One source of truth for each radio control.
  const [frequency, setFrequency] = useState<number>(() =>
    roundToTenth(clamp(initialFrequency, MIN_FREQUENCY, MAX_FREQUENCY))
  );
  const [volume, setVolume] = useState<number>(() => clamp(initialVolume, 0, 100));
  const [isPowered, setIsPowered] = useState<boolean>(true);

  const prefersReducedMotion = usePrefersReducedMotion();

  // Knob angles are derived from their values
  const volumeRotation = -KNOB_ROTATION_RANGE / 2 + (volume / 100) * KNOB_ROTATION_RANGE;
  const frequencyProgress = (frequency - MIN_FREQUENCY) / FREQUENCY_RANGE;
  const frequencyRotation =
    -KNOB_ROTATION_RANGE / 2 + frequencyProgress * KNOB_ROTATION_RANGE;
  const tuningNeedleX = 306 + frequencyProgress * 88;

  // Pointer spring state
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const smoothXRef = useRef<SpringState>({ value: 0, velocity: 0 });
  const smoothYRef = useRef<SpringState>({ value: 0, velocity: 0 });
  const antennaXRef = useRef<SpringState>({ value: 0, velocity: 0 });
  const pointerRafRef = useRef<number | null>(null);

  // Control spring state
  const controlTargetsRef = useRef({
    volumeRotation,
    frequencyRotation,
    tuningNeedleX,
  });
  const volumeSpringRef = useRef<SpringState>({ value: volumeRotation, velocity: 0 });
  const frequencySpringRef = useRef<SpringState>({ value: frequencyRotation, velocity: 0 });
  const needleSpringRef = useRef<SpringState>({ value: tuningNeedleX, velocity: 0 });
  const controlRafRef = useRef<number | null>(null);

  // Track mouse globally if placed inside a page container
  useEffect(() => {
    const applyPointerTransforms = (sx: number, sy: number, ax: number) => {
      const factor = prefersReducedMotion ? 0 : 1;

      const bodyShiftX = lerp(sx, -1, 1, -2, 2) * factor;
      const bodyShiftY = lerp(sy, -1, 1, -1.5, 2) * factor;
      const bodyRotateZ = lerp(sx, -1, 1, -0.5, 0.5) * factor;
      const neckShadowX = lerp(sx, -1, 1, -5, 5) * factor;
      const neckShadowY = lerp(sy, -1, 1, -2, 3) * factor;

      const headRotateY = lerp(sx, -1, 1, -18, 18) * factor;
      const headRotateX = lerp(sy, -1, 1, 13, -13) * factor;
      const headRotateZ = lerp(sx, -1, 1, -2.5, 2.5) * factor;
      const headTranslateX = lerp(sx, -1, 1, -9, 9) * factor;
      const headTranslateY = lerp(sy, -1, 1, -6, 7) * factor;

      const faceShiftX = lerp(sx, -1, 1, -6, 6) * factor;
      const faceShiftY = lerp(sy, -1, 1, -4, 4) * factor;
      const controlsShiftX = lerp(sx, -1, 1, -8, 8) * factor;
      const controlsShiftY = lerp(sy, -1, 1, -5, 5) * factor;

      const glareShiftX = lerp(sx, -1, 1, -24, 24) * factor;
      const glareShiftY = lerp(sy, -1, 1, -16, 16) * factor;

      const leftSideShiftX = piecewiseLerp3(sx, 4, 0, -7) * factor;
      const rightSideShiftX = piecewiseLerp3(sx, 7, 0, -4) * factor;
      const antennaSwing = lerp(ax, -1, 1, 5, -6) * factor;

      if (bodySvgRef.current) {
        bodySvgRef.current.style.transform = `translate3d(${bodyShiftX}px, ${bodyShiftY}px, 0) rotate(${bodyRotateZ}deg)`;
      }
      if (neckShadowRef.current) {
        neckShadowRef.current.style.transform = `translate3d(${neckShadowX}px, ${neckShadowY}px, 0)`;
      }
      if (headContainerRef.current) {
        headContainerRef.current.style.transform = `translate3d(${headTranslateX}px, ${headTranslateY}px, 0) rotateX(${headRotateX}deg) rotateY(${headRotateY}deg) rotateZ(${headRotateZ}deg)`;
      }
      if (antennaGroupRef.current) {
        antennaGroupRef.current.style.transform = `rotate(${antennaSwing}deg)`;
      }
      if (leftSideRef.current) {
        leftSideRef.current.style.transform = `translateX(${leftSideShiftX}px)`;
      }
      if (rightSideRef.current) {
        rightSideRef.current.style.transform = `translateX(${rightSideShiftX}px)`;
      }
      if (faceGroupRef.current) {
        faceGroupRef.current.style.transform = `translate3d(${faceShiftX}px, ${faceShiftY}px, 0)`;
      }
      if (glareGroupRef.current) {
        glareGroupRef.current.style.transform = `translate3d(${glareShiftX}px, ${glareShiftY}px, 0)`;
      }
      if (controlsGroupRef.current) {
        controlsGroupRef.current.style.transform = `translate3d(${controlsShiftX}px, ${controlsShiftY}px, 0)`;
      }
    };

    if (!interactive || prefersReducedMotion) {
      targetMouseRef.current = { x: 0, y: 0 };
      smoothXRef.current = { value: 0, velocity: 0 };
      smoothYRef.current = { value: 0, velocity: 0 };
      antennaXRef.current = { value: 0, velocity: 0 };
      applyPointerTransforms(0, 0, 0);
      return;
    }

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.032);
      lastTime = now;

      const safeDt = dt > 0 ? dt : 1 / 60;
      const doneX = stepSpring(
        smoothXRef.current,
        targetMouseRef.current.x,
        160,
        20,
        0.6,
        safeDt
      );
      const doneY = stepSpring(
        smoothYRef.current,
        targetMouseRef.current.y,
        160,
        20,
        0.6,
        safeDt
      );
      const doneAntenna = stepSpring(
        antennaXRef.current,
        targetMouseRef.current.x,
        90,
        11,
        1,
        safeDt
      );

      applyPointerTransforms(
        smoothXRef.current.value,
        smoothYRef.current.value,
        antennaXRef.current.value
      );

      if (doneX && doneY && doneAntenna) {
        pointerRafRef.current = null;
      } else {
        pointerRafRef.current = window.requestAnimationFrame(tick);
      }
    };

    const startLoop = () => {
      if (pointerRafRef.current === null) {
        lastTime = performance.now();
        pointerRafRef.current = window.requestAnimationFrame(tick);
      }
    };

    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.38;
      const denomX = Math.max(window.innerWidth * 0.45, 1);
      const denomY = Math.max(window.innerHeight * 0.45, 1);
      const normalizedX = (e.clientX - centerX) / denomX;
      const normalizedY = (e.clientY - centerY) / denomY;

      targetMouseRef.current.x = clamp(normalizedX, -1, 1);
      targetMouseRef.current.y = clamp(normalizedY, -1, 1);
      startLoop();
    };

    window.addEventListener("pointermove", handleGlobalPointerMove);
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      if (pointerRafRef.current !== null) {
        window.cancelAnimationFrame(pointerRafRef.current);
        pointerRafRef.current = null;
      }
    };
  }, [interactive, prefersReducedMotion]);

  // Spring animation for rotary knobs & tuning needle
  useEffect(() => {
    controlTargetsRef.current = {
      volumeRotation,
      frequencyRotation,
      tuningNeedleX,
    };

    const applyControlValues = (volRot: number, freqRot: number, needleX: number) => {
      if (volumeKnobRotorRef.current) {
        volumeKnobRotorRef.current.style.transform = `rotate(${volRot}deg)`;
      }
      if (frequencyKnobRotorRef.current) {
        frequencyKnobRotorRef.current.style.transform = `rotate(${freqRot}deg)`;
      }
      if (tuningNeedleRef.current) {
        const formattedX = String(needleX);
        tuningNeedleRef.current.setAttribute("x1", formattedX);
        tuningNeedleRef.current.setAttribute("x2", formattedX);
      }
    };

    if (prefersReducedMotion) {
      volumeSpringRef.current = { value: volumeRotation, velocity: 0 };
      frequencySpringRef.current = { value: frequencyRotation, velocity: 0 };
      needleSpringRef.current = { value: tuningNeedleX, velocity: 0 };
      applyControlValues(volumeRotation, frequencyRotation, tuningNeedleX);
      return;
    }

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.032);
      lastTime = now;
      const safeDt = dt > 0 ? dt : 1 / 60;
      const targets = controlTargetsRef.current;

      const doneVol = stepSpring(
        volumeSpringRef.current,
        targets.volumeRotation,
        150,
        18,
        1,
        safeDt
      );
      const doneFreq = stepSpring(
        frequencySpringRef.current,
        targets.frequencyRotation,
        150,
        18,
        1,
        safeDt
      );
      const doneNeedle = stepSpring(
        needleSpringRef.current,
        targets.tuningNeedleX,
        150,
        18,
        1,
        safeDt
      );

      applyControlValues(
        volumeSpringRef.current.value,
        frequencySpringRef.current.value,
        needleSpringRef.current.value
      );

      if (doneVol && doneFreq && doneNeedle) {
        controlRafRef.current = null;
      } else {
        controlRafRef.current = window.requestAnimationFrame(tick);
      }
    };

    if (controlRafRef.current === null) {
      controlRafRef.current = window.requestAnimationFrame(tick);
    }

    return () => {
      if (controlRafRef.current !== null) {
        window.cancelAnimationFrame(controlRafRef.current);
        controlRafRef.current = null;
      }
    };
  }, [volumeRotation, frequencyRotation, tuningNeedleX, prefersReducedMotion]);

  const handlePowerToggle = () => {
    if (!interactive) return;
    setIsPowered((current) => !current);
  };

  const applyKnobDelta = (kind: KnobKind, deltaDegrees: number) => {
    if (!interactive || !isPowered || !Number.isFinite(deltaDegrees)) return;

    if (kind === "volume") {
      setVolume((current) =>
        clamp(current + (deltaDegrees / KNOB_ROTATION_RANGE) * 100, 0, 100)
      );
      return;
    }

    setFrequency((current) =>
      roundToTenth(
        clamp(
          current + (deltaDegrees / KNOB_ROTATION_RANGE) * FREQUENCY_RANGE,
          MIN_FREQUENCY,
          MAX_FREQUENCY
        )
      )
    );
  };

  const handleKnobPointerDown = (kind: KnobKind) => (
    event: React.PointerEvent<SVGGElement>
  ) => {
    event.stopPropagation();
    if (!interactive || !isPowered || event.button !== 0) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle =
      (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
      Math.PI;

    dragRef.current = {
      kind,
      pointerId: event.pointerId,
      lastAngle: angle,
    };
    suppressNextClickRef.current = false;

    const target = event.currentTarget as SVGGElement & {
      setPointerCapture?: (pointerId: number) => void;
    };
    target.setPointerCapture?.(event.pointerId);
  };

  const handleKnobPointerMove = (event: React.PointerEvent<SVGGElement>) => {
    event.stopPropagation();
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle =
      (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
      Math.PI;

    let delta = angle - drag.lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    drag.lastAngle = angle;

    if (Math.abs(delta) > 0.05) {
      suppressNextClickRef.current = true;
      applyKnobDelta(drag.kind, delta);
    }
  };

  const handleKnobPointerEnd = (event: React.PointerEvent<SVGGElement>) => {
    event.stopPropagation();
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const target = event.currentTarget as SVGGElement & {
      releasePointerCapture?: (pointerId: number) => void;
    };
    target.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  };

  const handleKnobClick = (kind: KnobKind) => (
    event: React.MouseEvent<SVGGElement>
  ) => {
    event.stopPropagation();
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (!interactive || !isPowered) return;

    if (kind === "volume") {
      setVolume((current) => clamp(current + 3, 0, 100));
    } else {
      setFrequency((current) =>
        roundToTenth(clamp(current + 0.5, MIN_FREQUENCY, MAX_FREQUENCY))
      );
    }
  };

  const handleKnobKeyDown = (
    kind: KnobKind,
    event: React.KeyboardEvent<SVGGElement>
  ) => {
    if (!interactive || !isPowered) return;

    let handled = true;
    if (kind === "volume") {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          setVolume((c) => clamp(c + 2, 0, 100));
          break;
        case "ArrowLeft":
        case "ArrowDown":
          setVolume((c) => clamp(c - 2, 0, 100));
          break;
        case "PageUp":
          setVolume((c) => clamp(c + 10, 0, 100));
          break;
        case "PageDown":
          setVolume((c) => clamp(c - 10, 0, 100));
          break;
        case "Home":
          setVolume(0);
          break;
        case "End":
          setVolume(100);
          break;
        default:
          handled = false;
      }
    } else {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          setFrequency((c) =>
            roundToTenth(clamp(c + 0.1, MIN_FREQUENCY, MAX_FREQUENCY))
          );
          break;
        case "ArrowLeft":
        case "ArrowDown":
          setFrequency((c) =>
            roundToTenth(clamp(c - 0.1, MIN_FREQUENCY, MAX_FREQUENCY))
          );
          break;
        case "PageUp":
          setFrequency((c) =>
            roundToTenth(clamp(c + 1.0, MIN_FREQUENCY, MAX_FREQUENCY))
          );
          break;
        case "PageDown":
          setFrequency((c) =>
            roundToTenth(clamp(c - 1.0, MIN_FREQUENCY, MAX_FREQUENCY))
          );
          break;
        case "Home":
          setFrequency(MIN_FREQUENCY);
          break;
        case "End":
          setFrequency(MAX_FREQUENCY);
          break;
        default:
          handled = false;
      }
    }

    if (handled) {
      event.preventDefault();
    }
  };

  return (
    <div
      ref={containerRef}
      {...props}
      className={cn(
        "relative flex flex-col items-center justify-end select-none",
        className
      )}
      style={{
        perspective: "1100px",
        ...style,
      }}
    >
      {/* Optional Background Vignette */}
      {!transparentBg && (
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.96) 0%, rgba(235,235,232,0.88) 55%, rgba(198,198,194,0.92) 100%)",
          }}
        />
      )}

      {/* Synchronized Artwork Stage - scales fluidly without hard max-width */}
      <div
        ref={stageRef}
        className="relative z-10 w-full flex items-end justify-center"
        style={{ aspectRatio: "700 / 650" }}
      >
        {/* ==================================================== */}
        {/* LAYER 1: SUIT, OVERCOAT & STRIPED SHIRT               */}
        {/* ==================================================== */}
        <svg
          ref={bodySvgRef}
          viewBox="0 0 700 650"
          className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_20px_28px_rgba(0,0,0,0.18)]"
          style={{
            transformOrigin: "50% 85%",
            willChange: "transform",
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id={`${instanceId}-shirt-stripes-fast`}
              width="6"
              height="6"
              patternTransform="rotate(18)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="6" height="6" fill="#d2d2d0" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#262626" strokeWidth="2" />
            </pattern>

            <pattern
              id={`${instanceId}-coat-texture-fast`}
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
            >
              <rect width="4" height="4" fill="#0d0d0d" />
              <circle cx="2" cy="2" r="0.8" fill="#1e1e1e" />
            </pattern>

            <linearGradient id={`${instanceId}-coat-left-shade`} x1="0%" y1="0%" x2="100%" y2="20%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="40%" stopColor="#141414" />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>

            <linearGradient id={`${instanceId}-coat-right-shade`} x1="100%" y1="0%" x2="0%" y2="25%">
              <stop offset="0%" stopColor="#242424" />
              <stop offset="45%" stopColor="#101010" />
              <stop offset="100%" stopColor="#040404" />
            </linearGradient>

            <linearGradient id={`${instanceId}-lapel-highlight`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#383838" />
              <stop offset="50%" stopColor="#171717" />
              <stop offset="100%" stopColor="#070707" />
            </linearGradient>
          </defs>

          <g>
            {/* Neck Column */}
            <path d="M322 310 L376 310 L382 365 L316 365 Z" fill="#070707" />

            {/* Pinstriped Shirt Base */}
            <path d="M308 345 L390 345 L385 480 L315 480 Z" fill="#1a1a1a" />

            {/* Left Striped Collar */}
            <path
              d="M316 328 L347 362 L322 396 L306 352 Z"
              fill={`url(#${instanceId}-shirt-stripes-fast)`}
              stroke="#171717"
              strokeWidth="1.5"
            />
            <path
              d="M316 328 L347 362 L322 396 L306 352 Z"
              fill="rgba(0,0,0,0.22)"
            />

            {/* Right Striped Collar */}
            <path
              d="M380 328 L350 362 L374 396 L390 352 Z"
              fill={`url(#${instanceId}-shirt-stripes-fast)`}
              stroke="#171717"
              strokeWidth="1.5"
            />
            <path
              d="M380 328 L350 362 L374 396 L390 352 Z"
              fill="rgba(0,0,0,0.35)"
            />

            {/* Dynamic Head Cast Shadow on Collar & Tie */}
            <ellipse
              ref={neckShadowRef}
              cx="349"
              cy="342"
              rx="46"
              ry="18"
              fill="rgba(0,0,0,0.68)"
            />

            {/* Black Silk Tie */}
            <path
              d="M339 360 L358 360 L354 384 L343 384 Z"
              fill="#050505"
              stroke="#262626"
              strokeWidth="0.7"
            />
            <path
              d="M343 383 L354 383 L362 515 L349 545 L336 515 Z"
              fill="#040404"
            />
            <path
              d="M346 385 L349 385 L346 475 L342 475 Z"
              fill="#262626"
              opacity="0.45"
            />

            {/* Tailored Wool Overcoat Body & Arms */}
            <g>
              <path
                d="M304 346 L275 375 L215 398 C203 403, 198 412, 194 428 L162 585 L118 640 L110 650 L592 650 L582 638 L538 585 L502 426 C498 410, 492 402, 480 397 L420 375 L392 346 L350 535 Z"
                fill={`url(#${instanceId}-coat-texture-fast)`}
              />
              <path
                d="M304 346 L215 398 C203 403, 198 412, 194 428 L162 585 L115 650 L348 650 L348 525 Z"
                fill={`url(#${instanceId}-coat-left-shade)`}
                opacity="0.85"
              />
              <path
                d="M392 346 L480 397 C492 402, 498 410, 502 426 L538 585 L588 650 L348 650 L348 525 Z"
                fill={`url(#${instanceId}-coat-right-shade)`}
                opacity="0.85"
              />
            </g>

            {/* Inner Waistcoat Edges */}
            <path d="M312 375 L348 530 L348 650 L330 650 L302 420 Z" fill="#050505" />
            <path d="M384 375 L348 530 L348 650 L366 650 L394 420 Z" fill="#030303" />

            {/* Left Notched Lapel */}
            <path
              d="M305 344 L274 376 L266 418 L287 424 L272 440 L346 558 L346 495 L315 375 Z"
              fill={`url(#${instanceId}-lapel-highlight)`}
              stroke="#2e2e2e"
              strokeWidth="0.9"
            />

            {/* Right Notched Lapel */}
            <path
              d="M391 344 L422 376 L430 418 L409 424 L424 440 L348 558 L348 495 L381 375 Z"
              fill={`url(#${instanceId}-lapel-highlight)`}
              stroke="#242424"
              strokeWidth="0.9"
            />
          </g>
        </svg>

        {/* ==================================================== */}
        {/* LAYER 2: 3D CURSOR-TRACKING VINTAGE RADIO HEAD       */}
        {/* ==================================================== */}
        <div
          ref={headContainerRef}
          className="absolute inset-0 h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "50% 49%",
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
        >
          <svg
            viewBox="0 0 700 650"
            className="h-full w-full drop-shadow-[0_22px_26px_rgba(0,0,0,0.34)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`${instanceId}-speaker-mesh`}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <rect width="6" height="6" fill="#181818" />
                <rect x="0" y="0" width="6" height="1.6" fill="#525252" />
                <rect x="0" y="3" width="6" height="1.2" fill="#3a3a3a" />
                <rect x="0" y="0" width="1.5" height="6" fill="#737373" fillOpacity="0.65" />
                <rect x="3" y="0" width="1.2" height="6" fill="#262626" fillOpacity="0.8" />
                <circle cx="1.5" cy="1.5" r="0.9" fill="#d4d4d4" fillOpacity="0.55" />
              </pattern>

              <pattern
                id={`${instanceId}-speaker-ribs`}
                width="28"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2="0" y2="16" stroke="#0a0a0a" strokeWidth="2.4" strokeOpacity="0.7" />
                <line x1="2" y1="0" x2="2" y2="16" stroke="#a3a3a3" strokeWidth="0.8" strokeOpacity="0.45" />
                <line x1="0" y1="8" x2="28" y2="8" stroke="#e5e5e5" strokeWidth="0.9" strokeOpacity="0.35" />
              </pattern>

              <linearGradient id={`${instanceId}-radio-body-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#262626" />
                <stop offset="30%" stopColor="#0d0d0d" />
                <stop offset="85%" stopColor="#050505" />
                <stop offset="100%" stopColor="#1f1f1f" />
              </linearGradient>

              <linearGradient id={`${instanceId}-radio-side-left`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7a7a7a" />
                <stop offset="45%" stopColor="#2e2e2e" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </linearGradient>

              <linearGradient id={`${instanceId}-radio-side-right`} x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#6e6e6e" />
                <stop offset="45%" stopColor="#262626" />
                <stop offset="100%" stopColor="#080808" />
              </linearGradient>

              <linearGradient id={`${instanceId}-chrome-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5f5f5" />
                <stop offset="25%" stopColor="#737373" />
                <stop offset="50%" stopColor="#e5e5e5" />
                <stop offset="75%" stopColor="#404040" />
                <stop offset="100%" stopColor="#d4d4d4" />
              </linearGradient>

              <radialGradient id={`${instanceId}-mesh-spotlight`} cx="45%" cy="42%" r="58%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
                <stop offset="45%" stopColor="#a3a3a3" stopOpacity="0.14" />
                <stop offset="80%" stopColor="#000000" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.78" />
              </radialGradient>

              <radialGradient id={`${instanceId}-knob-metal`} cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#a3a3a3" />
                <stop offset="80%" stopColor="#404040" />
                <stop offset="100%" stopColor="#171717" />
              </radialGradient>
            </defs>

            {/* Telescopic Antenna with Inertia Lag */}
            <g
              ref={antennaGroupRef}
              style={{
                transformOrigin: "348px 138px",
              }}
            >
              <path
                d="M342 138 L358 130 L362 138 Z"
                fill="#262626"
                stroke="#525252"
                strokeWidth="1"
              />
              <line
                x1="348"
                y1="135"
                x2="395"
                y2="92"
                stroke="#171717"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              <line
                x1="395"
                y1="92"
                x2="432"
                y2="58"
                stroke="#262626"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <line
                x1="350"
                y1="134"
                x2="431"
                y2="59"
                stroke="#a3a3a3"
                strokeWidth="0.8"
                strokeOpacity="0.7"
              />
              <circle cx="433" cy="57" r="3.4" fill="#171717" />
              <circle cx="432" cy="56" r="1.2" fill="#d4d4d4" />
            </g>

            {/* Dynamic 3D Left Side Depth Profile */}
            <path
              ref={leftSideRef}
              d="M238 140 C224 144, 219 156, 217 175 L214 288 C214 308, 222 318, 238 322 L260 322 L256 138 Z"
              fill={`url(#${instanceId}-radio-side-left)`}
              stroke="#171717"
              strokeWidth="1.2"
            />

            {/* Dynamic 3D Right Side Depth Profile */}
            <path
              ref={rightSideRef}
              d="M454 142 C468 146, 474 158, 476 177 L480 290 C480 309, 472 319, 456 323 L436 323 L440 140 Z"
              fill={`url(#${instanceId}-radio-side-right)`}
              stroke="#171717"
              strokeWidth="1.2"
            />

            {/* Bottom Radio Base Stand */}
            <path d="M242 322 L458 324 L448 334 L252 332 Z" fill="#080808" />
            <rect x="268" y="326" width="22" height="7" rx="2" fill="#171717" />
            <rect x="408" y="327" width="22" height="7" rx="2" fill="#171717" />

            {/* Outer Radio Main Casing */}
            <path
              d="M254 134 C236 134, 230 146, 228 166 L224 292 C223 312, 233 323, 254 324 L448 326 C468 326, 478 315, 476 294 L468 172 C466 150, 456 138, 436 137 Z"
              fill={`url(#${instanceId}-radio-body-grad)`}
              stroke="#262626"
              strokeWidth="2"
            />

            {/* ==================================================== */}
            {/* PARALLAX FRONT FACE (Shifts smoothly toward cursor) */}
            {/* ==================================================== */}
            <g ref={faceGroupRef}>
              {/* Inner Chrome Bezel Frame */}
              <path
                d="M260 143 C245 143, 239 152, 237 170 L234 287 C233 304, 241 314, 260 315 L442 317 C459 317, 467 307, 465 289 L458 175 C456 156, 448 147, 431 146 Z"
                fill="#0a0a0a"
                stroke={`url(#${instanceId}-chrome-rim)`}
                strokeWidth="4.2"
              />

              {/* UPPER SECTION: WOVEN SPEAKER GRILLE MESH */}
              <g>
                <clipPath id={`${instanceId}-grille-clip-3d`}>
                  <path d="M264 152 C252 152, 247 158, 246 172 L244 252 L455 255 L449 177 C448 162, 441 155, 427 154 Z" />
                </clipPath>

                <g clipPath={`url(#${instanceId}-grille-clip-3d)`}>
                  <rect x="235" y="145" width="235" height="120" fill={`url(#${instanceId}-speaker-mesh)`} />
                  <rect x="235" y="145" width="235" height="120" fill={`url(#${instanceId}-speaker-ribs)`} />

                  {/* Glare spotlight */}
                  <g ref={glareGroupRef}>
                    <rect x="200" y="120" width="300" height="160" fill={`url(#${instanceId}-mesh-spotlight)`} />
                  </g>
                </g>
              </g>

              {/* Divider */}
              <line x1="243" y1="254" x2="456" y2="257" stroke={`url(#${instanceId}-chrome-rim)`} strokeWidth="3.2" />

              {/* LOWER SECTION: DIAL */}
              <g>
                <path d="M244 258 L242 284 C241 299, 248 307, 264 308 L437 310 C451 310, 458 301, 457 286 L455 260 Z" fill="#090909" />
                <rect x="295" y="265" width="112" height="36" rx="3" fill="#050505" stroke="#404040" strokeWidth="1.4" />
                {isPowered && <rect x="296" y="266" width="110" height="34" rx="2" fill="#ffffff" opacity="0.07" />}
                <line
                  ref={tuningNeedleRef}
                  x1={tuningNeedleX}
                  x2={tuningNeedleX}
                  y1="266"
                  y2="299"
                  stroke="#f5f5f5"
                  strokeWidth="1.8"
                />
              </g>
            </g>

            {/* ROTARY KNOBS */}
            <g ref={controlsGroupRef}>
              {/* Volume Knob */}
              <g
                role="slider"
                tabIndex={interactive && isPowered ? 0 : -1}
                aria-label="Volume"
                aria-valuenow={Math.round(volume)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${Math.round(volume)}%`}
                onKeyDown={(e) => handleKnobKeyDown("volume", e)}
                onPointerDown={handleKnobPointerDown("volume")}
                onPointerMove={handleKnobPointerMove}
                onPointerUp={handleKnobPointerEnd}
                onClick={handleKnobClick("volume")}
                className="cursor-grab active:cursor-grabbing touch-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-400 rounded-full"
                transform="translate(271, 283)"
              >
                <circle cx="2" cy="3" r="15" fill="#000000" opacity="0.85" />
                <circle cx="0" cy="0" r="14" fill="#262626" stroke="#a3a3a3" strokeWidth="1.5" />
                <g
                  ref={volumeKnobRotorRef}
                  style={{ transform: `rotate(${volumeRotation}deg)`, transformOrigin: "0px 0px" }}
                >
                  <circle cx="-1" cy="-1" r="10.5" fill={`url(#${instanceId}-knob-metal)`} stroke="#171717" strokeWidth="1" />
                  <line x1="-1" y1="-10" x2="-1" y2="-4" stroke="#171717" strokeWidth="2" strokeLinecap="round" />
                </g>
              </g>

              {/* Frequency Tuning Knob */}
              <g
                role="slider"
                tabIndex={interactive && isPowered ? 0 : -1}
                aria-label="Tuning Frequency"
                aria-valuenow={frequency}
                aria-valuemin={MIN_FREQUENCY}
                aria-valuemax={MAX_FREQUENCY}
                aria-valuetext={`${frequency.toFixed(1)} Megahertz`}
                onKeyDown={(e) => handleKnobKeyDown("frequency", e)}
                onPointerDown={handleKnobPointerDown("frequency")}
                onPointerMove={handleKnobPointerMove}
                onPointerUp={handleKnobPointerEnd}
                onClick={handleKnobClick("frequency")}
                className="cursor-grab active:cursor-grabbing touch-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-400 rounded-full"
                transform="translate(431, 286)"
              >
                <circle cx="2" cy="3" r="15" fill="#000000" opacity="0.85" />
                <circle cx="0" cy="0" r="14" fill="#262626" stroke="#a3a3a3" strokeWidth="1.5" />
                <g
                  ref={frequencyKnobRotorRef}
                  style={{ transform: `rotate(${frequencyRotation}deg)`, transformOrigin: "0px 0px" }}
                >
                  <circle cx="-1" cy="-1" r="10.5" fill={`url(#${instanceId}-knob-metal)`} stroke="#171717" strokeWidth="1" />
                  <line x1="-1" y1="-10" x2="-1" y2="-4" stroke="#171717" strokeWidth="2" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* Optional bottom mini bar */}
      {showControls && interactive && (
        <div className="relative z-20 mt-3 flex items-center justify-center gap-3 rounded-full border border-neutral-300/80 bg-white/80 px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-md">
          <button
            type="button"
            onClick={handlePowerToggle}
            className="flex items-center gap-1 hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-sm"
            aria-label={isPowered ? "Turn off radio" : "Turn on radio"}
          >
            {isPowered ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
                <path d="M16 9a5 5 0 0 1 0 6" />
                <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
                <line x1="22" x2="16" y1="9" y2="15" />
                <line x1="16" x2="22" y1="9" y2="15" />
              </svg>
            )}
            <span>{isPowered ? "ON" : "OFF"}</span>
          </button>
          <span className="h-3 w-px bg-neutral-300" />
          <span className="font-mono tabular-nums">{frequency.toFixed(1)} MHz</span>
        </div>
      )}
    </div>
  );
}
