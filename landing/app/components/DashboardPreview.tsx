'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { label: 'Revenue', value: '₹8.4L', change: '+12.3%', color: '#1687F5' },
  { label: 'Active Vehicles', value: '47', change: '+3', color: '#26B8D8' },
  { label: 'Trips Today', value: '156', change: '+24', color: '#10B981' },
  { label: 'Compliance', value: '98%', change: '', color: '#F59E0B' },
];

const chartData = [35, 45, 38, 52, 48, 62, 55, 72, 68, 78, 74, 85];

const vehicles = [
  { reg: 'DL 1S 1234', driver: 'Rahul Sharma', status: 'Running', location: 'Connaught Place' },
  { reg: 'KA 02 5678', driver: 'Suresh Kumar', status: 'Idle', location: 'MG Road' },
  { reg: 'MH 04 9012', driver: 'Vikram Singh', status: 'Running', location: 'Andheri' },
];

export function DashboardPreview({ delay = 0 }: { delay?: number }) {
  const reduce = useReducedMotion();
  const chartRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduce || !chartRef.current) return;

    const ctx = gsap.context(() => {
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        gsap.fromTo(
          bar,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 0.6,
            delay: i * 0.05,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: chartRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, chartRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 60, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Browser frame */}
      <div className="bg-[#1a1a1a] rounded-2xl p-2 shadow-2xl max-w-[900px] mx-auto">
        {/* Browser header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-[11px] text-white/50">kabpro.pro/dashboard</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">AD</span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="bg-bg rounded-b-xl overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-48 border-r border-border bg-surface p-4 hidden md:block">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L14.5 5v6L8 15 1.5 11V5L8 1z" fill="white" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-foreground">KABPRO</span>
              </div>
              
              {['Dashboard', 'Vehicles', 'Drivers', 'Trips', 'Billing', 'Reports'].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-1 ${
                    i === 0
                      ? 'bg-accent text-white font-medium'
                      : 'text-muted hover:bg-surface-bright'
                  }`}
                >
                  <div className={`w-4 h-4 rounded ${i === 0 ? 'bg-white/20' : 'bg-border'}`} />
                  {item}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-4 md:p-6 min-h-[400px]">
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={reduce ? false : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: delay + 0.2 + i * 0.1 }}
                    className="bg-surface rounded-xl border border-border p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted uppercase tracking-wider">{stat.label}</span>
                      {stat.change && (
                        <span className="text-[10px] font-medium" style={{ color: stat.color }}>
                          {stat.change}
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${60 + i * 10}%`, backgroundColor: stat.color }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chart */}
              <div ref={chartRef} className="bg-surface rounded-xl border border-border p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Revenue Overview</h3>
                  <div className="flex gap-2">
                    {['1W', '1M', '3M'].map((p, i) => (
                      <span
                        key={p}
                        className={`text-[10px] px-2 py-1 rounded ${
                          i === 1 ? 'bg-accent text-white' : 'text-muted'
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {chartData.map((h, i) => (
                    <div
                      key={i}
                      ref={(el) => { barsRef.current[i] = el; }}
                      className="flex-1 rounded-t origin-bottom"
                      style={{
                        height: `${h}%`,
                        background: i === chartData.length - 1
                          ? '#1687F5'
                          : 'linear-gradient(to top, #1687F5, #26B8D8)',
                        opacity: i === chartData.length - 1 ? 1 : 0.7,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Vehicle table */}
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Active Vehicles</h3>
                  <span className="text-[10px] text-accent">View all</span>
                </div>
                <div className="divide-y divide-border">
                  {vehicles.map((v, i) => (
                    <motion.div
                      key={v.reg}
                      initial={reduce ? false : { opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: delay + 0.5 + i * 0.1 }}
                      className="flex items-center gap-4 px-4 py-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-bright flex items-center justify-center">
                        <span className="text-[10px]">🚗</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{v.reg}</p>
                        <p className="text-[10px] text-muted">{v.driver}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            v.status === 'Running' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-[10px] text-muted">{v.status}</span>
                        </div>
                        <p className="text-[10px] text-muted">{v.location}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute -inset-8 bg-accent/5 rounded-3xl blur-3xl -z-10" />
    </motion.div>
  );
}
