import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-background mt-8">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="font-heading text-xl leading-none font-bold">R</span>
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight">Ratiba</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Itinerary and proposal software for tour operators and travel agencies. Build, share,
              and close from one place.
            </p>
            {/* Social links placeholder */}
            <div className="mt-6 flex gap-4">
              <span className="text-muted-foreground/50 text-xs">Follow us — coming soon</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-primary">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/for-tour-operators"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  For Tour Operators
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Compare Alternatives
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-primary">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/compare/wetu-alternative"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Wetu Alternative
                </Link>
              </li>
              <li>
                <Link
                  href="/compare/safari-office-alternative"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Safari Office Alternative
                </Link>
              </li>
              <li>
                <Link
                  href="/compare/safari-portal-alternative"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Safari Portal Alternative
                </Link>
              </li>
              <li>
                <Link
                  href="https://cal.com/brightonmboya/30min"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Book a Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-primary">
              Account
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/sign-up" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Start Free Trial
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Log In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar with gradient top border */}
        <div className="relative mt-12 pt-8">
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Ratiba. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
