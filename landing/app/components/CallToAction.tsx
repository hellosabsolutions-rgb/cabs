'use client';

import { ArrowRight } from '@phosphor-icons/react';
import { GSAPReveal } from './GSAPReveal';
import { TextReveal } from './TextReveal';

export function CallToAction() {
  return (
    <section id="cta" className="py-20 md:py-32 relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-glow rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="max-w-[640px] mx-auto text-center">
          <TextReveal
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground mb-5"
          >
            Ready to take control of your fleet?
          </TextReveal>

          <GSAPReveal delay={0.2}>
            <p className="text-muted text-base md:text-lg leading-relaxed mb-10 max-w-[480px] mx-auto">
              Start with a free demo. No credit card required. See your fleet
              data come alive in minutes.
            </p>
          </GSAPReveal>

          <GSAPReveal delay={0.35}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#"
                className="group inline-flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-4 rounded-full bg-accent text-accent-text font-semibold text-sm hover:bg-accent-hover transition-all duration-200 active:scale-[0.98] shadow-[0_0_32px_var(--theme-glow)]"
              >
                Start Free Demo
                <ArrowRight
                  size={16}
                  weight="bold"
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                />
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-4 rounded-full border border-border text-foreground text-sm font-medium hover:bg-surface-elevated transition-colors duration-200"
              >
                Contact Sales
              </a>
            </div>
          </GSAPReveal>
        </div>
      </div>
    </section>
  );
}
