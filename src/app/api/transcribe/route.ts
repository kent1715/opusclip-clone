import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

const execFileAsync = promisify(execFile);

// On EC2, use the whisper virtual environment python; on dev, use regular python3
function getPythonCmd(): string {
  return existsSync("/opt/whisper-venv/bin/python")
    ? "/opt/whisper-venv/bin/python"
    : "python3";
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const auth = await requireAuth(userId);

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { videoUrl, language } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "videoUrl is required" },
        { status: 400 }
      );
    }

    const jobId = Date.now().toString(36);
    const tmpDir = join(/*turbopackIgnore: true*/ process.cwd(), "download");
    const sourceFile = join(tmpDir, `stt_source_${jobId}.mp4`);

    try {
      // Step 1: Download video if it's a URL
      if (videoUrl.startsWith("/api/upload/serve")) {
        // Local uploaded file - construct full path
        const fileName = new URL(videoUrl, "http://localhost").searchParams.get("file") || "";
        if (fileName) {
          const localPath = join(/*turbopackIgnore: true*/ process.cwd(), "upload", fileName.replace(/[^a-zA-Z0-9._-]/g, ""));
          if (existsSync(localPath)) {
            // Use the local file directly
            return await transcribeFile(localPath, language, "");
          }
        }
      }

      // Download from URL using yt-dlp
      await execFileAsync("yt-dlp", [
        "--js-runtimes", "deno",
        "-f", "bestaudio",
        "-x", "--audio-format", "wav",
        "-o", sourceFile,
        "--no-playlist",
        "--max-filesize", "200M",
        videoUrl,
      ], { timeout: 180000 });

      if (!existsSync(sourceFile)) {
        // Try without extension change
        const wavFile = sourceFile.replace(".mp4", ".wav");
        if (existsSync(wavFile)) {
          const result = await transcribeFile(wavFile, language, wavFile);
          return result;
        }
        throw new Error("Failed to download audio");
      }

      return await transcribeFile(sourceFile, language, sourceFile);
    } catch (innerError) {
      // Cleanup
      try { unlinkSync(sourceFile); } catch {}
      throw innerError;
    }
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

async function transcribeFile(
  filePath: string,
  language: string | undefined,
  cleanupFile: string
): Promise<NextResponse> {
  try {
    const pythonScript = join(/*turbopackIgnore: true*/ process.cwd(), "mini-services", "whisper_transcribe.py");
    const args = [pythonScript, filePath, "--output-format", "json", "--model", "small"];
    if (language && language !== "auto") {
      args.push("--language", language);
    }

    const pythonCmd = getPythonCmd();
    const { stdout } = await execFileAsync(pythonCmd, args, {
      timeout: 300000, // 5 minutes
      maxBuffer: 10 * 1024 * 1024,
    });

    // Cleanup temp file
    if (cleanupFile) {
      try { unlinkSync(cleanupFile); } catch {}
    }

    const result = JSON.parse(stdout);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Convert segments to pipe-separated captions format
    const captionLines = result.segments.map(
      (seg: { text: string }) => seg.text
    );
    const captions = captionLines.join("|");

    // Also format as SRT
    let srtContent = "";
    result.segments.forEach(
      (seg: { start: number; end: number; text: string }, i: number) => {
        const start = formatTimestamp(seg.start);
        const end = formatTimestamp(seg.end);
        srtContent += `${i + 1}\n${start} --> ${end}\n${seg.text}\n\n`;
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        captions,
        captionLines,
        srtContent,
        language: result.language,
        languageProbability: result.language_probability,
        duration: result.duration,
        segmentCount: result.segments.length,
      },
    });
  } catch (error) {
    // Cleanup temp file
    if (cleanupFile) {
      try { unlinkSync(cleanupFile); } catch {}
    }
    throw error;
  }
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}
