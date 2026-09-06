'use client';

import Image from 'next/image';
import {
  Truck,
  Receipt,
  CurrencyInr,
  GasPump,
  ShieldCheck,
  Microphone,
  MapPin,
  ChartLineUp,
} from '@phosphor-icons/react';
import { GSAPReveal } from './GSAPReveal';
import { TextReveal } from './TextReveal';

const features = [
  {
    title: 'Dual Fleet Management',
    desc: 'Run department vehicles and trip cabs from one system. Switch modes, track separately, report together.',
    icon: Truck,
    span: 'md:col-span-2',
    accent: true,
    vehicle: '/innova-fleet.png',
  },
  {
    title: 'Smart Billing',
    desc: 'Generate GST invoices, track duty logs, and manage department contracts on autopilot.',
    icon: Receipt,
    span: '',
    gradient: true,
  },
  {
    title: 'Live Driver Location',
    desc: 'See every driver on a live map — GPS position, speed, ignition, and last ping. Know who is on a trip and who is idle.',
    icon: MapPin,
    span: 'md:col-span-2',
    accent: true,
    vehicle: '/hero-car.png',
  },
  {
    title: 'Realtime Revenue',
    desc: 'Watch today’s collections update as trips close. Department billing and trip earnings in one live view.',
    icon: ChartLineUp,
    span: '',
    gradient: true,
  },
  {
    title: 'Compliance Alerts',
    desc: 'Never miss an RC, insurance, PUC, or permit renewal. Get alerts before expiry.',
    icon: ShieldCheck,
    span: '',
  },
  {
    title: 'Trip Profitability',
    desc: 'See exact profit on every trip. Fuel, FASTag, driver bata, and revenue calculated in real time.',
    icon: CurrencyInr,
    span: 'md:col-span-2',
    gradient: true,
    vehicle: '/dzire-cab.png',
  },
  {
    title: 'FASTag & Fuel Tracking',
    desc: 'Per-vehicle toll deductions, fuel log management, and expense categorization.',
    icon: GasPump,
    span: 'md:col-span-2',
    accent: true,
    vehicle: '/ambassador-taxi.png',
  },
  {
    title: 'Voice Onboarding',
    desc: 'Add vehicles by speaking. English and Hindi voice input for faster fleet onboarding.',
    icon: Microphone,
    span: '',
  },
];

export function FeaturesBento() {
  return (
    <section id="features" className="py-16 md:py-24 scroll-mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <GSAPReveal className="mb-16">
          <p className="text-xs font-medium text-accent uppercase tracking-[0.2em] mb-4">
            Features
          </p>
          <TextReveal
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground max-w-[600px]"
          >
            Everything your fleet needs
          </TextReveal>
        </GSAPReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <GSAPReveal
              key={f.title}
              delay={i * 0.06}
              className={`group relative rounded-2xl border border-border bg-surface overflow-hidden ${f.span} min-h-[220px] hover:border-accent/30 transition-all duration-500 shadow-card hover:shadow-lg`}
            >
              {f.accent && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/[0.06] rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              )}
              {f.gradient && (
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] via-transparent to-transparent pointer-events-none" />
              )}

              <div className="relative z-10 flex flex-col h-full p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted border border-accent/10 mb-5">
                  <f.icon size={22} weight="duotone" className="text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>

              {/* Vehicle image accent for wide cards */}
              {f.vehicle && (
                <div className="absolute bottom-2 right-4 w-[120px] sm:w-[180px] h-[70px] sm:h-[100px] opacity-[0.12] group-hover:opacity-[0.2] transition-opacity duration-500 pointer-events-none">
                  <Image
                    src={f.vehicle}
                    alt=""
                    width={180}
                    height={100}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </GSAPReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
