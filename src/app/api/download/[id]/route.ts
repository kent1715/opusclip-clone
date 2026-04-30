import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync, unlinkSync, createReadStream } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const auth = await requireAuth(userId);

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get clip with video info
    const clip = await db.clip.findUnique({
      where: { id },
      include: { video: true },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Verify ownership
    if (clip.video.userId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const sourceUrl = clip.video.sourceUrl;
    const startSeconds = parseTimeToSeconds(clip.startTime);
    const durationSeconds = parseTimeToSeconds(clip.duration);
    const jobId = randomUUID();
    const tmpDir = join(/*turbopackIgnore: true*/ process.cwd(), "download");
    const sourceFile = join(tmpDir, `source_${jobId}.mp4`);
    const outputFile = join(tmpDir, `clip_${jobId}.mp4`);

    try {
      // Step 1: Download source video using yt-dlp
      await execFileAsync("yt-dlp", [
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "-o", sourceFile,
        "--no-playlist",
        "--max-filesize", "500M",
        sourceUrl,
      ], { timeout: 300000 }); // 5 min timeout

      // Step 2: Extract clip using ffmpeg
      await execFileAsync("ffmpeg", [
        "-y",
        "-ss", startSeconds.toString(),
        "-i", sourceFile,
        "-t", durationSeconds.toString(),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        outputFile,
      ], { timeout: 120000 }); // 2 min timeout

      // Step 3: Stream the file back
      if (!existsSync(outputFile)) {
        throw new Error("Output file was not created");
      }

      const fileStream = createReadStream(outputFile);

      // Convert Node.js ReadStream to Web ReadableStream
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          fileStream.on("end", () => {
            controller.close();
            // Cleanup files after streaming
            setTimeout(() => {
              try { unlinkSync(sourceFile); } catch {}
              try { unlinkSync(outputFile); } catch {}
            }, 1000);
          });
          fileStream.on("error", (err) => {
            controller.error(err);
          });
        },
      });

      const safeTitle = (clip.title || "clip").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);

      return new Response(readableStream, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="${safeTitle}.mp4"`,
          "Cache-Control": "no-cache",
        },
      });
    } catch (ffmpegError) {
      // Cleanup on error
      try { unlinkSync(sourceFile); } catch {}
      try { unlinkSync(outputFile); } catch {}
      throw ffmpegError;
    }
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download clip. " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}
