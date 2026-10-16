import { NextRequest, NextResponse } from "next/server";
import { generateTwentyFirstPayload } from "@/lib/sandbox/ast-parser";

export async function POST(req: NextRequest) {
  try {
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
