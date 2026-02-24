import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, Clock3, MessageSquare, Users } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Tour Operator Software | Kitasuro',
  description:
    'Proposal and itinerary software for tour operators and DMC teams. Build trips faster, collaborate with your team, and send interactive proposals clients can approve online.',
};

const outcomes = [
  {
    title: 'Reply to enquiries faster',
    description:
      'Build day-by-day itineraries with drag-and-drop editing and reusable content so your team can send polished proposals quickly.',
    icon: Clock3,
  },
  {
    title: 'Keep sales and operations aligned',
    description:
      'Use one workspace for tours, pricing, comments, and proposal updates instead of scattered docs and message threads.',
    icon: Users,
  },
  {
    title: 'Close with less back-and-forth',
    description:
      'Share interactive proposal links where clients can review, comment, and accept in one place.',
    icon: MessageSquare,
  },
];

const audience = [
  'Safari tour operators building custom trips',
  'DMC and inbound teams handling multi-day itineraries',
  'Travel agencies that want branded proposals, not generic PDFs',
  'Growing teams that need role-based collaboration across sales and ops',
];

const process = [
  {
    step: '1. Build',
    description: 'Create itineraries with accommodations, activities, transfers, and pricing in one structured flow.',
  },
  {
    step: '2. Personalize',
    description: 'Apply your brand style, tailor details for each client, and keep proposals consistent across your team.',
  },
  {
    step: '3. Share',
    description: 'Send a secure link clients can open on mobile or desktop and keep feedback tied to specific trip details.',
  },
  {
    step: '4. Convert',
    description: 'Move from proposal to accepted quote without juggling multiple tools.',
  },
];

export default function TourOperatorsPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />

      <main>
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
          <div className="from-primary/15 pointer-events-none absolute top-0 left-1/2 h-[360px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-b to-transparent blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-primary mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-1.5 text-sm font-medium">
              <Building2 className="h-4 w-4" /> Built for B2B travel teams
            </p>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-6xl">
              Tour operator software for teams that need to move faster
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-3xl text-lg">
              Kitasuro helps you turn enquiries into bookable itineraries with less admin. Build,
              price, share, and collaborate from one platform built for safari and multi-day travel.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium shadow-sm transition-colors"
              >
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="https://cal.com/brightonmboya/30min"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-medium shadow-sm transition-colors"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {outcomes.map((item) => (
                <article key={item.title} className="rounded-2xl border border-border/60 bg-card/60 p-6">
                  <div className="bg-primary/10 text-primary mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold">{item.title}</h2>
                  <p className="text-muted-foreground mt-3 leading-relaxed">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/25 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="font-heading text-3xl font-bold tracking-tight">Who Kitasuro is for</h2>
              <ul className="mt-6 space-y-4">
                {audience.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="text-primary mt-1 h-4 w-4 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-3xl font-bold tracking-tight">How teams use Kitasuro</h2>
              <ol className="mt-6 space-y-5">
                {process.map((item) => (
                  <li key={item.step} className="rounded-xl border border-border/60 bg-background/70 p-4">
                    <p className="text-foreground text-sm font-semibold tracking-wide uppercase">{item.step}</p>
                    <p className="text-muted-foreground mt-2">{item.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-heading text-4xl font-bold tracking-tight">
              Replace disconnected tools with one workflow
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
              If your team is still stitching together docs, spreadsheets, and PDFs, Kitasuro gives
              you a cleaner way to run proposal operations at scale.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium shadow-sm transition-colors"
              >
                Create your account
              </Link>
              <Link
                href="/compare"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-medium shadow-sm transition-colors"
              >
                Compare alternatives
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
