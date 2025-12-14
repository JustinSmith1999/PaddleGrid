import React from 'react';
import { Mail, MessageCircle, Book, HelpCircle } from 'lucide-react';

export default function Support() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help & Support</h1>
          <p className="text-xl text-gray-600">
            We're here to help you get the most out of PaddleGrid
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <Mail className="w-12 h-12 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Email Support</h2>
            <p className="text-gray-700 mb-4">
              Get help from our support team via email. We typically respond within 24 hours.
            </p>
            <a
              href="mailto:support@paddlegrid.com"
              className="inline-block px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Email Us
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <MessageCircle className="w-12 h-12 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Community Forum</h2>
            <p className="text-gray-700 mb-4">
              Connect with other players and facility owners in our community forum.
            </p>
            <button className="inline-block px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
              Visit Forum
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <div className="flex items-center mb-6">
            <Book className="w-8 h-8 text-emerald-500 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-emerald-500 mr-2" />
                How do I book a court?
              </h3>
              <p className="text-gray-700 ml-7">
                Browse available courts in the "Courts" section, select your desired time slot, and complete
                the booking with your payment information. You'll receive a confirmation email immediately.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-emerald-500 mr-2" />
                Can I cancel my booking?
              </h3>
              <p className="text-gray-700 ml-7">
                Yes, cancellation policies vary by facility. You can view the specific cancellation policy on
                the booking page. Most facilities allow cancellations with full refunds if done 24+ hours in
                advance.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-emerald-500 mr-2" />
                How do I report inappropriate content?
              </h3>
              <p className="text-gray-700 ml-7">
                Click the flag icon on any post or comment to report it. Select a reason and our moderation
                team will review the content. Content with multiple reports is automatically hidden pending review.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-emerald-500 mr-2" />
                Is my payment information secure?
              </h3>
              <p className="text-gray-700 ml-7">
                Yes! All payments are processed securely through Stripe, a PCI-compliant payment processor.
                We never store your complete payment card details on our servers.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-emerald-500 mr-2" />
                How do I update my profile?
              </h3>
              <p className="text-gray-700 ml-7">
                Click on your profile picture or name in the navigation bar, then select "Edit Profile." You
                can update your name, phone number, skill level, and profile picture.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-emerald-500 mr-2" />
                Can I register my facility on PaddleGrid?
              </h3>
              <p className="text-gray-700 ml-7">
                Yes! Contact us at facilities@paddlegrid.com to get started. We'll help you set up your
                facility profile, add courts, and start accepting bookings.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-emerald-500 mr-2" />
                How do I delete my account?
              </h3>
              <p className="text-gray-700 ml-7">
                To delete your account and all associated data, email us at privacy@paddlegrid.com with your
                request. We'll process your request within 30 days in accordance with data protection laws.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-emerald-500 mr-2" />
                Do you have a mobile app?
              </h3>
              <p className="text-gray-700 ml-7">
                Yes! PaddleGrid is available on both iOS and Android. Download from the App Store or Google
                Play Store to book courts and connect with players on the go.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-3">Still Need Help?</h2>
          <p className="text-emerald-50 mb-6">
            Our support team is here to assist you with any questions or issues you may have.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:support@paddlegrid.com"
              className="inline-block px-6 py-3 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-semibold"
            >
              Contact Support
            </a>
            <a
              href="/privacy"
              className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold border-2 border-white"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold border-2 border-white"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
