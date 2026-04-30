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
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  Trophy,
  Clock,
  Copy,
  Share2,
  Star,
  ChevronDown,
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

// Generate a pseudo-random gradient for clip thumbnails based on clip id
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

// ─── Clip Card Component (Opus.pro style) ────────────────────────────────────

function ClipCard({
  clip,
  index,
  isSelected,
  onClick,
}: {
  clip: ClipData;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const tags = parseTags(clip.tags);
  const gradient = getClipGradient(clip.id);

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
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] sm:aspect-[9/14] bg-black overflow-hidden">
        {/* Gradient background as thumbnail placeholder */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Content overlay on thumbnail - like opus title boxes */}
        <div className="absolute top-3 left-3 right-3">
          <div className="bg-white/95 backdrop-blur-sm rounded-md px-2 py-1.5 max-w-[85%]">
            <p className="text-[11px] font-semibold text-black leading-tight line-clamp-2">
              {clip.title}
            </p>
          </div>
        </div>

        {/* Timestamp overlay - top right */}
        <div className="absolute top-3 right-3">
          <div className="bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
            <span className="text-[10px] font-medium text-white/80 tabular-nums">
              {clip.startTime} - {clip.duration}
            </span>
          </div>
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Play className="w-4 h-4 text-white ml-0.5" />
          </div>
        </div>

        {/* Score badge - bottom left */}
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
      </div>

      {/* Card Footer - Title + Tags */}
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

// ─── Clip Detail Panel (Slide-in from right) ────────────────────────────────

function ClipDetailPanel({
  clip,
  templates,
  onClose,
  onSave,
  onDelete,
  onTogglePublish,
}: {
  clip: ClipData;
  templates: TemplateData[];
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

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-[#0d0d14] border-l border-white/5 z-50 flex flex-col overflow-hidden"
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
          {/* Clip Preview */}
          <div className="relative aspect-[9/16] max-h-[280px] rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/30 via-[#0d0d18] to-pink-900/20 border border-white/5">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <Play className="w-5 h-5 text-white ml-0.5" />
              </div>
            </div>
            <div className="absolute top-2 left-2">
              <Badge
                variant="secondary"
                className="bg-black/50 backdrop-blur-sm text-white/80 text-[10px] border-white/10"
              >
                {clip.startTime} • {clip.duration}
              </Badge>
            </div>
            <div className="absolute bottom-3 left-3">
              <span className={`text-3xl font-bold ${getScoreColor(clip.viralityScore)}`}>
                {clip.viralityScore}
              </span>
            </div>
          </div>

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

          {/* Caption Style */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Caption Style</Label>
            <Select
              value={editCaptionStyle}
              onValueChange={(val) => setEditCaptionStyle(val as CaptionStyle)}
            >
              <SelectTrigger className="bg-white/[0.03] border-white/10 text-white text-sm w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="default" className="text-white/80 focus:bg-white/10 focus:text-white">Default</SelectItem>
                <SelectItem value="bold" className="text-white/80 focus:bg-white/10 focus:text-white">Bold</SelectItem>
                <SelectItem value="karaoke" className="text-white/80 focus:bg-white/10 focus:text-white">Karaoke</SelectItem>
                <SelectItem value="outline" className="text-white/80 focus:bg-white/10 focus:text-white">Outline</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {/* Captions */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Captions (pipe | separated)</Label>
            <Textarea
              value={editCaptions}
              onChange={(e) => setEditCaptions(e.target.value)}
              rows={3}
              className="bg-white/[0.03] border-white/10 text-white text-sm resize-none focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
              placeholder="Line 1 | Line 2 | Line 3"
            />
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

  // Data state
  const [clips, setClips] = useState<ClipData[]>([]);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Sort/filter state
  const [sortBy, setSortBy] = useState<"score" | "time" | "newest">("score");
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // ─── Data Fetching ───────────────────────────────────────────────────────

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
  }, [activeVideoId]); // intentionally not depending on user?.id to avoid infinite loops

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

  // Close detail panel when activeClipId is cleared
  useEffect(() => {
    if (!activeClipId) setShowDetailPanel(false);
  }, [activeClipId]);

  // ─── Sorted clips ────────────────────────────────────────────────────────

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

  // ─── Actions ─────────────────────────────────────────────────────────────

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
      {/* ─── Header Bar ──────────────────────────────────────────────── */}
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
          {/* Sort button */}
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as "score" | "time" | "newest")}>
            <SelectTrigger className="h-8 w-auto gap-1 bg-white/[0.03] border-white/10 text-white/60 text-xs hover:bg-white/[0.06] hover:text-white/80">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="score" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">
                By Score
              </SelectItem>
              <SelectItem value="time" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">
                By Time
              </SelectItem>
              <SelectItem value="newest" className="text-white/80 focus:bg-white/10 focus:text-white text-xs">
                Newest First
              </SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-5 bg-white/10 hidden sm:block" />

          {/* Export button */}
          <Button
            size="sm"
            onClick={handleExportAll}
            disabled={isExporting || clips.length === 0}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/20 disabled:opacity-50 text-xs"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1" />
            )}
            <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export All"}</span>
          </Button>

          {/* Process Another */}
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

      {/* ─── Clip Gallery Grid ──────────────────────────────────────────── */}
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
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Clip Detail Side Panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {showDetailPanel && selectedClip && (
          <>
            {/* Backdrop */}
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
