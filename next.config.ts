import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Normal Next.js server build (Electron içinde çalışacak)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
