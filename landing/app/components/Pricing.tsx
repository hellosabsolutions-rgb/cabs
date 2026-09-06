'use client';

import { Check } from '@phosphor-icons/react';
import { GSAPReveal } from './GSAPReveal';
import { TextReveal } from './TextReveal';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    desc: 'For small fleet operators getting started.',
    features: [
      'Up to 5 vehicles',
      '1 admin user',
      'Basic dashboard',
      'Trip logging',
      'Email support',
    ],
    cta: 'Start Free',
    featured: false,
  },
  {
    name: 'Professional',
    price: '2,999',
    period: '/month',
    desc: 'For growing fleets that need full visibility.',
    features: [
      'Up to 50 vehicles',
      '5 admin users',
      'Department billing & GST',
      'Live driver location',
      'Realtime revenue',
      'FASTag & fuel tracking',
      'Compliance alerts',
      'Trip profitability',
      'Voice onboarding',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large fleets with custom requirements.',
    features: [
      'Unlimited vehicles',
      'Unlimited users',
      'Live driver location',
      'Realtime revenue',
      'Multi-agency support',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise option',
      'Custom training',
    ],
    cta: 'Contact Sales',
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-surface scroll-mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <GSAPReveal className="text-center mb-10 md:mb-16">
          <p className="text-xs font-medium text-accent uppercase tracking-[0.2em] mb-4">
            Pricing
          </p>
          <TextReveal
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground mb-4"
          >
            Simple, transparent pricing
          </TextReveal>
          <p className="text-muted text-base max-w-[480px] mx-auto">
            Start free. Scale as your fleet grows. No hidden fees.
          </p>
        </GSAPReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] mx-auto items-start">
          {plans.map((plan, i) => (
            <GSAPReveal
              key={plan.name}
              delay={i * 0.1}
              className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col ${
                plan.featured
                  ? 'border-accent bg-bg shadow-[0_0_40px_rgba(var(--theme-accent-rgb),0.1)] md:scale-[1.02]'
                  : 'border-border bg-bg shadow-card'
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-accent-text text-xs font-semibold">
                  Most Popular
                </span>
              )}

              <h3 className="text-lg font-semibold text-foreground mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-muted mb-5">{plan.desc}</p>

              <div className="flex items-baseline gap-1 mb-6">
                {plan.price !== 'Free' && plan.price !== 'Custom' && (
                  <span className="text-sm text-muted">&#8377;</span>
                )}
                <span className="text-4xl font-bold text-foreground tracking-tight">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-muted">{plan.period}</span>
                )}
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-muted"
                  >
                    <Check
                      size={16}
                      weight="bold"
                      className="text-accent shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#cta"
                className={`inline-flex items-center justify-center w-full py-3 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                  plan.featured
                    ? 'bg-accent text-accent-text hover:bg-accent-hover'
                    : 'border border-border text-foreground hover:bg-surface-elevated'
                }`}
              >
                {plan.cta}
              </a>
            </GSAPReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
