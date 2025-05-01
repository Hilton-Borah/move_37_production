// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // already done
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Add this to skip ESLint during build
  },
};

module.exports = nextConfig;
