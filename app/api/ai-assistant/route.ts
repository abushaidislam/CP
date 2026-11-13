import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auditComponentGuidelines } from "@/lib/sandbox/guideline-linter";
import {
  COPILOT_PREMIUM_DESIGN_MANIFESTO,
  COPILOT_UI_PRESERVATION_SKILL,
} from "@/lib/sandbox/copilot-design-knowledge";

interface ChatHistoryItem {
  role: "user" | "assistant" | "model" | "system";
  content: string;
}

interface AttachedImagePayload {
  name?: string;
  dataUrl: string;
  mimeType?: string;
}

interface AttachedCodePayload {
  title?: string;
  language?: string;
  code: string;
}

interface RequestBody {
  prompt?: string;
  action?: "audit" | "chat" | "autofix";
  componentCode: string;
  defaultCode?: string;
  demoCode?: string;
  cssCode?: string;
  dependencies?: string[];
  model?: string;
  role?: string;
  preserveDesign?: boolean;
  history?: ChatHistoryItem[];
  images?: AttachedImagePayload[];
  codeSnippets?: AttachedCodePayload[];
  apiKey?: string;
}

// Supported official Gemini models from @google/genai skill specification
const VALID_MODELS = [
  "gemini-4-hydrogen",     // General tasks & fast coding (default)
  "gemini-4-argon",        // Complex tasks & deep reasoning
  "gemini-3.1-flash-lite", // Fast tasks & instant feedback
];

const MASTER_COPILOT_INSTRUCTION = `You are the Dedicated Component Studio Co-Pilot — an elite React 19, TypeScript, Tailwind CSS, and Framer Motion pair programmer for this live component playground.

THE PLATFORM & WORKFLOW:
1. Live Component Playground:
   The developer creates and edits components in real time.
   - "component.tsx": The primary reusable component.
   - "default.tsx": The isolated preview showcase that renders the component in the canvas (importing from "../components/ui/component").
   - "index.css": Any custom CSS / Tailwind directives.
2. The developer renders the component live in the preview canvas to see how it works and feels.
3. The developer will copy the final code from "component.tsx" directly into their application pages (e.g., "page.tsx") or publish it. Therefore, "component.tsx" MUST be 100% self-contained, typed, compilable, and ready to paste into any Next.js page.

STRICT BEHAVIORAL PROTOCOLS:

1. DEFAULT SURGICAL PRESERVATION (ZERO UNINTENDED DESIGN CHANGES):
- Whenever the developer asks to modify logic, add features/props/state, refactor code, fix bugs/errors, add accessibility, or auto-fix guidelines:
  * DO NOT alter, rewrite, or redesign existing layout structure, padding, margins, colors, gradients, borders, shadows, border-radius, typography, or animations.
  * PRESERVE 100% of the developer's styling decisions, Tailwind class names, DOM hierarchy, and visual aesthetics.
  * Touch ONLY the specific lines needed for the requested logic, functionality, bug fix, or type/standard requirement.
  * Keep the UI looking 100% identical to how it looked before your edit.

2. ON-DEMAND UI & MOTION REFINEMENT (ONLY WHEN EXPLICITLY REQUESTED):
- ONLY when the developer explicitly asks to change the visual design, restyle UI, change colors/theme, or add new animations:
  * Modify ONLY the specific visual aspect requested while keeping the rest of the component's layout and design intact.

3. 100% COPY-PASTE & REUSABLE STANDARDS:
  * Always include '"use client";' at the very top of "component.tsx" whenever hooks (useState, useEffect, useRef, etc.) or interactive events are used.
  * Export a single main component with an explicit TypeScript Props interface extending standard HTML attributes (e.g., 'export interface ComponentProps extends React.HTMLAttributes<HTMLDivElement>').
  * Merge custom className using 'cn(...)' from '@/lib/utils' while keeping all existing Tailwind classes verbatim.
  * "default.tsx" must have default export 'export default function Demo() { ... }'.

CRITICAL CODE MODIFICATION RULES:
- Never return partial code, pseudocode, or '// rest of code stays the same' comments.
- Always provide the COMPLETE, compilable, valid TypeScript code for any modified file in the "changedFiles" object.

${COPILOT_PREMIUM_DESIGN_MANIFESTO}`;

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

function parseJsonResponseSafely(textOutput: string): {
  reasoningSteps?: Array<{ title: string; description?: string; detail?: string }>;
  reasoningSummary?: string;
  message?: string;
  complianceScore?: number;
  issuesFound?: string[];
  issuesFixed?: string[];
  changedFiles?: Partial<Record<string, string | null>>;
} {
  const trimmed = (textOutput || "").trim();
  if (!trimmed) {
    return {
      message: "I processed your request, but received an empty response. Please try again.",
      changedFiles: {},
    };
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Strip markdown fences if wrapped
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch?.[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        // continue
      }
    }

    // Attempt to extract first top-level JSON object
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      } catch {
        // continue
      }
    }

    return {
      message: trimmed,
      changedFiles: {},
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const {
      prompt,
      action = "chat",
      componentCode = "",
      defaultCode,
      demoCode = "",
      cssCode = "",
      dependencies = [],
      model: requestedModel = "gemini-4-hydrogen",
      role: requestedRole = "copilot",
      preserveDesign = true,
      history = [],
      images = [],
      codeSnippets = [],
    } = body;

    const activeDemoCode = defaultCode ?? demoCode ?? "";
    const activeModel = normalizeGeminiModel(requestedModel);

    // Run static guideline audit first (instant zero-latency baseline)
    const staticAudit = auditComponentGuidelines(
      componentCode,
      activeDemoCode,
      cssCode,
      dependencies
    );

    const apiKey = (process.env.GEMINI_API_KEY || body.apiKey)?.trim();

    // If server has no API key configured, return static analysis fallback
    if (!apiKey) {
      const issueTexts = staticAudit.checks
        .filter((c) => !c.passed)
        .map((c) => `${c.title}: ${c.description}`);

      return NextResponse.json({
        success: true,
        source: "static-linter",
        hasApiKey: false,
        complianceScore: staticAudit.score,
        checks: staticAudit.checks,
        modelUsed: activeModel,
        roleUsed: requestedRole,
        reasoningSteps: [
          {
            title: "Reading component structure",
            description: `Examined exported React component, TypeScript props interface, and hook usage across ${componentCode.split("\n").length} lines in component.tsx.`,
            detail: "component.tsx",
          },
          {
            title: "Auditing 21st.dev standards",
            description: `Verified ${staticAudit.checks.filter((c) => c.passed).length} of ${staticAudit.checks.length} static guideline checks including className merging and theme tokens.`,
            detail: `${staticAudit.score}/100`,
          },
        ],
        reasoningSummary: `Executed static guideline verification across component.tsx, default.tsx, and index.css (score: ${staticAudit.score}/100).`,
        message:
          action === "audit"
            ? `Static 21st.dev compliance score: ${staticAudit.score}/100. ${
                issueTexts.length > 0
                  ? `Identified ${issueTexts.length} issue(s) to address.`
                  : "All foundational 21st.dev guidelines satisfied!"
              }`
            : "Gemini AI is not configured yet on the server. Ensure GEMINI_API_KEY is set in your environment secrets to run live AI edits.",
        issuesFound: issueTexts,
        issuesFixed: [],
        changedFiles: {},
      });
    }

    // Initialize official GoogleGenAI client on server-side only
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `${MASTER_COPILOT_INSTRUCTION}
${preserveDesign ? `\n${COPILOT_UI_PRESERVATION_SKILL}\n` : ""}
CONVERSATION & RESPONSE INSTRUCTIONS:
- You are engaged in a multi-turn conversation with the developer. Maintain full context across previous turns.
- Provide insightful, friendly, and technically precise feedback.
- Document your internal chain-of-thought in "reasoningSteps" (3 to 4 sequential thoughts where each step has a short "title", a natural 1-sentence "description" of the work/analysis done in that step, and an optional "detail" like a filename) and a 1-sentence "reasoningSummary".
- MULTIMODAL CAPABILITY: If image attachments are provided (mockups, wireframes, screenshots), carefully analyze their visual hierarchy, typography, colors, padding, alignment, and motion cues, and implement matching production React + Tailwind code.
- CODE ATTACHMENT CAPABILITY: If external code snippets or references are attached, analyze their logic, interfaces, or styles and integrate them into component.tsx / default.tsx / index.css.
- If the user asks for code changes, enhancements, fixes, or styling, you MUST supply the COMPLETE updated file code in the "changedFiles" object.
- If the user asks a general question, advice, or brainstorming without requiring code changes, leave "changedFiles" as an empty object {}.

JSON Output Format (Strictly enforce valid JSON):
{
  "reasoningSteps": [
    {
      "title": "Short thought heading (e.g., Inspecting component props & state)",
      "description": "Natural 1-sentence explanation of what you examined or decided in this step.",
      "detail": "Optional file or target (e.g., component.tsx)"
    }
  ],
  "reasoningSummary": "One concise sentence summarizing the architectural approach taken.",
  "message": "Conversational markdown response answering the user, explaining your reasoning and code changes",
  "complianceScore": <number 0-100 indicating quality and guideline compliance>,
  "issuesFound": ["Short descriptions of issues found, if any"],
  "issuesFixed": ["Short descriptions of issues addressed, if any"],
  "changedFiles": {
    "component.tsx": "<COMPLETE compilable code if changed, or null>",
    "default.tsx": "<COMPLETE compilable code if changed, or null>",
    "index.css": "<COMPLETE compilable code if changed, or null>"
  }
}
CRITICAL: Never output partial code with placeholders like '// rest of code'. Changed files must be complete and compilable.`;

    // Filter and build multi-turn contents enforcing strict user -> model alternation
    const contents: Array<{
      role: "user" | "model";
      parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      >;
    }> = [];

    const recentHistory = history.slice(-10);
    for (const item of recentHistory) {
      if (item.role === "system" || !item.content || !item.content.trim()) continue;
      const turnRole: "user" | "model" =
        item.role === "assistant" || item.role === "model" ? "model" : "user";
      const text = item.content.trim();

      // Gemini requires multi-turn history to start with a user message
      if (contents.length === 0 && turnRole === "model") {
        continue;
      }

      const lastTurn = contents[contents.length - 1];
      if (lastTurn && lastTurn.role === turnRole) {
        lastTurn.parts.push({ text });
      } else {
        contents.push({
          role: turnRole,
          parts: [{ text }],
        });
      }
    }

    // Construct the current turn message with live editor context
    const userPrompt =
      prompt ||
      (action === "autofix"
        ? "Auto-fix any guideline violations while keeping the existing UI design, layout, and styling 100% unchanged."
        : "Audit this component");
    const designLockReminder = preserveDesign
      ? `\n\n[ACTIVE SKILL: UI & DESIGN LOCK ON]
CRITICAL RULE FOR THIS TURN: Keep the existing UI, layout structure, spacing, colors, gradients, border-radius, shadows, and visual appearance 100% UNCHANGED. Apply the requested changes, fixes, or code improvements WITHOUT altering how the component looks unless the user prompt above explicitly asks for a specific visual/style change.`
      : "";

    let currentTurnText = `Current Editor Context:
Active Dependencies: ${JSON.stringify(dependencies)}

--- component.tsx ---
${componentCode}

--- default.tsx ---
${activeDemoCode}

--- index.css ---
${cssCode}

User Request (${action}):
${userPrompt}${designLockReminder}`;

    // Append attached code snippets if any
    if (codeSnippets && Array.isArray(codeSnippets) && codeSnippets.length > 0) {
      const snippetsSection = codeSnippets
        .map(
          (cs, idx) =>
            `### Attached Code Reference #${idx + 1}: ${cs.title || "Snippet"} [${cs.language || "text"}]\n\`\`\`${cs.language || ""}\n${cs.code}\n\`\`\``
        )
        .join("\n\n");
      currentTurnText += `\n\n--- User Attached External Code Snippets ---\n${snippetsSection}`;
    }

    const userParts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [];

    // Add image attachments as inlineData (base64)
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.dataUrl) {
          const commaIdx = img.dataUrl.indexOf(",");
          const base64Data = commaIdx !== -1 ? img.dataUrl.slice(commaIdx + 1) : img.dataUrl;
          const mimeMatch = img.dataUrl.match(/data:([^;]+);base64/);
          const mimeType = img.mimeType || (mimeMatch ? mimeMatch[1] : "image/png");
          userParts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }
    }

    userParts.push({ text: currentTurnText });

    // If the last history item was already "user", append current parts to it to preserve alternation
    const lastHistoryTurn = contents[contents.length - 1];
    if (lastHistoryTurn && lastHistoryTurn.role === "user") {
      lastHistoryTurn.parts.push(...userParts);
    } else {
      contents.push({
        role: "user",
        parts: userParts,
      });
    }

    // Invoke Gemini multi-turn generation
    const response = await ai.models.generateContent({
      model: activeModel,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text || "";
    const parsedResult = parseJsonResponseSafely(textOutput);

    // Filter changedFiles so only non-null, non-empty modified files are returned,
    // normalizing any "demo.tsx" alias to "default.tsx"
    const sanitizedChangedFiles: Partial<Record<string, string>> = {};
    if (parsedResult.changedFiles && typeof parsedResult.changedFiles === "object") {
      const origMap: Record<string, string> = {
        "component.tsx": componentCode,
        "default.tsx": activeDemoCode,
        "demo.tsx": activeDemoCode,
        "index.css": cssCode,
      };
      for (const [rawKey, val] of Object.entries(parsedResult.changedFiles)) {
        const targetKey = rawKey === "demo.tsx" ? "default.tsx" : rawKey;
        if (
          typeof val === "string" &&
          val.trim().length > 0 &&
          val !== "null" &&
          val.trim() !== (origMap[rawKey] || "").trim()
        ) {
          if (targetKey === "default.tsx" && sanitizedChangedFiles["default.tsx"]) {
            continue;
          }
          sanitizedChangedFiles[targetKey] = val;
        }
      }
    }

    const defaultSteps = [
      {
        title: "Inspecting component structure",
        description: `Examined exported React component, props interface, and layout hierarchy in component.tsx (${componentCode.split("\n").length} lines).`,
        detail: "component.tsx",
      },
      {
        title: "Evaluating design & accessibility standards",
        description: `Checked 21st.dev compliance rules (${staticAudit.checks.filter((c) => c.passed).length}/${staticAudit.checks.length} passed), Tailwind tokens, and contrast states.`,
        detail: `${staticAudit.score}/100`,
      },
      {
        title:
          Object.keys(sanitizedChangedFiles).length > 0
            ? "Synthesizing code modifications"
            : "Formulating architectural guidance",
        description:
          Object.keys(sanitizedChangedFiles).length > 0
            ? `Prepared complete, compilable updates for ${Object.keys(sanitizedChangedFiles).join(", ")}.`
            : "Synthesized response aligned with Component Studio Co-Pilot standards.",
        detail: activeModel.replace("gemini-", ""),
      },
    ];

    return NextResponse.json({
      success: true,
      source: "gemini-api",
      hasApiKey: true,
      modelUsed: activeModel,
      roleUsed: requestedRole || "copilot",
      complianceScore: parsedResult.complianceScore ?? staticAudit.score,
      reasoningSteps:
        Array.isArray(parsedResult.reasoningSteps) && parsedResult.reasoningSteps.length > 0
          ? parsedResult.reasoningSteps
          : defaultSteps,
      reasoningSummary:
        parsedResult.reasoningSummary ||
        "Evaluated component architecture under Component Studio Co-Pilot standards.",
      message: parsedResult.message || "Response generated successfully.",
      issuesFound: parsedResult.issuesFound || [],
      issuesFixed: parsedResult.issuesFixed || [],
      changedFiles: sanitizedChangedFiles,
      checks: staticAudit.checks,
    });
  } catch (err: unknown) {
    console.error("[Gemini AI Assistant API Error]:", err);
    const message = err instanceof Error ? err.message : String(err);
    const isApiKeyError =
      message.includes("API key not valid") ||
      message.includes("API_KEY_INVALID") ||
      message.includes("PERMISSION_DENIED") ||
      message.includes("unauthenticated") ||
      message.includes("401");
    const isQuotaError =
      message.includes("RESOURCE_EXHAUSTED") || message.includes("429");
    const isNotFoundError =
      message.includes("NOT_FOUND") || message.includes("404");

    let userFriendlyError = `AI Assistant Error: ${message}`;
    if (isApiKeyError) {
      userFriendlyError =
        "Invalid or unauthorized Gemini API Key. Please check GEMINI_API_KEY in Settings > Secrets.";
    } else if (isQuotaError) {
      userFriendlyError =
        "Gemini API rate limit or quota exceeded (429). Try switching to Gemini 4 Hydrogen or Gemini 3.1 Flash Lite, or check your billing quota.";
    } else if (isNotFoundError) {
      userFriendlyError =
        "Selected Gemini model was not found (404). Please try Gemini 4 Hydrogen or Gemini 3.1 Flash Lite.";
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyError,
        isApiKeyError,
      },
      { status: isApiKeyError ? 401 : isQuotaError ? 429 : isNotFoundError ? 404 : 500 }
    );
  }
}
