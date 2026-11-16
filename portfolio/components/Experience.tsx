import { Briefcase, Calendar, MapPin } from 'lucide-react';

export default function Experience() {
  const experiences = [
    {
      period: '2022 — PRESENT',
      role: 'Technical Lead',
      company: 'Techno Tackle Software Solutions',
      location: 'Coimbatore, India',
      description: [
        'Lead cross-functional developer & QA teams across multiple client deliveries.',
        'Drive architectural governance, client communications, and sprint timelines.',
        'Spearhead code reviews, technical architecture, and engineer mentorship.',
      ],
      skills: ['Team Leadership', 'Client Coordination', 'QA Management', 'Next.js', 'Node.js', 'PHP Frameworks', 'Delivery'],
    },
    {
      period: '2020 — 2022',
      role: 'Software Engineer',
      company: 'Haqto Technologies',
      location: 'Coimbatore, India',
      description: [
        'Engineered high-traffic video-streaming, mobility booking, and e-learning platforms.',
        'Built custom ERPs with inventory barcode tracking, invoicing, and logistics.',
        'Integrated Razorpay payment gateways and automated invoice generation.',
      ],
      skills: ['CodeIgniter', 'Laravel', 'MySQL', 'jQuery', 'Razorpay', 'AfterShip API', 'ERP Systems'],
    },
    {
      period: '2017 — 2020',
      role: 'PHP Programmer',
      company: 'Freelance & Independent Consulting',
      location: 'Remote / India',
      description: [
        'Delivered custom PHP web applications, e-commerce stores, and directories.',
        'Managed full project lifecycles from technical scoping to production release.',
      ],
      skills: ['PHP', 'MySQL', 'HTML5/CSS3', 'JavaScript', 'WordPress', 'Classified Portals'],
    },
    {
      period: '2015 — 2017',
      role: 'PHP Programmer',
      company: 'Panjabootham Groups',
      location: 'Chennai, India',
      description: [
        'Scaled digital recharge portal handling high-volume transactions.',
        'Automated payment processing, ledger sync, and optimized MySQL queries.',
      ],
      skills: ['PHP', 'MySQL', 'Recharge Portal', 'API Integration', 'Payment Gateways'],
    },
    {
      period: '2014 — 2015',
      role: 'Designer & Developer',
      company: 'SRK IT Solutions',
      location: 'Chennai, India',
      description: [
        'Developed responsive web interfaces and PHP applications using Yii framework.',
        'Translated UI mockups into clean, cross-browser compatible web pages.',
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
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    <span>{exp.location}</span>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                  {exp.role}
                </h3>
                <div className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>{exp.company}</span>
                </div>

                {/* Shortened, Punchy Bullet Points */}
                <ul className="space-y-2 mb-6">
                  {exp.description.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed">
                      <span className="text-purple-400 font-bold flex-shrink-0 mt-0.5">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-800/80">
                  {exp.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-colors"
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
