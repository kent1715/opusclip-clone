"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Alex Hormozi",
    role: "Entrepreneur & Creator",
    avatar: "AH",
    rating: 5,
    text: "OpusClip is the single most important tool in my content arsenal. It literally saves me 10+ hours a week and the clips it produces get 3-5x more engagement than anything I could make manually.",
    platform: "YouTube",
  },
  {
    name: "Ali Abdaal",
    role: "YouTuber & Author",
    avatar: "AA",
    rating: 5,
    text: "I've tried every AI clipping tool out there, and OpusClip is leagues ahead. The Virality Score alone is worth the subscription — it tells you exactly which clips will pop off.",
    platform: "YouTube",
  },
  {
    name: "Sahil Bloom",
    role: "Creator & Investor",
    avatar: "SB",
    rating: 5,
    text: "From podcast to TikTok in 5 minutes? OpusClip makes it that easy. The auto-captions and smart reframing are incredibly polished. This is the future of content creation.",
    platform: "Podcast",
  },
  {
    name: "Morgan Adams",
    role: "Growth Marketing Lead",
    avatar: "MA",
    rating: 5,
    text: "We went from posting 2 clips a week to 20, and our engagement tripled. OpusClip is a game-changer for any brand serious about social media presence.",
    platform: "Marketing",
  },
  {
    name: "Dan Koe",
    role: "Creator & Coach",
    avatar: "DK",
    rating: 5,
    text: "The quality of AI-generated clips from OpusClip is unreal. It understands pacing, hooks, and storytelling better than most human editors I've worked with.",
    platform: "YouTube",
  },
  {
    name: "Leila Hormozi",
    role: "CEO & Creator",
    avatar: "LH",
    rating: 5,
    text: "Our content team was spending 20 hours a week on clip editing. OpusClip cut that down to 2 hours. The ROI is insane — we're never going back.",
    platform: "Business",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage =
    typeof window !== "undefined" && window.innerWidth >= 768 ? 3 : 1;
  const maxIndex = Math.max(0, testimonials.length - itemsPerPage);

  const next = () => setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  const prev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  return (
    <section
      id="testimonials"
      className="relative py-24 md:py-32 border-y border-white/5"
    >
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[200px]" />

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
            Loved by <span className="gradient-text">10M+ Creators</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            Join the millions of creators who use OpusClip to grow their
            audience.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="relative overflow-hidden">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            style={{
              transform: `translateX(-${currentIndex * (100 / 3)}%)`,
              transition: "transform 0.5s ease-out",
            }}
          >
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-6 transition-all duration-300 hover:border-white/10"
              >
                <Quote className="w-8 h-8 text-white/10 mb-4" />

                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-white/30">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={prev}
              disabled={currentIndex === 0}
              className="rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-0 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "bg-pink-500 w-6"
                      : "bg-white/20 hover:bg-white/30"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              disabled={currentIndex >= maxIndex}
              className="rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-0 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
