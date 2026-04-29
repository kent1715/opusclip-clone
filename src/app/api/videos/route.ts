import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Create a new video record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, sourceUrl, title } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!sourceUrl || typeof sourceUrl !== "string") {
      return NextResponse.json(
        { error: "sourceUrl is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const video = await db.video.create({
      data: {
        userId,
        sourceUrl,
        title: title || null,
        status: "processing",
      },
    });

    return NextResponse.json({ success: true, data: video }, { status: 201 });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}

// GET: List user's videos with clips
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const videos = await db.video.findMany({
      where: { userId },
      include: { clips: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    console.error("Error listing videos:", error);
    return NextResponse.json(
      { error: "Failed to list videos" },
      { status: 500 }
    );
  }
}
