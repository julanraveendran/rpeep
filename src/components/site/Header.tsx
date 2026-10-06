import Link from 'next/link';
import { CTA } from '@/components/site/CTA';
import { HeaderScrollState } from '@/components/site/HeaderScrollState';
import { MobileMenu } from '@/components/site/MobileMenu';
import { Wordmark } from '@/components/site/Wordmark';
import { headerCta, headerNav } from '@/content/site';

const HEADER_ID = 'site-header';

/** Sticky white header with a bottom border once the page scrolls (PRD section 6, item 1). */
export function Header() {
  return (
    <header
      id={HEADER_ID}
      className="sticky top-0 z-40 border-b border-transparent bg-white data-[scrolled=true]:border-border"
    >
      <HeaderScrollState headerId={HEADER_ID} />
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Wordmark />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {headerNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-button px-3 font-semibold text-navy-900 no-underline hover:bg-surface"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden md:block">
          <CTA href={headerCta.href} location="header">
            {headerCta.label}
          </CTA>
        </div>
        <MobileMenu
          items={headerNav}
          cta={
            <CTA href={headerCta.href} location="header_mobile" className="w-full">
              {headerCta.label}
            </CTA>
          }
        />
      </div>
    </header>
  );
}
