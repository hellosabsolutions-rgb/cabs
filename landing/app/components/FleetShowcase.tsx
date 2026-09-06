'use client';

import Image from 'next/image';
import { GSAPReveal } from './GSAPReveal';
import { TextReveal } from './TextReveal';

const vehicles = [
  {
    name: 'Maruti Suzuki Ertiga',
    type: 'MPV • Department Fleet',
    image: '/hero-car.png',
    stats: '7 seater • Diesel/CNG',
  },
  {
    name: 'Toyota Innova Crysta',
    type: 'MPV • Premium Fleet',
    image: '/innova-fleet.png',
    stats: '7 seater • Diesel',
  },
  {
    name: 'Maruti Suzuki Dzire',
    type: 'Sedan • Trip Cabs',
    image: '/dzire-cab.png',
    stats: '4 seater • Petrol/CNG',
  },
  {
    name: 'Ambassador Taxi',
    type: 'Sedan • City Taxi',
    image: '/ambassador-taxi.png',
    stats: 'Classic • Diesel',
  },
];

export function FleetShowcase() {
  return (
    <section className="py-16 md:py-24 bg-surface overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <GSAPReveal className="text-center mb-10 md:mb-16">
          <p className="text-xs font-medium text-accent uppercase tracking-[0.2em] mb-4">
            Fleet Vehicles
          </p>
          <TextReveal
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground mb-4"
          >
            Manage every vehicle type
          </TextReveal>
          <p className="text-muted text-base max-w-[480px] mx-auto">
            From sedans to MPVs, city taxis to premium fleet — KABPRO handles them all.
          </p>
        </GSAPReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.map((v, i) => (
            <GSAPReveal
              key={v.name}
              delay={i * 0.1}
              className="group relative rounded-2xl border border-border bg-bg overflow-hidden hover:border-accent/30 transition-all duration-500 shadow-card hover:shadow-lg"
            >
              <div className="relative h-[180px] flex items-center justify-center px-4 pt-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] to-transparent" />
                <Image
                  src={v.image}
                  alt={v.name}
                  width={320}
                  height={180}
                  className="w-full h-auto object-contain max-h-[160px] group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-5 pt-3 border-t border-border/50">
                <h3 className="text-sm font-semibold text-foreground mb-0.5">
                  {v.name}
                </h3>
                <p className="text-xs text-accent font-medium mb-2">{v.type}</p>
                <p className="text-[11px] text-faint">{v.stats}</p>
              </div>
            </GSAPReveal>
          ))}
        </div>

        {/* Auto-rickshaw accent */}
        <GSAPReveal delay={0.3} className="mt-10 md:mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-accent-muted/50 border border-accent/10 rounded-2xl px-5 sm:px-8 py-5 w-full sm:w-auto max-w-[520px]">
            <Image
              src="/auto-rickshaw.png"
              alt="Auto-rickshaw"
              width={120}
              height={80}
              className="h-14 sm:h-16 w-auto object-contain"
            />
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-foreground">
                Even auto-rickshaws & three-wheelers
              </p>
              <p className="text-xs text-muted mt-0.5">
                KABPRO supports every commercial vehicle category across India.
              </p>
            </div>
          </div>
        </GSAPReveal>
      </div>
    </section>
  );
}
