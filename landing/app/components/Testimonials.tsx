'use client';

import Image from 'next/image';
import { GSAPReveal } from './GSAPReveal';
import { TextReveal } from './TextReveal';

const testimonials = [
  {
    quote:
      'KABPRO replaced three separate tools we were using. Department billing alone saves us 6 hours every month.',
    name: 'Rajesh Thakur',
    role: 'Fleet Manager, Delhi Transport Services',
    avatar: 'https://i.pravatar.cc/80?img=11',
  },
  {
    quote:
      'The trip profitability view changed how we price outstation runs. We finally know our real margins.',
    name: 'Priya Menon',
    role: 'Operations Head, Kerala Cabs',
    avatar: 'https://i.pravatar.cc/80?img=32',
  },
  {
    quote:
      'FASTag tracking and compliance alerts keep my fleet running without surprises. Worth every rupee.',
    name: 'Amit Patel',
    role: 'Owner, Gujarat Fleet Solutions',
    avatar: 'https://i.pravatar.cc/80?img=53',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-surface scroll-mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <TextReveal
          as="h2"
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground text-center mb-10 md:mb-16"
        >
          What fleet operators say
        </TextReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <GSAPReveal
              key={t.name}
              delay={i * 0.1}
              className={`group relative flex flex-col rounded-2xl border border-border bg-bg p-7 hover:border-accent/20 transition-all duration-500 shadow-card hover:shadow-lg ${
                i === 0 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <svg
                width="32"
                height="24"
                viewBox="0 0 32 24"
                fill="none"
                className="text-accent/30 mb-5 shrink-0"
              >
                <path
                  d="M0 24V14.4C0 6.13 5.37 1.07 13.33 0l1.34 3.47C9.33 4.8 7.33 8.27 7.33 12H12v12H0zm18.67 0V14.4c0-8.27 5.36-13.33 13.33-14.4L33.33 3.47C28 4.8 26 8.27 26 12h4.67v12H18.67z"
                  fill="currentColor"
                />
              </svg>
              <p className="text-foreground/90 leading-relaxed mb-6 text-[15px]">
                {t.quote}
              </p>
              <div className="mt-auto flex items-center gap-3">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={40}
                  height={40}
                  className="rounded-full ring-2 ring-border"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
            </GSAPReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
