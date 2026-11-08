'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles, Shield, HeartHandshake, Zap, Award, Users, Car, MapPin } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-800 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
            Our Mission & Story
          </span>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-medium text-amber-300 border border-white/10 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Next-Generation Intra-City & Regional Mobility
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            About LiteSpark Taxi
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Pioneering a fairer, zero-commission mobility ecosystem where drivers keep what they earn and riders enjoy reliable, transparent, and surge-free journeys.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        
        {/* Story Section */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Our Story & Purpose</h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            Founded in Coimbatore, Tamil Nadu, <strong>LiteSpark Mobility Technologies Private Limited</strong> was built to fix what traditional ride-hailing aggregators broke: exorbitant commissions (25% to 35%), unpredictable driver cancellations, hidden surge prices, and lack of true operational transparency.
          </p>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            By combining high-speed routing engines, instant UPI/Razorpay digital settlements, and groundbreaking driver earnings models—including our signature <strong>Daily Unlimited Pass (₹29/day with 0% platform commission)</strong>—we restore dignity and profitability to local driver partners while delivering five-star reliability to every commuter.
          </p>
        </section>

        {/* Pillars Grid */}
        <section className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Real-Time Dispatch</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sub-second GPS matching algorithms connect riders with the closest verified vehicle, cutting pickup ETAs to under 4 minutes.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Driver Empowerment</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Drivers choose how they work—from 15% standard commission to ₹15 flat booking fees or 0% commission daily passes.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Safety by Design</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mandatory 4-point vehicle inspection, background checks, Aadhaar verification, real-time telemetry, and 24/7 emergency dispatch.
            </p>
          </div>
        </section>

        {/* Tech Stack & Compliance */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Technology & Payment Security</h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            Our cloud architecture is hosted on enterprise-grade infrastructure adhering to ISO 27001 data isolation and encryption standards. All financial transactions are managed end-to-end via <strong>Razorpay Software Private Limited</strong>, utilizing 256-bit TLS encryption, PCI-DSS Level 1 compliance, and RBI-mandated 2-Factor Authentication.
          </p>
          <div className="pt-4 grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-sm">Motor Vehicles Compliant</div>
                <div className="text-xs text-slate-500">Operates under MoRTH Aggregator Guidelines 2020</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-sm">PCI-DSS & RBI Certified</div>
                <div className="text-xs text-slate-500">100% tokenized payments powered by Razorpay</div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-8 text-white text-center space-y-4 shadow-lg shadow-purple-900/30">
          <h2 className="text-2xl font-extrabold">Ready to Ride or Partner with Us?</h2>
          <p className="text-purple-100 max-w-xl mx-auto text-sm">
            Experience reliable intra-city rides or start earning more as a LiteSpark Driver Partner today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/services"
              className="px-6 py-3 bg-white text-purple-800 font-bold rounded-xl text-sm shadow hover:bg-purple-50 transition"
            >
              Explore Services
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-amber-400 text-slate-900 font-bold rounded-xl text-sm shadow hover:bg-amber-300 transition"
            >
              Contact Our Team
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
