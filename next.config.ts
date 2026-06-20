import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
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
    'lighthouse',
    'axe-core',
    'chrome-launcher',
  ],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/@sparticuz/chromium/**'],
  },
}

export default nextConfig