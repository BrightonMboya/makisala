'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
    quote:
      'We went from spending hours on proposals to having them ready in minutes.',
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
    const formData = new FormData(form);

    try {
      await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.get('fullName'),
          email: formData.get('email'),
          company: formData.get('company'),
          role: formData.get('role'),
        }),
      });
      router.push('/demo/confirmation');
    } catch {
      router.push('/demo/confirmation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        backgroundColor: '#F8F7F5',
        color: '#261B07',
        padding: '48px 24px',
      }}
    >
      <div
        className="flex w-full flex-col lg:flex-row"
        style={{ maxWidth: '1216px', gap: '16px' }}
      >
        {/* ── Left: Dark form card ── */}
        <div
          className="flex flex-1 flex-col overflow-hidden"
          style={{
            backgroundColor: '#261B07',
            borderRadius: '12px',
            padding: '6px',
            gap: '6px',
          }}
        >
          {/* Dark header area */}
          <div className="flex flex-col" style={{ padding: '32px', gap: '16px' }}>
            <Link
              href="/"
              className="text-sm transition-opacity hover:opacity-80"
              style={{
                color: 'rgba(248,247,245,0.72)',
                textDecoration: 'underline',
                fontSize: '14px',
              }}
            >
              &larr; Back to homepage
            </Link>
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 584,
                lineHeight: '40.5px',
                letterSpacing: '-0.36px',
                color: '#F8F7F5',
              }}
            >
              Talk to a human
            </h1>
          </div>

          {/* White form area */}
          <div
            className="flex flex-1 flex-col"
            style={{
              backgroundColor: '#F8F7F5',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              className="flex flex-1 flex-col justify-between"
              style={{ padding: '32px', gap: '32px' }}
            >
              <>
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col"
                    style={{ gap: '16px' }}
                  >
                    <FormField label="Full name" name="fullName" required />
                    <FormField label="Company" name="company" required />
                    <SelectField
                      label="Role"
                      name="role"
                      options={roles}
                      placeholder="Select one"
                      required
                    />
                    <FormField
                      label="Work email"
                      name="email"
                      type="email"
                      required
                    />

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{
                        backgroundColor: '#261B07',
                        color: '#F8F7F5',
                        fontWeight: 584,
                        fontSize: '14px',
                        lineHeight: '20px',
                        padding: '14px',
                        borderRadius: '8px',
                        marginTop: '4px',
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Book a demo'}
                    </button>
                  </form>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between"
                    style={{
                      paddingTop: '16px',
                      borderTop: '1px solid rgb(227,223,213)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 492,
                        letterSpacing: '-0.14px',
                        color: '#261B07',
                      }}
                    >
                      200+ tour operators
                    </span>
                    <Link
                      href="/proposal/tjksu"
                      className="transition-opacity hover:opacity-70"
                      style={{
                        fontSize: '14px',
                        fontWeight: 492,
                        letterSpacing: '-0.14px',
                        color: '#261B07',
                        textDecoration: 'underline',
                      }}
                    >
                      See a sample proposal
                    </Link>
                  </div>
              </>
            </div>
          </div>
        </div>

        {/* ── Right: Content card ── */}
        <div
          className="flex flex-1 flex-col justify-between overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: 'rgba(38,27,7,0.06) 0px 4px 8px 0px',
          }}
        >
          <div
            className="flex flex-1 flex-col justify-between"
            style={{ padding: '32px', gap: '32px' }}
          >
            <div className="flex flex-col" style={{ gap: '32px' }}>
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-md"
                  style={{ backgroundColor: '#261B07' }}
                >
                  <span
                    className="text-sm font-bold leading-none"
                    style={{ color: '#F8F7F5' }}
                  >
                    R
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: 600,
                    letterSpacing: '-0.3px',
                    color: '#261B07',
                    fontSize: '16px',
                  }}
                >
                  Ratiba
                </span>
              </Link>

              {/* Headline */}
              <h1
                style={{
                  fontSize: '56px',
                  fontWeight: 584,
                  lineHeight: '63px',
                  letterSpacing: '-1.12px',
                  color: '#261B07',
                }}
              >
                Build faster. Sell more.
              </h1>

              {/* Description */}
              <p
                style={{
                  fontSize: '20px',
                  lineHeight: '25px',
                  letterSpacing: '-0.2px',
                  color: '#261B07',
                }}
              >
                Ratiba helps tour operators and travel agencies build itineraries
                faster and send proposals clients love.
              </p>
            </div>

            {/* Single testimonial with crossfade */}
            <div
              className="relative overflow-hidden rounded-xl"
              style={{
                backgroundColor: '#F8F7F5',
                padding: '24px',
                minHeight: '140px',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col"
                  style={{ gap: '16px' }}
                >
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '24px',
                      color: 'rgba(38,27,7,0.8)',
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{testimonials[testimonialIndex]!.quote}&rdquo;
                  </p>
                  <div className="flex items-center" style={{ gap: '10px' }}>
                    <div
                      className="flex h-9 w-9 items-center justify-center"
                      style={{
                        backgroundColor: '#E3DFD5',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 584,
                        color: '#261B07',
                      }}
                    >
                      {testimonials[testimonialIndex]!.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex flex-col">
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 584,
                          lineHeight: '17px',
                          color: '#261B07',
                        }}
                      >
                        {testimonials[testimonialIndex]!.name}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          lineHeight: '17px',
                          color: 'rgba(38,27,7,0.5)',
                        }}
                      >
                        {testimonials[testimonialIndex]!.role}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Logo marquee with label */}
            <div className="flex flex-col" style={{ gap: '12px' }}>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 490,
                  color: 'rgba(38,27,7,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Built for modern travel companies
              </p>
              <div className="relative overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12"
                  style={{
                    background: 'linear-gradient(to right, #FFFFFF, transparent)',
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12"
                  style={{
                    background: 'linear-gradient(to left, #FFFFFF, transparent)',
                  }}
                />
                <div
                  className="flex w-max animate-marquee"
                  style={{ gap: '24px' }}
                >
                  {[...Array(3)].map((_, setIndex) =>
                    trustedLogos.map((logo) => (
                      <div
                        key={`${setIndex}-${logo.name}`}
                        className="flex shrink-0 items-center justify-center"
                        style={{ width: '140px', height: '36px' }}
                      >
                        <img
                          src={logo.src}
                          alt={logo.name}
                          style={{
                            width: `${logo.width}px`,
                            maxHeight: '26px',
                            objectFit: 'contain',
                            opacity: 0.5,
                            filter: logo.invert
                              ? 'brightness(0) saturate(100%)'
                              : 'none',
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
    <div className="flex flex-col" style={{ gap: '6px' }}>
      <label
        htmlFor={name}
        style={{
          fontSize: '14px',
          fontWeight: 492,
          color: '#261B07',
          lineHeight: '17.5px',
          letterSpacing: '-0.14px',
        }}
      >
        {label}*
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full outline-none transition-colors"
        style={{
          border: '1.5px solid rgb(227,223,213)',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '15px',
          color: '#261B07',
          backgroundColor: 'transparent',
        }}
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
    <div className="flex flex-col" style={{ gap: '6px' }}>
      <label
        htmlFor={name}
        style={{
          fontSize: '14px',
          fontWeight: 492,
          color: '#261B07',
          lineHeight: '17.5px',
          letterSpacing: '-0.14px',
        }}
      >
        {label}*
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className="w-full outline-none transition-colors"
        style={{
          border: '1.5px solid rgb(227,223,213)',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '15px',
          color: '#261B07',
          backgroundColor: 'transparent',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%23261B07' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: '40px',
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
