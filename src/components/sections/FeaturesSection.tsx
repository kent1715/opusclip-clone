"use client";

import { motion } from "framer-motion";
import {
  Scissors,
  Captions,
  BarChart3,
  Palette,
  Globe,
  Wand2,
  Sparkles,
  Video,
} from "lucide-react";

const features = [
  {
    icon: Scissors,
    title: "ClipAnything",
    description:
      "Our most powerful AI model clips any video — podcasts, webinars, vlogs, tutorials, and more. No genre limitations.",
    gradient: "from-pink-500 to-rose-600",
    badge: "NEW",
  },
  {
    icon: Captions,
    title: "Auto Captions",
    description:
      "Generate accurate, animated captions in 20+ languages. Customizable fonts, colors, and styles to match your brand.",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    icon: BarChart3,
    title: "Virality Score™",
    description:
      "AI-powered scoring predicts how viral each clip will be. Focus on the clips most likely to get millions of views.",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Palette,
    title: "Brand Templates",
    description:
      "Apply your brand colors, fonts, and logos automatically. Create consistent content across all your social channels.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description:
      "Translate and dub your clips into 20+ languages with AI. Reach global audiences without extra production costs.",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    icon: Wand2,
    title: "AI B-Roll",
    description:
      "Automatically add relevant B-roll footage to make your clips more engaging and visually dynamic.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Sparkles,
    title: "AI Reframe",
    description:
      "Smart auto-reframing keeps the action centered when converting landscape videos to portrait format for social media.",
    gradient: "from-pink-500 to-purple-600",
  },
  {
    icon: Video,
    title: "One-Click Publish",
    description:
      "Schedule and publish clips directly to TikTok, YouTube Shorts, Instagram Reels, and LinkedIn — all at once.",
    gradient: "from-red-500 to-pink-600",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[200px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-xs text-white/60 font-medium">
              POWERFUL AI FEATURES
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything You Need to
            <br />
            <span className="gradient-text">Create Viral Clips</span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            The most powerful AI editing models that work on any video. Built for
            speed, accuracy, and creative flexibility.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-6 transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-purple-500/5"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Badge */}
              {feature.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/20">
                  {feature.badge}
                </span>
              )}

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
