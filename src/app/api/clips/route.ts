import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: List clips for a video
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId query parameter is required" },
        { status: 400 }
      );
    }

    const clips = await db.clip.findMany({
      where: { videoId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: clips });
  } catch (error) {
    console.error("Error listing clips:", error);
    return NextResponse.json(
      { error: "Failed to list clips" },
      { status: 500 }
    );
  }
}

// POST: Create a clip manually
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      videoId,
      title,
      startTime,
      duration,
      viralityScore,
      captions,
      captionStyle,
      layout,
      tags,
    } = body;

    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // Verify video exists
    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const clip = await db.clip.create({
      data: {
        videoId,
        title,
        startTime: startTime || "0:00",
        duration: duration || "0:30",
        viralityScore: viralityScore || 0,
        captions: captions || null,
        captionStyle: captionStyle || "default",
        layout: layout || "9:16",
        tags: Array.isArray(tags) ? JSON.stringify(tags) : tags || "[]",
      },
    });

    return NextResponse.json({ success: true, data: clip }, { status: 201 });
  } catch (error) {
    console.error("Error creating clip:", error);
    return NextResponse.json(
      { error: "Failed to create clip" },
      { status: 500 }
    );
  }
}
