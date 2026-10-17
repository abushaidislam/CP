import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auditComponentGuidelines } from "@/lib/sandbox/guideline-linter";

interface RequestBody {
  prompt?: string;
  action?: "audit" | "chat" | "autofix";
  componentCode: string;
  demoCode?: string;
  cssCode?: string;
  dependencies?: string[];
  apiKey?: string;
  model?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const {
      prompt,
      action = "audit",
      componentCode,
      demoCode = "",
      cssCode = "",
      dependencies = [],
      apiKey: clientApiKey,
      model = "gemini-2.5-flash",
    } = body;

    if (!componentCode && componentCode !== "") {
      return NextResponse.json(
        { error: "componentCode is required" },
        { status: 400 }
      );
    }

    // Run static guideline audit first (always available, 0ms latency)
    const staticAudit = auditComponentGuidelines(
      componentCode,
      demoCode,
      cssCode,
      dependencies
    );

    // Resolve API Key: client provided key (from local storage) OR environment variable
    const resolvedApiKey = clientApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

    // If no Gemini API key is configured, return static analysis with helpful guidance
    if (!resolvedApiKey) {
      const issueTexts = staticAudit.checks
        .filter((c) => !c.passed)
        .map((c) => `${c.title}: ${c.description}`);

      return NextResponse.json({
        success: true,
        source: "static-linter",
        hasApiKey: false,
        complianceScore: staticAudit.score,
        checks: staticAudit.checks,
        message:
          action === "audit"
            ? `Static 21st.dev compliance score: ${staticAudit.score}/100. ${
                issueTexts.length > 0
                  ? `Identified ${issueTexts.length} issue(s) to address.`
                  : "All foundational 21st.dev guidelines satisfied!"
              }`
            : "Connect your free Google AI Studio API key (aistudio.google.com) to enable AI generative code modification and auto-fixes.",
        issuesFound: issueTexts,
        issuesFixed: [],
        changedFiles: {},
      });
    }

    // Initialize Gemini SDK with resolved key
    const client = new GoogleGenAI({ apiKey: resolvedApiKey });

    const systemInstruction = `You are the official 21st.dev AI Component Copilot.
Your mission is to audit, polish, and modify React/TypeScript components to meet 21st.dev and shadcn/ui marketplace standards.

21st.dev Component Authoring Guidelines:
1. Directive: Include '"use client";' as the very first line if the component uses React hooks (useState, useEffect, useRef, etc.) or DOM events.
2. Structure: Export a single reusable component (default export or named export).
3. Types: Define and export a TypeScript Props interface:
   'export interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> { ... }'
4. Customization: Component MUST accept 'className?: string' and merge it into the root element using 'cn(...)'.
5. Utility: Use 'cn(...)' from '@/lib/utils' for Tailwind class merging.
6. Theming: Support both Light and Dark mode using 'dark:' variants (e.g. 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800') or CSS variables.
7. Responsiveness: Use Tailwind breakpoints (sm:, md:, lg:, w-full, max-w-*).
8. Demo: 'demo.tsx' must export 'default function Demo()' and showcase the component cleanly with a preview wrapper.
9. Dependencies: Only use standard libraries like 'lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'.

Response Format:
You MUST respond with a valid JSON object matching this exact structure:
{
  "message": "Friendly, concise summary explaining what you inspected or changed (use markdown if helpful)",
  "complianceScore": <integer 0-100>,
  "issuesFound": ["List of identified issues or missing guidelines"],
  "issuesFixed": ["List of issues you fixed in the updated code"],
  "changedFiles": {
    "component.tsx": "<COMPLETE updated code if modified, otherwise null>",
    "demo.tsx": "<COMPLETE updated code if modified, otherwise null>",
    "index.css": "<COMPLETE updated code if modified, otherwise null>"
  }
}
CRITICAL: When providing changedFiles, provide the FULL, valid, compilable code without placeholders or comments like '// rest of code'. If a file was not changed, omit it or set it to null.`;

    const userPromptText = `
User Action: ${action}
User Request: ${prompt || "Perform a full 21st.dev guidelines compliance audit and auto-fix any issues."}

Active Dependencies: ${JSON.stringify(dependencies)}

--- component.tsx ---
${componentCode}

--- demo.tsx ---
${demoCode}

--- index.css ---
${cssCode}
`;

    const response = await client.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: userPromptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text || "";
    let parsedResult;
    try {
      parsedResult = JSON.parse(textOutput);
    } catch {
      // Fallback in case of markdown codeblock wrapping
      const cleaned = textOutput.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1").trim();
      parsedResult = JSON.parse(cleaned);
    }

    return NextResponse.json({
      success: true,
      source: "gemini-api",
      hasApiKey: true,
      complianceScore: parsedResult.complianceScore ?? staticAudit.score,
      message: parsedResult.message || "Component reviewed successfully.",
      issuesFound: parsedResult.issuesFound || [],
      issuesFixed: parsedResult.issuesFixed || [],
      changedFiles: parsedResult.changedFiles || {},
      checks: staticAudit.checks,
    });
  } catch (err: unknown) {
    console.error("[AI Assistant API Error]:", err);
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
          ? "Invalid Google Gemini API Key. Please verify your key from Google AI Studio (aistudio.google.com)."
          : `AI Assistant Error: ${message}`,
        isApiKeyError,
      },
      { status: isApiKeyError ? 401 : 500 }
    );
  }
}
