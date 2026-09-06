'use client';

import { useState, useEffect } from 'react';
import { Cookie, X } from '@phosphor-icons/react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('kabpro-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem('kabpro-consent', 'accepted');
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem('kabpro-consent', 'dismissed');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="max-w-[600px] mx-auto bg-surface/95 backdrop-blur-xl border border-border rounded-2xl p-4 sm:p-5 shadow-lg pointer-events-auto">
        <div className="flex items-start gap-3 sm:gap-4">
          <Cookie size={24} weight="duotone" className="text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium mb-1">
              We use cookies
            </p>
            <p className="text-xs text-muted leading-relaxed mb-4">
              KABPRO uses essential and functional cookies to keep you signed in
              and remember your preferences. No tracking or advertising cookies.{' '}
              <Link
                href="/cookies"
                className="text-accent underline underline-offset-2"
              >
                Learn more
              </Link>
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={accept}
                className="px-5 py-2 rounded-full bg-accent text-accent-text text-xs font-semibold hover:bg-accent-hover transition-colors active:scale-[0.98]"
              >
                Accept
              </button>
              <button
                onClick={dismiss}
                className="px-5 py-2 rounded-full border border-border text-muted text-xs font-medium hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-faint hover:text-muted transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
