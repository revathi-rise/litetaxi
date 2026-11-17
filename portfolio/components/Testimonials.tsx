'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle2, Quote } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  avatar: string;
  avatarGradient: string;
  date?: string;
  content: string;
  rating: string;
  link?: string;
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [

    {
      id: '1',
      name: 'Gnanavel',
      role: 'CTO',
      company: 'Deejos',
      location: 'Chennai, India',
      avatar: 'GN',
      avatarGradient: 'from-[#86198f] to-[#c026d3]',
      link: 'https://www.deejos.co.in/deejos-people',
      rating: '5',
      content:
        "Revathi is a dedicated and creative professional who is truly passionate about her work. I appreciate her approach to projects, attention to detail, and ability to turn ideas into meaningful results. Her eagerness to learn, adapt, and explore new things is clearly reflected in her work. It's wonderful to see her growing professionally and continuously improving her skills. Wishing her continued success in all her future endeavors!",
    },
    {
      id: '2',
      name: 'Mothilal Kumar',
      role: 'CEO & Founder',
      company: 'Leo Safety Solution LLC',
      location: 'Muscat, Oman',
      avatar: 'MK',
      avatarGradient: 'from-[#701a75] to-[#a21caf]',
      link: 'https://www.leollcgroup.com/',
      rating: '5',
      content:
        'Your dedication, hard work, and sense of responsibility are truly appreciated. Keep up the good work, and wishing you all the best for your future!',
    }
  ];

  const total = testimonials.length;
  // 3 duplicate sets for seamless infinite loop sliding
  const extendedList = [...testimonials, ...testimonials, ...testimonials];

  const [cardsPerView, setCardsPerView] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(total); // start at the middle set
  const [isTransitioning, setIsTransitioning] = useState(true);
  const touchStartX = useRef<number | null>(null);

  // Responsive cards per view (capped at total testimonials)
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCardsPerView(1);
      } else {
        // Never exceed total testimonials (e.g. 2 testimonials = 2 cards max)
        setCardsPerView(Math.min(total, width < 1024 ? 2 : 3));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [total]);

  const handlePrev = () => {
    if (!isTransitioning) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (!isTransitioning) return;
    setCurrentIndex((prev) => prev + 1);
  };

  // Seamless jump without animation once boundary is crossed
  const handleTransitionEnd = () => {
    if (currentIndex >= total * 2) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - total);
    } else if (currentIndex < total) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + total);
    }
  };

  // Re-enable smooth transition after instant reset
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  // Active indicator dot calculation
  const activeDot = ((currentIndex % total) + total) % total;

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-slate-950/60 border-y border-slate-800/80">
      {/* Background radial glow tailored to royal plum / mulberry theme */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-[#701a75]/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#701a75]/20 border border-[#a21caf]/35 text-[#f0abfc] text-xs font-semibold mb-3 shadow-sm shadow-[#701a75]/20">
            <span>Clients Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            Happy Clients Testimonials
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Real feedback from enterprise partners, engineering peers, and product founders.
          </p>
        </div>

        {/* Carousel Outer Wrapper */}
        <div className="relative max-w-4xl mx-auto px-6 sm:px-10">

          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            aria-label="Previous testimonial"
            className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/90 border border-[#86198f]/40 hover:border-[#c026d3] text-white flex items-center justify-center transition-all hover:scale-110 hover:bg-[#701a75] shadow-xl shadow-[#701a75]/20 backdrop-blur-md active:scale-95 group"
          >
            <ChevronLeft className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            aria-label="Next testimonial"
            className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/90 border border-[#86198f]/40 hover:border-[#c026d3] text-white flex items-center justify-center transition-all hover:scale-110 hover:bg-[#701a75] shadow-xl shadow-[#701a75]/20 backdrop-blur-md active:scale-95 group"
          >
            <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
          </button>

          {/* Smooth Sliding Viewport (px-0 to eliminate side slivers) */}
          <div
            className="overflow-hidden pt-5 pb-3 px-0"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
                transition: isTransitioning
                  ? 'transform 550ms cubic-bezier(0.22, 1, 0.36, 1)'
                  : 'none',
              }}
              className="flex will-change-transform"
            >
              {extendedList.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  style={{ width: `${100 / cardsPerView}%` }}
                  className="flex-shrink-0 px-3 sm:px-3.5 box-border"
                >
                  {/* Compact Card — Reverted to sleek earlier card proportions */}
                  <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-7 flex flex-col justify-between backdrop-blur-xl h-full min-h-[320px] max-w-[420px] mx-auto bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-[#4a044e]/20 border-2 border-[#86198f]/45 hover:border-[#c026d3] shadow-xl shadow-[#701a75]/20 hover:shadow-[#a21caf]/25 transition-all duration-300 hover:-translate-y-1 group">

                    {/* Floating Plum Quotation Mark Badge at Top Left */}
                    <div className="absolute -top-3.5 left-5 sm:left-6 px-2.5 py-1 rounded-md bg-gradient-to-br from-[#a21caf] to-[#701a75] text-white shadow-md shadow-[#701a75]/50 flex items-center justify-center border border-[#f0abfc]/30">
                      <Quote className="w-3.5 h-3.5 fill-white text-white" />
                    </div>

                    {/* Top: Star Rating Badge Pill in Royal Plum */}
                    <div className="flex justify-center mb-4 pt-1">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-gradient-to-r from-[#701a75] via-[#86198f] to-[#701a75] border border-[#d946ef]/40 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#701a75]/40 tracking-wide">
                        <Star className="w-3.5 h-3.5 fill-white text-white" />
                        <span>{item.rating}</span>
                      </div>
                    </div>

                    {/* Body: Testimonial Quote */}
                    <div className="my-auto py-1">
                      <p className="text-slate-200 text-xs sm:text-sm leading-relaxed text-center italic">
                        &ldquo;{item.content}&rdquo;
                      </p>
                    </div>

                    {/* Bottom: Reviewer Profile */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.avatarGradient} flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#a21caf]/40 flex-shrink-0 shadow-md`}
                      >
                        {item.avatar}
                      </div>

                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                          {item.name}
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        </h4>
                        <p className="text-xs text-[#f0abfc]/90 font-medium truncate">
                          {item.role}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.link ? (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[#f0abfc] transition-colors"
                            >
                              {item.company}
                            </a>
                          ) : (
                            item.company
                          )}{' '}
                          • {item.location}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Carousel Pagination Indicator Dots */}
        <div className="flex justify-center items-center gap-2 mt-5">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIsTransitioning(true);
                setCurrentIndex(total + i);
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${i === activeDot
                ? 'w-8 h-2.5 bg-gradient-to-r from-[#86198f] to-[#c026d3] shadow-sm shadow-[#86198f]/60'
                : 'w-2.5 h-2.5 bg-slate-800 hover:bg-slate-700'
                }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
