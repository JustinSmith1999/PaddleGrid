/**
 * PaddleGrid Terms of Service
 * Operator: J20 Solutions LLC
 *
 * Drafted for general U.S. consumer use. Not legal advice — review with
 * counsel before launch.
 */
const EFFECTIVE_DATE = 'June 5, 2026';

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] pb-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-12">
        <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-800 font-bold">Legal</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-emerald-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif", letterSpacing: '-0.005em' }}>
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {EFFECTIVE_DATE}</p>

        <article className="mt-8 space-y-7 text-[15px] leading-relaxed text-slate-700">
          <p className="text-base">
            These Terms of Service (the &ldquo;Terms&rdquo;) form a binding agreement between you and J20 Solutions LLC (&ldquo;PaddleGrid,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;), and govern your access to and use of the PaddleGrid websites, mobile applications, and related services (the &ldquo;Services&rdquo;). By creating an account or using the Services, you agree to these Terms.
          </p>

          <Section title="1. Eligibility">
            <p>You must be at least 13 years old to use the Services. If you are under 18, you may use the Services only with parent or guardian consent. By using the Services, you represent that you can form a binding contract with us.</p>
          </Section>

          <Section title="2. Your account">
            <p>You are responsible for the information you provide and for all activity that occurs under your account. Keep your password secure. Notify us immediately at <a className="text-emerald-700 hover:text-emerald-900 underline" href="mailto:support@paddlegrid.com">support@paddlegrid.com</a> if you suspect unauthorized use.</p>
            <p>You may not impersonate others, create accounts to evade enforcement, or maintain more than one account without our permission.</p>
          </Section>

          <Section title="3. Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Services to break any law or to facilitate harm to another person.</li>
              <li>Post content that is harassing, hateful, defamatory, sexually explicit, or that infringes intellectual property rights.</li>
              <li>Misuse booking, match, or payment features (e.g. mass cancellations, scalping court time, no-show abuse).</li>
              <li>Attempt to reverse engineer, decompile, or otherwise probe the Services beyond what is permitted by law.</li>
              <li>Scrape data, send automated requests, or load-test the Services without our prior written permission.</li>
              <li>Use the Services to send spam, chain messages, or unsolicited commercial communications.</li>
            </ul>
            <p>We may remove content or suspend accounts that violate these rules, with or without notice.</p>
          </Section>

          <Section title="4. Bookings, payments, and cancellation">
            <p>Court bookings, lessons, clinics, memberships, and merchandise purchases are sold by the facility, instructor, or merchant offering them — not by PaddleGrid. We act as the technology and payment-processing platform.</p>
            <p>Payments are processed by Stripe. By making a payment you authorize the relevant facility to charge your selected payment method and you agree to Stripe&rsquo;s terms.</p>
            <p>Cancellation, refund, and no-show policies are set by each facility and are displayed at the time of booking. PaddleGrid is not responsible for refunds outside what the facility offers, except where required by law.</p>
            <p>Membership tiers, including any subscriptions you initiate through PaddleGrid Business or facility memberships, auto-renew unless cancelled before the renewal date.</p>
          </Section>

          <Section title="5. User content">
            <p>You retain ownership of the content you post (text, photos, video, match recordings, etc.). By posting it on PaddleGrid, you grant us a worldwide, non-exclusive, royalty-free license to host, display, reproduce, and distribute that content as part of operating and promoting the Services. You can delete your content at any time, which terminates that license going forward (cached and backup copies will be removed within 30 days).</p>
            <p>You represent that you have all rights necessary to grant this license.</p>
          </Section>

          <Section title="6. Pros and ambassadors">
            <p>Verified PaddleGrid Pros may apply for the Pro program, accept ambassador relationships with facilities, and receive lesson or clinic requests through the Services. Pros are independent contractors of the facilities or learners they serve, not employees of PaddleGrid. Compensation and tax responsibility for lessons and clinics are between the Pro and their counterparty.</p>
          </Section>

          <Section title="7. Facility partners">
            <p>Facilities that subscribe to PaddleGrid Business are responsible for the accuracy of their listings, the safety of their courts, compliance with applicable law, and any waivers or releases they require from players. PaddleGrid is not a party to any agreement between a facility and a player.</p>
          </Section>

          <Section title="8. Sponsored content and partnerships">
            <p>The Services display sponsored placements clearly marked as such. Sponsorships do not constitute endorsement of any specific brand by PaddleGrid. Partnerships displayed on facility or pro profiles reflect commercial relationships disclosed by those parties.</p>
          </Section>

          <Section title="9. Intellectual property">
            <p>The PaddleGrid name, logo, and the design, layout, and content of the Services (other than user content) are owned by J20 Solutions LLC or its licensors and protected by copyright, trademark, and other laws. You may not use any of these without prior written permission.</p>
          </Section>

          <Section title="10. Termination">
            <p>You may close your account at any time. We may suspend or terminate your access to the Services if you violate these Terms, abuse the Services, or pose a safety or legal risk. Sections that by their nature should survive termination (intellectual-property ownership, disclaimers, liability limits, indemnification, dispute resolution) will continue to apply.</p>
          </Section>

          <Section title="11. Disclaimers">
            <p>PICKLEBALL IS A PHYSICAL ACTIVITY THAT INVOLVES RISK OF INJURY. PADDLEGRID DOES NOT OPERATE PHYSICAL COURTS, ORGANIZE PLAY, OR PROVIDE COACHING DIRECTLY. PARTICIPATION IN PICKLEBALL — INCLUDING AT ANY FACILITY OR EVENT BOOKED THROUGH THE SERVICES — IS AT YOUR OWN RISK.</p>
            <p>THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
          </Section>

          <Section title="12. Limitation of liability">
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, J20 SOLUTIONS LLC AND ITS AFFILIATES, EMPLOYEES, AND CONTRACTORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, ARISING OUT OF OR IN CONNECTION WITH THE SERVICES OR THESE TERMS.</p>
            <p>OUR TOTAL LIABILITY ARISING OUT OF OR RELATING TO THE SERVICES WILL NOT EXCEED THE GREATER OF (A) $100 OR (B) THE AMOUNTS YOU PAID TO PADDLEGRID IN THE TWELVE MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.</p>
          </Section>

          <Section title="13. Indemnification">
            <p>You agree to indemnify and hold harmless J20 Solutions LLC and its affiliates from any claim, liability, or expense (including reasonable attorneys&rsquo; fees) arising out of your violation of these Terms, your misuse of the Services, or your violation of any law or the rights of a third party.</p>
          </Section>

          <Section title="14. Governing law and disputes">
            <p>These Terms are governed by the laws of the State of New York, without regard to its conflict-of-laws principles. Any dispute will be resolved exclusively in the state or federal courts located in Suffolk County, New York, and you consent to personal jurisdiction there.</p>
            <p>If you reside in a jurisdiction whose law mandates a different forum or a right to arbitration, those rights are preserved to the extent required.</p>
          </Section>

          <Section title="15. Changes">
            <p>We may update these Terms from time to time. We will post the revised version with an updated &ldquo;Last updated&rdquo; date. If we make material changes we will notify you. Continued use of the Services after a change means you accept the revised Terms.</p>
          </Section>

          <Section title="16. Contact">
            <p>J20 Solutions LLC<br/>Email: <a className="text-emerald-700 hover:text-emerald-900 underline" href="mailto:support@paddlegrid.com">support@paddlegrid.com</a></p>
          </Section>
        </article>

        <p className="text-xs text-slate-400 mt-12">© {new Date().getFullYear()} J20 Solutions LLC. All rights reserved.</p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[17px] font-bold text-emerald-900 pt-1" style={{ letterSpacing: '-0.005em' }}>{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
