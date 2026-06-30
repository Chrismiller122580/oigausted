import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.(jpg|jpeg|png|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
      },
    ],
  },
  // Treat ssh2-sftp-client as external so its native binaries aren't bundled by webpack
  // (required for SFTP support in API routes; the dynamic import + this config avoids build failures)
  serverExternalPackages: [
    'ssh2',
    'ssh2-sftp-client',
    'playwright',
    'playwright-core',
    '@sparticuz/chromium',
    '@sparticuz/chromium-min',
    'lighthouse',
    'axe-core',
    'chrome-launcher',
  ],
  outputFileTracingIncludes: {
    '/api/admin/userlens/scan': [
      './node_modules/@sparticuz/chromium/bin/**',
      'node_modules/@sparticuz/chromium/bin/**',
      './node_modules/lighthouse/**',
      'node_modules/lighthouse/**',
      './node_modules/chrome-launcher/**',
      'node_modules/chrome-launcher/**',
    ],
    '/api/admin/userlens/scan/route': [
      './node_modules/@sparticuz/chromium/bin/**',
      'node_modules/@sparticuz/chromium/bin/**',
      './node_modules/lighthouse/**',
      'node_modules/lighthouse/**',
      './node_modules/chrome-launcher/**',
      'node_modules/chrome-launcher/**',
    ],
  },
}

export default nextConfig