'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ChartLineUp,
  Truck,
  ShieldCheck,
  CurrencyInr,
} from '@phosphor-icons/react';
import { DashboardMock } from './DashboardMock';

gsap.registerPlugin(ScrollTrigger);

const floatingCards = [
  {
    icon: ChartLineUp,
    label: 'Revenue',
    value: '+23.4%',
    position: 'top-[8%] left-[3%]',
    color: '#7856ff',
  },
  {
    icon: Truck,
    label: 'Active vehicles',
    value: '47',
    position: 'top-[12%] right-[3%]',
    color: '#80e1d9',
  },
  {
    icon: ShieldCheck,
    label: 'Compliance',
    value: '100%',
    position: 'bottom-[18%] left-[5%]',
    color: '#f8bc3b',
  },
  {
    icon: CurrencyInr,
    label: 'Net profit',
    value: '₹4.2L',
    position: 'bottom-[14%] right-[5%]',
    color: '#ff7557',
  },
];

export function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const mockRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const mock = mockRef.current;
    if (!section || !mock) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        mock,
        { y: 60, scale: 0.92, opacity: 0.5 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, scale: 0.8, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            delay: 0.4 + i * 0.15,
            ease: 'back.out(1.5)',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground mb-4">
            See your fleet at a glance
          </h2>
          <p className="text-muted text-base md:text-lg max-w-[520px] mx-auto leading-relaxed">
            Revenue, expenses, vehicle status, compliance, and profitability
            from one unified command center.
          </p>
        </div>

        <div ref={mockRef} className="relative mx-auto max-w-[1100px]">
          <DashboardMock className="w-full" />

          {floatingCards.map((card, i) => (
            <div
              key={card.label}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className={`absolute ${card.position} hidden lg:flex items-center gap-3 px-4 py-3 rounded-xl bg-surface/90 backdrop-blur-md border border-border shadow-card`}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${card.color}20` }}
              >
                <card.icon
                  size={18}
                  weight="duotone"
                  style={{ color: card.color }}
                />
              </div>
              <div>
                <p className="text-xs text-muted">{card.label}</p>
                <p className="text-sm font-semibold text-foreground font-mono">
                  {card.value}
                </p>
              </div>
            </div>
          ))}

          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-glow rounded-full blur-[80px] pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
