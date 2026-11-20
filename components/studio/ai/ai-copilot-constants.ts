import type React from "react";
import type { AiChatRole } from "@/lib/store/studio-store";
import {
  Code2,
  Compass,
  Cpu,
  Gauge,
  Layers,
  Palette,
  ShieldCheck,
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

export const MODEL_OPTIONS: AiModelOption[] = [
  {
    id: "gemini-4-hydrogen",
    name: "Gemini 4 Hydrogen",
    tag: "Standard",
    description: "Best for component design, TypeScript architecture, and fast edits.",
    icon: Cpu,
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    tag: "Deep Reasoning",
    description: "Advanced reasoning for complex state, algorithms, and tricky edge-cases.",
    icon: Layers,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    tag: "Fast Lite",
    description: "Instant turnaround for quick questions and straightforward CSS edits.",
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
    description: "Bespoke visual hierarchy, refined dark/light tokens, and micro-interactions.",
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
