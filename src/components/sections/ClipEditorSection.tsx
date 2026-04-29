"use client";

import { useState, useEffect, useCallback } from "react";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTags(tagsStr: string): string[] {
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getViralityColor(score: number): string {
  if (score >= 80) return "from-green-400 to-emerald-500";
  if (score >= 60) return "from-yellow-400 to-orange-500";
  if (score >= 40) return "from-orange-400 to-red-500";
  return "from-red-400 to-pink-500";
}

function getViralityLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  if (score >= 40) return "Low";
  return "Very Low";
}

// Parse captions string into lines for display
function parseCaptionLines(captions: string | null): string[] {
  if (!captions) return [];
  // Try JSON parse first (array of segments)
  try {
    const parsed = JSON.parse(captions);
    if (Array.isArray(parsed)) {
      return parsed.map(
        (s: { text?: string } | string) =>
          typeof s === "string" ? s : s.text || ""
      );
    }
  } catch {
    // Not JSON, treat as pipe-separated or plain text
  }
  // Pipe-separated lines
  if (captions.includes("|")) {
    return captions.split("|").map((l) => l.trim());
  }
  // Newline-separated
  return captions.split("\n").map((l) => l.trim());
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function CaptionOverlay({
  captions,
  style,
}: {
  captions: string | null;
  style: CaptionStyle;
}) {
  const lines = parseCaptionLines(captions);
  if (lines.length === 0) return null;

  const baseClass = "text-center transition-all duration-300";
  const styleClasses: Record<CaptionStyle, string> = {
    default: `${baseClass} text-white text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`,
    bold: `${baseClass} text-white text-xl font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] [-webkit-text-stroke:1px_rgba(0,0,0,0.5)]`,
    karaoke: `${baseClass} text-white text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`,
    outline: `${baseClass} text-transparent text-lg font-bold [-webkit-text-stroke:2px_white] drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]`,
  };

  return (
    <div className="absolute bottom-8 left-4 right-4 flex flex-col items-center gap-1">
      {lines.slice(0, 3).map((line, i) => (
        <div key={i} className={styleClasses[style]}>
          {style === "karaoke" ? (
            <span>
              <span className="text-yellow-300 font-bold">
                {line.slice(0, Math.ceil(line.length * 0.6))}
              </span>
              <span className="text-white/80">
                {line.slice(Math.ceil(line.length * 0.6))}
              </span>
            </span>
          ) : (
            line
          )}
        </div>
      ))}
    </div>
  );
}

function LayoutPreview({
  layout,
  children,
}: {
  layout: LayoutOption;
  children: React.ReactNode;
}) {
  const aspectClasses: Record<LayoutOption, string> = {
    "9:16": "aspect-[9/16] max-h-[420px]",
    "1:1": "aspect-square max-h-[380px]",
    "16:9": "aspect-video max-w-full",
  };

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden rounded-lg bg-gradient-to-br from-purple-900/40 via-[#12121a] to-pink-900/30 border border-white/5 ${aspectClasses[layout]}`}
    >
      {children}
    </div>
  );
}

function ViralityBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getViralityColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-white/60 w-8 text-right">
        {score}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ClipEditorSection() {
  const { user, activeVideoId, activeClipId, setActiveClipId, setCurrentView } =
    useAppStore();

  // Data state
  const [clips, setClips] = useState<ClipData[]>([]);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Playback mock state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  // Editor form state
  const [editTitle, setEditTitle] = useState("");
  const [editCaptions, setEditCaptions] = useState("");
  const [editCaptionStyle, setEditCaptionStyle] = useState<CaptionStyle>("default");
  const [editLayout, setEditLayout] = useState<LayoutOption>("9:16");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTemplateId, setEditTemplateId] = useState<string>("");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [newTag, setNewTag] = useState("");

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchVideo = useCallback(async () => {
    if (!activeVideoId) return;
    try {
      const res = await fetch(`/api/videos/${activeVideoId}`);
      if (res.ok) {
        const json = await res.json();
        setVideo(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch video:", err);
    }
  }, [activeVideoId]);

  const fetchClips = useCallback(async () => {
    if (!activeVideoId) return;
    try {
      const res = await fetch(`/api/clips?videoId=${activeVideoId}`);
      if (res.ok) {
        const json = await res.json();
        setClips(json.data || []);
        // Auto-select first clip if none selected
        if (!activeClipId && json.data?.length > 0) {
          setActiveClipId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch clips:", err);
    }
  }, [activeVideoId, activeClipId, setActiveClipId]);

  const fetchTemplates = useCallback(async () => {
    try {
      const userId = user?.id || "";
      const res = await fetch(`/api/templates${userId ? `?userId=${userId}` : ""}`);
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchVideo(), fetchClips(), fetchTemplates()]);
      setIsLoading(false);
    };
    if (activeVideoId) load();
  }, [activeVideoId, fetchVideo, fetchClips, fetchTemplates]);

  // ─── Sync editor with selected clip ──────────────────────────────────────

  const selectedClip = clips.find((c) => c.id === activeClipId) || null;

  useEffect(() => {
    if (selectedClip) {
      setEditTitle(selectedClip.title);
      setEditCaptions(selectedClip.captions || "");
      setEditCaptionStyle(selectedClip.captionStyle as CaptionStyle);
      setEditLayout(selectedClip.layout as LayoutOption);
      setEditTags(parseTags(selectedClip.tags));
      setEditTemplateId(selectedClip.templateId || "");
      setEditIsPublished(selectedClip.isPublished);
    }
  }, [selectedClip]);

  // ─── Playback simulation ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlayProgress((p) => {
        if (p >= 100) {
          setIsPlaying(false);
          return 0;
        }
        return p + 0.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleExportAll = useCallback(async () => {
    if (clips.length === 0) return;
    setIsExporting(true);
    try {
      // Export clips as downloadable JSON
      const exportData = clips.map(clip => ({
        title: clip.title,
        startTime: clip.startTime,
        duration: clip.duration,
        viralityScore: clip.viralityScore,
        captions: clip.captions,
        captionStyle: clip.captionStyle,
        layout: clip.layout,
        tags: parseTags(clip.tags),
      }));
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opusclip-export-${video?.title || 'clips'}.json`;
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

  const handleProcessAnother = useCallback(() => {
    setCurrentView("dashboard");
  }, [setCurrentView]);

  const handleSave = async () => {
    if (!activeClipId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/clips/${activeClipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          captions: editCaptions,
          captionStyle: editCaptionStyle,
          layout: editLayout,
          tags: editTags,
          templateId: editTemplateId || null,
          isPublished: editIsPublished,
        }),
      });
      if (res.ok) {
        await fetchClips();
      }
    } catch (err) {
      console.error("Failed to save clip:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeClipId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clips/${activeClipId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActiveClipId(null);
        await fetchClips();
      }
    } catch (err) {
      console.error("Failed to delete clip:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublishToggle = async (published: boolean) => {
    if (!activeClipId) return;
    setEditIsPublished(published);
    try {
      await fetch(`/api/clips/${activeClipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: published }),
      });
      await fetchClips();
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  const handleSelectClip = (clipId: string) => {
    setActiveClipId(clipId);
    setPlayProgress(0);
    setIsPlaying(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!activeVideoId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white/60 mb-2">
            No Video Selected
          </h2>
          <p className="text-white/40 mb-6">
            Select a video from your dashboard to start editing clips
          </p>
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-spin" />
          <p className="text-white/60">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      {/* ─── Top Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0d0d14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("dashboard")}
            className="text-white/60 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-[300px]">
              {video?.title || "Untitled Video"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleProcessAnother}
            className="text-white/60 hover:text-white hover:bg-white/5 hidden sm:flex"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Process Another
          </Button>
          <Button
            size="sm"
            onClick={handleExportAll}
            disabled={isExporting || clips.length === 0}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/20 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1" />
            )}
            {isExporting ? "Exporting..." : "Export All"}
          </Button>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ─── Video Preview (Left 2/3) ────────────────────────────── */}
        <div className="flex-1 lg:flex-[2] flex flex-col p-4 overflow-hidden">
          {/* Layout indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {editLayout === "9:16" && (
                <Smartphone className="w-4 h-4 text-pink-400" />
              )}
              {editLayout === "1:1" && (
                <Square className="w-4 h-4 text-pink-400" />
              )}
              {editLayout === "16:9" && (
                <Monitor className="w-4 h-4 text-pink-400" />
              )}
              <span className="text-xs text-white/40">
                {editLayout} Format
              </span>
            </div>
            <div className="flex items-center gap-2">
              {video?.sourceUrl && (
                <span className="text-xs text-white/30 truncate max-w-[200px]">
                  {video.sourceUrl}
                </span>
              )}
            </div>
          </div>

          {/* Video preview container */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <LayoutPreview layout={editLayout}>
              {/* Mock video gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-800/30 via-[#0d0d18] to-pink-800/20" />

              {/* Animated gradient shimmer */}
              <div className="absolute inset-0 animate-shimmer opacity-30" />

              {/* Play button center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1" />
                  )}
                </motion.button>
              </div>

              {/* Caption overlay */}
              <CaptionOverlay
                captions={selectedClip?.captions || null}
                style={editCaptionStyle}
              />

              {/* Clip time indicator */}
              {selectedClip && (
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-black/50 backdrop-blur-sm text-white/80 text-[10px] border-white/10"
                  >
                    {selectedClip.startTime} • {selectedClip.duration}
                  </Badge>
                </div>
              )}

              {/* Layout badge */}
              <div className="absolute top-3 right-3">
                <Badge
                  variant="secondary"
                  className="bg-black/50 backdrop-blur-sm text-pink-300 text-[10px] border-white/10"
                >
                  {editLayout}
                </Badge>
              </div>
            </LayoutPreview>
          </div>

          {/* Playback timeline bar */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/5"
                onClick={() => {
                  setPlayProgress(0);
                  setIsPlaying(false);
                }}
              >
                <SkipBack className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/5"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/5"
                onClick={() => setPlayProgress(100)}
              >
                <SkipForward className="w-3.5 h-3.5" />
              </Button>

              {/* Timeline bar */}
              <div className="flex-1 relative h-1.5 rounded-full bg-white/5 cursor-pointer group">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100"
                  style={{ width: `${playProgress}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg shadow-pink-500/30 transition-all duration-100 opacity-0 group-hover:opacity-100"
                  style={{ left: `calc(${playProgress}% - 6px)` }}
                />
              </div>

              <span className="text-xs text-white/40 tabular-nums min-w-[60px] text-right">
                {selectedClip
                  ? `${selectedClip.startTime}`
                  : "0:00"}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Clip Details Panel (Right 1/3) ──────────────────────── */}
        <div className="lg:w-[380px] xl:w-[420px] border-l border-white/5 bg-[#0d0d14]/60 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* ─── Clip List ──────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-pink-400" />
                    Clips ({clips.length})
                  </h3>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {clips.map((clip) => (
                      <motion.div
                        key={clip.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleSelectClip(clip.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                          activeClipId === clip.id
                            ? "bg-pink-500/10 border-pink-500/30 shadow-lg shadow-pink-500/5"
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium truncate ${
                                activeClipId === clip.id
                                  ? "text-pink-300"
                                  : "text-white/80"
                              }`}
                            >
                              {clip.title}
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">
                              {clip.startTime} • {clip.duration}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {clip.isPublished && (
                              <div className="w-2 h-2 rounded-full bg-green-400" />
                            )}
                            <span className="text-xs font-bold text-white/50">
                              {clip.viralityScore}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <ViralityBar score={clip.viralityScore} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {clips.length === 0 && (
                    <div className="text-center py-8">
                      <Sparkles className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-xs text-white/30">
                        No clips generated yet
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-white/5" />

              {/* ─── Selected Clip Editor ────────────────────────────── */}
              {selectedClip ? (
                <motion.div
                  key={selectedClip.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
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

                  {/* Start Time & Duration (read-only) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">Start Time</Label>
                      <div className="h-9 px-3 flex items-center rounded-md border border-white/10 bg-white/[0.02] text-sm text-white/60">
                        {selectedClip.startTime}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">Duration</Label>
                      <div className="h-9 px-3 flex items-center rounded-md border border-white/10 bg-white/[0.02] text-sm text-white/60">
                        {selectedClip.duration}
                      </div>
                    </div>
                  </div>

                  {/* Virality Score */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Virality Score
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          selectedClip.viralityScore >= 80
                            ? "text-green-400"
                            : selectedClip.viralityScore >= 60
                              ? "text-yellow-400"
                            : selectedClip.viralityScore >= 40
                              ? "text-orange-400"
                              : "text-red-400"
                        }`}
                      >
                        {selectedClip.viralityScore}/100 -{" "}
                        {getViralityLabel(selectedClip.viralityScore)}
                      </span>
                    </Label>
                    <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${selectedClip.viralityScore}%`,
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${getViralityColor(selectedClip.viralityScore)}`}
                      />
                    </div>
                  </div>

                  {/* Caption Style */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Caption Style</Label>
                    <Select
                      value={editCaptionStyle}
                      onValueChange={(val) =>
                        setEditCaptionStyle(val as CaptionStyle)
                      }
                    >
                      <SelectTrigger className="bg-white/[0.03] border-white/10 text-white text-sm w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem
                          value="default"
                          className="text-white/80 focus:bg-white/10 focus:text-white"
                        >
                          Default
                        </SelectItem>
                        <SelectItem
                          value="bold"
                          className="text-white/80 focus:bg-white/10 focus:text-white"
                        >
                          Bold
                        </SelectItem>
                        <SelectItem
                          value="karaoke"
                          className="text-white/80 focus:bg-white/10 focus:text-white"
                        >
                          Karaoke
                        </SelectItem>
                        <SelectItem
                          value="outline"
                          className="text-white/80 focus:bg-white/10 focus:text-white"
                        >
                          Outline
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Layout Toggle */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Layout</Label>
                    <ToggleGroup
                      type="single"
                      value={editLayout}
                      onValueChange={(val) => {
                        if (val) setEditLayout(val as LayoutOption);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <ToggleGroupItem
                        value="9:16"
                        className="flex-1 text-xs text-white/60 data-[state=on]:bg-pink-500/20 data-[state=on]:text-pink-300 data-[state=on]:border-pink-500/30 border-white/10 hover:bg-white/5 hover:text-white/80"
                      >
                        <Smartphone className="w-3.5 h-3.5 mr-1" />
                        9:16
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="1:1"
                        className="flex-1 text-xs text-white/60 data-[state=on]:bg-pink-500/20 data-[state=on]:text-pink-300 data-[state=on]:border-pink-500/30 border-white/10 hover:bg-white/5 hover:text-white/80"
                      >
                        <Square className="w-3.5 h-3.5 mr-1" />
                        1:1
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="16:9"
                        className="flex-1 text-xs text-white/60 data-[state=on]:bg-pink-500/20 data-[state=on]:text-pink-300 data-[state=on]:border-pink-500/30 border-white/10 hover:bg-white/5 hover:text-white/80"
                      >
                        <Monitor className="w-3.5 h-3.5 mr-1" />
                        16:9
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {/* Captions */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">
                      Captions (pipe | separated for lines)
                    </Label>
                    <Textarea
                      value={editCaptions}
                      onChange={(e) => setEditCaptions(e.target.value)}
                      rows={4}
                      className="bg-white/[0.03] border-white/10 text-white text-sm resize-none focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                      placeholder="Line 1 | Line 2 | Line 3"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50 flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-white/5 text-white/70 border-white/10 text-xs pr-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add tag..."
                        className="bg-white/[0.03] border-white/10 text-white text-xs h-8 focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddTag}
                        className="h-8 text-white/50 hover:text-white hover:bg-white/5 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Template */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Template</Label>
                    <Select
                      value={editTemplateId || "none"}
                      onValueChange={(val) =>
                        setEditTemplateId(val === "none" ? "" : val)
                      }
                    >
                      <SelectTrigger className="bg-white/[0.03] border-white/10 text-white text-sm w-full">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem
                          value="none"
                          className="text-white/50 focus:bg-white/10 focus:text-white"
                        >
                          No Template
                        </SelectItem>
                        {templates.map((t) => (
                          <SelectItem
                            key={t.id}
                            value={t.id}
                            className="text-white/80 focus:bg-white/10 focus:text-white"
                          >
                            {t.name}
                            {t.isDefault && (
                              <span className="text-white/30 ml-1">
                                (default)
                              </span>
                            )}
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
                      <p className="text-[10px] text-white/30">
                        Make this clip public
                      </p>
                    </div>
                    <Switch
                      checked={editIsPublished}
                      onCheckedChange={handlePublishToggle}
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
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border-red-500/20"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/40">
                    Select a clip to edit
                  </p>
                  <p className="text-xs text-white/20 mt-1">
                    Click on any clip from the list above
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
