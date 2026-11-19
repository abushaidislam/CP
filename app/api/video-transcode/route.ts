import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, unlink, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const MAX_UPLOAD_BYTES = 150 * 1024 * 1024; // 150 MB guard

async function resolveFfmpegPath(): Promise<string | null> {
  const candidates = ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"];
  for (const candidate of candidates) {
    if (candidate === "ffmpeg") {
      try {
        await execFileAsync("ffmpeg", ["-version"], { timeout: 3000 });
        return "ffmpeg";
      } catch {
        continue;
      }
    }
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

export async function GET() {
  const ffmpegPath = await resolveFfmpegPath();
  return NextResponse.json({
    available: Boolean(ffmpegPath),
    encoder: ffmpegPath ? "libx264" : null,
  });
}

export async function POST(req: NextRequest) {
  const ffmpegPath = await resolveFfmpegPath();
  if (!ffmpegPath) {
    return NextResponse.json(
      { error: "FFmpeg encoder is not available on this server. Download WebM instead." },
      { status: 503 }
    );
  }

  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const formData = await req.formData();
    const fileEntry = formData.get("file");
    if (!fileEntry || !(fileEntry instanceof Blob)) {
      return NextResponse.json({ error: "Missing video file payload." }, { status: 400 });
    }

    if (fileEntry.size === 0) {
      return NextResponse.json({ error: "Uploaded video recording is empty." }, { status: 400 });
    }

    if (fileEntry.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Recording exceeds the 150 MB transcode limit." },
        { status: 413 }
      );
    }

    const rawFps = Number(formData.get("fps") || 60);
    const fps = rawFps === 30 ? 30 : 60;
    const resolution = formData.get("resolution") === "720p" ? "720p" : "1080p";
    const width = resolution === "720p" ? 1280 : 1920;
    const height = resolution === "720p" ? 720 : 1080;

    const jobId = randomUUID();
    inputPath = join(tmpdir(), `studio-video-in-${jobId}.webm`);
    outputPath = join(tmpdir(), `studio-video-out-${jobId}.mp4`);

    const arrayBuffer = await fileEntry.arrayBuffer();
    await writeFile(inputPath, Buffer.from(arrayBuffer));

    const scaleFilter = `scale=${width}:${height}:flags=lanczos:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;

    await execFileAsync(
      ffmpegPath,
      [
        "-y",
        "-i",
        inputPath,
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-r",
        String(fps),
        "-vf",
        scaleFilter,
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      { timeout: 90_000, maxBuffer: 10 * 1024 * 1024 }
    );

    const mp4Buffer = await readFile(outputPath);

    return new NextResponse(new Uint8Array(mp4Buffer), {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(mp4Buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to transcode MP4 video.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (inputPath) {
      await unlink(inputPath).catch(() => {});
    }
    if (outputPath) {
      await unlink(outputPath).catch(() => {});
    }
  }
}
