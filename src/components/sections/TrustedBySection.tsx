"use client";

import { motion } from "framer-motion";

const brands = [
  { name: "Google", svg: (
    <svg className="h-6 md:h-7" viewBox="0 0 86 28" fill="none">
      <path d="M11.5 8.5c3.2 0 5.8 2.5 5.8 5.7s-2.6 5.7-5.8 5.7S5.7 17.4 5.7 14.2 8.3 8.5 11.5 8.5zm0 9c1.8 0 3.3-1.5 3.3-3.3s-1.5-3.3-3.3-3.3-3.3 1.5-3.3 3.3 1.5 3.3 3.3 3.3z" fill="rgba(255,255,255,0.25)"/>
      <path d="M24 8.5c3.2 0 5.8 2.5 5.8 5.7S27.2 19.9 24 19.9s-5.8-2.5-5.8-5.7S20.8 8.5 24 8.5zm0 9c1.8 0 3.3-1.5 3.3-3.3S25.8 10.9 24 10.9s-3.3 1.5-3.3 3.3 1.5 3.3 3.3 3.3z" fill="rgba(255,255,255,0.25)"/>
      <path d="M36.5 8.5c3.2 0 5.8 2.5 5.8 5.7s-2.6 5.7-5.8 5.7-5.8-2.5-5.8-5.7 2.6-5.7 5.8-5.7zm0 9c1.8 0 3.3-1.5 3.3-3.3s-1.5-3.3-3.3-3.3-3.3 1.5-3.3 3.3 1.5 3.3 3.3 3.3z" fill="rgba(255,255,255,0.25)"/>
      <text x="48" y="18" fill="rgba(255,255,255,0.25)" fontSize="14" fontWeight="700">Google</text>
    </svg>
  )},
  { name: "Microsoft", text: true },
  { name: "Amazon", text: true },
  { name: "Netflix", text: true },
  { name: "Spotify", text: true },
  { name: "Adobe", text: true },
];

export function TrustedBySection() {
  return (
    <section className="relative py-20 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-sm text-white/30 uppercase tracking-wider font-medium">
            Trusted by 10M+ creators and businesses worldwide
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6"
        >
          {brands.map((brand, i) => (
            <div
              key={brand.name}
              className="flex items-center justify-center opacity-30 hover:opacity-60 transition-opacity duration-300"
            >
              {brand.text ? (
                <span className="text-xl md:text-2xl font-bold text-white/80 tracking-tight">
                  {brand.name}
                </span>
              ) : (
                brand.svg
              )}
            </div>
          ))}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "10M+", label: "Active Users" },
            { value: "50M+", label: "Clips Created" },
            { value: "150+", label: "Countries" },
            { value: "4.9/5", label: "User Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/30">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
