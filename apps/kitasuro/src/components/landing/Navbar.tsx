'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/#why-ratiba', label: 'Why Ratiba' },
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/login', label: 'Login' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(38,27,7,0.06)] bg-[rgba(248,247,245,0.85)] px-6 py-4 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#261B07]">
          <span className="text-sm font-bold leading-none text-[#F8F7F5]">R</span>
        </div>
        <span className="text-base font-semibold tracking-[-0.3px] text-[#261B07]">
          Ratiba
        </span>
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/demo"
          className="rounded-lg bg-[#261B07] px-4 py-2 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
        >
          Book a demo
        </Link>
      </div>

      <button
        type="button"
        className="text-[#261B07] md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div className="absolute top-full right-0 left-0 z-50 border-t border-[rgba(38,27,7,0.1)] bg-[#F8F7F5] px-6 py-4 md:hidden">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-[580] text-[#261B07]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/demo"
              className="mt-2 block rounded-lg bg-[#261B07] px-4 py-2.5 text-center text-sm font-[580] text-[#F8F7F5]"
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
