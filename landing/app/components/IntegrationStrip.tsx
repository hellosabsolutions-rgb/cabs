'use client';

import {
  CreditCard,
  Receipt,
  Bank,
  Buildings,
  Microphone,
  Scroll,
  ShieldCheck,
  UsersThree,
} from '@phosphor-icons/react';

const badges = [
  { label: 'FASTag Integration', icon: CreditCard },
  { label: 'GST Billing', icon: Receipt },
  { label: 'NEFT / RTGS Payments', icon: Bank },
  { label: 'Government Contracts', icon: Buildings },
  { label: 'Hindi Voice Input', icon: Microphone },
  { label: 'Treasury Challan', icon: Scroll },
  { label: 'Compliance Tracking', icon: ShieldCheck },
  { label: 'Multi-Agency Support', icon: UsersThree },
];

export function IntegrationStrip() {
  return (
    <section className="py-12 border-y border-border overflow-hidden">
      <p className="text-sm text-faint text-center mb-8 tracking-wide">
        Built for Indian fleet operations
      </p>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />

        <div
          className="flex"
          style={{
            animation: 'marquee 40s linear infinite',
            width: 'max-content',
          }}
        >
          {[...badges, ...badges].map((badge, i) => (
            <span
              key={`${badge.label}-${i}`}
              className="flex-shrink-0 mx-3 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-border bg-surface text-sm text-muted shadow-card"
            >
              <badge.icon size={16} weight="duotone" className="text-accent" />
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
