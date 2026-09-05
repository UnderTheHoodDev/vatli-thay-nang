import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-d15f1310dee646d49a73d9b8ad27a2b5.r2.dev',
        pathname: '/help/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/auth/:path*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
  },
};

export default nextConfig;
