import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// PIXEL-PERFECT DOT-MATRIX BITMAP DEFINITIONS (10x13 & 6x13 2px-Cell Grids)
// Extracted 1:1 from Reference Coordinates x=[129, 239], y=[221, 246]
// ============================================================================
const DIGIT_BITMAPS: Record<string, string[]> = {
  '0_left': [
    '0011111100',
    '0111111110',
    '1110000111',
    '1100000011',
    '1100001111',
    '1100111111',
    '1101110011',
    '1111100011',
    '1111000011',
    '1100000011',
    '1110000111',
    '0111111110',
    '0011111100',
  ],
  '0_mid': [
    '0011111100',
    '0111111110',
    '0110000011',
    '1100000011',
    '1100001111',
    '1100111111',
    '1100111011',
    '0111110011',
    '0111100011',
    '0110000011',
    '0110000111',
    '0011111110',
    '0011111100',
  ],
  '0': [
    '0011111100',
    '0111111110',
    '1110000111',
    '1100000011',
    '1100001111',
    '1100111111',
    '1101110011',
    '1111100011',
    '1111000011',
    '1100000011',
    '1110000111',
    '0111111110',
    '0011111100',
  ],
  '1': [
    '001100',
    '011100',
    '111100',
    '111100',
    '001100',
    '001100',
    '001100',
    '001100',
    '001100',
    '001100',
    '001100',
    '111111',
    '111111',
  ],
  '1_wide': [
    '0000110000',
    '0001110000',
    '0011110000',
    '0011110000',
    '0000110000',
    '0000110000',
    '0000110000',
    '0000110000',
    '0000110000',
    '0000110000',
    '0000110000',
    '0011111100',
    '0011111100',
  ],
  '2': [
    '0111111100',
    '1111111110',
    '1100000111',
    '0000000011',
    '0000000111',
    '0000011110',
    '0001111000',
    '0111100000',
    '1110000000',
    '1100000000',
    '1100000011',
    '1111111111',
    '1111111111',
  ],
  '3': [
    '0111111100',
    '1111111110',
    '1100000111',
    '0000000011',
    '0000000111',
    '0001111110',
    '0001111110',
    '0000000111',
    '0000000011',
    '1100000011',
    '1110000111',
    '0111111110',
    '0011111100',
  ],
  '4': [
    '0000011110',
    '0000111110',
    '0001110110',
    '0011100110',
    '0111000110',
    '1110000110',
    '1100000110',
    '1111111111',
    '1111111111',
    '0000000110',
    '0000000110',
    '0000000110',
    '0000000110',
  ],
  '5': [
    '1111111111',
    '1111111111',
    '1100000000',
    '1100000000',
    '1101111100',
    '1111111110',
    '0000000111',
    '0000000011',
    '0000000011',
    '1100000011',
    '1110000111',
    '0111111110',
    '0011111100',
  ],
  '6': [
    '0011111100',
    '0111111110',
    '1110000110',
    '1100000000',
    '1100000000',
    '1101111100',
    '1111111110',
    '1110000111',
    '1100000011',
    '1100000011',
    '1110000111',
    '0111111110',
    '0011111100',
  ],
  '7': [
    '1111111111',
    '1111111111',
    '1100000111',
    '0000001110',
    '0000011100',
    '0000011000',
    '0000111000',
    '0000110000',
    '0001110000',
    '0001100000',
    '0001100000',
    '0001100000',
    '0001100000',
  ],
  '8': [
    '0011111100',
    '0111111110',
    '1110000111',
    '1100000011',
    '1110000111',
    '0111111110',
    '0111111110',
    '1110000111',
    '1100000011',
    '1100000011',
    '1110000111',
    '0111111110',
    '0011111100',
  ],
  '9': [
    '0011111100',
    '0111111110',
    '1110000111',
    '1100000011',
    '1100000011',
    '1110000111',
    '0111111111',
    '0011111011',
    '0000000011',
    '0000000011',
    '0110000111',
    '0111111110',
    '0011111100',
  ],
  ':': [
    '00',
    '00',
    '11',
    '11',
    '00',
    '00',
    '00',
    '00',
    '00',
    '11',
    '11',
    '00',
    '00',
  ],
};

// ============================================================================
// HUMAN-CENTERED HARDWARE PRESETS (Coherent Top Label + Icon + Time + Bottom Subtext)
// Default Preset 0 is 100% locked to Reference Image: FAIR 30° | 01:00 | SAT. 18 MAY
// ============================================================================
type IconVariant = 'sun' | 'pomodoro' | 'deepwork' | 'ambient';
type HardwareStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

interface HardwarePreset {
  id: string;
  topLabel: string;
  topAccent: string;
  bottomLeft: string;
  bottomAccent: string;
  bottomRight: string;
  icon: IconVariant;
  durationSeconds: number;
  displayFormat: 'HH_MM' | 'MM_SS';
  description: string;
}

const HARDWARE_PRESETS: HardwarePreset[] = [
  {
    id: 'reference-standby',
    topLabel: 'FAIR',
    topAccent: '30°',
    bottomLeft: 'SAT.',
    bottomAccent: '18',
    bottomRight: 'MAY',
    icon: 'sun',
    durationSeconds: 3600, // 01:00 (1 hour standby / reference clock)
    displayFormat: 'HH_MM',
    description: '1:1 Reference Standby (01:00)',
  },
  {
    id: 'pomodoro-25',
    topLabel: 'FOCUS',
    topAccent: '25M',
    bottomLeft: 'SESSION',
    bottomAccent: '01',
    bottomRight: 'FLOW',
    icon: 'pomodoro',
    durationSeconds: 25 * 60, // 25:00 Pomodoro
    displayFormat: 'MM_SS',
    description: 'Pomodoro Focus (25:00)',
  },
  {
    id: 'deep-work-45',
    topLabel: 'DEEP',
    topAccent: '45M',
    bottomLeft: 'SPRINT',
    bottomAccent: '02',
    bottomRight: 'WORK',
    icon: 'deepwork',
    durationSeconds: 45 * 60, // 45:00 Deep Work
    displayFormat: 'MM_SS',
    description: 'Deep Work Block (45:00)',
  },
  {
    id: 'rest-break-05',
    topLabel: 'REST',
    topAccent: '05M',
    bottomLeft: 'RECHARGE',
    bottomAccent: '03',
    bottomRight: 'CALM',
    icon: 'ambient',
    durationSeconds: 5 * 60, // 05:00 Short Break
    displayFormat: 'MM_SS',
    description: 'Recovery Break (05:00)',
  },
];

// ============================================================================
// WEB AUDIO API TACTILE HARDWARE SYNTHESIZER (Zero External Assets)
// ============================================================================
function useHardwareSound(soundEnabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(
    (type: 'rocker-up' | 'rocker-down' | 'confirm-start' | 'confirm-pause' | 'alarm-done') => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!ctxRef.current) {
          ctxRef.current = new AudioCtx();
        }
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 'rocker-up') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(540, now);
          osc.frequency.exponentialRampToValueAtTime(210, now + 0.026);
          gain.gain.setValueAtTime(0.11, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.028);
        } else if (type === 'rocker-down') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.026);
          gain.gain.setValueAtTime(0.11, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.028);
        } else if (type === 'confirm-start') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(784, now); // G5
          osc.frequency.setValueAtTime(1174.66, now + 0.04); // D6
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === 'confirm-pause') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, now); // B5
          osc.frequency.setValueAtTime(659.25, now + 0.04); // E5
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === 'alarm-done') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(1046.5, now);
          osc.frequency.setValueAtTime(1318.5, now + 0.08);
          osc.frequency.setValueAtTime(1567.98, now + 0.16);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.34);
        }
      } catch {
        // Ignore audio errors if blocked by browser autoplay rules
      }
    },
    [soundEnabled]
  );

  return playSound;
}

// ============================================================================
// MORPHING DOT-MATRIX ICON (40 Persistent Particles with Spring Morphing)
// ============================================================================
interface DotMatrixSunIconProps {
  variant: IconVariant;
  status: HardwareStatus;
  progressRatio: number; // 0.0 (start) -> 1.0 (complete)
}

const DotMatrixSunIcon: React.FC<DotMatrixSunIconProps> = ({
  variant,
  status,
  progressRatio,
}) => {
  const cx = 22.5;
  const cy = 22.0;

  // 32 Core Dots: 6x6 inner grid (4.0px pitch, omitting 4 corners)
  const coreDots: Array<{ key: string; x: number; y: number; r: number; opacity: number }> = [];
  let idx = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const isCorner = (r === 0 || r === 5) && (c === 0 || c === 5);
      if (isCorner) continue;

      // Exact 1:1 Reference Coordinates for 'sun'
      let x = cx - 10.0 + c * 4.0;
      let y = cy - 10.0 + r * 4.0;
      let radius = 1.5;
      let opacity = 1;

      if (variant === 'pomodoro') {
        // Concentric precision target ring + inner 2x2 focus nucleus
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 4.5) {
          const angle = Math.atan2(dy, dx);
          x = cx + 11.4 * Math.cos(angle);
          y = cy + 11.4 * Math.sin(angle);
          radius = 1.38;
        } else {
          x = cx + (c - 2.5) * 3.4;
          y = cy + (r - 2.5) * 3.4;
          radius = status === 'RUNNING' ? 1.72 : 1.55;
        }
      } else if (variant === 'deepwork') {
        // Hourglass / diamond lattice geometry for deep work sprints
        const rowSpread = Math.abs(r - 2.5) * 1.15 + 2.6;
        x = cx + (c - 2.5) * rowSpread;
        y = cy + (r - 2.5) * 4.1;
        radius = 1.45;
      } else if (variant === 'ambient') {
        // Soft breathing wave / cloud horizon for recovery break
        x = cx - 11.0 + c * 4.4;
        y = cy - 6.5 + r * 3.1 + Math.sin(c * 1.1 + r * 0.5) * 1.4;
        radius = 1.42;
      }

      coreDots.push({
        key: `core-${idx++}`,
        x,
        y,
        r: radius,
        opacity,
      });
    }
  }

  // 8 Outer Ray Dots: at radius 20.1px every 45 degrees in Reference 'sun' state
  const rayDots: Array<{
    key: string;
    x: number;
    y: number;
    r: number;
    fill: string;
    opacity: number;
  }> = [];

  const litRaysCount = Math.max(1, Math.round((1 - progressRatio) * 8));

  for (let i = 0; i < 8; i++) {
    const deg = i * 45;
    const rad = (deg * Math.PI) / 180;
    let rx = cx + 20.1 * Math.cos(rad);
    let ry = cy + 20.1 * Math.sin(rad);
    let r = 1.65;
    let fill = '#d0cac5';
    let opacity = 1;

    if (variant === 'pomodoro') {
      const rotOffset = status === 'RUNNING' ? 22.5 : 0;
      const orbitRad = ((deg + rotOffset) * Math.PI) / 180;
      rx = cx + 18.6 * Math.cos(orbitRad);
      ry = cy + 18.6 * Math.sin(orbitRad);
    } else if (variant === 'deepwork') {
      const orbitRad = ((deg + 45) * Math.PI) / 180;
      rx = cx + 19.2 * Math.cos(orbitRad);
      ry = cy + 19.2 * Math.sin(orbitRad);
    } else if (variant === 'ambient') {
      const arcAngle = (-157.5 + i * 45) * (Math.PI / 180);
      rx = cx + 18.5 * Math.cos(arcAngle);
      ry = cy + 18.5 * Math.sin(arcAngle);
    }

    if (status === 'RUNNING') {
      const isLit = i < litRaysCount;
      fill = isLit ? '#dfd9d4' : '#7a7572';
      opacity = isLit ? 1 : 0.45;
    } else if (status === 'COMPLETED') {
      fill = '#c84727';
      r = 1.85;
    }

    rayDots.push({
      key: `ray-${i}`,
      x: rx,
      y: ry,
      r,
      fill,
      opacity,
    });
  }

  return (
    <svg
      className="absolute left-[99px] top-[27px] w-[45px] h-[45px]"
      viewBox="0 0 45 45"
      fill="none"
      aria-label="Dot-matrix sun weather icon"
    >
      {coreDots.map((dot, i) => (
        <circle
          key={dot.key}
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill={status === 'COMPLETED' ? '#c84727' : '#cdc7c2'}
          fillOpacity={dot.opacity}
          style={{
            transition:
              'cx 420ms cubic-bezier(0.22, 1, 0.36, 1), cy 420ms cubic-bezier(0.22, 1, 0.36, 1), r 300ms ease, fill 300ms ease, fill-opacity 300ms ease',
            transitionDelay: `${(i % 8) * 7}ms`,
          }}
        />
      ))}
      {rayDots.map((ray, i) => (
        <circle
          key={ray.key}
          cx={ray.x}
          cy={ray.y}
          r={ray.r}
          fill={ray.fill}
          fillOpacity={ray.opacity}
          style={{
            transition:
              'cx 460ms cubic-bezier(0.22, 1, 0.36, 1), cy 460ms cubic-bezier(0.22, 1, 0.36, 1), r 300ms ease, fill 300ms ease, fill-opacity 300ms ease',
            transitionDelay: `${i * 12}ms`,
          }}
        />
      ))}
    </svg>
  );
};

// ============================================================================
// PERSISTENT 10x13 MATRIX SLOT MORPHING CLOCK (`01:00` Reference + Smooth Morph)
// Every digit slot renders a persistent 10x13 grid (130 <rect> elements) so React
// never unmounts/remounts DOM nodes when switching between '1' and '0'/'2'/etc.
// ============================================================================
interface DotMatrixClockProps {
  remainingSeconds: number;
  presetIndex: number;
  status: HardwareStatus;
  colonVisible: boolean;
  displayFormat: 'HH_MM' | 'MM_SS';
}

const DotMatrixClock: React.FC<DotMatrixClockProps> = ({
  remainingSeconds,
  presetIndex,
  status,
  colonVisible,
  displayFormat,
}) => {
  // Exact 1:1 Reference Default Check: Preset 0, IDLE, 3600 seconds (01:00)
  const isDefaultRef =
    status === 'IDLE' && presetIndex === 0 && remainingSeconds === 3600;

  let leftPair = '01';
  let rightPair = '00';

  if (isDefaultRef) {
    leftPair = '01';
    rightPair = '00';
  } else if (status === 'IDLE' && displayFormat === 'HH_MM' && remainingSeconds >= 3600) {
    // Show HH:MM when in standby clock format (e.g. 01:00, 01:05, etc.)
    const hrs = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    leftPair = String(hrs).padStart(2, '0');
    rightPair = String(mins).padStart(2, '0');
  } else {
    // Logical MM:SS countdown display (e.g. 59:59, 25:00, 45:00, 05:00)
    const totalMins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    leftPair = String(Math.min(99, totalMins)).padStart(2, '0');
    rightPair = String(secs).padStart(2, '0');
  }

  // Select exact reference bitmaps in Default Reference State, or 10-column bitmaps when morphing
  const get10x13Grid = (char: string, slotIndex: number): string[] => {
    if (isDefaultRef) {
      if (slotIndex === 0) return DIGIT_BITMAPS['0_left'];
      if (slotIndex === 1) return DIGIT_BITMAPS['1_wide']; // 6-col '1' centered inside 10-col slot at x=23 -> active pixels at x=27!
      if (slotIndex === 2) return DIGIT_BITMAPS['0_mid'];
      if (slotIndex === 3) return DIGIT_BITMAPS['0'];
    }
    if (char === '1') return DIGIT_BITMAPS['1_wide'];
    return DIGIT_BITMAPS[char] || DIGIT_BITMAPS['0'];
  };

  const g1 = get10x13Grid(leftPair[0], 0);
  const g2 = get10x13Grid(leftPair[1], 1);
  const g3 = get10x13Grid(rightPair[0], 2);
  const g4 = get10x13Grid(rightPair[1], 3);

  // Notice: In `1_wide`, columns 2..5 (offset +4px..+11px) are active, and base offset x2=23 + 4 = 27!
  // That means `1_wide` at x2=23 produces the EXACT same pixel coordinates as 6-col `1` at x2=27,
  // while keeping a constant 10x13 grid across ALL 10 digits (0-9) for 100% true CSS morphing!
  const x1 = 0;
  const x2 = 23;
  const xColon = 52;
  const x3 = 68;
  const x4 = 91;

  const dotColor = status === 'COMPLETED' ? '#d2502e' : '#cbc5c0';

  const renderPersistentSlot = (
    grid: string[],
    offsetX: number,
    slotKey: string,
    activeFlag = true
  ) => {
    const cols = grid[0].length;
    const nodes: React.ReactNode[] = [];
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      for (let c = 0; c < cols; c++) {
        const isOn = activeFlag && row[c] === '1';
        const cx = offsetX + c * 2;
        const cy = r * 2;
        nodes.push(
          <rect
            key={`${slotKey}-${r}-${c}`}
            x={cx}
            y={cy}
            width={1.72}
            height={1.72}
            rx={0.25}
            fill={dotColor}
            style={{
              opacity: isOn ? 1 : 0,
              transform: isOn ? 'scale(1)' : 'scale(0.25)',
              transformOrigin: `${cx + 0.86}px ${cy + 0.86}px`,
              transition: isDefaultRef
                ? 'none'
                : 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), fill 250ms ease',
            }}
          />
        );
      }
    }
    return nodes;
  };

  return (
    <svg
      className="absolute left-[66px] top-[162px] w-[111px] h-[26px]"
      viewBox="0 0 111 26"
      fill="none"
      aria-label={`${leftPair}:${rightPair}`}
    >
      {renderPersistentSlot(g1, x1, 'slot1', true)}
      {renderPersistentSlot(g2, x2, 'slot2', true)}
      {renderPersistentSlot(DIGIT_BITMAPS[':'], xColon, 'colon', colonVisible)}
      {renderPersistentSlot(g3, x3, 'slot3', true)}
      {renderPersistentSlot(g4, x4, 'slot4', true)}
    </svg>
  );
};

// ============================================================================
// MAIN PRODUCTION COMPONENT: RetroHandheldClock
// ============================================================================
export default function App() {
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600); // 01:00 default reference state
  const [totalSessionSeconds, setTotalSessionSeconds] = useState<number>(3600);
  const [status, setStatus] = useState<HardwareStatus>('IDLE');
  const [colonVisible, setColonVisible] = useState<boolean>(true);
  const [pressedControl, setPressedControl] = useState<'up' | 'down' | 'action' | null>(null);
  const [transitionPulse, setTransitionPulse] = useState<boolean>(false);

  const playSound = useHardwareSound(true);

  const triggerTextMorphPulse = useCallback(() => {
    setTransitionPulse(true);
    const t = setTimeout(() => setTransitionPulse(false), 220);
    return () => clearTimeout(t);
  }, []);

  // Select a specific preset directly or via rocker
  const selectPreset = useCallback(
    (index: number) => {
      const target = HARDWARE_PRESETS[index];
      setPresetIndex(index);
      setStatus('IDLE');
      setRemainingSeconds(target.durationSeconds);
      setTotalSessionSeconds(target.durationSeconds);
      setColonVisible(true);
      triggerTextMorphPulse();
    },
    [triggerTextMorphPulse]
  );

  // Rocker Up ▲:
  // - In IDLE: cycles to next coherent preset (Standby 01:00 -> Pomodoro 25:00 -> Deep Work 45:00 -> Rest 05:00)
  // - In PAUSED or RUNNING: fine-tunes current timer by +1 minute (+60s)
  const stepUp = useCallback(() => {
    playSound('rocker-up');
    setPressedControl('up');
    setTimeout(() => setPressedControl(null), 130);

    if (status === 'IDLE' || status === 'COMPLETED') {
      const nextIdx = (presetIndex + 1) % HARDWARE_PRESETS.length;
      selectPreset(nextIdx);
    } else {
      triggerTextMorphPulse();
      setRemainingSeconds((prev) => {
        const next = Math.min(prev + 60, 99 * 60);
        setTotalSessionSeconds((tot) => Math.max(tot, next));
        return next;
      });
    }
  }, [status, presetIndex, playSound, selectPreset, triggerTextMorphPulse]);

  // Rocker Down ▼:
  // - In IDLE: cycles to previous coherent preset
  // - In PAUSED or RUNNING: fine-tunes current timer by -1 minute (-60s, minimum 60s)
  const stepDown = useCallback(() => {
    playSound('rocker-down');
    setPressedControl('down');
    setTimeout(() => setPressedControl(null), 130);

    if (status === 'IDLE' || status === 'COMPLETED') {
      const prevIdx = (presetIndex - 1 + HARDWARE_PRESETS.length) % HARDWARE_PRESETS.length;
      selectPreset(prevIdx);
    } else {
      triggerTextMorphPulse();
      setRemainingSeconds((prev) => Math.max(60, prev - 60));
    }
  }, [status, presetIndex, playSound, selectPreset, triggerTextMorphPulse]);

  // Orange Checkmark ✓ Button & Screen Pill:
  // - IDLE -> RUNNING (starts live countdown immediately)
  // - RUNNING -> PAUSED (pauses countdown)
  // - PAUSED -> RUNNING (resumes countdown)
  // - COMPLETED -> IDLE (resets current preset)
  const toggleStart = useCallback(() => {
    setPressedControl('action');
    setTimeout(() => setPressedControl(null), 150);
    triggerTextMorphPulse();

    if (status === 'IDLE') {
      playSound('confirm-start');
      setStatus('RUNNING');
      // Immediately step 1 second when starting from 01:00 (3600s -> 59:59) so user sees instant live feedback
      setRemainingSeconds((prev) => (prev === 3600 ? 3599 : prev));
    } else if (status === 'RUNNING') {
      playSound('confirm-pause');
      setStatus('PAUSED');
      setColonVisible(true);
    } else if (status === 'PAUSED') {
      playSound('confirm-start');
      setStatus('RUNNING');
    } else if (status === 'COMPLETED') {
      playSound('confirm-start');
      const currentPreset = HARDWARE_PRESETS[presetIndex];
      setStatus('IDLE');
      setRemainingSeconds(currentPreset.durationSeconds);
      setTotalSessionSeconds(currentPreset.durationSeconds);
      setColonVisible(true);
    }
  }, [status, presetIndex, playSound, triggerTextMorphPulse]);

  // Reset to 1:1 Reference State (`01:00`, `FAIR 30°`, `SAT. 18 MAY`)
  const resetToReference = useCallback(() => {
    playSound('confirm-pause');
    setPresetIndex(0);
    setStatus('IDLE');
    setRemainingSeconds(3600);
    setTotalSessionSeconds(3600);
    setColonVisible(true);
    setTransitionPulse(false);
  }, [playSound]);

  // Accurate 500ms half-second heartbeat:
  // - Toggles colon visibility every 500ms
  // - Decrements remainingSeconds by 1 every 1000ms (2 half-ticks) with zero nested state bugs
  const halfTickRef = useRef<number>(0);
  useEffect(() => {
    if (status !== 'RUNNING') {
      halfTickRef.current = 0;
      return;
    }

    const interval = setInterval(() => {
      halfTickRef.current += 1;
      setColonVisible((prev) => !prev);

      if (halfTickRef.current % 2 === 0) {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setStatus('COMPLETED');
            setColonVisible(true);
            playSound('alarm-done');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [status, playSound]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepDown();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleStart();
      } else if (e.key === 'Escape' || e.key === 'r' || e.key === 'R') {
        resetToReference();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepUp, stepDown, toggleStart, resetToReference]);

  const activePreset = HARDWARE_PRESETS[presetIndex];

  const progressRatio =
    totalSessionSeconds > 0
      ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSessionSeconds))
      : 0;

  // Dynamic logical top & bottom display strings that preserve 1:1 Reference when idle in Preset 0
  const topLabelText =
    status === 'COMPLETED'
      ? 'DONE'
      : status === 'PAUSED'
      ? 'PAUSED'
      : activePreset.topLabel;
  const topAccentText =
    status === 'COMPLETED' ? '00M' : activePreset.topAccent;

  return (
    <div
      className="min-h-screen w-full bg-[#141414] flex flex-col items-center justify-center select-none antialiased"
      style={{
        fontFamily: "'DejaVu Sans Mono', 'JetBrains Mono', 'Liberation Mono', monospace",
      }}
    >
      {/* Exact 438x458 Reference Viewport Stage */}
      <main
        className="relative w-[438px] h-[458px] overflow-hidden shrink-0"
        style={{
          background: 'linear-gradient(180deg, #151515 0%, #141414 60%, #121212 100%)',
        }}
        aria-label="Retro Hardware Handheld Clock Widget"
      >
        {/* Hardware Casing Body: x=[50, 405] (356px), y=[47, 420] (374px) */}
        <div
          className="absolute left-[50px] top-[47px] w-[356px] h-[374px] rounded-[23px] overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, #898380 0%, #847e7b 18%, #797370 50%, #6d6764 78%, #5f5a57 100%)',
            boxShadow:
              'inset 1.5px 1.5px 1px rgba(212, 206, 202, 0.55), inset -1.5px -2px 2px rgba(30, 27, 25, 0.65), inset 0 0 0 1px rgba(60, 55, 52, 0.35), 0 14px 26px rgba(0, 0, 0, 0.65), 0 4px 8px rgba(0, 0, 0, 0.55)',
          }}
        >
          {/* Subtle Anodized Metallic Grain Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.14] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Right Control Panel Seam Grooves (y=115 & y=349 in reference -> top=68px & top=302px) */}
          <div
            className="absolute left-[257px] top-[68px] w-[99px] h-[2px] opacity-85 pointer-events-none z-[1]"
            style={{ background: 'linear-gradient(180deg, #5d5855 0%, #8e8885 100%)' }}
          />
          <div
            className="absolute left-[257px] top-[302px] w-[99px] h-[2px] opacity-85 pointer-events-none z-[1]"
            style={{ background: 'linear-gradient(180deg, #4f4a47 0%, #7d7774 100%)' }}
          />

          {/* Top-Right Checkerboard Pixel Emblem (x=[342, 372], y=[62, 70] -> left=292px, top=15px) */}
          <svg
            className="absolute left-[292px] top-[15px] w-[31px] h-[9px] z-[3]"
            viewBox="0 0 31 9"
            fill="none"
            aria-hidden="true"
          >
            <rect x="0" y="0" width="4" height="4" rx="0.4" fill="#1e1c1b" />
            <rect x="9" y="0" width="4" height="4" rx="0.4" fill="#1e1c1b" />
            <rect x="18" y="0" width="4.2" height="4" rx="0.4" fill="#1e1c1b" />
            <rect x="26.5" y="0" width="4.2" height="4" rx="0.4" fill="#1e1c1b" />
            <rect
              x="4.5"
              y="4.5"
              width="4.2"
              height="4.2"
              rx="0.4"
              fill={status === 'RUNNING' ? '#ea5832' : '#c84727'}
              style={{ transition: 'fill 300ms ease' }}
            />
            <rect x="13.5" y="4.5" width="4.2" height="4.2" rx="0.4" fill="#1e1c1b" />
            <rect x="22.2" y="4.5" width="4.2" height="4.2" rx="0.4" fill="#1e1c1b" />
          </svg>

          {/* Recessed OLED Screen (x=[63, 306], y=[59, 407] -> left=13px, top=12px, 244x349px) */}
          <section
            className="absolute left-[13px] top-[12px] w-[244px] h-[349px] rounded-[15px] bg-black overflow-hidden z-[2]"
            style={{
              boxShadow:
                '0 0 0 1px #1a1817, 0 0.5px 0 0.5px rgba(155, 149, 145, 0.22), inset 0 2px 4px rgba(0, 0, 0, 0.95)',
            }}
            aria-live="polite"
          >
            {/* Morphing Dot-Matrix Weather / Mode Icon */}
            <DotMatrixSunIcon
              variant={activePreset.icon}
              status={status}
              progressRatio={progressRatio}
            />

            {/* Top Status Line: FAIR 30° (or FOCUS 25M / DEEP 45M / REST 05M) */}
            <div
              className="absolute left-0 top-[140.5px] w-[244px] h-[11px] flex items-center justify-center gap-[6.5px] text-[11.2px] leading-[11px] font-semibold tracking-[0.11em]"
              style={{
                transform: transitionPulse
                  ? 'translateY(-1.5px) scale(0.97)'
                  : 'translateY(0) scale(1)',
                opacity: transitionPulse ? 0.72 : 1,
                filter: transitionPulse ? 'blur(0.4px)' : 'blur(0px)',
                transition:
                  'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, filter 200ms ease',
              }}
            >
              <span className="text-[#bfbebc]">{topLabelText}</span>
              <span className="text-[#98523c]">{topAccentText}</span>
            </div>

            {/* Custom Dot-Matrix Time Readout: 01:00 with Persistent 10x13 Slot Morphing */}
            <DotMatrixClock
              remainingSeconds={remainingSeconds}
              presetIndex={presetIndex}
              status={status}
              colonVisible={colonVisible}
              displayFormat={activePreset.displayFormat}
            />

            {/* Bottom Subtext Line: SAT. 18 MAY (or SESSION 01 FLOW / SPRINT 02 WORK) */}
            <div
              className="absolute left-0 top-[197px] w-[244px] h-[11px] flex items-center justify-center gap-[7px] text-[11.2px] leading-[11px] font-semibold tracking-[0.1em]"
              style={{
                transform: transitionPulse
                  ? 'translateY(1.5px) scale(0.97)'
                  : 'translateY(0) scale(1)',
                opacity: transitionPulse ? 0.75 : 1,
                filter: transitionPulse ? 'blur(0.4px)' : 'blur(0px)',
                transition:
                  'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, filter 200ms ease',
              }}
            >
              <span className="text-[#9f9f9f]">{activePreset.bottomLeft}</span>
              <span className="text-[#844840]">{activePreset.bottomAccent}</span>
              <span className="text-[#9f9f9f]">{activePreset.bottomRight}</span>
            </div>
          </section>

          {/* Tactile Gray Rocker Button (x=[334, 379], y=[153, 247] -> left=283px, top=105px) */}
          <div
            className="absolute left-[283px] top-[105px] w-[48px] h-[96px] rounded-[24px] bg-[#2b2725] z-[3]"
            style={{
              boxShadow:
                '-2px 2px 4px rgba(0, 0, 0, 0.45), 1px 1px 0 rgba(190, 184, 180, 0.35)',
              perspective: '240px',
            }}
          >
            <div
              className="absolute left-[1.5px] top-[1.5px] w-[45px] h-[93px] rounded-[22.5px] overflow-hidden flex flex-col"
              style={{
                background:
                  'linear-gradient(180deg, #b5b0ad 0%, #b0aba8 48%, #aeaba8 52%, #a9a4a1 100%)',
                boxShadow:
                  pressedControl === 'up'
                    ? 'inset 1px 2.5px 2px rgba(60, 55, 52, 0.45), -1px 2px 3px rgba(0, 0, 0, 0.4)'
                    : pressedControl === 'down'
                    ? 'inset 1px -2.5px 2px rgba(60, 55, 52, 0.45), -1px 1px 3px rgba(0, 0, 0, 0.4)'
                    : 'inset 1px 1.5px 1px rgba(242, 238, 235, 0.75), inset -1.5px -1.5px 1.5px rgba(95, 90, 87, 0.6), -2px 3px 5px rgba(0, 0, 0, 0.45)',
                transform:
                  pressedControl === 'up'
                    ? 'rotateX(6deg) translateY(-0.5px)'
                    : pressedControl === 'down'
                    ? 'rotateX(-6deg) translateY(0.5px)'
                    : 'rotateX(0deg) translateY(0)',
                transition:
                  'transform 140ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 140ms ease',
              }}
            >
              <button
                type="button"
                onClick={stepUp}
                className="flex-1 w-full bg-transparent border-none p-0 cursor-pointer flex items-center justify-center active:brightness-95 active:translate-y-[1px] transition-transform outline-none"
                aria-label="Cycle mode up or add 1 minute"
                title={
                  status === 'IDLE'
                    ? 'Next Mode Preset (ArrowUp)'
                    : 'Add +1 Minute (ArrowUp)'
                }
              >
                <svg
                  width="14"
                  height="9"
                  viewBox="0 0 14 9"
                  fill="none"
                  className="mt-[1px]"
                >
                  <path
                    d="M2.2 6.8L7 2.2L11.8 6.8"
                    stroke="#5b5653"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div
                className="w-full h-[2px] shrink-0"
                style={{ background: 'linear-gradient(180deg, #2d2724 0%, #c4bfbc 100%)' }}
              />

              <button
                type="button"
                onClick={stepDown}
                className="flex-1 w-full bg-transparent border-none p-0 cursor-pointer flex items-center justify-center active:brightness-95 active:translate-y-[1px] transition-transform outline-none"
                aria-label="Cycle mode down or subtract 1 minute"
                title={
                  status === 'IDLE'
                    ? 'Previous Mode Preset (ArrowDown)'
                    : 'Subtract -1 Minute (ArrowDown)'
                }
              >
                <svg
                  width="14"
                  height="9"
                  viewBox="0 0 14 9"
                  fill="none"
                  className="mt-[1px]"
                >
                  <path
                    d="M2.2 2.2L7 6.8L11.8 2.2"
                    stroke="#57524f"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tactile Circular Orange Confirm Button with Clear Active/Inactive State (x=[333, 380], y=[267, 314]) */}
          <div
            className="absolute left-[282.5px] top-[220px] w-[48px] h-[48px] rounded-full bg-[#231e1c] z-[3] flex items-center justify-center"
            style={{
              boxShadow:
                status === 'RUNNING'
                  ? '0 0 12px rgba(234, 88, 50, 0.55), -2px 3px 5px rgba(0, 0, 0, 0.55), 1px 1px 0 rgba(255, 140, 102, 0.45)'
                  : status === 'PAUSED'
                  ? '0 0 8px rgba(210, 120, 60, 0.35), -2px 3px 5px rgba(0, 0, 0, 0.55), 1px 1px 0 rgba(170, 164, 160, 0.3)'
                  : status === 'COMPLETED'
                  ? '0 0 14px rgba(234, 88, 50, 0.7), -2px 3px 5px rgba(0, 0, 0, 0.55)'
                  : '-2px 3px 5px rgba(0, 0, 0, 0.55), 1px 1px 0 rgba(170, 164, 160, 0.3)',
              transition: 'box-shadow 260ms ease',
            }}
          >
            <button
              type="button"
              onClick={toggleStart}
              aria-pressed={status === 'RUNNING'}
              className="w-[45px] h-[45px] rounded-full border-none p-0 cursor-pointer relative flex items-center justify-center active:scale-95 active:brightness-90 outline-none"
              style={{
                background:
                  status === 'RUNNING'
                    ? 'radial-gradient(circle at 42% 38%, #e05a36 0%, #cc4826 58%, #a83316 100%)'
                    : status === 'PAUSED'
                    ? 'radial-gradient(circle at 38% 32%, #bf4b2c 0%, #ad3f22 58%, #963218 100%)'
                    : 'radial-gradient(circle at 38% 32%, #d2502e 0%, #c64626 58%, #b63d1f 100%)',
                boxShadow:
                  pressedControl === 'action' || status === 'RUNNING'
                    ? 'inset 1.5px 2px 3.5px rgba(48, 12, 4, 0.75), inset -1px -1px 2px rgba(255, 152, 118, 0.35), 0 1px 1px rgba(0, 0, 0, 0.45)'
                    : 'inset 1px 1.5px 1.5px rgba(242, 132, 98, 0.65), inset -1.5px -1.5px 2px rgba(92, 26, 12, 0.7), -1px 2px 3px rgba(0, 0, 0, 0.5)',
                transform:
                  pressedControl === 'action'
                    ? 'scale(0.93) translateY(1px)'
                    : status === 'RUNNING'
                    ? 'scale(0.96) translateY(0.5px)'
                    : 'scale(1)',
                transition:
                  'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 180ms ease, background 220ms ease',
              }}
              aria-label={
                status === 'RUNNING'
                  ? 'Active — Press to Pause (Enter)'
                  : status === 'PAUSED'
                  ? 'Paused — Press to Resume (Enter)'
                  : status === 'COMPLETED'
                  ? 'Completed — Press to Reset (Enter)'
                  : 'Inactive — Press to Start (Enter)'
              }
              title={
                status === 'RUNNING'
                  ? 'Active: Click to Pause'
                  : status === 'PAUSED'
                  ? 'Paused: Click to Resume'
                  : status === 'COMPLETED'
                  ? 'Done: Click to Reset'
                  : 'Inactive: Click to Start'
              }
            >
              <svg width="45" height="45" viewBox="0 0 45 45" fill="none">
                {/* Active Countdown Progress Arc around button rim */}
                <circle
                  cx="22.5"
                  cy="22.5"
                  r="20.6"
                  stroke="#ff9e7d"
                  strokeOpacity={status === 'RUNNING' ? 0.9 : status === 'PAUSED' ? 0.45 : 0}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 20.6}
                  strokeDashoffset={
                    status === 'IDLE'
                      ? 2 * Math.PI * 20.6
                      : 2 * Math.PI * 20.6 * (1 - progressRatio)
                  }
                  style={{
                    transformOrigin: '22.5px 22.5px',
                    transform: 'rotate(-90deg)',
                    transition:
                      'stroke-dashoffset 450ms linear, stroke-opacity 240ms ease',
                  }}
                />
                {/* Outer Engraved Dotted Ring */}
                <circle
                  cx="22.5"
                  cy="22.5"
                  r="17.2"
                  stroke="#5c2112"
                  strokeOpacity={status === 'RUNNING' ? 0.75 : 0.55}
                  strokeWidth="1.1"
                  strokeDasharray="1.1 1.65"
                  style={{
                    transformOrigin: '22.5px 22.5px',
                    transform: `rotate(${
                      status === 'IDLE' ? 0 : Math.round(progressRatio * 360) + 90
                    }deg)`,
                    transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
                <circle
                  cx="22.5"
                  cy="22.5"
                  r="16.1"
                  stroke="#923119"
                  strokeOpacity="0.35"
                  strokeWidth="0.7"
                  strokeDasharray="1 1.8"
                />
                {/* Morphing Button Icon: Checkmark (IDLE) -> Pause Bars (RUNNING) -> Play (PAUSED) -> Reset (COMPLETED) */}
                {status === 'IDLE' && (
                  <path
                    d="M16.3 23.8L20.1 27.8L27.9 16.6"
                    stroke="#241c19"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {status === 'RUNNING' && (
                  <g>
                    <rect x="18.2" y="16.8" width="2.8" height="11.4" rx="1.1" fill="#241c19" />
                    <rect x="24.0" y="16.8" width="2.8" height="11.4" rx="1.1" fill="#241c19" />
                  </g>
                )}
                {status === 'PAUSED' && (
                  <path
                    d="M19.2 16.5L28.6 22.5L19.2 28.5Z"
                    fill="#241c19"
                    stroke="#241c19"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                )}
                {status === 'COMPLETED' && (
                  <path
                    d="M27.5 22.5A5.5 5.5 0 1 1 25.8 18.5M26.5 16.2V19.4H23.3"
                    stroke="#241c19"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Bottom-Right Engraved Katakana Label: マスター (x=[335, 379], y=[391, 401] -> left=285px, top=344px) */}
          <svg
            className="absolute left-[285px] top-[344px] w-[45px] h-[11px] z-[3]"
            viewBox="0 0 45 11"
            fill="none"
            aria-label="マスター (Master)"
          >
            <path
              d="M1.2 2.2H10.2L6.2 6.6M3.6 5.2C4.9 6.2 6.3 7.5 7.2 8.7"
              stroke="#231f1d"
              strokeWidth="1.65"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <path
              d="M13.5 2.2H20.8C19.6 5.1 16.8 7.7 13.2 9.2M17.8 5.7C19.4 6.8 21.0 8.1 22.1 9.2"
              stroke="#231f1d"
              strokeWidth="1.65"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <path
              d="M27.8 1.2C27.1 2.9 25.8 4.4 24.4 5.4M27.3 2.5H32.6C31.9 5.6 29.5 8.2 26.0 9.5M27.2 4.8C28.4 5.5 29.6 6.4 30.4 7.2"
              stroke="#231f1d"
              strokeWidth="1.65"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <line
              x1="35.2"
              y1="5.2"
              x2="43.8"
              y2="5.2"
              stroke="#231f1d"
              strokeWidth="1.75"
              strokeLinecap="square"
            />
          </svg>
        </div>

      </main>
    </div>
  );
}