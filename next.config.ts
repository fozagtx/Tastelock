import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bloks/shared"],
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
};

export default nextConfig;
