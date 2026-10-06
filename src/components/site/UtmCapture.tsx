'use client';

import { useEffect } from 'react';
import { captureUtm } from '@/lib/utm';

/** Remembers `utm_source`, `utm_medium` and `utm_campaign` from the landing URL for this browser session. Renders nothing. */
export function UtmCapture() {
  useEffect(() => {
    captureUtm(window.location.search);
  }, []);
  return null;
}
