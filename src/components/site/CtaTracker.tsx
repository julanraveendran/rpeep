'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

/** Sends `cta_clicked { location }` when anything with a `data-cta` attribute is activated. One listener for the whole site. */
export function CtaTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('[data-cta]') : null;
      const location = target?.getAttribute('data-cta');
      if (location) track('cta_clicked', { location });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
