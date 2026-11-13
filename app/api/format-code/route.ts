import { NextRequest, NextResponse } from "next/server";
import prettier from "prettier";
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

    const rateCheck = checkRateLimit(getClientIp(req), "format-code", 40, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded for code formatting." },
        { status: 429 }
      );
    }

    const { code, filename } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code string is required" }, { status: 400 });
    }

    const isCss = filename?.endsWith(".css");
    const parser = isCss ? "css" : "typescript";

    const formatted = await prettier.format(code, {
      parser,
      semi: true,
      singleQuote: false,
      tabWidth: 2,
      trailingComma: "es5",
      bracketSpacing: true,
    });

    return NextResponse.json({ formatted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Formatting failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
