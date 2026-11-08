'use client';

import Link from 'next/link';
import { ArrowLeft, RotateCcw, Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-800 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            Razorpay Merchant Verified Policy
          </span>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-medium text-emerald-300 border border-white/10 mb-4">
            <RotateCcw className="w-3.5 h-3.5" /> 5 &ndash; 7 Business Days Refund Turnaround
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Cancellation & Refund Policy
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Transparent, customer-first cancellation rules and automated refund processing for ride fares, double charges, and driver wallet transactions.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
          
          {/* Highlight Box: Razorpay SLA */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-950">Refund SLA & Payment Source Reversal</h2>
              <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-normal">
                Approved refunds are initiated within <strong>24 business hours</strong> through our banking partner <strong>Razorpay</strong>. The funds will reflect in your original payment method (Bank Account, UPI VPA, Credit Card, or Debit Card) within <strong>5 to 7 working days</strong>, adhering strictly to RBI guidelines.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">1</span>
              <h2>Rider Cancellation Rules & Fee Structure</h2>
            </div>
            <p>
              We understand that travel plans can change unexpectedly. Our cancellation policy is engineered to balance rider convenience with fair compensation for driver partners who have already committed fuel and time to reach your location.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Cancellation Scenario</th>
                    <th className="p-3 border-b border-slate-200">Auto</th>
                    <th className="p-3 border-b border-slate-200">Mini / Sedan</th>
                    <th className="p-3 border-b border-slate-200">SUV / Outstation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Within 3 minutes of driver accepting request</td>
                    <td className="p-3 text-emerald-600 font-bold">₹0 (Free)</td>
                    <td className="p-3 text-emerald-600 font-bold">₹0 (Free)</td>
                    <td className="p-3 text-emerald-600 font-bold">₹0 (Free)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">After 3 minutes while driver is en route</td>
                    <td className="p-3">₹20</td>
                    <td className="p-3">₹35</td>
                    <td className="p-3">₹50</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Driver arrived at pickup and waited &gt; 5 minutes</td>
                    <td className="p-3">₹25</td>
                    <td className="p-3">₹45</td>
                    <td className="p-3">₹60</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Driver cancelled or delayed beyond ETA (+10 min)</td>
                    <td className="p-3 text-emerald-600 font-bold">₹0 (Free)</td>
                    <td className="p-3 text-emerald-600 font-bold">₹0 (Free)</td>
                    <td className="p-3 text-emerald-600 font-bold">₹0 (Free)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">2</span>
              <h2>Automatic Refunds for Technical Failures & Double Charges</h2>
            </div>
            <p>
              In rare instances where your bank debits your account but the ride booking is not confirmed due to network timeouts, app disconnection, or gateway delays:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
              <li>Our automated system checks unattached Razorpay orders every 60 minutes and triggers a full 100% refund without requiring manual intervention.</li>
              <li>You will receive an instant SMS notification and email receipt containing the Razorpay Refund ID for your tracking.</li>
              <li>If you notice an erroneous duplicate charge, you can tap &ldquo;Report Issue&rdquo; on the booking history page or email <a href="mailto:refunds@litespark.in" className="text-purple-600 underline font-medium">refunds@litespark.in</a> with your UPI reference / UTR number.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</span>
              <h2>Driver Partner Wallet & Subscription Refunds</h2>
            </div>
            <p>
              LiteSpark maintains clear terms regarding Driver Partner wallet top-ups and daily pass subscriptions:
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-slate-600">
              <p>
                <strong>Wallet Balance Withdrawal:</strong> Unutilized wallet balance deposited via Razorpay/UPI can be withdrawn back to the driver&rsquo;s verified bank account at any time with zero withdrawal fee. Settlements are processed daily via IMPS/NEFT.
              </p>
              <p>
                <strong>Daily Unlimited Subscription Pass (₹29/day):</strong> Once activated and utilized for even one trip during the 24-hour cycle, the ₹29 daily fee is non-refundable. If technical downtime on our platform prevented ride assignments for more than 2 consecutive hours, a full 100% pass credit is returned to the driver&rsquo;s wallet.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</span>
              <h2>How to Request a Refund / Dispute a Fare</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">Step 1: In-App Support</div>
                <p className="text-xs text-slate-600 mt-1">Open Ride History, choose the trip, and select &ldquo;Dispute Fare / Request Refund&rdquo;.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">Step 2: Automated Review</div>
                <p className="text-xs text-slate-600 mt-1">Our system verifies route telemetry, GPS timestamps, and payment logs within 4 hours.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">Step 3: Instant Credit</div>
                <p className="text-xs text-slate-600 mt-1">Funds are reversed directly to your source account via Razorpay within 5-7 working days.</p>
              </div>
            </div>
          </section>

          {/* Contact Box */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-900">Need immediate help with a refund?</div>
              <div className="text-xs text-slate-600">Our customer support team is available 24/7 to assist you.</div>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-sm"
            >
              Contact Support
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
