import Link from 'next/link';
import { Button } from '@repo/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-36">
      {/* Dot pattern background */}
      <div className="bg-dot-pattern pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] opacity-40" />

      {/* Gradient blur orbs */}
      <div className="from-primary pointer-events-none absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br via-emerald-400 to-transparent opacity-15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-500/10 to-transparent blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <h1
          className="animate-slide-up-fade text-foreground font-heading mb-6 max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          style={{ '--delay': '100ms', '--offset': '32px' } as React.CSSProperties}
        >
          Create itineraries in minutes,{' '}
          <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
            not hours
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-slide-up-fade text-muted-foreground mb-10 max-w-2xl text-lg leading-relaxed lg:max-w-3xl"
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
        {/*<div*/}
        {/*  className="animate-slide-up-fade relative mx-auto mt-20 w-full max-w-5xl"*/}
        {/*  style={{ '--delay': '600ms', '--offset': '48px' } as React.CSSProperties}*/}
        {/*>*/}
        {/*  <div className="border-border/50 bg-background/50 relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl">*/}
        {/*    <Image*/}
        {/*      src="/img_1.png"*/}
        {/*      alt="Ratiba itinerary builder showing a 2-day gorilla trekking trip with drag-and-drop day planning, accommodations, and activities"*/}
        {/*      width={1920}*/}
        {/*      height={1080}*/}
        {/*      className="w-full"*/}
        {/*      priority*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*  /!* Decorative glow *!/*/}
        {/*  <div className="bg-primary/20 absolute -right-12 -bottom-12 -z-10 h-64 w-64 rounded-full blur-3xl" />*/}
        {/*  <div className="absolute -top-12 -left-12 -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />*/}
        {/*</div>*/}
      </div>
    </div>
  );
}
