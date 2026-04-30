"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Trash2,
  Save,
  Download,
  RefreshCw,
  Plus,
  X,
  Smartphone,
  Square,
  Monitor,
  Check,
  Loader2,
  Film,
  Tag,
  Type,
  LayoutGrid,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  Trophy,
  Clock,
  Copy,
  Share2,
  Star,
  ChevronDown,
  ExternalLink,
  Volume2,
  VolumeX,
  Maximize2,
  Palette,
  Waves,
  Highlighter,
  RotateCcw,
  Eye,
  MoveUp,
  ArrowUpFromLine,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Caption Style Presets (same as ProcessingSection) ────────────────────

const CAPTION_PRESETS = [
  { id: "karaoke", name: "Karaoke", textColor: "#4ade80", highlight: true, uppercase: true, bg: "rgba(0,0,0,0.6)" },
  { id: "deep-diver", name: "Deep Diver", textColor: "#94a3b8", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.5)" },
  { id: "pod-p", name: "Pod P", textColor: "#f472b6", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.6)" },
  { id: "popline", name: "Popline", textColor: "#ffffff", highlight: false, uppercase: true, bg: "transparent", outline: true },
  { id: "seamless-bounce", name: "Seamless Bounce", textColor: "#4ade80", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.4)" },
  { id: "gradient-wave", name: "Gradient Wave", textColor: "#67e8f9", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.5)" },
  { id: "beasty", name: "Beasty", textColor: "#d1d5db", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.6)" },
  { id: "youshaei", name: "Youshaei", textColor: "#5eead4", highlight: true, uppercase: true, bg: "rgba(0,0,0,0.5)" },
  { id: "mozi", name: "Mozi", textColor: "#86efac", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.5)" },
  { id: "glitch-infinite", name: "Glitch Infinite", textColor: "#fb923c", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.6)" },
  { id: "baby-earthquake", name: "Baby Earthquake", textColor: "#fde68a", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.5)" },
  { id: "neon-pulse", name: "Neon Pulse", textColor: "#e879f9", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.5)" },
  { id: "default", name: "Default", textColor: "#ffffff", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.6)" },
  { id: "bold", name: "Bold", textColor: "#ffffff", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.7)" },
  { id: "outline", name: "Outline", textColor: "#ffffff", highlight: false, uppercase: true, bg: "transparent", outline: true },
];

// ─── Font Options ────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { id: "inter", name: "Inter", family: "'Inter', sans-serif" },
  { id: "montserrat", name: "Montserrat", family: "'Montserrat', sans-serif" },
  { id: "poppins", name: "Poppins", family: "'Poppins', sans-serif" },
  { id: "roboto", name: "Roboto", family: "'Roboto', sans-serif" },
  { id: "oswald", name: "Oswald", family: "'Oswald', sans-serif" },
  { id: "bebas", name: "Bebas Neue", family: "'Bebas Neue', sans-serif" },
  { id: "permanent", name: "Permanent Marker", family: "'Permanent Marker', cursive" },
  { id: "source-code", name: "Source Code Pro", family: "'Source Code Pro', monospace" },
];

const ANIMATION_OPTIONS = [
  { id: "none", name: "None" },
  { id: "bounce", name: "Bounce" },
  { id: "wave", name: "Wave" },
  { id: "fade", name: "Fade In" },
  { id: "slide-up", name: "Slide Up" },
  { id: "glitch", name: "Glitch" },
  { id: "karaoke", name: "Karaoke" },
  { id: "rotate", name: "Rotate" },
];

const COLOR_OPTIONS = [
  { id: "white", name: "White", value: "#ffffff" },
  { id: "yellow", name: "Yellow", value: "#fde047" },
  { id: "green", name: "Green", value: "#4ade80" },
  { id: "cyan", name: "Cyan", value: "#67e8f9" },
  { id: "blue", name: "Blue", value: "#60a5fa" },
  { id: "purple", name: "Purple", value: "#c084fc" },
  { id: "pink", name: "Pink", value: "#f472b6" },
  { id: "red", name: "Red", value: "#f87171" },
  { id: "orange", name: "Orange", value: "#fb923c" },
  { id: "black", name: "Black", value: "#000000" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClipData {
  id: string;
  videoId: string;
  title: string;
  startTime: string;
  duration: string;
  viralityScore: number;
  captions: string | null;
  captionStyle: string;
  captionFont: string;
  captionAnimation: string;
  captionColor: string;
  captionSize: number;
  captionPosition: string;
  layout: string;
  templateId: string | null;
  tags: string;
  isPublished: boolean;
  publishedTo: string;
  createdAt: string;
  updatedAt: string;
}

interface VideoData {
  id: string;
  userId: string;
  sourceUrl: string;
  title: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  captionStyle: string;
  layout: string;
  isDefault: boolean;
}

type CaptionStyle = "default" | "bold" | "karaoke" | "outline";
type LayoutOption = "9:16" | "1:1" | "16:9";
type CaptionPosition = "bottom" | "center" | "top";

// ─── Video URL Helpers ─────────────────────────────────────────────────────

interface VideoSource {
  platform: "youtube" | "vimeo" | "tiktok" | "instagram" | "other";
  videoId: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
}

function parseVideoSource(url: string): VideoSource {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const videoId =
        urlObj.searchParams.get("v") ||
        (host.includes("youtu.be")
          ? urlObj.pathname.split("/").filter(Boolean).pop()
          : null) ||
        urlObj.pathname.match(/\/embed\/([^/?]+)/)?.[1] ||
        null;
      return {
        platform: "youtube",
        videoId,
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
        thumbnailUrl: videoId
          ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          : null,
      };
    }

    if (host.includes("vimeo.com")) {
      const videoId =
        urlObj.pathname.split("/").filter(Boolean).pop() || null;
      return {
        platform: "vimeo",
        videoId,
        embedUrl: videoId ? `https://player.vimeo.com/video/${videoId}` : null,
        thumbnailUrl: null,
      };
    }

    if (host.includes("tiktok.com")) {
      const parts = urlObj.pathname.split("/").filter(Boolean);
      const videoId = parts.length > 0 ? parts[parts.length - 1] : null;
      return { platform: "tiktok", videoId, embedUrl: null, thumbnailUrl: null };
    }

    if (host.includes("instagram.com")) {
      return { platform: "instagram", videoId: null, embedUrl: null, thumbnailUrl: null };
    }

    return { platform: "other", videoId: null, embedUrl: null, thumbnailUrl: null };
  } catch {
    return { platform: "other", videoId: null, embedUrl: null, thumbnailUrl: null };
  }
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function getClipEmbedUrl(
  source: VideoSource,
  startTimeStr: string,
  durationStr: string
): string | null {
  if (!source.embedUrl) return null;
  const startSeconds = parseTimeToSeconds(startTimeStr);
  const durationSeconds = parseTimeToSeconds(durationStr);
  const endSeconds = startSeconds + durationSeconds;

  if (source.platform === "youtube") {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${source.embedUrl}?start=${startSeconds}&end=${endSeconds}&autoplay=1&enablejsapi=1&origin=${origin}&rel=0&modestbranding=1`;
  }
  if (source.platform === "vimeo") {
    const mins = Math.floor(startSeconds / 60);
    const secs = startSeconds % 60;
    return `${source.embedUrl}#t=${mins}m${secs}s&autoplay=1`;
  }
  return source.embedUrl;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTags(tagsStr: string): string[] {
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-400";
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 90) return "from-green-500/20 to-emerald-500/10";
  if (score >= 80) return "from-green-500/15 to-emerald-500/5";
  if (score >= 60) return "from-yellow-500/15 to-orange-500/5";
  if (score >= 40) return "from-orange-500/15 to-red-500/5";
  return "from-red-500/15 to-pink-500/5";
}

function getClipGradient(clipId: string): string {
  const gradients = [
    "from-purple-900/60 via-indigo-900/40 to-pink-900/50",
    "from-blue-900/60 via-purple-900/40 to-cyan-900/50",
    "from-pink-900/60 via-rose-900/40 to-orange-900/50",
    "from-emerald-900/60 via-teal-900/40 to-cyan-900/50",
    "from-violet-900/60 via-purple-900/40 to-fuchsia-900/50",
    "from-amber-900/60 via-orange-900/40 to-red-900/50",
    "from-cyan-900/60 via-blue-900/40 to-indigo-900/50",
    "from-rose-900/60 via-pink-900/40 to-purple-900/50",
  ];
  let hash = 0;
  for (let i = 0; i < clipId.length; i++) {
    hash = clipId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// ─── Auto Caption Overlay Component ───────────────────────────────────────

function parseCaptions(captionsStr: string | null): string[] {
  if (!captionsStr) return [];
  return captionsStr.split("|").map((s) => s.trim()).filter(Boolean);
}

// ─── YouTube Player API Hook ──────────────────────────────────────────────

const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
};

function useYouTubePlayer(iframeRef: React.RefObject<HTMLIFrameElement | null>) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playerState, setPlayerState] = useState(-1);
  const playerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if API already loaded
    if ((window as any).YT?.Player) {
      return; // API already available
    }

    // Load API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  // Create player when iframe is available
  useEffect(() => {
    if (!iframeRef.current) return;

    // Wait for YT API to be ready
    const tryCreatePlayer = () => {
      const YT = (window as any).YT;
      if (!YT?.Player) {
        setTimeout(tryCreatePlayer, 200);
        return;
      }

      playerRef.current = new YT.Player(iframeRef.current!, {
        events: {
          onStateChange: (event: any) => {
            setPlayerState(event.data);
          },
          onReady: () => {
            // Start time tracking
            const tick = () => {
              if (playerRef.current?.getCurrentTime) {
                setCurrentTime(playerRef.current.getCurrentTime());
              }
              rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
          },
        },
      });
    };

    tryCreatePlayer();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }
    };
  }, [iframeRef]);

  return { currentTime, playerState };
}

// ─── Fallback Elapsed Time Hook ───────────────────────────────────────────

function useElapsedTime(isActive: boolean, bufferMs: number = 800) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const bufferTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const activeRef = useRef(isActive);

  // Keep activeRef in sync
  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Buffer delay to account for video loading
    bufferTimerRef.current = setTimeout(() => {
      startRef.current = performance.now();

      const tick = (now: number) => {
        if (activeRef.current) {
          setElapsed((now - startRef.current) / 1000);
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }, bufferMs);

    return () => {
      clearTimeout(bufferTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, bufferMs]);

  // Return 0 when not active, otherwise return tracked elapsed
  return isActive ? elapsed : 0;
}

// ─── Timestamped Subtitle Segments ────────────────────────────────────────

interface SubtitleSegment {
  text: string;
  words: string[];
  startTime: number;  // seconds, relative to clip start (0-based)
  endTime: number;    // seconds, relative to clip start
}

function generateSubtitleSegments(
  captionLines: string[],
  clipDurationSeconds: number
): SubtitleSegment[] {
  if (captionLines.length === 0 || clipDurationSeconds <= 0) return [];

  const segmentDuration = clipDurationSeconds / captionLines.length;

  return captionLines.map((line, i) => {
    const words = line.split(/\s+/).filter(Boolean);
    return {
      text: line,
      words,
      startTime: i * segmentDuration,
      endTime: (i + 1) * segmentDuration,
    };
  });
}

// ─── Synced Subtitle Overlay Component ────────────────────────────────────

function SubtitleOverlay({
  captions,
  style,
  font,
  animation,
  color,
  size,
  position,
  isActive,
  currentVideoTime,
  clipStartTime,
  clipDuration,
}: {
  captions: string[];
  style: string;
  font: string;
  animation: string;
  color: string;
  size: number;
  position: string;
  isActive: boolean;
  currentVideoTime: number;  // Current video playback time in seconds (absolute)
  clipStartTime: number;     // Clip start time in seconds (absolute)
  clipDuration: number;      // Clip duration in seconds
}) {
  // Get preset and font
  const preset = CAPTION_PRESETS.find((p) => p.id === style) || CAPTION_PRESETS.find((p) => p.id === "default")!;
  const fontOption = FONT_OPTIONS.find((f) => f.id === font) || FONT_OPTIONS[0];
  const effectiveColor = color !== "#ffffff" ? color : preset.textColor;

  // Calculate elapsed time within the clip (0-based)
  const clipElapsed = Math.max(0, currentVideoTime - clipStartTime);

  // Generate subtitle segments
  const segments = useMemo(
    () => generateSubtitleSegments(captions, clipDuration),
    [captions, clipDuration]
  );

  // Find current segment
  const currentSegment = isActive ? segments.find(
    seg => clipElapsed >= seg.startTime && clipElapsed < seg.endTime
  ) : null;

  if (!isActive || !currentSegment || clipElapsed > clipDuration) return null;

  // Calculate word progress within current segment
  const segmentElapsed = clipElapsed - currentSegment.startTime;
  const segmentDuration = currentSegment.endTime - currentSegment.startTime;
  const segmentProgress = Math.min(1, segmentElapsed / segmentDuration);
  const highlightedWordIndex = Math.min(
    currentSegment.words.length - 1,
    Math.floor(segmentProgress * currentSegment.words.length)
  );

  const line = currentSegment.text;
  const words = currentSegment.words;

  // Position classes
  const positionClasses =
    position === "top"
      ? "top-[12%]"
      : position === "center"
      ? "top-[45%] -translate-y-1/2"
      : "bottom-[15%]";

  // Render caption text with word-by-word highlighting
  const renderCaptionText = () => {
    const displayWords = preset.uppercase ? words.map((w) => w.toUpperCase()) : words;

    // Karaoke animation OR preset highlight with word tracking
    if (animation === "karaoke" || preset.highlight) {
      return (
        <span>
          {displayWords.map((word, i) => {
            const isHighlighted = animation === "karaoke"
              ? i === highlightedWordIndex
              : i === 0; // For highlight presets, always highlight first word

            const isPastWord = animation === "karaoke" && i < highlightedWordIndex;

            return (
              <span
                key={i}
                className="inline-block transition-all duration-150"
                style={{
                  color: isHighlighted
                    ? effectiveColor
                    : isPastWord
                    ? `${effectiveColor}cc`
                    : `${effectiveColor}66`,
                  fontWeight: isHighlighted ? 900 : isPastWord ? 800 : 700,
                  textShadow: isHighlighted
                    ? `0 0 20px ${effectiveColor}66, 0 0 40px ${effectiveColor}33`
                    : undefined,
                  transform: isHighlighted ? "scale(1.08)" : "scale(1)",
                }}
              >
                {word}{" "}
              </span>
            );
          })}
        </span>
      );
    }

    // Default: just show the full line
    return preset.uppercase ? line.toUpperCase() : line;
  };

  // Animation variants
  const getAnimationProps = (anim: string) => {
    switch (anim) {
      case "bounce":
        return { initial: { y: 15, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.4, ease: "easeOut" as const } };
      case "slide-up":
        return { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.35, ease: "easeOut" as const } };
      case "fade":
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } };
      case "glitch":
        return { initial: { opacity: 0, x: -2 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.15 } };
      case "rotate":
        return { initial: { rotate: -3, opacity: 0 }, animate: { rotate: 0, opacity: 1 }, transition: { duration: 0.3 } };
      case "wave":
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.25 } };
      default:
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } };
    }
  };

  const animProps = getAnimationProps(animation);
  const fontSize = size;

  const glitchStyle = animation === "glitch"
    ? { textShadow: `2px 0 #ff0000, -2px 0 #00ff00, 0 0 4px ${effectiveColor}44` }
    : {};

  const outlineStyle = preset.outline
    ? { WebkitTextStroke: `1.5px ${effectiveColor}`, color: "transparent" }
    : {};

  return (
    <div className={`absolute left-0 right-0 ${positionClasses} z-20 px-3 pointer-events-none`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentSegment.startTime}-${animation}`}
          {...animProps}
          className="text-center"
        >
          <span
            className="inline-block px-3 py-1.5 rounded-lg leading-tight"
            style={{
              fontFamily: fontOption.family,
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              color: preset.outline ? undefined : effectiveColor,
              background: preset.bg,
              WebkitBoxDecorationBreak: "clone",
              ...glitchStyle,
              ...outlineStyle,
            }}
          >
            {renderCaptionText()}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Progress indicator dots */}
      {segments.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: currentSegment === seg ? 12 : 4,
                height: 4,
                background: currentSegment === seg ? effectiveColor : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Clip Card Component (with video playback + captions) ─────────────────

function ClipCard({
  clip,
  index,
  isSelected,
  onClick,
  videoSource,
  videoThumbnail,
}: {
  clip: ClipData;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  videoSource: VideoSource;
  videoThumbnail: string | null;
}) {
  const tags = parseTags(clip.tags);
  const gradient = getClipGradient(clip.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playingIframeRef = isPlaying ? iframeRef : { current: null };
  const { currentTime: ytTime, playerState } = useYouTubePlayer(playingIframeRef);
  const fallbackElapsed = useElapsedTime(isPlaying);

  const thumbnailUrl = videoThumbnail || videoSource.thumbnailUrl;
  const embedUrl = getClipEmbedUrl(videoSource, clip.startTime, clip.duration);
  const captionLines = parseCaptions(clip.captions);

  const clipStartSeconds = parseTimeToSeconds(clip.startTime);
  const clipDurationSeconds = parseTimeToSeconds(clip.duration);

  // Use YouTube API time if available, otherwise fall back to elapsed time
  const effectiveTime = playerState === YT_STATE.PLAYING ? ytTime : (clipStartSeconds + fallbackElapsed);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (embedUrl) {
      setIsPlaying(true);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(false);
  };

  const toggleCaptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCaptions(!showCaptions);
  };

  // Scale font size for the card (smaller than detail panel)
  const cardFontSize = Math.max(10, Math.round(clip.captionSize * 0.45));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-pink-500 shadow-lg shadow-pink-500/20"
          : "hover:ring-1 hover:ring-white/20 hover:shadow-lg hover:shadow-black/40"
      }`}
      onClick={onClick}
    >
      {/* Thumbnail / Video Player */}
      <div className="relative aspect-[9/16] sm:aspect-[9/14] bg-black overflow-hidden">
        {isPlaying && embedUrl ? (
          /* ─── Embedded Video Player with Subtitle Overlay ─── */
          <div className="absolute inset-0">
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={clip.title}
              style={{ border: "none" }}
            />

            {/* Synced Subtitle Overlay */}
            {showCaptions && captionLines.length > 0 && (
              <SubtitleOverlay
                captions={captionLines}
                style={clip.captionStyle}
                font={clip.captionFont}
                animation={clip.captionAnimation}
                color={clip.captionColor}
                size={cardFontSize}
                position={clip.captionPosition}
                isActive={isPlaying}
                currentVideoTime={effectiveTime}
                clipStartTime={clipStartSeconds}
                clipDuration={clipDurationSeconds}
              />
            )}

            {/* Controls overlay */}
            <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5">
              {/* Caption toggle */}
              {captionLines.length > 0 && (
                <button
                  onClick={toggleCaptions}
                  className={`w-7 h-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                    showCaptions
                      ? "bg-pink-500/70 text-white"
                      : "bg-black/50 text-white/50 hover:text-white/80"
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Close player */}
              <button
                onClick={handleStop}
                className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ─── Thumbnail with Play Button + Caption Preview ─── */
          <>
            {thumbnailUrl && !imgError ? (
              <img
                src={thumbnailUrl}
                alt={clip.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Caption preview on thumbnail (first line) */}
            {captionLines.length > 0 && (
              <div className={`absolute left-0 right-0 ${clip.captionPosition === "top" ? "top-[15%]" : clip.captionPosition === "center" ? "top-[45%]" : "bottom-[18%]"} px-2 z-5 pointer-events-none`}>
                <p
                  className="text-center leading-tight"
                  style={{
                    fontFamily: FONT_OPTIONS.find((f) => f.id === clip.captionFont)?.family || "'Inter', sans-serif",
                    fontSize: `${Math.max(8, cardFontSize * 0.7)}px`,
                    fontWeight: 800,
                    color: clip.captionColor !== "#ffffff" ? clip.captionColor : (CAPTION_PRESETS.find((p) => p.id === clip.captionStyle)?.textColor || "#ffffff"),
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    background: CAPTION_PRESETS.find((p) => p.id === clip.captionStyle)?.bg || "rgba(0,0,0,0.5)",
                    display: "inline",
                    WebkitBoxDecorationBreak: "clone",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {CAPTION_PRESETS.find((p) => p.id === clip.captionStyle)?.uppercase
                    ? captionLines[0].toUpperCase()
                    : captionLines[0]}
                </p>
              </div>
            )}

            {/* Content overlay */}
            <div className="absolute top-3 left-3 right-3">
              <div className="bg-white/95 backdrop-blur-sm rounded-md px-2 py-1.5 max-w-[85%]">
                <p className="text-[11px] font-semibold text-black leading-tight line-clamp-2">
                  {clip.title}
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="absolute top-3 right-3">
              <div className="bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                <span className="text-[10px] font-medium text-white/80 tabular-nums">
                  {clip.startTime} - {clip.duration}
                </span>
              </div>
            </div>

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {embedUrl ? (
                <button
                  onClick={handlePlay}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/30 hover:scale-110 transition-all"
                >
                  <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                </button>
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Play className="w-5 h-5 text-white/50 ml-0.5" />
                </div>
              )}
            </div>

            {/* Always-visible play button */}
            {embedUrl && !isPlaying && (
              <button
                onClick={handlePlay}
                className="absolute bottom-14 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-pink-500/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-pink-500/30 hover:bg-pink-500 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
              </button>
            )}

            {/* Caption style badge */}
            {clip.captionStyle && clip.captionStyle !== "default" && (
              <div className="absolute bottom-14 right-3">
                <Badge className="bg-black/50 backdrop-blur-sm text-white/60 text-[8px] border-white/10">
                  <Type className="w-2.5 h-2.5 mr-0.5" />
                  {clip.captionStyle}
                </Badge>
              </div>
            )}

            {/* Score badge */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold tabular-nums ${getScoreColor(clip.viralityScore)}`}>
                    {clip.viralityScore}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <Trophy className="w-3 h-3 text-white/30" />
                    <Calendar className="w-3 h-3 text-white/30" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Star className="w-3 h-3 text-white/50" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Card Footer */}
      <div className="bg-[#0a0a0f] border-t border-white/5 p-3">
        <p className="text-sm font-semibold text-white/90 leading-tight line-clamp-2 mb-2">
          {clip.title}
        </p>
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 transition-colors"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
              +{tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Clip Video Player Component (with captions) ─────────────────────────

function ClipVideoPlayer({
  clip,
  videoSource,
  videoThumbnail,
}: {
  clip: ClipData;
  videoSource: VideoSource;
  videoThumbnail: string | null;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playingIframeRef = isPlaying ? iframeRef : { current: null };
  const { currentTime: ytTime, playerState } = useYouTubePlayer(playingIframeRef);
  const fallbackElapsed = useElapsedTime(isPlaying);

  const thumbnailUrl = videoThumbnail || videoSource.thumbnailUrl;
  const embedUrl = getClipEmbedUrl(videoSource, clip.startTime, clip.duration);
  const captionLines = parseCaptions(clip.captions);

  // Scale font size for the detail panel
  const panelFontSize = Math.max(12, Math.round(clip.captionSize * 0.65));

  const clipStartSeconds = parseTimeToSeconds(clip.startTime);
  const clipDurationSeconds = parseTimeToSeconds(clip.duration);

  // Use YouTube API time if available, otherwise fall back to elapsed time
  const effectiveTime = playerState === YT_STATE.PLAYING ? ytTime : (clipStartSeconds + fallbackElapsed);

  if (isPlaying && embedUrl) {
    return (
      <div className="relative aspect-[9/16] max-h-[320px] rounded-lg overflow-hidden bg-black border border-white/5">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          title={clip.title}
          style={{ border: "none" }}
        />

        {/* Synced Subtitle Overlay */}
        {showCaptions && captionLines.length > 0 && (
          <SubtitleOverlay
            captions={captionLines}
            style={clip.captionStyle}
            font={clip.captionFont}
            animation={clip.captionAnimation}
            color={clip.captionColor}
            size={panelFontSize}
            position={clip.captionPosition}
            isActive={isPlaying}
            currentVideoTime={effectiveTime}
            clipStartTime={clipStartSeconds}
            clipDuration={clipDurationSeconds}
          />
        )}

        {/* Controls */}
        <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5">
          {captionLines.length > 0 && (
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`w-7 h-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                showCaptions
                  ? "bg-pink-500/70 text-white"
                  : "bg-black/50 text-white/50 hover:text-white/80"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsPlaying(false)}
            className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[9/16] max-h-[320px] rounded-lg overflow-hidden bg-black border border-white/5 cursor-pointer group" onClick={() => embedUrl && setIsPlaying(true)}>
      {thumbnailUrl && !imgError ? (
        <img
          src={thumbnailUrl}
          alt={clip.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0d0d18] to-pink-900/20" />
      )}

      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

      {/* Caption preview on thumbnail */}
      {captionLines.length > 0 && (
        <div className={`absolute left-0 right-0 ${clip.captionPosition === "top" ? "top-[15%]" : clip.captionPosition === "center" ? "top-[45%]" : "bottom-[15%]"} px-3 z-5 pointer-events-none`}>
          <p
            className="text-center leading-tight"
            style={{
              fontFamily: FONT_OPTIONS.find((f) => f.id === clip.captionFont)?.family || "'Inter', sans-serif",
              fontSize: `${panelFontSize * 0.8}px`,
              fontWeight: 800,
              color: clip.captionColor !== "#ffffff" ? clip.captionColor : (CAPTION_PRESETS.find((p) => p.id === clip.captionStyle)?.textColor || "#ffffff"),
              textShadow: "0 1px 4px rgba(0,0,0,0.9)",
              background: CAPTION_PRESETS.find((p) => p.id === clip.captionStyle)?.bg || "rgba(0,0,0,0.5)",
              display: "inline",
              WebkitBoxDecorationBreak: "clone",
              padding: "3px 8px",
              borderRadius: "6px",
            }}
          >
            {CAPTION_PRESETS.find((p) => p.id === clip.captionStyle)?.uppercase
              ? captionLines[0].toUpperCase()
              : captionLines[0]}
          </p>
        </div>
      )}

      {/* Center play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        {embedUrl ? (
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/30 group-hover:scale-110 transition-all">
            <Play className="w-6 h-6 text-white ml-1" fill="white" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Play className="w-6 h-6 text-white/40 ml-1" />
          </div>
        )}
      </div>

      {/* Time badge */}
      <div className="absolute top-2 left-2">
        <Badge
          variant="secondary"
          className="bg-black/60 backdrop-blur-sm text-white/80 text-[10px] border-white/10"
        >
          {clip.startTime} &bull; {clip.duration}
        </Badge>
      </div>

      {/* Score */}
      <div className="absolute bottom-3 left-3">
        <span className={`text-3xl font-bold ${getScoreColor(clip.viralityScore)}`}>
          {clip.viralityScore}
        </span>
      </div>

      {/* Platform & caption indicators */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1">
        {clip.captionStyle && clip.captionStyle !== "default" && (
          <Badge className="bg-black/50 backdrop-blur-sm text-white/60 text-[9px] border-white/10">
            <Type className="w-2.5 h-2.5 mr-0.5" />
            {clip.captionStyle}
          </Badge>
        )}
        {videoSource.platform !== "other" && (
          <Badge className="bg-black/50 backdrop-blur-sm text-white/60 text-[9px] border-white/10 capitalize">
            {videoSource.platform}
          </Badge>
        )}
      </div>

      {!embedUrl && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[9px]">
            Preview not available
          </Badge>
        </div>
      )}
    </div>
  );
}

// ─── Clip Detail Panel (with caption editing) ────────────────────────────────

function ClipDetailPanel({
  clip,
  templates,
  videoSource,
  videoThumbnail,
  onClose,
  onSave,
  onDelete,
  onTogglePublish,
}: {
  clip: ClipData;
  templates: TemplateData[];
  videoSource: VideoSource;
  videoThumbnail: string | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    captions: string;
    captionStyle: CaptionStyle;
    captionFont: string;
    captionAnimation: string;
    captionColor: string;
    captionSize: number;
    captionPosition: CaptionPosition;
    layout: LayoutOption;
    tags: string[];
    templateId: string;
    isPublished: boolean;
  }) => void;
  onDelete: () => void;
  onTogglePublish: (published: boolean) => void;
}) {
  const [editTitle, setEditTitle] = useState(clip.title);
  const [editCaptions, setEditCaptions] = useState(clip.captions || "");
  const [editCaptionStyle, setEditCaptionStyle] = useState<CaptionStyle>(
    clip.captionStyle as CaptionStyle
  );
  const [editCaptionFont, setEditCaptionFont] = useState(clip.captionFont || "inter");
  const [editCaptionAnimation, setEditCaptionAnimation] = useState(clip.captionAnimation || "none");
  const [editCaptionColor, setEditCaptionColor] = useState(clip.captionColor || "#ffffff");
  const [editCaptionSize, setEditCaptionSize] = useState(clip.captionSize || 24);
  const [editCaptionPosition, setEditCaptionPosition] = useState<CaptionPosition>((clip.captionPosition as CaptionPosition) || "bottom");
  const [editLayout, setEditLayout] = useState<LayoutOption>(
    clip.layout as LayoutOption
  );
  const [editTags, setEditTags] = useState<string[]>(parseTags(clip.tags));
  const [editTemplateId, setEditTemplateId] = useState<string>(
    clip.templateId || ""
  );
  const [editIsPublished, setEditIsPublished] = useState(clip.isPublished);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCaptionCustomizer, setShowCaptionCustomizer] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        title: editTitle,
        captions: editCaptions,
        captionStyle: editCaptionStyle,
        captionFont: editCaptionFont,
        captionAnimation: editCaptionAnimation,
        captionColor: editCaptionColor,
        captionSize: editCaptionSize,
        captionPosition: editCaptionPosition,
        layout: editLayout,
        tags: editTags,
        templateId: editTemplateId,
        isPublished: editIsPublished,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
    setNewTag("");
  };

  // Live caption preview
  const previewLines = parseCaptions(editCaptions);
  const previewFont = FONT_OPTIONS.find((f) => f.id === editCaptionFont) || FONT_OPTIONS[0];
  const previewPreset = CAPTION_PRESETS.find((p) => p.id === editCaptionStyle) || CAPTION_PRESETS.find((p) => p.id === "default")!;
  const previewColor = editCaptionColor !== "#ffffff" ? editCaptionColor : previewPreset.textColor;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#0d0d14] border-l border-white/5 z-50 flex flex-col overflow-hidden"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a0a0f]">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          Edit Clip
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Panel Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Clip Video Player */}
          <ClipVideoPlayer
            clip={clip}
            videoSource={videoSource}
            videoThumbnail={videoThumbnail}
          />

          {/* Virality Score Bar */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Virality Score
              </span>
              <span className={`text-xs font-semibold ${getScoreColor(clip.viralityScore)}`}>
                {clip.viralityScore}/100
              </span>
            </Label>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${clip.viralityScore}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(clip.viralityScore)} bg-gradient-to-r from-green-500 to-emerald-400`}
              />
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50 flex items-center gap-1.5">
              <Type className="w-3 h-3" />
              Title
            </Label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-white/[0.03] border-white/10 text-white text-sm focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
            />
          </div>

          {/* Start Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/50">Start Time</Label>
              <div className="h-9 px-3 flex items-center rounded-md border border-white/10 bg-white/[0.02] text-sm text-white/60">
                {clip.startTime}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/50">Duration</Label>
              <div className="h-9 px-3 flex items-center rounded-md border border-white/10 bg-white/[0.02] text-sm text-white/60">
                {clip.duration}
              </div>
            </div>
          </div>

          {/* Open Source Link */}
          {videoSource.embedUrl && (
            <a
              href={`${videoSource.embedUrl.replace("/embed/", "/watch?v=")}&t=${parseTimeToSeconds(clip.startTime)}s`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white/[0.03] border-white/10 text-white/70 text-xs hover:bg-white/[0.06] hover:text-white"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Open on {videoSource.platform === "youtube" ? "YouTube" : videoSource.platform === "vimeo" ? "Vimeo" : "Source"}
              </Button>
            </a>
          )}

          <Separator className="bg-white/5" />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CAPTION SECTION - Full customization                              */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-semibold text-white/80">Caption Style</h3>
            </div>

            {/* Caption Presets Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {CAPTION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setEditCaptionStyle(preset.id as CaptionStyle)}
                  className={`relative rounded-lg overflow-hidden border transition-all ${
                    editCaptionStyle === preset.id
                      ? "border-white/40 ring-1 ring-white/20"
                      : "border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="aspect-[9/12] bg-black flex items-center justify-center p-1.5 relative">
                    <span
                      className="text-[8px] font-bold leading-tight text-center"
                      style={{
                        color: preset.textColor,
                        WebkitTextStroke: preset.outline ? '0.5px white' : undefined,
                      }}
                    >
                      {preset.uppercase ? "TO GET STARTED" : "To get started"}
                    </span>
                    {editCaptionStyle === preset.id && (
                      <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                        <Check className="w-2 h-2 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="py-1 px-0.5 bg-[#0d0d14] text-center">
                    <span className="text-[8px] text-white/50">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Live Caption Preview */}
            <div className="relative aspect-[9/16] max-h-[160px] rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 via-[#0d0d18] to-gray-900 border border-white/5 mx-auto max-w-[100px]">
              {previewLines.length > 0 ? (
                <div className={`absolute left-0 right-0 ${editCaptionPosition === "top" ? "top-[15%]" : editCaptionPosition === "center" ? "top-[45%]" : "bottom-[15%]"} px-2`}>
                  <p
                    className="text-center leading-tight"
                    style={{
                      fontFamily: previewFont.family,
                      fontSize: `${Math.max(8, editCaptionSize * 0.35)}px`,
                      fontWeight: 800,
                      color: previewColor,
                      background: previewPreset.bg,
                      display: "inline",
                      WebkitBoxDecorationBreak: "clone",
                      padding: "1px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    {previewPreset.uppercase ? previewLines[0].toUpperCase() : previewLines[0]}
                  </p>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] text-white/20">No captions</span>
                </div>
              )}
            </div>

            {/* Captions Text Input */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/50">Captions (pipe | separated for auto-cycle)</Label>
              <Textarea
                value={editCaptions}
                onChange={(e) => setEditCaptions(e.target.value)}
                rows={3}
                className="bg-white/[0.03] border-white/10 text-white text-sm resize-none focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                placeholder="Line 1 | Line 2 | Line 3"
              />
              <p className="text-[10px] text-white/25">
                Separate lines with | to auto-cycle during playback. Each line shows ~3 seconds.
              </p>
            </div>

            {/* Caption Customization Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCaptionCustomizer(!showCaptionCustomizer)}
              className="w-full text-xs text-white/40 hover:text-white/70 hover:bg-white/5 h-7"
            >
              {showCaptionCustomizer ? "Hide" : "Show"} customization options
              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showCaptionCustomizer ? "rotate-180" : ""}`} />
            </Button>

            <AnimatePresence>
              {showCaptionCustomizer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Font Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Type className="w-3 h-3 text-white/40" />
                      <Label className="text-[11px] text-white/50 font-medium">Font</Label>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {FONT_OPTIONS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setEditCaptionFont(font.id)}
                          className={`relative rounded-md py-1.5 px-1 text-center border transition-all ${
                            editCaptionFont === font.id
                              ? "border-white/30 bg-white/10 text-white"
                              : "border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60"
                          }`}
                        >
                          <span className="text-[10px] font-medium block" style={{ fontFamily: font.family }}>
                            Aa
                          </span>
                          <span className="text-[7px] block mt-0.5 truncate">{font.name}</span>
                          {editCaptionFont === font.id && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                              <Check className="w-1.5 h-1.5 text-black" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animation Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Waves className="w-3 h-3 text-white/40" />
                      <Label className="text-[11px] text-white/50 font-medium">Animation</Label>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {ANIMATION_OPTIONS.map((anim) => (
                        <TooltipProvider key={anim.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setEditCaptionAnimation(anim.id)}
                                className={`relative rounded-md py-1.5 px-1 text-center border transition-all flex flex-col items-center gap-0.5 ${
                                  editCaptionAnimation === anim.id
                                    ? "border-white/30 bg-white/10 text-white"
                                    : "border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60"
                                }`}
                              >
                                <span className="text-[10px]">{anim.name}</span>
                                {editCaptionAnimation === anim.id && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                                    <Check className="w-1.5 h-1.5 text-black" />
                                  </div>
                                )}
                              </button>
                            </TooltipTrigger>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3 h-3 text-white/40" />
                      <Label className="text-[11px] text-white/50 font-medium">Color</Label>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_OPTIONS.map((colorOpt) => (
                        <button
                          key={colorOpt.id}
                          onClick={() => setEditCaptionColor(colorOpt.value)}
                          className={`relative w-7 h-7 rounded-full border-2 transition-all ${
                            editCaptionColor === colorOpt.value
                              ? "border-white scale-110"
                              : "border-white/10 hover:border-white/30 hover:scale-105"
                          }`}
                          style={{ backgroundColor: colorOpt.value }}
                          title={colorOpt.name}
                        >
                          {editCaptionColor === colorOpt.value && (
                            <Check className="w-3 h-3 text-white absolute inset-0 m-auto" style={{ color: colorOpt.value === "#ffffff" || colorOpt.value === "#fde047" ? "#000" : "#fff" }} />
                          )}
                        </button>
                      ))}
                      {/* Custom color picker */}
                      <div className="relative">
                        <input
                          type="color"
                          value={editCaptionColor}
                          onChange={(e) => setEditCaptionColor(e.target.value)}
                          className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer"
                        />
                        <div className="w-7 h-7 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center hover:border-white/40 transition-colors">
                          <Plus className="w-3 h-3 text-white/40" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Position Selection */}
                  <div className="space-y-2">
                    <Label className="text-[11px] text-white/50 font-medium">Position</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["top", "center", "bottom"] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setEditCaptionPosition(pos)}
                          className={`py-1.5 px-2 rounded-md border text-[10px] font-medium capitalize transition-all ${
                            editCaptionPosition === pos
                              ? "border-pink-500/50 bg-pink-500/20 text-pink-300"
                              : "border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60"
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-white/50 font-medium">Size</Label>
                      <span className="text-[10px] text-white/40 tabular-nums">{editCaptionSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={48}
                      value={editCaptionSize}
                      onChange={(e) => setEditCaptionSize(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator className="bg-white/5" />

          {/* Layout Toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Layout</Label>
            <ToggleGroup type="single" value={editLayout} onValueChange={(val) => { if (val) setEditLayout(val as LayoutOption); }} variant="outline" className="w-full">
              <ToggleGroupItem value="9:16" className="flex-1 text-xs text-white/60 data-[state=on]:bg-pink-500/20 data-[state=on]:text-pink-300 data-[state=on]:border-pink-500/30 border-white/10 hover:bg-white/5 hover:text-white/80">
                <Smartphone className="w-3.5 h-3.5 mr-1" />9:16
              </ToggleGroupItem>
              <ToggleGroupItem value="1:1" className="flex-1 text-xs text-white/60 data-[state=on]:bg-pink-500/20 data-[state=on]:text-pink-300 data-[state=on]:border-pink-500/30 border-white/10 hover:bg-white/5 hover:text-white/80">
                <Square className="w-3.5 h-3.5 mr-1" />1:1
              </ToggleGroupItem>
              <ToggleGroupItem value="16:9" className="flex-1 text-xs text-white/60 data-[state=on]:bg-pink-500/20 data-[state=on]:text-pink-300 data-[state=on]:border-pink-500/30 border-white/10 hover:bg-white/5 hover:text-white/80">
                <Monitor className="w-3.5 h-3.5 mr-1" />16:9
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50 flex items-center gap-1.5">
              <Tag className="w-3 h-3" />Tags
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-white/5 text-white/70 border-white/10 text-xs pr-1">
                  {tag}
                  <button onClick={() => setEditTags(editTags.filter((t) => t !== tag))} className="ml-1 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag..."
                className="bg-white/[0.03] border-white/10 text-white text-xs h-8 focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
              />
              <Button type="button" variant="ghost" size="sm" onClick={handleAddTag} className="h-8 text-white/50 hover:text-white hover:bg-white/5 shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Template */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Template</Label>
            <Select value={editTemplateId || "none"} onValueChange={(val) => setEditTemplateId(val === "none" ? "" : val)}>
              <SelectTrigger className="bg-white/[0.03] border-white/10 text-white text-sm w-full">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="none" className="text-white/50 focus:bg-white/10 focus:text-white">No Template</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-white/80 focus:bg-white/10 focus:text-white">
                    {t.name}{t.isDefault && <span className="text-white/30 ml-1">(default)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-white/5" />

          {/* Publish Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs text-white/50">Publish</Label>
              <p className="text-[10px] text-white/30">Make this clip public</p>
            </div>
            <Switch
              checked={editIsPublished}
              onCheckedChange={(val) => { setEditIsPublished(val); onTogglePublish(val); }}
              className="data-[state=checked]:bg-pink-500"
            />
          </div>

          <Separator className="bg-white/5" />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/20"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border-red-500/20"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ClipEditorSection() {
  const { user, activeVideoId, activeClipId, setActiveClipId, setCurrentView } =
    useAppStore();

  const [clips, setClips] = useState<ClipData[]>([]);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "time" | "newest">("score");
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const videoSource = video?.sourceUrl ? parseVideoSource(video.sourceUrl) : { platform: "other" as const, videoId: null, embedUrl: null, thumbnailUrl: null };

  const fetchVideo = useCallback(async () => {
    if (!activeVideoId) return;
    try {
      const res = await fetch(`/api/videos/${activeVideoId}?userId=${user?.id || ''}`);
      if (res.ok) {
        const json = await res.json();
        setVideo(json.data || null);
      }
    } catch (err) {
      console.error("Failed to fetch video:", err);
    }
  }, [activeVideoId]);

  const fetchClips = useCallback(async () => {
    if (!activeVideoId) return;
    try {
      const userId = user?.id || "";
      const res = await fetch(`/api/clips?videoId=${activeVideoId}${userId ? `&userId=${userId}` : ""}`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setClips(Array.isArray(json.data) ? json.data : []);
      } else {
        setClips([]);
      }
    } catch (err) {
      console.error("Failed to fetch clips:", err);
      setClips([]);
    }
  }, [activeVideoId, user?.id]);

  const fetchTemplates = useCallback(async () => {
    try {
      const userId = user?.id || "";
      const res = await fetch(`/api/templates${userId ? `?userId=${userId}` : ""}`);
      if (res.ok) {
        const json = await res.json();
        setTemplates(Array.isArray(json.data) ? json.data : []);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setTemplates([]);
    }
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchVideo(), fetchClips(), fetchTemplates()]);
      } catch (err) {
        console.error("Failed to load editor data:", err);
      }
      setIsLoading(false);
    };
    if (activeVideoId) load();
  }, [activeVideoId, fetchVideo, fetchClips, fetchTemplates]);

  useEffect(() => {
    if (!activeClipId) setShowDetailPanel(false);
  }, [activeClipId]);

  const sortedClips = [...clips].sort((a, b) => {
    switch (sortBy) {
      case "score":
        return b.viralityScore - a.viralityScore;
      case "time":
        return a.startTime.localeCompare(b.startTime);
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const handleExportAll = useCallback(async () => {
    if (clips.length === 0) return;
    setIsExporting(true);
    try {
      const exportData = clips.map((clip) => ({
        title: clip.title,
        startTime: clip.startTime,
        duration: clip.duration,
        viralityScore: clip.viralityScore,
        captions: clip.captions,
        captionStyle: clip.captionStyle,
        captionFont: clip.captionFont,
        captionAnimation: clip.captionAnimation,
        captionColor: clip.captionColor,
        layout: clip.layout,
        tags: parseTags(clip.tags),
      }));
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `opusclip-export-${video?.title || "clips"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export clips:", err);
    } finally {
      setIsExporting(false);
    }
  }, [clips, video?.title]);

  const handleClipClick = useCallback(
    (clipId: string) => {
      setActiveClipId(clipId);
      setShowDetailPanel(true);
    },
    [setActiveClipId]
  );

  const handleSaveClip = useCallback(
    async (data: {
      title: string;
      captions: string;
      captionStyle: CaptionStyle;
      captionFont: string;
      captionAnimation: string;
      captionColor: string;
      captionSize: number;
      captionPosition: CaptionPosition;
      layout: LayoutOption;
      tags: string[];
      templateId: string;
      isPublished: boolean;
    }) => {
      if (!activeClipId) return;
      try {
        const res = await fetch(`/api/clips/${activeClipId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            userId: user?.id,
          }),
        });
        if (res.ok) {
          await fetchClips();
        }
      } catch (err) {
        console.error("Failed to save clip:", err);
      }
    },
    [activeClipId, user?.id, fetchClips]
  );

  const handleDeleteClip = useCallback(async () => {
    if (!activeClipId) return;
    try {
      const res = await fetch(
        `/api/clips/${activeClipId}${user?.id ? `?userId=${user.id}` : ""}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setActiveClipId(null);
        setShowDetailPanel(false);
        await fetchClips();
      }
    } catch (err) {
      console.error("Failed to delete clip:", err);
    }
  }, [activeClipId, user?.id, setActiveClipId, fetchClips]);

  const handleTogglePublish = useCallback(
    async (published: boolean) => {
      if (!activeClipId) return;
      try {
        await fetch(`/api/clips/${activeClipId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished: published, userId: user?.id }),
        });
        await fetchClips();
      } catch (err) {
        console.error("Failed to toggle publish:", err);
      }
    },
    [activeClipId, user?.id, fetchClips]
  );

  const selectedClip = clips.find((c) => c.id === activeClipId) || null;

  if (!activeVideoId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white/60 mb-2">No Video Selected</h2>
          <p className="text-white/40 mb-6">Select a video from your dashboard to start editing clips</p>
          <Button
            onClick={() => setCurrentView("dashboard")}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-spin" />
          <p className="text-white/60">Loading clips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-black/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("dashboard")}
            className="text-white/60 hover:text-white hover:bg-white/5 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-5 bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-[300px]">
              {video?.title || "Video Clips"}
            </span>
            <span className="text-sm text-white/30">({clips.length})</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {videoSource.platform !== "other" && (
            <Badge className="bg-white/5 text-white/50 border-white/10 text-[10px] capitalize hidden sm:inline-flex">
              {videoSource.platform}
            </Badge>
          )}
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as "score" | "time" | "newest")}>
            <SelectTrigger className="h-8 w-auto gap-1 bg-white/[0.03] border-white/10 text-white/60 text-xs hover:bg-white/[0.06] hover:text-white/80">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="score" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">By Score</SelectItem>
              <SelectItem value="time" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">By Time</SelectItem>
              <SelectItem value="newest" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Newest First</SelectItem>
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="h-5 bg-white/10 hidden sm:block" />
          <Button
            size="sm"
            onClick={handleExportAll}
            disabled={isExporting || clips.length === 0}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/20 disabled:opacity-50 text-xs"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
            <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export All"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("dashboard")}
            className="text-white/40 hover:text-white hover:bg-white/5 hidden md:flex"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Clip Gallery Grid */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white/10" />
            </div>
            <p className="text-white/40 text-sm font-medium mb-1">No clips generated</p>
            <p className="text-white/20 text-xs">Try processing another video</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {sortedClips.map((clip, i) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                index={i}
                isSelected={activeClipId === clip.id}
                onClick={() => handleClipClick(clip.id)}
                videoSource={videoSource}
                videoThumbnail={video?.thumbnailUrl || null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clip Detail Side Panel */}
      <AnimatePresence>
        {showDetailPanel && selectedClip && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => {
                setShowDetailPanel(false);
                setActiveClipId(null);
              }}
            />
            <ClipDetailPanel
              clip={selectedClip}
              templates={templates}
              videoSource={videoSource}
              videoThumbnail={video?.thumbnailUrl || null}
              onClose={() => {
                setShowDetailPanel(false);
                setActiveClipId(null);
              }}
              onSave={handleSaveClip}
              onDelete={handleDeleteClip}
              onTogglePublish={handleTogglePublish}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
