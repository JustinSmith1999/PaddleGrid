import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using PaddleGrid's website, mobile application, or services ("Services"), you
              agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these
              Terms, you may not access or use our Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description of Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              PaddleGrid provides a platform that connects pickleball facilities with players. Our Services include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Court booking and reservation management</li>
              <li>Event and tournament registration</li>
              <li>Player profiles and statistics tracking</li>
              <li>Social features including posts, comments, and messaging</li>
              <li>Payment processing for bookings and events</li>
              <li>Facility management tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use certain features of our Services, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities that occur under your account</li>
              <li>Be at least 13 years old to create an account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bookings and Payments</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When making bookings through PaddleGrid:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>You agree to pay all fees associated with your bookings</li>
              <li>Payments are processed securely through Stripe</li>
              <li>Cancellation policies vary by facility - review before booking</li>
              <li>Refunds are subject to facility policies and may take 5-10 business days</li>
              <li>You are responsible for arriving on time for your booking</li>
              <li>Facilities reserve the right to refuse service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Content and Conduct</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may post content on PaddleGrid ("User Content"). You agree not to post content that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Is illegal, harmful, or offensive</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains spam, advertising, or commercial content</li>
              <li>Impersonates others or misrepresents your identity</li>
              <li>Contains malware, viruses, or harmful code</li>
              <li>Harasses, threatens, or bullies others</li>
              <li>Contains false or misleading information</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You grant PaddleGrid a non-exclusive, worldwide, royalty-free license to use, display, and
              distribute your User Content in connection with our Services. You retain ownership of your content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Moderation</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to monitor, review, and remove User Content that violates these Terms.
              Users can report inappropriate content, and content with multiple reports may be automatically
              hidden pending review. We are not responsible for User Content but will take appropriate action
              when violations are reported.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              PaddleGrid and its content (excluding User Content) are protected by copyright, trademark, and
              other intellectual property laws. You may not copy, modify, distribute, or create derivative
              works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Facility Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Facilities using PaddleGrid agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Maintain accurate court availability and pricing</li>
              <li>Honor confirmed bookings</li>
              <li>Provide safe and well-maintained facilities</li>
              <li>Respond to booking inquiries in a timely manner</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Process refunds according to their stated policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimers</h2>
            <p className="text-gray-700 leading-relaxed">
              OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
              IMPLIED. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              PaddleGrid is a platform connecting facilities and players; we are not responsible for the
              quality, safety, or legality of facilities or events listed on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PADDLEGRID SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, OR GOODWILL ARISING FROM YOUR
              USE OF OUR SERVICES.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless PaddleGrid from any claims, damages, losses, liabilities,
              and expenses (including legal fees) arising from your use of our Services, your User Content, or
              your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account and access to our Services at any time, without prior
              notice, for conduct that we believe violates these Terms or is harmful to other users, us, or
              third parties, or for any other reason. You may terminate your account at any time by contacting
              support@paddlegrid.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">
              Any disputes arising from these Terms or our Services shall be resolved through binding arbitration
              in accordance with the rules of the American Arbitration Association. You waive your right to
              participate in class action lawsuits or class-wide arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of any changes by
              posting the new Terms on this page and updating the "Last updated" date. Your continued use of
              our Services after changes are posted constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United States,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> legal@paddlegrid.com</p>
              <p className="text-gray-700"><strong>Mail:</strong> PaddleGrid, Inc.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
