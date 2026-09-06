'use client';

import { motion, useScroll, useReducedMotion } from 'motion/react';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();

  if (reduce) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-accent origin-left z-[60]"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
