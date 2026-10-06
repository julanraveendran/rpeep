/** First focusable element on every page. Jumps past the header to `<main id="main">`. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-button bg-navy-900 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
    >
      Skip to main content
    </a>
  );
}
