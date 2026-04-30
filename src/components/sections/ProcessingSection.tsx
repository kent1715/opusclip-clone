"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  X,
  Loader2,
  Play,
  Zap,
  Info,
  Upload,
  ChevronRight,
  Smartphone,
  Square,
  Monitor,
  Sparkles,
  Film,
  Type,
  Palette,
  SlidersHorizontal,
  Clock,
  RefreshCw,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Waves,
  MoveUp,
  ArrowUpFromLine,
  RotateCcw,
  Paintbrush,
  Highlighter,
  CircleDot,
  Check,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Caption Style Presets ────────────────────────────────────────────────

const CAPTION_PRESETS = [
  { id: "karaoke", name: "Karaoke", textColor: "#4ade80", bgColor: "from-green-600 to-green-500", previewText: "TO GET STARTED", highlight: "TO", highlightColor: "#4ade80" },
  { id: "deep-diver", name: "Deep Diver", textColor: "#94a3b8", bgColor: "from-blue-800 to-blue-600", previewText: "To get started", highlight: null, highlightColor: null },
  { id: "pod-p", name: "Pod P", textColor: "#f472b6", bgColor: "from-pink-600 to-purple-600", previewText: "TO GET STARTED", highlight: null, highlightColor: null },
  { id: "popline", name: "Popline", textColor: "#ffffff", bgColor: "from-gray-900 to-gray-800", previewText: "TO GET STARTED", highlight: null, highlightColor: null, outline: true },
  { id: "seamless-bounce", name: "Seamless Bounce", textColor: "#4ade80", bgColor: "from-green-600 to-emerald-500", previewText: "To get started", highlight: null, highlightColor: null, isNew: true },
  { id: "gradient-wave", name: "Gradient Wave", textColor: "#67e8f9", bgColor: "from-cyan-600 to-blue-500", previewText: "TO GET STARTED", highlight: null, highlightColor: null },
  { id: "beasty", name: "Beasty", textColor: "#d1d5db", bgColor: "from-gray-900 to-gray-800", previewText: "TO GET STARTED", highlight: null, highlightColor: null },
  { id: "youshaei", name: "Youshaei", textColor: "#5eead4", bgColor: "from-teal-700 to-gray-800", previewText: "TO GET STARTED", highlight: "TO", highlightColor: "#5eead4" },
  { id: "mozi", name: "Mozi", textColor: "#86efac", bgColor: "from-green-700 to-green-500", previewText: "TO GET STARTED", highlight: null, highlightColor: null },
  { id: "glitch-infinite", name: "Glitch Infinite", textColor: "#fb923c", bgColor: "from-orange-700 to-red-600", previewText: "To get started", highlight: null, highlightColor: null, isNew: true },
  { id: "baby-earthquake", name: "Baby Earthquake", textColor: "#fde68a", bgColor: "from-amber-800 to-amber-600", previewText: "to get started", highlight: null, highlightColor: null, isNew: true },
  { id: "neon-pulse", name: "Neon Pulse", textColor: "#e879f9", bgColor: "from-fuchsia-700 to-purple-600", previewText: "TO GET STARTED", highlight: null, highlightColor: null },
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

// ─── Animation Options ──────────────────────────────────────────────────

const ANIMATION_OPTIONS = [
  { id: "none", name: "None", icon: Type, description: "Static text" },
  { id: "bounce", name: "Bounce", icon: ArrowUpFromLine, description: "Bouncing text" },
  { id: "wave", name: "Wave", icon: Waves, description: "Wave motion" },
  { id: "fade", name: "Fade In", icon: Eye, description: "Fade in/out" },
  { id: "slide-up", name: "Slide Up", icon: MoveUp, description: "Slide from below" },
  { id: "glitch", name: "Glitch", icon: RefreshCw, description: "Glitch effect" },
  { id: "karaoke", name: "Karaoke", icon: Highlighter, description: "Word highlight" },
  { id: "rotate", name: "Rotate", icon: RotateCcw, description: "Rotating text" },
];

// ─── Color Options ──────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────

type AspectRatio = "9:16" | "1:1" | "16:9";

interface VideoPreview {
  title: string | null;
  thumbnailUrl: string | null;
  authorName: string | null;
  duration: string | null;
  platform: string;
}

// ─── Component ────────────────────────────────────────────────────────────

export function ProcessingSection() {
  const { user, pendingUrl, setPendingUrl, setCurrentView, setActiveVideoId } = useAppStore();

  // URL state
  const [url, setUrl] = useState(pendingUrl || "");
  const [videoPreview, setVideoPreview] = useState<VideoPreview | null>(null);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  // Settings state
  const [clipMode, setClipMode] = useState<"ai" | "none">("ai");
  const [clipModel, setClipModel] = useState("auto");
  const [genre, setGenre] = useState("auto");
  const [clipLength, setClipLength] = useState("auto");
  const [autoHook, setAutoHook] = useState(true);
  const [specificMoments, setSpecificMoments] = useState("");
  const [timeframeStart, setTimeframeStart] = useState(0);
  const [timeframeEnd, setTimeframeEnd] = useState(100);
  const [speechLanguage, setSpeechLanguage] = useState("auto");

  // Caption state
  const [selectedCaption, setSelectedCaption] = useState("karaoke");
  const [captionTab, setCaptionTab] = useState("presets");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");

  // Caption customization state
  const [selectedFont, setSelectedFont] = useState("inter");
  const [selectedAnimation, setSelectedAnimation] = useState("karaoke");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [captionSize, setCaptionSize] = useState(24);
  const [captionPosition, setCaptionPosition] = useState<"bottom" | "center" | "top">("bottom");
  const [showCaptionCustomizer, setShowCaptionCustomizer] = useState(false);

  // Fetch video preview when URL changes
  useEffect(() => {
    if (!url.trim()) {
      setVideoPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsFetchingPreview(true);
      try {
        const res = await fetch(`/api/video-preview?url=${encodeURIComponent(url.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setVideoPreview(data.data);
          }
        }
      } catch {
        // Silently fail - preview is optional
      } finally {
        setIsFetchingPreview(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [url]);

  // ─── Process Handler ──────────────────────────────────────────────────────

  const handleProcess = useCallback(async () => {
    if (!url.trim() || !user?.id) return;

    setIsProcessing(true);
    setProcessError(null);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url: url.trim(),
          userId: user.id,
          settings: {
            clipModel,
            genre,
            clipLength,
            autoHook,
            specificMoments: specificMoments || undefined,
            timeframeStart,
            timeframeEnd,
            speechLanguage,
            captionStyle: selectedCaption,
            aspectRatio,
            captionFont: selectedFont,
            captionAnimation: selectedAnimation,
            captionColor: selectedColor,
            captionSize,
            captionPosition,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process video");
      }

      // Navigate to editor with the video
      if (data.data?.id) {
        setActiveVideoId(data.data.id);
        setCurrentView("editor");
      }
    } catch (err) {
      setProcessError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsProcessing(false);
    }
  }, [url, user?.id, clipModel, genre, clipLength, autoHook, specificMoments, timeframeStart, timeframeEnd, speechLanguage, selectedCaption, aspectRatio, selectedFont, selectedAnimation, selectedColor, captionSize, captionPosition, setActiveVideoId, setCurrentView]);

  const handleRemoveUrl = useCallback(() => {
    setUrl("");
    setPendingUrl("");
    setVideoPreview(null);
  }, [setPendingUrl]);

  const creditUsage = user ? Math.max(0, user.clipsLimit - user.clipsUsed) : 0;
  const videoDuration = videoPreview?.duration || "0:00:00";

  // Current caption preview style
  const currentFont = FONT_OPTIONS.find(f => f.id === selectedFont) || FONT_OPTIONS[0];
  const currentAnimation = ANIMATION_OPTIONS.find(a => a.id === selectedAnimation) || ANIMATION_OPTIONS[0];
  const currentColor = COLOR_OPTIONS.find(c => c.id === selectedColor) || COLOR_OPTIONS[0];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top Notification Bar */}
      {user?.plan === "free" && (
        <div className="w-full bg-[#1a1a2e] border-b border-white/5 px-4 py-2 flex items-center justify-center gap-3">
          <span className="text-xs text-white/50">
            You are using the Free Plan of OpusClip with watermark and limited features.
          </span>
          <Button
            size="sm"
            className="h-6 text-[10px] px-3 bg-white/10 hover:bg-white/15 text-white/70 border-0 rounded"
            onClick={() => setCurrentView("settings")}
          >
            Upgrade
          </Button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView("dashboard")}
          className="text-white/60 hover:text-white hover:bg-white/5 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {/* ─── URL Input Section ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* URL Input with Remove */}
          <div className="relative flex items-center gap-2 bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 focus-within:border-pink-500/30 transition-colors">
            <Film className="w-4 h-4 text-white/20 shrink-0" />
            <input
              type="text"
              placeholder="Paste a YouTube, TikTok, or Vimeo link..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPendingUrl(e.target.value);
              }}
              className="flex-1 bg-transparent text-white/90 placeholder:text-white/25 outline-none text-sm"
              disabled={isProcessing}
            />
            {url && (
              <button
                onClick={handleRemoveUrl}
                className="text-white/30 hover:text-white/60 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Get Clips Button */}
          <Button
            size="lg"
            onClick={handleProcess}
            disabled={isProcessing || !url.trim()}
            className="w-full h-12 bg-white text-black hover:bg-gray-100 border-0 rounded-xl font-semibold text-base shadow-lg disabled:opacity-50 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Get clips in 1 click
              </>
            )}
          </Button>

          {/* Speech Language & Credit Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/40">Speech language:</span>
              <Select value={speechLanguage} onValueChange={setSpeechLanguage}>
                <SelectTrigger className="h-7 w-auto min-w-[120px] bg-transparent border-0 text-white/70 text-xs p-0 gap-1 hover:text-white focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="auto" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Auto Detect</SelectItem>
                  <SelectItem value="en" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">English</SelectItem>
                  <SelectItem value="id" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Indonesian</SelectItem>
                  <SelectItem value="es" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Spanish</SelectItem>
                  <SelectItem value="fr" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">French</SelectItem>
                  <SelectItem value="de" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">German</SelectItem>
                  <SelectItem value="ja" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Japanese</SelectItem>
                  <SelectItem value="ko" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Korean</SelectItem>
                  <SelectItem value="zh" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Chinese</SelectItem>
                  <SelectItem value="pt" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Portuguese</SelectItem>
                  <SelectItem value="ar" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Arabic</SelectItem>
                  <SelectItem value="hi" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button className="flex items-center gap-1.5 text-white/30 hover:text-white/50 transition-colors text-xs">
              <Upload className="w-3.5 h-3.5" />
              Upload .SRT (optional)
            </button>

            <div className="flex items-center gap-1.5 text-white/30 text-xs ml-auto">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Credit usage: <span className="text-white/60 font-medium">{creditUsage}</span>
              <Info className="w-3 h-3 text-white/20 cursor-help" />
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {processError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
              >
                <Info className="w-4 h-4 shrink-0" />
                {processError}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Video Thumbnail Preview ─────────────────────────────────────── */}
        {url.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#1a1a2e]">
              <div className="aspect-video relative flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                {/* Thumbnail */}
                {videoPreview?.thumbnailUrl ? (
                  <img
                    src={videoPreview.thumbnailUrl}
                    alt={videoPreview.title || "Video thumbnail"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0d0d18] to-pink-900/20" />
                )}

                {/* Fetching overlay */}
                {isFetchingPreview && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                  </div>
                )}

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center z-5">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/30 transition-colors">
                    <Play className="w-6 h-6 text-white ml-1" fill="white" />
                  </div>
                </div>

                {/* 1080p Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-black/60 backdrop-blur-sm text-white/80 text-[10px] border-white/10">
                    1080p
                  </Badge>
                </div>

                {/* Video title overlay */}
                {videoPreview?.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-8 z-10">
                    <p className="text-sm font-medium text-white/90 line-clamp-2">
                      {videoPreview.title}
                    </p>
                    {videoPreview.authorName && (
                      <p className="text-xs text-white/50 mt-1">
                        {videoPreview.authorName}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Copyright Disclaimer */}
            <p className="text-[11px] text-white/25 leading-relaxed">
              Using video you don&apos;t own may violate copyright laws. By continuing, you confirm this is your own original content.
            </p>
          </motion.div>
        )}

        {/* ─── AI Clipping Settings ──────────────────────────────────────────── */}
        {url.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111118] border border-white/5 rounded-xl p-5 space-y-5"
          >
            {/* Tabs: AI Clipping / Don't Clip */}
            <Tabs value={clipMode} onValueChange={(val) => setClipMode(val as "ai" | "none")}>
              <TabsList className="bg-white/5 border border-white/5 h-9 p-0.5">
                <TabsTrigger
                  value="ai"
                  className="text-xs px-4 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  AI clipping
                </TabsTrigger>
                <TabsTrigger
                  value="none"
                  className="text-xs px-4 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md transition-all"
                >
                  Don&apos;t clip
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {clipMode === "ai" && (
              <div className="space-y-4">
                {/* Clip Model, Genre, Length Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/40">Clip model</Label>
                    <Select value={clipModel} onValueChange={setClipModel}>
                      <SelectTrigger className="h-9 bg-white/[0.03] border-white/10 text-white/70 text-sm hover:bg-white/[0.06]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="auto" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Auto</SelectItem>
                        <SelectItem value="fast" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Fast</SelectItem>
                        <SelectItem value="quality" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Quality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/40">Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger className="h-9 bg-white/[0.03] border-white/10 text-white/70 text-sm hover:bg-white/[0.06]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="auto" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Auto</SelectItem>
                        <SelectItem value="comedy" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Comedy</SelectItem>
                        <SelectItem value="education" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Education</SelectItem>
                        <SelectItem value="music" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Music</SelectItem>
                        <SelectItem value="sports" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Sports</SelectItem>
                        <SelectItem value="news" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">News</SelectItem>
                        <SelectItem value="gaming" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Gaming</SelectItem>
                        <SelectItem value="vlog" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Vlog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/40">Clip Length</Label>
                    <Select value={clipLength} onValueChange={setClipLength}>
                      <SelectTrigger className="h-9 bg-white/[0.03] border-white/10 text-white/70 text-sm hover:bg-white/[0.06]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="auto" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Auto (0m-3m)</SelectItem>
                        <SelectItem value="short" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Short (0m-1m)</SelectItem>
                        <SelectItem value="medium" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Medium (1m-2m)</SelectItem>
                        <SelectItem value="long" className="text-white/80 focus:bg-white/10 focus:text-white text-sm">Long (2m-3m)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Auto Hook Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-white/60">Auto hook</Label>
                    <Info className="w-3.5 h-3.5 text-white/20 cursor-help" />
                  </div>
                  <Switch
                    checked={autoHook}
                    onCheckedChange={setAutoHook}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white/10"
                  />
                </div>

                {/* Include Specific Moments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/60">Include specific moments</Label>
                    <button className="text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors flex items-center gap-1">
                      Not sure how to prompt?
                      <ChevronRight className="w-3 h-3" />
                      learn more
                    </button>
                  </div>
                  <Input
                    value={specificMoments}
                    onChange={(e) => setSpecificMoments(e.target.value)}
                    placeholder='Example: find moments when someone scored'
                    className="h-9 bg-white/[0.03] border-white/10 text-white/70 text-sm placeholder:text-white/20 focus-visible:border-pink-500/30 focus-visible:ring-pink-500/10"
                  />
                </div>

                {/* Processing Timeframe */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/60">Processing timeframe</Label>
                    <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-[10px] px-2">
                      Credit saver
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Slider
                      value={[timeframeStart, timeframeEnd]}
                      onValueChange={([start, end]) => {
                        setTimeframeStart(start);
                        setTimeframeEnd(end);
                      }}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white/20 [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_.relative]:h-1.5 [&_[data-orientation=horizontal]>.bg-primary]:bg-gradient-to-r [&_[data-orientation=horizontal]>.bg-primary]:from-pink-500 [&_[data-orientation=horizontal]>.bg-primary]:to-purple-500"
                    />
                    <div className="flex items-center justify-between text-xs text-white/30 tabular-nums">
                      <span>0:00:00</span>
                      <span>{videoDuration}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {clipMode === "none" && (
              <div className="py-6 text-center">
                <p className="text-sm text-white/30">
                  No clipping will be applied. The full video will be processed as-is.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Caption Style Section ────────────────────────────────────────── */}
        {url.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111118] border border-white/5 rounded-xl p-5 space-y-5"
          >
            {/* Presets / My Templates Tabs */}
            <div className="flex items-center justify-between">
              <Tabs value={captionTab} onValueChange={setCaptionTab}>
                <TabsList className="bg-white/5 border border-white/5 h-8 p-0.5">
                  <TabsTrigger
                    value="presets"
                    className="text-xs px-3 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md transition-all"
                  >
                    Quick presets
                  </TabsTrigger>
                  <TabsTrigger
                    value="templates"
                    className="text-xs px-3 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md transition-all"
                  >
                    My templates
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Navigation arrows */}
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {captionTab === "presets" && (
              <>
                {/* Caption Section Header */}
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-white/40" />
                  <h3 className="text-sm font-medium text-white/60">Caption</h3>
                </div>

                {/* Caption Presets Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {CAPTION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedCaption(preset.id)}
                      className={`group relative rounded-lg overflow-hidden border transition-all ${
                        selectedCaption === preset.id
                          ? "border-white/40 ring-1 ring-white/20"
                          : "border-white/5 hover:border-white/15"
                      }`}
                    >
                      {/* Preview Background */}
                      <div className={`aspect-[9/14] bg-gradient-to-r ${preset.bg} flex items-center justify-center p-2 relative`}>
                        <span
                          className={`text-[10px] sm:text-xs font-bold leading-tight text-center`}
                          style={{
                            color: preset.textColor,
                            WebkitTextStroke: preset.outline ? '0.5px white' : undefined,
                          }}
                        >
                          {preset.highlight ? (
                            <>
                              <span style={{ color: preset.highlightColor || preset.textColor }}>{preset.highlight}</span>{" "}
                              {preset.previewText.replace(preset.highlight + " ", "")}
                            </>
                          ) : (
                            preset.previewText
                          )}
                        </span>

                        {/* New badge */}
                        {preset.isNew && (
                          <div className="absolute top-1 right-1">
                            <Badge className="bg-green-500 text-[8px] px-1 py-0 text-white border-0 h-4">
                              New
                            </Badge>
                          </div>
                        )}

                        {/* Selected indicator */}
                        {selectedCaption === preset.id && (
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <div className="py-1.5 px-1 bg-[#0d0d14] text-center">
                        <span className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">
                          {preset.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <Separator className="bg-white/5" />

                {/* ─── Caption Customization Section ──────────────────────── */}
                <div className="space-y-5">
                  {/* Customize Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paintbrush className="w-4 h-4 text-white/40" />
                      <h3 className="text-sm font-medium text-white/60">Customize Caption</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCaptionCustomizer(!showCaptionCustomizer)}
                      className="text-xs text-white/40 hover:text-white/70 hover:bg-white/5 h-7"
                    >
                      {showCaptionCustomizer ? "Hide" : "Show"} options
                      <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showCaptionCustomizer ? "rotate-180" : ""}`} />
                    </Button>
                  </div>

                  {/* Live Caption Preview */}
                  <div className="relative aspect-[9/16] max-h-[200px] rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 via-[#0d0d18] to-gray-900 border border-white/5 flex items-center justify-center mx-auto max-w-[120px]">
                    <div
                      className={`text-center px-3 ${
                        captionPosition === "top" ? "self-start pt-4" :
                        captionPosition === "center" ? "self-center" :
                        "self-end pb-4"
                      }`}
                    >
                      <span
                        className="font-bold leading-tight block"
                        style={{
                          fontFamily: currentFont.family,
                          fontSize: `${captionSize * 0.5}px`,
                          color: selectedColor,
                          textShadow: selectedAnimation === "glitch" ? "2px 0 #ff0000, -2px 0 #00ff00" :
                                     selectedAnimation === "karaoke" ? "0 0 10px rgba(255,255,255,0.3)" : undefined,
                        }}
                      >
                        To get started
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showCaptionCustomizer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-5 overflow-hidden"
                      >
                        {/* ─── Font Selection ──────────────────────────────── */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Type className="w-3.5 h-3.5 text-white/40" />
                            <Label className="text-xs text-white/50 font-medium">Font</Label>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                            {FONT_OPTIONS.map((font) => (
                              <button
                                key={font.id}
                                onClick={() => setSelectedFont(font.id)}
                                className={`relative rounded-lg py-2 px-2 text-center border transition-all ${
                                  selectedFont === font.id
                                    ? "border-white/30 bg-white/10 text-white"
                                    : "border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60"
                                }`}
                              >
                                <span className="text-[11px] font-medium block" style={{ fontFamily: font.family }}>
                                  Aa
                                </span>
                                <span className="text-[8px] block mt-0.5 truncate">{font.name}</span>
                                {selectedFont === font.id && (
                                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                                    <Check className="w-2 h-2 text-black" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ─── Animation Selection ──────────────────────────── */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Waves className="w-3.5 h-3.5 text-white/40" />
                            <Label className="text-xs text-white/50 font-medium">Animation</Label>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                            {ANIMATION_OPTIONS.map((anim) => (
                              <TooltipProvider key={anim.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => setSelectedAnimation(anim.id)}
                                      className={`relative rounded-lg py-2 px-2 text-center border transition-all flex flex-col items-center gap-1 ${
                                        selectedAnimation === anim.id
                                          ? "border-white/30 bg-white/10 text-white"
                                          : "border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60"
                                      }`}
                                    >
                                      <anim.icon className="w-3.5 h-3.5" />
                                      <span className="text-[8px] leading-tight">{anim.name}</span>
                                      {selectedAnimation === anim.id && (
                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                                          <Check className="w-2 h-2 text-black" />
                                        </div>
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="bg-[#1a1a2e] border-white/10 text-white/70 text-xs">
                                    {anim.description}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        </div>

                        {/* ─── Color Selection ─────────────────────────────── */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5 text-white/40" />
                            <Label className="text-xs text-white/50 font-medium">Color</Label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((color) => (
                              <button
                                key={color.id}
                                onClick={() => setSelectedColor(color.id)}
                                className={`relative w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${
                                  selectedColor === color.id
                                    ? "border-white scale-110 shadow-lg"
                                    : "border-white/10 hover:border-white/30 hover:scale-105"
                                }`}
                                style={{ backgroundColor: color.value }}
                              >
                                {selectedColor === color.id && (
                                  <Check className={`w-3.5 h-3.5 ${color.id === "white" || color.id === "yellow" ? "text-black" : "text-white"}`} />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Separator className="bg-white/5" />

                        {/* ─── Size & Position Row ─────────────────────────── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Size Slider */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-white/40">Size</Label>
                              <span className="text-[10px] text-white/30 tabular-nums">{captionSize}px</span>
                            </div>
                            <Slider
                              value={[captionSize]}
                              onValueChange={([val]) => setCaptionSize(val)}
                              min={14}
                              max={48}
                              step={1}
                              className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white/20 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_.relative]:h-1 [&_[data-orientation=horizontal]>.bg-primary]:bg-gradient-to-r [&_[data-orientation=horizontal]>.bg-primary]:from-pink-500 [&_[data-orientation=horizontal]>.bg-primary]:to-purple-500"
                            />
                          </div>

                          {/* Position Selector */}
                          <div className="space-y-2">
                            <Label className="text-xs text-white/40">Position</Label>
                            <div className="flex items-center gap-1">
                              {(["top", "center", "bottom"] as const).map((pos) => (
                                <button
                                  key={pos}
                                  onClick={() => setCaptionPosition(pos)}
                                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs transition-all capitalize ${
                                    captionPosition === pos
                                      ? "bg-white/10 text-white border border-white/20"
                                      : "text-white/30 hover:text-white/50 hover:bg-white/5 border border-transparent"
                                  }`}
                                >
                                  {pos}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-xs text-white/40">Choose aspect ratio</Label>
                  <div className="flex items-center gap-1">
                    {([
                      { value: "9:16" as AspectRatio, icon: Smartphone, label: "9:16" },
                      { value: "1:1" as AspectRatio, icon: Square, label: "1:1" },
                      { value: "16:9" as AspectRatio, icon: Monitor, label: "16:9" },
                    ]).map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => setAspectRatio(ratio.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                          aspectRatio === ratio.value
                            ? "bg-white/10 text-white border border-white/20"
                            : "text-white/30 hover:text-white/50 hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <ratio.icon className="w-3.5 h-3.5" />
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {captionTab === "templates" && (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-3">
                  <Palette className="w-5 h-5 text-white/15" />
                </div>
                <p className="text-sm text-white/30 mb-1">No custom templates yet</p>
                <p className="text-xs text-white/15">Create templates from your saved caption styles</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Save Settings & Progress ─────────────────────────────────────── */}
        {url.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {/* Save settings button */}
            <Button
              variant="outline"
              className="w-full h-10 bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white/80 text-sm"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Save settings above as default!
            </Button>

            {/* Processing progress overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#111118] border border-pink-500/20 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">AI is analyzing your video...</p>
                      <p className="text-xs text-white/30">Identifying viral moments and generating clips</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 12, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/25">
                      <span>Analyzing content...</span>
                      <span>This may take a moment</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Spacer */}
            <div className="h-8" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
