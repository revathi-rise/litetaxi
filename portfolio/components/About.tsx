import { Users, Server, ShieldCheck, Award, CheckCircle } from 'lucide-react';

export default function About() {
  const pillars = [
    {
      icon: <Users className="w-6 h-6 text-purple-400" />,
      title: 'Engineering Leadership',
      description: 'Guiding multi-disciplinary developer and QA squads, driving sprint coordination, and managing direct client technical communications.',
    },
    {
      icon: <Server className="w-6 h-6 text-cyan-400" />,
      title: 'Full-Stack Web Mastery',
      description: 'Hands-on architectural depth across modern PHP (Laravel, Yii2, CodeIgniter), Next.js, React.js, Node.js, and relational databases.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: 'Mission-Critical Platforms',
      description: 'Delivered robust enterprise systems spanning ERP supply chains, video streaming, booking platforms, and high-volume job portals.',
    },
    {
      icon: <Award className="w-6 h-6 text-amber-400" />,
      title: 'Award-Winning Delivery',
      description: 'Recognized with Top Gun, Emerging Leader, and Best Team Player honors for consistent delivery excellence and technical leadership.',
    },
  ];

  const highlights = [
    '10+ Years Web Application Development & Delivery',
    'Proven Leadership of Developers & QA Engineers',
    'Client Communication & Direct Project Coordination',
    'Creator of LiteSpark Technical Educational Channel',
  ];

  return (
    <section id="about" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 mb-2 block">
            About Me
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            A Decade of Engineering Leadership & Web Innovation
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Guiding development teams, building client trust, and shipping enterprise-grade web applications.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Narrative Box */}
          <div className="lg:col-span-6 glass-card rounded-3xl p-8 sm:p-10 border border-white/5 relative">
            <h3 className="text-2xl font-bold text-white mb-4">
              Driving Technical Excellence & <span className="gradient-text">Delivery Success</span>
            </h3>
            
            <p className="text-slate-400 leading-relaxed mb-4">
              I am a technology professional with <strong className="text-slate-200">10+ years of experience</strong> in web application development, maintenance, and technical delivery.
              Throughout my career, I have thrived at the intersection of technical architecture and team leadership — coordinating developers and QA engineers, collaborating directly with clients, and delivering high-value platforms.
            </p>

            <p className="text-slate-400 leading-relaxed mb-6">
              My hands-on experience bridges established enterprise frameworks (PHP, Laravel, CodeIgniter, Yii/Yii2) with modern web stacks (React, Next.js, Node.js, NestJS, and MySQL/PostgreSQL).
              Beyond software delivery, I create and manage <strong>LiteSpark</strong>, a YouTube channel producing high-quality educational and technical shorts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right 4-Pillars Grid */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center mb-4 shadow-md">
                  {pillar.icon}
                </div>
                <h4 className="text-base font-bold text-white mb-2">{pillar.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
