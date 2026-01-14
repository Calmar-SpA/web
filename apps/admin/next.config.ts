import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@calmar/ui"],
  serverActions: {
    bodySizeLimit: '50mb',
  } as any,
  experimental: {
    clientMaxBodySize: '100mb',
  } as any,
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
