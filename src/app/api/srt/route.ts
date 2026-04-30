import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

interface SrtSegment {
  index: number;
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
}

function parseSrtTime(timeStr: string): number {
  // SRT time format: HH:MM:SS,mmm
  const parts = timeStr.trim().replace(',', '.').split(':');
  if (parts.length !== 3) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

function parseSrtContent(content: string): SrtSegment[] {
  const segments: SrtSegment[] = [];

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by double newlines (SRT block separator)
  const blocks = normalized.split(/\n\n+/).filter(block => block.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // First line: index number
    const index = parseInt(lines[0].trim(), 10);
    if (isNaN(index)) continue;

    // Second line: timestamp
    const timestampLine = lines[1];
    const timeMatch = timestampLine.match(
      /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
    );
    if (!timeMatch) continue;

    const startTime = parseSrtTime(timeMatch[1]);
    const endTime = parseSrtTime(timeMatch[2]);

    // Remaining lines: subtitle text
    const text = lines.slice(2).join(' ').trim();
    if (!text) continue;

    segments.push({ index, startTime, endTime, text });
  }

  return segments;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const auth = await requireAuth(userId);

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No SRT file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validExtensions = [".srt", ".vtt"];
    const fileName = file.name.toLowerCase();
    if (!validExtensions.some(ext => fileName.endsWith(ext))) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an SRT or VTT file" },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Empty subtitle file" },
        { status: 400 }
      );
    }

    // Parse SRT content
    let segments: SrtSegment[] = [];

    if (fileName.endsWith(".vtt")) {
      // Convert VTT to SRT-like format first
      const srtContent = content
        .replace(/^WEBVTT.*\n/i, '')
        .replace(/Kind:.*\n/gi, '')
        .replace(/Language:.*\n/gi, '')
        .replace(/\./g, ','); // VTT uses . for ms, SRT uses ,
      segments = parseSrtContent(srtContent);
    } else {
      segments = parseSrtContent(content);
    }

    if (segments.length === 0) {
      return NextResponse.json(
        { error: "Could not parse any subtitle segments from the file" },
        { status: 400 }
      );
    }

    // Group segments into logical caption lines (combine segments that are close together)
    const captionLines: string[] = [];
    let currentGroup: SrtSegment[] = [segments[0]];

    for (let i = 1; i < segments.length; i++) {
      const prev = currentGroup[currentGroup.length - 1];
      const curr = segments[i];
      const gap = curr.startTime - prev.endTime;

      // If gap is less than 0.5 seconds, combine into same line
      if (gap < 0.5 && currentGroup.length < 3) {
        currentGroup.push(curr);
      } else {
        // Finish current group
        captionLines.push(currentGroup.map(s => s.text).join(' '));
        currentGroup = [curr];
      }
    }
    // Don't forget the last group
    if (currentGroup.length > 0) {
      captionLines.push(currentGroup.map(s => s.text).join(' '));
    }

    // Create pipe-separated captions string (app format)
    const captions = captionLines.join('|');

    // Also return segments with timestamps for clip alignment
    const timedSegments = segments.map(s => ({
      startTime: s.startTime,
      endTime: s.endTime,
      startTimeFormatted: formatTime(s.startTime),
      endTimeFormatted: formatTime(s.endTime),
      text: s.text,
    }));

    return NextResponse.json({
      success: true,
      data: {
        captions,
        captionLines,
        segmentCount: segments.length,
        totalDuration: segments.length > 0
          ? formatTime(segments[segments.length - 1].endTime)
          : "0:00",
        segments: timedSegments,
      },
    });
  } catch (error) {
    console.error("SRT upload error:", error);
    return NextResponse.json(
      { error: "Failed to parse subtitle file" },
      { status: 500 }
    );
  }
}
