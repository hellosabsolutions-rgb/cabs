'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'motion/react';
import { gsap } from 'gsap';

const stats = [
  { value: 9000000, suffix: '+', label: 'Trips processed monthly', prefix: '' },
  { value: 500, suffix: '+', label: 'Fleet operators', prefix: '' },
  { value: 15000, suffix: '+', label: 'Vehicles tracked', prefix: '' },
  { value: 99.9, suffix: '%', label: 'Uptime guaranteed', prefix: '' },
];

function AnimatedNumber({ value, suffix, prefix, inView }: { 
  value: number; 
  suffix: string; 
  prefix: string;
  inView: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    
    if (reduce) {
      setDisplayValue(value);
      return;
    }

    const duration = 2;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(eased * value * 10) / 10);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [inView, value, reduce]);

  const formatValue = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
    }
    return num.toFixed(value % 1 !== 0 ? 1 : 0);
  };

  return (
    <span>
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
}

export function StatsSection() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section ref={ref} className="py-12 md:py-16 bg-foreground text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Trusted at scale
          </h2>
          <p className="text-white/60 text-lg max-w-[500px] mx-auto">
            Join hundreds of fleet operators who rely on KABPRO every day.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-accent mb-3 font-mono">
                <AnimatedNumber
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  inView={isInView}
                />
              </div>
              <p className="text-sm text-white/60">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
