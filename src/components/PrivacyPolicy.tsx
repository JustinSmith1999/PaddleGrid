import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-3xl mx-auto flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight">
              <span className="text-[#1B2A4A]">Paddle</span>
              <span className="text-[#6DB33F]">Grid</span>
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-[#1B2A4A] mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: May 2, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-gray-600">
          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">1. Introduction</h2>
            <p>
              PaddleGrid (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by J20 Solutions LLC. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use the PaddleGrid mobile application and website
              (collectively, the &quot;Service&quot;). By using the Service, you agree to the collection and use of information in
              accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">2. Information We Collect</h2>
            <h3 className="text-sm font-semibold text-[#1B2A4A] mt-4 mb-2">2.1 Information You Provide</h3>
            <p className="mb-2">When you create an account or use our Service, you may provide:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name, email address, and profile photo</li>
              <li>Phone number (optional)</li>
              <li>Skill level and playing preferences</li>
              <li>Payment information (processed securely via Stripe — we never store card numbers)</li>
              <li>Venue and facility information (for venue operators)</li>
              <li>Content you post in community feeds, messages, and match results</li>
            </ul>

            <h3 className="text-sm font-semibold text-[#1B2A4A] mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <p className="mb-2">When you use the Service, we automatically collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Device information (device type, operating system, unique device identifiers)</li>
              <li>Usage data (features used, pages viewed, actions taken)</li>
              <li>Location data (only with your explicit permission, to show nearby courts)</li>
              <li>Log data (IP address, browser type, access times)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process court bookings and payments</li>
              <li>Match you with players at your skill level</li>
              <li>Send booking confirmations, reminders, and notifications</li>
              <li>Display nearby courts and venues</li>
              <li>Track your playing statistics and achievements</li>
              <li>Respond to your requests and provide customer support</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">4. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services that may collect information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> — Authentication and database hosting with row-level security.</li>
              <li><strong>Stripe</strong> — Payment processing. Stripe&apos;s privacy policy governs payment data.</li>
              <li><strong>Apple Sign In / Google Sign In</strong> — Optional authentication, subject to their respective privacy policies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">5. Data Sharing</h2>
            <p className="mb-2">We do not sell your personal information. We may share your information only:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>With venue operators</strong> — when you book a court, the venue receives your name and booking details.</li>
              <li><strong>With other players</strong> — your profile name, skill level, and match history may be visible to other users.</li>
              <li><strong>Service providers</strong> — companies that help operate our Service (hosting, analytics, payment processing).</li>
              <li><strong>Legal requirements</strong> — when required by law, regulation, or legal process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS/SSL),
              encryption at rest, row-level security policies, and PCI-compliant payment processing through Stripe.
              No method of electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">7. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — update or correct inaccurate information in your profile.</li>
              <li><strong>Deletion</strong> — request deletion of your account and associated data via Settings &gt; Account &gt; Delete Account. There is a 30-day grace period during which you can cancel.</li>
              <li><strong>Data portability</strong> — request your data in a machine-readable format.</li>
              <li><strong>Opt-out</strong> — disable notifications, location services, or marketing communications at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">8. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active. When you delete your account,
              we delete or anonymize your data within 30 days, except where retention is required for legal or
              legitimate business purposes (e.g., transaction records for tax compliance).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for children under 13. We do not knowingly collect personal information
              from children under 13. If you believe we have collected information from a child under 13, please
              contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by
              posting the new policy on this page and updating the &quot;Last updated&quot; date. Continued use of the
              Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">11. Contact Us</h2>
            <p className="mb-3">If you have questions about this Privacy Policy or your personal data, contact us:</p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="font-semibold text-[#1B2A4A]">J20 Solutions LLC</p>
              <p>Email: <a href="mailto:Justin@j20solutions.com" className="text-[#6DB33F] hover:underline">Justin@j20solutions.com</a></p>
            </div>
          </section>
        </div>
      </div>

      <footer className="bg-[#1B2A4A] text-white mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center text-xs text-white/40 gap-2">
          <span>&copy; {new Date().getFullYear()} PaddleGrid. All rights reserved.</span>
          <span>J20 Solutions LLC</span>
        </div>
      </footer>
    </div>
  );
}
