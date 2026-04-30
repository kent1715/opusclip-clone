import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    ".z.ai",
    "18.221.5.26",
    "localhost",
  ],
  // Required for standalone output (production deployment)
  output: "standalone",
};

export default nextConfig;
