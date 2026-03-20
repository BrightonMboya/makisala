'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Check, ChevronDown } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const highlights = [
  'No setup fees',
  'Unlimited proposals',
  'Shared workspace',
  'Dedicated support',
  'Free onboarding',
];

const trustedLogos = [
  { name: 'Nomad Tanzania', src: '/logos/nomad.svg', width: 128 },
  { name: 'Lemala Camps & Lodges', src: '/logos/lemala.svg', width: 156, invertOnLight: true },
  { name: 'Asilia Africa', src: '/logos/asilia.svg', width: 132 },
  { name: 'Elewana Collection', src: '/logos/elewana.png', width: 136, invertOnLight: true },
];

const plans = [
  {
    name: 'Starter',
    price: 49,
    subtitle: 'For small agencies that need PDF exports and more proposals.',
    features: [
      '5 active proposals',
      'Content library',
      'PDF export',
      'Minimalistic theme',
    ],
    cta: 'Get started',
    href: '/sign-up',
    popular: false,
  },
  {
    name: 'Business',
    price: 249,
    subtitle: 'For established agencies that need custom domains and unlimited seats.',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Custom domains',
      'Priority support',
    ],
    cta: 'Get started',
    href: '/sign-up',
    popular: true,
  },
  {
    name: 'Pro',
    price: 99,
    subtitle: 'For growing agencies with teams, custom images, and all themes.',
    features: [
      'Unlimited proposals',
      'All 4 themes',
      'Own image uploads',
      '3 team members',
      'Comments',
      'No watermark',
    ],
    cta: 'Get started',
    href: '/sign-up',
    popular: false,
  },
];

const faqs = [
  {
    question: 'How does pricing work?',
    answer:
      'Our pricing is based on the plan you choose and the size of your team. We offer flexible plans that grow with your business, so you only pay for what you need.',
  },
  {
    question: 'Can I switch plans later?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes. Every new account starts with a 14-day free trial on the Growth plan, no credit card required.',
  },
  {
    question: 'What happens when my trial ends?',
    answer:
      'You can choose a plan that fits your needs, or your account will move to the Starter plan automatically. No data is lost.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer:
      'Yes, annual billing comes with a 20% discount compared to monthly billing on all plans.',
  },
  {
    question: 'How does onboarding work?',
    answer:
      'Our team will walk you through setting up your account, importing your content, and configuring your brand. We handle the heavy lifting so your team can start sending proposals right away.',
  },
  {
    question: 'Can I add more team members later?',
    answer:
      'Absolutely. On the Growth and Enterprise plans, you can add unlimited team members at any time.',
  },
];


function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border-b"
      style={{ borderColor: 'rgba(38,27,7,0.08)' }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span
          style={{
            fontSize: '18px',
            lineHeight: '24px',
            color: '#261B07',
            fontWeight: 580,
          }}
        >
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChevronDown
            className="h-5 w-5 shrink-0"
            style={{ color: 'rgba(38,27,7,0.4)' }}
          />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p
              style={{
                fontSize: '16px',
                lineHeight: '26px',
                color: 'rgba(38,27,7,0.7)',
                fontWeight: 400,
                paddingBottom: '20px',
              }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div style={{ backgroundColor: '#F8F7F5', color: '#261B07' }}>
      <Navbar />

      <main>
        {/* Hero */}
        <section
          className="flex flex-col items-center px-6 pt-16 pb-12 md:pt-24 md:pb-16 lg:px-28"
        >
          <motion.h1
            {...fadeUp}
            className="text-center"
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              letterSpacing: '-2.5px',
              lineHeight: '1.1',
              color: '#261B07',
              fontWeight: 580,
              maxWidth: '800px',
            }}
          >
            Flexible pricing for teams of all sizes
          </motion.h1>
        </section>

        {/* Highlights pills */}
        <motion.div
          {...fadeUp}
          className="flex flex-wrap items-center justify-center px-6 pb-12 md:pb-16"
          style={{ gap: '10px' }}
        >
          {highlights.map((label, i) => (
            <span
              key={i}
              className="rounded-full border"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: 'rgba(38,27,7,0.08)',
                padding: '8px 18px',
                fontSize: '14px',
                lineHeight: '20px',
                color: 'rgba(38,27,7,0.7)',
                fontWeight: 450,
              }}
            >
              {label}
            </span>
          ))}
        </motion.div>

        {/* Logo marquee */}
        <section className="overflow-hidden pb-12 md:pb-16">
          <div className="relative w-full">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
              style={{ background: 'linear-gradient(to right, #F8F7F5, transparent)' }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
              style={{ background: 'linear-gradient(to left, #F8F7F5, transparent)' }}
            />
            <motion.div
              className="flex w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 20,
                  ease: 'linear',
                },
              }}
              style={{ gap: '24px' }}
            >
              {[...Array(2)].map((_, setIndex) =>
                trustedLogos.map((logo) => (
                  <div
                    key={`${setIndex}-${logo.name}`}
                    className="flex shrink-0 items-center justify-center"
                    style={{ width: '188px', height: '48px' }}
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      style={{
                        width: `${logo.width}px`,
                        maxHeight: '30px',
                        objectFit: 'contain',
                        opacity: 0.72,
                        filter: logo.invertOnLight ? 'brightness(0) saturate(100%)' : 'none',
                      }}
                    />
                  </div>
                )),
              )}
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-6 pb-16 md:pb-24 lg:px-28">
          <div
            className="mx-auto grid grid-cols-1 gap-4 md:grid-cols-3"
            style={{ maxWidth: '1216px' }}
          >
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative flex flex-col rounded-2xl border"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: plan.popular
                    ? 'rgba(38,27,7,0.2)'
                    : 'rgba(38,27,7,0.08)',
                  padding: '32px',
                  gap: '24px',
                  boxShadow: plan.popular
                    ? '0 16px 48px rgba(38,27,7,0.1)'
                    : '0 8px 24px rgba(38,27,7,0.04)',
                }}
              >
                {plan.popular && (
                  <span
                    className="absolute -top-3 left-6 rounded-full px-3 py-1"
                    style={{
                      backgroundColor: '#261B07',
                      color: '#F8F7F5',
                      fontSize: '12px',
                      fontWeight: 580,
                      lineHeight: '16px',
                    }}
                  >
                    Popular
                  </span>
                )}

                <div className="flex flex-col" style={{ gap: '12px' }}>
                  <h3
                    style={{
                      fontSize: '20px',
                      lineHeight: '26px',
                      color: '#261B07',
                      fontWeight: 580,
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline" style={{ gap: '4px' }}>
                    <span
                      style={{
                        fontSize: '40px',
                        lineHeight: '1',
                        color: '#261B07',
                        fontWeight: 580,
                        letterSpacing: '-1.5px',
                      }}
                    >
                      ${plan.price}
                    </span>
                    <span
                      style={{
                        fontSize: '15px',
                        color: 'rgba(38,27,7,0.45)',
                        fontWeight: 400,
                      }}
                    >
                      / mo
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '15px',
                      lineHeight: '22px',
                      color: 'rgba(38,27,7,0.6)',
                      fontWeight: 400,
                    }}
                  >
                    {plan.subtitle}
                  </p>
                </div>

                <ul className="flex flex-col" style={{ gap: '12px' }}>
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start"
                      style={{ gap: '10px' }}
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: 'rgba(38,27,7,0.4)' }}
                      />
                      <span
                        style={{
                          fontSize: '15px',
                          lineHeight: '22px',
                          color: '#261B07',
                          fontWeight: 400,
                        }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className="mt-auto rounded-xl py-3 text-center text-sm transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: plan.popular
                      ? '#261B07'
                      : 'rgba(38,27,7,0.06)',
                    color: plan.popular ? '#F8F7F5' : '#261B07',
                    fontWeight: 580,
                  }}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Trust badge */}
        <motion.section
          {...fadeUp}
          className="flex flex-col items-center px-6 pb-16 text-center md:pb-24 lg:px-28"
        >
          <div
            className="mx-auto flex flex-col items-center rounded-2xl border"
            style={{
              maxWidth: '640px',
              width: '100%',
              padding: 'clamp(24px, 4vw, 40px)',
              gap: '12px',
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(38,27,7,0.08)',
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(38,27,7,0.05)' }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'rgba(38,27,7,0.5)' }}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3
              style={{
                fontSize: '18px',
                lineHeight: '24px',
                color: '#261B07',
                fontWeight: 580,
              }}
            >
              Your data is safe with us
            </h3>
            <p
              style={{
                fontSize: '15px',
                lineHeight: '24px',
                color: 'rgba(38,27,7,0.6)',
                fontWeight: 400,
              }}
            >
              Enterprise-grade security with encrypted data, secure
              infrastructure, and regular audits.
            </p>
          </div>
        </motion.section>

        {/* FAQ */}
        <section className="px-6 pb-16 md:pb-24 lg:px-28">
          <div className="mx-auto" style={{ maxWidth: '720px' }}>
            <motion.h2
              {...fadeUp}
              className="mb-10 text-center"
              style={{
                fontSize: 'clamp(32px, 5vw, 48px)',
                letterSpacing: '-2px',
                lineHeight: '1.2',
                color: '#261B07',
                fontWeight: 580,
              }}
            >
              Frequently asked questions
            </motion.h2>

            <motion.div
              {...fadeUp}
              className="border-t"
              style={{ borderColor: 'rgba(38,27,7,0.08)' }}
            >
              {faqs.map((faq) => (
                <FAQItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 pb-16 md:pb-24 lg:px-28">
          <motion.div
            {...fadeUp}
            className="mx-auto flex flex-col items-center rounded-[28px] border text-center"
            style={{
              maxWidth: '960px',
              width: '100%',
              padding: 'clamp(32px, 5vw, 56px) clamp(20px, 4vw, 40px)',
              gap: '20px',
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(38,27,7,0.08)',
              boxShadow: '0 18px 40px rgba(38,27,7,0.05)',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 46px)',
                letterSpacing: '-2px',
                lineHeight: '1.15',
                color: '#261B07',
                fontWeight: 580,
                maxWidth: '620px',
              }}
            >
              Ready to send better proposals?
            </h2>
            <p
              style={{
                fontSize: '18px',
                lineHeight: '28px',
                color: 'rgba(38,27,7,0.7)',
                fontWeight: 400,
                maxWidth: '560px',
              }}
            >
              Start your free trial today. No credit card required.
            </p>
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: '14px' }}
            >
              <Link
                href="/sign-up"
                className="rounded-[12px] px-6 py-3 text-sm transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: '#261B07',
                  color: '#F8F7F5',
                  fontWeight: 580,
                }}
              >
                Start free trial
              </Link>
              <Link
                href="/demo"
                className="rounded-[12px] border px-6 py-3 text-sm transition-opacity hover:opacity-70"
                style={{
                  borderColor: 'rgba(38,27,7,0.18)',
                  color: '#261B07',
                  fontWeight: 580,
                }}
              >
                Book a demo
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
