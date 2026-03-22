import Link from 'next/link';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Book a demo', href: '/demo' },
      { label: 'See sample itinerary', href: '/proposal/5a428b26-dde0-4ae8-a3a8-93c8f3938527' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'For tour operators', href: '/for-tour-operators' },
      { label: 'Login', href: '/login' },
      { label: 'Sign up', href: '/sign-up' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[rgba(38,27,7,0.1)] px-6 py-12 md:py-16 lg:px-28">
      <div className="mx-auto max-w-[1216px]">
        {/* Top row */}
        <div className="flex flex-col gap-8 md:flex-row md:gap-12">
          {/* Brand */}
          <div className="w-full md:w-[280px] md:shrink-0">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#261B07]">
                <span className="text-sm font-bold leading-none text-[#F8F7F5]">R</span>
              </div>
              <span className="text-base font-semibold tracking-[-0.3px] text-[#261B07]">
                Ratiba
              </span>
            </Link>
            <p className="mt-3 text-base leading-[150%] text-[rgba(38,27,7,0.6)]">
              Ratiba helps travel teams build itineraries faster and send proposals clients can
              review, comment on, and approve.
            </p>
          </div>

          {/* Link columns */}
          {/*{columns.map((col) => (*/}
          {/*  <div key={col.title} className="flex-1">*/}
          {/*    <h3 className="mb-4 text-sm leading-[18px] font-[490] text-[rgba(38,27,7,0.5)]">*/}
          {/*      {col.title}*/}
          {/*    </h3>*/}
          {/*    <ul className="flex flex-col gap-3">*/}
          {/*      {col.links.map((link) => (*/}
          {/*        <li key={link.label}>*/}
          {/*          <Link*/}
          {/*            href={link.href}*/}
          {/*            className="text-base leading-5 text-[#261B07] transition-opacity hover:opacity-60"*/}
          {/*          >*/}
          {/*            {link.label}*/}
          {/*          </Link>*/}
          {/*        </li>*/}
          {/*      ))}*/}
          {/*    </ul>*/}
          {/*  </div>*/}
          {/*))}*/}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-[rgba(38,27,7,0.1)] pt-6">
          <p className="text-sm leading-[18px] text-[rgba(38,27,7,0.4)]">
            2026 Ratiba
          </p>
        </div>
      </div>
    </footer>
  );
}
