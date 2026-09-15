'use client';

import Image from 'next/image';
import { Reveal } from './Reveal';

export function Operations() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <Reveal className="mb-10 md:mb-14 max-w-[36rem]">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Built for how Indian fleets actually run
          </h2>
          <p className="mt-3 text-muted text-[15px] leading-relaxed max-w-[52ch]">
            Department contracts and trip cabs need different books. KABPRO keeps both on the same desk.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <Reveal className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="h-[200px] sm:h-[240px] bg-surface-bright flex items-center justify-center px-8">
              <Image
                src="/innova-fleet.png"
                alt="Toyota Innova Crysta used on department contracts"
                width={420}
                height={240}
                className="w-full h-auto max-h-[190px] object-contain"
              />
            </div>
            <div className="p-6 sm:p-7">
              <h3 className="text-lg font-semibold text-foreground">
                Department contracts
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed max-w-[48ch]">
                Duty logs, extra km, extra hours, and monthly GST invoices. Payments against NEFT, RTGS, cheque, or treasury challan.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="h-[200px] sm:h-[240px] bg-surface-bright flex items-center justify-center px-8">
              <Image
                src="/dzire-cab.png"
                alt="Maruti Suzuki Dzire used for trip cab work"
                width={420}
                height={240}
                className="w-full h-auto max-h-[190px] object-contain"
              />
            </div>
            <div className="p-6 sm:p-7">
              <h3 className="text-lg font-semibold text-foreground">
                Trip operations
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed max-w-[48ch]">
                Close a trip and see profit after fuel, FASTag, and driver bata. Outstation and local runs on the same ledger.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
