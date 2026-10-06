'use client';

import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';

/**
 * Cloudflare Turnstile bot check, in the least intrusive mode: a challenge appears only if Cloudflare needs one
 * (PRD section 4). The script is loaded only on pages with a form (PRD section 14D). The token is single-use, so
 * call `reset()` after every submit.
 */

declare global {
  interface Window {
    turnstile?: {
      render(
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
          appearance: 'interaction-only';
          theme: 'light';
          language: string;
        },
      ): string;
      reset(widgetId: string): void;
      remove(widgetId: string): void;
    };
  }
}

export type TurnstileHandle = {
  /** The current token, waiting up to 20 seconds for the check to finish. `null` if it did not. */
  getToken(): Promise<string | null>;
  /** Asks for a fresh token. */
  reset(): void;
};

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | undefined;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = undefined;
      reject(new Error('Turnstile failed to load'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function Turnstile({ ref }: { ref?: Ref<TurnstileHandle> }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const waiters = useRef<((token: string | null) => void)[]>([]);

  useImperativeHandle(ref, () => ({
    getToken() {
      if (token.current) return Promise.resolve(token.current);
      return new Promise<string | null>((resolve) => {
        const timer = window.setTimeout(() => resolve(null), 20_000);
        waiters.current.push((value) => {
          window.clearTimeout(timer);
          resolve(value);
        });
      });
    },
    reset() {
      token.current = null;
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          theme: 'light',
          language: 'en-gb',
          callback: (value) => {
            token.current = value;
            for (const waiter of waiters.current.splice(0)) waiter(value);
          },
          'expired-callback': () => {
            token.current = null;
            if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
          },
          'error-callback': () => {
            token.current = null;
          },
        });
      })
      .catch(() => {
        // Blocked or offline: submitting will report that the bot check could not be completed.
      });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
      token.current = null;
    };
  }, []);

  return <div ref={container} data-testid="turnstile" />;
}
