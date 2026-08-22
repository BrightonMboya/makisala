import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Mail } from 'lucide-react';

export const metadata = {
  title: 'Contact | Ratiba',
  description: 'Get in touch with the Ratiba team.',
};

export default function ContactPage() {
  return (
    <div className="bg-[#F8F7F5] text-[#261B07]">
      <Navbar />

      <main>
        <section style={{ padding: '80px 0 120px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[rgba(38,27,7,0.1)] bg-white px-3 py-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[#261B07]">
                <span className="text-[10px] font-bold text-[#F8F7F5]">R</span>
              </div>
              <span className="text-sm font-medium">Contact</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(40px, 5vw, 64px)',
                fontWeight: 584,
                letterSpacing: '-1.28px',
                lineHeight: '1.1',
              }}
            >
              Get in touch
            </h1>

            <p
              className="mt-6 max-w-xl text-[rgba(38,27,7,0.7)]"
              style={{ fontSize: '18px', lineHeight: '28px' }}
            >
              Questions about Ratiba, a demo request, or support with your account — reach us at
              the email below and we&apos;ll respond within one business day.
            </p>

            <a
              href="mailto:sales@ratiba.io"
              className="mt-8 inline-flex items-center gap-3 rounded-xl border border-[rgba(38,27,7,0.12)] bg-white px-6 py-4 text-lg font-medium text-[#261B07] transition-opacity hover:opacity-80"
            >
              <Mail className="h-5 w-5" style={{ color: 'rgba(38,27,7,0.5)' }} />
              sales@ratiba.io
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
