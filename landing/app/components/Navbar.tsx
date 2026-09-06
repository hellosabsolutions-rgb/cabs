'use client';

import { useState } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { List, X } from '@phosphor-icons/react';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#inquiry' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <a
          href="#"
          className="flex items-center gap-2.5 font-bold text-lg text-foreground tracking-tight"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
              <path d="M8 1L14.5 5v6L8 15 1.5 11V5L8 1z" fill="currentColor" />
            </svg>
          </span>
          KABPRO
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-muted hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#inquiry"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Sign in
          </a>
          <a
            href="#cta"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors duration-200 active:scale-[0.98]"
          >
            Get demo
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-foreground"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden absolute inset-x-0 top-16 bg-white border-b border-border p-6 shadow-card z-50">
          <ul className="flex flex-col gap-5">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-muted hover:text-foreground transition-colors text-base"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#cta"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center w-full px-5 py-3 rounded-full bg-accent text-white text-sm font-semibold"
              >
                Get demo
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
