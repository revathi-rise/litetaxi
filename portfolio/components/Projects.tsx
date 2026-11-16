'use client';

import { useState } from 'react';
import { ArrowRight, X, CheckCircle2, ExternalLink } from 'lucide-react';

interface ProjectModalData {
  title: string;
  category: string;
  tech: string;
  badge: string;
  overview: string;
  architecture: string[];
  highlights: string[];
  techStack: string[];
  liveUrl?: string;
}

export default function Projects() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'web' | 'booking' | 'erp'>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectModalData | null>(null);

  const projects = [
    {
      id: 'vtagu',
      title: 'Vtagu · Video Streaming Platform',
      category: 'web',
      badge: 'Media & Entertainment',
      tech: 'NodeJs, NextJs, MySQL, Razorpay',
      emoji: '🎬',
      gradient: 'from-[#222] to-[#181818]',
      liveUrl: 'https://vtagu.in',
      summary: 'Engineered responsive video streaming and content delivery platform with smooth player controls, secure user profile accounts, premium membership subscription tiers via Razorpay, and administrative video catalog tools.',
      features: [
        'Adaptive video playback player with user watch-history and bookmarked channels.',
        'Razorpay payment gateway integration for recurring premium plan subscriptions.',
        'Comprehensive admin panel for video ingest, metadata tagging, and access moderation.',
      ],
      techStack: ['NodeJs', 'NextJs', 'MySQL', 'Razorpay', 'BunnyCdn'],
      details: {
        title: 'Vtagu — On-Demand Video Streaming Application',
        category: 'Video Streaming & Monetization',
        tech: 'NodeJs, NextJs, MySQL, Razorpay, BunnyCdn',
        badge: 'Streaming & VOD',
        liveUrl: 'https://vtagu.in',
        overview: 'A full-featured video-on-demand platform offering seamless video streaming, user account management, premium content paywalls, and comprehensive back-office content curation.',
        architecture: [
          'Playback Layer: NextJs video player with playback memory and resume capabilities.',
          'Backend Core: NestJs framework architecture handling video metadata, user state, and subscription lifecycles.',
          'Payment Gateway: Razorpay integration enabling automated instant access upon successful plan subscription.',
        ],
        highlights: [
          'Low-latency video catalog browsing across thousands of video assets',
          'Secure token-authenticated premium streams preventing unauthorized URL sharing',
          'Automated email receipts and subscription renewal notifications',
        ],
        techStack: ['NodeJs', 'NextJs', 'MySQL', 'Razorpay API', 'HTML5 Video'],
      },
    },
    {
      id: 'quiklr',
      title: 'LiteTaxi · Cab Booking System',
      category: 'booking',
      badge: 'Mobility & Booking',
      tech: 'NodeJs, NextJs, Pgsql, Google Map, Razorpay',
      emoji: '🛵',
      gradient: 'from-[#222] to-[#181818]',
      liveUrl: 'http://66.116.253.203:3000/',
      summary: 'Developed real-time taxi booking APIs, complete driver onboarding and document verification workflows, estimated distance-based fare calculators, Razorpay payments, and dynamic administrative pricing controls.',
      features: [
        'Interactive booking APIs with automated driver proximity matching and ride status updates.',
        'Driver onboarding workflow with KYC document verification and vehicle registration.',
        'Dynamic distance-based fare calculator with surge pricing rules and Razorpay settlement.',
      ],
      techStack: ['NextJs', 'NodeJs', 'Pgsql', 'Razorpay', 'REST APIs'],
      details: {
        title: 'LiteTaxi — Cab Booking Platform',
        category: 'Urban Mobility & Fleet Dispatch',
        tech: 'NextJs, NodeJs, Pgsql, Google Map, Razorpa',
        badge: 'Mobility & Booking',
        liveUrl: 'http://66.116.253.203:3000/',
        overview: 'A specialized cab booking platform built to provide instant, affordable transit through automated driver assignment, live fare calculation, and cashless checkouts.',
        architecture: [
          'Dispatch Engine: Proximity calculation algorithm matching rider pickup coordinates with nearest online bike captains.',
          'RESTful API Layer: High-performance endpoints consumed by mobile interfaces for trip lifecycle management.',
          'Billing Engine: Automated fare matrix calculation based on base fare, per-kilometer rate, and waiting duration.',
        ],
        highlights: [
          'Streamlined driver onboarding process reducing verification time by 40%',
          'Secure Razorpay payment integration with automated ride invoice generation',
          'Granular admin dashboard for managing city geo-zones and surge pricing multipliers',
        ],
        techStack: ['NextJs', 'NodeJs', 'Pgsql', 'Razorpay', 'REST APIs'],
      },
    },
    {
      id: 'jobgatez',
      title: 'JobGatez · Recruitment & Job Portal',
      category: 'web',
      badge: 'HRTech & Career Portal',
      tech: 'PHP (CodeIgniter), MySQL, jQuery',
      emoji: '💼',
      gradient: 'from-[#222] to-[#181818]',
      liveUrl: 'https://jobgatez.com',
      summary: 'Built complete recruitment ecosystem connecting job candidates, corporate employers, and college placement cells with multi-filter job search, candidate shortlisting, resume parsers, and admin verification.',
      features: [
        'Dedicated triple-role portals: Candidate portal, Employer dashboard, and College Placement Cell.',
        'Advanced faceted job search with real-time filters by experience, salary, and domain.',
        'Employer applicant tracking system (ATS) with interview status scheduling.',
      ],
      techStack: ['PHP (CodeIgniter)', 'MySQL', 'jQuery', 'Bootstrap', 'Ajax'],
      details: {
        title: 'JobGatez — Multi-Tier Employment & Career Hub',
        category: 'Recruitment & Job Search Ecosystem',
        tech: 'PHP (CodeIgniter), MySQL, jQuery',
        badge: 'Recruitment Portal',
        liveUrl: 'https://jobgatez.com',
        overview: 'A high-capacity employment portal connecting thousands of active job seekers, recruitment agencies, and academic placement cells to accelerate hiring and streamline campus recruitment drives.',
        architecture: [
          'Role-Based Architecture: Strict RBAC separating candidate applications, recruiter postings, and institutional placement drives.',
          'Search & Match Engine: Optimized MySQL full-text queries for sub-second candidate and job indexing.',
          'Workflow Automation: Automated email triggers for job alerts, application acknowledgments, and interview scheduling.',
        ],
        highlights: [
          'Facilitated thousands of successful candidate placements across diverse enterprise industries',
          'Custom placement-cell portal allowing colleges to track cohort interview outcomes',
          'Responsive candidate dashboard with instant profile completion tracking',
        ],
        techStack: ['PHP', 'CodeIgniter', 'MySQL', 'jQuery', 'AJAX', 'Bootstrap'],
      },
    },
    {
      id: 'stw-erp',
      title: 'STW ERP · Enterprise Resource Planning',
      category: 'erp',
      badge: 'Enterprise Software',
      tech: 'PHP (CodeIgniter), MySQL, jQuery',
      emoji: '📊',
      gradient: 'from-[#222] to-[#181818]',
      summary: 'Implemented mission-critical purchase and sales lifecycle workflows, dynamic product QR code generation, real-time AfterShip logistics tracking integration, dynamic multi-currency PDF invoices, Excel bulk imports, and automated database backups.',
      features: [
        'End-to-end purchase orders, vendor procurement, stock inventory, and sales ledger management.',
        'Dynamic QR code generation per SKU for instant warehouse scanning and audit verification.',
        'AfterShip API integration providing real-time package transit milestones to customers.',
      ],
      techStack: ['PHP (CodeIgniter)', 'MySQL', 'AfterShip API', 'QR Code SDK', 'Excel Parser'],
      details: {
        title: 'STW ERP — Complete Enterprise Operations Management',
        category: 'Supply Chain, Inventory & ERP',
        tech: 'PHP (CodeIgniter), MySQL, jQuery',
        badge: 'ERP & Logistics',
        overview: 'A comprehensive operational ERP platform engineered to synchronize enterprise procurement, warehouse stock control, customer dispatching, shipment tracking, and financial invoicing under one unified system.',
        architecture: [
          'Core Inventory Engine: Real-time stock decrement and reorder threshold alerting across multiple warehouse locations.',
          'Third-Party Integrations: AfterShip logistics webhook synchronizer, QR code barcode generation, and Excel bulk dataset parsers.',
          'Financial Module: Dynamic PDF invoice generation with tax calculations, discount ledgers, and audit-proof daily backups.',
        ],
        highlights: [
          'Drastically reduced manual warehouse stock auditing time with integrated QR code scanning',
          'Automated real-time parcel tracking directly embedded into customer notification emails',
          'Reliable automated multi-table database backup routines safeguarding enterprise data integrity',
        ],
        techStack: ['PHP', 'CodeIgniter', 'MySQL', 'jQuery', 'AfterShip API', 'QR Code'],
      },
    },
    {
      id: 'literact',
      title: 'Literact · E-Learning Platform',
      category: 'web',
      badge: 'EdTech & Learning',
      tech: 'PHP (CodeIgniter), MySQL, jQuery',
      emoji: '🎓',
      gradient: 'from-[#222] to-[#181818]',
      summary: 'Developed comprehensive educational platform with dual instructor and student workflows, curriculum & lesson management, paid course enrollment via Razorpay integration, student progress tracking, and administrative controls.',
      features: [
        'Rich course authoring tools for instructors to upload video lectures, quizzes, and study modules.',
        'Secure paid course access paywalls with instant enrollment upon Razorpay checkout.',
        'Interactive student learning dashboard with lesson completion checklists and certificate issuance.',
      ],
      techStack: ['PHP (CodeIgniter)', 'MySQL', 'jQuery', 'Razorpay', 'Bootstrap'],
      details: {
        title: 'Literact — Digital E-Learning & Course Academy',
        category: 'EdTech & Course Delivery',
        tech: 'PHP (CodeIgniter), MySQL, jQuery',
        badge: 'EdTech Academy',
        overview: 'An accessible, feature-packed online learning academy empowering instructors to monetize educational content and students to acquire practical skills through video lectures, assessments, and verifiable course certificates.',
        architecture: [
          'Instructional Portal: Module-based curriculum organizer allowing multi-part chapter creation with downloadable resources.',
          'Enrollment & Payment: Razorpay webhook integration ensuring instantaneous student access authorization upon transaction success.',
          'Progress Tracking: Granular per-lesson tracking measuring video completion and milestone achievement.',
        ],
        highlights: [
          'Seamless paid course enrollment with 100% automated receipt generation',
          'Interactive quiz assessments with instant score computation and feedback',
          'Administrative moderation console for instructor credential verification and revenue split reporting',
        ],
        techStack: ['PHP', 'CodeIgniter', 'MySQL', 'jQuery', 'Razorpay API', 'Bootstrap'],
      },
    },
    {
      id: 'nikmat-furniture',
      title: 'Nikmat Furniture · E-Commerce Portal',
      category: 'booking',
      badge: 'Furniture & Decor E-Commerce',
      tech: 'PHP, MySQL, jQuery, Bootstrap, Cart & Tracking',
      emoji: '🛋️',
      gradient: 'from-[#222] to-[#181818]',
      liveUrl: 'https://nikmat.in',
      summary: 'Engineered responsive online furniture shopping portal featuring multi-category product catalog (sofas, tables, chairs, decor), dynamic cart & checkout, order tracking, and customer WhatsApp inquiry integration.',
      features: [
        'Comprehensive furniture catalog showcasing detailed specifications, variant pricing, and promotional discount badges.',
        'Interactive shopping cart, wishlist, and secure multi-step checkout with real-time order status tracking.',
        'Administrative inventory console for category curation, product stock monitoring, and order fulfillment dispatching.',
      ],
      techStack: ['PHP', 'MySQL', 'jQuery', 'Bootstrap', 'Order Tracking', 'CSS3'],
      details: {
        title: 'Nikmat Furniture — E-Commerce Furniture & Home Decor Store',
        category: 'Furniture E-Commerce & Retail Portal',
        tech: 'PHP, MySQL, jQuery, Bootstrap, Razorpay',
        badge: 'E-Commerce Platform',
        liveUrl: 'https://nikmat.in',
        overview: 'A full-featured digital shopping destination built for Nikmat Furniture to showcase handcrafted home and office furniture, manage retail orders, track deliveries, and provide direct customer support.',
        architecture: [
          'Catalog Architecture: Hierarchical product indexing supporting custom dimensions, material finishes, and promotional discounts.',
          'Cart & Transaction Pipeline: Seamless shopping cart lifecycle with instant totals, coupon validation, and order submission.',
          'Logistics & Customer Support: Integrated order tracking module and direct WhatsApp click-to-chat inquiry system for custom orders.',
        ],
        highlights: [
          'Fast, mobile-optimized browsing experience across extensive home decor and furniture categories',
          'Automated order management system reducing dispatch coordination overhead',
          'Direct customer engagement through WhatsApp ordering and real-time delivery status updates',
        ],
        techStack: ['PHP', 'MySQL', 'jQuery', 'Bootstrap', 'HTML5', 'CSS3'],
      },
    },
  ];

  const filteredProjects = projects.filter((project) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'web') return project.category === 'web';
    if (activeFilter === 'booking') return project.category === 'booking';
    if (activeFilter === 'erp') return project.category === 'erp';
    return true;
  });

  return (
    <section id="projects" className="py-24 relative bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
            <span>Production Platforms</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Production Platforms & Enterprise Delivery
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Proven platforms engineered across video streaming, bike booking, ERP, e-learning, and e-commerce.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {[
            { id: 'all', label: `All Projects (${projects.length})` },
            { id: 'web', label: `Portals & Streaming (${projects.filter(p => p.category === 'web').length})` },
            { id: 'booking', label: `Booking & E-Commerce (${projects.filter(p => p.category === 'booking').length})` },
            { id: 'erp', label: `ERP & Supply Chain (${projects.filter(p => p.category === 'erp').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all ${activeFilter === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-500/40'
                : 'bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-white hover:border-purple-500/40'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-slate-900/60 rounded-2xl overflow-hidden border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col group shadow-xl hover:-translate-y-1.5 backdrop-blur-md"
            >
              {/* Banner */}
              <div className="h-40 bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 relative flex items-center justify-center overflow-hidden border-b border-slate-800">
                <div className="text-5xl filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  {project.emoji}
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-purple-500/30 text-[10px] font-bold text-purple-300 backdrop-blur-md">
                  {project.badge}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-xs font-mono text-cyan-400 mb-1 font-semibold">{project.tech}</div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                    {project.title}
                  </h3>
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-cyan-400 p-1 rounded-md hover:bg-slate-800 transition-colors flex-shrink-0"
                      title="Open Project Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
                  {project.summary}
                </p>

                <ul className="space-y-1.5 mb-5">
                  {project.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <span className="text-purple-400 font-bold">▹</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer bar */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 mt-auto">
                  <div className="flex flex-wrap gap-1 max-w-[50%]">
                    {project.techStack.slice(0, 3).map((tech, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className="text-[10px] text-slate-500 font-mono py-0.5">+{project.techStack.length - 3}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-cyan-300 border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-500 hover:text-slate-950 transition-all whitespace-nowrap shadow-sm"
                        title="Live Project Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Link</span>
                      </a>
                    )}

                    <button
                      onClick={() => setSelectedProject(project.details)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-300 border border-purple-500/30 bg-purple-950/30 hover:bg-purple-600 hover:text-white transition-all whitespace-nowrap"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Project Deep Dive Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900/95 border border-purple-500/40 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/80 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                  {selectedProject.badge}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{selectedProject.category}</span>
              </div>
              {selectedProject.liveUrl && (
                <a
                  href={selectedProject.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-500 hover:text-slate-950 transition-all mr-8 sm:mr-10 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Visit Project</span>
                </a>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">{selectedProject.title}</h3>
            <div className="text-xs font-mono text-cyan-400 mb-5">{selectedProject.tech}</div>

            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Project Overview</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{selectedProject.overview}</p>
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Architectural Breakdown</h4>
              <ul className="space-y-2">
                {selectedProject.architecture.map((arch, aIdx) => (
                  <li key={aIdx} className="text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>{arch}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Technical Achievements</h4>
              <ul className="space-y-2">
                {selectedProject.highlights.map((high, hIdx) => (
                  <li key={hIdx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-purple-400 font-bold">★</span>
                    <span>{high}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Technologies Deployed</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProject.techStack.map((tech, tIdx) => (
                  <span key={tIdx} className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
