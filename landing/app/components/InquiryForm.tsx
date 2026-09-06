'use client';

import { useState, type FormEvent } from 'react';
import { PaperPlaneTilt, CheckCircle, SpinnerGap } from '@phosphor-icons/react';
import { GSAPReveal } from './GSAPReveal';
import { TextReveal } from './TextReveal';

const fleetSizes = ['1 - 10 vehicles', '11 - 50 vehicles', '51 - 200 vehicles', '200+ vehicles'];

export function InquiryForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    fleetSize: '',
    message: '',
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => setStatus('sent'), 1500);
  }

  if (status === 'sent') {
    return (
      <section id="inquiry" className="py-24 bg-surface scroll-mt-20">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <CheckCircle size={56} weight="duotone" className="text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Thank you for reaching out
          </h2>
          <p className="text-muted">
            We received your inquiry and will get back to you within 24 hours.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="inquiry" className="py-16 md:py-24 bg-surface scroll-mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <GSAPReveal>
            <TextReveal
              as="h2"
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-foreground mb-4"
            >
              Get in touch
            </TextReveal>
            <p className="text-muted text-base leading-relaxed mb-8 max-w-[440px]">
              Have questions about KABPRO? Need a custom plan for your fleet?
              Fill out the form and our team will reach out within 24 hours.
            </p>

            <div className="flex flex-col gap-5">
              {[
                { label: 'Email', value: 'sales@kabpro.in' },
                { label: 'Phone', value: '+91 11 4567 8900' },
                { label: 'Office', value: 'Connaught Place, New Delhi 110001' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-faint uppercase tracking-wider mb-1">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </GSAPReveal>

          <GSAPReveal delay={0.1}>
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-bg p-5 sm:p-8 shadow-card"
              suppressHydrationWarning
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    placeholder="Rajesh Sharma"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    placeholder="rajesh@example.com"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    placeholder="+91 98765 43210"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    placeholder="Delhi Transport Services"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="fleetSize"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Fleet size
                </label>
                <select
                  id="fleetSize"
                  name="fleetSize"
                  value={form.fleetSize}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all appearance-none"
                  suppressHydrationWarning
                >
                  <option value="">Select fleet size</option>
                  {fleetSizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                  placeholder="Tell us about your fleet and requirements..."
                  suppressHydrationWarning
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-accent text-accent-text text-sm font-semibold hover:bg-accent-hover transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
              >
                {status === 'sending' ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Inquiry
                    <PaperPlaneTilt size={16} weight="bold" />
                  </>
                )}
              </button>
            </form>
          </GSAPReveal>
        </div>
      </div>
    </section>
  );
}
