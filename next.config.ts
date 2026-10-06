import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The PDF library runs on the server only. Keep it out of the bundler and ship the fonts with the function.
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/report': ['./public/fonts/**/*'],
  },
};

export default nextConfig;
