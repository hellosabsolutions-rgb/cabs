'use client';

import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle, SpinnerGap, PaperPlaneTilt, Phone, EnvelopeSimple, MapPin } from '@phosphor-icons/react';

const fleetSizes = [
  '1 - 10 vehicles',
  '11 - 50 vehicles',
  '51 - 200 vehicles',
  '200+ vehicles',
];

export function InquiryForm() {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    fleetSize: '',
    message: '',
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');

    const lines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      form.phone ? `Phone: ${form.phone}` : '',
      form.company ? `Company: ${form.company}` : '',
      form.fleetSize ? `Fleet size: ${form.fleetSize}` : '',
      form.message ? `Message: ${form.message}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      window.location.href = `mailto:sales@kabpro.in?subject=${encodeURIComponent(
        'KABPRO Demo Request'
      )}&body=${encodeURIComponent(lines)}`;
      setTimeout(() => setStatus('sent'), 600);
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <section id="inquiry" className="py-24 bg-surface scroll-mt-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-[500px] mx-auto px-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} weight="duotone" className="text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Thanks for reaching out!
          </h2>
          <p className="text-muted leading-relaxed">
            If your mail client opened, send the message and we&apos;ll reply within one working day. 
            You can also email us directly at <span className="text-accent">sales@kabpro.in</span>
          </p>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="inquiry" className="py-14 md:py-16 bg-surface relative scroll-mt-20 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left column - Info */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">
              Get Started
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Ready to streamline your fleet?
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-10">
              Tell us about your fleet and we&apos;ll show you how KABPRO can help. 
              Our team will walk you through billing, tracking, and compliance on your data.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <EnvelopeSimple size={24} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">Email us</p>
                  <a href="mailto:sales@kabpro.in" className="text-foreground font-medium hover:text-accent transition-colors">
                    sales@kabpro.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Phone size={24} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">Call us</p>
                  <a href="tel:+911145678900" className="text-foreground font-medium hover:text-accent transition-colors">
                    +91 11 4567 8900
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <MapPin size={24} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">Office</p>
                  <p className="text-foreground font-medium">
                    New Delhi, India
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column - Form */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-border p-6 md:p-8 shadow-xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Full name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Rajesh Sharma"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Work email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="rajesh@company.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    value={form.company}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Fleet Services Pvt Ltd"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label htmlFor="fleetSize" className="block text-sm font-medium text-foreground mb-2">
                  Fleet size
                </label>
                <select
                  id="fleetSize"
                  name="fleetSize"
                  value={form.fleetSize}
                  onChange={handleChange}
                  className="input-field appearance-none"
                >
                  <option value="">Select fleet size</option>
                  {fleetSizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  What would you like to know?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  className="input-field resize-none"
                  placeholder="Tell us about your fleet and what you'd like to see in the demo..."
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-600 mb-4" role="alert">
                  Could not open mail client. Please email us directly at sales@kabpro.in
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-all duration-200 active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-accent/25"
              >
                {status === 'sending' ? (
                  <>
                    <SpinnerGap size={20} className="animate-spin" />
                    Opening mail...
                  </>
                ) : (
                  <>
                    Request demo
                    <PaperPlaneTilt size={20} weight="bold" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
