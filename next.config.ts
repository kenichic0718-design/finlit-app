import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ← ビルド中は ESLint エラーで止めない
  },
  typescript: {
    // 型エラーがあっても本番ビルドを止めない（必要なら付ける）
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
