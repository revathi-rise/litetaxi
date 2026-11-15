'use client';

import { Star, Quote, CheckCircle2, Building2 } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  project: string;
  avatar: string;
  content: string;
  rating: number;
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Vikram Patel',
      role: 'Head of E-Commerce & Retail',
      company: 'Glanz Special Tools',
      location: 'Mumbai, India',
      project: 'Glanz Special Tools E-Commerce',
      avatar: 'VP',
      content:
        'Revathi delivered our industrial tool e-commerce portal with outstanding attention to detail. Her integration of dynamic catalog filtering and Razorpay payment flows made ordering effortless for our commercial buyers. A true engineering leader.',
      rating: 5,
    },
    {
      id: '2',
      name: 'Suresh R.',
      role: 'Director of Operations',
      company: 'STW Global Logistics',
      location: 'Chennai, India',
      project: 'STW ERP & Supply Chain System',
      avatar: 'SR',
      content:
        'Our logistics and warehouse stock auditing were completely transformed thanks to Revathi. The QR code generation per SKU and real-time AfterShip tracking integration saved our operational teams hundreds of manual hours every month. An absolute professional and natural leader.',
      rating: 5,
    },
    {
      id: '3',
      name: 'Priya Natarajan',
      role: 'Founder & Head of Product',
      company: 'Literact EdTech Academy',
      location: 'Bengaluru, India',
      project: 'Literact E-Learning Platform',
      avatar: 'PN',
      content:
        'Revathi delivered our e-learning platform with remarkable technical clarity. From Razorpay subscription paywalls to instructor lesson management, every feature was delivered on schedule with zero production regressions. She has an innate ability to translate complex business needs into clean, scalable code.',
      rating: 5,
    },
    {
      id: '4',
      name: 'Karthik Sundaram',
      role: 'Co-Founder & COO',
      company: 'Quiklr Mobility',
      location: 'Coimbatore, India',
      project: 'Quiklr Bike Ride Booking',
      avatar: 'KS',
      content:
        'Finding a Technical Lead who understands both real-time driver dispatching and complex dynamic pricing algorithms is rare. Revathi took complete ownership of our Quiklr booking APIs and driver onboarding pipeline, making launch day completely smooth and reliable.',
      rating: 5,
    },
    {
      id: '5',
      name: 'Arvind Krishnan',
      role: 'Managing Director',
      company: 'Vtagu Media & Entertainment',
      location: 'Chennai, India',
      project: 'Vtagu Video Streaming',
      avatar: 'AK',
      content:
        'Vtagu required smooth video playback across diverse devices and high-concurrency Razorpay billing. Revathi guided her engineering and QA teams with precision, delivering a robust streaming platform our subscribers love.',
      rating: 5,
    },
    {
      id: '6',
      name: 'Meera Varma',
      role: 'Head of Institutional Placements',
      company: 'JobGatez Career Hub',
      location: 'Coimbatore, India',
      project: 'JobGatez Recruitment Portal',
      avatar: 'MV',
      content:
        'The multi-role placement workflows Revathi engineered for JobGatez connected over 50+ college placement cells with corporate employers effortlessly. She is a reliable, communicative, and solutions-oriented Technical Lead.',
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-slate-950/40 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
            <span>Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Happy Clients & Trusted Partners
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Hear what client partners, executive stakeholders, and product founders say about collaborating with Revathi K.
          </p>
        </div>

        {/* Client Trust Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
          <div className="bg-slate-900/60 rounded-2xl p-4 text-center border border-slate-800 backdrop-blur-md">
            <div className="text-2xl font-extrabold text-purple-400 mb-0.5">100%</div>
            <div className="text-xs text-slate-400 font-semibold">On-Time Delivery Rate</div>
          </div>
          <div className="bg-slate-900/60 rounded-2xl p-4 text-center border border-slate-800 backdrop-blur-md">
            <div className="text-2xl font-extrabold text-cyan-400 mb-0.5">10+ Years</div>
            <div className="text-xs text-slate-400 font-semibold">Client Partnership Track</div>
          </div>
          <div className="bg-slate-900/60 rounded-2xl p-4 text-center border border-slate-800 backdrop-blur-md">
            <div className="text-2xl font-extrabold text-emerald-400 mb-0.5">5.0 / 5.0</div>
            <div className="text-xs text-slate-400 font-semibold">Average Client Satisfaction</div>
          </div>
          <div className="bg-slate-900/60 rounded-2xl p-4 text-center border border-slate-800 backdrop-blur-md">
            <div className="text-2xl font-extrabold text-amber-400 mb-0.5">3x Honors</div>
            <div className="text-xs text-slate-400 font-semibold">Leadership & Team Awards</div>
          </div>
        </div>

        {/* Testimonials Grid (6 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 rounded-2xl p-7 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between hover:-translate-y-1.5 shadow-xl group relative overflow-hidden backdrop-blur-md"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Header with Project Badge & Quote Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-purple-950/40 text-purple-300 border border-purple-500/30 truncate max-w-[85%]">
                    {item.project}
                  </span>
                  <Quote className="w-5 h-5 text-purple-400/40 flex-shrink-0" />
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Testimonial Quote */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-6">
                  &ldquo;{item.content}&rdquo;
                </p>
              </div>

              {/* Author Profile */}
              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-extrabold text-xs shadow-md flex-shrink-0">
                  {item.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" title="Verified Client Partner" />
                  </div>
                  <p className="text-xs text-purple-300/80 font-medium truncate">{item.role}</p>
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                    <Building2 className="w-3 h-3 inline text-slate-400" />
                    <span>{item.company} • {item.location}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
