import { NextRequest, NextResponse } from "next/server";
import prettier from "prettier";

export async function POST(req: NextRequest) {
  try {
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
