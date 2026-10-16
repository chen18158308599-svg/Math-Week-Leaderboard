import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/login.", destination: "/login", permanent: false },
      { source: "/digital-play", destination: "/digital-play/index.html", permanent: false },
    ];
  },
};

export default nextConfig;
