"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Zap,
  Loader2,
  TrendingUp,
  Clock,
  Film,
  Trash2,
  Play,
  Sparkles,
  ArrowUpRight,
  Video,
  Eye,
  Crown,
  ExternalLink,
  AlertCircle,
  Layers,
  Tag,
  Shield,
  Users,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClipData {
  id: string;
  title: string;
  startTime: string;
  duration: string;
  viralityScore: number;
  captionStyle: string;
  layout: string;
  tags: string;
  isPublished: boolean;
  publishedTo: string;
  createdAt: string;
  videoId: string;
  video?: { id: string; title: string | null; sourceUrl: string };
}

interface VideoData {
  id: string;
  sourceUrl: string;
  title: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  status: string;
  createdAt: string;
  clips: ClipData[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateUrl(url: string, maxLen = 40): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + "...";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseTags(tagsStr: string): string[] {
  try {
    return JSON.parse(tagsStr);
  } catch {
    return [];
  }
}

function statusConfig(status: string) {
  switch (status) {
    case "processing":
      return {
        label: "Processing",
        bg: "bg-yellow-500/15",
        text: "text-yellow-400",
        border: "border-yellow-500/20",
        dot: "bg-yellow-400",
      };
    case "completed":
      return {
        label: "Completed",
        bg: "bg-green-500/15",
        text: "text-green-400",
        border: "border-green-500/20",
        dot: "bg-green-400",
      };
    case "failed":
      return {
        label: "Failed",
        bg: "bg-red-500/15",
        text: "text-red-400",
        border: "border-red-500/20",
        dot: "bg-red-400",
      };
    default:
      return {
        label: status,
        bg: "bg-white/5",
        text: "text-white/50",
        border: "border-white/10",
        dot: "bg-white/50",
      };
  }
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "processing" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

function ViralityBar({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
        />
      </div>
      <span className="text-xs text-pink-400 font-semibold tabular-nums w-8 text-right">
        {clampedScore}%
      </span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white/20" />
      </div>
      <p className="text-white/40 text-sm font-medium mb-1">{title}</p>
      <p className="text-white/20 text-xs max-w-[240px]">{description}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DashboardSection() {
  const { user, setCurrentView, setActiveVideoId, setActiveClipId } = useAppStore();

  // Local state
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processUrl, setProcessUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchVideos = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/videos?userId=${user.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setVideos(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Collect all clips across videos, sorted by most recent
  const allClips: ClipData[] = videos
    .flatMap((v) => v.clips)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleProcess = useCallback(async () => {
    if (!processUrl.trim() || !user?.id) return;
    setProcessing(true);
    setProcessError(null);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: processUrl.trim(), userId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process video");
      }

      // Refresh the list and navigate to editor
      setProcessUrl("");
      await fetchVideos();

      if (data.data?.id) {
        setActiveVideoId(data.data.id);
        setCurrentView("editor");
      }
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setProcessing(false);
    }
  }, [processUrl, user?.id, fetchVideos, setActiveVideoId, setCurrentView]);

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      setDeleting(true);
      try {
        const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
        if (res.ok) {
          setVideos((prev) => prev.filter((v) => v.id !== videoId));
        }
      } catch (err) {
        console.error("Failed to delete video:", err);
      } finally {
        setDeleting(false);
        setDeleteVideoId(null);
      }
    },
    []
  );

  const handleTogglePublish = useCallback(async (clip: ClipData) => {
    try {
      const newPublished = !clip.isPublished;
      await fetch(`/api/clips/${clip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublished: newPublished,
          publishedTo: newPublished ? JSON.stringify(["social"]) : "[]",
        }),
      });
      // Update local state
      setVideos((prev) =>
        prev.map((v) => ({
          ...v,
          clips: v.clips.map((c) =>
            c.id === clip.id ? { ...c, isPublished: newPublished } : c
          ),
        }))
      );
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  }, []);

  const handleVideoClick = useCallback(
    (videoId: string) => {
      setActiveVideoId(videoId);
      setActiveClipId(null);
      setCurrentView("editor");
    },
    [setActiveVideoId, setActiveClipId, setCurrentView]
  );

  const handleClipClick = useCallback(
    (clip: ClipData) => {
      setActiveVideoId(clip.videoId);
      setActiveClipId(clip.id);
      setCurrentView("editor");
    },
    [setActiveVideoId, setActiveClipId, setCurrentView]
  );

  // ─── Plan helpers ────────────────────────────────────────────────────────

  const planLabel =
    user?.plan === "business"
      ? "Business"
      : user?.plan === "pro"
        ? "Pro"
        : "Free";

  const planIcon =
    user?.plan === "business" ? (
      <Crown className="w-3.5 h-3.5 text-yellow-400" />
    ) : user?.plan === "pro" ? (
      <Zap className="w-3.5 h-3.5 text-purple-400" />
    ) : null;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <section className="min-h-screen bg-[#0a0a0f] relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ─── Quick Process Section ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/[0.02] border border-white/5 rounded-xl p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-pink-400" />
              </div>
              <h2 className="text-base font-semibold text-white/90">
                Process New Video
              </h2>
            </div>
          </div>

          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 focus-within:border-pink-500/30 transition-colors">
              <Video className="w-4 h-4 text-white/20 shrink-0" />
              <input
                type="text"
                placeholder="Paste a YouTube, TikTok, or Vimeo link..."
                value={processUrl}
                onChange={(e) => setProcessUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleProcess()}
                className="flex-1 bg-transparent text-white/90 placeholder:text-white/25 outline-none text-sm py-1.5"
                disabled={processing}
              />
            </div>
            <Button
              onClick={handleProcess}
              disabled={processing || !processUrl.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all duration-300 rounded-xl px-6 shrink-0 disabled:opacity-50 h-10"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Process with AI
                </>
              )}
            </Button>
          </div>

          {/* Progress bar during processing */}
          <AnimatePresence>
            {processing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2"
              >
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "70%" }}
                    transition={{ duration: 8, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
                  <span>AI is analyzing your video and generating viral clips...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {processError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-3 flex items-center gap-2 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {processError}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Top Stats Bar ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          {/* Clips Used */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5 text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 mb-1">Clips Used</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white/90 tabular-nums">
                  {user?.clipsUsed ?? 0}
                </span>
                <span className="text-sm text-white/30">/</span>
                <span className="text-sm text-white/40 tabular-nums">
                  {user?.clipsLimit ?? 5}
                </span>
              </div>
              {/* Mini progress */}
              <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((user?.clipsUsed ?? 0) / (user?.clipsLimit || 5)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
              {user?.role === "admin" ? <Shield className="w-5 h-5 text-yellow-400" /> : planIcon || <Eye className="w-5 h-5 text-cyan-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 mb-1">Current Plan</p>
              <div className="flex items-center gap-2">
                {user?.role === "admin" && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 font-medium">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
                <span className="text-lg font-bold text-white/90">{planLabel}</span>
                {user?.plan !== "business" && user?.role !== "admin" && (
                  <Button
                    size="sm"
                    onClick={() => setCurrentView("settings")}
                    className="h-6 text-[10px] px-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 rounded-md"
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Process */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 mb-1">Total Videos</p>
              <span className="text-lg font-bold text-white/90 tabular-nums">
                {videos.length}
              </span>
              <span className="text-xs text-white/30 ml-2">
                {videos.filter((v) => v.status === "processing").length > 0 &&
                  `(${videos.filter((v) => v.status === "processing").length} processing)`}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─── Main Content Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Video List (2/3 width) ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                <Film className="w-4 h-4 text-white/40" />
                Your Videos
              </h3>
              {videos.length > 0 && (
                <span className="text-xs text-white/30">{videos.length} videos</span>
              )}
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.02] border border-white/5 rounded-xl p-4 animate-shimmer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-10 rounded-lg bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-white/5" />
                        <div className="h-2 w-1/2 rounded bg-white/5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && videos.length === 0 && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl">
                <EmptyState
                  icon={Film}
                  title="No videos yet"
                  description="Paste a video URL above to get started with AI-powered clip generation"
                />
              </div>
            )}

            {/* Video cards */}
            {!loading && videos.length > 0 && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {videos.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="group bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all cursor-pointer"
                    onClick={() => handleVideoClick(video.id)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Thumbnail placeholder */}
                      <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-lg bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-white/5 flex items-center justify-center shrink-0 relative overflow-hidden">
                        {video.status === "processing" ? (
                          <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                        ) : (
                          <Play className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                        )}
                        {video.duration && (
                          <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white/60 px-1 rounded">
                            {video.duration}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white/80 truncate pr-2">
                            {video.title || "Untitled Video"}
                          </h4>
                          <StatusBadge status={video.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/30 mb-2">
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {truncateUrl(video.sourceUrl)}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDate(video.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-white/5 text-white/40 border-0 gap-1"
                          >
                            <Layers className="w-2.5 h-2.5" />
                            {video.clips.length} clip{video.clips.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>

                      {/* Delete button */}
                      <AlertDialog
                        open={deleteVideoId === video.id}
                        onOpenChange={(open) => !open && setDeleteVideoId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/20 hover:text-red-400 hover:bg-red-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteVideoId(video.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          className="bg-[#12121a] border-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white/90">
                              Delete Video?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-white/40">
                              This will permanently delete &quot;{video.title || "Untitled Video"}&quot; and all its
                              {video.clips.length} clip{video.clips.length !== 1 ? "s" : ""}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500/80 hover:bg-red-600 text-white border-0"
                              disabled={deleting}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVideo(video.id);
                              }}
                            >
                              {deleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ─── Recent Clips (1/3 width) ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white/40" />
                Recent Clips
              </h3>
              {allClips.length > 0 && (
                <span className="text-xs text-white/30">{allClips.length} clips</span>
              )}
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.02] border border-white/5 rounded-xl p-3 animate-shimmer"
                  >
                    <div className="space-y-2">
                      <div className="h-3 w-3/4 rounded bg-white/5" />
                      <div className="h-2 w-full rounded bg-white/5" />
                      <div className="h-2 w-1/3 rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && allClips.length === 0 && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl">
                <EmptyState
                  icon={TrendingUp}
                  title="No clips yet"
                  description="Process a video to generate AI-powered viral clips"
                />
              </div>
            )}

            {/* Clip cards */}
            {!loading && allClips.length > 0 && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {allClips.map((clip, i) => {
                  const tags = parseTags(clip.tags);
                  return (
                    <motion.div
                      key={clip.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="group bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all cursor-pointer"
                      onClick={() => handleClipClick(clip)}
                    >
                      {/* Title row */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white/70 truncate pr-2 flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-pink-400 shrink-0" />
                          {clip.title}
                        </span>
                        <span className="text-[10px] text-white/25 flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {clip.duration}
                        </span>
                      </div>

                      {/* Virality bar */}
                      <ViralityBar score={clip.viralityScore} />

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 flex items-center gap-0.5"
                            >
                              <Tag className="w-2 h-2" />
                              {tag}
                            </span>
                          ))}
                          {tags.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 text-white/20">
                              +{tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Publish toggle */}
                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/5">
                        <span className="text-[10px] text-white/25">
                          {clip.isPublished ? "Published" : "Draft"}
                        </span>
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            checked={clip.isPublished}
                            onCheckedChange={() => handleTogglePublish(clip)}
                            className="data-[state=checked]:bg-green-500/60 data-[state=unchecked]:bg-white/10 scale-75"
                          />
                          <ArrowUpRight className="w-3 h-3 text-white/15 group-hover:text-white/30 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
