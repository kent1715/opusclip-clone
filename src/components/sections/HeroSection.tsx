"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Play,
  Zap,
  Loader2,
  Check,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";

interface Clip {
  id: string;
  title: string;
  viralityScore: number;
  duration: string;
  startTime: string;
  captions: boolean;
  format: string;
  tags: string[];
}

export function HeroSection() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState<Clip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, setAuthModalTab, setCurrentView, setActiveVideoId } = useAppStore();

  const handleProcess = useCallback(async () => {
    if (!url.trim()) return;

    // If not logged in, prompt sign up first
    if (!user) {
      setAuthModalTab("signup");
      return;
    }

    setLoading(true);
    setError(null);
    setClips(null);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process video");
      }

      setClips(data.data.clips);
      // If video was created, navigate to editor
      if (data.data.videoId) {
        setActiveVideoId(data.data.videoId);
        setTimeout(() => setCurrentView("editor"), 1500);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, [url, user, setAuthModalTab, setCurrentView, setActiveVideoId]);

  const defaultClips = [
    { title: "The Future of AI", score: 97, duration: "0:58" },
    { title: "Why Creators Love AI", score: 94, duration: "0:42" },
    { title: "Breaking Boundaries", score: 91, duration: "1:15" },
    { title: "Viral Moments", score: 88, duration: "0:33" },
    { title: "Quick Tips & Tricks", score: 85, duration: "0:47" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[200px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
        >
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-sm text-white/70">
            Powered by ClipAnything AI — Now with GPT-4o
          </span>
          <ArrowRight className="w-3 h-3 text-white/40" />
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          <span className="text-white">Turn Any Video Into</span>
          <br />
          <span className="gradient-text">Viral Clips</span>
          <span className="text-white"> with AI</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          OpusClip is the world&apos;s #1 AI video clipping tool that turns your
          long videos into viral short clips. Publish to all social platforms in
          one click.
        </motion.p>

        {/* URL Input */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative flex items-center gap-2 p-2 rounded-2xl glass-strong">
            <div className="flex-1 flex items-center gap-3 pl-4">
              <Play className="w-5 h-5 text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Paste a YouTube, TikTok, or Vimeo link..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleProcess()}
                className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-sm md:text-base py-3"
              />
            </div>
            <Button
              size="lg"
              onClick={handleProcess}
              disabled={loading || !url.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300 rounded-xl px-6 md:px-8 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {loading ? "Processing..." : "Get Clips"}
            </Button>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-400 text-sm mt-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/30 mb-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>10M+ Creators</span>
          </div>
          <span>•</span>
          <span>50M+ Clips Created</span>
          <span>•</span>
          <span>Free to Start</span>
          <span>•</span>
          <span>No Credit Card Required</span>
        </motion.div>

        {/* Spacer */}
        {!user && <div className="mb-16" />}

        {/* Product Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/10">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a2e] border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-white/30 flex items-center gap-2">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  app.opus.pro/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="bg-[#0d0d14] p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Video Input Preview */}
                <div className="md:col-span-2 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                  <div className="aspect-video relative bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%220.5%22%20fill%3D%22rgba(255%2C255%2C255%2C0.03)%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />

                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="relative z-10 text-center"
                        >
                          <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mb-3 mx-auto">
                            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                          </div>
                          <p className="text-white/70 text-sm font-medium">
                            AI is analyzing your video...
                          </p>
                          <p className="text-white/30 text-xs mt-1">
                            Identifying viral moments
                          </p>
                        </motion.div>
                      ) : clips ? (
                        <motion.div
                          key="results"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="relative z-10 text-center"
                        >
                          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-3 mx-auto">
                            <Check className="w-8 h-8 text-green-400" />
                          </div>
                          <p className="text-white/70 text-sm font-medium">
                            {clips.length} clips generated!
                          </p>
                          <p className="text-white/30 text-xs mt-1">
                            Ready to publish
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="default"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="relative z-10 text-center"
                        >
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 mx-auto animate-pulse-glow">
                            <Play className="w-7 h-7 text-white fill-white ml-1" />
                          </div>
                          <p className="text-white/50 text-sm">
                            Your video preview
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Simulated timeline */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/40 backdrop-blur-sm border-t border-white/5 flex items-center px-4 gap-2">
                      <span className="text-xs text-white/40">0:00</span>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-1000 ${
                            loading ? "w-1/2 animate-pulse" : "w-1/3"
                          }`}
                        />
                      </div>
                      <span className="text-xs text-white/40">12:34</span>
                    </div>
                  </div>
                </div>

                {/* Clips Panel */}
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white/80">
                      Generated Clips
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-md bg-pink-500/20 text-pink-400">
                      {clips ? `${clips.length} clips` : "5 clips"}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[320px] overflow-y-auto">
                    {clips
                      ? clips.map((clip, i) => (
                          <motion.div
                            key={clip.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="group p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3 text-pink-400" />
                                {clip.title}
                              </span>
                              <span className="text-xs text-white/30 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {clip.duration}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                                  style={{
                                    width: `${clip.viralityScore}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-pink-400 font-medium">
                                {clip.viralityScore}%
                              </span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {clip.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        ))
                      : defaultClips.map((clip, i) => (
                          <div
                            key={i}
                            className="group p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-white/70">
                                {clip.title}
                              </span>
                              <span className="text-xs text-white/30">
                                {clip.duration}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                                  style={{ width: `${clip.score}%` }}
                                />
                              </div>
                              <span className="text-xs text-pink-400 font-medium">
                                {clip.score}%
                              </span>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow effect under the preview */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}
