import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Loader2, TrendingUp, Users, Shield, Zap, Check, ArrowRight, Star, Trophy, CreditCard, BarChart3, Smartphone, Globe, FileText, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CourtCard } from './CourtCard';
import { AdvancedBookingCalendar } from './AdvancedBookingCalendar';
import { useAuth } from '../contexts/AuthContext';
import { ThreeClickCheckout } from './ThreeClickCheckout';
import { TransparentPricing } from './TransparentPricing';
import { WaitlistManager } from './WaitlistManager';
import { LiveAnalyticsDemo } from './LiveAnalyticsDemo';
import { FamilyAccountDemo } from './FamilyAccountDemo';
import { ConflictFreeDemo } from './ConflictFreeDemo';

interface SalesPageProps {
  onAuthRequired: (mode?: 'login' | 'signup' | 'facility') => void;
}

export function SalesPage({ onAuthRequired }: SalesPageProps) {
  const { user } = useAuth();
  const [showDemo, setShowDemo] = useState<'checkout' | 'pricing' | 'waitlist' | 'analytics' | 'family' | 'scheduling' | null>(null);

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
            <div className="lg:grid lg:grid-cols-2 gap-20 items-center">
              {/* Mobile Logo */}
              <div className="flex justify-center mb-12 lg:hidden">
                <img
                  src="/screenshot_2025-12-05_150441-removebg-preview.png"
                  alt="PaddleGrid Logo"
                  className="h-32 w-auto"
                />
              </div>

              {/* Content */}
              <div className="space-y-8 text-center lg:text-left">
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                    Court management
                    <span className="block text-emerald-600">reimagined</span>
                  </h1>

                  <p className="text-xl text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    The complete platform for modern sports facilities. Seamlessly manage courts, members, and events.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => onAuthRequired('facility')}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Start free trial
                  </button>
                  <button className="border border-slate-300 bg-white text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-50 transition-colors">
                    View demo
                  </button>
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-slate-600 justify-center lg:justify-start">
                  <span className="flex items-center">
                    <Check className="w-4 h-4 text-emerald-600 mr-2" />
                    14-day trial
                  </span>
                  <span className="flex items-center">
                    <Check className="w-4 h-4 text-emerald-600 mr-2" />
                    No credit card
                  </span>
                  <span className="flex items-center">
                    <Check className="w-4 h-4 text-emerald-600 mr-2" />
                    Cancel anytime
                  </span>
                </div>
              </div>

              {/* Desktop Logo */}
              <div className="hidden lg:flex justify-center">
                <img
                  src="/screenshot_2025-12-05_150441-removebg-preview.png"
                  alt="PaddleGrid Logo"
                  className="h-96 w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-24 bg-slate-50 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                Everything you need in one platform
              </h2>
              <p className="text-lg text-slate-600">
                Powerful tools that work together seamlessly to run your facility
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Smart Scheduling",
                  description: "Visual booking calendar with real-time availability and automated conflict prevention"
                },
                {
                  icon: Users,
                  title: "Member Management",
                  description: "Flexible membership tiers with automated billing and comprehensive tracking"
                },
                {
                  icon: Trophy,
                  title: "Events & Tournaments",
                  description: "Run programs, clinics, and leagues with complete registration management"
                },
                {
                  icon: BarChart3,
                  title: "Analytics",
                  description: "Real-time revenue, utilization, and performance insights at your fingertips"
                },
                {
                  icon: Smartphone,
                  title: "Mobile Ready",
                  description: "Fully responsive design that works beautifully on every device"
                },
                {
                  icon: Shield,
                  title: "Secure Payments",
                  description: "PCI-compliant payment processing with transparent 1% fee structure"
                }
              ].map((feature, index) => (
                <div key={index} className="group">
                  <div className="bg-white p-8 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                      <feature.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="py-24 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-slate-600">
                Choose the plan that fits your facility. Scale as you grow.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "$99",
                  period: "/month",
                  description: "Perfect for small facilities",
                  features: ["Up to 5 courts", "Unlimited bookings", "Basic analytics", "Email support"],
                  popular: false
                },
                {
                  name: "Professional",
                  price: "$199",
                  period: "/month",
                  description: "For growing facilities",
                  features: ["Up to 15 courts", "Advanced analytics", "Event management", "Priority support", "Custom branding"],
                  popular: true
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  period: "",
                  description: "For large operations",
                  features: ["Unlimited courts", "Multi-location", "Dedicated support", "Custom integrations", "API access"],
                  popular: false
                }
              ].map((plan, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-8 relative border-2 transition-all ${
                    plan.popular ? 'border-emerald-600 shadow-lg' : 'border-slate-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                    <p className="text-slate-600 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-600 ml-1">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => onAuthRequired('facility')}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {plan.name === 'Enterprise' ? 'Contact sales' : 'Start free trial'}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-center text-slate-600 mt-8">All plans include 14-day free trial • No credit card required</p>
          </div>
        </div>

        {/* Why PaddleGrid Section */}
        <div className="py-24 bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                Built for performance
              </h2>
              <p className="text-lg text-slate-400">
                Every feature engineered for speed, reliability, and exceptional user experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Lightning-fast bookings",
                  description: "Members complete reservations in 14 seconds. Three clicks from login to confirmation.",
                  metric: "14s",
                  demo: 'checkout',
                },
                {
                  title: "Complete transparency",
                  description: "1% processing fee displayed on every transaction. No hidden costs, no surprises.",
                  metric: "1%",
                  demo: 'pricing',
                },
                {
                  title: "Intelligent waitlist",
                  description: "When a court opens up, we instantly notify waitlisted members. Spots refill in seconds.",
                  metric: "30s",
                  demo: 'waitlist',
                },
                {
                  title: "Unified family accounts",
                  description: "Parents manage entire family's bookings, payments, and schedules from one dashboard.",
                  metric: "1 account",
                  demo: 'family',
                },
                {
                  title: "Conflict-free scheduling",
                  description: "Smart allocation prevents double bookings and optimizes court utilization automatically.",
                  metric: "Zero conflicts",
                  demo: 'scheduling',
                },
                {
                  title: "Real-time analytics",
                  description: "Live revenue tracking, occupancy rates, and performance insights at your fingertips.",
                  metric: "Live data",
                  demo: 'analytics',
                }
              ].map((item, index) => (
                <div key={index} className="group bg-slate-800 border border-slate-700 rounded-lg p-8 hover:border-emerald-600 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex-1">
                      {item.title}
                    </h3>
                    <span className="text-2xl font-bold text-emerald-400">{item.metric}</span>
                  </div>

                  <p className="text-slate-400 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {item.demo && (
                    <button
                      onClick={() => setShowDemo(item.demo as any)}
                      className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors inline-flex items-center text-sm"
                    >
                      View demo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-emerald-600 rounded-2xl p-12 lg:p-16 text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
                Ready to get started?
              </h2>

              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join hundreds of facilities using PaddleGrid to streamline operations and grow revenue.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => onAuthRequired('facility')}
                  className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Start free trial
                </button>

                <button
                  onClick={() => setShowDemo('checkout')}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
                >
                  View demo
                </button>
              </div>

              <p className="text-white/80 mt-6">14-day trial • No credit card required</p>
            </div>
          </div>
        </div>

        {/* Demo Modals */}
        {showDemo === 'checkout' && (
          <ThreeClickCheckout onClose={() => setShowDemo(null)} />
        )}

        {showDemo === 'pricing' && (
          <TransparentPricing onClose={() => setShowDemo(null)} />
        )}

        {showDemo === 'waitlist' && (
          <WaitlistManager onClose={() => setShowDemo(null)} />
        )}

        {showDemo === 'analytics' && (
          <LiveAnalyticsDemo onClose={() => setShowDemo(null)} />
        )}

        {showDemo === 'family' && (
          <FamilyAccountDemo onClose={() => setShowDemo(null)} />
        )}

        {showDemo === 'scheduling' && (
          <ConflictFreeDemo onClose={() => setShowDemo(null)} />
        )}
      </div>
    </>
  );
}
