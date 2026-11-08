'use client';

import React from 'react';
import Link from 'next/link';
import {
  Car, Shield, Clock, MapPin, Zap, CheckCircle2, ChevronRight,
  Phone, Mail, ArrowRight, Award, CreditCard, Sparkles, Navigation,
  Smartphone, IndianRupee, Layers
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* ── TOP PUBLIC NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">LiteSpark</span>
              <span className="text-amber-400 font-bold text-xs ml-1 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">TAXI</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/services" className="hover:text-white transition">Services & Fleet</Link>
            <Link href="/about" className="hover:text-white transition">About Us</Link>
            <a href="#driver-plans" className="hover:text-amber-400 transition flex items-center gap-1">
              <span>Driver Plans</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">0% Comm</span>
            </a>
            <Link href="/contact" className="hover:text-white transition">Contact & Support</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
            >
              Operations Portal
            </Link>
            <a
              href="http://localhost:8081"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 text-white shadow-md shadow-purple-600/30 transition"
            >
              Book Ride (8081)
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-28 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(109,40,217,0.25),rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-6 shadow-lg shadow-purple-900/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Next-Gen Mobility in Tamil Nadu</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Fast, Reliable & Transparent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-300">
                LiteSpark Taxi
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Safe city rides, outstation journeys, and airport transfers with verified drivers, upfront fares, and 100% secure payments powered by Razorpay.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="http://localhost:8081"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4 text-amber-300" />
                Book Ride in Customer App (Port 8081)
              </a>

              <a
                href="http://localhost:8082"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-sm border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <Car className="w-4 h-4 text-purple-400" />
                Drive With Us (Port 8082)
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80 text-left">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="text-2xl font-extrabold text-white">4.9 ★</p>
                <p className="text-xs text-slate-400 mt-0.5">Average Ride Rating</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="text-2xl font-extrabold text-emerald-400">&lt; 3 Min</p>
                <p className="text-xs text-slate-400 mt-0.5">Quick Driver Allocation</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="text-2xl font-extrabold text-purple-400">100%</p>
                <p className="text-xs text-slate-400 mt-0.5">Verified Drivers & Cabs</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="text-2xl font-extrabold text-amber-400">₹0 Hidden</p>
                <p className="text-xs text-slate-400 mt-0.5">Upfront Fixed Pricing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES SECTION ── */}
      <section className="py-20 border-b border-slate-800 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs uppercase tracking-widest text-purple-400 font-bold">Services We Offer</h2>
            <p className="text-3xl font-bold text-white mt-2">Tailored Transportation for Every Journey</p>
            <p className="text-sm text-slate-400 mt-2">Whether you need a quick auto across Coimbatore, an executive sedan for client meetings, or a highway SUV for family vacations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">LiteSpark Auto</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Affordable, doorstep 3-wheeler auto rides for navigating city streets, markets, and quick daily hops without traffic stress.
              </p>
              <p className="text-xs text-amber-300 font-bold mt-4">Starting from ₹35 base fare</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">City Mini & Sedan</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Comfortable, air-conditioned compact hatchbacks and premium sedans (Dzire, Aura, Etios) with spacious seating and boot space.
              </p>
              <p className="text-xs text-purple-300 font-bold mt-4">Transparent per-km meter rate</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Outstation Drops</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Intercity one-way and round trips to Ooty, Pollachi, Tiruppur, Palakkad, Bangalore, and Chennai with top highway drivers.
              </p>
              <p className="text-xs text-emerald-300 font-bold mt-4">Fixed highway packages</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Hourly Rentals & Airport</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Keep the cab as long as you want with multiple stops for business visits, temple tours, or guaranteed on-time Coimbatore airport transfers.
              </p>
              <p className="text-xs text-blue-300 font-bold mt-4">2 hr, 4 hr & 8 hr rental plans</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DRIVER PARTNER PLANS (THE 3 PLANS) ── */}
      <section className="py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              Driver Empowerment
            </span>
            <h2 className="text-3xl font-bold text-white mt-3">Choose How You Earn: 3 Flexible Driver Plans</h2>
            <p className="text-sm text-slate-400 mt-2">
              Unlike traditional taxi apps that lock you into high commissions, LiteSpark allows you to pick the earnings model that suits your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan 1 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 flex flex-col justify-between hover:border-purple-500/60 transition">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan 1</span>
                <h3 className="text-xl font-bold text-white mt-1">15% Standard Commission</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">15%</span>
                  <span className="text-xs text-slate-400">per completed trip</span>
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Pay only when you earn. Zero upfront fees, zero daily targets. Perfect for part-time drivers, weekenders, or occasional trips.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>85% of trip fare directly to your wallet</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>No subscription or daily renewal fee</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Full access to city and outstation dispatch</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6">
                <span className="block text-center text-xs font-semibold text-purple-300 bg-purple-950/60 py-2 rounded-xl border border-purple-800/40">
                  Default Starter Plan
                </span>
              </div>
            </div>

            {/* Plan 2 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 flex flex-col justify-between hover:border-amber-500/60 transition">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Plan 2</span>
                <h3 className="text-xl font-bold text-white mt-1">Flat Booking Fee</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-amber-400">₹15</span>
                  <span className="text-xs text-slate-400">flat per ride</span>
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Keep 100% of the passenger fare minus a nominal ₹15 flat booking fee. Highly lucrative for longer city rides, airport drops, and sedan trips.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Fixed ₹15 fee regardless of fare amount</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>On a ₹400 ride, you keep ₹385!</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>No percentage cut on surge or wait times</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6">
                <span className="block text-center text-xs font-semibold text-amber-300 bg-amber-950/60 py-2 rounded-xl border border-amber-800/40">
                  Best for High-Value Rides
                </span>
              </div>
            </div>

            {/* Plan 3 */}
            <div className="bg-gradient-to-b from-purple-950/50 to-slate-900 border-2 border-purple-500 rounded-2xl p-7 flex flex-col justify-between shadow-2xl shadow-purple-950/50 relative">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-purple-600 to-amber-500 px-3 py-1 rounded-full text-[10px] font-extrabold text-white tracking-wider uppercase">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Plan 3 (Namma Yatri Style)</span>
                <h3 className="text-xl font-bold text-white mt-1">0% Commission Daily Pass</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹29</span>
                  <span className="text-xs text-slate-400">/ day (or ₹699/month)</span>
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Zero commission on every single ride. 100% of the rider fare goes directly to your pocket. Drive as many trips as you want!
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span><strong>0% Commission:</strong> Keep 100% of customer fare</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Unlimited rides for 24 hours</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Instant activation via Razorpay UPI or Wallet</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-800/80 mt-6">
                <span className="block text-center text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 py-2.5 rounded-xl transition cursor-pointer">
                  Activate in Driver App
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURED BY RAZORPAY SECTION ── */}
      <section className="py-16 border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <CreditCard className="w-4 h-4" />
                <span>Enterprise Payment Processing</span>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">100% Secure Payments via Razorpay</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                LiteSpark Taxi partners with Razorpay Payment Gateway to provide frictionless, RBI-compliant digital transactions. We accept UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit/Debit Cards, and Net Banking with end-to-end 256-bit SSL encryption.
              </p>
              <div className="flex items-center gap-4 mt-6 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Instant UPI Refunds
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-purple-400">
                  <CheckCircle2 className="w-4 h-4" /> PCI-DSS Level 1
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                  <CheckCircle2 className="w-4 h-4" /> Instant Driver Payouts
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center w-full md:w-auto min-w-[280px]">
              <p className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-3">Accepted Payment Modes</p>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                  UPI & QR (GPay / PhonePe)
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                  Credit & Debit Cards
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                  Net Banking (50+ Banks)
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-emerald-400">
                  Cash to Driver
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER WITH MANDATORY RAZORPAY COMPLIANCE LINKS ── */}
      <footer className="bg-slate-950 pt-16 pb-12 border-t border-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-900">
            {/* Col 1 */}
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-black text-amber-300">
                  ⚡
                </div>
                <span className="font-bold text-lg text-white">LiteSpark Taxi</span>
              </div>
              <p className="mt-3 text-slate-400 max-w-sm leading-relaxed">
                LiteSpark Mobility Solutions Private Limited. Safe, smart, and transparent mobility services in Tamil Nadu.
              </p>
              <p className="mt-2 text-slate-500">
                GSTIN / Reg: 33AAACL1928B1Z4 • Coimbatore, TN, India
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><Link href="/about" className="hover:text-purple-400 transition">About Us</Link></li>
                <li><Link href="/services" className="hover:text-purple-400 transition">Our Services</Link></li>
                <li><a href="http://localhost:8081" className="hover:text-purple-400 transition">Customer App</a></li>
                <li><a href="http://localhost:8082" className="hover:text-purple-400 transition">Driver Partner App</a></li>
                <li><Link href="/admin" className="hover:text-purple-400 transition">Operations Portal</Link></li>
              </ul>
            </div>

            {/* Col 3: Razorpay Mandatory Legal Pages */}
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-4">Legal & Policies</h4>
              <ul className="space-y-2.5">
                <li><Link href="/privacy-policy" className="hover:text-purple-400 transition">Privacy Policy</Link></li>
                <li><Link href="/terms-and-conditions" className="hover:text-purple-400 transition">Terms & Conditions</Link></li>
                <li><Link href="/refund-policy" className="hover:text-purple-400 transition">Refund & Cancellation</Link></li>
                <li><Link href="/contact" className="hover:text-purple-400 transition">Grievance & Contact</Link></li>
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-4">24/7 Helpline</h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  <span>+91 90000 00001</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>support@litesparktaxi.com</span>
                </li>
                <li className="text-slate-400">
                  Eachanari Road, Coimbatore, Tamil Nadu - 641021
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© {new Date().getFullYear()} LiteSpark Taxi (SwiftCab Mobility). All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span>Secured by</span>
              <span className="font-bold text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                Razorpay Payments
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
