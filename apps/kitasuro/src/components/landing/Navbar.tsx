'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui/button';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/for-tour-operators', label: 'For Tour Operators' },
  { href: '/compare', label: 'Compare' },
  { href: '/#pricing', label: 'Pricing' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-background/80 fixed top-4 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md w-full max-w-6xl shadow-xl shadow-primary/5 rounded-full overflow-hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="font-heading text-xl leading-none font-bold">R</span>
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">Ratiba</span>
          </Link>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:block"
          >
            Log in
          </Link>
          <Button asChild size="sm" className="rounded-full px-6">
            <Link href="/sign-up">Try free</Link>
          </Button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-border/40 bg-background/95 border-t backdrop-blur-md md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
