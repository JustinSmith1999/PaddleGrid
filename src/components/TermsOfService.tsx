import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
        <h1 className="text-3xl font-extrabold text-[#1B2A4A] mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: May 2, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-gray-600">
          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using PaddleGrid&apos;s website, mobile application, or services (&quot;Services&quot;), you
              agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these
              Terms, you may not access or use our Services. PaddleGrid is operated by J20 Solutions LLC.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">2. Description of Services</h2>
            <p className="mb-2">PaddleGrid provides a platform connecting pickleball facilities with players. Our Services include:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Court booking and reservation management</li>
              <li>Event and tournament registration</li>
              <li>Player profiles and statistics tracking</li>
              <li>Social features including posts, comments, and messaging</li>
              <li>Payment processing for bookings and events</li>
              <li>Facility management tools for venue operators</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">3. User Accounts</h2>
            <p className="mb-2">To use certain features, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
              <li>Be at least 13 years old to create an account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">4. Account Deletion</h2>
            <p>
              You may delete your account at any time through Settings &gt; Account &gt; Delete Account.
              Upon requesting deletion, your account enters a 30-day grace period during which you may
              cancel the request and restore your account. After 30 days, your account and associated
              personal data will be permanently deleted. Certain transaction records may be retained as
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">5. Bookings and Payments</h2>
            <p className="mb-2">When making bookings through PaddleGrid:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You agree to pay all fees associated with your bookings</li>
              <li>Payments are processed securely through Stripe</li>
              <li>Cancellation policies vary by facility — review before booking</li>
              <li>Refunds are subject to facility policies and may take 5–10 business days</li>
              <li>You are responsible for arriving on time for your booking</li>
              <li>Facilities reserve the right to refuse service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">6. User Content and Conduct</h2>
            <p className="mb-2">You may post content on PaddleGrid (&quot;User Content&quot;). You agree not to post content that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Is illegal, harmful, or offensive</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains spam, advertising, or unsolicited commercial content</li>
              <li>Impersonates others or misrepresents your identity</li>
              <li>Contains malware, viruses, or harmful code</li>
              <li>Harasses, threatens, or bullies other users</li>
              <li>Contains false or misleading information</li>
            </ul>
            <p className="mt-3">
              You grant PaddleGrid a non-exclusive, worldwide, royalty-free license to use, display, and
              distribute your User Content in connection with our Services. You retain ownership of your content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">7. Content Moderation</h2>
            <p>
              We reserve the right to monitor, review, and remove User Content that violates these Terms.
              Users can report inappropriate content. Content with multiple reports may be automatically
              hidden pending review. We are not responsible for User Content but will take appropriate action
              when violations are reported.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">8. Facility Responsibilities</h2>
            <p className="mb-2">Facilities using PaddleGrid agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintain accurate court availability and pricing</li>
              <li>Honor confirmed bookings</li>
              <li>Provide safe and well-maintained facilities</li>
              <li>Respond to booking inquiries in a timely manner</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Process refunds according to their stated policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">9. Intellectual Property</h2>
            <p>
              PaddleGrid and its content (excluding User Content) are protected by copyright, trademark, and
              other intellectual property laws. You may not copy, modify, distribute, or create derivative
              works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">10. Disclaimers</h2>
            <p className="uppercase text-xs tracking-wide">
              Our Services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or
              implied. We do not warrant that our Services will be uninterrupted, error-free, or secure.
              PaddleGrid is a platform connecting facilities and players; we are not responsible for the
              quality, safety, or legality of facilities or events listed on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">11. Limitation of Liability</h2>
            <p className="uppercase text-xs tracking-wide">
              To the maximum extent permitted by law, J20 Solutions LLC shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
              whether incurred directly or indirectly, or any loss of data, use, or goodwill arising from
              your use of our Services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless J20 Solutions LLC and PaddleGrid from any claims,
              damages, losses, liabilities, and expenses (including legal fees) arising from your use of our
              Services, your User Content, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">13. Termination</h2>
            <p>
              We may terminate or suspend your account and access to our Services at any time, without prior
              notice, for conduct that we believe violates these Terms or is harmful to other users, us, or
              third parties. You may delete your account at any time through the app settings or by contacting
              us at Justin@j20solutions.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">14. Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms or our Services shall be resolved through binding arbitration
              in accordance with the rules of the American Arbitration Association. You waive your right to
              participate in class action lawsuits or class-wide arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">15. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of changes by
              posting the new Terms on this page and updating the &quot;Last updated&quot; date. Continued use of
              our Services after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">16. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Florida,
              United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">17. Contact Us</h2>
            <p className="mb-3">If you have questions about these Terms, please contact us:</p>
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
