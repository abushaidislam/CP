import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { resolveSafeComponentDir } from "@/lib/registry/server-registry";

export const runtime = "nodejs";

function detectImageContentType(buf: Buffer): string {
  if (
    buf.length >= 4 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  const head = buf.subarray(0, 64).toString("utf-8").trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    return "image/svg+xml";
  }
  return "image/png";
}

async function readManifestSvgFallback(compDir: string): Promise<Buffer | null> {
  try {
    const raw = await fs.readFile(path.join(compDir, "manifest.json"), "utf-8");
    const parsed = JSON.parse(raw) as { previewImage?: string };
    const preview = parsed.previewImage;
    if (!preview) return null;
    if (preview.startsWith("data:image/svg+xml;utf8,")) {
      return Buffer.from(
        decodeURIComponent(preview.slice("data:image/svg+xml;utf8,".length)),
        "utf-8"
      );
    }
    if (preview.startsWith("data:image/svg+xml;charset=utf-8,")) {
      return Buffer.from(
        decodeURIComponent(
          preview.slice("data:image/svg+xml;charset=utf-8,".length)
        ),
        "utf-8"
      );
    }
    if (preview.startsWith("data:image/svg+xml;base64,")) {
      return Buffer.from(
        preview.slice("data:image/svg+xml;base64,".length),
        "base64"
      );
    }
    return null;
  } catch {
    return null;
  }
}

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
    let imgBuffer: Buffer | null = null;
    try {
      const diskBuf = await fs.readFile(pngPath);
      if (diskBuf.byteLength > 0) {
        imgBuffer = diskBuf;
      }
    } catch {
      // Fall through to manifest SVG fallback
    }

    if (!imgBuffer) {
      imgBuffer = await readManifestSvgFallback(compDir);
    }

    if (!imgBuffer || imgBuffer.byteLength === 0) {
      return new NextResponse("Preview not found", { status: 404 });
    }

    const contentType = detectImageContentType(imgBuffer);
    const etag = `"${createHash("sha1").update(imgBuffer).digest("hex").slice(0, 16)}"`;
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
    return new NextResponse(new Uint8Array(imgBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(imgBuffer.byteLength),
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
