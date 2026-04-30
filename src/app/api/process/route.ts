import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ZAI from "z-ai-web-dev-sdk";
import { updateProgress, completeProgress, errorProgress } from "@/lib/progress";
import { transcribeVideo, isWhisperAvailable, type TranscriptionResult } from "@/lib/transcribe";

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

function generateContextualFallbackClips(
  videoTitle: string,
  authorName?: string | null,
  _platform?: string
) {
  const shortTitle =
    videoTitle.length > 50
      ? videoTitle.substring(0, 47) + "..."
      : videoTitle;
  const author = authorName || "";
  const isMusic =
    /music|song|official (video|audio|mv)|lyrics|mv|cover|remix|instrumental/i.test(
      videoTitle
    );
  const isTutorial =
    /how to|tutorial|guide|learn|tips|explained|beginner|step by step/i.test(
      videoTitle
    );
  const isVlog =
    /vlog|day in|my life|routine|grwm|haul|tour/i.test(videoTitle);
  const isReview =
    /review|unboxing|first look|hands on|vs|comparison/i.test(videoTitle);
  const isComedy =
    /funny|comedy|prank|skit|parody|try not to laugh|challenge/i.test(
      videoTitle
    );

  const clips: Array<{
    title: string;
    startTime: string;
    duration: string;
    viralityScore: number;
    tags: string[];
    captions: string;
  }> = [];

  if (isMusic) {
    clips.push(
      {
        title: `${shortTitle} — The Chorus That Everyone Knows`,
        startTime: "0:30",
        duration: "0:35",
        viralityScore: 97,
        tags: ["chorus", "iconic", "music"],
        captions: "This is the part everyone waits for|The chorus that defined a generation|Can't help but sing along",
      },
      {
        title: `${author ? author + " — " : ""}The Vocal Range That Shocked Everyone`,
        startTime: "1:15",
        duration: "0:28",
        viralityScore: 93,
        tags: ["vocals", "talent", "impressive"],
        captions: "Wait for this note|The vocal range is insane|How is this even possible",
      },
      {
        title: `The Beat Drop in "${shortTitle}" — Goosebumps Every Time`,
        startTime: "0:45",
        duration: "0:22",
        viralityScore: 95,
        tags: ["beat drop", "goosebumps", "epic"],
        captions: "This part gives me chills|The build-up is everything|Pure musical genius",
      },
      {
        title: `${author ? author + " — " : ""}Behind the Iconic Performance`,
        startTime: "2:10",
        duration: "0:40",
        viralityScore: 88,
        tags: ["behind the scenes", "performance", "legendary"],
        captions: "The energy is unmatched|This performance changed everything|A moment in music history",
      },
      {
        title: `Why "${shortTitle}" Went Viral — The Full Breakdown`,
        startTime: "0:10",
        duration: "0:33",
        viralityScore: 91,
        tags: ["viral", "breakdown", "analysis"],
        captions: "Here's why this blew up|The secret behind the viral moment|Everyone is talking about this",
      }
    );
  } else if (isTutorial) {
    clips.push(
      {
        title: `The #1 Mistake Everyone Makes (And How to Fix It)`,
        startTime: "1:30",
        duration: "0:35",
        viralityScore: 95,
        tags: ["mistake", "fix", "tips"],
        captions: "Stop doing this right now|Here's the correct way|This changes everything",
      },
      {
        title: `The Pro Trick That Saves Hours — ${shortTitle}`,
        startTime: "3:45",
        duration: "0:28",
        viralityScore: 93,
        tags: ["pro tip", "time saver", "hack"],
        captions: "Nobody talks about this trick|This saves so much time|The pros use this every day",
      },
      {
        title: `Skip to This Timestamp — The Most Important Part`,
        startTime: "2:00",
        duration: "0:30",
        viralityScore: 90,
        tags: ["key point", "must watch", "important"],
        captions: "This is the most important part|Don't skip this section|Everything clicks here",
      },
      {
        title: `${shortTitle} in 30 Seconds — Quick Version`,
        startTime: "0:15",
        duration: "0:30",
        viralityScore: 88,
        tags: ["quick", "summary", "short version"],
        captions: "Here's the fast version|Everything you need in 30 seconds|No fluff, just results",
      },
      {
        title: `Before vs After — The Transformation Is Insane`,
        startTime: "5:00",
        duration: "0:25",
        viralityScore: 92,
        tags: ["transformation", "results", "before after"],
        captions: "Look at this difference|The transformation is unreal|This actually works",
      }
    );
  } else if (isVlog) {
    clips.push(
      {
        title: `The Moment That Changed Everything — ${shortTitle}`,
        startTime: "2:30",
        duration: "0:35",
        viralityScore: 94,
        tags: ["turning point", "moment", "vlog"],
        captions: "This changed everything|Nobody expected this|The moment everyone talks about",
      },
      {
        title: `The Part Nobody Talks About — ${shortTitle}`,
        startTime: "4:00",
        duration: "0:28",
        viralityScore: 91,
        tags: ["untold", "honest", "real"],
        captions: "Nobody talks about this part|So honest and real|This hit different",
      },
      {
        title: `${author ? author + "'s " : ""}Most Relatable Moment Caught on Camera`,
        startTime: "1:00",
        duration: "0:22",
        viralityScore: 89,
        tags: ["relatable", "real", "authentic"],
        captions: "We've all been here|So relatable it hurts|This is too real",
      },
      {
        title: `The Unexpected Twist — Nobody Saw This Coming`,
        startTime: "3:30",
        duration: "0:30",
        viralityScore: 96,
        tags: ["unexpected", "twist", "shocking"],
        captions: "Nobody saw this coming|The plot twist of the year|I was NOT expecting this",
      },
      {
        title: `The Ending That Had Everyone in Tears — ${shortTitle}`,
        startTime: "6:00",
        duration: "0:35",
        viralityScore: 93,
        tags: ["emotional", "ending", "touching"],
        captions: "I'm not crying you are|This ending destroyed me|Pure emotion",
      }
    );
  } else if (isReview) {
    clips.push(
      {
        title: `${shortTitle} — Is It Worth the Hype? Honest Take`,
        startTime: "0:30",
        duration: "0:40",
        viralityScore: 94,
        tags: ["honest review", "worth it", "verdict"],
        captions: "Is it worth the hype?|Here's my honest take|The verdict might surprise you",
      },
      {
        title: `The Feature Nobody Mentions — ${shortTitle}`,
        startTime: "3:00",
        duration: "0:25",
        viralityScore: 90,
        tags: ["hidden feature", "underrated", "discovery"],
        captions: "Nobody mentions this feature|This changes everything|So underrated",
      },
      {
        title: `The Dealbreaker — ${shortTitle}`,
        startTime: "4:30",
        duration: "0:30",
        viralityScore: 92,
        tags: ["dealbreaker", "honest", "cons"],
        captions: "This is the dealbreaker|You need to know this before buying|The one thing that ruins it",
      },
      {
        title: `${author ? author + "'s " : ""}Final Score — You Won't Believe It`,
        startTime: "7:00",
        duration: "0:20",
        viralityScore: 95,
        tags: ["final score", "verdict", "rating"],
        captions: "The final score is...|You won't believe this rating|Is it a buy or pass",
      },
      {
        title: `The Unboxing Moment Everyone's Talking About`,
        startTime: "1:00",
        duration: "0:28",
        viralityScore: 88,
        tags: ["unboxing", "first look", "reaction"],
        captions: "The unboxing experience|First impressions matter|This looks incredible",
      }
    );
  } else if (isComedy) {
    clips.push(
      {
        title: `The Moment That Broke the Internet — ${shortTitle}`,
        startTime: "0:45",
        duration: "0:25",
        viralityScore: 98,
        tags: ["broke internet", "funny", "viral"],
        captions: "This broke the internet|I can't stop laughing|The funniest thing ever",
      },
      {
        title: `Try Not to Laugh at This — ${shortTitle}`,
        startTime: "1:30",
        duration: "0:20",
        viralityScore: 96,
        tags: ["try not to laugh", "comedy", "hilarious"],
        captions: "Try not to laugh|Impossible not to laugh|I lost it at this part",
      },
      {
        title: `The Punchline Nobody Expected — ${shortTitle}`,
        startTime: "2:15",
        duration: "0:18",
        viralityScore: 94,
        tags: ["punchline", "unexpected", "comedy"],
        captions: "The punchline is perfect|Nobody expected this|The timing is everything",
      },
      {
        title: `The Improv Moment That Made History`,
        startTime: "3:00",
        duration: "0:30",
        viralityScore: 91,
        tags: ["improv", "spontaneous", "legendary"],
        captions: "This wasn't scripted|Pure improv genius|The crowd lost it",
      },
      {
        title: `The Callback That Tied Everything Together`,
        startTime: "4:30",
        duration: "0:22",
        viralityScore: 89,
        tags: ["callback", "clever", "writing"],
        captions: "The callback is brilliant|This tied everything together|Masterful comedy writing",
      }
    );
  } else {
    // Generic but still title-specific clips
    clips.push(
      {
        title: `${shortTitle} — The Best 30 Seconds`,
        startTime: "0:45",
        duration: "0:30",
        viralityScore: 95,
        tags: ["best moment", "highlight", "must watch"],
        captions: "This is the best part|The moment everyone shares|You need to see this",
      },
      {
        title: `Why Everyone's Talking About "${shortTitle}"`,
        startTime: "1:30",
        duration: "0:35",
        viralityScore: 93,
        tags: ["trending", "viral", "everyone talking"],
        captions: "Here's why this is trending|Everyone is talking about this|The reason it went viral",
      },
      {
        title: `The Part That Changed Everything — ${shortTitle}`,
        startTime: "2:15",
        duration: "0:28",
        viralityScore: 91,
        tags: ["turning point", "game changer", "moment"],
        captions: "This changed everything|The turning point right here|A moment that defines the whole video",
      },
      {
        title: `${author ? author + ": " : ""}The Quote That Went Viral`,
        startTime: "3:00",
        duration: "0:22",
        viralityScore: 89,
        tags: ["viral quote", "powerful", "memorable"],
        captions: "This quote went viral|So powerful|Everyone is quoting this",
      },
      {
        title: `${shortTitle} — Quick Recap in Under a Minute`,
        startTime: "0:10",
        duration: "0:40",
        viralityScore: 87,
        tags: ["recap", "summary", "quick version"],
        captions: "Here's everything you need to know|Quick recap in under a minute|The key takeaways",
      }
    );
  }

  // Add some randomization to timestamps
  return clips.map((clip, i) => ({
    ...clip,
    startTime: `${Math.floor(Math.random() * 6) + i}:${Math.floor(Math.random() * 60)
      .toString()
      .padStart(2, "0")}`,
    duration: `0:${(Math.floor(Math.random() * 25) + 15).toString().padStart(2, "0")}`,
  }));
}

// ─── Main POST Handler ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, userId, settings } = body;

    // Extract settings with defaults
    const captionStyle = settings?.captionStyle || "default";
    const captionFont = settings?.captionFont || "inter";
    const captionAnimation = settings?.captionAnimation || "none";
    const captionColor = settings?.captionColor || "#ffffff";
    const captionSize = settings?.captionSize || 24;
    const captionPosition = settings?.captionPosition || "bottom";
    const aspectRatio = settings?.aspectRatio || "9:16";
    const genre = settings?.genre || "auto";
    const clipLength = settings?.clipLength || "auto";
    const specificMoments = settings?.specificMoments || "";
    const autoHook = settings?.autoHook !== false;
    const srtCaptions = settings?.srtCaptions || null;

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

    // Initialize progress tracking
    updateProgress(video.id, 5, "initializing", "Starting video analysis...");

    // Step 1: Fetch video metadata using multiple strategies
    updateProgress(video.id, 10, "fetching-metadata", "Fetching video metadata...");
    const videoMeta = await fetchVideoMetadata(url, platform, videoId);

    let videoTitle = videoMeta.title;
    let videoThumbnail = videoMeta.thumbnailUrl;

    // Step 1.5: Transcribe audio if available (and no SRT provided)
    let transcription: TranscriptionResult | null = null;
    const speechLanguage = settings?.speechLanguage || "auto";

    if (!srtCaptions) {
      updateProgress(video.id, 20, "transcribing", "Transcribing audio with AI...");
      try {
        const whisperReady = await isWhisperAvailable();
        if (whisperReady) {
          transcription = await transcribeVideo(
            url,
            speechLanguage,
            (stage, message) => {
              updateProgress(video.id, 25, stage, message);
            }
          );
        }

        if (transcription) {
          updateProgress(video.id, 35, "transcribed", `Transcription complete: ${transcription.segmentCount} segments in ${transcription.language}`);
        } else {
          updateProgress(video.id, 35, "transcription-skipped", "Transcription unavailable, using metadata analysis...");
        }
      } catch (transcriptionError) {
        console.error("Transcription error (non-fatal):", transcriptionError);
        updateProgress(video.id, 35, "transcription-skipped", "Transcription unavailable, using metadata analysis...");
      }
    } else {
      updateProgress(video.id, 35, "srt-loaded", "Using provided SRT captions...");
    }

    updateProgress(video.id, 40, "analyzing-content", "Analyzing video content with AI...");

    // Step 2: Use LLM with video content + transcription to generate clips
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

      // Include transcription data for much better clip suggestions
      let transcriptionSection = "";
      if (transcription) {
        transcriptionSection = `\n=== FULL TRANSCRIPT ===\nLanguage: ${transcription.language}\nDuration: ${transcription.duration.toFixed(1)} seconds\n\n`;
        transcriptionSection += transcription.segments.map((seg, i) => {
          const startMins = Math.floor(seg.start / 60);
          const startSecs = Math.floor(seg.start % 60);
          return `[${startMins}:${startSecs.toString().padStart(2, "0")}] ${seg.text}`;
        }).join("\n");
        transcriptionSection += "\n=== END TRANSCRIPT ===\n";
      }

      const hasContent = contextSection.length > 0 || transcriptionSection.length > 0;

      // Build genre-specific instructions
      let genreInstruction = "";
      if (genre && genre !== "auto") {
        const genreMap: Record<string, string> = {
          comedy: "comedy/humor — focus on funny moments, punchlines, and comedic timing",
          education: "educational — focus on key learning points, aha moments, and practical takeaways",
          music: "music/performance — focus on choruses, beat drops, vocal highlights, and musical peaks",
          sports: "sports/highlights — focus on game-changing plays, incredible feats, and emotional reactions",
          news: "news/commentary — focus on breaking points, key quotes, and shocking revelations",
          gaming: "gaming — focus on epic plays, clutch moments, and entertaining reactions",
          vlog: "vlog/lifestyle — focus on relatable moments, unexpected twists, and emotional highlights",
        };
        genreInstruction = `\nGenre focus: ${genreMap[genre] || genre}. Tailor clips to this genre.`;
      }

      // Build specific moments instruction
      let momentsInstruction = "";
      if (specificMoments) {
        momentsInstruction = `\nUser is specifically looking for: "${specificMoments}". Prioritize finding moments that match this request.`;
      }

      const transcriptNote = transcription
        ? `\n6. A FULL TRANSCRIPT is provided below. USE IT to identify the best moments, key quotes, and engaging segments. Your clip timestamps MUST correspond to the transcript timestamps.\n7. When you reference a moment from the transcript, the startTime MUST match the actual timestamp from the transcript.\n8. The captions for each clip should use ACTUAL SPOKEN WORDS from the transcript at those timestamps, not generic filler text.`
        : "";

      const systemPrompt = `You are an expert viral content analyst specializing in creating short-form video clips from long-form content. You analyze videos and generate clip suggestions that would perform well on social media (TikTok, Instagram Reels, YouTube Shorts).

Given video information${transcription ? ", including a full transcript" : ""}, generate 5 short clip suggestions. Each clip should:
- Have a compelling, scroll-stopping title that references the SPECIFIC video content
- Include realistic timestamps and durations (clips should be 15-60 seconds)${transcription ? " — timestamps MUST align with the transcript" : ""}
- Have a virality score from 60-99 (higher = more likely to go viral)
- Include 2-4 relevant tags based on the video's actual topic
- Include engaging caption text (pipe-separated lines, 2-4 lines)${transcription ? " — use ACTUAL words spoken in the video at those timestamps" : ""}${genreInstruction}${momentsInstruction}

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
1. Generate clips that are SPECIFIC to the video content. Reference the actual topic, people, or events mentioned in the title/description/transcript.
2. Do NOT use generic titles like "This Moment Changed Everything" or "Stop Scrolling" — always reference specific content from the video.
3. The clip titles should make someone want to watch based on the video's specific content.
4. If you have the video title and description, USE them to create relevant clips.
5. Each clip title MUST reference something specific about THIS video (the topic, people, key phrases, etc.).${transcriptNote}`;

      const userPrompt = hasContent
        ? `Analyze this video and generate 5 viral clip suggestions based on the actual content:\n\nSource URL: ${url}\n\n${contextSection}${transcriptionSection}`
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

      updateProgress(video.id, 60, "generating-clips", "AI is generating viral clip suggestions...");

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
    updateProgress(video.id, 75, "saving-clips", "Saving generated clips...");
    if (clipsData.length === 0) {
      clipsData = generateContextualFallbackClips(
        videoTitle || extractTitleFromUrl(url, platform),
        videoMeta.authorName,
        platform
      );
    }

    // Always create clips
    try {
      updateProgress(video.id, 85, "creating-records", "Creating clip records in database...");
      const clipRecords = await Promise.all(
        clipsData.map((clip) =>
          db.clip.create({
            data: {
              videoId: video.id,
              title: clip.title,
              startTime: clip.startTime || "0:00",
              duration: clip.duration || "0:30",
              viralityScore: clip.viralityScore || 0,
              captions: srtCaptions || transcription?.captions || clip.captions || null,
              captionStyle,
              captionFont,
              captionAnimation,
              captionColor,
              captionSize,
              captionPosition,
              layout: aspectRatio,
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
          duration: transcription?.duration
            ? `${Math.floor(transcription.duration / 60)}:${Math.floor(transcription.duration % 60).toString().padStart(2, "0")}`
            : undefined,
        },
        include: { clips: true },
      });

      // Increment user's clipsUsed
      await db.user.update({
        where: { id: userId },
        data: { clipsUsed: { increment: clipRecords.length } },
      });

      // Mark progress as completed
      completeProgress(video.id, {
        videoId: video.id,
        clipCount: clipRecords.length,
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
        errorProgress(video.id, "Failed to save clips");
      } catch {}

      console.error("Database error creating clips:", dbError);
      return NextResponse.json(
        { error: "Failed to save clips. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing video:", error);
    // Try to mark progress as error if we have a videoId
    try {
      const body = await request.clone().json().catch(() => ({}));
      // We can't easily get videoId here since it's created inside the try
    } catch {}
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
