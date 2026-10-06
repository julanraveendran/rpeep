import type { NextConfig } from 'next';
import { staticSecurityHeaders } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The PDF library runs on the server only. Keep it out of the bundler and ship the fonts with the function.
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/report': ['./public/fonts/**/*'],
  },
  // Security headers (PRD section 13). The Content-Security-Policy is added per request in src/proxy.ts.
  async headers() {
    return [{ source: '/:path*', headers: [...staticSecurityHeaders] }];
  },
};

export default nextConfig;
