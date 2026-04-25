import type { NextConfig } from "next";

const backend =
  process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:3006";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    // Same-origin /api → backend: avoids browser CORS (3002 vs 5000) in local dev.
    if (process.env.NODE_ENV !== "development") return [];
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
