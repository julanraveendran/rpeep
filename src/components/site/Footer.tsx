import Link from 'next/link';
import { Wordmark } from '@/components/site/Wordmark';
import { contact, footerNav, legalLine, site } from '@/content/site';

const linkClass = 'inline-flex min-h-11 items-center text-white underline underline-offset-4 hover:decoration-2';

/** Navy footer: description and contact, two link columns, company details and disclaimer (PRD section 6, item 11). */
export function Footer() {
  return (
    <footer className="on-navy bg-navy-900 text-on-navy-muted">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div>
          <Wordmark inverse />
          <p className="measure mt-2">{site.description}</p>
          <p className="mt-4">
            <a href={`mailto:${contact.email}`} className={linkClass}>
              {contact.email}
            </a>
          </p>
        </div>
        <nav aria-label="Product">
          <ul className="grid">
            {footerNav.product.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <ul className="grid">
            {footerNav.legal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/20">
        <div className="container-page space-y-2 py-6 text-sm">
          <p>{legalLine(new Date().getFullYear())}</p>
          <p>{site.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
