/**
 * Removes personal data from Sentry events before they leave the server or the browser (PRD section 13: "Log errors to
 * Sentry without personal data (scrub email and names in beforeSend)"). Pure, so it can be tested.
 */

// local part @ domain with a dot, not swallowing a full stop or comma that ends the sentence
const EMAIL = /[^\s<>"'()[\]@]+@[^\s<>"'()[\]@]+\.[^\s<>"'()[\]@.,;:!?]+/g;
const FILTERED = '[Filtered]';

/** Keys whose value is always dropped, wherever they appear. */
const SENSITIVE_KEY = /e-?mail|first.?name|last.?name|full.?name|^name$|organi[sz]ation|building.?ref|password|secret|token|authorization|cookie|api.?key|phone/i;

export const scrubText = (text: string): string => text.replace(EMAIL, '[email]');

/** A URL without its query string or fragment, which can carry tokens or campaign values. */
export function scrubUrl(url: string): string {
  const cut = url.search(/[?#]/);
  return scrubText(cut === -1 ? url : url.slice(0, cut));
}

function scrubValue(value: unknown, depth: number): unknown {
  if (depth > 8) return FILTERED;
  if (typeof value === 'string') return scrubText(value);
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY.test(key) ? FILTERED : /url$/i.test(key) && typeof inner === 'string' ? scrubUrl(inner) : scrubValue(inner, depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * Use as `beforeSend`. Drops the user, cookies, headers, request body and query string; replaces anything that looks
 * like an email address; filters values stored under keys such as `email`, `firstName`, `organisation` or `token`.
 */
export function scrubEvent<T extends object>(event: T): T {
  const copy = { ...(event as Record<string, unknown>) };

  delete copy.user;
  if (copy.request && typeof copy.request === 'object') {
    const { url, method } = copy.request as { url?: string; method?: string };
    copy.request = { ...(url ? { url: scrubUrl(url) } : {}), ...(method ? { method } : {}) };
  }

  for (const key of ['message', 'exception', 'breadcrumbs', 'extra', 'contexts', 'tags', 'transaction', 'logentry']) {
    if (key in copy) copy[key] = scrubValue(copy[key], 0);
  }
  return copy as T;
}

/** Use as `beforeBreadcrumb`: removes the same data from breadcrumbs, which record clicks, requests and navigation. */
export function scrubBreadcrumb<T extends object>(breadcrumb: T): T {
  return scrubValue(breadcrumb, 0) as T;
}

/**
 * Sentry SDK data collection: nothing about the user, cookies, headers, request bodies or query strings is collected
 * to begin with. `scrubEvent` is a second layer for anything that still gets into an event, such as an error message.
 */
export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [] as never[],
  urlQueryParams: false,
};
