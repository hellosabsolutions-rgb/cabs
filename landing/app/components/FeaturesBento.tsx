'use client';

import { useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Receipt,
  MapPin,
  CurrencyInr,
  GasPump,
  ShieldCheck,
  Microphone,
  ChartLineUp,
  Bell,
} from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Receipt,
    title: 'GST Billing',
    description: 'Auto-generate monthly invoices with duty logs, extra km, and extra hours calculated.',
    color: '#1687F5',
    span: 'md:col-span-2',
  },
  {
    icon: MapPin,
    title: 'Live Tracking',
    description: 'Real-time GPS location, speed, and ignition status for every vehicle.',
    color: '#10B981',
  },
  {
    icon: CurrencyInr,
    title: 'Trip Profit',
    description: 'See exact margins after fuel, FASTag, and driver bata on every trip.',
    color: '#F59E0B',
  },
  {
    icon: GasPump,
    title: 'FASTag & Fuel',
    description: 'Track toll deductions and fuel consumption per vehicle, per trip.',
    color: '#8B5CF6',
    span: 'md:col-span-2',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Alerts',
    description: 'Never miss RC, insurance, PUC, or permit renewals again.',
    color: '#EF4444',
  },
  {
    icon: Microphone,
    title: 'Voice Input',
    description: 'Add vehicles and log data by speaking in English or Hindi.',
    color: '#EC4899',
  },
  {
    icon: ChartLineUp,
    title: 'Analytics',
    description: 'Revenue trends, expense breakdowns, and profitability reports.',
    color: '#06B6D4',
    span: 'md:col-span-2',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get notified about maintenance, payments, and compliance deadlines.',
    color: '#F97316',
  },
];

export function FeaturesBento() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduce || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            delay: i * 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={sectionRef} id="features" className="py-12 md:py-16 bg-surface relative scroll-mt-20 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Everything you need to run your fleet
          </h2>
          <p className="text-muted text-lg max-w-[600px] mx-auto">
            From billing to compliance, KABPRO handles the operations so you can focus on growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              ref={(el) => { cardsRef.current[i] = el; }}
              className={`group relative bg-white rounded-2xl border border-border p-6 hover:border-accent/30 hover:shadow-xl transition-all duration-300 ${
                feature.span ?? ''
              }`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${feature.color}12` }}
              >
                <feature.icon size={24} weight="duotone" style={{ color: feature.color }} />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors duration-200">
                {feature.title}
              </h3>
              
              <p className="text-sm text-muted leading-relaxed">
                {feature.description}
              </p>

              {/* Hover gradient */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at top right, ${feature.color}08, transparent 70%)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
