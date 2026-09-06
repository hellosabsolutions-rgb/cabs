'use client';

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { GSAPReveal } from './GSAPReveal';
import { TextReveal } from './TextReveal';

const faqs = [
  {
    q: 'How does KABPRO handle department billing?',
    a: 'KABPRO automates the full department billing cycle: contract setup with base rates, daily duty log tracking, monthly GST invoice generation, extra km/hour calculations, and payment tracking via NEFT, RTGS, Treasury Challan, or cheque.',
  },
  {
    q: 'Is my fleet data secure?',
    a: 'Absolutely. All data is encrypted at rest and in transit. We use JWT-based authentication, rate-limited APIs, and role-based access control. Your data is backed up daily and never shared with third parties.',
  },
  {
    q: 'Can I track vehicles in real-time?',
    a: 'Yes. KABPRO includes a live tracking view showing vehicle location, speed, ignition status, and fuel level. You can monitor your entire fleet on a single map with status filters.',
  },
  {
    q: 'What payment methods do you support for billing?',
    a: 'For department payments, we support NEFT, RTGS, Treasury Challan, cheque, UPI, and direct bank transfer. For your KABPRO subscription, we accept all major cards, UPI, and net banking.',
  },
  {
    q: 'How do I migrate from my current system?',
    a: 'Our onboarding team helps you import vehicles, drivers, and contracts from spreadsheets or other software. Voice onboarding in English and Hindi makes adding fleet data fast. Most operators are fully set up within a day.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'KABPRO is a progressive web app that works beautifully on mobile browsers. A dedicated Android and iOS app is on our roadmap for Q1 2027 with offline support and push notifications.',
  },
  {
    q: 'Can I manage multiple agencies?',
    a: 'Yes. KABPRO supports multi-agency management. You can create separate agencies under one account, switch between them instantly, and maintain independent vehicle fleets, contracts, and billing for each.',
  },
];

function AccordionItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-base font-medium text-foreground group-hover:text-accent transition-colors duration-200 pr-4">
          {q}
        </span>
        <CaretDown
          size={18}
          weight="bold"
          className={`text-muted shrink-0 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-[400px] pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-sm text-muted leading-relaxed pr-8">{a}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 scroll-mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
          <GSAPReveal className="lg:col-span-2">
            <TextReveal
              as="h2"
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground mb-4"
            >
              Frequently asked questions
            </TextReveal>
            <p className="text-muted text-base leading-relaxed mb-6">
              Everything you need to know about KABPRO. Can&apos;t find what
              you&apos;re looking for?
            </p>
            <a
              href="#inquiry"
              className="inline-flex items-center text-sm text-accent font-medium hover:underline"
            >
              Reach out to our team
            </a>
          </GSAPReveal>

          <GSAPReveal delay={0.1} className="lg:col-span-3">
            <div className="border-t border-border">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  q={faq.q}
                  a={faq.a}
                  open={openIndex === i}
                  onToggle={() =>
                    setOpenIndex(openIndex === i ? null : i)
                  }
                />
              ))}
            </div>
          </GSAPReveal>
        </div>
      </div>
    </section>
  );
}
