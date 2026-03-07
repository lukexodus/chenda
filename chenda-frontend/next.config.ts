import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required for Docker: bundles only what is needed to run in a minimal image
  output: "standalone",
  // Turbopack: use resolved absolute path to avoid symlink issues
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Proxy /uploads/* requests to the backend so images are same-origin
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "http://localhost:3001/uploads/:path*",
      },
    ];
  },
  // Allow images from the API server
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
