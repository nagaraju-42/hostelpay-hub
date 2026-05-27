const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: require('next-pwa/cache'),
  buildExcludes: [/middleware-manifest\.json$/],
})
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence Turbopack/webpack conflict: next-pwa adds webpack config,
  // but it's disabled in development. This empty turbopack config
  // tells Next.js 16 we're aware and intentional.
  turbopack: {},
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        ]
      }
    ]
  }
}
 
module.exports = withPWA(nextConfig)