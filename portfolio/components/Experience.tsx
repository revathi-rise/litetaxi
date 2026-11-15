import { Briefcase, Calendar, MapPin } from 'lucide-react';

export default function Experience() {
  const experiences = [
    {
      period: '2022 — PRESENT',
      role: 'Technical Lead',
      company: 'Techno Tackle Software Solutions',
      location: 'Coimbatore, India',
      description: [
        'Lead and coordinate cross-functional teams of developers and QA engineers across multiple client deliverables.',
        'Manage end-to-end client communications, technical scope definitions, and architectural governance.',
        'Ensure rigorous code quality, sprint cadence, and on-time delivery across web and mobile platforms.',
        'Spearhead technical problem solving, code reviews, and developer mentorship.',
      ],
      skills: ['Team Leadership', 'Client Coordination', 'QA Management', 'Next.js', 'Node.js', 'PHP Frameworks', 'Delivery'],
    },
    {
      period: '2020 — 2022',
      role: 'Software Engineer',
      company: 'Haqto Technologies',
      location: 'Coimbatore, India',
      description: [
        'Developed and maintained high-traffic video-streaming, online gaming, job-portal, and e-learning platforms.',
        'Engineered dynamic car and bike booking applications with fare estimations and Razorpay integrations.',
        'Constructed custom ERP systems with barcode tracking, invoicing, and logistics status synchronizers.',
        'Built full-featured e-commerce shopping portals with product catalogs and secure checkout gateways.',
      ],
      skills: ['CodeIgniter', 'Laravel', 'MySQL', 'jQuery', 'Razorpay', 'AfterShip API', 'ERP Systems'],
    },
    {
      period: '2017 — 2020',
      role: 'PHP Programmer',
      company: 'Freelance & Independent Consulting',
      location: 'Remote / India',
      description: [
        'Architected and deployed custom PHP web applications and mobile-responsive business websites for international and domestic clients.',
        'Designed and developed specialized e-commerce shopping portals and classified-listing directories.',
        'Managed full lifecycle project management from client requirements gathering to production server deployment.',
      ],
      skills: ['PHP', 'MySQL', 'HTML5/CSS3', 'JavaScript', 'WordPress', 'Classified Portals'],
    },
    {
      period: '2015 — 2017',
      role: 'PHP Programmer',
      company: 'Panjabootham Groups',
      location: 'Chennai, India',
      description: [
        'Worked as a full-time PHP programmer designing, maintaining, and scaling a dedicated PHP-based digital recharge portal.',
        'Engineered transactional payment processing and automated ledger synchronization routines.',
        'Optimized MySQL relational queries and ensured secure transaction logging.',
      ],
      skills: ['PHP', 'MySQL', 'Recharge Portal', 'API Integration', 'Payment Gateways'],
    },
    {
      period: '2014 — 2015',
      role: 'Designer & Developer',
      company: 'SRK IT Solutions',
      location: 'Chennai, India',
      description: [
        'Designed semantic, responsive HTML/CSS website interfaces and conducted PHP development.',
        'Gained in-depth practical experience architecting structured web applications using the Yii framework.',
        'Created design mockups in Photoshop and translated them into clean, cross-browser compatible frontend code.',
      ],
      skills: ['HTML Design', 'PHP', 'Yii Framework', 'Photoshop', 'CSS', 'JavaScript'],
    },
  ];

  return (
    <section id="experience" className="py-24 bg-slate-950/60 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
            <span>Career Journey</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            A Decade of Engineering Progression
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            From hands-on web programming to leading cross-functional engineering and QA teams as a Technical Lead.
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto relative pl-6 sm:pl-8 border-l border-purple-500/30 space-y-12">
          {experiences.map((exp, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Node */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-purple-500 shadow-md shadow-purple-500/50 group-hover:scale-125 transition-transform" />

              {/* Card */}
              <div className="bg-slate-900/60 rounded-2xl p-6 sm:p-8 border border-slate-800 hover:border-purple-500/40 transition-all hover:translate-x-1 shadow-lg backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{exp.period}</span>
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{exp.location}</span>
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                  {exp.role}
                </h3>
                <div className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  <span>{exp.company}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {exp.description.map((item, dIdx) => (
                    <li key={dIdx} className="text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-purple-400 font-bold">▹</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                  {exp.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
