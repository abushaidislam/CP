import React from 'react';

export interface CursorDubPdLogoProps extends React.SVGProps<SVGSVGElement> {
  /** Logo-r width ebong height (pixels ba CSS units) */
  size?: number | string;
  /** Custom Tailwind CSS classes */
  className?: string;
  /** Film grain ebong noise intensity (0.0 theke 1.0) */
  noiseIntensity?: number;
  /** Lettermark-er layer blur intensity */
  blurAmount?: number;
}

export const PdLogo: React.FC<CursorDubPdLogoProps> = ({
  size = 512,
  className = '',
  noiseIntensity = 0.18,
  blurAmount = 4.5,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none transition-all duration-300 hover:scale-[1.012] ${className}`}
      {...props}
    >
      <defs>
        {/* Monochromatic Tactile Micro-Noise Texture (Cursor & Dub aesthetic) */}
        <filter id="pd-tactile-noise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            stitchTiles="stitch"
            result="noiseGrain"
          />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 1
                    0 1 0 0 1
                    0 0 1 0 1
                    0 0 0 1 0"
            in="noiseGrain"
            result="monoGrain"
          />
        </filter>

        {/* Studio Precision Layer Blur */}
        <filter id="pd-studio-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={blurAmount} result="blur" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 1.08 0"
          />
        </filter>

        {/* Dub-style Deep Ambient Glow */}
        <filter id="pd-glow-bloom" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="28" result="softBloom" />
          <feComponentTransfer in="softBloom">
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
        </filter>

        {/* Minimal Slate Matte Canvas Gradient */}
        <radialGradient
          id="pd-surface-matte"
          cx="50%"
          cy="38%"
          r="75%"
          fx="50%"
          fy="30%"
        >
          <stop offset="0%" stopColor="#121316" />
          <stop offset="55%" stopColor="#0a0b0d" />
          <stop offset="100%" stopColor="#040405" />
        </radialGradient>

        {/* Razor-thin 1px Specular Chamfer Border */}
        <linearGradient id="pd-specular-edge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.18" />
        </linearGradient>

        {/* Inner Bevel Light Sheen */}
        <linearGradient id="pd-glass-glare" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
        </linearGradient>

        {/* Ultra-precise Continuous Squircle Cut */}
        <clipPath id="pd-squircle-frame">
          <rect width="1000" height="1000" rx="210" ry="210" />
        </clipPath>
      </defs>

      {/* Main Base Card with Deep Matte Tone */}
      <rect
        width="1000"
        height="1000"
        rx="210"
        ry="210"
        fill="url(#pd-surface-matte)"
      />

      {/* Clipped Container */}
      <g clipPath="url(#pd-squircle-frame)">
        {/* Subtle Specular Top Sheen */}
        <rect width="1000" height="1000" fill="url(#pd-glass-glare)" pointerEvents="none" />

        {/* Ambient Backlight Bloom */}
        <g filter="url(#pd-glow-bloom)" opacity="0.5">
          {/* Stem of 'p' */}
          <rect x="52" y="246" width="94" height="760" fill="#ffffff" />
          {/* Bowl of 'p' */}
          <path
            d="M 144 550 C 144 380 216 260 310 260 C 404 260 480 380 480 550 C 480 720 404 840 310 840 C 216 840 144 720 144 550 Z"
            stroke="#ffffff"
            strokeWidth="94"
            fill="none"
            strokeLinejoin="round"
          />
          {/* Stem of 'd' */}
          <rect x="854" y="0" width="94" height="750" fill="#ffffff" />
          {/* Bowl of 'd' */}
          <path
            d="M 520 430 C 520 260 596 140 690 140 C 784 140 856 260 856 430 C 856 600 784 720 690 720 C 596 720 520 600 520 430 Z"
            stroke="#ffffff"
            strokeWidth="94"
            fill="none"
            strokeLinejoin="round"
          />
        </g>

        {/* Core Geometry with Soft Layer Blur */}
        <g filter="url(#pd-studio-blur)" opacity="0.96">
          <rect x="52" y="246" width="94" height="760" fill="#ffffff" />
          <path
            d="M 144 550 C 144 380 216 260 310 260 C 404 260 480 380 480 550 C 480 720 404 840 310 840 C 216 840 144 720 144 550 Z"
            stroke="#ffffff"
            strokeWidth="94"
            fill="none"
            strokeLinejoin="round"
          />
          <rect x="854" y="0" width="94" height="750" fill="#ffffff" />
          <path
            d="M 520 430 C 520 260 596 140 690 140 C 784 140 856 260 856 430 C 856 600 784 720 690 720 C 596 720 520 600 520 430 Z"
            stroke="#ffffff"
            strokeWidth="94"
            fill="none"
            strokeLinejoin="round"
          />
        </g>

        {/* Monochromatic Grain / Noise Layer (Cursor/Dub Vibe) */}
        <rect
          width="1000"
          height="1000"
          filter="url(#pd-tactile-noise)"
          opacity={noiseIntensity}
          style={{ mixBlendMode: 'overlay' }}
          pointerEvents="none"
        />

        {/* Inner 1px Hairline Accent */}
        <rect
          width="996"
          height="996"
          x="2"
          y="2"
          rx="208"
          ry="208"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1.5"
          pointerEvents="none"
        />
      </g>

      {/* External 1px Specular Border */}
      <rect
        width="998"
        height="998"
        x="1"
        y="1"
        rx="209"
        ry="209"
        fill="none"
        stroke="url(#pd-specular-edge)"
        strokeWidth="1.8"
        pointerEvents="none"
      />
    </svg>
  );
};

export default PdLogo;