'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ArrowRight, Play } from '@phosphor-icons/react';

const ease = [0.16, 1, 0.3, 1] as const;

// Phone mockup component for hero section
function PhoneMockupHero({ 
  imageSrc, 
  alt, 
  delay = 0,
  className = '',
  variant = 'dark',
  isTrailing = false
}: { 
  imageSrc: string;
  alt: string;
  delay?: number;
  className?: string;
  variant?: 'dark' | 'light';
  isTrailing?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 60, scale: isTrailing ? 0.95 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease }}
      className={`relative ${className}`}
    >
      {/* Glass morphism phone frame */}
      <div 
        className={`relative w-[220px] sm:w-[260px] h-[460px] sm:h-[540px] rounded-[36px] sm:rounded-[44px] p-[8px] backdrop-blur-xl ${
          isTrailing ? 'shadow-xl' : 'shadow-2xl'
        }`}
        style={{ 
          background: isTrailing 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15))' 
            : 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.25))',
          border: '1px solid rgba(255,255,255,0.3)'
        }}
      >
        {/* Screen with subtle glass inner border */}
        <div 
          className="relative w-full h-full rounded-[30px] sm:rounded-[38px] overflow-hidden"
          style={{
            background: variant === 'dark' 
              ? 'linear-gradient(135deg, #0a0a0a, #1a1a1a)' 
              : 'linear-gradient(135deg, #f9fafb, #ffffff)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          <Image
            src={imageSrc}
            alt={alt}
            fill
            className="object-contain object-top"
            priority
            sizes="(max-width: 640px) 220px, 260px"
          />
        </div>
      </div>

      {/* Enhanced glow effect - stronger for front phone */}
      {!isTrailing && (
        <div 
          className="absolute -inset-6 rounded-[60px] blur-3xl -z-10 opacity-60"
          style={{ 
            background: 'radial-gradient(circle, rgba(22,135,245,0.5), rgba(96,165,250,0.35), rgba(147,197,253,0.2))'
          }}
        />
      )}
    </motion.div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    if (reduce || !headingRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        wordsRef.current,
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.08,
          ease: 'power3.out',
        }
      );
    }, headingRef);

    return () => ctx.revert();
  }, [reduce]);

  const headingWords = ['Fleet', 'management', 'that', 'actually', 'works.'];

  return (
    <section className="hero-mesh relative min-h-[100dvh] flex items-center pt-20 pb-12 px-4 sm:px-6 overflow-hidden">
      <div className="w-full max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-6 items-center">
          {/* Left content */}
          <div className="max-w-[650px]">
            {/* Badge */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Built for Indian fleet operators
              </span>
            </motion.div>

            {/* Main heading with GSAP word animation */}
            <h1
              ref={headingRef}
              className="text-[2.25rem] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.75rem] font-bold tracking-[-0.04em] leading-[1.1] text-foreground mb-6"
            >
              {headingWords.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
                  <span
                    ref={(el) => { if (el) wordsRef.current[i] = el; }}
                    className={`inline-block ${i === 3 ? 'text-accent' : ''}`}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            {/* Subheading */}
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease }}
              className="text-base sm:text-lg md:text-xl text-muted leading-relaxed max-w-[520px] mb-8"
            >
              Department billing, trip profitability, FASTag, fuel logs, and compliance alerts.
              All from one dashboard. No spreadsheets required.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              <a
                href="/#inquiry"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-accent text-white text-base font-semibold hover:bg-accent-hover transition-all duration-300 active:scale-[0.98] shadow-lg shadow-accent/25"
              >
                Get started free
                <ArrowRight
                  size={18}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </a>
              <a
                href="#platform"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-border bg-white/80 backdrop-blur-sm text-foreground text-base font-medium hover:bg-white hover:border-accent/30 transition-all duration-300 active:scale-[0.98]"
              >
                <Play size={18} weight="fill" className="text-accent" />
                Watch demo
              </a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-10 flex flex-wrap items-center gap-6"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center text-[10px] font-bold text-muted shadow-sm"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted">500+ fleets</span>
              </div>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-muted">4.9/5 rating</span>
              </div>
            </motion.div>
          </div>

          {/* Right content - Phone mockups with trailing effect */}
          <div className="hidden lg:flex items-center justify-center relative h-[600px] w-[500px]">
            {/* Home screen - Trailing/Background phone (behind) */}
            <PhoneMockupHero
              imageSrc="/app-home-dark.png"
              alt="KABPRO Driver App - Home Dashboard"
              delay={0.2}
              variant="dark"
              isTrailing={true}
              className="absolute left-0 top-0 z-10"
            />
            
            {/* Trip screen - Front/Primary phone (in front) */}
            <PhoneMockupHero
              imageSrc="/app-trip-dark.png"
              alt="KABPRO Driver App - Trip Tracking"
              delay={0.4}
              variant="dark"
              isTrailing={false}
              className="absolute right-0 top-12 z-20"
            />
          </div>
        </div>
      </div>

      {/* Mobile mockups for smaller screens */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease }}
        className="lg:hidden absolute bottom-28 right-2 sm:right-6 flex items-end"
      >
        {/* Home screen - trailing/back */}
        <div 
          className="relative w-[90px] sm:w-[110px] h-[190px] sm:h-[230px] rounded-[18px] sm:rounded-[22px] p-1 shadow-lg -mr-8 mb-6 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15))',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <div 
            className="relative w-full h-full rounded-[16px] sm:rounded-[20px] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)' }}
          >
            <Image
              src="/app-home-dark.png"
              alt="KABPRO Driver App - Home Dashboard"
              fill
              className="object-contain object-top"
            />
          </div>
        </div>
        {/* Trip screen - front */}
        <div 
          className="relative w-[100px] sm:w-[120px] h-[210px] sm:h-[250px] rounded-[20px] sm:rounded-[24px] p-1 shadow-xl z-10 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.25))',
            border: '1px solid rgba(255,255,255,0.3)'
          }}
        >
          <div 
            className="relative w-full h-full rounded-[18px] sm:rounded-[22px] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)' }}
          >
            <Image
              src="/app-trip-dark.png"
              alt="KABPRO Driver App - Trip Tracking"
              fill
              className="object-contain object-top"
            />
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-muted">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border-2 border-border bg-white/50 backdrop-blur-sm flex items-start justify-center p-1"
        >
          <div className="w-1 h-2 rounded-full bg-accent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
