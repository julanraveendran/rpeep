/**
 * The site's public origin, for metadata, the sitemap, Open Graph images and links in emails.
 * Reads `NEXT_PUBLIC_SITE_URL`. Falls back to localhost while the domain is still a placeholder,
 * so a `[DOMAIN]` value never reaches `new URL()`.
 */
export const FALLBACK_SITE_URL = 'http://localhost:3000';

export function getSiteUrl(source: Record<string, string | undefined> = process.env): string {
  const raw = source.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

/** Absolute URL for a path on this site, for example `absoluteUrl('/pilot?utm_source=report_email')`. */
export function absoluteUrl(path: string, source: Record<string, string | undefined> = process.env): string {
  return new URL(path, getSiteUrl(source)).toString();
}
