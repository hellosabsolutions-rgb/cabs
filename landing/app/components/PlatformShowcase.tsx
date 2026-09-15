'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DashboardPreview } from './DashboardPreview';
import {
  DeviceMobile,
  Truck,
  ChartLineUp,
  Users,
} from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

const platforms = [
  {
    id: 'driver',
    icon: Truck,
    title: 'Driver App',
    subtitle: 'For your drivers',
    description: 'A powerful mobile app that helps drivers manage their daily duties, accept trips, track earnings, and log expenses. Works offline in areas with poor connectivity.',
    color: '#1687F5',
  },
  {
    id: 'trips',
    icon: DeviceMobile,
    title: 'Trip Tracking',
    subtitle: 'Real-time navigation',
    description: 'Real-time GPS tracking, Google Maps navigation, trip progress, and customer details all in one screen. Drivers never miss a turn.',
    color: '#10B981',
  },
  {
    id: 'dashboard',
    icon: ChartLineUp,
    title: 'Admin Dashboard',
    subtitle: 'For fleet managers',
    description: 'The command center for your fleet. Monitor vehicles, manage billing, track compliance, and make data-driven decisions with detailed analytics.',
    color: '#F59E0B',
  },
  {
    id: 'operators',
    icon: Users,
    title: 'Multi-Agency',
    subtitle: 'For enterprise',
    description: 'Run multiple agencies under one account. Separate vehicles, contracts, and billing while maintaining a unified view of your entire operation.',
    color: '#8B5CF6',
  },
];

// Real phone mockup with screenshot
function RealPhoneMockup({ 
  darkImage, 
  lightImage, 
  darkAlt, 
  lightAlt,
  delay = 0 
}: { 
  darkImage: string;
  lightImage: string;
  darkAlt: string;
  lightAlt: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="flex items-end justify-center gap-4 relative">
      {/* Dark mode phone (front) */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40, x: -20 }}
        whileInView={{ opacity: 1, y: 0, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20"
      >
        <div className="relative w-[200px] sm:w-[240px] h-[420px] sm:h-[500px] bg-[#1a1a1a] rounded-[32px] sm:rounded-[40px] p-[5px] shadow-2xl">
          <div className="relative w-full h-full bg-black rounded-[28px] sm:rounded-[36px] overflow-hidden">
            <Image
              src={darkImage}
              alt={darkAlt}
              fill
              className="object-contain object-top"
              sizes="(max-width: 640px) 200px, 240px"
            />
          </div>
        </div>
        {/* Glow */}
        <div className="absolute -inset-4 bg-accent/15 rounded-[50px] blur-2xl -z-10" />
      </motion.div>

      {/* Light mode phone (behind) */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40, x: 20 }}
        whileInView={{ opacity: 1, y: 0, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, delay: delay + 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="-ml-16 mb-8 z-10"
      >
        <div className="relative w-[200px] sm:w-[240px] h-[420px] sm:h-[500px] bg-[#e8e8e8] rounded-[32px] sm:rounded-[40px] p-[5px] shadow-xl">
          <div className="relative w-full h-full bg-white rounded-[28px] sm:rounded-[36px] overflow-hidden">
            <Image
              src={lightImage}
              alt={lightAlt}
              fill
              className="object-contain object-top"
              sizes="(max-width: 640px) 200px, 240px"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PlatformShowcase() {
  const [activeTab, setActiveTab] = useState('driver');
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || !headingRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={sectionRef} className="py-12 md:py-16 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div ref={headingRef} className="text-center mb-16 md:mb-24">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4"
          >
            The KABPRO Platform
          </motion.p>
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6"
          >
            Everything your fleet needs.
            <br />
            <span className="text-muted">In one platform.</span>
          </motion.h2>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted max-w-[600px] mx-auto"
          >
            Driver apps, trip tracking, admin dashboard, and multi-agency support.
            Built for how Indian fleets actually operate.
          </motion.p>
        </div>

        {/* Platform tabs */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-12 md:mb-16"
        >
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setActiveTab(platform.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === platform.id
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : 'bg-white border border-border text-muted hover:text-foreground hover:border-accent/30'
              }`}
            >
              <platform.icon size={18} weight={activeTab === platform.id ? 'fill' : 'regular'} />
              {platform.title}
            </button>
          ))}
        </motion.div>

        {/* Content area */}
        <div className="relative min-h-[600px]">
          {/* Driver App */}
          {activeTab === 'driver' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="order-2 lg:order-1 flex justify-center">
                <RealPhoneMockup
                  darkImage="/app-screenshot-dark.png"
                  lightImage="/app-screenshot-light.png"
                  darkAlt="KABPRO Driver App - Dark Mode Dashboard"
                  lightAlt="KABPRO Driver App - Light Mode Dashboard"
                  delay={0.2}
                />
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Empower your drivers
                </h3>
                <p className="text-muted mb-6 leading-relaxed">
                  {platforms[0].description}
                </p>
                <ul className="space-y-3">
                  {[
                    'Start/end duty with one tap',
                    'View assigned vehicle & booking info',
                    'Track wallet balance & FASTag',
                    'Log fuel, expenses & advances',
                    'Quick access to bookings & digital ID',
                  ].map((feature, i) => (
                    <motion.li
                      key={feature}
                      initial={reduce ? false : { opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-3 text-sm text-muted"
                    >
                      <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* Trip Tracking */}
          {activeTab === 'trips' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="order-2 lg:order-1 flex justify-center">
                <RealPhoneMockup
                  darkImage="/app-screenshot-trip-dark.png"
                  lightImage="/app-screenshot-trip-light.png"
                  darkAlt="KABPRO Trip Tracking - Dark Mode"
                  lightAlt="KABPRO Trip Tracking - Light Mode"
                  delay={0.2}
                />
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Real-time trip tracking
                </h3>
                <p className="text-muted mb-6 leading-relaxed">
                  {platforms[1].description}
                </p>
                <ul className="space-y-3">
                  {[
                    'Live map with Google Maps integration',
                    'Pickup & drop-off locations',
                    'Customer details & rating',
                    'One-tap navigation start',
                    'Complete trip & enter odometer',
                  ].map((feature, i) => (
                    <motion.li
                      key={feature}
                      initial={reduce ? false : { opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-3 text-sm text-muted"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-10">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Your fleet command center
                </h3>
                <p className="text-muted max-w-[600px] mx-auto leading-relaxed">
                  {platforms[2].description}
                </p>
              </div>
              <DashboardPreview delay={0.2} />
            </motion.div>
          )}

          {/* Multi-Agency */}
          {activeTab === 'operators' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                {
                  title: 'Agency A',
                  vehicles: 24,
                  drivers: 28,
                  revenue: '₹4.2L',
                  location: 'Delhi NCR',
                },
                {
                  title: 'Agency B',
                  vehicles: 18,
                  drivers: 22,
                  revenue: '₹3.1L',
                  location: 'Mumbai',
                },
                {
                  title: 'Agency C',
                  vehicles: 12,
                  drivers: 15,
                  revenue: '₹1.8L',
                  location: 'Bangalore',
                },
              ].map((agency, i) => (
                <motion.div
                  key={agency.title}
                  initial={reduce ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg hover:border-accent/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-foreground">{agency.title}</h4>
                    <span className="text-xs text-muted bg-surface-bright px-2 py-1 rounded">{agency.location}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{agency.vehicles}</p>
                      <p className="text-xs text-muted">Vehicles</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{agency.drivers}</p>
                      <p className="text-xs text-muted">Drivers</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-2xl font-bold text-accent">{agency.revenue}</p>
                      <p className="text-xs text-muted">Monthly Revenue</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
