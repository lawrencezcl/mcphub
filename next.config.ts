import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // 跳过构建时的静态优化
  trailingSlash: false,
  generateBuildId: async () => {
    return 'mcphub-build-' + Date.now()
  }
};

export default nextConfig;
