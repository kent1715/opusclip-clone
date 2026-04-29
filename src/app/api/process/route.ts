import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

// AI-powered video processing endpoint
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

    // Create video record in DB
    const video = await db.video.create({
      data: {
        userId,
        sourceUrl: url,
        status: "processing",
      },
    });

    try {
      // Use z-ai-web-dev-sdk LLM to analyze the video and generate clip recommendations
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert viral content analyst. Given a video URL, generate 5 short clip suggestions that would perform well on social media. Return ONLY valid JSON in this format:\n{\n  \"title\": \"Video Title\",\n  \"clips\": [\n    {\n      \"title\": \"Compelling clip title\",\n      \"startTime\": \"1:23\",\n      \"duration\": \"0:45\",\n      \"viralityScore\": 92,\n      \"tags\": [\"viral\", \"trending\"],\n      \"captions\": \"First line of caption|Second line of caption|Third line\"\n    }\n  ]\n}",
          },
          {
            role: "user",
            content: `Analyze this video URL and generate 5 viral clip suggestions: ${url}`,
          },
        ],
        thinking: { type: "disabled" },
      });

      // Extract the response content
      const responseContent = completion.choices?.[0]?.message?.content || "";
      let parsedData: {
        title?: string;
        clips?: Array<{
          title: string;
          startTime: string;
          duration: string;
          viralityScore: number;
          tags: string[];
          captions: string;
        }>;
      };

      try {
        // Try to extract JSON from the response (may be wrapped in markdown code blocks)
        const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : responseContent;
        parsedData = JSON.parse(jsonStr.trim());
      } catch {
        // If parsing fails, use fallback data
        console.error("Failed to parse LLM response, using fallback");
        parsedData = {
          title: "Video Analysis",
          clips: generateFallbackClips(),
        };
      }

      const videoTitle = parsedData.title || null;
      const clipsData = parsedData.clips || generateFallbackClips();

      // Create Clip records in DB for each generated clip
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

      // Update video status to completed and set title
      const updatedVideo = await db.video.update({
        where: { id: video.id },
        data: {
          status: "completed",
          title: videoTitle,
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
    } catch (aiError) {
      // If AI processing fails, mark video as failed
      await db.video.update({
        where: { id: video.id },
        data: { status: "failed" },
      });

      console.error("AI processing error:", aiError);
      return NextResponse.json(
        { error: "Failed to process video with AI. Please try again." },
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

// Fallback clip generator when LLM response parsing fails
function generateFallbackClips() {
  const titles = [
    "The Key Insight That Changes Everything",
    "Why Top Creators Use This Strategy",
    "The Secret to Going Viral in 2025",
    "This Moment Shocked Everyone",
    "The #1 Mistake Most Creators Make",
  ];

  return titles.map((title, i) => ({
    title,
    startTime: `${Math.floor(Math.random() * 5) + i}:${Math.floor(Math.random() * 60)
      .toString()
      .padStart(2, "0")}`,
    duration: `0:${Math.floor(Math.random() * 30) + 15}`,
    viralityScore: Math.floor(Math.random() * 15) + 85,
    tags: ["viral", "trending", "engaging"].slice(
      0,
      Math.floor(Math.random() * 3) + 1
    ),
    captions: "This is a viral moment|Watch what happens next|Incredible insight",
  }));
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
