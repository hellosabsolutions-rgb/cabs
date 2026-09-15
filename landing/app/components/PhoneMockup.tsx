'use client';

import { motion, useReducedMotion } from 'motion/react';

interface PhoneMockupProps {
  title: string;
  screens: {
    header?: string;
    items: Array<{
      icon?: string;
      label: string;
      value?: string;
      accent?: boolean;
      status?: 'success' | 'warning' | 'info';
    }>;
  };
  variant?: 'driver' | 'customer';
  delay?: number;
}

export function PhoneMockup({ title, screens, variant = 'driver', delay = 0 }: PhoneMockupProps) {
  const reduce = useReducedMotion();

  const statusColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-accent',
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Phone frame */}
      <div className="relative w-[280px] h-[580px] bg-[#1a1a1a] rounded-[44px] p-3 shadow-2xl">
        {/* Screen bezel */}
        <div className="relative w-full h-full bg-white rounded-[36px] overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-white">
            <span className="text-[11px] font-semibold text-foreground">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-foreground/40 rounded-sm">
                <div className="w-3/4 h-full bg-foreground/60 rounded-sm" />
              </div>
            </div>
          </div>

          {/* Dynamic Island / Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1a1a1a] rounded-full" />

          {/* App content */}
          <div className="px-4 pt-2 pb-6">
            {/* App header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider">KABPRO</p>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
              </div>
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-accent" />
              </div>
            </div>

            {screens.header && (
              <p className="text-xs text-muted mb-4">{screens.header}</p>
            )}

            {/* Content cards */}
            <div className="space-y-3">
              {screens.items.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={reduce ? false : { opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: delay + 0.1 + i * 0.08 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    item.accent
                      ? 'bg-accent/5 border-accent/20'
                      : 'bg-surface-bright border-border'
                  }`}
                >
                  {item.icon && (
                    <span className="text-lg">{item.icon}</span>
                  )}
                  {item.status && (
                    <div className={`w-2 h-2 rounded-full ${statusColors[item.status]}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.label}
                    </p>
                    {item.value && (
                      <p className="text-[10px] text-muted">{item.value}</p>
                    )}
                  </div>
                  {item.accent && (
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Bottom action button */}
            {variant === 'driver' && (
              <motion.button
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: delay + 0.5 }}
                className="w-full mt-6 py-3 rounded-xl bg-accent text-white text-sm font-semibold"
              >
                Start Duty
              </motion.button>
            )}

            {variant === 'customer' && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: delay + 0.5 }}
                className="mt-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-700">Driver arriving in 4 min</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute -inset-4 bg-accent/10 rounded-[60px] blur-3xl -z-10 opacity-50" />
    </motion.div>
  );
}
