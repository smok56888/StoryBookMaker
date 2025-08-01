/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    dynamicIO: false,
  },
  // 强制动态渲染，解决静态渲染问题
  output: 'standalone',
}

export default nextConfig
