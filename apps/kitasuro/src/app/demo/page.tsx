'use client';

import Cal, { getCalApi } from '@calcom/embed-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { log, serializeError } from '@/lib/logger';

const CAL_LINK = 'brightonmboya/30min';

const trustedLogos = [
  { name: 'Nomad Tanzania', src: '/logos/nomad.svg', width: 138 },
  { name: 'Lemala Camps & Lodges', src: '/logos/lemala.svg', width: 120, invert: true },
  { name: 'Asilia Africa', src: '/logos/asilia.svg', width: 100 },
  { name: 'Elewana Collection', src: '/logos/elewana.png', width: 108, invert: true },
];

const roles = [
  'Founder / CEO',
  'Head of Sales',
  'Operations Manager',
  'Travel Consultant',
  'Marketing Manager',
  'Other',
];

const testimonials = [
  {
    quote: 'We went from spending hours on proposals to having them ready in minutes.',
    name: 'James Mwangi',
    role: 'Head of Sales',
  },
  {
    quote:
      'Our clients love being able to comment directly on the proposal. It cut our back-and-forth in half.',
    name: 'Amina Juma',
    role: 'Operations Manager',
  },
  {
    quote:
      'Ratiba made our team look professional from day one. The branded proposals are a game changer.',
    name: 'David Kimani',
    role: 'Founder & CEO',
  },
];

export default function DemoPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [schedulePromptOpen, setSchedulePromptOpen] = useState(false);
  const [submittedContact, setSubmittedContact] = useState<{ name: string; email: string } | null>(
    null,
  );

  // Listen for booking success
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: '30min' });
      cal('on', {
        action: 'bookingSuccessful',
        callback: () => {
          router.push('/demo/confirmation');
        },
      });
    })();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = fd.get('fullName') as string;
    const email = fd.get('email') as string;

    try {
      await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          email,
          company: fd.get('company'),
          role: fd.get('role'),
        }),
      });
    } catch (err) {
      log.error('Demo form submission failed', serializeError(err));
    } finally {
      setSubmitting(false);
    }

    setSubmittedContact({ name, email });
    setSchedulePromptOpen(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F7F5] px-6 py-12 text-[#261B07]">
      <div className="flex w-full max-w-[1216px] flex-col gap-4 lg:flex-row">
        {/* ── Left: Dark form card ── */}
        <div className="flex flex-1 flex-col gap-1.5 overflow-hidden rounded-xl bg-[#261B07] p-1.5">
          {/* Dark header area */}
          <div className="flex flex-col gap-4 p-8">
            <Link
              href="/"
              className="text-sm text-[rgba(248,247,245,0.72)] underline transition-opacity hover:opacity-80"
            >
              &larr; Back to homepage
            </Link>
            <h1 className="text-4xl leading-[40.5px] font-[584] tracking-[-0.36px] text-[#F8F7F5]">
              Talk to a human
            </h1>
          </div>

          {/* White form area */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-[#F8F7F5]">
            <div className="flex flex-1 flex-col justify-between gap-8 p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField label="Full name" name="fullName" required />
                <FormField label="Company" name="company" required />
                <SelectField
                  label="Role"
                  name="role"
                  options={roles}
                  placeholder="Select one"
                  required
                />
                <FormField label="Work email" name="email" type="email" required />

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-[4px] w-full cursor-pointer rounded-md bg-[#261B07] p-[14px] text-[#F8F7F5] transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Book a demo'}
                </button>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[rgb(227,223,213)] pt-4">
                <span className="text-sm font-[492] tracking-[-0.14px] text-[#261B07]">
                  200+ tour operators
                </span>
                <Link
                  href="/proposal/tjksu"
                  className="text-sm font-[492] tracking-[-0.14px] text-[#261B07] underline transition-opacity hover:opacity-70"
                >
                  See a sample proposal
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Content card ── */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden rounded-xl bg-white shadow-[0_4px_8px_0_rgba(38,27,7,0.06)]">
          <div className="flex flex-1 flex-col justify-between gap-8 p-8">
            <div className="flex flex-col gap-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#261B07]">
                  <span className="text-sm leading-none font-bold text-[#F8F7F5]">R</span>
                </div>
                <span className="text-base font-semibold tracking-[-0.3px] text-[#261B07]">
                  Ratiba
                </span>
              </Link>

              {/* Headline */}
              <h1 className="text-[56px] leading-[63px] font-[584] tracking-[-1.12px] text-[#261B07]">
                Build faster. Sell more.
              </h1>

              {/* Description */}
              <p className="text-xl leading-[25px] tracking-[-0.2px] text-[#261B07]">
                Ratiba helps tour operators and travel agencies build itineraries faster and send
                proposals clients love.
              </p>
            </div>

            {/* Single testimonial with crossfade */}
            <div className="relative min-h-[140px] overflow-hidden rounded-xl bg-[#F8F7F5] p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-4"
                >
                  <p className="text-base leading-6 text-[rgba(38,27,7,0.8)] italic">
                    &ldquo;{testimonials[testimonialIndex]!.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E3DFD5] text-[13px] font-[584] text-[#261B07]">
                      {testimonials[testimonialIndex]!.name.split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm leading-[17px] font-[584] text-[#261B07]">
                        {testimonials[testimonialIndex]!.name}
                      </span>
                      <span className="text-[13px] leading-[17px] text-[rgba(38,27,7,0.5)]">
                        {testimonials[testimonialIndex]!.role}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Logo marquee with label */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-[490] tracking-[0.05em] text-[rgba(38,27,7,0.4)] uppercase">
                Built for modern travel companies
              </p>
              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />
                <div className="animate-marquee flex w-max gap-6">
                  {[...Array(3)].map((_, setIndex) =>
                    trustedLogos.map((logo) => (
                      <div
                        key={`${setIndex}-${logo.name}`}
                        className="flex h-9 w-[140px] shrink-0 items-center justify-center"
                      >
                        <img
                          src={logo.src}
                          alt={logo.name}
                          className="max-h-[26px] object-contain opacity-50"
                          style={{
                            width: `${logo.width}px`,
                            filter: logo.invert ? 'brightness(0) saturate(100%)' : 'none',
                          }}
                        />
                      </div>
                    )),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {schedulePromptOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(38,27,7,0.38)] px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-[#F8F7F5] p-7 shadow-[0_24px_80px_rgba(38,27,7,0.18)]"
            >
              <div className="flex flex-col gap-3">
                <h2 className="text-[28px] leading-8 font-[584] tracking-[-0.4px] text-[#261B07]">
                  What&apos;s the best time for the meeting?
                </h2>
              </div>

              <div className="mt-6 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[rgb(227,223,213)]">
                <Cal
                  namespace="30min"
                  calLink={CAL_LINK}
                  config={{
                    name: submittedContact?.name!,
                    email: submittedContact?.email!,
                  }}
                  className="h-full w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function FormField({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm leading-[17.5px] font-[492] tracking-[-0.14px] text-[#261B07]"
      >
        {label}*
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border-[1.5px] border-[rgb(227,223,213)] bg-transparent px-3.5 py-3 text-[15px] text-[#261B07] transition-colors outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  options: string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm leading-[17.5px] font-[492] tracking-[-0.14px] text-[#261B07]"
      >
        {label}*
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className="w-full appearance-none rounded-lg border-[1.5px] border-[rgb(227,223,213)] bg-transparent bg-[length:12px_12px] bg-[position:right_14px_center] bg-no-repeat py-3 pr-10 pl-3.5 text-[15px] text-[#261B07] transition-colors outline-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%23261B07' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
