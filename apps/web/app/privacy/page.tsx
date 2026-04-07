import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Paddock",
  description: "How Paddock collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main
      className="min-h-dvh bg-[--color-surface-dim] text-[--color-on-surface]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1
          className="text-4xl font-black italic text-[--color-primary] mb-2 tracking-tight"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          PRIVACY_POLICY
        </h1>
        <p className="text-sm text-[--color-on-surface-variant] mb-12">
          Last updated: April 2026
        </p>

        <div className="space-y-10 text-sm leading-relaxed">
          <Section heading="Data We Collect">
            <p>We collect the minimum data needed to provide the service:</p>
            <ul>
              <li><strong>Account information</strong> — email address and display name, provided via Clerk (Google OAuth or email link).</li>
              <li><strong>Push notification tokens</strong> — device tokens for breaking news and race alerts; retained only while notifications are enabled.</li>
              <li><strong>Saved articles</strong> — article IDs you explicitly bookmark.</li>
              <li><strong>Reading preferences</strong> — series filters, pane layout, and notification settings.</li>
              <li><strong>Usage logs</strong> — standard server logs (IP, user-agent, timestamp) kept for 30 days for security and debugging.</li>
            </ul>
            <p>We do not collect payment information, location data, or device contacts.</p>
          </Section>

          <Section heading="How We Use Your Data">
            <p>Your data is used solely to operate and improve Paddock:</p>
            <ul>
              <li>Authenticating your account and persisting your session.</li>
              <li>Syncing saved articles and preferences across devices.</li>
              <li>Delivering push notifications when you have enabled them.</li>
              <li>Diagnosing errors using aggregated, anonymised usage patterns.</li>
            </ul>
            <p><strong>We do not sell, rent, or trade your personal data</strong> to any third party, and we do not use it for advertising profiling.</p>
          </Section>

          <Section heading="Third-Party Services">
            <p>Paddock uses the following sub-processors, each bound by their own privacy agreements:</p>
            <ul>
              <li><strong>Clerk</strong> — authentication and session management. <ExternalLink href="https://clerk.com/legal/privacy">clerk.com/legal/privacy</ExternalLink></li>
              <li><strong>Neon (PostgreSQL)</strong> — SOC 2 compliant storage for saved articles, preferences, and push tokens. <ExternalLink href="https://neon.tech/privacy-policy">neon.tech/privacy-policy</ExternalLink></li>
              <li><strong>Vercel</strong> — web application hosting and server-side request processing. <ExternalLink href="https://vercel.com/legal/privacy-policy">vercel.com/legal/privacy-policy</ExternalLink></li>
            </ul>
          </Section>

          <Section heading="Data Retention">
            <p>
              Account data is retained for as long as your account is active. Upon deletion,
              all personal data (email, saved articles, preferences, push tokens) is permanently
              removed within 30 days. Server logs are purged on a rolling 30-day basis.
              You may request deletion at any time by contacting us below.
            </p>
          </Section>

          <Section heading="Contact">
            <p>
              Questions, access requests, or deletion requests:{" "}
              <a href="mailto:privacy@paddock.app" className="text-[--color-primary] underline underline-offset-2">
                privacy@paddock.app
              </a>
              . We aim to respond within 5 business days.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="font-bold text-sm tracking-widest uppercase text-[--color-on-surface-variant] mb-4"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {heading}
      </h2>
      <div className="space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[--color-primary] underline underline-offset-2">
      {children}
    </a>
  );
}
