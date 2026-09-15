'use client';

import dynamic from 'next/dynamic';

export const CarScene = dynamic(
  () => import('./CarScene').then((m) => m.CarScene),
  { 
    ssr: false, 
    loading: () => <div className="h-[400px] md:h-[500px] bg-bg" /> 
  }
);

export const CursorFollower = dynamic(
  () => import('./CursorFollower').then((m) => m.CursorFollower),
  { ssr: false }
);
