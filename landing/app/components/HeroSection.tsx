'use client';

import dynamic from 'next/dynamic';
import { Hero } from './Hero';

const HeroBackground = dynamic(
  () => import('./HeroBackground').then((m) => m.HeroBackground),
  { ssr: false }
);

export function HeroSection() {
  return (
    <div className="relative">
      <HeroBackground />
      <Hero />
    </div>
  );
}
