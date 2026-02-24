import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="font-heading text-xl leading-none font-bold">K</span>
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight">Kitasuro</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Itinerary and proposal software for tour operators and travel agencies. Build, share,
              and close from one place.
            </p>
          </div>

          <div>
            <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/for-tour-operators"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  For Tour Operators
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-sm text-muted-foreground hover:text-foreground">
                  Compare Alternatives
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/compare/wetu-alternative"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Wetu Alternative
                </Link>
              </li>
              <li>
                <Link
                  href="/compare/safari-office-alternative"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Safari Office Alternative
                </Link>
              </li>
              <li>
                <Link
                  href="/compare/safari-portal-alternative"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Safari Portal Alternative
                </Link>
              </li>
              <li>
                <Link
                  href="https://cal.com/brightonmboya/30min"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Book a Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
              Account
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/sign-up" className="text-sm text-muted-foreground hover:text-foreground">
                  Start Free Trial
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Log In
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Kitasuro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
