import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
  title: 'Privacy Policy | Ratiba',
  description: 'How Ratiba collects, uses, and protects your data.',
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

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm text-[rgba(38,27,7,0.5)]">Last updated: {LAST_UPDATED}</p>

            <p
              className="mt-8 text-[rgba(38,27,7,0.75)]"
              style={{ fontSize: '16px', lineHeight: '26px' }}
            >
              Ratiba (&ldquo;Ratiba&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is an itinerary and
              proposal platform for tour operators, operated by Brighton Benedict Mboya. This
              policy explains what information we collect through ratiba.io and our application
              (together, the &ldquo;Service&rdquo;), how we use it, and the choices you have.
            </p>

            <Section title="Information we collect">
              <p>
                <strong className="text-[#261B07]">Account information.</strong> When you sign up,
                we collect your name, email address, and organization details, either directly or
                via Google OAuth sign-in.
              </p>
              <p>
                <strong className="text-[#261B07]">Client and itinerary data you enter.</strong>{' '}
                As an operator using Ratiba, you enter data about your own clients and trips —
                names, emails, phone numbers, country of residence, itinerary details, and
                pricing. Where our client-portal feature is enabled, travelers you invite may also
                submit passport and health information for booking purposes; these fields are
                encrypted at rest using AES-256-GCM encryption.
              </p>
              <p>
                <strong className="text-[#261B07]">Billing information.</strong> Subscription
                payments are processed by our payment processor, Polar; we do not store your card
                details ourselves.
              </p>
              <p>
                <strong className="text-[#261B07]">Usage data.</strong> We collect standard
                technical data (IP address, browser type, pages visited) to operate and secure the
                Service.
              </p>
            </Section>

            <Section title="How we use information">
              <p>
                We use the information we collect to provide and improve the Service, process
                payments, generate itinerary pricing and translations, communicate with you about
                your account, and comply with legal obligations. We do not sell your personal
                information or your clients&apos; personal information to third parties.
              </p>
            </Section>

            <Section title="Third-party service providers">
              <p>
                We rely on the following providers to operate Ratiba, each of which processes data
                only as necessary to provide their service to us:
              </p>
              <ul className="ml-5 flex list-disc flex-col gap-2">
                <li>Google (OAuth sign-in, Places, Translation, and Maps APIs)</li>
                <li>Polar (subscription billing)</li>
                <li>Resend (transactional email delivery)</li>
                <li>Cloudflare (image and file storage)</li>
                <li>Supabase (database hosting)</li>
                <li>Vercel (application hosting)</li>
                <li>Groq (AI-generated day-by-day itinerary copy)</li>
              </ul>
              <p>
                If you choose to connect Ratiba to ChatGPT, Claude, or another AI assistant via
                our Model Context Protocol (MCP) connector, that assistant can read and write
                proposal, client, and accommodation data in your Ratiba account on your behalf,
                subject to the access you grant it. We don&apos;t control what that assistant
                provider does with data during your session — review their own privacy policy
                before connecting.
              </p>
            </Section>

            <Section title="Data security">
              <p>
                We use industry-standard safeguards to protect your data, including encryption in
                transit (HTTPS) and at rest for sensitive fields such as passport and health
                information. No system is perfectly secure, and we cannot guarantee absolute
                security.
              </p>
            </Section>

            <Section title="Data retention">
              <p>
                We retain account and itinerary data for as long as your account is active, and
                for a reasonable period afterward to comply with legal, accounting, or reporting
                requirements. You can request deletion of your account and associated data at any
                time.
              </p>
            </Section>

            <Section title="Your rights">
              <p>
                Depending on where you&apos;re located, you may have the right to access, correct,
                export, or delete your personal information. To exercise any of these rights,
                contact us at{' '}
                <a href="mailto:sales@ratiba.io" className="text-[#261B07] underline">
                  sales@ratiba.io
                </a>
                .
              </p>
            </Section>

            <Section title="Children's privacy">
              <p>
                Ratiba is a business-to-business tool for tour operators and is not directed at
                children. We do not knowingly collect personal information from children.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                We may update this policy from time to time. We&apos;ll update the &ldquo;Last
                updated&rdquo; date above when we do, and material changes will be communicated to
                account holders.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions about this policy? Email us at{' '}
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
