import { NextResponse } from "next/server";

// Simulated AI video analysis endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid video URL" },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate simulated clip results
    const clips = generateSimulatedClips(url);

    return NextResponse.json({
      success: true,
      data: {
        sourceUrl: url,
        totalClips: clips.length,
        processingTime: "2.3s",
        clips,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process video" },
      { status: 500 }
    );
  }
}

function generateSimulatedClips(url: string) {
  const titles = [
    "The Key Insight That Changes Everything",
    "Why Top Creators Use This Strategy",
    "The Secret to Going Viral in 2025",
    "This Moment Shocked Everyone",
    "The #1 Mistake Most Creators Make",
    "How to 10x Your Content Output",
    "The Future of AI Content Creation",
    "This Clip Got 10M Views — Here's Why",
  ];

  const clipCount = Math.floor(Math.random() * 3) + 4; // 4-6 clips

  return Array.from({ length: clipCount }, (_, i) => {
    const score = Math.floor(Math.random() * 15) + 85; // 85-99
    const duration = Math.floor(Math.random() * 60) + 15; // 15-75 seconds
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    return {
      id: `clip-${i + 1}`,
      title: titles[i % titles.length],
      viralityScore: score,
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      startTime: `${Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, "0")}`,
      captions: true,
      format: "9:16",
      tags: ["viral", "trending", "engaging"].slice(
        0,
        Math.floor(Math.random() * 3) + 1
      ),
      sourceUrl: url,
    };
  }).sort((a, b) => b.viralityScore - a.viralityScore);
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "OpusClip AI Video Processing API",
    endpoints: {
      "POST /api/process": "Process a video URL and generate clips",
    },
  });
}
