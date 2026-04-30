import { NextResponse } from "next/server";

// ─── Platform Detection ────────────────────────────────────────────────────

function detectPlatform(url: string): {
  platform: string;
  videoId: string | null;
} {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const videoId =
        urlObj.searchParams.get("v") ||
        urlObj.pathname.split("/").filter(Boolean).pop() ||
        null;
      return { platform: "youtube", videoId };
    }

    if (host.includes("tiktok.com")) {
      const parts = urlObj.pathname.split("/").filter(Boolean);
      const videoId = parts.length > 0 ? parts[parts.length - 1] : null;
      return { platform: "tiktok", videoId };
    }

    if (host.includes("vimeo.com")) {
      const videoId = urlObj.pathname.split("/").filter(Boolean).pop() || null;
      return { platform: "vimeo", videoId };
    }

    return { platform: "other", videoId: null };
  } catch {
    return { platform: "unknown", videoId: null };
  }
}

// ─── GET Handler ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    const { platform, videoId } = detectPlatform(url);

    let title: string | null = null;
    let thumbnailUrl: string | null = null;
    let authorName: string | null = null;

    // YouTube oEmbed
    if (platform === "youtube" && videoId) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          title = data.title || null;
          authorName = data.author_name || null;
          thumbnailUrl = data.thumbnail_url || null;
        }
      } catch {
        // Non-fatal
      }

      // Fallback thumbnail
      if (!thumbnailUrl) {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // Vimeo oEmbed
    if (platform === "vimeo" && videoId) {
      try {
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          title = data.title || null;
          authorName = data.author_name || null;
          thumbnailUrl = data.thumbnail_url || null;
        }
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        title,
        thumbnailUrl,
        authorName,
        duration: null,
        platform,
      },
    });
  } catch (error) {
    console.error("Error fetching video preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch video preview" },
      { status: 500 }
    );
  }
}
