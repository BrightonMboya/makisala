import Link from 'next/link';

const ACCENT = '#261B07';
const PAPER = '#F8F7F5';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-20">
      <div className="flex flex-col gap-4">
        <span className="text-sm font-medium uppercase tracking-wider text-fd-muted-foreground">
          Ratiba Documentation
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Build itineraries, price safaris, send proposals.
        </h1>
        <p className="max-w-2xl text-lg text-fd-muted-foreground">
          Ratiba is the operating system for safari operators, DMCs, and travel agencies.
          This documentation covers everything from setting up your first rate card to
          sending a live, branded client proposal.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center rounded-md px-4 py-2 text-sm font-[580] transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT, color: PAPER }}
          >
            Read the docs
          </Link>
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center rounded-md border border-fd-border px-4 py-2 text-sm font-[580] hover:bg-fd-accent"
          >
            Get started in 10 minutes
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: 'Getting started',
            href: '/docs/getting-started',
            desc: 'Create your workspace, invite your team, and load your first content.',
          },
          {
            title: 'Rate cards',
            href: '/docs/rate-cards',
            desc: 'Model seasons, lodge rates, park fees, vehicles, and transfers.',
          },
          {
            title: 'Itineraries',
            href: '/docs/itineraries',
            desc: 'Build day-by-day trips with the AI builder and live pricing engine.',
          },
          {
            title: 'Proposals',
            href: '/docs/itineraries/proposals',
            desc: 'Send branded, interactive proposals clients can approve in a click.',
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-fd-border bg-fd-card p-5 transition hover:border-fd-primary/40 hover:bg-fd-accent/40"
          >
            <h3 className="font-semibold">{card.title}</h3>
            <p className="mt-1 text-sm text-fd-muted-foreground">{card.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
