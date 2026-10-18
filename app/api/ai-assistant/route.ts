import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auditComponentGuidelines } from "@/lib/sandbox/guideline-linter";

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
  demoCode?: string;
  cssCode?: string;
  dependencies?: string[];
  model?: string;
  role?: string;
  history?: ChatHistoryItem[];
  images?: AttachedImagePayload[];
  codeSnippets?: AttachedCodePayload[];
  apiKey?: string;
}

// Supported official Gemini models matching instructions
const VALID_MODELS = [
  "gemini-3.8-flash",     // General tasks (default)
  "gemini-4-argon",       // Complex tasks & deep reasoning
  "gemini-3.1-flash-lite", // Fast tasks & instant feedback
];

const MASTER_COPILOT_INSTRUCTION = `You are the Dedicated Component Studio Co-Pilot — an elite React 19, TypeScript, Tailwind CSS, and Framer Motion pair programmer for this live component playground.

THE PLATFORM & WORKFLOW:
1. Live Component Playground:
   The developer creates and edits components in real time.
   - "component.tsx": The primary reusable component.
   - "demo.tsx": The isolated preview showcase that renders the component in the canvas.
   - "index.css": Any custom CSS / Tailwind directives.
2. The developer renders the component live in the preview canvas to see how it works and feels.
3. The developer will copy the final code from "component.tsx" directly into their application pages (e.g., "page.tsx") or publish it. Therefore, "component.tsx" MUST be 100% self-contained, typed, compilable, and ready to paste into any Next.js page.

STRICT BEHAVIORAL PROTOCOLS:

1. SURGICAL BUG FIXING & ERROR CORRECTION (ZERO UNINTENDED DESIGN CHANGES):
- When the developer reports an error, bug, rendering failure, syntax issue, TypeScript problem, or says something is broken or not working:
  * DO NOT alter, rewrite, or redesign existing layout structure, padding, margins, colors, borders, or animations.
  * PRESERVE 100% of the developer's styling decisions, class names, and visual aesthetics.
  * Touch ONLY the specific lines causing the bug, runtime crash, broken state, or type error.
  * Be a surgical engineer: fix the exact faulty logic or syntax without interfering with the visual design.

2. ON-DEMAND UI & MOTION REFINEMENT (ONLY WHEN EXPLICITLY REQUESTED):
- ONLY when the developer explicitly asks to improve the design, polish UI, enhance animations, or make it look/feel better:
  * Apply premium visual aesthetics inspired by modern design systems (Linear, Vercel, Apple, Stripe).
  * Use fluid Framer Motion spring physics (e.g., transition={{ type: "spring", stiffness: 350, damping: 25 }}) instead of sluggish or robotic linear transitions.
  * Ensure refined typography, subtle borders (e.g. border-border/40), and crisp optical spacing.
  * Ensure full Light and Dark mode contrast balance.
  * Provide tasteful micro-interactions (hover, active tap states like 'whileTap={{ scale: 0.98 }}', accessible focus-visible rings).

3. 100% COPY-PASTE & REUSABLE STANDARDS:
  * Always include '"use client";' at the very top of "component.tsx" whenever hooks (useState, useEffect, useRef, etc.) or interactive events are used.
  * Export a single main component with an explicit TypeScript Props interface extending standard HTML attributes (e.g., 'export interface ComponentProps extends React.HTMLAttributes<HTMLDivElement>').
  * Merge custom className using 'cn(...)' from '@/lib/utils'.
  * Avoid hardcoded absolute pixel widths where responsive layout is expected; prefer flex, grid, and Tailwind responsive utilities.
  * "demo.tsx" must have default export 'export default function Demo() { ... }' demonstrating realistic, beautiful mock content.

CRITICAL CODE MODIFICATION RULES:
- Never return partial code, pseudocode, or '// rest of code stays the same' comments.
- Always provide the COMPLETE, compilable, valid TypeScript code for any modified file in the "changedFiles" object.`;

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const {
      prompt,
      action = "chat",
      componentCode = "",
      demoCode = "",
      cssCode = "",
      dependencies = [],
      model: requestedModel = "gemini-3.8-flash",
      role: requestedRole = "architect",
      history = [],
      images = [],
      codeSnippets = [],
    } = body;

    // Sanitize and validate model choice
    let activeModel = "gemini-3.8-flash";
    if (requestedModel && VALID_MODELS.includes(requestedModel)) {
      activeModel = requestedModel;
    } else if (requestedModel?.includes("argon") || requestedModel?.includes("pro")) {
      activeModel = "gemini-4-argon";
    } else if (requestedModel?.includes("lite")) {
      activeModel = "gemini-3.1-flash-lite";
    }

    // Run static guideline audit first (instant zero-latency baseline)
    const staticAudit = auditComponentGuidelines(
      componentCode,
      demoCode,
      cssCode,
      dependencies
    );

    const apiKey = (body.apiKey || process.env.GEMINI_API_KEY)?.trim();

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
        reasoningSummary: `Executed static guideline verification across component.tsx, demo.tsx, and index.css (score: ${staticAudit.score}/100).`,
        message:
          action === "audit"
            ? `Static 21st.dev compliance score: ${staticAudit.score}/100. ${
                issueTexts.length > 0
                  ? `Identified ${issueTexts.length} issue(s) to address.`
                  : "All foundational 21st.dev guidelines satisfied!"
              }`
            : "Gemini AI is ready. Ensure GEMINI_API_KEY is configured in your server environment to execute multi-turn conversational modifications.",
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

CONVERSATION & RESPONSE INSTRUCTIONS:
- You are engaged in a multi-turn conversation with the developer. Maintain full context across previous turns.
- Provide insightful, friendly, and technically precise feedback.
- Document your internal chain-of-thought in "reasoningSteps" (3 to 4 sequential thoughts where each step has a short "title", a natural 1-sentence "description" of the work/analysis done in that step, and an optional "detail" like a filename) and a 1-sentence "reasoningSummary".
- MULTIMODAL CAPABILITY: If image attachments are provided (mockups, wireframes, screenshots), carefully analyze their visual hierarchy, typography, colors, padding, alignment, and motion cues, and implement matching production React + Tailwind code.
- CODE ATTACHMENT CAPABILITY: If external code snippets or references are attached, analyze their logic, interfaces, or styles and integrate them into component.tsx / demo.tsx / index.css.
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
    "demo.tsx": "<COMPLETE compilable code if changed, or null>",
    "index.css": "<COMPLETE compilable code if changed, or null>"
  }
}
CRITICAL: Never output partial code with placeholders like '// rest of code'. Changed files must be complete and compilable.`;

    // Filter and build multi-turn contents from conversation history
    const contents: Array<{
      role: "user" | "model";
      parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      >;
    }> = [];

    // Add prior valid conversation turns (limiting to last 10 turns for token efficiency)
    const recentHistory = history.slice(-10);
    for (const item of recentHistory) {
      if (item.role === "system") continue;
      const turnRole = item.role === "assistant" || item.role === "model" ? "model" : "user";
      if (item.content && item.content.trim()) {
        contents.push({
          role: turnRole,
          parts: [{ text: item.content.trim() }],
        });
      }
    }

    // Construct the current turn message with live editor context
    const userPrompt = prompt || (action === "autofix" ? "Auto-fix any guideline violations" : "Audit this component");
    let currentTurnText = `Current Editor Context:
Active Dependencies: ${JSON.stringify(dependencies)}

--- component.tsx ---
${componentCode}

--- demo.tsx ---
${demoCode}

--- index.css ---
${cssCode}

User Request (${action}):
${userPrompt}`;

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

    contents.push({
      role: "user",
      parts: userParts,
    });

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
    let parsedResult: {
      reasoningSteps?: Array<{ title: string; description?: string; detail?: string }>;
      reasoningSummary?: string;
      message?: string;
      complianceScore?: number;
      issuesFound?: string[];
      issuesFixed?: string[];
      changedFiles?: Partial<Record<string, string | null>>;
    };

    try {
      parsedResult = JSON.parse(textOutput);
    } catch {
      // Fallback in case of markdown codeblock wrapping
      const cleaned = textOutput.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1").trim();
      parsedResult = JSON.parse(cleaned);
    }

    // Filter changedFiles so only non-null, non-empty modified files are returned
    const sanitizedChangedFiles: Partial<Record<string, string>> = {};
    if (parsedResult.changedFiles && typeof parsedResult.changedFiles === "object") {
      const origMap: Record<string, string> = {
        "component.tsx": componentCode,
        "demo.tsx": demoCode,
        "index.css": cssCode,
      };
      for (const [k, val] of Object.entries(parsedResult.changedFiles)) {
        if (
          typeof val === "string" &&
          val.trim().length > 0 &&
          val !== "null" &&
          val.trim() !== (origMap[k] || "").trim()
        ) {
          sanitizedChangedFiles[k] = val;
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
      message.includes("unauthenticated") ||
      message.includes("401");

    return NextResponse.json(
      {
        success: false,
        error: isApiKeyError
          ? "Invalid Gemini API Key in server environment."
          : `AI Assistant Error: ${message}`,
        isApiKeyError,
      },
      { status: isApiKeyError ? 401 : 500 }
    );
  }
}
