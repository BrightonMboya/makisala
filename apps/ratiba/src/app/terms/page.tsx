import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
  title: 'Terms of Service | Ratiba',
  description: 'The terms that govern your use of Ratiba.',
};

const LAST_UPDATED = 'August 22, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 584,
          letterSpacing: '-0.4px',
          lineHeight: '1.3',
        }}
      >
        {title}
      </h2>
      <div
        className="mt-4 flex flex-col gap-4 text-[rgba(38,27,7,0.75)]"
        style={{ fontSize: '16px', lineHeight: '26px' }}
      >
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="bg-[#F8F7F5] text-[#261B07]">
      <Navbar />

      <main>
        <section style={{ padding: '80px 0 40px' }}>
          <div className="mx-auto max-w-[760px] px-6">
            <h1
              style={{
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontWeight: 584,
                letterSpacing: '-1.12px',
                lineHeight: '1.1',
              }}
            >
              Terms of Service
            </h1>
            <p className="mt-4 text-sm text-[rgba(38,27,7,0.5)]">Last updated: {LAST_UPDATED}</p>

            <p
              className="mt-8 text-[rgba(38,27,7,0.75)]"
              style={{ fontSize: '16px', lineHeight: '26px' }}
            >
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Ratiba, operated by
              Brighton Benedict Mboya (&ldquo;Ratiba&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;).
              By creating an account or using the Service, you agree to these Terms.
            </p>

            <Section title="The Service">
              <p>
                Ratiba is a software platform that helps tour operators build itineraries,
                calculate pricing, and send client-facing proposals. We may add, change, or remove
                features over time.
              </p>
            </Section>

            <Section title="Accounts">
              <p>
                You&apos;re responsible for maintaining the security of your account credentials
                and for all activity that occurs under your account, including activity performed
                on your behalf by a connected AI assistant (see &ldquo;Third-party
                integrations&rdquo; below). Notify us promptly of any unauthorized use.
              </p>
            </Section>

            <Section title="Subscriptions and billing">
              <p>
                Paid plans are billed in advance on a recurring basis through our payment
                processor, Polar. Fees are non-refundable except where required by law. We may
                change our pricing with reasonable advance notice to active subscribers.
              </p>
            </Section>

            <Section title="Your data and your clients' data">
              <p>
                You retain ownership of the itinerary, pricing, and client data you enter into
                Ratiba. As between you and us, you are the data controller for information about
                your own clients and travelers that you input or invite through the Service, and
                you&apos;re responsible for having the right to share that information with us and
                for complying with applicable data protection law in your own client
                relationships. We process that data solely to provide the Service to you.
              </p>
            </Section>

            <Section title="Acceptable use">
              <p>You agree not to:</p>
              <ul className="ml-5 flex list-disc flex-col gap-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to the Service or other accounts</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Reverse-engineer or resell the Service without our written consent</li>
              </ul>
            </Section>

            <Section title="Third-party integrations">
              <p>
                Ratiba integrates with third-party services (Google, Polar, and others) and offers
                an optional connector that lets you operate your account from ChatGPT, Claude, or
                similar AI assistants via the Model Context Protocol. Actions those assistants take
                on your behalf are subject to the access and instructions you give them — we
                aren&apos;t responsible for the assistant provider&apos;s own conduct, and you use
                these integrations at your own discretion.
              </p>
            </Section>

            <Section title="Intellectual property">
              <p>
                We own all rights in the Service itself, excluding data you input. You&apos;re
                granted a limited, non-exclusive, non-transferable license to use the Service for
                your business during your subscription.
              </p>
            </Section>

            <Section title="Disclaimers and limitation of liability">
              <p>
                The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the
                maximum extent permitted by law, we are not liable for indirect, incidental, or
                consequential damages arising from your use of the Service, and our total
                liability for any claim is limited to the amount you paid us in the twelve months
                preceding the claim.
              </p>
            </Section>

            <Section title="Termination">
              <p>
                You may cancel your subscription at any time. We may suspend or terminate your
                access if you materially breach these Terms. On termination, you may request an
                export of your data within a reasonable period.
              </p>
            </Section>

            <Section title="Changes to these Terms">
              <p>
                We may update these Terms from time to time. We&apos;ll update the &ldquo;Last
                updated&rdquo; date above when we do, and material changes will be communicated to
                account holders.
              </p>
            </Section>

            <Section title="Governing law">
              <p>
                These Terms are governed by the laws of Tanzania, without regard to its conflict
                of law principles. Any dispute arising from these Terms or the Service will be
                subject to the exclusive jurisdiction of the courts of Tanzania.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions about these Terms? Email us at{' '}
                <a href="mailto:sales@ratiba.io" className="text-[#261B07] underline">
                  sales@ratiba.io
                </a>
                .
              </p>
            </Section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
