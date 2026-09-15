'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Check, Star } from '@phosphor-icons/react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for small fleets getting started.',
    features: [
      'Up to 5 vehicles',
      '1 admin user',
      'Basic dashboard',
      'Trip logging',
      'Email support',
    ],
    cta: 'Start free',
    href: 'https://kabpro.pro',
    featured: false,
  },
  {
    name: 'Professional',
    price: '2,999',
    period: '/month',
    description: 'For growing fleets that need full visibility.',
    features: [
      'Up to 50 vehicles',
      '5 admin users',
      'Department billing & GST',
      'Live driver location',
      'FASTag & fuel tracking',
      'Trip profitability',
      'Compliance alerts',
      'Voice onboarding',
      'Priority support',
    ],
    cta: 'Start free trial',
    href: '/#inquiry',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large fleets with custom needs.',
    features: [
      'Unlimited vehicles & users',
      'Multi-agency support',
      'Custom integrations',
      'API access',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise option',
    ],
    cta: 'Contact sales',
    href: '/#inquiry',
    featured: false,
  },
];

export function Pricing() {
  const reduce = useReducedMotion();

  return (
    <section id="pricing" className="py-12 md:py-16 bg-surface relative scroll-mt-20 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted text-lg max-w-[500px] mx-auto">
            Start free and scale as your fleet grows. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col ${
                plan.featured
                  ? 'bg-foreground text-white border-2 border-accent md:scale-105 shadow-2xl'
                  : 'bg-white border border-border'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-white text-xs font-semibold">
                  <Star size={14} weight="fill" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-1 ${plan.featured ? 'text-white' : 'text-foreground'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.featured ? 'text-white/70' : 'text-muted'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                {plan.price !== 'Free' && plan.price !== 'Custom' && (
                  <span className={`text-sm ${plan.featured ? 'text-white/70' : 'text-muted'}`}>₹</span>
                )}
                <span className={`text-4xl font-bold tracking-tight ${plan.featured ? 'text-white' : 'text-foreground'}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-sm ${plan.featured ? 'text-white/70' : 'text-muted'}`}>
                    {plan.period}
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-3 text-sm ${
                      plan.featured ? 'text-white/90' : 'text-muted'
                    }`}
                  >
                    <Check
                      size={18}
                      weight="bold"
                      className={`shrink-0 mt-0.5 ${plan.featured ? 'text-accent' : 'text-accent'}`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`inline-flex items-center justify-center w-full py-3.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                  plan.featured
                    ? 'bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/30'
                    : 'border border-border text-foreground hover:bg-surface-bright hover:border-accent'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
