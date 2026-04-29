"use client";

import { motion } from "framer-motion";
import { Upload, Cpu, Scissors, Share2 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Paste Your Link",
    description:
      "Drop a YouTube, TikTok, Vimeo, or Twitch link. Or upload a video file directly from your computer.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Analyzes Content",
    description:
      "Our AI watches your entire video, identifies key moments, hooks, and highlights that will resonate with viewers.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Scissors,
    step: "03",
    title: "Generate Clips",
    description:
      "Get multiple viral-ready clips with auto-captions, smart reframing, and a Virality Score for each clip.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Share2,
    step: "04",
    title: "Publish Everywhere",
    description:
      "Edit, customize, and publish directly to TikTok, YouTube Shorts, Instagram Reels, and LinkedIn in one click.",
    color: "from-green-500 to-emerald-500",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 border-y border-white/5"
    >
      {/* Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            How <span className="gradient-text">OpusClip</span> Works
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            From long video to viral clips in four simple steps. No editing
            skills needed.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative group"
            >
              {/* Connection line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-14 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-gradient-to-r from-white/10 to-white/5" />
              )}

              <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300 hover:bg-white/[0.04]">
                {/* Step number */}
                <div className="text-5xl font-black text-white/[0.03] absolute top-2 right-4">
                  {step.step}
                </div>

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <step.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
