'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/#customers', label: 'Why Ratiba' },
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/login', label: 'Login' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between border-b px-6 backdrop-blur-md"
      style={{
        paddingBlock: '16px',
        backgroundColor: 'rgba(248,247,245,0.85)',
        borderColor: 'rgba(38,27,7,0.06)',
      }}
    >
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
          className="text-base"
          style={{
            color: '#261B07',
            fontWeight: 600,
            letterSpacing: '-0.3px',
          }}
        >
          Ratiba
        </span>
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: '#261B07', fontWeight: 580 }}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="https://cal.com/brightonmboya/30min"
          className="rounded-lg px-4 py-2 text-sm transition-opacity hover:opacity-90"
          style={{
            backgroundColor: '#261B07',
            color: '#F8F7F5',
            fontWeight: 580,
          }}
        >
          Book a demo
        </Link>
      </div>

      <button
        type="button"
        className="md:hidden"
        style={{ color: '#261B07' }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div
          className="absolute top-full right-0 left-0 z-50 border-t px-6 py-4 md:hidden"
          style={{
            backgroundColor: '#F8F7F5',
            borderColor: 'rgba(38,27,7,0.1)',
          }}
        >
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-sm"
                style={{ color: '#261B07', fontWeight: 580 }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://cal.com/brightonmboya/30min"
              className="mt-2 block rounded-lg px-4 py-2.5 text-center text-sm"
              style={{
                backgroundColor: '#261B07',
                color: '#F8F7F5',
                fontWeight: 580,
              }}
              onClick={() => setMobileOpen(false)}
            >
              Book a demo
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
