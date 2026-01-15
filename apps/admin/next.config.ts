import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@calmar/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zyqkuhzsnomufwmfoily.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
