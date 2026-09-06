'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  delay?: number;
  stagger?: number;
  triggerStart?: string;
}

export function TextReveal({
  children,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  stagger = 0.03,
  triggerStart = 'top 85%',
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    const words = children.split(' ');
    el.innerHTML = words
      .map(
        (word) =>
          `<span class="split-word"><span class="split-char" style="display:inline-block;transform:translateY(110%);opacity:0">${word}</span></span>`
      )
      .join(' ');

    const chars = el.querySelectorAll('.split-char');

    const ctx = gsap.context(() => {
      gsap.to(chars, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger,
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
  }, [children, delay, stagger, triggerStart]);

  return (
    <Tag ref={ref as React.Ref<HTMLHeadingElement>} className={className}>
      {children}
    </Tag>
  );
}
