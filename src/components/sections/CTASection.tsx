"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-[200px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-sm text-white/60">
              Start creating viral clips today
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Turn Your Videos
            <br />
            Into <span className="gradient-text">Viral Content</span>?
          </h2>

          <p className="text-lg text-white/40 max-w-xl mx-auto mb-10">
            Join 10M+ creators who save hours every week with AI-powered video
            clipping. Free to start, no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300 px-8 h-14 text-base font-semibold rounded-xl"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-white/60 hover:text-white hover:bg-white/5 h-14 px-8 rounded-xl"
            >
              Watch Demo
            </Button>
          </div>

          <p className="text-xs text-white/20 mt-6">
            No credit card required · Free plan available · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
