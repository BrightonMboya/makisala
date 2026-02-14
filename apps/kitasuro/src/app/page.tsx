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
      title: 'Smart Itinerary Builder',
      description: 'Drag-and-drop interface to build stunning itineraries in minutes, not hours.',
      icon: Compass,
    },
    {
      title: 'Curated Content Library',
      description:
        'Access thousands of high-quality images and descriptions for accommodations and activities.',
      icon: Library,
    },
    {
      title: 'Interactive Proposals',
      description:
        'Share digital proposals that look great on any device and let clients comment directly.',
      icon: Share2,
    },
    {
      title: 'Offline Access',
      description: 'Your clients can access their itineraries even without an internet connection.',
      icon: Globe,
    },
    {
      title: 'AI Assistance',
      description: 'Generate descriptions and optimize routes with our built-in AI tools.',
      icon: Sparkles,
    },
    {
      title: 'Multiple Themes',
      description: 'Choose from our collection of premium themes to match your brand identity.',
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
                Everything you need to scale
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Powerful tools designed specifically for the workflow of modern tour operators.
              </p>
            </div>
            <FeatureGrid features={coreFeatures} />
          </div>
        </section>

        {/* Deep Dive Feature 1: Builder */}
        <FeatureHighlight
          align="left"
          title="Build complex itineraries with ease"
          description="Our intuitive drag-and-drop builder handles all the logistics. Simply select accommodations, add activities, and let Kitasuro calculate travel times and route maps automatically."
          features={[
            'Drag & drop reordering',
            'Automatic route mapping',
            'Day-by-day breakdowns',
            'Pricing calculator',
          ]}
          imageSrc="/img_1.png" // Placeholder
          imageAlt="Itinerary Builder Interface"
          ctaText="Try the builder"
          ctaLink="/demo"
        />

        {/* Deep Dive Feature 2: Content Library */}
        <FeatureHighlight
          align="right"
          title="World-class content at your fingertips"
          description="Stop wasting time searching for high-res images or writing descriptions from scratch. Our integrated library gives you instant access to premium content for top destinations."
          features={[
            'Verified accommodation photos',
            'Pre-written descriptions',
            'Activity database',
            'One-click import',
          ]}
          imageSrc="/proposal preview.png" // Placeholder
          imageAlt="Content Library Interface"
        />

        {/* Deep Dive Feature 3: Proposals */}
        <FeatureHighlight
          align="left"
          title="Proposals that convert"
          description="Send beautiful, interactive web-based proposals that wow your clients. Enable comments, track views, and let clients accept quotes directly from the page."
          features={[
            'Mobile-responsive design',
            'Interactive maps',
            'Client commenting system',
            'Digital acceptance & signatures',
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
              Ready to transform your travel business?
            </h2>
            <p className="text-muted-foreground mb-10 text-xl">
              Join hundreds of tour operators who are saving time and selling more with Kitasuro.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                Start your 14-day free trial
              </Link>
              <Link
                href="/contact"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
