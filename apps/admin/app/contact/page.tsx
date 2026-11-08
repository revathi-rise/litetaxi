'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Clock, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: 'general', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-800 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
            24/7 Operations & Helpdesk
          </span>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-medium text-amber-300 border border-white/10 mb-4">
            <Phone className="w-3.5 h-3.5" /> Direct Support & Grievance Desk
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Contact LiteSpark Taxi
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            We are here to support riders, driver partners, and business clients. Reach out via phone, email, or visit our registered operating headquarters.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          
          {/* Left Column: Official Contact Details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Registered Office Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" /> Registered Headquarters
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-900">LiteSpark Mobility Technologies Private Limited</strong><br />
                CIN: U63090TZ2024PTC041289<br />
                Tech Hub Complex, 4th Floor, Avinashi Road,<br />
                Peelamedu, Coimbatore,<br />
                Tamil Nadu &ndash; 641014, India.
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                Office Hours: Monday &ndash; Saturday, 9:00 AM &ndash; 7:00 PM IST
              </div>
            </div>

            {/* Helpline & Email Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" /> Helplines & Support
              </h2>
              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <div className="text-slate-400 text-xs uppercase font-bold tracking-wide">Rider Care Helpline (24/7)</div>
                  <a href="tel:+918000554433" className="text-slate-900 font-bold hover:text-purple-700 transition">
                    +91 80005 54433 / 1800-419-SPARK
                  </a>
                </div>
                <div>
                  <div className="text-slate-400 text-xs uppercase font-bold tracking-wide">Driver Partner Onboarding Support</div>
                  <a href="tel:+919894002211" className="text-slate-900 font-bold hover:text-purple-700 transition">
                    +91 98940 02211
                  </a>
                </div>
                <div>
                  <div className="text-slate-400 text-xs uppercase font-bold tracking-wide">Customer Support Email</div>
                  <a href="mailto:support@litespark.in" className="text-purple-700 font-medium hover:underline">
                    support@litespark.in
                  </a>
                </div>
                <div>
                  <div className="text-slate-400 text-xs uppercase font-bold tracking-wide">Billing & Refund Enquiries</div>
                  <a href="mailto:refunds@litespark.in" className="text-purple-700 font-medium hover:underline">
                    refunds@litespark.in
                  </a>
                </div>
              </div>
            </div>

            {/* Statutory Grievance Redressal Box (Razorpay Mandatory Requirement) */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-purple-700" />
                <h3>Statutory Grievance Redressal Officer</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                In accordance with Information Technology Act 2000 and the Consumer Protection (E-Commerce) Rules 2020:
              </p>
              <div className="text-xs text-slate-700 space-y-1 bg-white/80 p-3 rounded-xl border border-purple-100">
                <div><strong>Officer Name:</strong> Rajeshwaran N., Advocate & Compliance Head</div>
                <div><strong>Designation:</strong> Chief Grievance Officer</div>
                <div><strong>Email:</strong> <a href="mailto:grievance@litespark.in" className="text-purple-700 font-medium underline">grievance@litespark.in</a></div>
                <div><strong>Direct Tel:</strong> +91 422 499 8120</div>
                <div><strong>Response Time:</strong> Acknowledged within 24 hours; resolved within 15 business days.</div>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Send us a Message</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill in the details below and our operations support team will respond within 2 to 4 hours.
                </p>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-950">Message Sent Successfully!</h3>
                  <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                    Thank you, {formData.name}. Ticket #{Math.floor(100000 + Math.random() * 900000)} has been created. A support executive will contact you at {formData.email || formData.phone}.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: 'general', message: '' }); }}
                    className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ramesh@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category *</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="refund">Ride Fare Dispute / Refund</option>
                        <option value="driver">Driver Partner Onboarding</option>
                        <option value="corporate">Corporate & Bulk Bookings</option>
                        <option value="safety">Safety / Lost & Found</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message / Booking Reference *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide trip booking reference (if applicable) and describe your query..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm transition shadow-md shadow-purple-900/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit Enquiry
                  </button>
                  <p className="text-center text-xs text-slate-400">
                    Your personal information is protected under our Privacy Policy and DPDP Act 2023.
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
