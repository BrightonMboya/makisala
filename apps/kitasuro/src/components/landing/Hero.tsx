import Link from "next/link";
import { Button } from "@repo/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function Hero() {
  return (
    <div className="relative overflow-hidden pt-32 pb-16 md:pt-48 md:pb-32">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 bg-gradient-to-br from-primary via-purple-500 to-transparent blur-3xl rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
          Now available for early access
        </div>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-7xl font-heading mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both delay-100">
          The Operating System for <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">Modern Tour Operators</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-200">
          Create stunning itineraries, manage proposals, and close more deals with Kitasuro. 
          The all-in-one platform designed to help you sell travel experiences effortlessly.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both delay-300">
          <Button asChild size="lg" className="h-12 px-8 text-base rounded-full">
            <Link href="/register">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base rounded-full bg-background/50 hover:bg-muted/80 backdrop-blur-sm">
            <Link href="/demo">
              View live demo
            </Link>
          </Button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-in fade-in zoom-in-95 duration-1000 delay-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>14-day free trial</span>
          </div>
        </div>

        {/* Hero Image / UI Mockup */}
        <div className="mt-20 relative w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
          <div className="relative rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9]">
             <div className="absolute inset-0 bg-gradient-to-tr from-muted/20 to-transparent"></div>
             {/* Placeholder for actual screenshot */}
             <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <p className="text-lg font-medium">Interactive Itinerary Builder UI</p>
                    <p className="text-sm">Drag & Drop • Smart Content • Beautiful Proposals</p>
                </div>
             </div>
          </div>
           {/* Decorative elements behind */}
           <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
           <div className="absolute -z-10 -top-10 -left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

      </div>
    </div>
  );
}
