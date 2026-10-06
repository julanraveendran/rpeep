'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { CTA } from '@/components/site/CTA';
import type { NavItem } from '@/content/site';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Hamburger menu for small screens. Traps focus while open, closes on Escape and returns focus to the button. */
export function MobileMenu({ items, cta }: { items: readonly NavItem[]; cta: NavItem }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const button = buttonRef.current;
    if (!panel || !button) return;

    // The menu button stays in the trap so a keyboard user can always close it.
    const focusables = () => [button, ...Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))];
    panel.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        button?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusables();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    // Close if the screen grows to desktop width, where the menu is hidden.
    const desktop = window.matchMedia('(min-width: 48rem)');
    const onResize = () => desktop.matches && setOpen(false);
    desktop.addEventListener('change', onResize);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener('change', onResize);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-button px-3 font-semibold text-navy-900"
      >
        {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
        <span>{open ? 'Close' : 'Menu'}</span>
      </button>
      {open ? (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t border-border bg-white p-4"
        >
          <nav aria-label="Main">
            <ul className="grid gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center rounded-button px-3 text-lg font-semibold text-navy-900 no-underline hover:bg-surface"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 px-3" onClick={() => setOpen(false)}>
            <CTA href={cta.href} location="header_mobile" className="w-full">
              {cta.label}
            </CTA>
          </div>
        </div>
      ) : null}
    </div>
  );
}
