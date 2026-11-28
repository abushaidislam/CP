import type React from "react";
import type { AiChatRole } from "@/lib/store/studio-store";
import type { AiDepthMode, RegistryReferenceMode } from "@/lib/ai/types";
import {
  Brain,
  Code2,
  Compass,
  Cpu,
  EyeOff,
  Gauge,
  Image,
  Layers,
  Palette,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export interface AiModelOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AiRoleOption {
  id: AiChatRole;
  name: string;
  tag: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AiDepthOption {
  id: AiDepthMode;
  name: string;
  tag: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface RegistryRefModeOption {
  id: RegistryReferenceMode;
  name: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const MODEL_OPTIONS: AiModelOption[] = [
  {
    id: "gemini-4-hydrogen",
    name: "Gemini 4 Hydrogen",
    tag: "Standard",
    description: "Best balance for multimodal visual references, TypeScript architecture, and UI craft.",
    icon: Cpu,
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    tag: "Deep Reasoning",
    description: "Extended reasoning for intricate state machines, choreography, and edge cases.",
    icon: Layers,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    tag: "Fast Lite",
    description: "Low-latency turnaround for quick questions and targeted CSS tweaks.",
    icon: Gauge,
  },
];

export const ROLE_OPTIONS: AiRoleOption[] = [
  {
    id: "copilot",
    name: "Co-Pilot",
    tag: "All-Rounder",
    description: "Full-stack React 19, Tailwind v4, and Framer Motion component engineer.",
    icon: Code2,
  },
  {
    id: "designer",
    name: "UI Designer",
    tag: "Visual Craft",
    description: "Gallery-grade visual hierarchy, calibrated dark/light tokens, and registry-inspired craft.",
    icon: Palette,
  },
  {
    id: "architect",
    name: "Code Architect",
    tag: "Clean AST",
    description: "Composable subcomponents, strict TypeScript generics, and hook performance.",
    icon: Compass,
  },
  {
    id: "auditor",
    name: "Standards Auditor",
    tag: "21st.dev & A11y",
    description: "Strict 21st.dev compliance, WCAG AA contrast, ARIA roles, and keyboard nav.",
    icon: ShieldCheck,
  },
  {
    id: "optimizer",
    name: "Motion Engineer",
    tag: "60fps Springs",
    description: "Natural Framer Motion spring physics, layoutId transitions, and gesture polish.",
    icon: Zap,
  },
];

export const DEPTH_OPTIONS: AiDepthOption[] = [
  {
    id: "deep",
    name: "Deep Architecture",
    tag: "Detailed",
    description: "High-depth reasoning, structured blueprint, native demo controls & compile self-repair.",
    icon: Brain,
  },
  {
    id: "standard",
    name: "Standard Fast",
    tag: "Concise",
    description: "Faster single-pass synthesis for focused tweaks and quick questions.",
    icon: Zap,
  },
];

export const REGISTRY_REF_MODE_OPTIONS: RegistryRefModeOption[] = [
  {
    id: "auto",
    name: "Smart Selective",
    shortLabel: "Auto Refs",
    description: "Occasionally pulls matching registry preview images when designing or elevating UI; skips them for pure bugfixes.",
    icon: Sparkles,
  },
  {
    id: "always",
    name: "Always Ground",
    shortLabel: "Always Refs",
    description: "Always injects top matching registry component preview images and style patterns.",
    icon: Image,
  },
  {
    id: "off",
    name: "Disabled",
    shortLabel: "No Refs",
    description: "Works strictly from the current editor files without consulting registry designs.",
    icon: EyeOff,
  },
];
