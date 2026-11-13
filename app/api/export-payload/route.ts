import { NextRequest, NextResponse } from "next/server";
import { generateTwentyFirstPayload } from "@/lib/sandbox/ast-parser";
import {
  checkRateLimit,
  getClientIp,
  verifyPayloadSize,
  verifySameOriginRequest,
} from "@/lib/security/api-guard";

export async function POST(req: NextRequest) {
  try {
    const sizeCheck = verifyPayloadSize(req, 512 * 1024);
    if (!sizeCheck.valid && sizeCheck.errorResponse) {
      return sizeCheck.errorResponse;
    }

    const originCheck = verifySameOriginRequest(req);
    if (!originCheck.valid) {
      return NextResponse.json({ error: originCheck.reason || "Forbidden" }, { status: 403 });
    }

    const rateCheck = checkRateLimit(getClientIp(req), "export-payload", 40, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const { componentCode, demoCode, cssCode, overrides } = await req.json();

    if (!componentCode) {
      return NextResponse.json({ error: "componentCode is required" }, { status: 400 });
    }

    const payload = generateTwentyFirstPayload(
      componentCode,
      demoCode || "",
      cssCode || "",
      overrides
    );

    return NextResponse.json(payload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate payload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
