import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { resolveSafeComponentDir } from "@/lib/registry/server-registry";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug || slug.length > 160) {
      return new NextResponse("Invalid component slug", { status: 400 });
    }

    let compDir: string;
    try {
      compDir = resolveSafeComponentDir(process.cwd(), slug);
    } catch {
      return new NextResponse("Invalid component slug", { status: 400 });
    }

    const pngPath = path.join(compDir, "preview.png");
    let pngBuffer: Buffer;
    try {
      pngBuffer = await fs.readFile(pngPath);
    } catch {
      return new NextResponse("Preview not found", { status: 404 });
    }

    if (pngBuffer.byteLength === 0) {
      return new NextResponse("Preview not found", { status: 404 });
    }

    const etag = `"${createHash("sha1").update(pngBuffer).digest("hex").slice(0, 16)}"`;
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const hasVersionParam = Boolean(req.nextUrl.searchParams.get("v"));
    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(pngBuffer.byteLength),
        ETag: etag,
        "Cache-Control": hasVersionParam
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Failed to load preview image", { status: 500 });
  }
}
