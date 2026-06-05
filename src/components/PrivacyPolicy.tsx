/**
 * PaddleGrid Privacy Policy
 * Operator: J20 Solutions LLC (Justin Smith)
 *
 * Effective date: see EFFECTIVE_DATE constant.
 * Drafted for general U.S. consumer use with GDPR/CCPA-aware language.
 * Not legal advice — review with counsel before launch.
 */
const EFFECTIVE_DATE = 'June 5, 2026';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] pb-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-12">
        <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-800 font-bold">Legal</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-emerald-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif", letterSpacing: '-0.005em' }}>
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {EFFECTIVE_DATE}</p>

        <article className="mt-8 space-y-7 text-[15px] leading-relaxed text-slate-700">
          <p className="text-base">
            PaddleGrid (&ldquo;PaddleGrid,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is operated by J20 Solutions LLC. We respect your privacy. This Privacy Policy explains what information we collect about you when you use our websites, mobile apps, and related services (collectively, the &ldquo;Services&rdquo;), how we use it, when we share it, and the choices you have.
          </p>

          <Section title="1. Information we collect">
            <p><strong>Account information.</strong> When you create an account we collect your name, email address, password, and any profile information you add (avatar, DUPR rating, skill level, location).</p>
            <p><strong>Booking and play data.</strong> When you book a court, register for an event, or join a match request, we record the booking details, time, court, facility, players involved, payment amount (handled by Stripe — we do not store full card numbers), and play outcomes you choose to log.</p>
            <p><strong>Social content.</strong> Posts, comments, likes, story uploads, group memberships, and direct messages you send through the Services.</p>
            <p><strong>Device and usage data.</strong> IP address, device type, operating system, browser, app version, pages and features accessed, timestamps, and crash logs.</p>
            <p><strong>Location.</strong> Approximate location derived from IP address. If you grant precise location access in our mobile app, we use it solely to surface nearby facilities. You can revoke this at any time in your device settings.</p>
            <p><strong>Communications.</strong> If you contact us by email, chat, or any support channel, we keep the records of those exchanges.</p>
          </Section>

          <Section title="2. How we use information">
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, operate, and improve the Services.</li>
              <li>Process bookings and payments through our payment processor (Stripe).</li>
              <li>Personalize the feed, partner sponsor placements, and match recommendations.</li>
              <li>Send transactional emails (booking confirmations, security alerts) and optional product updates (you can opt out).</li>
              <li>Detect, prevent, and investigate fraud, abuse, or violations of our Terms of Service.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </Section>

          <Section title="3. How we share information">
            <p><strong>With facilities you interact with.</strong> When you book a court or join a session, the facility&rsquo;s administrators see your name, profile, booking details, and any waiver information you signed.</p>
            <p><strong>With other players.</strong> Your profile, posts, comments, and public match history are visible to other PaddleGrid users.</p>
            <p><strong>With service providers.</strong> Stripe (payments), Supabase (database hosting), Vercel (web hosting), Resend or SES (email delivery), Cloudflare (CDN). Each is contractually bound to use your information only to provide their services to us.</p>
            <p><strong>For legal reasons.</strong> If required by law, court order, or to protect rights, property, or safety.</p>
            <p><strong>In a business transfer.</strong> If we are acquired or merge with another company, your information may transfer to the successor entity.</p>
            <p>We do <strong>not</strong> sell your personal information to third parties.</p>
          </Section>

          <Section title="4. Sponsored content">
            <p>The Services display sponsored content (a brand or partner facility may pay to occupy a position at the top of certain pages). Sponsored items are clearly labeled. Sponsors do not receive your personal information unless you choose to click their content and provide it directly to the sponsor on their own site.</p>
          </Section>

          <Section title="5. Cookies and similar technologies">
            <p>We use cookies and local storage to keep you signed in, remember your preferences, measure feature usage, and understand performance. You can clear cookies in your browser settings; doing so will sign you out.</p>
          </Section>

          <Section title="6. Your choices and rights">
            <p>You can edit or delete most profile information from your account settings. You can deactivate your account at any time from <code className="text-[13px] bg-slate-100 px-1 py-0.5 rounded">/account/delete</code>; deactivation triggers deletion of your personal data within 30 days, subject to retention requirements below.</p>
            <p><strong>If you are in the European Economic Area, United Kingdom, or Switzerland (GDPR/UK GDPR):</strong> you have the right to access, rectify, port, or erase your personal data; to restrict or object to processing; and to lodge a complaint with your supervisory authority. Contact us to exercise any of these rights.</p>
            <p><strong>If you are a California resident (CCPA/CPRA):</strong> you have the right to know what personal information we collect, to request deletion, to correct inaccurate information, to opt out of any sale or sharing of your personal information, and to non-discrimination for exercising your rights. We do not sell your information, but you can submit a request at the email below.</p>
          </Section>

          <Section title="7. Data retention">
            <p>We keep your information as long as your account is active. After deactivation we delete personal data within 30 days, except records we are required to retain for tax, regulatory, fraud-prevention, or legal-claim purposes (typically up to 7 years for financial records).</p>
          </Section>

          <Section title="8. Security">
            <p>We use industry-standard security including TLS in transit, encryption at rest, role-based access controls, and Postgres row-level security. No system is perfectly secure; if we become aware of a breach affecting your data, we will notify you in accordance with applicable law.</p>
          </Section>

          <Section title="9. Children">
            <p>The Services are intended for users 13 years and older. We do not knowingly collect information from children under 13. Junior pickleball programs intended for minors require parent/guardian sign-up and supervision.</p>
          </Section>

          <Section title="10. International transfers">
            <p>Our systems are operated in the United States. If you access the Services from outside the U.S., you understand that your information will be transferred to and processed in the United States, which may have different data-protection laws than your country.</p>
          </Section>

          <Section title="11. Changes to this Policy">
            <p>We may update this Privacy Policy from time to time. If we make material changes, we will notify you in the app and update the &ldquo;Last updated&rdquo; date above. Continued use of the Services after the changes take effect means you accept the revised Policy.</p>
          </Section>

          <Section title="12. Contact us">
            <p>J20 Solutions LLC<br/>Email: <a className="text-emerald-700 hover:text-emerald-900 underline" href="mailto:privacy@paddlegrid.com">privacy@paddlegrid.com</a><br/>For GDPR or CCPA requests, please mark the subject &ldquo;Privacy Request.&rdquo;</p>
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
