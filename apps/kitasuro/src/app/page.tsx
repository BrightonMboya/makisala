import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { FeatureHighlight } from '@/components/landing/FeatureHighlight';
import { Pricing } from '@/components/landing/Pricing';
import { Footer } from '@/components/landing/Footer';
import { Compass, Globe, Layout, Library, Share2, Sparkles, ArrowRight, Quote } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const coreFeatures = [
    {
      title: 'Drag-and-Drop Builder',
      description:
        'Add accommodations, activities, and transfers. Rearrange days with a drag. Your itinerary stays organized.',
      icon: Compass,
    },
    {
      title: 'Ready-Made Content',
      description:
        'Stop Googling for lodge photos. Pull from a library of verified images and descriptions for top destinations.',
      icon: Library,
    },
    {
      title: 'Shareable Proposals',
      description:
        'Send a link, not a PDF attachment. Clients view, comment, and accept your proposal from any device.',
      icon: Share2,
    },
    {
      title: 'Works Offline',
      description: 'Your clients can pull up their itinerary mid-safari, even with no signal.',
      icon: Globe,
    },
    {
      title: 'AI Writing Assist',
      description:
        'Stuck on a description? Generate polished copy for any destination or activity in seconds.',
      icon: Sparkles,
    },
    {
      title: 'Your Brand, Your Look',
      description:
        'Pick a theme, add your logo, and match your brand colors. Every proposal looks like it came from your team.',
      icon: Layout,
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Build your itinerary',
      description: 'Drag in accommodations, activities, and transfers. The builder handles maps, pricing, and day structure.',
    },
    {
      number: '02',
      title: 'Personalize for your client',
      description: 'Add your brand, tailor descriptions, and fine-tune the experience for each traveler.',
    },
    {
      number: '03',
      title: 'Share and close',
      description: 'Send a live link. Clients review, comment, and accept — all in one place.',
    },
  ];

  return (
    <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary min-h-screen">
      <Navbar />

      <main>
        <Hero />

        {/* Trusted By / Social Proof */}
        <section className="border-y border-border/40 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="animate-slide-up-fade text-center text-sm font-medium text-muted-foreground" style={{ '--delay': '700ms' } as React.CSSProperties}>
              Trusted by tour operators across East Africa
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {['Safari operators', 'DMC teams', 'Travel agencies', 'Luxury outfitters'].map((label, i) => (
                <span
                  key={label}
                  className="animate-slide-up-fade text-muted-foreground/50 font-heading text-lg font-semibold tracking-tight"
                  style={{ '--delay': `${750 + i * 80}ms` } as React.CSSProperties}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="animate-slide-up-fade mb-16 text-center" style={{ '--delay': '0ms' } as React.CSSProperties}>
              <span className="text-primary mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium">
                Features
              </span>
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Less admin, more bookings
              </h2>
              <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                Every tool a tour operator needs to go from enquiry to confirmed booking, faster.
              </p>
            </div>
            <FeatureGrid features={coreFeatures} />
          </div>
        </section>

        {/* Deep Dive Feature 1: Builder */}
        <FeatureHighlight
          align="left"
          title="Stop wrestling with Word docs and spreadsheets"
          description="Drop in accommodations, slot in game drives, and rearrange the whole trip with a drag. Ratiba calculates travel times, maps the route, and totals the pricing as you go."
          features={[
            'Drag & drop day reordering',
            'Auto-generated route maps',
            'Day-by-day breakdowns',
            'Built-in pricing calculator',
          ]}
          imageSrc="/img_1.png"
          imageAlt="Itinerary Builder Interface"
          ctaText="Try the builder"
          ctaLink="/login"
        />

        {/* Deep Dive Feature 2: Content Library */}
        <FeatureHighlight
          align="right"
          title="Every lodge photo and description, ready to go"
          description="No more emailing lodges for updated photos or writing the same Serengeti description for the tenth time. Search, pick, and drop verified content straight into your itinerary."
          features={[
            'High-res accommodation photos',
            'Pre-written destination copy',
            'Activity and excursion database',
            'One-click import into any itinerary',
          ]}
          imageSrc="/proposal preview.png"
          imageAlt="Content Library Interface"
        />

        {/* Deep Dive Feature 3: Proposals */}
        <FeatureHighlight
          align="left"
          title="Send proposals clients actually respond to"
          description="Forget flat PDFs that sit in inboxes. Share a live link where clients explore interactive maps, leave comments on specific days, and accept the quote — all in one place."
          features={[
            'Looks great on phone, tablet, or desktop',
            'Interactive route maps',
            'Day-level client comments',
            'One-click quote acceptance',
          ]}
          imageSrc="/proposal_preivew-1.png"
          imageAlt="Digital Proposal Example"
        />

        {/* How It Works */}
        <section className="relative py-24">
          <div className="bg-dot-pattern pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_60%)] opacity-30" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="animate-slide-up-fade mb-16 text-center" style={{ '--delay': '0ms' } as React.CSSProperties}>
              <span className="text-primary mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium">
                How it works
              </span>
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                From enquiry to accepted quote in three steps
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className="animate-slide-up-fade relative rounded-2xl border border-border/50 bg-card/50 p-8"
                  style={{ '--delay': `${i * 120}ms` } as React.CSSProperties}
                >
                  <span className="font-heading text-primary/20 text-6xl font-bold">{step.number}</span>
                  <h3 className="font-heading mt-4 text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-muted-foreground mt-3 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Info boxes */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <article className="animate-slide-up-fade group rounded-2xl border border-border/60 bg-card/70 p-8 transition-all duration-300 hover:shadow-lg" style={{ '--delay': '0ms' } as React.CSSProperties}>
                <h2 className="font-heading text-3xl font-bold tracking-tight">
                  Built for B2B tour operations
                </h2>
                <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                  From safari operators to destination management companies, Ratiba helps teams
                  run proposals with less back-and-forth and more consistency.
                </p>
                <Link
                  href="/for-tour-operators"
                  className="text-primary mt-6 inline-flex items-center text-sm font-medium hover:underline"
                >
                  Explore solutions for operators <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>

              <article className="animate-slide-up-fade group rounded-2xl border border-border/60 bg-card/70 p-8 transition-all duration-300 hover:shadow-lg" style={{ '--delay': '100ms' } as React.CSSProperties}>
                <h2 className="font-heading text-3xl font-bold tracking-tight">
                  Evaluating alternatives?
                </h2>
                <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                  See how Ratiba compares with platforms like Wetu, Safari Office, and Safari
                  Portal for everyday proposal workflows.
                </p>
                <Link
                  href="/compare"
                  className="text-primary mt-6 inline-flex items-center text-sm font-medium hover:underline"
                >
                  View comparison pages <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="animate-slide-up-fade" style={{ '--delay': '0ms' } as React.CSSProperties}>
              <Quote className="text-primary/30 mx-auto h-10 w-10" />
              <blockquote className="font-heading mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                &ldquo;We used to spend hours on each proposal. Now we send polished, interactive itineraries the same day an enquiry comes in.&rdquo;
              </blockquote>
              <div className="mt-6">
                <p className="text-sm font-medium text-foreground">Safari Operations Team</p>
                <p className="text-sm text-muted-foreground">East Africa Tour Operator</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <Pricing />

        {/* CTA Section */}
        <section className="relative overflow-hidden py-24">
          <div className="from-primary/5 via-primary/10 absolute inset-0 bg-gradient-to-br to-transparent" />
          <div className="bg-grid-pattern pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] opacity-20" />
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <h2
              className="animate-slide-up-fade font-heading mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ '--delay': '0ms' } as React.CSSProperties}
            >
              Your next proposal could take 10 minutes, not 2 hours
            </h2>
            <p
              className="animate-slide-up-fade text-muted-foreground mb-10 text-xl"
              style={{ '--delay': '100ms' } as React.CSSProperties}
            >
              Sign up, build your first itinerary, and send it to a client today. No credit card
              needed.
            </p>
            <div
              className="animate-slide-up-fade flex flex-col items-center justify-center gap-4 sm:flex-row"
              style={{ '--delay': '200ms' } as React.CSSProperties}
            >
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium shadow-lg shadow-primary/20 transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                Create your first itinerary free
              </Link>
              <Link
                href="https://cal.com/brightonmboya/30min"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                Book a demo call
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
