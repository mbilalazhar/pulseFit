import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    qualities: [75, 90],
  },
  experimental: {
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
  }
};

export default nextConfig;
