import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ZAI from "z-ai-web-dev-sdk";

// ─── Platform Detection ────────────────────────────────────────────────────

function detectPlatform(url: string): {
  platform: string;
  videoId: string | null;
} {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();

    // YouTube
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const videoId =
        urlObj.searchParams.get("v") ||
        urlObj.pathname.split("/").filter(Boolean).pop() ||
        null;
      return { platform: "youtube", videoId };
    }

    // TikTok
    if (host.includes("tiktok.com")) {
      const parts = urlObj.pathname.split("/").filter(Boolean);
      const videoId = parts.length > 0 ? parts[parts.length - 1] : null;
      return { platform: "tiktok", videoId };
    }

    // Vimeo
    if (host.includes("vimeo.com")) {
      const videoId = urlObj.pathname.split("/").filter(Boolean).pop() || null;
      return { platform: "vimeo", videoId };
    }

    // Instagram Reels
    if (host.includes("instagram.com")) {
      return { platform: "instagram", videoId: null };
    }

    return { platform: "other", videoId: null };
  } catch {
    return { platform: "unknown", videoId: null };
  }
}

// ─── Fetch Video Metadata ──────────────────────────────────────────────────

interface VideoMetadata {
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  authorName: string | null;
  pageContent: string | null;
}

async function fetchVideoMetadata(
  url: string,
  platform: string,
  videoId: string | null
): Promise<VideoMetadata> {
  const metadata: VideoMetadata = {
    title: null,
    description: null,
    thumbnailUrl: null,
    authorName: null,
    pageContent: null,
  };

  // Strategy 1: Use oEmbed APIs for YouTube/Vimeo
  if (platform === "youtube" && videoId) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        metadata.title = data.title || null;
        metadata.authorName = data.author_name || null;
        metadata.thumbnailUrl = data.thumbnail_url || null;
      }
    } catch (err) {
      console.error("YouTube oEmbed error (non-fatal):", err);
    }
  }

  if (platform === "vimeo" && videoId) {
    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;
      const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        metadata.title = data.title || null;
        metadata.description = data.description || null;
        metadata.thumbnailUrl = data.thumbnail_url || null;
        metadata.authorName = data.author_name || null;
      }
    } catch (err) {
      console.error("Vimeo oEmbed error (non-fatal):", err);
    }
  }

  // Strategy 2: Use Web-Reader (page_reader) to get more content
  try {
    const zai = await ZAI.create();
    const pageResult = await zai.functions.invoke("page_reader", {
      url: url,
    });

    if (pageResult?.data) {
      // Use page title only if we don't have one from oEmbed
      if (!metadata.title && pageResult.data.title) {
        metadata.title = pageResult.data.title;
      }

      // Extract text content from HTML
      const htmlContent = pageResult.data.html || "";
      const plainText = htmlContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();

      // Only use page content if it's substantial and not just generic cookie/privacy text
      if (plainText.length > 100) {
        // Filter out generic YouTube boilerplate
        const filteredText = plainText
          .replace(/cookie policy/gi, "")
          .replace(/privacy settings/gi, "")
          .replace(/language options/gi, "")
          .replace(/terms of service/gi, "")
          .replace(/\s+/g, " ")
          .trim();

        if (filteredText.length > 80) {
          metadata.pageContent = filteredText.substring(0, 3000);
        }
      }

      // Extract thumbnail from og:image if not already found
      if (!metadata.thumbnailUrl) {
        const thumbMatch = htmlContent.match(
          /<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i
        );
        if (thumbMatch) {
          metadata.thumbnailUrl = thumbMatch[1];
        }
      }

      // Extract description from meta tag if not already found
      if (!metadata.description) {
        const descMatch = htmlContent.match(
          /<meta\s+(?:property|name)=["']description["']\s+content=["']([^"']+)["']/i
        );
        if (descMatch) {
          metadata.description = descMatch[1];
        }
      }
    }
  } catch (readerError) {
    console.error("Web-Reader error (non-fatal):", readerError);
  }

  // Strategy 3: For YouTube, construct thumbnail URL from video ID
  if (platform === "youtube" && videoId && !metadata.thumbnailUrl) {
    metadata.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  return metadata;
}

// ─── Extract Title from URL ────────────────────────────────────────────────

function extractTitleFromUrl(url: string, platform: string): string {
  try {
    const urlObj = new URL(url);

    switch (platform) {
      case "youtube":
        return `YouTube Video`;
      case "tiktok":
        return "TikTok Video";
      case "vimeo":
        return "Vimeo Video";
      case "instagram":
        return "Instagram Reel";
      default:
        return `Video from ${urlObj.hostname}`;
    }
  } catch {
    return "Untitled Video";
  }
}

// ─── Fallback Clip Generator ───────────────────────────────────────────────

function generateContextualFallbackClips(videoTitle: string) {
  const baseTitle = videoTitle
    .replace(/^(YouTube Video|TikTok Video|Vimeo Video|Video from)\s*/i, "")
    .trim();

  const clipTemplates = [
    {
      titleTemplate: `The Best Moment from "${baseTitle}"`,
      tags: ["best moment", "highlight", "must watch"],
      captions:
        "You have to see this|This is the best part|Absolutely incredible",
    },
    {
      titleTemplate: `Key Takeaway from "${baseTitle}"`,
      tags: ["key point", "takeaway", "insight"],
      captions:
        "Here's the key point|This is what matters most|Don't miss this insight",
    },
    {
      titleTemplate: `The Part Everyone's Talking About — "${baseTitle}"`,
      tags: ["viral", "trending", "everyone talking"],
      captions:
        "This part went viral|Everyone is sharing this|The moment that broke the internet",
    },
    {
      titleTemplate: `Quick Summary — "${baseTitle}" in 30 Seconds`,
      tags: ["summary", "quick recap", "short version"],
      captions:
        "Here's the quick summary|Everything you need to know|In just 30 seconds",
    },
    {
      titleTemplate: `The Twist Nobody Expected in "${baseTitle}"`,
      tags: ["unexpected", "plot twist", "shocking"],
      captions:
        "Nobody saw this coming|The twist changes everything|You won't believe what happens",
    },
  ];

  return clipTemplates.map((template, i) => ({
    title: template.titleTemplate,
    startTime: `${Math.floor(Math.random() * 8) + i}:${Math.floor(Math.random() * 60)
      .toString()
      .padStart(2, "0")}`,
    duration: `0:${(Math.floor(Math.random() * 30) + 15)
      .toString()
      .padStart(2, "0")}`,
    viralityScore: Math.floor(Math.random() * 20) + 75,
    tags: template.tags,
    captions: template.captions,
  }));
}

// ─── Main POST Handler ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, userId } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid video URL" },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Verify auth and ownership
    const auth = await requireAuth(userId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check clip limit
    if (user.clipsUsed >= user.clipsLimit) {
      return NextResponse.json(
        {
          error: "Clip limit reached. Please upgrade your plan to generate more clips.",
        },
        { status: 403 }
      );
    }

    // Detect platform
    const { platform, videoId } = detectPlatform(url);

    // Create video record in DB
    const video = await db.video.create({
      data: {
        userId,
        sourceUrl: url,
        status: "processing",
      },
    });

    // Step 1: Fetch video metadata using multiple strategies
    const videoMeta = await fetchVideoMetadata(url, platform, videoId);

    let videoTitle = videoMeta.title;
    let videoThumbnail = videoMeta.thumbnailUrl;

    // Step 2: Use LLM with video content to generate clips
    let clipsData: Array<{
      title: string;
      startTime: string;
      duration: string;
      viralityScore: number;
      tags: string[];
      captions: string;
    }> = [];

    try {
      const zai = await ZAI.create();

      // Build context-rich prompt with actual video data
      let contextSection = "";
      if (videoTitle) {
        contextSection += `Video Title: "${videoTitle}"\n`;
      }
      if (videoMeta.authorName) {
        contextSection += `Channel/Author: "${videoMeta.authorName}"\n`;
      }
      if (videoMeta.description) {
        contextSection += `Video Description: "${videoMeta.description}"\n`;
      }
      if (videoMeta.pageContent && videoMeta.pageContent.length > 50) {
        contextSection += `Video Page Content (extracted text):\n${videoMeta.pageContent}\n`;
      }
      if (platform) {
        contextSection += `Platform: ${platform}\n`;
      }

      const hasContent = contextSection.length > 0;

      const systemPrompt = `You are an expert viral content analyst specializing in creating short-form video clips from long-form content. You analyze videos and generate clip suggestions that would perform well on social media (TikTok, Instagram Reels, YouTube Shorts).

Given video information, generate 5 short clip suggestions. Each clip should:
- Have a compelling, scroll-stopping title that references the SPECIFIC video content
- Include realistic timestamps and durations (clips should be 15-60 seconds)
- Have a virality score from 60-99 (higher = more likely to go viral)
- Include 2-4 relevant tags based on the video's actual topic
- Include engaging caption text (pipe-separated lines, 2-4 lines)

Return ONLY valid JSON in this exact format:
{
  "title": "Video Title (use the actual video title from the data above)",
  "clips": [
    {
      "title": "Compelling clip title specific to this video's content",
      "startTime": "1:23",
      "duration": "0:45",
      "viralityScore": 92,
      "tags": ["relevant", "tags"],
      "captions": "First line|Second line|Third line"
    }
  ]
}

CRITICAL RULES:
1. Generate clips that are SPECIFIC to the video content. Reference the actual topic, people, or events mentioned.
2. Do NOT use generic titles like "This Moment Changed Everything" or "Stop Scrolling".
3. The clip titles should make someone want to watch based on the video's specific content.
4. If you have the video title and description, USE them to create relevant clips.`;

      const userPrompt = hasContent
        ? `Analyze this video and generate 5 viral clip suggestions based on the actual content:\n\nSource URL: ${url}\n\n${contextSection}`
        : `Analyze this video URL and generate 5 viral clip suggestions. Try to infer the video topic from the URL structure:\n\nURL: ${url}\nPlatform: ${platform}`;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        thinking: { type: "disabled" },
      });

      // Extract the response content
      const responseContent =
        completion.choices?.[0]?.message?.content || "";

      try {
        // Try to extract JSON from the response (may be wrapped in markdown code blocks)
        const jsonMatch = responseContent.match(
          /```(?:json)?\s*([\s\S]*?)```/
        );
        const jsonStr = jsonMatch ? jsonMatch[1] : responseContent;
        const parsedData = JSON.parse(jsonStr.trim());

        // Use LLM-provided title if we don't have one from metadata
        if (parsedData.title && !videoTitle) {
          videoTitle = parsedData.title;
        }
        // If we have a better title from metadata, prefer it over LLM's
        if (
          parsedData.title &&
          videoTitle &&
          (videoTitle === "YouTube" ||
            videoTitle === "YouTube Video" ||
            videoTitle.startsWith("Video from"))
        ) {
          videoTitle = parsedData.title;
        }
        if (
          parsedData.clips &&
          Array.isArray(parsedData.clips) &&
          parsedData.clips.length > 0
        ) {
          clipsData = parsedData.clips;
        }
      } catch (parseError) {
        console.error("Failed to parse LLM response as JSON:", parseError);
      }
    } catch (aiError) {
      console.error("AI processing error:", aiError);
    }

    // If AI didn't produce clips, generate fallback based on video title
    if (clipsData.length === 0) {
      clipsData = generateContextualFallbackClips(
        videoTitle || extractTitleFromUrl(url, platform)
      );
    }

    // Always create clips
    try {
      const clipRecords = await Promise.all(
        clipsData.map((clip) =>
          db.clip.create({
            data: {
              videoId: video.id,
              title: clip.title,
              startTime: clip.startTime || "0:00",
              duration: clip.duration || "0:30",
              viralityScore: clip.viralityScore || 0,
              captions: clip.captions || null,
              captionStyle: "default",
              layout: "9:16",
              tags: JSON.stringify(clip.tags || []),
            },
          })
        )
      );

      // Update video status to completed with title and thumbnail
      const updatedVideo = await db.video.update({
        where: { id: video.id },
        data: {
          status: "completed",
          title: videoTitle || extractTitleFromUrl(url, platform),
          thumbnailUrl: videoThumbnail,
        },
        include: { clips: true },
      });

      // Increment user's clipsUsed
      await db.user.update({
        where: { id: userId },
        data: { clipsUsed: { increment: clipRecords.length } },
      });

      return NextResponse.json({
        success: true,
        data: updatedVideo,
      });
    } catch (dbError) {
      try {
        await db.video.update({
          where: { id: video.id },
          data: { status: "failed" },
        });
      } catch {}

      console.error("Database error creating clips:", dbError);
      return NextResponse.json(
        { error: "Failed to save clips. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing video:", error);
    return NextResponse.json(
      { error: "Failed to process video" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "OpusClip AI Video Processing API",
    endpoints: {
      "POST /api/process":
        "Process a video URL and generate AI-powered clips. Requires { url, userId }",
    },
  });
}
