'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GSAPRevealProps {
  children: React.ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  duration?: number;
  stagger?: number;
  triggerStart?: string;
}

export function GSAPReveal({
  children,
  className = '',
  y = 40,
  delay = 0,
  duration = 0.9,
  triggerStart = 'top 85%',
}: GSAPRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    gsap.set(el, { y, opacity: 0 });

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: 0,
        opacity: 1,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: triggerStart,
          toggleActions: 'play none none none',
        },
      });
    }, el);

    return () => ctx.revert();
  }, [y, delay, duration, triggerStart]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
