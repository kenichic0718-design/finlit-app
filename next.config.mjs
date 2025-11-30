/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 15 / React 19 の App Router 前提
    optimizePackageImports: [
      "react",
      "react-dom"
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

export default nextConfig;

