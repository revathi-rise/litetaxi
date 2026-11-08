'use client';

import Link from 'next/link';
import { ArrowLeft, Car, ShieldCheck, Clock, MapPin, Sparkles, CheckCircle2, CreditCard } from 'lucide-react';

export default function ServicesPage() {
  const serviceCategories = [
    {
      code: 'auto',
      name: 'LiteSpark Auto',
      tagline: 'Quick, pocket-friendly rides for daily city commutes',
      capacity: '3 Passengers',
      baseFare: '₹35 base fare (includes 1.5 km)',
      perKm: '₹14 / km thereafter',
      features: ['Ideal for tight traffic & quick hops', 'Direct meter rates with zero surge', 'Available 24/7 across city limits'],
      color: 'border-amber-200 bg-amber-50/40',
      badge: 'Most Affordable',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      code: 'mini',
      name: 'LiteSpark Mini',
      tagline: 'Compact AC hatchbacks for solo riders and couples',
      capacity: '4 Passengers',
      baseFare: '₹60 base fare (includes 2.0 km)',
      perKm: '₹16 / km thereafter',
      features: ['Air-conditioned hatchback comfort', 'Economical everyday office travel', 'Boot space for medium luggage'],
      color: 'border-blue-200 bg-blue-50/40',
      badge: 'Popular Everyday',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      code: 'sedan',
      name: 'LiteSpark Prime Sedan',
      tagline: 'Spacious sedans with top-rated driver partners',
      capacity: '4 Passengers',
      baseFare: '₹85 base fare (includes 2.0 km)',
      perKm: '₹19 / km thereafter',
      features: ['Maruti Dzire, Honda Amaze, Hyundai Aura', 'Extra legroom & boot capacity', 'Complimentary AC & quiet ride'],
      color: 'border-purple-200 bg-purple-50/40',
      badge: 'Executive Comfort',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      code: 'suv',
      name: 'LiteSpark Premium SUV',
      tagline: '6-seater family cruisers for group travel & airport drops',
      capacity: '6-7 Passengers',
      baseFare: '₹130 base fare (includes 3.0 km)',
      perKm: '₹24 / km thereafter',
      features: ['Toyota Innova Crysta, Maruti Ertiga', 'Generous luggage trunk capacity', 'Ideal for family vacations & airport transit'],
      color: 'border-indigo-200 bg-indigo-50/40',
      badge: 'Family & Luggage',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      code: 'outstation',
      name: 'Outstation One-Way & Round Trips',
      tagline: 'Inter-city travel across Tamil Nadu, Kerala, and Karnataka',
      capacity: '4 - 7 Passengers',
      baseFare: 'Starting from ₹12 / km',
      perKm: 'Includes driver night allowance & toll guidance',
      features: ['Coimbatore to Ooty, Bangalore, Kochi, Madurai', 'Verified highway-certified drivers', 'Zero return fare on select one-way corridors'],
      color: 'border-emerald-200 bg-emerald-50/40',
      badge: 'Inter-City Special',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      code: 'rentals',
      name: 'Hourly Car Rentals',
      tagline: 'Keep a dedicated cab and driver at your disposal',
      capacity: '4 - 7 Passengers',
      baseFare: 'Packages: 2hr/20km to 12hr/120km',
      perKm: 'Starting at ₹499 for 2 hours',
      features: ['Multiple stops for shopping & business meetings', 'No need to book multiple rides', 'Extendable on an hourly basis'],
      color: 'border-rose-200 bg-rose-50/40',
      badge: 'Multiple Stops',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-800 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
            Transparent Pricing & Fleet
          </span>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-medium text-amber-300 border border-white/10 mb-4">
            <Car className="w-3.5 h-3.5" /> Fleet Categories & Tariffs
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Our Services & Transparent Pricing
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            From quick city hops to luxury airport transfers and multi-day outstation trips, explore our verified vehicle categories and upfront fare policies.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        
        {/* Grid of Services */}
        <div className="grid md:grid-cols-2 gap-6">
          {serviceCategories.map((svc) => (
            <div
              key={svc.code}
              className={`rounded-2xl border p-6 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between ${svc.color}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${svc.badgeColor}`}>
                    {svc.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" /> {svc.capacity}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{svc.name}</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-normal">{svc.tagline}</p>
                
                <div className="bg-white/80 border border-slate-200/80 rounded-xl p-3 space-y-1 text-xs">
                  <div className="font-bold text-slate-900">{svc.baseFare}</div>
                  <div className="text-slate-500">{svc.perKm}</div>
                </div>

                <ul className="space-y-1.5 pt-1 text-xs text-slate-600">
                  {svc.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-700">Digital Fare Estimate Available</span>
                <Link
                  href="/"
                  className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-sm"
                >
                  Book on App
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Razorpay Payment Modes Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">100% Secure Payment Gateways Powered by Razorpay</h2>
              <p className="text-xs text-slate-500">RBI-Authorized Payment Aggregator Integration</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            All ride fares can be settled seamlessly through our integrated Razorpay payment gateway. We accept:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              UPI (GPay / PhonePe / Paytm / BHIM)
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              Credit Cards (Visa / MasterCard / RuPay)
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              Debit Cards (All Major Indian Banks)
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              Net Banking (50+ Supported Banks)
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
