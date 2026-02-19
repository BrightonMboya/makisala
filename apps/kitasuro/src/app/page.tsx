import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { FeatureHighlight } from '@/components/landing/FeatureHighlight';
import { Pricing } from '@/components/landing/Pricing';
import { Footer } from '@/components/landing/Footer';
import { Compass, Globe, Layout, Library, Share2, Sparkles } from 'lucide-react';
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

  return (
    <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary min-h-screen">
      <Navbar />

      <main>
        <Hero />

        {/* Features Grid Section */}
        <section id="features" className="bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Less admin, more bookings
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
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
          description="Drop in accommodations, slot in game drives, and rearrange the whole trip with a drag. Kitasuro calculates travel times, maps the route, and totals the pricing as you go."
          features={[
            'Drag & drop day reordering',
            'Auto-generated route maps',
            'Day-by-day breakdowns',
            'Built-in pricing calculator',
          ]}
          imageSrc="/img_1.png" // Placeholder
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
          imageSrc="/proposal preview.png" // Placeholder
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
          imageSrc="/proposal_preivew-1.png" // Placeholder
          imageAlt="Digital Proposal Example"
        />

        {/* Pricing Section */}
        <Pricing />

        {/* CTA Section */}
        <section className="relative overflow-hidden py-24">
          <div className="bg-primary/5 absolute inset-0"></div>
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <h2 className="font-heading mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Your next proposal could take 10 minutes, not 2 hours
            </h2>
            <p className="text-muted-foreground mb-10 text-xl">
              Sign up, build your first itinerary, and send it to a client today. No credit card
              needed.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                Create your first itinerary free
              </Link>
              <Link
                href="https://cal.com/brightonmboya/30min"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                Talk to our team
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
