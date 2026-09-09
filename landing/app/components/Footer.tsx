import {
  GithubLogo,
  TwitterLogo,
  LinkedinLogo,
  EnvelopeSimple,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Sign in', href: 'https://kabpro.pro' },
    { label: 'Documentation', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#inquiry' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Terms of Service', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-bold text-lg text-foreground tracking-tight mb-4"
            >
              <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-text">
                  <path d="M8 1L14.5 5v6L8 15 1.5 11V5L8 1z" fill="currentColor" />
                </svg>
              </span>
              KABPRO
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-[320px] mb-6">
              Commercial fleet and logistics management platform built for
              Indian fleet operators. Department billing, trip tracking,
              compliance, and more.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: TwitterLogo, label: 'Twitter' },
                { Icon: LinkedinLogo, label: 'LinkedIn' },
                { Icon: GithubLogo, label: 'GitHub' },
                { Icon: EnvelopeSimple, label: 'Email' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground hover:border-accent/30 transition-colors duration-200"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {title}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-faint">
            2024-2026 KABPRO. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-faint hover:text-muted transition-colors">
              Privacy
            </Link>
            <Link href="/cookies" className="text-xs text-faint hover:text-muted transition-colors">
              Cookies
            </Link>
            <p className="text-xs text-faint">
              Built for Indian fleet operators.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
