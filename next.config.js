/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: __dirname, // ← これで現在のプロジェクトをルート固定
  },
};
module.exports = nextConfig;

