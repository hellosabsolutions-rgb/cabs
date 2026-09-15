'use client';

import { motion, useReducedMotion } from 'motion/react';
import {
  Car,
  Van,
  Taxi,
  Truck,
  Ambulance,
  Bus,
} from '@phosphor-icons/react';

const services = [
  {
    icon: Car,
    title: 'Sedan Fleet',
    description: 'Dzire, Etios, and compact sedans for city rides and airport transfers.',
    color: '#1687F5',
  },
  {
    icon: Van,
    title: 'MPV & SUV',
    description: 'Innova, Ertiga, and larger vehicles for family trips and corporate travel.',
    color: '#10B981',
  },
  {
    icon: Taxi,
    title: 'City Taxi',
    description: 'Traditional taxi operations with meter tracking and zone-based fares.',
    color: '#F59E0B',
  },
  {
    icon: Truck,
    title: 'Logistics',
    description: 'Tempo and mini-trucks for last-mile delivery and goods transport.',
    color: '#8B5CF6',
  },
  {
    icon: Bus,
    title: 'Staff Transport',
    description: 'Employee shuttle services with department-wise billing and rosters.',
    color: '#EC4899',
  },
  {
    icon: Ambulance,
    title: 'Specialized',
    description: 'Medical transport, school buses, and other niche fleet operations.',
    color: '#EF4444',
  },
];

export function ServiceTypes() {
  const reduce = useReducedMotion();

  return (
    <section className="py-12 md:py-16 bg-bg relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">
            Service Types
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            One platform, every fleet type
          </h2>
          <p className="text-muted text-lg max-w-[600px] mx-auto">
            KABPRO adapts to your business, whether you run city cabs, corporate shuttles, or logistics.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative bg-white rounded-2xl border border-border p-6 hover:border-accent/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
              data-cursor-hover
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${service.color}15` }}
              >
                <service.icon size={28} weight="duotone" style={{ color: service.color }} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {service.description}
              </p>
              
              {/* Hover indicator */}
              <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
