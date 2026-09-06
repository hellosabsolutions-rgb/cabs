'use client';

import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import {
  ChartLineUp,
  Bell,
  CheckCircle,
  Timer,
  Truck,
  GasPump,
} from '@phosphor-icons/react';

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-[100dvh] md:h-[100dvh] md:max-h-[100dvh] flex items-stretch md:items-center pt-16 pb-3 px-3 sm:px-4 md:px-6 overflow-hidden bg-bg">
      <div className="relative w-full max-w-[1440px] mx-auto min-h-[calc(100dvh-5.5rem)] md:h-full md:max-h-[860px] hero-mesh rounded-[20px] md:rounded-[28px] border border-[#EBEBEB] shadow-[0_1px_40px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="relative min-h-full md:h-full flex flex-col px-4 sm:px-6 md:px-10 lg:px-14 pt-8 sm:pt-10 md:pt-12 pb-5">
          <div className="flex flex-col items-center text-center relative z-20 shrink-0">
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease }}
              className="mb-4 md:mb-5"
            >
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm border border-[#E7E7E7] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                  <circle cx="5" cy="5" r="2.5" fill="#26B8D8" />
                  <circle cx="11" cy="5" r="2.5" fill="#0B0B0B" />
                  <circle cx="5" cy="11" r="2.5" fill="#0B0B0B" />
                  <circle cx="11" cy="11" r="2.5" fill="#0B0B0B" />
                </svg>
              </div>
            </motion.div>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
              className="text-[1.85rem] sm:text-[2.25rem] md:text-[3.25rem] lg:text-[3.75rem] font-bold tracking-[-0.03em] leading-[1.1] text-[#0B0B0B] mb-2.5 md:mb-3"
            >
              Manage your fleet
              <br />
              <span className="text-[#A5A5A5]">all in one place</span>
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="text-[13px] sm:text-[15px] text-[#333] leading-relaxed max-w-[320px] sm:max-w-[400px] mb-5 md:mb-6 px-2"
            >
              Efficiently manage your fleet operations and boost productivity.
            </motion.p>

            <motion.a
              href="#cta"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className="relative z-30 inline-flex items-center justify-center w-full max-w-[240px] sm:max-w-none sm:w-auto px-8 py-3.5 rounded-full bg-[#1687F5] text-white font-semibold text-[15px] hover:bg-[#1270D6] transition-all duration-200 active:scale-[0.97] shadow-[0_4px_20px_rgba(22,135,245,0.25)]"
            >
              Get free demo
            </motion.a>
          </div>

          <div className="relative flex-1 min-h-[200px] mt-5 md:mt-6 flex flex-col items-center justify-end">
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 120 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.1, delay: 0.35, ease: [0.25, 1, 0.3, 1] }}
              className="relative w-[92%] max-w-[360px] md:w-[72%] md:max-w-[520px] pointer-events-none"
            >
              <Image
                src="/hero-car.png"
                alt="Fleet vehicle — Maruti Suzuki Ertiga"
                width={520}
                height={295}
                priority
                className="w-full h-auto drop-shadow-[0_18px_36px_rgba(11,11,11,0.12)]"
              />
            </motion.div>

            {/* Mobile stats — compact chips instead of floating cards */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease }}
              className="grid grid-cols-2 gap-2 w-full mt-4 md:hidden"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[#EBEBEB] px-3 py-2.5 shadow-card">
                <p className="text-[10px] text-[#A5A5A5] mb-0.5">Active vehicles</p>
                <p className="text-sm font-bold text-[#0B0B0B]">37 running</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[#EBEBEB] px-3 py-2.5 shadow-card">
                <p className="text-[10px] text-[#A5A5A5] mb-0.5">Revenue</p>
                <p className="text-sm font-bold text-[#0B0B0B]">₹8.4L <span className="text-[10px] font-semibold text-[#1687F5]">+12%</span></p>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease }}
              className="absolute top-2 left-0 hidden md:block z-10"
              style={{ animation: reduce ? undefined : 'float-slow 8s ease-in-out infinite' }}
            >
              <div className="relative">
                <div className="bg-[#FFF36A] rounded-lg p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-[168px] rotate-[-3deg]">
                  <div className="w-4 h-1 bg-[#F15B4A] rounded-full mb-2 mx-auto" />
                  <p className="text-[11px] text-[#333] leading-[1.55]">
                    Track fleet, manage billing, and stay compliant with ease.
                  </p>
                </div>
                <div className="absolute -bottom-4 -right-3 w-10 h-10 rounded-xl bg-[#1687F5] flex items-center justify-center shadow-lg">
                  <CheckCircle size={20} weight="fill" className="text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease }}
              className="absolute top-0 right-0 hidden md:block z-10"
              style={{ animation: reduce ? undefined : 'float 7s ease-in-out infinite 1s' }}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#EBEBEB] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] w-[200px]">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#F7F7F7] border border-[#E7E7E7] flex items-center justify-center">
                    <Timer size={16} weight="fill" className="text-[#0B0B0B]" />
                  </div>
                  <span className="text-[13px] font-bold text-[#0B0B0B]">Reminders</span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[11px] font-semibold text-[#0B0B0B]">Insurance Renewal</p>
                    <p className="text-[10px] text-[#A5A5A5]">DL 1S 1234 · Expiring soon</p>
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F15B4A]/10 text-[#F15B4A] text-[9px] font-semibold">
                      <Bell size={8} weight="fill" /> 3 days left
                    </div>
                  </div>
                  <div className="h-px bg-[#F0F0F0]" />
                  <div>
                    <p className="text-[11px] font-semibold text-[#0B0B0B]">PUC Certificate</p>
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1687F5]/10 text-[#1687F5] text-[9px] font-semibold">
                      <Timer size={8} weight="fill" /> 12 days
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease }}
              className="absolute bottom-3 left-0 hidden md:block z-10"
              style={{ animation: reduce ? undefined : 'float-reverse 6s ease-in-out infinite' }}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#EBEBEB] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] w-[214px]">
                <p className="text-[13px] font-bold text-[#0B0B0B] mb-3">Today&apos;s fleet</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#1687F5]/10 flex items-center justify-center shrink-0">
                      <Truck size={14} weight="fill" className="text-[#1687F5]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-[#A5A5A5] mb-1">Active vehicles</p>
                      <div className="h-[5px] bg-[#F0F0F0] rounded-full">
                        <div className="h-full w-[78%] bg-[#1687F5] rounded-full" />
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-[#0B0B0B]">37</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#F15B4A]/10 flex items-center justify-center shrink-0">
                      <GasPump size={14} weight="fill" className="text-[#F15B4A]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-[#A5A5A5] mb-1">Fuel logged</p>
                      <div className="h-[5px] bg-[#F0F0F0] rounded-full">
                        <div className="h-full w-[62%] bg-[#F15B4A] rounded-full" />
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-[#0B0B0B]">112L</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease }}
              className="absolute bottom-3 right-0 hidden md:block z-10"
              style={{ animation: reduce ? undefined : 'float 6s ease-in-out infinite 0.5s' }}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#EBEBEB] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] w-[176px]">
                <div className="flex items-center gap-2 mb-2">
                  <ChartLineUp size={16} weight="bold" className="text-[#1687F5]" />
                  <span className="text-[13px] font-bold text-[#0B0B0B]">Revenue</span>
                </div>
                <p className="text-[28px] font-bold text-[#0B0B0B] tracking-tight leading-none mb-1">
                  ₹8.4L
                </p>
                <p className="text-[11px] text-[#1687F5] font-semibold">+12.3% this month</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
