import Link from 'next/link';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Book a demo', href: '/demo' },
      { label: 'See sample proposal', href: '/proposal/5a428b26-dde0-4ae8-a3a8-93c8f3938527' },
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
    <footer
      className="border-t px-6 py-12 md:py-16 lg:px-28"
      style={{
        borderColor: 'rgba(38,27,7,0.1)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '1216px' }}>
        {/* Top row */}
        <div className="flex flex-col gap-8 md:flex-row md:gap-12">
          {/* Brand */}
          <div className="w-full md:w-[280px] md:shrink-0">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ backgroundColor: '#261B07' }}
              >
                <span className="text-sm leading-none font-bold" style={{ color: '#F8F7F5' }}>
                  R
                </span>
              </div>
              <span
                className="text-base"
                style={{ color: '#261B07', fontWeight: 600, letterSpacing: '-0.3px' }}
              >
                Ratiba
              </span>
            </Link>
            <p
              className="mt-3"
              style={{
                fontSize: '16px',
                lineHeight: '150%',
                color: 'rgba(38,27,7,0.6)',
                fontWeight: 400,
              }}
            >
              Ratiba helps travel teams build itineraries faster and send proposals clients can
              review, comment on, and approve.
            </p>
          </div>

          {/* Link columns */}
          {/*{columns.map((col) => (*/}
          {/*  <div key={col.title} className="flex-1">*/}
          {/*    <h3*/}
          {/*      className="mb-4"*/}
          {/*      style={{*/}
          {/*        fontSize: '14px',*/}
          {/*        lineHeight: '18px',*/}
          {/*        color: 'rgba(38,27,7,0.5)',*/}
          {/*        fontWeight: 490,*/}
          {/*      }}*/}
          {/*    >*/}
          {/*      {col.title}*/}
          {/*    </h3>*/}
          {/*    <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>*/}
          {/*      {col.links.map((link) => (*/}
          {/*        <li key={link.label}>*/}
          {/*          <Link*/}
          {/*            href={link.href}*/}
          {/*            className="transition-opacity hover:opacity-60"*/}
          {/*            style={{*/}
          {/*              fontSize: '16px',*/}
          {/*              lineHeight: '20px',*/}
          {/*              color: '#261B07',*/}
          {/*              fontWeight: 400,*/}
          {/*            }}*/}
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
        <div className="mt-12 border-t pt-6" style={{ borderColor: 'rgba(38,27,7,0.1)' }}>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '18px',
              color: 'rgba(38,27,7,0.4)',
              fontWeight: 400,
            }}
          >
            2026 Ratiba
          </p>
        </div>
      </div>
    </footer>
  );
}
