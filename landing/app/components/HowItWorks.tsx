'use client';

import Image from 'next/image';
import { UserPlus, Truck, ChartLineUp } from '@phosphor-icons/react';
import { GSAPReveal } from './GSAPReveal';
import { TextReveal } from './TextReveal';

const steps = [
  {
    icon: UserPlus,
    title: 'Register your agency',
    desc: 'Create your account and set up your fleet agency profile in under 2 minutes. Add your GSTIN and business details.',
    vehicle: '/dzire-cab.png',
  },
  {
    icon: Truck,
    title: 'Add your fleet',
    desc: 'Onboard vehicles with voice or forms, assign drivers, set up department contracts and trip routes.',
    vehicle: '/innova-fleet.png',
  },
  {
    icon: ChartLineUp,
    title: 'Track everything',
    desc: 'Monitor profits, expenses, compliance alerts, and daily operations from your unified dashboard.',
    vehicle: '/ambassador-taxi.png',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-surface scroll-mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <TextReveal
          as="h2"
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground text-center mb-12 md:mb-20"
        >
          Up and running in minutes
        </TextReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {steps.map((step, i) => (
            <GSAPReveal
              key={step.title}
              delay={i * 0.15}
              className="relative flex flex-col items-center text-center px-8 py-10"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-[72px] left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-gradient-to-r from-accent/40 via-accent/15 to-transparent" />
              )}

              <div className="relative mb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted border border-accent/15">
                  <step.icon size={28} weight="duotone" className="text-accent" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-text text-xs font-bold">
                  {i + 1}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed max-w-[300px] mb-5">
                {step.desc}
              </p>

              <div className="w-full max-w-[200px] h-[90px] flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                <Image
                  src={step.vehicle}
                  alt=""
                  width={200}
                  height={100}
                  className="w-full h-auto object-contain max-h-[80px]"
                />
              </div>
            </GSAPReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
