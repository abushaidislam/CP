import { NextRequest, NextResponse } from "next/server";
import { parseComponentAST } from "@/lib/sandbox/ast-parser";

export async function POST(req: NextRequest) {
  try {
    const { componentCode, demoCode, cssCode } = await req.json();

    if (!componentCode || typeof componentCode !== "string") {
      return NextResponse.json({ error: "componentCode is required" }, { status: 400 });
    }

    const ast = parseComponentAST(componentCode, demoCode, cssCode);
    return NextResponse.json(ast);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to parse AST";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
