// ─── Shared Transcription Utility ──────────────────────────────────────────
// Used by both /api/transcribe and /api/process routes
// Supports local Whisper (faster-whisper) and cloud API fallback

import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
// ZAI import removed - cloud transcription not yet implemented
// import ZAI from "z-ai-web-dev-sdk";

const execFileAsync = promisify(execFile);

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  captions: string;         // Pipe-separated caption lines
  captionLines: string[];   // Array of caption text lines
  srtContent: string;       // SRT-formatted subtitles
  segments: TranscriptionSegment[];
  language: string;
  languageProbability: number;
  duration: number;
  segmentCount: number;
  source: "whisper-local" | "whisper-api" | "none";
}

// ─── Local Whisper Transcription ────────────────────────────────────────────

async function transcribeWithLocalWhisper(
  filePath: string,
  language?: string
): Promise<TranscriptionResult> {
  const pythonScript = join(
    /*turbopackIgnore: true*/ process.cwd(),
    "mini-services",
    "whisper_transcribe.py"
  );

  // On EC2, use the whisper virtual environment python
  // On dev, use regular python3
  const pythonCmd = existsSync("/opt/whisper-venv/bin/python")
    ? "/opt/whisper-venv/bin/python"
    : "python3";

  const args = [pythonScript, filePath, "--output-format", "json", "--model", "small"];
  if (language && language !== "auto") {
    args.push("--language", language);
  }

  console.log(`[transcribe] Running: ${pythonCmd} ${args.join(" ")}`);

  const { stdout, stderr } = await execFileAsync(pythonCmd, args, {
    timeout: 300000, // 5 minutes
    maxBuffer: 10 * 1024 * 1024,
  });

  if (stderr) {
    console.warn(`[transcribe] Whisper stderr: ${stderr.substring(0, 500)}`);
  }

  const result = JSON.parse(stdout);

  if (result.error) {
    throw new Error(result.error);
  }

  console.log(`[transcribe] Success: ${result.segments?.length || 0} segments, language=${result.language}, duration=${result.duration?.toFixed(1)}s`);

  return formatWhisperResult(result, "whisper-local");
}

// ─── Cloud API Fallback (z-ai-web-dev-sdk) ──────────────────────────────────

async function transcribeWithAPI(
  _filePath: string,
  _language?: string
): Promise<TranscriptionResult | null> {
  // Cloud transcription API not yet implemented
  // TODO: Integrate with OpenAI Whisper API, AssemblyAI, or Deepgram
  console.warn("[transcribe] Cloud transcription API not yet implemented");
  return null;
}

// ─── Format Whisper Result ──────────────────────────────────────────────────

function formatWhisperResult(
  result: {
    segments: TranscriptionSegment[];
    language?: string;
    language_probability?: number;
    duration?: number;
  },
  source: "whisper-local" | "whisper-api"
): TranscriptionResult {
  const segments = result.segments || [];

  // Convert segments to pipe-separated captions format
  const captionLines = segments.map((seg) => seg.text.trim());
  const captions = captionLines.join("|");

  // Also format as SRT
  let srtContent = "";
  segments.forEach((seg, i) => {
    const start = formatTimestamp(seg.start);
    const end = formatTimestamp(seg.end);
    srtContent += `${i + 1}\n${start} --> ${end}\n${seg.text}\n\n`;
  });

  return {
    captions,
    captionLines,
    srtContent,
    segments,
    language: result.language || "unknown",
    languageProbability: result.language_probability || 0,
    duration: result.duration || 0,
    segmentCount: segments.length,
    source,
  };
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().pad(3, "0")}`;
}

// ─── Main Transcription Function ────────────────────────────────────────────
// Attempts local Whisper first, falls back to cloud API, returns null if both fail

export async function transcribeVideo(
  videoUrl: string,
  language?: string,
  onProgress?: (stage: string, message: string) => void
): Promise<TranscriptionResult | null> {
  const jobId = Date.now().toString(36);
  const tmpDir = join(/*turbopackIgnore: true*/ process.cwd(), "download");

  // Ensure download directory exists
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }

  const sourceFile = join(tmpDir, `stt_source_${jobId}`);
  let audioFile = "";

  try {
    // Step 1: Get the audio file
    if (videoUrl.startsWith("/api/upload/serve")) {
      // Local uploaded file
      onProgress?.("downloading-audio", "Reading uploaded audio...");
      const urlObj = new URL(videoUrl, "http://localhost");
      const fileName = urlObj.searchParams.get("file") || "";
      if (fileName) {
        const localPath = join(
          /*turbopackIgnore: true*/ process.cwd(),
          "upload",
          fileName.replace(/[^a-zA-Z0-9._-]/g, "")
        );
        if (existsSync(localPath)) {
          audioFile = localPath;
        }
      }
    } else {
      // Download from URL using yt-dlp
      onProgress?.("downloading-audio", "Downloading audio for transcription...");
      try {
        await execFileAsync(
          "yt-dlp",
          [
            "--js-runtimes",
            "deno",
            "--extractor-args",
            "youtube:player_client=web,mweb",
            "-f",
            "bestaudio",
            "-x",
            "--audio-format",
            "wav",
            "-o",
            sourceFile,
            "--no-playlist",
            "--max-filesize",
            "200M",
            videoUrl,
          ],
          { timeout: 180000 }
        );

        // yt-dlp may change the extension
        if (existsSync(sourceFile + ".wav")) {
          audioFile = sourceFile + ".wav";
        } else if (existsSync(sourceFile + ".mp4")) {
          audioFile = sourceFile + ".mp4";
        } else if (existsSync(sourceFile)) {
          audioFile = sourceFile;
        } else {
          // Try to find any file with the jobId
          const { readdirSync } = await import("fs");
          const files = readdirSync(tmpDir);
          const match = files.find((f) => f.startsWith(`stt_source_${jobId}`));
          if (match) {
            audioFile = join(tmpDir, match);
          }
        }
      } catch (downloadError) {
        console.error("Audio download failed:", downloadError);
      }
    }

    if (!audioFile) {
      console.warn("No audio file available for transcription");
      return null;
    }

    // Step 2: Try local Whisper transcription
    onProgress?.("transcribing", "Transcribing audio with AI...");
    try {
      const result = await transcribeWithLocalWhisper(audioFile, language);
      // Cleanup temp files
      cleanupFile(audioFile, sourceFile);
      return result;
    } catch (whisperError) {
      console.warn(
        "Local Whisper transcription failed, trying cloud API fallback:",
        whisperError instanceof Error ? whisperError.message : whisperError
      );
    }

    // Step 3: Try cloud API fallback
    onProgress?.("transcribing", "Trying cloud transcription fallback...");
    try {
      const result = await transcribeWithAPI(audioFile, language);
      cleanupFile(audioFile, sourceFile);
      return result;
    } catch (apiError) {
      console.warn(
        "Cloud API transcription also failed:",
        apiError instanceof Error ? apiError.message : apiError
      );
    }

    // Cleanup on failure
    cleanupFile(audioFile, sourceFile);
    return null;
  } catch (error) {
    console.error("Transcription pipeline error:", error);
    cleanupFile(audioFile, sourceFile);
    return null;
  }
}

// ─── Cleanup Helper ─────────────────────────────────────────────────────────

function cleanupFile(audioFile: string, sourceBase: string) {
  // Clean up the downloaded audio file
  const filesToClean = [
    audioFile,
    sourceBase,
    sourceBase + ".wav",
    sourceBase + ".mp4",
    sourceBase + ".m4a",
    sourceBase + ".ogg",
    sourceBase + ".opus",
  ];

  for (const file of filesToClean) {
    try {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ─── Check if Whisper is available ──────────────────────────────────────────

let whisperAvailable: boolean | null = null;

export async function isWhisperAvailable(): Promise<boolean> {
  if (whisperAvailable !== null) return whisperAvailable;

  try {
    // Check EC2 whisper venv first
    const pythonCmd = existsSync("/opt/whisper-venv/bin/python")
      ? "/opt/whisper-venv/bin/python"
      : "python3";
    const { stdout } = await execFileAsync(pythonCmd, [
      "-c",
      "import faster_whisper; print('ok')",
    ], { timeout: 10000 });
    whisperAvailable = stdout.trim() === "ok";
  } catch {
    whisperAvailable = false;
  }

  return whisperAvailable;
}
