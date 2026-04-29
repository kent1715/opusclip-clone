"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with AI video clipping.",
    icon: Sparkles,
    gradient: "from-white/10 to-white/5",
    buttonGradient: "bg-white/10 hover:bg-white/15 text-white",
    features: [
      "5 clips per month",
      "720p export quality",
      "Auto captions",
      "Basic templates",
      "Watermark included",
      "Community support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For creators who want to grow their audience faster.",
    icon: Zap,
    gradient: "from-pink-500 to-purple-600",
    buttonGradient:
      "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/25",
    features: [
      "200 clips per month",
      "1080p export quality",
      "ClipAnything AI model",
      "All templates & fonts",
      "No watermark",
      "Priority processing",
      "Virality Score",
      "AI B-Roll",
      "Auto-reframe",
    ],
    cta: "Get Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "$49",
    period: "/month",
    description: "For teams and businesses scaling content production.",
    icon: Crown,
    gradient: "from-cyan-500 to-blue-600",
    buttonGradient:
      "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25",
    features: [
      "Unlimited clips",
      "4K export quality",
      "Everything in Pro",
      "Multi-language dubbing",
      "Brand kit & templates",
      "Team collaboration",
      "API access",
      "Bulk processing",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Get Business",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 md:py-32">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5 rounded-full blur-[200px]" />

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
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            Start free and scale as you grow. No hidden fees. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? "border-pink-500/30 bg-gradient-to-b from-pink-500/[0.08] to-transparent"
                  : "border-white/5 bg-white/[0.02]"
              } p-6 lg:p-8 transition-all duration-300 hover:border-white/10`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 px-4 py-1 text-xs font-bold shadow-lg shadow-pink-500/25">
                    MOST POPULAR
                  </Badge>
                </div>
              )}

              {/* Plan Icon & Name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}
                >
                  <plan.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              </div>

              {/* Price */}
              <div className="mb-2">
                <span className="text-4xl lg:text-5xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-white/30 ml-1">{plan.period}</span>
              </div>

              <p className="text-sm text-white/40 mb-6">{plan.description}</p>

              {/* CTA Button */}
              <Button
                className={`w-full mb-6 ${plan.buttonGradient} border-0 h-12 text-sm font-semibold rounded-xl transition-all duration-300`}
              >
                {plan.cta}
              </Button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-white/50">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
