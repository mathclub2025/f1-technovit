import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/admin/:path*",
        destination: `${apiUrl}/api/admin/:path*`,
      },
      {
        source: "/api/strategy/:path*",
        destination: `${apiUrl}/api/strategy/:path*`,
      },
      {
        source: "/api/register",
        destination: `${apiUrl}/api/register`,
      },
      {
        source: "/api/standings",
        destination: `${apiUrl}/api/standings`,
      },
    ];
  },
};

export default nextConfig;

