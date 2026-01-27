import Link from 'next/link';
import { Button } from '@repo/ui/button';

export function Navbar() {
  return (
    <nav className="border-border/40 bg-background/80 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="font-heading text-xl leading-none font-bold">K</span>
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">Kitasuro</span>
          </Link>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Features
          </Link>
          <Link
            href="#testimonials"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Testimonials
          </Link>
          <Link
            href="#pricing"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:block"
          >
            Log in
          </Link>
          <Button asChild size="sm" className="rounded-full px-6">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
