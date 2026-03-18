import Link from 'next/link';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Book a demo', href: 'https://cal.com/brightonmboya/30min' },
      { label: 'Planning', href: '#' },
      { label: 'Modeling', href: '#' },
      { label: 'Reporting', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
  {
    title: 'Comparisons',
    links: [
      { label: 'Excel', href: '#' },
      { label: 'Abacum', href: '#' },
      { label: 'Datarails', href: '#' },
      { label: 'Mosaic', href: '#' },
      { label: 'Pigment', href: '#' },
      { label: 'Anaplan', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Success Stories', href: '#' },
      { label: 'AngelList', href: '#' },
      { label: 'RevenueCat', href: '#' },
      { label: 'Glossary', href: '#' },
      { label: 'Docs', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Runway blog', href: '#' },
      { label: 'About Runway', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact us', href: '#' },
    ],
  },
  {
    title: 'Social',
    links: [
      { label: 'YouTube', href: '#' },
      { label: 'Instagram', href: '#' },
      { label: 'LinkedIn', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="border-t"
      style={{
        paddingBlock: '64px',
        paddingInline: '112px',
        borderColor: 'rgba(38,27,7,0.1)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '1216px' }}>
        {/* Top row */}
        <div className="flex" style={{ gap: '48px' }}>
          {/* Brand */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ backgroundColor: '#261B07' }}
              >
                <span
                  className="text-sm font-bold leading-none"
                  style={{ color: '#F8F7F5' }}
                >
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
              Runway is the modern and intuitive way to model, plan, and align
              your business for everyone on your team.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="flex-1">
              <h3
                className="mb-4"
                style={{
                  fontSize: '14px',
                  lineHeight: '18px',
                  color: 'rgba(38,27,7,0.5)',
                  fontWeight: 490,
                }}
              >
                {col.title}
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition-opacity hover:opacity-60"
                      style={{
                        fontSize: '16px',
                        lineHeight: '20px',
                        color: '#261B07',
                        fontWeight: 400,
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex items-center justify-between border-t pt-6"
          style={{ borderColor: 'rgba(38,27,7,0.1)' }}
        >
          <p
            style={{
              fontSize: '14px',
              lineHeight: '18px',
              color: 'rgba(38,27,7,0.4)',
              fontWeight: 400,
            }}
          >
            2026
          </p>
          <div className="flex" style={{ gap: '24px' }}>
            <Link
              href="#"
              className="transition-opacity hover:opacity-60"
              style={{
                fontSize: '14px',
                lineHeight: '18px',
                color: 'rgba(38,27,7,0.4)',
                fontWeight: 400,
              }}
            >
              Terms of service
            </Link>
            <Link
              href="#"
              className="transition-opacity hover:opacity-60"
              style={{
                fontSize: '14px',
                lineHeight: '18px',
                color: 'rgba(38,27,7,0.4)',
                fontWeight: 400,
              }}
            >
              Privacy policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
