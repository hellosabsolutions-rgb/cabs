'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Plus, Minus } from '@phosphor-icons/react';

const faqs = [
  {
    q: 'How does KABPRO handle department billing?',
    a: 'KABPRO automates the entire department billing cycle: contract setup with base rates, daily duty log tracking, monthly GST invoice generation, extra km/hour calculations, and payment tracking via NEFT, RTGS, Treasury Challan, or cheque.',
  },
  {
    q: 'Is my fleet data secure?',
    a: 'Absolutely. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use JWT-based authentication, rate-limited APIs, and role-based access control. Your data is backed up daily and never shared with third parties.',
  },
  {
    q: 'Can I track vehicles in real-time?',
    a: 'Yes. KABPRO includes a live tracking view showing vehicle location, speed, ignition status, and last ping. You can monitor your entire fleet on a single map with status filters.',
  },
  {
    q: 'What payment methods do you support?',
    a: 'For department payments, we support NEFT, RTGS, Treasury Challan, cheque, UPI, and direct bank transfer. For your KABPRO subscription, we accept all major cards, UPI, and net banking.',
  },
  {
    q: 'How do I migrate from my current system?',
    a: 'Our onboarding team helps you import vehicles, drivers, and contracts from spreadsheets or other software. Voice onboarding in English and Hindi makes adding fleet data fast. Most operators are fully set up within a day.',
  },
  {
    q: 'Is there a mobile app for drivers?',
    a: 'Yes. We have a dedicated driver app for Android and iOS. Drivers can start/end duty, accept trips, log fuel and expenses, track earnings, and receive compliance alerts all from their phone.',
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
  const reduce = useReducedMotion();

  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-5 text-left gap-4 group"
        aria-expanded={open}
      >
        <span className="text-base font-medium text-foreground group-hover:text-accent transition-colors duration-200">
          {q}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
          open ? 'bg-accent text-white' : 'bg-surface-bright text-muted group-hover:bg-accent/10 group-hover:text-accent'
        }`}>
          {open ? <Minus size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-muted leading-relaxed pb-5 pr-12">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="py-12 md:py-16 bg-bg relative scroll-mt-20 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20">
          {/* Left column - Header */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Questions fleet operators ask
            </h2>
            <p className="text-muted leading-relaxed mb-6">
              Everything you need to know about KABPRO. Can&apos;t find what you&apos;re looking for?
            </p>
            <a
              href="/#inquiry"
              className="inline-flex items-center gap-2 text-accent font-medium hover:underline"
            >
              Contact our team
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </motion.div>

          {/* Right column - Accordion */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl border border-border p-6 md:p-8"
          >
            <div className="divide-y divide-border">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={faq.q}
                  q={faq.q}
                  a={faq.a}
                  open={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
