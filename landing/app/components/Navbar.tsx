'use client';

import { useEffect, useState } from 'react';
import { List, X } from '@phosphor-icons/react';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'motion/react';

const links = [
  { label: 'Platform', href: '/#platform' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 h-16 md:h-20">
        <a href="/" aria-label="KABPRO home">
          <Logo />
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-muted hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://kabpro.pro"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors duration-200"
          >
            Sign in
          </a>
          <a
            href="/#inquiry"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-all duration-200 active:scale-[0.98] shadow-lg shadow-accent/20"
          >
            Get demo
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 -mr-2 text-foreground"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute inset-x-0 top-16 bg-white border-b border-border shadow-lg"
          >
            <div className="px-4 py-6">
              <ul className="flex flex-col gap-1 mb-6">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 text-foreground hover:text-accent transition-colors text-base font-medium"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3">
                <a
                  href="https://kabpro.pro"
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-center text-muted hover:text-foreground transition-colors text-base"
                >
                  Sign in
                </a>
                <a
                  href="/#inquiry"
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-center rounded-full bg-accent text-white text-base font-semibold"
                >
                  Get demo
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
