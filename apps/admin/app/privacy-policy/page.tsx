'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Last Updated: November 1, 2026 • Compliant with Digital Personal Data Protection (DPDP) Act, 2023 & RBI Payment Guidelines.
            </p>
          </div>

          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-2">1. Introduction</h2>
              <p>
                LiteSpark Mobility Solutions (&quot;LiteSpark Taxi&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the LiteSpark customer mobile application, driver partner application, and web booking platforms. This Privacy Policy outlines how we collect, process, store, and safeguard your personal information when you use our transportation aggregation services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong>Personal Identity:</strong> Full name, mobile phone number, and email address collected during sign-up.</li>
                <li><strong>Driver Verification (KYC):</strong> Driving licence copy, Aadhaar card number/photo, vehicle registration certificate (RC), and 4-sided inspection photos.</li>
                <li><strong>Geolocation & Telematics:</strong> Real-time GPS location data during active trips, background location for driver dispatch, and route geometry.</li>
                <li><strong>Payment Information:</strong> Transaction references, Razorpay payment order IDs, and payment methods (UPI/Card). We do not store full credit card numbers or banking passwords on our servers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">3. How We Use Your Data</h2>
              <p>We process your data strictly for legitimate operational purposes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-300">
                <li>Matching passengers with the nearest available LiteSpark driver.</li>
                <li>Calculating upfront fares, distance, and trip duration.</li>
                <li>Processing digital payments and instant driver wallet payouts via Razorpay.</li>
                <li>Ensuring passenger safety through real-time GPS tracking and emergency SOS features.</li>
                <li>Customer support, ride receipt delivery, and dispute resolution.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">4. Payment Security & Razorpay Integration</h2>
              <p>
                All online transactions, UPI payments, and wallet top-ups are processed through <strong>Razorpay Software Private Limited</strong>, an RBI-authorized Payment Aggregator compliant with <strong>PCI-DSS Level 1</strong> standards.
              </p>
              <p className="mt-2">
                Your payment credentials are encrypted using industry-standard 256-bit SSL protocols. LiteSpark does not sell or lease your financial information to any third-party advertisers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">5. Data Retention & User Rights</h2>
              <p>
                We retain trip history and accounting logs for 5 years to comply with Indian tax regulations. You have the right to request access to your stored data, rectify inaccuracies, or delete your account by contacting our Data Protection Officer.
              </p>
            </section>

            <section className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-base font-bold text-white mb-1">6. Grievance Officer Contact Details</h2>
              <p className="text-xs text-slate-400 mb-3">In accordance with the Information Technology Act 2000:</p>
              <div className="space-y-1 text-xs text-slate-300">
                <p><strong>Name:</strong> K. Ramesh Kumar</p>
                <p><strong>Designation:</strong> Grievance Officer, LiteSpark Taxi</p>
                <p><strong>Email:</strong> grievance@litesparktaxi.com</p>
                <p><strong>Helpline:</strong> +91 90000 00001</p>
                <p><strong>Address:</strong> LiteSpark Mobility, Eachanari Main Road, Coimbatore, Tamil Nadu - 641021</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
