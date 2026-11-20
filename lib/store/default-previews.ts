import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import type {
  ComponentVariant,
  StudioFiles,
  StudioState,
  UserComponent,
} from "./types";

export function createSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const DEFAULT_TEMPLATE_PREVIEWS: Record<string, string> = {
  "ink-orbit-hero": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="io-bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </radialGradient>
    <linearGradient id="io-orbit-1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <linearGradient id="io-orbit-2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <filter id="io-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="url(#io-bg)"/>
  <path d="M0 112.5 H400 M200 0 V225" stroke="#27272a" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.6"/>
  <g transform="translate(28, 52)">
    <rect width="76" height="14" rx="7" fill="#27272a" stroke="#3f3f46" stroke-width="0.8"/>
    <circle cx="10" cy="7" r="2.5" fill="#38bdf8"/>
    <rect x="18" y="4.5" width="48" height="5" rx="2.5" fill="#a1a1aa"/>
    <rect x="0" y="24" width="130" height="14" rx="3" fill="#f4f4f5"/>
    <rect x="0" y="44" width="105" height="14" rx="3" fill="#a1a1aa"/>
    <rect x="0" y="68" width="140" height="5" rx="2.5" fill="#71717a"/>
    <rect x="0" y="78" width="115" height="5" rx="2.5" fill="#52525b"/>
    <rect x="0" y="96" width="68" height="22" rx="4" fill="#fafafa"/>
    <rect x="14" y="104" width="40" height="6" rx="3" fill="#18181b"/>
    <rect x="76" y="96" width="64" height="22" rx="4" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
    <rect x="90" y="104" width="36" height="6" rx="3" fill="#a1a1aa"/>
  </g>
  <g transform="translate(285, 112.5)">
    <circle cx="0" cy="0" r="28" fill="#18181b" stroke="#3f3f46" stroke-width="1.2" opacity="0.85"/>
    <circle cx="-6" cy="-6" r="10" fill="#ffffff" opacity="0.12"/>
    <circle cx="0" cy="0" r="6" fill="#38bdf8" filter="url(#io-glow)" opacity="0.9"/>
    <ellipse cx="0" cy="0" rx="68" ry="24" stroke="url(#io-orbit-1)" stroke-width="2.2" transform="rotate(-28)" fill="none" opacity="0.95" filter="url(#io-glow)"/>
    <ellipse cx="0" cy="0" rx="54" ry="18" stroke="url(#io-orbit-2)" stroke-width="1.8" transform="rotate(42)" fill="none" opacity="0.85"/>
    <ellipse cx="0" cy="0" rx="76" ry="32" stroke="#6366f1" stroke-width="1" stroke-dasharray="3 3" transform="rotate(12)" fill="none" opacity="0.5"/>
    <circle cx="48" cy="-22" r="4.5" fill="#38bdf8" filter="url(#io-glow)"/>
    <circle cx="-38" cy="24" r="3.5" fill="#c084fc" filter="url(#io-glow)"/>
    <circle cx="20" cy="30" r="2.5" fill="#34d399"/>
    <circle cx="-45" cy="-16" r="2" fill="#fafafa"/>
  </g>
</svg>`
  ),
  "aurora-ambient-hero": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="aah-bg" cx="50%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#1e1035"/>
      <stop offset="60%" stop-color="#0c0714"/>
      <stop offset="100%" stop-color="#050308"/>
    </radialGradient>
    <radialGradient id="aah-aurora-1" cx="35%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#c084fc" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="aah-aurora-2" cx="70%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.8"/>
      <stop offset="55%" stop-color="#3b82f6" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="aah-title-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c7d2fe"/>
      <stop offset="40%" stop-color="#e0e7ff"/>
      <stop offset="70%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
    <linearGradient id="aah-btn-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <filter id="aah-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="url(#aah-bg)"/>
  <circle cx="150" cy="80" r="110" fill="url(#aah-aurora-1)" filter="url(#aah-glow)" opacity="0.7"/>
  <circle cx="280" cy="95" r="95" fill="url(#aah-aurora-2)" filter="url(#aah-glow)" opacity="0.65"/>
  <path d="M0 75 H400 M0 150 H400 M100 0 V225 M200 0 V225 M300 0 V225" stroke="#312e81" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.35"/>
  <g transform="translate(142, 28)">
    <rect width="116" height="18" rx="9" fill="#1e1b4b" stroke="#818cf8" stroke-width="1"/>
    <circle cx="12" cy="9" r="3" fill="#a855f7"/>
    <rect x="22" y="6.5" width="76" height="5" rx="2.5" fill="#e0e7ff"/>
    <circle cx="104" cy="9" r="2" fill="#38bdf8"/>
  </g>
  <rect x="65" y="58" width="270" height="16" rx="4" fill="#ffffff" opacity="0.95"/>
  <rect x="100" y="80" width="200" height="14" rx="4" fill="url(#aah-title-grad)"/>
  <rect x="90" y="104" width="220" height="6" rx="3" fill="#94a3b8" opacity="0.8"/>
  <rect x="125" y="115" width="150" height="5" rx="2.5" fill="#64748b" opacity="0.7"/>
  <g transform="translate(115, 134)">
    <rect width="95" height="26" rx="8" fill="url(#aah-btn-grad)"/>
    <rect x="18" y="10" width="58" height="6" rx="3" fill="#ffffff"/>
    <path d="M82 13 L86 13 M84 11 L86 13 L84 15" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <g transform="translate(220, 134)">
    <rect width="68" height="26" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
    <polygon points="12,9 12,17 19,13" fill="#a1a1aa"/>
    <rect x="26" y="10" width="30" height="6" rx="3" fill="#d4d4d8"/>
  </g>
  <g transform="translate(60, 178)">
    <rect width="80" height="26" rx="6" fill="#130e26" stroke="#2e1065" stroke-width="0.8"/>
    <circle cx="14" cy="13" r="3" fill="#10b981"/>
    <rect x="24" y="10" width="46" height="5.5" rx="2" fill="#c7d2fe"/>
  </g>
  <g transform="translate(160, 178)">
    <rect width="80" height="26" rx="6" fill="#130e26" stroke="#2e1065" stroke-width="0.8"/>
    <circle cx="14" cy="13" r="3" fill="#38bdf8"/>
    <rect x="24" y="10" width="46" height="5.5" rx="2" fill="#c7d2fe"/>
  </g>
  <g transform="translate(260, 178)">
    <rect width="80" height="26" rx="6" fill="#130e26" stroke="#2e1065" stroke-width="0.8"/>
    <circle cx="14" cy="13" r="3" fill="#f472b6"/>
    <rect x="24" y="10" width="46" height="5.5" rx="2" fill="#c7d2fe"/>
  </g>
</svg>`
  ),
  "spotlight-card": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="sc-spotlight" cx="50%" cy="15%" r="65%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#3b82f6" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sc-card-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.8"/>
      <stop offset="40%" stop-color="#3b82f6" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="sc-card-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#0f1115"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="#09090b"/>
  <circle cx="200" cy="50" r="160" fill="url(#sc-spotlight)"/>
  <g transform="translate(100, 32)">
    <rect width="200" height="160" rx="14" fill="url(#sc-card-bg)" stroke="url(#sc-card-border)" stroke-width="1.5"/>
    <rect x="22" y="22" width="34" height="34" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.2"/>
    <path d="M33 39 L39 33 L45 39 M39 34 V45" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="136" y="24" width="42" height="16" rx="8" fill="#1e3a5f" stroke="#2563eb" stroke-width="0.8"/>
    <circle cx="144" cy="32" r="2.5" fill="#60a5fa"/>
    <rect x="151" y="29.5" width="20" height="5" rx="2.5" fill="#93c5fd"/>
    <rect x="22" y="70" width="110" height="12" rx="3" fill="#f4f4f5"/>
    <rect x="22" y="90" width="156" height="5" rx="2.5" fill="#71717a"/>
    <rect x="22" y="100" width="130" height="5" rx="2.5" fill="#52525b"/>
    <rect x="22" y="120" width="156" height="24" rx="6" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
    <rect x="74" y="129" width="52" height="6" rx="3" fill="#e4e4e7"/>
  </g>
</svg>`
  ),
  "bento-metric-grid": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="bmg-bg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#0e1726"/>
      <stop offset="100%" stop-color="#040810"/>
    </radialGradient>
    <linearGradient id="bmg-card-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="bmg-spark-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <linearGradient id="bmg-spark-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="url(#bmg-bg)"/>
  <g transform="translate(45, 18)">
    <rect width="310" height="188" rx="14" fill="#0b1120" stroke="url(#bmg-card-border)" stroke-width="1.4"/>
    <circle cx="22" cy="22" r="3.5" fill="#10b981"/>
    <rect x="32" y="18.5" width="85" height="7" rx="3.5" fill="#34d399"/>
    <rect x="238" y="14" width="56" height="16" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.8"/>
    <rect x="248" y="19" width="36" height="6" rx="3" fill="#94a3b8"/>
    <line x1="16" y1="36" x2="294" y2="36" stroke="#1e293b" stroke-width="1"/>
    <g transform="translate(16, 46)">
      <rect width="134" height="62" rx="9" fill="#111c33" stroke="#3b82f6" stroke-width="1"/>
      <rect x="10" y="8" width="54" height="5" rx="2.5" fill="#93c5fd"/>
      <rect x="10" y="20" width="46" height="12" rx="3" fill="#f8fafc"/>
      <rect x="86" y="8" width="38" height="12" rx="6" fill="#064e3b"/>
      <rect x="92" y="12" width="26" height="4" rx="2" fill="#34d399"/>
      <path d="M12 50 L34 46 L58 52 L84 41 L108 43 L122 36" fill="none" stroke="url(#bmg-spark-cyan)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(160, 46)">
      <rect width="134" height="62" rx="9" fill="#0f1f2e" stroke="#059669" stroke-width="1"/>
      <rect x="10" y="8" width="58" height="5" rx="2.5" fill="#6ee7b7"/>
      <rect x="10" y="20" width="52" height="12" rx="3" fill="#f8fafc"/>
      <rect x="86" y="8" width="38" height="12" rx="6" fill="#064e3b"/>
      <rect x="92" y="12" width="26" height="4" rx="2" fill="#34d399"/>
      <path d="M12 52 L36 48 L60 42 L82 38 L104 32 L122 28" fill="none" stroke="url(#bmg-spark-emerald)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(16, 116)">
      <rect width="134" height="60" rx="9" fill="#161b2e" stroke="#334155" stroke-width="0.9"/>
      <rect x="10" y="8" width="48" height="5" rx="2.5" fill="#94a3b8"/>
      <rect x="10" y="20" width="40" height="12" rx="3" fill="#f1f5f9"/>
      <rect x="88" y="8" width="36" height="12" rx="6" fill="#451a03"/>
      <rect x="94" y="12" width="24" height="4" rx="2" fill="#fb923c"/>
      <path d="M12 48 L38 45 L62 48 L86 42 L110 44 L122 41" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(160, 116)">
      <rect width="134" height="60" rx="9" fill="#151b36" stroke="#4f46e5" stroke-width="1"/>
      <rect x="10" y="8" width="52" height="5" rx="2.5" fill="#a5b4fc"/>
      <rect x="10" y="20" width="52" height="12" rx="3" fill="#f8fafc"/>
      <rect x="88" y="8" width="36" height="12" rx="6" fill="#1e1b4b"/>
      <rect x="94" y="12" width="24" height="4" rx="2" fill="#818cf8"/>
      <path d="M12 50 L36 44 L62 38 L88 35 L108 30 L122 26" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
</svg>`
  ),
  "shimmer-button": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <linearGradient id="sb-aurora" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="30%" stop-color="#818cf8"/>
      <stop offset="70%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
    <linearGradient id="sb-btn-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="sb-shimmer-beam" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="sb-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="sb-clip">
      <rect width="190" height="50" rx="25"/>
    </clipPath>
  </defs>
  <rect width="400" height="225" fill="#090a0f"/>
  <ellipse cx="200" cy="112.5" rx="130" ry="36" fill="url(#sb-aurora)" opacity="0.3" filter="url(#sb-glow)"/>
  <g transform="translate(105, 87)">
    <rect width="190" height="50" rx="25" fill="url(#sb-btn-bg)" stroke="url(#sb-aurora)" stroke-width="2"/>
    <g clip-path="url(#sb-clip)">
      <rect x="50" y="-10" width="45" height="70" fill="url(#sb-shimmer-beam)" transform="skewX(-24)"/>
    </g>
    <path d="M42 25 L44 20 L49 22 L45 26 L47 31 L42 28 L37 31 L39 26 L35 22 L40 20 Z" fill="#38bdf8" opacity="0.9"/>
    <rect x="58" y="21" width="84" height="8" rx="4" fill="#f8fafc"/>
    <path d="M152 22 L157 25 L152 28" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`
  ),
  "neon-glow-button": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="ngb-bg" cx="50%" cy="50%" r="80%">
      <stop offset="0%" stop-color="#0a1226"/>
      <stop offset="60%" stop-color="#050811"/>
      <stop offset="100%" stop-color="#020408"/>
    </radialGradient>
    <radialGradient id="ngb-ambient-cyan" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#06b6d4" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ngb-ambient-pink" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ngb-btn-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="50%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="ngb-inner-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#083344"/>
      <stop offset="100%" stop-color="#041620"/>
    </linearGradient>
    <filter id="ngb-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="url(#ngb-bg)"/>
  <ellipse cx="200" cy="112.5" rx="140" ry="60" fill="url(#ngb-ambient-cyan)" filter="url(#ngb-glow)"/>
  <ellipse cx="200" cy="112.5" rx="90" ry="40" fill="url(#ngb-ambient-pink)" filter="url(#ngb-glow)"/>
  <rect x="80" y="70" width="240" height="85" rx="20" stroke="#06b6d4" stroke-width="0.8" opacity="0.3"/>
  <rect x="65" y="55" width="270" height="115" rx="26" stroke="#22d3ee" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.2"/>
  <g transform="translate(100, 86)">
    <rect width="200" height="52" rx="14" fill="url(#ngb-inner-bg)" stroke="url(#ngb-btn-border)" stroke-width="2" filter="url(#ngb-glow)"/>
    <circle cx="8" cy="8" r="1.5" fill="#22d3ee"/>
    <circle cx="192" cy="44" r="1.5" fill="#22d3ee"/>
    <circle cx="34" cy="26" r="3.5" fill="#22d3ee" filter="url(#ngb-glow)"/>
    <path d="M52 26 L58 17 L56 25 L63 25 L54 35 L56 27 Z" fill="#67e8f9" filter="url(#ngb-glow)"/>
    <rect x="74" y="21" width="94" height="10" rx="5" fill="#e0f2fe"/>
  </g>
</svg>`
  ),
  "metric-badge": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="mb-radar-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mb-pill-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0b0f19"/>
    </linearGradient>
    <filter id="mb-dot-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="#080c10"/>
  <circle cx="200" cy="112.5" r="90" stroke="#1f2937" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.5"/>
  <circle cx="200" cy="112.5" r="60" stroke="#1f2937" stroke-width="0.75" opacity="0.4"/>
  <circle cx="200" cy="112.5" r="30" stroke="#1f2937" stroke-width="0.75" opacity="0.3"/>
  <g transform="translate(95, 92)">
    <rect width="210" height="42" rx="21" fill="url(#mb-pill-bg)" stroke="#1f2937" stroke-width="1.2"/>
    <circle cx="24" cy="21" r="10" stroke="#10b981" stroke-width="1" opacity="0.35"/>
    <circle cx="24" cy="21" r="15" fill="url(#mb-radar-glow)"/>
    <circle cx="24" cy="21" r="4.5" fill="#10b981" filter="url(#mb-dot-glow)"/>
    <rect x="44" y="14" width="70" height="6.5" rx="3.25" fill="#f3f4f6"/>
    <rect x="44" y="23.5" width="46" height="4.5" rx="2.25" fill="#9ca3af"/>
    <line x1="124" y1="12" x2="124" y2="30" stroke="#374151" stroke-width="1"/>
    <path d="M136 24 L144 24 L149 14 L154 28 L159 18 L164 24 L172 24" fill="none" stroke="#10b981" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="178" y="13" width="22" height="15" rx="4" fill="#064e3b" stroke="#059669" stroke-width="0.75"/>
    <rect x="182" y="18" width="14" height="5" rx="2" fill="#a7f3d0"/>
  </g>
</svg>`
  ),
  "live-ping-status-pill": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="lpp-bg" cx="50%" cy="50%" r="80%">
      <stop offset="0%" stop-color="#041a14"/>
      <stop offset="60%" stop-color="#020d0a"/>
      <stop offset="100%" stop-color="#010604"/>
    </radialGradient>
    <radialGradient id="lpp-beacon-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lpp-pill-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="lpp-pill-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#022c22" stop-opacity="0.8"/>
    </linearGradient>
    <filter id="lpp-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="url(#lpp-bg)"/>
  <circle cx="200" cy="112.5" r="95" stroke="#065f46" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.4"/>
  <circle cx="200" cy="112.5" r="70" stroke="#059669" stroke-width="0.8" opacity="0.45"/>
  <circle cx="200" cy="112.5" r="45" stroke="#10b981" stroke-width="1" opacity="0.5"/>
  <circle cx="200" cy="112.5" r="25" fill="url(#lpp-beacon-glow)"/>
  <g transform="translate(85, 90)">
    <rect width="230" height="45" rx="22.5" fill="url(#lpp-pill-bg)" stroke="url(#lpp-pill-border)" stroke-width="1.6" filter="url(#lpp-glow)"/>
    <circle cx="24" cy="22.5" r="9" stroke="#34d399" stroke-width="1" opacity="0.6"/>
    <circle cx="24" cy="22.5" r="4.5" fill="#34d399" filter="url(#lpp-glow)"/>
    <rect x="42" y="16.5" width="56" height="12" rx="4" fill="#ecfdf5"/>
    <line x1="108" y1="14" x2="108" y2="31" stroke="#065f46" stroke-width="1.2"/>
    <path d="M120 17 L126 14 L132 17 L132 23 C132 27 126 29 126 29 C126 29 120 27 120 23 Z" fill="#10b981" opacity="0.9"/>
    <rect x="138" y="17" width="34" height="10" rx="3" fill="#6ee7b7"/>
    <line x1="182" y1="14" x2="182" y2="31" stroke="#065f46" stroke-width="1.2"/>
    <rect x="192" y="18" width="24" height="9" rx="3" fill="#a7f3d0"/>
  </g>
</svg>`
  ),
  "blank": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <pattern id="bl-grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e222a" stroke-width="0.75"/>
    </pattern>
    <linearGradient id="bl-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="#0d1117"/>
  <rect width="400" height="225" fill="url(#bl-grid)"/>
  <g transform="translate(80, 36)">
    <rect width="240" height="152" rx="10" fill="#161b22" fill-opacity="0.7" stroke="url(#bl-border)" stroke-width="1.5" stroke-dasharray="6 4"/>
    <path d="M-6 0 H6 M0 -6 V6" stroke="#60a5fa" stroke-width="1.5"/>
    <path d="M234 0 H246 M240 -6 V6" stroke="#60a5fa" stroke-width="1.5"/>
    <path d="M-6 152 H6 M0 146 V158" stroke="#60a5fa" stroke-width="1.5"/>
    <path d="M234 152 H246 M240 146 V158" stroke="#60a5fa" stroke-width="1.5"/>
    <rect x="96" y="44" width="48" height="40" rx="8" fill="#1f2937" stroke="#374151" stroke-width="1"/>
    <path d="M112 59 L107 64 L112 69" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M128 59 L133 64 L128 69" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M122 57 L118 71" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="76" y="96" width="88" height="8" rx="4" fill="#e2e8f0"/>
    <rect x="92" y="110" width="56" height="5" rx="2.5" fill="#64748b"/>
  </g>
</svg>`
  ),
};

export function createInitialUserComponents(): Record<string, UserComponent> {
  const map: Record<string, UserComponent> = {};
  for (const tmpl of DEFAULT_TEMPLATES) {
    map[tmpl.id] = {
      id: tmpl.id,
      name: tmpl.name,
      description: tmpl.description,
      category: tmpl.category,
      isBuiltIn: true,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      files: {
        "component.tsx": tmpl.files["component.tsx"],
        "default.tsx": tmpl.files["default.tsx"] ?? tmpl.files["demo.tsx"] ?? "",
        "demo.tsx": tmpl.files["demo.tsx"] ?? tmpl.files["default.tsx"] ?? "",
        "index.css": tmpl.files["index.css"],
      },
      dependencies: [...tmpl.dependencies],
      previewImage: DEFAULT_TEMPLATE_PREVIEWS[tmpl.id] || DEFAULT_TEMPLATE_PREVIEWS["blank"],
    };
  }
  return map;
}

export const createDefaultVariant = (
  templateId: string,
  files: StudioState["files"],
  dependencies: string[]
): ComponentVariant => ({
  id: `var-default-${templateId}`,
  name: "Default",
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  files: {
    "component.tsx": files["component.tsx"],
    "default.tsx": files["default.tsx"] ?? files["demo.tsx"] ?? "",
    "demo.tsx": files["demo.tsx"] ?? files["default.tsx"] ?? "",
    "index.css": files["index.css"],
  },
  dependencies: [...dependencies],
  checkpoints: [],
});

export function syncVariantWithWorking(
  variantsByTemplate: Record<string, ComponentVariant[]> | undefined,
  activeVariantByTemplate: Record<string, string> | undefined,
  templateId: string,
  files: StudioState["files"],
  dependencies: string[]
): {
  variantsByTemplate: Record<string, ComponentVariant[]>;
  activeVariantByTemplate: Record<string, string>;
} {
  const currentVariants = variantsByTemplate?.[templateId]
    ? [...variantsByTemplate[templateId]]
    : [];
  let activeId = activeVariantByTemplate?.[templateId];

  let updatedVariants: ComponentVariant[];
  if (currentVariants.length === 0) {
    const defVar = createDefaultVariant(templateId, files, dependencies);
    activeId = defVar.id;
    updatedVariants = [defVar];
  } else {
    if (!activeId || !currentVariants.some((v) => v.id === activeId)) {
      activeId = currentVariants[0].id;
    }
    updatedVariants = currentVariants.map((v) =>
      v.id === activeId
        ? {
            ...v,
            files: { ...files },
            dependencies: [...dependencies],
            updatedAt: Date.now(),
          }
        : v
    );
  }

  return {
    variantsByTemplate: {
      ...(variantsByTemplate || {}),
      [templateId]: updatedVariants,
    },
    activeVariantByTemplate: {
      ...(activeVariantByTemplate || {}),
      [templateId]: activeId,
    },
  };
}

export function normalizeStudioFiles(
  files?: Partial<StudioFiles> | null
): StudioFiles {
  const demoCode = files?.["default.tsx"] ?? files?.["demo.tsx"] ?? "";
  return {
    "component.tsx": files?.["component.tsx"] ?? "",
    "default.tsx": demoCode,
    "demo.tsx": files?.["demo.tsx"] ?? files?.["default.tsx"] ?? "",
    "index.css":
      files?.["index.css"] ??
      "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
  };
}
