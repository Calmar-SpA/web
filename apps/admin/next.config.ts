import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@calmar/ui"],
  serverActions: {
    bodySizeLimit: '50mb',
  } as any,
  experimental: {
    clientMaxBodySize: '100mb',
  } as any,
};

export default nextConfig;
