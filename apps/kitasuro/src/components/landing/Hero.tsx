import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@repo/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative overflow-hidden pt-32 md:pt-36 border-b border-border">
      {/* Dot pattern background */}
      <div className="bg-dot-pattern pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_20%,transparent_60%)] opacity-30" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <h1
          className="animate-slide-up-fade text-foreground font-heading mb-6 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          style={{ '--delay': '100ms', '--offset': '32px' } as React.CSSProperties}
        >
          Create itineraries in minutes,{' '}
          <span className="from-primary via-lime-500/80 to-primary bg-linear-to-r bg-clip-text text-transparent">
            not hours
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-slide-up-fade text-muted-foreground mb-10 max-w-2xl leading-relaxed lg:max-w-3xl"
          style={{ '--delay': '200ms' } as React.CSSProperties}
        >
          Drag in accommodations, set the pricing, preview the itinerary, and send a branded
          proposal link, all before lunch. Ratiba replaces the spreadsheets, PDFs, and email chains.
        </p>

        {/* CTAs */}
        <div
          className="animate-slide-up-fade flex flex-col items-center gap-4 sm:flex-row"
          style={{ '--delay': '300ms' } as React.CSSProperties}
        >
          <Button
            asChild
            size="lg"
            className="shadow-primary/20 h-12 rounded-full px-8 text-base shadow-lg"
          >
            <Link href="/sign-up">
              Start building free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-background/50 hover:bg-muted/80 h-12 rounded-full px-8 text-base backdrop-blur-sm"
          >
            <Link href="/proposal/tjksu">See a live proposal</Link>
          </Button>
        </div>

        {/* Trust signals */}
        <div
          className="animate-slide-up-fade text-muted-foreground mt-12 flex items-center justify-center gap-8 text-sm"
          style={{ '--delay': '450ms' } as React.CSSProperties}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Free plan available</span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Set up in under 10 minutes</span>
          </div>
        </div>

        {/* Hero product screenshot */}
        <div className='overflow-hidden border border-b-0 border-border rounded-t-4xl mt-16 relative backdrop-blur-lg pt-8 px-8'>
          <div
            className="animate-slide-up-fade relative mx-auto w-full max-w-5xl"
            style={{ '--delay': '600ms', '--offset': '48px' } as React.CSSProperties}
          >
            <div className="border-border bg-background/50 relative overflow-hidden rounded-t-2xl border backdrop-blur-xl h-112">
              <Image
                src="/img_1.png"
                alt="Ratiba itinerary builder showing a 2-day gorilla trekking trip with drag-and-drop day planning, accommodations, and activities"
                width={1920}
                height={1080}
                className="w-full"
                priority
              />
            </div>
            {/* <div className="bg-primary/20 absolute -right-12 -bottom-12 -z-10 h-64 w-64 rounded-full blur-3xl" />
            <div className="absolute -top-12 -left-12 -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" /> */}
          </div>

          {/* Trusted By / Social Proof */}
          <section className='py-12'>
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
              <p
                className="animate-slide-up-fade text-muted-foreground text-center text-sm font-medium"
                style={{ '--delay': '700ms' } as React.CSSProperties}
              >
                Trusted by tour operators across Africa
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                {['Safari operators', 'DMC teams', 'Travel agencies', 'Luxury outfitters'].map(
                  (label, i) => (
                    <span
                      key={label}
                      className="animate-slide-up-fade text-muted-foreground/50 font-heading text-lg font-semibold tracking-tight"
                      style={{ '--delay': `${750 + i * 80}ms` } as React.CSSProperties}
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
