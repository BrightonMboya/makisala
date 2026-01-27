import Link from 'next/link';
import { Button } from '@repo/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative overflow-hidden pt-32 pb-16 md:pt-48 md:pb-32">
      {/* Background gradients */}
      <div className="bg-background pointer-events-none absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="from-primary pointer-events-none absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br via-purple-500 to-transparent opacity-20 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <div className="border-border bg-muted/50 text-muted-foreground animate-in fade-in slide-in-from-bottom-4 mb-8 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-sm duration-700">
          <span className="bg-primary mr-2 flex h-2 w-2 rounded-full"></span>
          Now available for early access
        </div>

        <h1 className="text-foreground font-heading animate-in fade-in slide-in-from-bottom-6 fill-mode-both mb-6 max-w-4xl text-5xl font-bold tracking-tight delay-100 duration-1000 sm:text-7xl">
          Create Proposals that converts <br className="hidden sm:block" />
          <span className="from-foreground to-muted-foreground bg-gradient-to-r bg-clip-text text-transparent">
            {/*Within Minutes and not hours*/}
          </span>
        </h1>

        <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-8 fill-mode-both mb-10 max-w-2xl text-lg delay-200 duration-1000">
          Create stunning itineraries, manage proposals, and close more deals. The all-in-one
          platform designed to help you sell travel experiences effortlessly.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-10 fill-mode-both flex flex-col items-center gap-4 delay-300 duration-1000 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
            <Link href="/register">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-background/50 hover:bg-muted/80 h-12 rounded-full px-8 text-base backdrop-blur-sm"
          >
            <Link href="/demo">View live demo</Link>
          </Button>
        </div>

        <div className="text-muted-foreground animate-in fade-in zoom-in-95 mt-12 flex items-center justify-center gap-8 text-sm delay-500 duration-1000">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>14-day free trial</span>
          </div>
        </div>

        {/* Hero Image / UI Mockup */}
        <div className="animate-in fade-in slide-in-from-bottom-12 relative mx-auto mt-20 w-full max-w-6xl delay-700 duration-1000">
          <div className="border-border/50 bg-background/50 relative aspect-[16/9] overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl">
            <div className="from-muted/20 absolute inset-0 bg-gradient-to-tr to-transparent"></div>
            {/* Placeholder for actual screenshot */}
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium">Interactive Itinerary Builder UI</p>
                <p className="text-sm">Drag & Drop • Smart Content • Beautiful Proposals</p>
              </div>
            </div>
          </div>
          {/* Decorative elements behind */}
          <div className="bg-primary/20 absolute -right-10 -bottom-10 -z-10 h-64 w-64 rounded-full blur-3xl"></div>
          <div className="absolute -top-10 -left-10 -z-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
