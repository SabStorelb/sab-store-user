/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // تحذير: هذا يسمح بإكمال البناء حتى مع وجود أخطاء ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // تحذير: هذا يسمح بإكمال البناء حتى مع وجود أخطاء TypeScript
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  // experimental: {
  //   appDir: false
  // }
}

module.exports = nextConfig
