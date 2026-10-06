export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// No database call, per PRD section 12.
export function GET() {
  return Response.json({ ok: true, version: process.env.npm_package_version ?? '0.1.0' });
}
