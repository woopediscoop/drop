import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase server action body size limit (for large file uploads)
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
