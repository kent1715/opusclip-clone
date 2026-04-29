"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What types of videos can OpusClip process?",
    answer:
      "OpusClip can process virtually any type of video content — podcasts, webinars, interviews, tutorials, vlogs, live streams, product reviews, and more. Our ClipAnything AI model is designed to work across all genres and formats. Simply paste a link or upload a file, and our AI will identify the most engaging moments.",
  },
  {
    question: "How long does it take to generate clips?",
    answer:
      "Most clips are generated in just 2-5 minutes, depending on the length of your video. A 60-minute podcast typically takes about 3 minutes to process. Our AI analyzes the entire video, identifies key moments, generates captions, and applies smart reframing — all automatically.",
  },
  {
    question: "Is there a free plan available?",
    answer:
      "Yes! Our Free plan lets you create up to 5 clips per month with 720p export quality. It's a great way to try OpusClip and see the quality of our AI clipping. When you're ready for more, our Pro plan offers 200 clips/month with 1080p quality and premium features.",
  },
  {
    question: "Can I customize the clips after they're generated?",
    answer:
      "Absolutely! Every clip is fully editable in our built-in editor. You can trim the length, change captions and fonts, add your brand logo, adjust the layout, apply different templates, add B-roll, and much more. The AI does the heavy lifting, and you have full creative control.",
  },
  {
    question: "What platforms can I publish to directly?",
    answer:
      "OpusClip supports direct publishing to TikTok, YouTube Shorts, Instagram Reels, and LinkedIn. You can also download clips in various formats for manual upload to any other platform. Our one-click publish feature saves you hours of manual uploading.",
  },
  {
    question: "How accurate are the auto-captions?",
    answer:
      "Our AI captions are over 98% accurate for clear English audio and support 20+ languages. The system handles multiple speakers, technical terminology, and various accents well. You can always review and edit any captions in our editor before publishing.",
  },
  {
    question: "What is the Virality Score?",
    answer:
      "The Virality Score is our proprietary AI metric that predicts how likely a clip is to go viral. It analyzes hundreds of factors including hook strength, emotional resonance, pacing, and trending patterns. Clips scoring above 90% have a significantly higher chance of reaching millions of views.",
  },
  {
    question: "Can I use OpusClip for my team or agency?",
    answer:
      "Yes! Our Business plan is designed for teams and agencies. It includes team collaboration features, shared brand kits, bulk processing, API access, and dedicated support. You can manage multiple client accounts and streamline your entire content production workflow.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="relative py-24 md:py-32">
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            Everything you need to know about OpusClip. Can&apos;t find an
            answer? Reach out to our support team.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-xl border border-white/5 bg-white/[0.02] px-6 data-[state=open]:bg-white/[0.04] data-[state=open]:border-white/10 transition-all duration-300 overflow-hidden"
              >
                <AccordionTrigger className="text-left text-white/80 hover:text-white py-5 text-base font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/40 text-sm leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
