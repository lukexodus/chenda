import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Turbopack: use resolved absolute path to avoid symlink issues
  turbopack: {
    root: path.resolve(__dirname),
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
