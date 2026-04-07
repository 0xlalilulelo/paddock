import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA Takedown — Paddock",
  description: "Submit a DMCA takedown notice or counter-notice to Paddock.",
};

const DMCA_EMAIL = "dmca@paddock.app";

const NOTICE_ELEMENTS = [
  "A physical or electronic signature of the copyright owner or an authorised agent.",
  "Identification of the copyrighted work claimed to have been infringed.",
  "Identification of the material to be removed, with enough detail for us to locate it (URL preferred).",
  "Your contact information: name, address, telephone number, and email address.",
  'A statement that you have a good-faith belief that the use of the material is not authorised by the copyright owner, its agent, or the law.',
  'A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or are authorised to act on their behalf.',
];

const COUNTER_ELEMENTS = [
  "Your physical or electronic signature.",
  "Identification of the material that was removed and the URL where it previously appeared.",
  "A statement under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification.",
  "Your name, address, telephone number, and a statement that you consent to the jurisdiction of the federal district court for your address.",
];

export default function DmcaPage() {
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
          DMCA_TAKEDOWN
        </h1>
        <p className="text-sm text-[--color-on-surface-variant] mb-12">
          Last updated: April 2026
        </p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2
              className="font-bold text-sm tracking-widest uppercase text-[--color-on-surface-variant] mb-4"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              About Paddock
            </h2>
            <p>
              Paddock is a motorsport news aggregator that surfaces publicly
              available headlines and article excerpts from third-party publishers.
              We respect intellectual property rights and respond promptly to
              valid takedown notices under the Digital Millennium Copyright Act
              (DMCA), 17 U.S.C. § 512.
            </p>
          </section>

          <section>
            <h2
              className="font-bold text-sm tracking-widest uppercase text-[--color-on-surface-variant] mb-4"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Filing a Takedown Notice
            </h2>
            <p className="mb-4">
              To submit a DMCA notice, send a written communication to{" "}
              <a
                href={`mailto:${DMCA_EMAIL}`}
                className="text-[--color-primary] underline underline-offset-2"
              >
                {DMCA_EMAIL}
              </a>{" "}
              containing all six of the following elements:
            </p>
            <ol className="list-decimal pl-5 space-y-3">
              {NOTICE_ELEMENTS.map((el, i) => (
                <li key={i}>{el}</li>
              ))}
            </ol>
            <p className="mt-4 text-[--color-on-surface-variant]">
              Notices that omit required elements may not be acted upon. We
              reserve the right to forward notices to the party that posted the
              material.
            </p>
          </section>

          <section>
            <h2
              className="font-bold text-sm tracking-widest uppercase text-[--color-on-surface-variant] mb-4"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Counter-Notice
            </h2>
            <p className="mb-4">
              If you believe material was removed in error, you may submit a
              counter-notice to{" "}
              <a
                href={`mailto:${DMCA_EMAIL}`}
                className="text-[--color-primary] underline underline-offset-2"
              >
                {DMCA_EMAIL}
              </a>{" "}
              containing:
            </p>
            <ol className="list-decimal pl-5 space-y-3">
              {COUNTER_ELEMENTS.map((el, i) => (
                <li key={i}>{el}</li>
              ))}
            </ol>
            <p className="mt-4 text-[--color-on-surface-variant]">
              Upon receipt of a valid counter-notice we will forward it to the
              original complainant. If the complainant does not file suit within
              10 business days, we may restore the material at our discretion.
            </p>
          </section>

          <section>
            <h2
              className="font-bold text-sm tracking-widest uppercase text-[--color-on-surface-variant] mb-4"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Contact
            </h2>
            <p>
              All copyright-related correspondence should be directed to{" "}
              <a
                href={`mailto:${DMCA_EMAIL}`}
                className="text-[--color-primary] underline underline-offset-2"
              >
                {DMCA_EMAIL}
              </a>
              . We aim to acknowledge notices within 2 business days.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
