'use client';

import { useEffect } from 'react';

/** Adds `data-scrolled` to the header once the page scrolls, so it can show a bottom border. Renders nothing. */
export function HeaderScrollState({ headerId }: { headerId: string }) {
  useEffect(() => {
    const header = document.getElementById(headerId);
    if (!header) return;
    const update = () => header.setAttribute('data-scrolled', String(window.scrollY > 0));
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [headerId]);
  return null;
}
