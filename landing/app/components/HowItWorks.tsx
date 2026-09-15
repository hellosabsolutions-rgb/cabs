'use client';

import { useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  UserPlus,
  Truck,
  ChartLineUp,
  Rocket,
} from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Register your agency',
    description: 'Create your account in minutes. Add GSTIN, bank details, and team members.',
  },
  {
    icon: Truck,
    number: '02',
    title: 'Add your fleet',
    description: 'Onboard vehicles and drivers using forms or voice input in English/Hindi.',
  },
  {
    icon: ChartLineUp,
    number: '03',
    title: 'Start operations',
    description: 'Log trips, track expenses, generate invoices, and monitor compliance.',
  },
  {
    icon: Rocket,
    number: '04',
    title: 'Scale with confidence',
    description: 'Use analytics to optimize routes, reduce costs, and grow your business.',
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion();
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || !lineRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: lineRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section id="how-it-works" className="py-12 md:py-16 bg-bg relative scroll-mt-20 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Up and running in minutes
          </h2>
          <p className="text-muted text-lg max-w-[500px] mx-auto">
            Get started quickly with a simple setup process designed for busy fleet operators.
          </p>
        </motion.div>

        {/* Progress line (desktop) */}
        <div className="hidden md:block relative mb-12">
          <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-border" />
          <div
            ref={lineRef}
            className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-accent origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Step circle */}
              <div className="relative inline-flex mb-6">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-border flex items-center justify-center relative z-10">
                  <div className="absolute inset-0 rounded-full bg-accent/10" />
                  <step.icon size={28} weight="duotone" className="text-accent relative z-10" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center z-20 shadow-lg">
                  {step.number}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed max-w-[250px] mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <a
            href="/#inquiry"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-all duration-200 shadow-lg shadow-accent/25"
          >
            Start your free trial
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
