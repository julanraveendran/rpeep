'use client';

/**
 * First focusable element on every page. Moves focus to `<main id="main">`. It handles the click itself
 * instead of changing the URL hash, because the checker uses the hash to track its steps.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      onClick={(event) => {
        const main = document.getElementById('main');
        if (!main) return;
        event.preventDefault();
        main.focus();
        main.scrollIntoView();
      }}
      className="sr-only rounded-button bg-navy-900 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
    >
      Skip to main content
    </a>
  );
}
