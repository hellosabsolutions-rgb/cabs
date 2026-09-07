'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { GSAPReveal } from './GSAPReveal';
import { TextReveal } from './TextReveal';

const stats = [
  { value: 500, suffix: '+', label: 'Fleet operators onboarded' },
  { value: 15000, suffix: '+', label: 'Vehicles tracked daily' },
  { value: 46, suffix: '%', label: 'Average profit margins' },
  { value: 99, suffix: '.9%', label: 'Uptime reliability' },
];

function AnimatedCounter({
  target,
  suffix,
  inView,
}: {
  target: number;
  suffix: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) {
      setCount(target);
      return;
    }

    let frame: number;
    const duration = 2000;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);

  const formatted =
    target >= 1000
      ? `${(count / 1000).toFixed(count >= target ? 0 : 1)}k`
      : `${count}`;

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section className="py-16 md:py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <GSAPReveal className="text-center mb-10 md:mb-16">
          <p className="text-xs font-medium text-accent uppercase tracking-[0.2em] mb-4">
            By the numbers
          </p>
          <TextReveal
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground"
          >
            Trusted at scale
          </TextReveal>
        </GSAPReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {stats.map((stat, i) => (
            <GSAPReveal
              key={stat.label}
              delay={i * 0.1}
              className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-surface shadow-card"
            >
              <span className="text-4xl md:text-5xl font-bold text-accent tracking-tight mb-3 font-mono tabular-nums">
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  inView={inView}
                />
              </span>
              <span className="text-sm text-muted">{stat.label}</span>
            </GSAPReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
