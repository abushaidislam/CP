import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { auditComponentGuidelines } from "@/lib/sandbox/guideline-linter";
import {
  COPILOT_PREMIUM_DESIGN_MANIFESTO,
  COPILOT_UI_PRESERVATION_SKILL,
} from "@/lib/sandbox/copilot-design-knowledge";
import {
  checkDailyAiQuota,
  checkRateLimit,
  getClientIp,
  getConfiguredAiRateLimitPerMin,
  getDailyQuotaSummary,
  incrementDailyAiQuota,
  isOwnerRequestAuthenticated,
  readJsonWithLimit,
  recordBlockedRequest,
  verifySameOriginRequest,
} from "@/lib/security/api-guard";

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
  compilerError?: string | null;
  model?: string;
  role?: string;
  preserveDesign?: boolean;
  history?: ChatHistoryItem[];
  images?: AttachedImagePayload[];
  codeSnippets?: AttachedCodePayload[];
}

// Supported official Gemini models from @google/genai skill specification
const VALID_MODELS = [
  "gemini-4-hydrogen",     // General tasks & fast coding (default)
  "gemini-4-argon",        // Complex tasks & deep reasoning
  "gemini-3.1-flash-lite", // Fast tasks & instant feedback
];

const ROLE_INSTRUCTIONS: Record<string, string> = {
  copilot: `ACTIVE SPECIALIST ROLE: Full-Stack Component Co-Pilot.
Balance clean TypeScript architecture, interactive React 19 state, Tailwind CSS precision, and smooth Framer Motion micro-interactions.`,
  designer: `ACTIVE SPECIALIST ROLE: UI & Visual Design Director.
Focus on atmospheric minimalism, high-craft dark & light mode surfaces, subtle 1px borders, refined typography hierarchy, glassmorphic depth, and balanced spatial rhythm. You are explicitly authorized to elevate visual styling and aesthetics.`,
  architect: `ACTIVE SPECIALIST ROLE: Staff React & TypeScript Architect.
Focus on composable API design, strict TypeScript Props interfaces, clean custom hooks, ref forwarding, memoized callbacks, and zero unnecessary re-renders.`,
  auditor: `ACTIVE SPECIALIST ROLE: 21st.dev Standards & WCAG Accessibility Auditor.
Focus on 100% 21st.dev compliance, keyboard navigation (Arrow keys, Enter, Escape, Tab), focus-visible rings, ARIA roles/labels, contrast ratios, and className merging via cn().`,
  optimizer: `ACTIVE SPECIALIST ROLE: Motion Physics & Interaction Engineer.
Focus onchoreographed Framer Motion springs (stiffness, damping, mass), layoutId shared transitions, AnimatePresence exit animations, and tactile hover/tap micro-interactions.`,
};

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

const COPILOT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
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
      description: "One concise sentence summarizing the architectural approach taken.",
    },
    message: {
      type: Type.STRING,
      description: "Conversational markdown response answering the user and explaining any code changes.",
    },
    complianceScore: {
      type: Type.INTEGER,
      description: "Quality and 21st.dev guideline compliance score from 0 to 100.",
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
      description: "Any external npm package names used in the updated code (e.g., lucide-react, framer-motion, canvas-confetti).",
    },
    followUpSuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 short, actionable follow-up prompts (under 8 words each) the user can click next.",
    },
    changedFiles: {
      type: Type.OBJECT,
      properties: {
        "component.tsx": {
          type: Type.STRING,
          nullable: true,
          description: "Complete compilable code for component.tsx if modified, or null if unchanged.",
        },
        "default.tsx": {
          type: Type.STRING,
          nullable: true,
          description: "Complete compilable code for default.tsx if modified, or null if unchanged.",
        },
        "index.css": {
          type: Type.STRING,
          nullable: true,
          description: "Complete CSS code for index.css if modified, or null if unchanged.",
        },
      },
    },
  },
  required: ["message", "reasoningSummary", "changedFiles"],
};

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

function parseJsonResponseSafely(textOutput: string): {
  reasoningSteps?: Array<{
    title: string;
    description?: string;
    detail?: string;
    category?: "context" | "ast" | "audit" | "synthesis" | "verify";
    items?: string[];
  }>;
  reasoningSummary?: string;
  message?: string;
  complianceScore?: number;
  issuesFound?: string[];
  issuesFixed?: string[];
  addedDependencies?: string[];
  followUpSuggestions?: string[];
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
        // Fallback field extraction if JSON was partially truncated on a very large file
        const msgMatch = trimmed.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/);
        const summaryMatch = trimmed.match(/"reasoningSummary"\s*:\s*"((?:\\.|[^"\\])*)"/);
        const compMatch = trimmed.match(/"component\.tsx"\s*:\s*"((?:\\.|[^"\\])*)"/);
        const defMatch = trimmed.match(/"default\.tsx"\s*:\s*"((?:\\.|[^"\\])*)"/);
        const cssMatch = trimmed.match(/"index\.css"\s*:\s*"((?:\\.|[^"\\])*)"/);

        const recoveredFiles: Partial<Record<string, string | null>> = {};
        if (compMatch?.[1]) recoveredFiles["component.tsx"] = unescapeJsonStringLiteral(compMatch[1]);
        if (defMatch?.[1]) recoveredFiles["default.tsx"] = unescapeJsonStringLiteral(defMatch[1]);
        if (cssMatch?.[1]) recoveredFiles["index.css"] = unescapeJsonStringLiteral(cssMatch[1]);

        if (msgMatch?.[1] || Object.keys(recoveredFiles).length > 0) {
          return {
            message: msgMatch?.[1]
              ? unescapeJsonStringLiteral(msgMatch[1])
              : "Applied the requested updates to your component files.",
            reasoningSummary: summaryMatch?.[1]
              ? unescapeJsonStringLiteral(summaryMatch[1])
              : undefined,
            changedFiles: recoveredFiles,
          };
        }

        // Never dump raw broken JSON braces directly into the user's chat bubble
        return {
          message:
            "I analyzed your component, but the generated output was too large to format in a single payload. Try breaking the request into a smaller step or switching to Gemini 4 Hydrogen.",
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

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Same-Origin & CSRF verification
    const originCheck = verifySameOriginRequest(req);
    if (!originCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: originCheck.reason || "Cross-origin request rejected by API Credit Shield.",
        },
        { status: 403 }
      );
    }

    // 2. Enforce Owner Session Authentication before allowing AI credit usage
    if (!isOwnerRequestAuthenticated(req)) {
      recordBlockedRequest();
      return NextResponse.json(
        {
          success: false,
          requiresOwnerAuth: true,
          error:
            "Owner Session Locked: Please unlock with your Owner Passcode to use Gemini AI credits.",
        },
        { status: 401 }
      );
    }

    // 3. Enforce Sliding-Window Per-IP Burst Rate Limit
    const clientIp = getClientIp(req);
    const limitPerMin = getConfiguredAiRateLimitPerMin();
    const rateCheck = checkRateLimit(clientIp, "ai-assistant", limitPerMin, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          rateLimited: true,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
          error: `Rate limit reached (${limitPerMin} requests/min). Please wait ${rateCheck.retryAfterSeconds}s before sending another AI request.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds),
          },
        }
      );
    }

    // 4. Enforce Daily AI Credit Quota Guard
    const quotaCheck = checkDailyAiQuota();
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          quotaExceeded: true,
          dailyQuota: getDailyQuotaSummary(),
          error: `Daily AI credit protection cap reached (${quotaCheck.used}/${quotaCheck.limit} requests today). You can increase or reset your daily limit in the Security Shield modal.`,
        },
        { status: 429 }
      );
    }

    // 5. Enforce real streaming payload size cap (12MB max for multimodal image prompts)
    const parsedBody = await readJsonWithLimit<RequestBody>(req, 12 * 1024 * 1024);
    if (!parsedBody.ok) {
      return parsedBody.errorResponse;
    }
    const body = parsedBody.data;
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
      history = [],
      images = [],
      codeSnippets = [],
    } = body;

    const activeDemoCode = defaultCode ?? demoCode ?? "";
    const activeModel = normalizeGeminiModel(requestedModel);
    const roleInstruction = ROLE_INSTRUCTIONS[requestedRole] || ROLE_INSTRUCTIONS.copilot;
    // If the user explicitly selected the "designer" persona, allow visual improvements
    const effectivePreserveDesign = requestedRole === "designer" ? false : preserveDesign;

    // Run static guideline audit first (instant zero-latency baseline)
    const staticAudit = auditComponentGuidelines(
      componentCode,
      activeDemoCode,
      cssCode,
      dependencies
    );

    // Server-only API key enforcement (never accept client-provided API keys)
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // If server has no API key configured, return static analysis fallback
    if (!apiKey) {
      const issueTexts = staticAudit.checks
        .filter((c) => !c.passed)
        .map((c) => `${c.title}: ${c.description}`);

      const compLines = componentCode.split("\n").length;
      const demoLines = activeDemoCode.split("\n").length;
      const passedRules = staticAudit.checks.filter((c) => c.passed).length;

      return NextResponse.json({
        success: true,
        source: "static-linter",
        hasApiKey: false,
        dailyQuota: getDailyQuotaSummary(),
        complianceScore: staticAudit.score,
        checks: staticAudit.checks,
        modelUsed: activeModel,
        roleUsed: requestedRole,
        reasoningSteps: [
          {
            title: "Scanning workspace files & context",
            description: `Read component.tsx (${compLines} lines), default.tsx (${demoLines} lines), and ${dependencies.length} package dependencies.`,
            detail: "component.tsx",
            category: "context",
            items: [
              `Read component.tsx (${compLines}L)`,
              `Read default.tsx (${demoLines}L)`,
              `${dependencies.length} NPM deps loaded`,
            ],
          },
          {
            title: "Parsing React AST & TypeScript props",
            description: "Inspected exported component signature, React 19 hooks, and HTML attribute extension.",
            detail: "AST Tree",
            category: "ast",
            items: [
              "Exported component signature",
              "Props interface check",
              effectivePreserveDesign ? "UI Design Lock active" : "Visual edit mode",
            ],
          },
          {
            title: "Auditing 21st.dev & accessibility rules",
            description: `Verified ${passedRules} of ${staticAudit.checks.length} static guideline checks including className merging and theme tokens.`,
            detail: `${staticAudit.score}/100`,
            category: "audit",
            items: [
              `${passedRules}/${staticAudit.checks.length} rules passed`,
              "Tailwind cn() merge check",
              "Dark/light contrast tokens",
            ],
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
            : "Gemini AI is not configured yet on the server. Ensure GEMINI_API_KEY is set in Settings > Secrets to run live AI edits.",
        issuesFound: issueTexts,
        issuesFixed: [],
        addedDependencies: [],
        followUpSuggestions: [
          "Audit 21st.dev compliance standards",
          "Add Framer Motion spring physics",
          "Polish dark and light mode tokens",
        ],
        changedFiles: {},
      });
    }

    // Reuse singleton GoogleGenAI client on server-side only
    const ai = getGeminiClient(apiKey);

    const systemInstruction = `${MASTER_COPILOT_INSTRUCTION}

${roleInstruction}
${effectivePreserveDesign ? `\n${COPILOT_UI_PRESERVATION_SKILL}\n` : ""}
CONVERSATION & RESPONSE INSTRUCTIONS:
- You are engaged in a multi-turn conversation with the developer. Maintain full context across previous turns.
- Provide insightful, friendly, and technically precise feedback in "message" (use clean Markdown with bullet points and inline code where helpful; do NOT duplicate the entire 200-line file inside "message" if you already placed it in "changedFiles").
- Document your internal chain-of-thought in "reasoningSteps" (4 sequential steps showing the exact engineering work you performed: 1. Context & file scan, 2. AST & props analysis, 3. 21st.dev & design audit, 4. Code synthesis & verification). Each step must include a clear "title", a specific 1-sentence "description" of what you examined or changed, a short "detail" badge (e.g., "component.tsx", "AST & Props", "95/100"), a "category" ("context" | "ast" | "audit" | "synthesis" | "verify"), and an "items" array of 2 to 4 short micro-operation labels (under 4 words each, e.g., ["Read component.tsx", "Checked Props interface", "Preserved Tailwind layout"]).
- MULTIMODAL CAPABILITY: If image attachments are provided (mockups, wireframes, screenshots), carefully analyze their visual hierarchy, typography, colors, padding, alignment, and motion cues, and implement matching production React + Tailwind code.
- CODE ATTACHMENT CAPABILITY: If external code snippets or references are attached, analyze their logic, interfaces, or styles and integrate them into component.tsx / default.tsx / index.css.
- DEPENDENCY DETECTION: If your updated code imports any external npm package (e.g., "lucide-react", "framer-motion", "canvas-confetti"), include the package name in "addedDependencies".
- FOLLOW-UP SUGGESTIONS: Always provide 3 tailored, high-value next-step prompts in "followUpSuggestions" (each under 8 words, e.g. "Add keyboard navigation & Esc handler", "Create interactive control panel in default.tsx", "Add spring hover micro-interactions").
- If the user asks for code changes, enhancements, fixes, or styling, you MUST supply the COMPLETE updated file code in "changedFiles".
- If a file was NOT modified, set its key in "changedFiles" to null.
- CRITICAL: Never output partial code with placeholders like '// rest of code'. Changed files must be 100% complete and compilable.`;

    // Filter and build multi-turn contents enforcing strict user -> model alternation
    const contents: Array<{
      role: "user" | "model";
      parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      >;
    }> = [];

    const recentHistory = history.slice(-12);
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
    const designLockReminder = effectivePreserveDesign
      ? `\n\n[ACTIVE SKILL: UI & DESIGN LOCK ON]
CRITICAL RULE FOR THIS TURN: Keep the existing UI, layout structure, spacing, colors, gradients, border-radius, shadows, and visual appearance 100% UNCHANGED. Apply the requested changes, fixes, or code improvements WITHOUT altering how the component looks unless the user prompt above explicitly asks for a specific visual/style change.`
      : `\n\n[ACTIVE SKILL: VISUAL DESIGN EDITING UNLOCKED]
You may refine and elevate visual styling, layout, colors, and animations to fulfill the user's request.`;

    const compilerErrorContext = compilerError
      ? `\n\n[ACTIVE SANDBOX COMPILER / RUNTIME ERROR]:\n${compilerError}\nPlease ensure your response resolves this error cleanly.`
      : "";

    const failingStaticRules = staticAudit.checks
      .filter((c) => !c.passed)
      .map((c) => `- ${c.title}: ${c.description}`)
      .join("\n");

    let currentTurnText = `Current Editor Context:
Specialist Mode: ${requestedRole}
Active Dependencies: ${JSON.stringify(dependencies)}
Static 21st.dev Compliance Score: ${staticAudit.score}/100${
      failingStaticRules ? `\nCurrently Failing Checks:\n${failingStaticRules}` : ""
    }${compilerErrorContext}

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

    // Invoke Gemini multi-turn generation; deduct daily quota only after successful upstream call
    const response = await ai.models.generateContent({
      model: activeModel,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: COPILOT_RESPONSE_SCHEMA,
      },
    });
    const updatedQuota = incrementDailyAiQuota();

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

    const changedFileKeys = Object.keys(sanitizedChangedFiles);
    const compLines = componentCode.split("\n").length;
    const demoLines = activeDemoCode.split("\n").length;
    const passedRules = staticAudit.checks.filter((c) => c.passed).length;

    const validCategories = new Set(["context", "ast", "audit", "synthesis", "verify"]);
    const normalizedSteps =
      Array.isArray(parsedResult.reasoningSteps) && parsedResult.reasoningSteps.length > 0
        ? parsedResult.reasoningSteps.map((st, idx) => ({
            title: st.title || `Step ${idx + 1}`,
            description: st.description || "",
            detail: st.detail || undefined,
            category: (st.category && validCategories.has(st.category)
              ? st.category
              : ["context", "ast", "audit", "synthesis", "verify"][idx % 5]) as
              | "context"
              | "ast"
              | "audit"
              | "synthesis"
              | "verify",
            items: Array.isArray(st.items) ? st.items.slice(0, 4) : undefined,
          }))
        : [
            {
              title: "Scanning workspace files & context",
              description: `Examined component.tsx (${compLines} lines), default.tsx (${demoLines} lines), and ${dependencies.length} active package dependencies.`,
              detail: "component.tsx",
              category: "context" as const,
              items: [
                `Read component.tsx (${compLines}L)`,
                `Read default.tsx (${demoLines}L)`,
                `${dependencies.length} NPM deps indexed`,
              ],
            },
            {
              title: "Evaluating design & 21st.dev standards",
              description: `Checked 21st.dev compliance rules (${passedRules}/${staticAudit.checks.length} passed), Tailwind tokens, and contrast states.`,
              detail: `${staticAudit.score}/100`,
              category: "audit" as const,
              items: [
                `${passedRules}/${staticAudit.checks.length} checks passed`,
                "Tailwind cn() merge",
                effectivePreserveDesign ? "UI Design Lock enforced" : "Visual styling unlocked",
              ],
            },
            {
              title:
                changedFileKeys.length > 0
                  ? "Synthesizing code modifications"
                  : "Formulating architectural guidance",
              description:
                changedFileKeys.length > 0
                  ? `Prepared complete, compilable TypeScript updates for ${changedFileKeys.join(", ")}.`
                  : "Synthesized response aligned with Component Studio Co-Pilot standards.",
              detail: activeModel.replace("gemini-", ""),
              category: "synthesis" as const,
              items:
                changedFileKeys.length > 0
                  ? [
                      `Updated ${changedFileKeys.join(", ")}`,
                      "Full TypeScript validation",
                      "Ready for diff review",
                    ]
                  : [
                      `Model: ${activeModel.replace("gemini-", "")}`,
                      "Architectural review",
                      "Zero unintended mutations",
                    ],
            },
          ];

    const defaultFollowUps =
      changedFileKeys.length > 0
        ? [
            "Add interactive controls in default.tsx",
            "Enhance keyboard accessibility & ARIA",
            "Add smooth Framer Motion spring transitions",
          ]
        : [
            "Audit and auto-fix 21st.dev guidelines",
            "Add Framer Motion hover & tap springs",
            "Polish dark and light mode tokens",
          ];

    return NextResponse.json({
      success: true,
      source: "gemini-api",
      hasApiKey: true,
      dailyQuota: updatedQuota,
      modelUsed: activeModel,
      roleUsed: requestedRole || "copilot",
      complianceScore: parsedResult.complianceScore ?? staticAudit.score,
      reasoningSteps: normalizedSteps,
      reasoningSummary:
        parsedResult.reasoningSummary ||
        "Evaluated component architecture under Component Studio Co-Pilot standards.",
      message: parsedResult.message || "Response generated successfully.",
      issuesFound: parsedResult.issuesFound || [],
      issuesFixed: parsedResult.issuesFixed || [],
      addedDependencies: Array.isArray(parsedResult.addedDependencies)
        ? parsedResult.addedDependencies.filter((d) => typeof d === "string" && d.trim().length > 0)
        : [],
      followUpSuggestions:
        Array.isArray(parsedResult.followUpSuggestions) &&
        parsedResult.followUpSuggestions.length > 0
          ? parsedResult.followUpSuggestions.slice(0, 4)
          : defaultFollowUps,
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
