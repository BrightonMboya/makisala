import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { FeatureHighlight } from '@/components/landing/FeatureHighlight';
import { Pricing } from '@/components/landing/Pricing';
import { Footer } from '@/components/landing/Footer';
import { ArrowRight, Compass, Globe, Layout, Library, Share2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CustomizedDesign from '@/components/landing/CustomizedDesign';
import { Button } from '@repo/ui/button';

export default function LandingPage() {
  const steps = [
    {
      number: '01',
      title: 'Build your itinerary',
      description:
        'Drag in accommodations, activities, and transfers. The builder handles maps, pricing, and day structure.',
    },
    {
      number: '02',
      title: 'Personalize for your client',
      description:
        'Add your brand, tailor descriptions, and fine-tune the experience for each traveler.',
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

        {/* Features Grid Section */}
        <div className='border-b'>
          <section id="features" className="mx-auto border-x w-fit px-8 py-16">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
              <div
                className="animate-slide-up-fade mb-16 text-center"
                style={{ '--delay': '0ms' } as React.CSSProperties}
              >
                <span className="text-primary border-primary/20 bg-primary/5 mb-4 inline-block rounded-full border px-4 py-1.5 text-sm font-medium">
                  Features
                </span>
                <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl">
                  Less admin, more bookings
                </h2>
                <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                  Every tool a tour operator needs to go from enquiry to confirmed booking, faster.
                </p>
              </div>
              <FeatureGrid />
            </div>
          </section>
        </div>

        {/* Deep Dive Feature 1: Builder */}
        {/* <FeatureHighlight
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
          imageSrc="https://brand.makisala.com/destination.png"
          imageAlt="Content Library Interface"
        />

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
          imageSrc="https://brand.makisala.com/share.png"
          imageAlt="Digital Proposal Example"
        /> */}

        {/* Design Variety */}
        <CustomizedDesign />

        {/* How It Works */}
        <div>
          <section className="mx-auto border-x w-fit px-8 py-16 space-y-20">
            <div className="bg-dot-pattern pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_20%,transparent_60%)] opacity-30" />
            <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <div
                className="animate-slide-up-fade mb-16 text-center"
                style={{ '--delay': '0ms' } as React.CSSProperties}
              >
                <span className="text-primary border-primary/20 bg-primary/5 mb-4 inline-block rounded-full border px-4 py-1.5 font-medium">
                  How it works
                </span>
                <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl leading-normal">
                  From enquiry to accepted quote <br /> in <span className="text-primary">three steps</span>
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {steps.map((step, i) => (
                  <div
                    key={step.number}
                    className="animate-slide-up-fade border-border bg-card/50 relative rounded-2xl border p-8"
                    style={{ '--delay': `${i * 120}ms` } as React.CSSProperties}
                  >
                    <span className="font-heading text-primary text-6xl font-bold">
                      {step.number}
                    </span>
                    <h3 className="font-heading mt-4 text-xl font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground mt-3 leading-relaxed text-sm">{step.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <Button asChild size="lg" className="rounded-full px-6 mt-8">
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            </div>


            <div className="grid gap-4 lg:grid-cols-2 max-w-5xl px-8">
              <article
                className="animate-slide-up-fade group border-border bg-card/70 rounded-2xl border p-8 transition-all duration-300 hover:shadow-lg"
                style={{ '--delay': '0ms' } as React.CSSProperties}
              >
                <h2 className="font-heading text-3xl font-bold tracking-tight">
                  Built for B2B tour operations
                </h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  From safari operators to destination management companies, Ratiba helps teams run
                  proposals with less back-and-forth and more consistency.
                </p>
                <Link
                  href="/for-tour-operators"
                  className="text-primary mt-6 inline-flex items-center text-sm font-medium hover:underline"
                >
                  Explore solutions for operators <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>

              <article
                className="animate-slide-up-fade group border-border bg-card/70 rounded-2xl border p-8 transition-all duration-300 hover:shadow-lg"
                style={{ '--delay': '100ms' } as React.CSSProperties}
              >
                <h2 className="font-heading text-3xl font-bold tracking-tight">
                  Evaluating alternatives?
                </h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  See how Ratiba compares with platforms like Wetu, Safari Office, and Safari Portal
                  for everyday proposal workflows.
                </p>
                <Link
                  href="/compare"
                  className="text-primary mt-6 inline-flex items-center text-sm font-medium hover:underline"
                >
                  View comparison pages <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
            </div>
          </section>
        </div>

        {/* Testimonial */}
        <div
          id="customers"
          className="grid-section border-grid-border relative overflow-clip border-y px-4 [.grid-section~&]:border-t-0"
        >
          <div className="max-w-grid-width border-grid-border relative z-0 mx-auto border-x px-4 py-20 sm:px-10 sm:py-28">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-medium text-neutral-900 sm:text-4xl">
                Trusted by tour operator owners
              </h2>
              <p className="mt-4 text-base text-neutral-500 sm:text-lg">
                From boutique safari teams to multi-country operators, owners use Ratiba to build
                faster proposals and close more enquiries.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <CustomerCard
                company="Savannah Trails Co."
                logo="https://assets.dub.co/testimonials/companies/vercel.svg"
                quote='Before Ratiba, we stitched quotes together in docs and spreadsheets. Now my team sends polished itineraries in under an hour and <strong class="text-neutral-900">we close enquiries faster with fewer back-and-forth emails</strong>.'
                name="Daniel Kimani"
                title="Owner, Savannah Trails Co."
                avatar="https://assets.dub.co/testimonials/people/jorn-van-dijk.jpg"
              />
              <CustomerCard
                company="Kilimanjaro Horizon Safaris"
                logo="https://assets.dub.co/testimonials/companies/vercel.svg"
                quote='We run high season at full speed, so proposal turnaround is everything. Ratiba gives us one workflow for pricing, branding, and sharing, and <strong class="text-neutral-900">our consultants can focus on selling instead of formatting</strong>.'
                name="Aisha Njoroge"
                title="Founder, Kilimanjaro Horizon Safaris"
                avatar="https://assets.dub.co/testimonials/people/guillermo-rauch.jpeg"
              />
              <CustomerCard
                company="Mara Family Journeys"
                logo="https://assets.dub.co/testimonials/companies/clerk.svg"
                quote='Our clients love seeing a live itinerary instead of static PDFs. The comment flow is clear, approvals are quicker, and <strong class="text-neutral-900">we reduced revision time per proposal by more than half</strong>.'
                name="Lillian Odhiambo"
                title="Owner, Mara Family Journeys"
                avatar="https://assets.dub.co/testimonials/people/nick-parsons.jpeg"
              />
              <CustomerCard
                company="Rift Valley Expeditions"
                logo="https://assets.dub.co/testimonials/companies/cal.svg"
                quote='We finally standardized how every consultant builds itineraries. Ratiba keeps quality consistent across the team and <strong class=&quot;text-neutral-900&quot;>helps us protect margins with clearer pricing visibility</strong>.'
                name="Peter Mwangi"
                title="Co-owner, Rift Valley Expeditions"
                avatar="https://assets.dub.co/testimonials/people/peer-richelsen.jpeg"
              />
            </div>
          </div>
        </div>

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
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring shadow-primary/20 inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium shadow-lg transition-colors focus-visible:ring-1 focus-visible:outline-none"
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

function CustomerCard({
  company,
  quote,
  name,
  title,
  avatar,
}: {
  company: string;
  logo: string;
  quote: string;
  name: string;
  title: string;
  avatar: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-8">
      <div className="mb-6 text-lg font-bold tracking-tight text-neutral-900">{company}</div>
      <blockquote
        className="text-sm leading-relaxed text-neutral-600"
        dangerouslySetInnerHTML={{ __html: `&ldquo;${quote}&rdquo;` }}
      />
      <div className="mt-4 flex items-center gap-3">
        <img
          alt={name}
          src={avatar}
          width={40}
          height={40}
          className="size-10 rounded-full border border-neutral-200"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-medium text-neutral-900">{name}</p>
          <p className="text-xs text-neutral-500">{title}</p>
        </div>
      </div>
    </div>
  );
}
