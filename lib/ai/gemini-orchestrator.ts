import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import {
  COPILOT_PREMIUM_DESIGN_MANIFESTO,
  COPILOT_UI_PRESERVATION_SKILL,
} from "@/lib/sandbox/copilot-design-knowledge";
import { classifyAiIntent } from "./intent-router";
import {
  retrieveRegistryReferences,
  type LoadedRegistryReference,
} from "./registry-reference-retriever";
import {
  analyzeWorkspaceDossier,
  verifyGeneratedWorkspace,
  verifyTsxCompilation,
} from "./workspace-analyzer";
import type {
  AiAssistantRequestBody,
  AiBlueprintPlan,
  AiDepthMode,
  AiReasoningStepCategory,
  AiReasoningStepPayload,
  AiVerificationReport,
  RegistryReferenceDecision,
  RegistryReferenceMode,
  RegistryReferenceSummary,
} from "./types";
import type { GuidelineCheckItem } from "@/lib/sandbox/guideline-linter";

let cachedGeminiClient: { apiKey: string; client: GoogleGenAI } | null = null;

function getGeminiClient(apiKey: string): GoogleGenAI {
  if (cachedGeminiClient && cachedGeminiClient.apiKey === apiKey) {
    return cachedGeminiClient.client;
  }
  const client = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  cachedGeminiClient = { apiKey, client };
  return client;
}

const VALID_MODELS = [
  "gemini-4-hydrogen",
  "gemini-4-argon",
  "gemini-3.1-flash-lite",
];

const ROLE_INSTRUCTIONS: Record<string, string> = {
  copilot: `ACTIVE SPECIALIST ROLE: Principal Component Studio Co-Pilot.
Operate as a staff design-systems engineer. Balance airtight React 19 + TypeScript architecture, Tailwind CSS craft, responsive geometry, WCAG accessibility, and natural Framer Motion spring physics.`,
  designer: `ACTIVE SPECIALIST ROLE: Principal UI & Visual Design Director.
Focus on distinctive, gallery-grade visual craft, calibrated surface contrast in dark & light modes, subtle 1px hairline borders, crisp typographic hierarchy, concentric corner radii, optical balance, and deliberate spatial rhythm. You are explicitly authorized to elevate visual styling and aesthetics.`,
  architect: `ACTIVE SPECIALIST ROLE: Staff React & TypeScript Architect.
Focus on composable API design, strict discriminated TypeScript Props interfaces, clean custom hooks, controlled/uncontrolled state patterns, ref forwarding, memoized callbacks, and zero wasted re-renders.`,
  auditor: `ACTIVE SPECIALIST ROLE: 21st.dev Standards & WCAG AA Accessibility Auditor.
Focus on 100% 21st.dev compliance, full keyboard navigation (Arrow keys, Home/End, Enter, Space, Escape, Tab), visible focus rings, ARIA roles/states, contrast ratios, and safe cn() className merging.`,
  optimizer: `ACTIVE SPECIALIST ROLE: Motion Physics & Interaction Choreographer.
Focus on tactile Framer Motion spring physics (stiffness, damping, mass), layoutId shared element choreography, AnimatePresence exit states, pointer-reactive micro-interactions, GPU-composited transforms, and prefers-reduced-motion compliance.`,
};

const MASTER_COPILOT_SYSTEM_PROMPT = `You are the Re-Architected Component Studio AI Copilot — an elite Principal Design-Systems Engineer & Visual Craft Director for a live React 19 + TypeScript + Tailwind CSS + Framer Motion component workbench.

PLATFORM FILE CONTRACT:
- "component.tsx": Primary reusable, copy-paste-ready component. Must include '"use client";' at line 1 whenever React hooks, Framer Motion, or DOM event handlers are used. Must export a default component and a typed Props interface accepting optional className merged via cn(...) from "@/lib/utils".
- "default.tsx": Live preview showcase importing from "../components/ui/component". Whenever the component has configurable props, implement the 21st.dev Native Demo Controls contract (\`const settings = { ... }\` flat top-level JSON literals + \`export default function Demo(props: Partial<typeof settings>) { const s = { ...settings, ...props }; ... }\`) so the canvas controls panel works automatically.
- "index.css": Optional custom CSS keyframes, utilities, or variables.

ENGINEERING & DESIGN PRECISION PROTOCOLS:
1. SURGICAL PRESERVATION WHEN UI LOCK IS ACTIVE:
   - When [UI & DESIGN LOCK ON] is active and the user asks for bug fixes, logic changes, refactoring, accessibility, or standards compliance: preserve 100% of the existing colors, spacing, layout, borders, typography, and visual styling.
2. DEEP DESIGN CRAFT WHEN VISUAL WORK IS REQUESTED OR UNLOCKED:
   - When creating a component, restyling, elevating UI, or working in UI Designer mode: craft distinctive, production-grade interfaces with intentional palette discipline (neutral structural surfaces + focused accent), crisp 1px borders, concentric radii, tabular-nums on numeric readouts, balanced whitespace, and responsive containers. Never output generic neon purple/pink AI-slop gradients or placeholder stubs.
3. REGISTRY VISUAL & DESIGN REFERENCE GROUNDING (WHEN PROVIDED):
   - When the system attaches preview images and code patterns from the developer's own Component Studio Registry, study their visual language carefully: surface depth, border opacity, typography scale, spacing density, color restraint, and Framer Motion spring tuning.
   - Synthesize those craft cues organically into your output while building 100% original code specifically tailored to the developer's prompt. Never copy unrelated text, brand names, or boilerplate verbatim from a reference component unless explicitly asked.
4. COMPLETE COMPILABLE OUTPUT:
   - Never emit partial code, ellipses, or "// rest stays unchanged". Every modified file in "changedFiles" must be 100% complete, valid TypeScript/TSX ready to compile in Sucrase and run immediately.

${COPILOT_PREMIUM_DESIGN_MANIFESTO}`;

const COPILOT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    blueprint: {
      type: Type.OBJECT,
      description:
        "Structured architectural and visual design specification explaining the engineering decisions made for this component.",
      properties: {
        architectureNotes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2-4 concrete architectural, state, or TypeScript API decisions.",
        },
        designTokens: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2-4 surface, border, typography, or color token choices.",
        },
        motionStrategy: {
          type: Type.STRING,
          description: "Concise description of spring physics, transitions, or interaction choreography.",
        },
        accessibilityNotes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "1-3 concrete keyboard, focus, ARIA, or contrast safeguards.",
        },
        edgeCasesHandled: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "1-3 edge cases handled (empty states, overflow, responsive widths, reduced motion).",
        },
        referenceTakeaways: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            "If registry reference images/designs were attached, 1-3 specific craft cues inspired by them (empty array if no registry references were provided).",
        },
      },
      required: ["architectureNotes", "designTokens", "accessibilityNotes", "edgeCasesHandled"],
    },
    reasoningSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          detail: { type: Type.STRING },
          category: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["title", "description"],
      },
    },
    reasoningSummary: {
      type: Type.STRING,
      description: "One crisp architectural sentence summarizing the exact execution strategy.",
    },
    message: {
      type: Type.STRING,
      description:
        "Detailed, well-structured Markdown explanation covering key design/engineering decisions, what changed, and how it works (do NOT paste full 200-line file code already inside changedFiles).",
    },
    complianceScore: {
      type: Type.INTEGER,
      description: "Estimated 21st.dev guideline compliance score from 0 to 100.",
    },
    issuesFound: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    issuesFixed: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    addedDependencies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Any external npm package names imported by the updated files.",
    },
    followUpSuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 concise, high-value follow-up prompts (under 8 words each).",
    },
    changedFiles: {
      type: Type.OBJECT,
      properties: {
        "component.tsx": {
          type: Type.STRING,
          nullable: true,
          description: "Complete compilable component.tsx if modified, or null if unchanged.",
        },
        "default.tsx": {
          type: Type.STRING,
          nullable: true,
          description: "Complete compilable default.tsx if modified, or null if unchanged.",
        },
        "index.css": {
          type: Type.STRING,
          nullable: true,
          description: "Complete index.css if modified, or null if unchanged.",
        },
      },
    },
  },
  required: ["message", "reasoningSummary", "blueprint", "changedFiles"],
};

const REPAIR_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    fixNote: { type: Type.STRING },
    changedFiles: {
      type: Type.OBJECT,
      properties: {
        "component.tsx": { type: Type.STRING, nullable: true },
        "default.tsx": { type: Type.STRING, nullable: true },
        "index.css": { type: Type.STRING, nullable: true },
      },
    },
  },
  required: ["fixNote", "changedFiles"],
};

interface ParsedGeminiCopilotOutput {
  blueprint?: AiBlueprintPlan;
  reasoningSteps?: AiReasoningStepPayload[];
  reasoningSummary?: string;
  message?: string;
  complianceScore?: number;
  issuesFound?: string[];
  issuesFixed?: string[];
  addedDependencies?: string[];
  followUpSuggestions?: string[];
  changedFiles?: Partial<Record<string, string | null>>;
}

function normalizeGeminiModel(requestedModel?: string): string {
  if (requestedModel && VALID_MODELS.includes(requestedModel)) {
    return requestedModel;
  }
  const lower = (requestedModel || "").toLowerCase();
  if (lower.includes("argon") || lower.includes("pro")) {
    return "gemini-4-argon";
  }
  if (lower.includes("lite")) {
    return "gemini-3.1-flash-lite";
  }
  return "gemini-4-hydrogen";
}

function buildModelCascade(primaryModel: string): string[] {
  const ordered =
    primaryModel === "gemini-4-argon"
      ? ["gemini-4-argon", "gemini-4-hydrogen", "gemini-3.1-flash-lite"]
      : primaryModel === "gemini-3.1-flash-lite"
      ? ["gemini-3.1-flash-lite", "gemini-4-hydrogen"]
      : ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
  return Array.from(new Set(ordered));
}

function resolveThinkingLevel(
  model: string,
  depthMode: AiDepthMode
): ThinkingLevel | undefined {
  if (model === "gemini-3.1-flash-lite") {
    return depthMode === "deep" ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW;
  }
  if (model === "gemini-4-hydrogen" || model === "gemini-4-argon") {
    return depthMode === "deep" ? ThinkingLevel.HIGH : ThinkingLevel.MEDIUM;
  }
  return undefined;
}

function unescapeJsonStringLiteral(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function extractJsonStringField(source: string, fieldName: string): string | null {
  const escapedKey = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyMatch = new RegExp(`"${escapedKey}"\\s*:\\s*"`).exec(source);
  if (!keyMatch) return null;
  const startIdx = keyMatch.index + keyMatch[0].length;
  let i = startIdx;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === '"') {
      return unescapeJsonStringLiteral(source.slice(startIdx, i));
    }
    i += 1;
  }
  return null;
}

function parseJsonResponseSafely(textOutput: string): ParsedGeminiCopilotOutput {
  const trimmed = (textOutput || "").trim();
  if (!trimmed) {
    return {
      message: "I processed your request, but received an empty response. Please try again.",
      changedFiles: {},
    };
  }

  try {
    return JSON.parse(trimmed) as ParsedGeminiCopilotOutput;
  } catch {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch?.[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim()) as ParsedGeminiCopilotOutput;
      } catch {
        // continue
      }
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as ParsedGeminiCopilotOutput;
      } catch {
        const msgVal = extractJsonStringField(trimmed, "message");
        const summaryVal = extractJsonStringField(trimmed, "reasoningSummary");
        const compVal = extractJsonStringField(trimmed, "component.tsx");
        const defVal = extractJsonStringField(trimmed, "default.tsx");
        const cssVal = extractJsonStringField(trimmed, "index.css");

        const recoveredFiles: Partial<Record<string, string | null>> = {};
        if (compVal) recoveredFiles["component.tsx"] = compVal;
        if (defVal) recoveredFiles["default.tsx"] = defVal;
        if (cssVal) recoveredFiles["index.css"] = cssVal;

        if (msgVal || Object.keys(recoveredFiles).length > 0) {
          return {
            message: msgVal || "Applied the requested updates to your component files.",
            reasoningSummary: summaryVal || undefined,
            changedFiles: recoveredFiles,
          };
        }

        return {
          message:
            "The generated payload was truncated due to size. Try breaking the request into two focused steps or switching to Standard depth.",
          changedFiles: {},
        };
      }
    }

    return {
      message: trimmed,
      changedFiles: {},
    };
  }
}

function sanitizeChangedFiles(
  rawChanged: Partial<Record<string, string | null>> | undefined,
  origComp: string,
  origDemo: string,
  origCss: string
): Partial<Record<string, string>> {
  const sanitized: Partial<Record<string, string>> = {};
  if (!rawChanged || typeof rawChanged !== "object") return sanitized;

  const origMap: Record<string, string> = {
    "component.tsx": origComp,
    "default.tsx": origDemo,
    "demo.tsx": origDemo,
    "index.css": origCss,
  };

  for (const [rawKey, val] of Object.entries(rawChanged)) {
    const targetKey = rawKey === "demo.tsx" ? "default.tsx" : rawKey;
    if (
      targetKey !== "component.tsx" &&
      targetKey !== "default.tsx" &&
      targetKey !== "index.css"
    ) {
      continue;
    }
    if (
      typeof val === "string" &&
      val.trim().length > 0 &&
      val !== "null" &&
      val.trim() !== (origMap[rawKey] || "").trim()
    ) {
      if (targetKey === "default.tsx" && sanitized["default.tsx"]) {
        continue;
      }
      sanitized[targetKey] = val;
    }
  }

  return sanitized;
}

function stripRegistryBinaryFields(
  refs: LoadedRegistryReference[]
): RegistryReferenceSummary[] {
  return refs.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    description: r.description,
    score: r.score,
    matchReasons: r.matchReasons,
    previewUrl: r.previewUrl,
    hasPreviewImage: r.hasPreviewImage,
    hasCodeSample: r.hasCodeSample,
    dependencies: r.dependencies,
    pinnedByUser: r.pinnedByUser,
  }));
}

export interface CopilotOrchestrationResult {
  source: "gemini-api" | "static-linter";
  hasApiKey: boolean;
  modelUsed: string;
  roleUsed: string;
  depthMode: AiDepthMode;
  complianceScore: number;
  reasoningSteps: AiReasoningStepPayload[];
  reasoningSummary: string;
  blueprint?: AiBlueprintPlan;
  verification?: AiVerificationReport;
  registryReferences: RegistryReferenceSummary[];
  referenceDecision: RegistryReferenceDecision;
  message: string;
  issuesFound: string[];
  issuesFixed: string[];
  addedDependencies: string[];
  followUpSuggestions: string[];
  changedFiles: Partial<Record<string, string>>;
  checks: GuidelineCheckItem[];
}

export async function runAiCopilotPipeline(
  body: AiAssistantRequestBody,
  apiKey: string | undefined
): Promise<CopilotOrchestrationResult> {
  const {
    prompt,
    action = "chat",
    componentCode = "",
    defaultCode,
    demoCode = "",
    cssCode = "",
    dependencies = [],
    compilerError = null,
    model: requestedModel = "gemini-4-hydrogen",
    role: requestedRole = "copilot",
    preserveDesign = true,
    depthMode: requestedDepth = "deep",
    registryRefMode: requestedRefMode = "auto",
    pinnedReferenceSlugs = [],
    currentComponentId,
    currentComponentSlug,
    currentComponentCategory,
    history = [],
    images = [],
    codeSnippets = [],
  } = body;

  const activeDemoCode = defaultCode ?? demoCode ?? "";
  const activeModel = normalizeGeminiModel(requestedModel);
  const depthMode: AiDepthMode = requestedDepth === "standard" ? "standard" : "deep";
  const registryRefMode: RegistryReferenceMode =
    requestedRefMode === "always" || requestedRefMode === "off"
      ? requestedRefMode
      : "auto";
  const cleanPinnedSlugs = Array.isArray(pinnedReferenceSlugs)
    ? pinnedReferenceSlugs.filter((s) => typeof s === "string" && s.trim().length > 0).slice(0, 3)
    : [];

  const userPrompt =
    (prompt || "").trim() ||
    (action === "autofix"
      ? "Auto-fix all 21st.dev guideline violations cleanly while keeping the existing UI design, layout, and styling unchanged."
      : "Perform a deep architectural and 21st.dev standards audit of this component.");

  // Stage 1: Deep Workspace AST + Static Guideline Dossier
  const dossier = analyzeWorkspaceDossier(
    componentCode,
    activeDemoCode,
    cssCode,
    dependencies
  );

  // Stage 2: Smart Intent Classification & Selective Registry Reference Gating
  const intent = classifyAiIntent({
    prompt: userPrompt,
    action,
    role: requestedRole,
    preserveDesign,
    registryRefMode,
    pinnedReferenceSlugs: cleanPinnedSlugs,
    hasCompilerError: Boolean(compilerError),
    hasUserAttachedImages: Array.isArray(images) && images.length > 0,
    currentCategory: currentComponentCategory,
  });

  // Effective design lock respects explicit designer role or visual-design intent override when unlocked
  const effectivePreserveDesign =
    requestedRole === "designer" ? false : preserveDesign;

  // Stage 3: Selective Multimodal Registry Visual & Design Reference Retrieval
  const { references: loadedRefs, totalRegistryCount } =
    await retrieveRegistryReferences({
      prompt: userPrompt,
      intent,
      currentDependencies: dependencies,
      pinnedReferenceSlugs: cleanPinnedSlugs,
      excludeComponentId: currentComponentId,
      excludeComponentSlug: currentComponentSlug,
      maxReferences: depthMode === "deep" ? 2 : 1,
    });

  const referenceSummaries = stripRegistryBinaryFields(loadedRefs);
  const referenceDecision: RegistryReferenceDecision = {
    used: loadedRefs.length > 0,
    mode: registryRefMode,
    reason: intent.referenceDecisionReason,
    intent: intent.primaryIntent,
    visualConfidence: intent.visualConfidence,
    candidateCount: totalRegistryCount,
  };

  // Static fallback when GEMINI_API_KEY is not set on server
  if (!apiKey) {
    const issueTexts = dossier.audit.checks
      .filter((c) => !c.passed)
      .map((c) => `${c.title}: ${c.description}`);

    return {
      source: "static-linter",
      hasApiKey: false,
      modelUsed: activeModel,
      roleUsed: requestedRole,
      depthMode,
      complianceScore: dossier.audit.score,
      registryReferences: referenceSummaries,
      referenceDecision,
      reasoningSteps: [
        {
          title: "Deep AST & Workspace Scan",
          description: `Parsed ${dossier.ast.componentName} (${dossier.ast.props.length} props, ${dossier.componentLines}L component.tsx, ${dossier.demoLines}L default.tsx).`,
          detail: dossier.ast.componentName,
          category: "ast",
          items: [
            `AST: ${dossier.ast.props.length} props`,
            `component.tsx (${dossier.componentLines}L)`,
            `${dependencies.length} NPM deps`,
          ],
        },
        {
          title: loadedRefs.length > 0 ? "Registry Visual References Indexed" : "Selective Reference Gate",
          description: referenceDecision.reason,
          detail: loadedRefs.length > 0 ? `${loadedRefs.length} refs` : registryRefMode,
          category: "reference",
          items:
            loadedRefs.length > 0
              ? loadedRefs.map((r) => `${r.name}${r.hasPreviewImage ? " (PNG)" : ""}`)
              : [`Scanned ${totalRegistryCount} components`, `Intent: ${intent.primaryIntent}`],
        },
        {
          title: "21st.dev Static Compliance Audit",
          description: `Verified ${dossier.audit.passedCount}/${dossier.audit.totalChecks} rules (score: ${dossier.audit.score}/100).`,
          detail: `${dossier.audit.score}/100`,
          category: "audit",
          items: [
            `${dossier.audit.passedCount}/${dossier.audit.totalChecks} rules passed`,
            dossier.usesCnUtility ? "cn() detected" : "cn() missing",
            dossier.usesTailwindDark ? "Dark tokens present" : "Dark tokens missing",
          ],
        },
      ],
      reasoningSummary: `Executed static AST & 21st.dev verification (${dossier.audit.score}/100). Configure GEMINI_API_KEY in Settings > Secrets for live multimodal generation.`,
      message:
        action === "audit"
          ? `Static 21st.dev compliance score: **${dossier.audit.score}/100**. ${
              issueTexts.length > 0
                ? `Found ${issueTexts.length} issue(s) to address.`
                : "All foundational 21st.dev guidelines satisfied!"
            }`
          : "Gemini AI is not configured yet on the server. Ensure `GEMINI_API_KEY` is set in **Settings > Secrets** to run live AI edits.",
      issuesFound: issueTexts,
      issuesFixed: [],
      addedDependencies: [],
      followUpSuggestions: [
        "Audit 21st.dev compliance standards",
        "Elevate visual craft using registry references",
        "Add Framer Motion spring choreography",
      ],
      changedFiles: {},
      checks: dossier.audit.checks,
    };
  }

  const ai = getGeminiClient(apiKey);
  const roleInstruction = ROLE_INSTRUCTIONS[requestedRole] || ROLE_INSTRUCTIONS.copilot;

  const depthProtocol =
    depthMode === "deep"
      ? `ACTIVE DEPTH MODE: DEEP ARCHITECTURE & CRAFT (DETAILED EXECUTION)
- Perform a thorough, senior-level engineering pass: carefully design state ergonomics, clean TypeScript props & defaults, responsive breakpoints, keyboard/ARIA accessibility, edge cases, and crisp micro-interactions.
- Populate the "blueprint" object with concrete, specific engineering & visual tokens (not generic filler).
- Whenever modifying "component.tsx" props, update "default.tsx" to showcase those props cleanly using the 21st.dev Native Demo Controls contract (\`const settings = { ... }\` + \`Demo(props: Partial<typeof settings>)\`) if appropriate.
- Provide a thorough, crisp Markdown breakdown in "message" explaining the visual & architectural craft choices.`
      : `ACTIVE DEPTH MODE: STANDARD FAST
- Keep changes tight, focused, and concise while maintaining 100% TypeScript & 21st.dev compliance.
- Populate "blueprint" concisely with the key changes made.`;

  const systemInstruction = `${MASTER_COPILOT_SYSTEM_PROMPT}

${roleInstruction}

${depthProtocol}
${effectivePreserveDesign ? `\n${COPILOT_UI_PRESERVATION_SKILL}\n` : ""}
RESPONSE FORMAT & TRACE REQUIREMENTS:
- Document your real engineering trace in "reasoningSteps" (4 to 6 steps). Valid categories: "context" | "reference" | "ast" | "audit" | "synthesis" | "verify".
- If Registry Visual References are attached in this turn, include a dedicated step with category "reference" explaining the concrete visual/surface/motion cues you distilled from the attached preview image(s) and code pattern(s), and list them in "blueprint.referenceTakeaways".
- Include all external npm packages imported in your updated code inside "addedDependencies".
- Always provide 3 tailored, clickable "followUpSuggestions" (each under 8 words).
- If a file is NOT modified, set its key in "changedFiles" to null. Modified files must be 100% complete and compilable.`;

  // Build multi-turn history enforcing strict user -> model alternation
  const contents: Array<{
    role: "user" | "model";
    parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    >;
  }> = [];

  for (const item of history.slice(-12)) {
    if (item.role === "system" || !item.content || !item.content.trim()) continue;
    const turnRole: "user" | "model" =
      item.role === "assistant" || item.role === "model" ? "model" : "user";
    const text = item.content.trim();
    if (contents.length === 0 && turnRole === "model") continue;

    const lastTurn = contents[contents.length - 1];
    if (lastTurn && lastTurn.role === turnRole) {
      lastTurn.parts.push({ text });
    } else {
      contents.push({ role: turnRole, parts: [{ text }] });
    }
  }

  // Assemble current turn multimodal parts:
  // 1. Registry Visual Reference preview images + design dossiers (when selectively activated)
  const userParts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (loadedRefs.length > 0) {
    userParts.push({
      text: `[REGISTRY VISUAL & DESIGN REFERENCES — SELECTIVE GROUNDING]
Decision: ${intent.referenceDecisionReason}
Study the following ${loadedRefs.length} registered component design(s) from this workspace's library. Use their visual craftsmanship (surface elevation, border restraint, typography scale, spacing rhythm, dark/light contrast, and motion polish) as aesthetic & structural inspiration — NEVER copy unrelated domain text verbatim.`,
    });

    for (let idx = 0; idx < loadedRefs.length; idx++) {
      const ref = loadedRefs[idx];
      if (ref.imageInlineData) {
        userParts.push({
          text: `Reference Image #${idx + 1}: "${ref.name}" (slug: ${ref.slug}, category: ${ref.category}) — ${ref.description}`,
        });
        userParts.push({
          inlineData: ref.imageInlineData,
        });
      }

      const codeBlocks: string[] = [];
      if (ref.codeExcerpt) {
        codeBlocks.push(`\`\`\`tsx\n${ref.codeExcerpt}\n\`\`\``);
      }
      if (ref.cssExcerpt) {
        codeBlocks.push(`\`\`\`css\n${ref.cssExcerpt}\n\`\`\``);
      }
      if (codeBlocks.length > 0) {
        userParts.push({
          text: `Reference Design Pattern #${idx + 1} (${ref.name} · deps: ${JSON.stringify(ref.dependencies)} · reasons: ${ref.matchReasons.join(", ")}):\n${codeBlocks.join("\n")}`,
        });
      }
    }
  }

  // 2. User-uploaded image attachments (mockups / screenshots)
  if (Array.isArray(images) && images.length > 0) {
    for (const img of images) {
      if (img.dataUrl) {
        const commaIdx = img.dataUrl.indexOf(",");
        const base64Data = commaIdx !== -1 ? img.dataUrl.slice(commaIdx + 1) : img.dataUrl;
        const mimeMatch = img.dataUrl.match(/data:([^;]+);base64/);
        const mimeType = img.mimeType || (mimeMatch ? mimeMatch[1] : "image/png");
        userParts.push({
          text: `User Uploaded Mockup/Screenshot (${img.name || "attachment.png"}):`,
        });
        userParts.push({
          inlineData: { mimeType, data: base64Data },
        });
      }
    }
  }

  // 3. Full active workspace code + AST dossier + user request
  const designLockReminder = effectivePreserveDesign
    ? `\n\n[ACTIVE SKILL: UI & DESIGN LOCK ON]
Keep existing layout structure, colors, borders, radii, shadows, typography, and visual styling 100% unchanged unless the user prompt explicitly asks to alter a specific visual property.`
    : `\n\n[ACTIVE SKILL: VISUAL DESIGN EDITING UNLOCKED]
You are authorized to craft, redesign, and elevate visual layout, surfaces, typography, dark/light tokens, and Framer Motion choreography to gallery-grade quality.`;

  const compilerErrorContext = compilerError
    ? `\n\n[ACTIVE SANDBOX COMPILER / RUNTIME ERROR]:\n${compilerError}\nYou must resolve this error completely.`
    : "";

  let currentTurnText = `=== WORKSPACE AST & COMPLIANCE DOSSIER ===
Specialist Persona: ${requestedRole}
Depth Mode: ${depthMode}
Detected Intent: ${intent.primaryIntent} (visual confidence: ${intent.visualConfidence}%)
${dossier.promptSummary}${compilerErrorContext}

--- component.tsx ---
${componentCode}

--- default.tsx ---
${activeDemoCode}

--- index.css ---
${cssCode}

=== USER REQUEST (${action}) ===
${userPrompt}${designLockReminder}`;

  if (Array.isArray(codeSnippets) && codeSnippets.length > 0) {
    const snippetsSection = codeSnippets
      .map(
        (cs, idx) =>
          `### Attached Code Reference #${idx + 1}: ${cs.title || "Snippet"} [${cs.language || "text"}]\n\`\`\`${cs.language || ""}\n${cs.code}\n\`\`\``
      )
      .join("\n\n");
    currentTurnText += `\n\n=== USER ATTACHED EXTERNAL CODE SNIPPETS ===\n${snippetsSection}`;
  }

  userParts.push({ text: currentTurnText });

  const lastHistoryTurn = contents[contents.length - 1];
  if (lastHistoryTurn && lastHistoryTurn.role === "user") {
    lastHistoryTurn.parts.push(...userParts);
  } else {
    contents.push({ role: "user", parts: userParts });
  }

  // Stage 4: Primary Gemini Generation with Automatic Model Cascade
  const candidateModels = buildModelCascade(activeModel);
  let textOutput = "";
  let resolvedModel = activeModel;
  let lastModelError: unknown = null;

  for (const candidateModel of candidateModels) {
    try {
      const thinkingLevel = resolveThinkingLevel(candidateModel, depthMode);
      const response = await ai.models.generateContent({
        model: candidateModel,
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: COPILOT_RESPONSE_SCHEMA,
          ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
        },
      });

      const candidateText = (response.text || "").trim();
      if (candidateText.length > 0) {
        textOutput = candidateText;
        resolvedModel = candidateModel;
        lastModelError = null;
        break;
      }
    } catch (modelErr: unknown) {
      lastModelError = modelErr;
      const errMsg = modelErr instanceof Error ? modelErr.message : String(modelErr);
      const isFatalAuth =
        errMsg.includes("API key not valid") ||
        errMsg.includes("API_KEY_INVALID") ||
        errMsg.includes("PERMISSION_DENIED");
      if (isFatalAuth) {
        throw modelErr;
      }
    }
  }

  if (!textOutput && lastModelError) {
    throw lastModelError;
  }

  const parsed = parseJsonResponseSafely(textOutput);
  let sanitizedFiles = sanitizeChangedFiles(
    parsed.changedFiles,
    componentCode,
    activeDemoCode,
    cssCode
  );
  const rawAddedDeps = Array.isArray(parsed.addedDependencies)
    ? parsed.addedDependencies.filter((d) => typeof d === "string" && d.trim().length > 0)
    : [];

  // Stage 5: Post-Generation Sucrase Compile Verification + Automatic Self-Repair Loop
  let selfRepaired = false;
  if (Object.keys(sanitizedFiles).length > 0) {
    const compileProblems: string[] = [];
    if (sanitizedFiles["component.tsx"]) {
      const check = verifyTsxCompilation("component.tsx", sanitizedFiles["component.tsx"]);
      if (!check.valid && check.error) compileProblems.push(check.error);
    }
    if (sanitizedFiles["default.tsx"]) {
      const check = verifyTsxCompilation("default.tsx", sanitizedFiles["default.tsx"]);
      if (!check.valid && check.error) compileProblems.push(check.error);
    }

    if (compileProblems.length > 0) {
      try {
        const repairPrompt = `The code you just generated has a TypeScript/JSX syntax error caught by the Sucrase sandbox compiler:
${compileProblems.join("\n")}

Fix ONLY the syntax/JSX/TypeScript compilation error(s) while preserving 100% of the visual design, logic, and architecture. Return the complete fixed file(s).

--- component.tsx ---
${sanitizedFiles["component.tsx"] ?? componentCode}

--- default.tsx ---
${sanitizedFiles["default.tsx"] ?? activeDemoCode}`;

        const repairResponse = await ai.models.generateContent({
          model: resolvedModel,
          contents: [{ role: "user", parts: [{ text: repairPrompt }] }],
          config: {
            systemInstruction:
              "You are a surgical TypeScript/JSX compiler repair assistant. Return complete, valid, compilable TSX code with zero syntax errors.",
            responseMimeType: "application/json",
            responseSchema: REPAIR_RESPONSE_SCHEMA,
          },
        });

        const repairParsed = parseJsonResponseSafely(repairResponse.text || "");
        const repairedFiles = sanitizeChangedFiles(
          repairParsed.changedFiles,
          componentCode,
          activeDemoCode,
          cssCode
        );

        // Accept repaired files only if they actually compile cleanly
        let allRepairedCompile = true;
        if (repairedFiles["component.tsx"]) {
          if (!verifyTsxCompilation("component.tsx", repairedFiles["component.tsx"]).valid) {
            allRepairedCompile = false;
          }
        }
        if (repairedFiles["default.tsx"]) {
          if (!verifyTsxCompilation("default.tsx", repairedFiles["default.tsx"]).valid) {
            allRepairedCompile = false;
          }
        }

        if (allRepairedCompile && Object.keys(repairedFiles).length > 0) {
          sanitizedFiles = { ...sanitizedFiles, ...repairedFiles };
          selfRepaired = true;
        }
      } catch {
        // Keep original generated output and surface compile warning in verification report
      }
    }
  }

  // Build final verification report (before vs after score + real AST/compile verification)
  const verification = verifyGeneratedWorkspace({
    baselineDossier: dossier,
    baseComponentCode: componentCode,
    baseDemoCode: activeDemoCode,
    baseCssCode: cssCode,
    baseDependencies: dependencies,
    changedFiles: sanitizedFiles,
    addedDependencies: rawAddedDeps,
    selfRepaired,
  });

  const finalAddedDeps = Array.from(
    new Set([...rawAddedDeps, ...verification.dependencyDelta])
  ).filter((d) => !dependencies.includes(d));

  // Normalize reasoning steps & inject real Registry Reference + Verification steps if missing
  const validCategories = new Set<AiReasoningStepCategory>([
    "context",
    "reference",
    "ast",
    "audit",
    "synthesis",
    "verify",
  ]);
  const fallbackOrder: AiReasoningStepCategory[] = [
    "context",
    "reference",
    "ast",
    "audit",
    "synthesis",
    "verify",
  ];

  const normalizedSteps: AiReasoningStepPayload[] =
    Array.isArray(parsed.reasoningSteps) && parsed.reasoningSteps.length > 0
      ? parsed.reasoningSteps.map((st, idx) => ({
          title: st.title || `Step ${idx + 1}`,
          description: st.description || "",
          detail: st.detail || undefined,
          category:
            st.category && validCategories.has(st.category)
              ? st.category
              : fallbackOrder[idx % fallbackOrder.length],
          items: Array.isArray(st.items) ? st.items.slice(0, 4) : undefined,
        }))
      : [
          {
            title: "Workspace AST & Context Dossier",
            description: `Analyzed ${dossier.ast.componentName} (${dossier.ast.props.length} props, ${dossier.componentLines}L component.tsx, ${dossier.demoLines}L default.tsx).`,
            detail: dossier.ast.componentName,
            category: "ast",
            items: [
              `${dossier.ast.props.length} typed props`,
              `Intent: ${intent.primaryIntent.replace("_", " ")}`,
              `Depth: ${depthMode}`,
            ],
          },
          {
            title:
              loadedRefs.length > 0
                ? "Registry Visual & Design Grounding"
                : "Selective Reference Gate",
            description: intent.referenceDecisionReason,
            detail:
              loadedRefs.length > 0
                ? `${loadedRefs.length} ref${loadedRefs.length === 1 ? "" : "s"}`
                : "Surgical",
            category: "reference",
            items:
              loadedRefs.length > 0
                ? loadedRefs.map(
                    (r) => `${r.name}${r.hasPreviewImage ? " (PNG)" : ""}`
                  )
                : [`Mode: ${registryRefMode}`, "No visual bias needed"],
          },
          {
            title:
              Object.keys(sanitizedFiles).length > 0
                ? "Synthesizing Production Component Code"
                : "Formulating Architectural Guidance",
            description:
              Object.keys(sanitizedFiles).length > 0
                ? `Generated complete TypeScript updates for ${Object.keys(sanitizedFiles).join(", ")}.`
                : "Synthesized detailed architectural review aligned with Component Studio standards.",
            detail: resolvedModel.replace("gemini-", ""),
            category: "synthesis",
            items:
              Object.keys(sanitizedFiles).length > 0
                ? [
                    ...Object.keys(sanitizedFiles).map((f) => `Updated ${f}`),
                    `Mode: ${depthMode}`,
                  ]
                : ["Architectural review", "Zero unintended edits"],
          },
        ];

  // Ensure Registry Reference grounding step is visible when references were actually pulled
  if (
    loadedRefs.length > 0 &&
    !normalizedSteps.some((s) => s.category === "reference")
  ) {
    normalizedSteps.splice(1, 0, {
      title: "Registry Visual & Design Grounding",
      description: `Inspected ${loadedRefs.map((r) => `${r.name}${r.hasPreviewImage ? " preview.png" : ""}`).join(" & ")} from the component registry for visual craft calibration.`,
      detail: `${loadedRefs.length} visual ref${loadedRefs.length === 1 ? "" : "s"}`,
      category: "reference",
      items: loadedRefs.map((r) =>
        r.hasPreviewImage ? `${r.name} (preview.png)` : `${r.name} (code)`
      ),
    });
  }

  // Ensure real Sucrase verification step is always recorded when files changed
  if (
    Object.keys(sanitizedFiles).length > 0 &&
    !normalizedSteps.some((s) => s.category === "verify")
  ) {
    normalizedSteps.push({
      title: verification.selfRepaired
        ? "Sandbox Compile Verification & Auto-Repair"
        : "Sandbox Compile & Compliance Verification",
      description: verification.compileValid
        ? `Sucrase TSX compile passed cleanly. 21st.dev score: ${verification.beforeScore} → ${verification.afterScore}/100.`
        : `Sucrase compiler flagged: ${verification.compileError || "syntax warning"}.`,
      detail: verification.compileValid ? "Compile OK" : "Check Syntax",
      category: "verify",
      items: [
        verification.compileValid ? "Sucrase TSX passed" : "Compile warning",
        `Score ${verification.beforeScore} → ${verification.afterScore}`,
        ...(verification.selfRepaired ? ["Auto-repaired"] : []),
      ],
    });
  }

  const normalizedBlueprint: AiBlueprintPlan | undefined = parsed.blueprint
    ? {
        architectureNotes: Array.isArray(parsed.blueprint.architectureNotes)
          ? parsed.blueprint.architectureNotes.filter(Boolean).slice(0, 5)
          : [],
        designTokens: Array.isArray(parsed.blueprint.designTokens)
          ? parsed.blueprint.designTokens.filter(Boolean).slice(0, 5)
          : [],
        motionStrategy:
          typeof parsed.blueprint.motionStrategy === "string" &&
          parsed.blueprint.motionStrategy.trim().length > 0
            ? parsed.blueprint.motionStrategy.trim()
            : undefined,
        accessibilityNotes: Array.isArray(parsed.blueprint.accessibilityNotes)
          ? parsed.blueprint.accessibilityNotes.filter(Boolean).slice(0, 4)
          : [],
        edgeCasesHandled: Array.isArray(parsed.blueprint.edgeCasesHandled)
          ? parsed.blueprint.edgeCasesHandled.filter(Boolean).slice(0, 4)
          : [],
        referenceTakeaways: Array.isArray(parsed.blueprint.referenceTakeaways)
          ? parsed.blueprint.referenceTakeaways.filter(Boolean).slice(0, 4)
          : undefined,
      }
    : undefined;

  const defaultFollowUps =
    Object.keys(sanitizedFiles).length > 0
      ? [
          "Add interactive native demo controls",
          "Refine motion springs and tactile press feel",
          "Audit WCAG contrast and keyboard shortcuts",
        ]
      : [
          "Elevate UI using registry visual references",
          "Audit and auto-fix 21st.dev guidelines",
          "Add Framer Motion spring transitions",
        ];

  return {
    source: "gemini-api",
    hasApiKey: true,
    modelUsed: resolvedModel,
    roleUsed: requestedRole,
    depthMode,
    complianceScore: verification.afterScore,
    reasoningSteps: normalizedSteps,
    reasoningSummary:
      parsed.reasoningSummary ||
      `Completed ${depthMode} ${intent.primaryIntent.replace("_", " ")} pass (${verification.beforeScore} → ${verification.afterScore}/100).`,
    blueprint: normalizedBlueprint,
    verification,
    registryReferences: referenceSummaries,
    referenceDecision,
    message: parsed.message || "Completed component analysis and updates.",
    issuesFound: Array.isArray(parsed.issuesFound) ? parsed.issuesFound : [],
    issuesFixed: Array.isArray(parsed.issuesFixed) ? parsed.issuesFixed : [],
    addedDependencies: finalAddedDeps,
    followUpSuggestions:
      Array.isArray(parsed.followUpSuggestions) && parsed.followUpSuggestions.length > 0
        ? parsed.followUpSuggestions.slice(0, 4)
        : defaultFollowUps,
    changedFiles: sanitizedFiles,
    checks: dossier.audit.checks,
  };
}
