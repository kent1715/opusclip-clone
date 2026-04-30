import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// POST: Generate share link for a clip
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clipId, platforms, userId } = body;

    if (!clipId || !userId) {
      return NextResponse.json(
        { error: "clipId and userId are required" },
        { status: 400 }
      );
    }

    const auth = await requireAuth(userId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get clip with video
    const clip = await db.clip.findUnique({
      where: { id: clipId },
      include: { video: true },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Verify ownership
    if (clip.video.userId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update clip publish status
    const publishedPlatforms = Array.isArray(platforms) ? platforms : [];
    const updatedClip = await db.clip.update({
      where: { id: clipId },
      data: {
        isPublished: true,
        publishedTo: JSON.stringify(publishedPlatforms),
      },
    });

    // Generate shareable link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/api/share?clipId=${clipId}`;

    // Generate social media share URLs
    const shareLinks: Record<string, string> = {};

    const clipTitle = encodeURIComponent(clip.title);
    const clipUrl = encodeURIComponent(shareUrl);

    if (publishedPlatforms.includes("youtube") || publishedPlatforms.includes("all")) {
      shareLinks.youtube = `https://www.youtube.com/upload`;
    }
    if (publishedPlatforms.includes("tiktok") || publishedPlatforms.includes("all")) {
      shareLinks.tiktok = `https://www.tiktok.com/upload`;
    }
    if (publishedPlatforms.includes("instagram") || publishedPlatforms.includes("all")) {
      shareLinks.instagram = `https://www.instagram.com/`;
    }
    if (publishedPlatforms.includes("twitter") || publishedPlatforms.includes("all")) {
      shareLinks.twitter = `https://twitter.com/intent/tweet?text=${clipTitle}&url=${clipUrl}`;
    }
    if (publishedPlatforms.includes("facebook") || publishedPlatforms.includes("all")) {
      shareLinks.facebook = `https://www.facebook.com/sharer/sharer.php?u=${clipUrl}`;
    }
    if (publishedPlatforms.includes("linkedin") || publishedPlatforms.includes("all")) {
      shareLinks.linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${clipUrl}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        clip: updatedClip,
        shareUrl,
        shareLinks,
        publishedPlatforms,
      },
    });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}

// GET: Get shared clip info (public)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clipId = searchParams.get("clipId");

    if (!clipId) {
      return NextResponse.json(
        { error: "clipId is required" },
        { status: 400 }
      );
    }

    const clip = await db.clip.findUnique({
      where: { id: clipId },
      include: { video: true },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    if (!clip.isPublished) {
      return NextResponse.json(
        { error: "This clip is not published" },
        { status: 403 }
      );
    }

    // Return public clip info (no sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        title: clip.title,
        startTime: clip.startTime,
        duration: clip.duration,
        viralityScore: clip.viralityScore,
        captionStyle: clip.captionStyle,
        layout: clip.layout,
        videoTitle: clip.video.title,
        videoThumbnail: clip.video.thumbnailUrl,
        publishedTo: JSON.parse(clip.publishedTo),
        createdAt: clip.createdAt,
      },
    });
  } catch (error) {
    console.error("Get shared clip error:", error);
    return NextResponse.json(
      { error: "Failed to get shared clip" },
      { status: 500 }
    );
  }
}
