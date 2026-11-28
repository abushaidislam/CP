import { NextRequest, NextResponse } from "next/server";
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
import { runAiCopilotPipeline } from "@/lib/ai/gemini-orchestrator";
import { listSelectableRegistryReferences } from "@/lib/ai/registry-reference-retriever";
import type { AiAssistantRequestBody } from "@/lib/ai/types";

/**
 * GET /api/ai-assistant
 * Lists registered components with preview images so the Copilot UI can
 * let the developer browse or pin visual design references.
 */
export async function GET(req: NextRequest) {
  try {
    const originCheck = verifySameOriginRequest(req);
    if (!originCheck.valid) {
      return NextResponse.json(
        { success: false, error: originCheck.reason || "Cross-origin request rejected." },
        { status: 403 }
      );
    }

    const q = req.nextUrl.searchParams.get("q") || undefined;
    const category = req.nextUrl.searchParams.get("category") || undefined;
    const references = await listSelectableRegistryReferences(q, category);

    return NextResponse.json({
      success: true,
      references,
      total: references.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Failed to list registry references: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-assistant
 * Security-hardened entrypoint for the re-architected Component Studio AI Copilot:
 * 1. Security Shield (CSRF, Owner Session Auth, Sliding-Window Rate Limit, Daily Quota)
 * 2. Deep Workspace AST + 21st.dev Dossier
 * 3. Smart Selective Intent Router & Multimodal Registry Visual Grounding
 * 4. Gemini 4 Multi-Turn Orchestration + Structured Blueprint
 * 5. Sucrase TSX Compile Verification + Automatic Self-Repair Loop
 */
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

    // 5. Enforce streaming payload size cap (12MB max for multimodal image prompts)
    const parsedBody = await readJsonWithLimit<AiAssistantRequestBody>(
      req,
      12 * 1024 * 1024
    );
    if (!parsedBody.ok) {
      return parsedBody.errorResponse;
    }

    // Server-only API key enforcement
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    const result = await runAiCopilotPipeline(parsedBody.data, apiKey);
    const dailyQuota =
      result.source === "gemini-api"
        ? incrementDailyAiQuota()
        : getDailyQuotaSummary();

    return NextResponse.json({
      success: true,
      dailyQuota,
      ...result,
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
    const isOverloadError =
      message.includes("UNAVAILABLE") ||
      message.includes("503") ||
      message.includes("high demand");
    const isNotFoundError =
      message.includes("NOT_FOUND") || message.includes("404");

    let userFriendlyError = `AI Assistant Error: ${message}`;
    if (isApiKeyError) {
      userFriendlyError =
        "Invalid or unauthorized Gemini API Key. Please check GEMINI_API_KEY in Settings > Secrets.";
    } else if (isOverloadError) {
      userFriendlyError =
        "Gemini models are currently experiencing high demand (503). Please click Retry in a few seconds.";
    } else if (isQuotaError) {
      userFriendlyError =
        "Gemini API rate limit or quota exceeded (429). Try switching to Gemini 3.1 Flash Lite or retry shortly.";
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
      {
        status: isApiKeyError
          ? 401
          : isQuotaError
          ? 429
          : isOverloadError
          ? 503
          : isNotFoundError
          ? 404
          : 500,
      }
    );
  }
}
