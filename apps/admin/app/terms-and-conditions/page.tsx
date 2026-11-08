'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, Shield, AlertTriangle, Scale } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-800 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
            Legal & Regulatory Terms
          </span>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-medium text-amber-300 border border-white/10 mb-4">
            <Scale className="w-3.5 h-3.5" /> Effective Date: November 1, 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Terms & Conditions of Service
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Please read these terms carefully. By accessing or using the LiteSpark platform, customer mobile app, driver application, or website, you agree to be bound by these Terms and our Privacy Policy.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">1</span>
              <h2>Entity & Platform Overview</h2>
            </div>
            <p>
              These Terms of Service constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Rider&rdquo;, or &ldquo;Driver Partner&rdquo;) and <strong>LiteSpark Mobility Technologies Private Limited</strong> (&ldquo;LiteSpark&rdquo;, &ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;), having its principal place of business at <strong>Tech Hub Complex, Avinashi Road, Coimbatore, Tamil Nadu &ndash; 641014, India</strong>.
            </p>
            <p>
              LiteSpark operates a digital technology platform that connects prospective passengers seeking point-to-point intra-city and outstation transport services with independent third-party commercial transport operators and drivers (&ldquo;Driver Partners&rdquo;). LiteSpark is a technology intermediary as defined under the Information Technology Act, 2000 and operates in compliance with the Motor Vehicles Aggregator Guidelines, 2020.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">2</span>
              <h2>Eligibility & Account Registration</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>You must be at least 18 years of age to register an account and book rides on LiteSpark.</li>
              <li>Registration requires authentication via an Indian mobile phone number (+91) through a single-use One-Time Password (OTP).</li>
              <li>You agree to provide true, accurate, and complete information and maintain the security of your device. LiteSpark is not liable for unauthorized access resulting from compromised OTPs.</li>
              <li>Users may not maintain more than one active consumer account without prior written authorization.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</span>
              <h2>Booking, Fares, & Payments (Razorpay Integration)</h2>
            </div>
            <p>
              LiteSpark calculates transparent upfront fare estimates based on actual GPS route distance, projected travel duration, vehicle category (Auto, Mini Hatchback, Prime Sedan, Premium SUV), and applicable municipal and toll tariffs.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payment Processing & Aggregator Disclosures
              </h3>
              <p className="text-xs text-slate-600 leading-normal">
                Online electronic payments—including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay), and Netbanking—are securely processed through <strong>Razorpay Software Private Limited</strong>, an RBI-authorized Payment Aggregator. LiteSpark does not store your 16-digit card numbers, CVVs, or bank netbanking passwords on its servers.
              </p>
              <p className="text-xs text-slate-600 leading-normal">
                All digital transactions are subject to 2-Factor Authentication (2FA) pursuant to Reserve Bank of India mandates. Ride receipts with GST breakdown are generated electronically and delivered via in-app receipt and SMS/email.
              </p>
            </div>
            <p>
              Where cash payment is selected, the rider must tender the exact fare displayed on the driver application upon destination arrival. Tipping is voluntary and retained 100% by the Driver Partner.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</span>
              <h2>Driver Partner Plans & Platform Fee Models</h2>
            </div>
            <p>
              LiteSpark empowers commercial drivers with freedom of commercial choice. Driver Partners may opt into one of the following 3 operating plans:
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50">
                <div className="text-xs font-bold text-purple-700 uppercase">Plan 1: Standard</div>
                <div className="font-bold text-slate-900 mt-1">15% Commission</div>
                <p className="text-xs text-slate-600 mt-1">Deducted automatically per completed trip. Pay as you earn.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="text-xs font-bold text-blue-700 uppercase">Plan 2: Flat Fee</div>
                <div className="font-bold text-slate-900 mt-1">₹15 / Ride</div>
                <p className="text-xs text-slate-600 mt-1">Fixed ₹15 platform charge per ride. Driver keeps 100% of the rest.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="text-xs font-bold text-emerald-700 uppercase">Plan 3: Daily Pass</div>
                <div className="font-bold text-slate-900 mt-1">₹29 / Day (0% Comm)</div>
                <p className="text-xs text-slate-600 mt-1">Unlimited trips per day. Zero platform commission on all rides.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Drivers can switch their plans via their mobile application before starting their shift. Drivers who subscribe to the Daily Unlimited Pass are debited ₹29 per calendar day via wallet or Razorpay payment.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">5</span>
              <h2>Cancellation & Waiting Policy</h2>
            </div>
            <p>
              Passengers may cancel a ride request free of charge within 3 minutes of driver assignment. Cancellations made after 3 minutes or if the driver has arrived at the pickup location are subject to a nominal cancellation fee (₹25 for Auto, ₹45 for Mini/Sedan) to reimburse the driver partner for fuel and transit time, as detailed in our <Link href="/refund-policy" className="text-purple-600 underline font-medium">Cancellation & Refund Policy</Link>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">6</span>
              <h2>Safety, Conduct & Zero-Tolerance Policy</h2>
            </div>
            <p>
              LiteSpark maintains a strict zero-tolerance policy against:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
              <li>Operating vehicles or riding under the influence of alcohol, drugs, or narcotics.</li>
              <li>Verbal harassment, physical misconduct, racial, communal or gender-based discrimination.</li>
              <li>Unauthorized offline rides or demanding fares in excess of the official app bill.</li>
              <li>Refusal of service without valid statutory justification once a ride has been accepted.</li>
            </ul>
            <p className="text-xs text-slate-500">
              Violation of safety norms results in immediate profile suspension and reporting to law enforcement authorities.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">7</span>
              <h2>Limitation of Liability & Intermediary Status</h2>
            </div>
            <p>
              LiteSpark provides dispatch matching and payment settlement technology. While LiteSpark enforces rigorous vehicle fitness audits and driver KYC verification (Aadhaar, Commercial Driving Licence, Police Verification), the physical transport service is rendered by independent Driver Partners. To the maximum extent permitted by applicable Indian law, LiteSpark shall not be liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">8</span>
              <h2>Governing Law & Dispute Resolution</h2>
            </div>
            <p>
              These Terms shall be governed by, interpreted, and construed in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts at <strong>Coimbatore, Tamil Nadu, India</strong>.
            </p>
          </section>

          {/* Contact Box */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-900">Have questions about our Terms?</div>
              <div className="text-xs text-slate-600">Our Legal & Compliance team is available to assist you.</div>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-sm"
            >
              Contact Legal Desk
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
