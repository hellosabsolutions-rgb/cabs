import Link from 'next/link';
import { Logo } from './Logo';
import {
  TwitterLogo,
  LinkedinLogo,
  EnvelopeSimple,
} from '@phosphor-icons/react/dist/ssr';

const footerLinks = {
  Product: [
    { label: 'Platform', href: '/#platform' },
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Sign in', href: 'https://kabpro.pro' },
  ],
  Resources: [
    { label: 'FAQ', href: '/#faq' },
    { label: 'Documentation', href: '#' },
    { label: 'API', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '/#inquiry' },
    { label: 'Careers', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Terms of Service', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-10">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-5">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-white">
                    <path d="M8 1L14.5 5v6L8 15 1.5 11V5L8 1z" fill="currentColor" />
                  </svg>
                </span>
                <span className="font-bold text-lg tracking-tight text-white">
                  KABPRO
                </span>
              </div>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed max-w-[280px] mb-6">
              Fleet management software built for Indian cab operators. 
              Department billing, trip tracking, compliance, and more.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-accent hover:text-white transition-all duration-200"
              >
                <TwitterLogo size={18} />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-accent hover:text-white transition-all duration-200"
              >
                <LinkedinLogo size={18} />
              </a>
              <a
                href="mailto:sales@kabpro.in"
                aria-label="Email"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-accent hover:text-white transition-all duration-200"
              >
                <EnvelopeSimple size={18} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white mb-4">
                {title}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors duration-200"
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

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">
            © 2026 KABPRO. All rights reserved.
          </p>
          <p className="text-sm text-white/50">
            Built with ❤️ for Indian fleet operators
          </p>
        </div>
      </div>
    </footer>
  );
}
