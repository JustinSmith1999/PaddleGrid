import { ArrowLeft, Mail, MessageSquare, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Support() {
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
        <h1 className="text-3xl font-extrabold text-[#1B2A4A] mb-2">Support</h1>
        <p className="text-base text-gray-500 mb-10">We&apos;re here to help. Choose how you&apos;d like to reach us.</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <a
            href="mailto:Justin@j20solutions.com"
            className="flex items-start gap-4 bg-gray-50 rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1B2A4A] mb-1">Email Us</h3>
              <p className="text-sm text-gray-500">Justin@j20solutions.com</p>
              <p className="text-xs text-gray-400 mt-1">We typically respond within 24 hours</p>
            </div>
          </a>

          <div className="flex items-start gap-4 bg-gray-50 rounded-2xl border border-gray-200 p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1B2A4A] mb-1">In-App Chat</h3>
              <p className="text-sm text-gray-500">Available when logged in</p>
              <p className="text-xs text-gray-400 mt-1">Fastest way to get help</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#1B2A4A] mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            { q: 'How do I book a court?', a: 'Sign up for a free account, browse nearby courts, pick an available time slot, and confirm your booking. Payment is processed securely through Stripe.' },
            { q: 'How do I cancel a booking?', a: "Go to your bookings in the app and tap the booking you want to cancel. Cancellation policies vary by venue — check the venue's policy before booking." },
            { q: 'How do I delete my account?', a: 'Go to Settings > Account > Delete Account. Your account will enter a 30-day grace period. You can cancel deletion during this time. After 30 days, your data is permanently removed.' },
            { q: 'How do I list my venue on PaddleGrid?', a: "Click \"I run a venue\" on the homepage or sign up as a facility operator. You'll get access to our venue management dashboard." },
            { q: 'Is my payment information secure?', a: 'Yes. All payments are processed through Stripe, a PCI Level 1 certified payment processor. We never store your full card number.' },
            { q: 'How do I report inappropriate content?', a: 'Tap the three-dot menu on any post or comment and select "Report." Our moderation team reviews all reports within 24 hours.' },
            { q: 'Do you have a mobile app?', a: 'Yes! PaddleGrid is available on iOS and Android. Download from the App Store or Google Play to book courts and connect with players on the go.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                <HelpCircle className="w-4 h-4 text-[#6DB33F] flex-shrink-0" />
                <span className="text-sm font-semibold text-[#1B2A4A]">{faq.q}</span>
              </summary>
              <div className="px-4 pb-4 pl-11">
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-[#1B2A4A] rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Still need help?</h2>
          <p className="text-sm text-white/60 mb-6">Our team is here to assist with any questions.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="mailto:Justin@j20solutions.com"
              className="inline-block px-6 py-2.5 bg-[#6DB33F] text-white text-sm font-semibold rounded-xl hover:bg-[#5E9A35] transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/privacy"
              className="inline-block px-6 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="inline-block px-6 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors"
            >
              Terms of Service
            </a>
          </div>
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
