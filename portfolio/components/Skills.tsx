import { Users, Server, Code2, Database, Wrench, ShieldCheck } from 'lucide-react';

export default function Skills() {
  const categories = [
    {
      icon: <Users className="w-5 h-5 text-purple-400" />,
      title: 'Leadership & Management',
      skills: [
        'Team Leadership',
        'Client Communication',
        'Project Coordination',
        'Delivery Management',
        'Developer Mentorship',
        'QA Coordination',
        'Sprint Planning',
        'Requirements Analysis',
      ],
    },
    {
      icon: <Server className="w-5 h-5 text-cyan-400" />,
      title: 'Backend Engineering',
      skills: [
        'PHP',
        'Laravel',
        'CodeIgniter',
        'Yii / Yii2',
        'Node.js',
        'NestJS',
        'RESTful APIs',
        'Razorpay Integration',
        'Authentication & RBAC',
        'Webhook Processing',
      ],
    },
    {
      icon: <Code2 className="w-5 h-5 text-indigo-400" />,
      title: 'Frontend Development',
      skills: [
        'JavaScript (ES6+)',
        'jQuery',
        'React.js',
        'Next.js',
        'HTML5',
        'CSS3',
        'Bootstrap',
        'Tailwind CSS',
        'AJAX',
        'Responsive Design',
      ],
    },
    {
      icon: <Database className="w-5 h-5 text-emerald-400" />,
      title: 'Databases & Storage',
      skills: [
        'MySQL',
        'PostgreSQL',
        'Relational Schema Design',
        'Query Optimization',
        'Database Backups',
        'Table Indexing',
        'Data Migrations',
        'Excel Bulk Ingestion',
      ],
    },
    {
      icon: <Wrench className="w-5 h-5 text-amber-400" />,
      title: 'Tools & Platforms',
      skills: [
        'Git & GitHub',
        'WordPress',
        'Magento',
        'Hardhat',
        'Thirdweb',
        'Adobe Photoshop',
        'AfterShip Logistics',
        'QR Code SDKs',
      ],
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
      title: 'Domain Expertise',
      skills: [
        'Web & Mobile Portals',
        'Video Streaming (VOD)',
        'ERP & Supply Chain',
        'Recruitment & Job Portals',
        'E-Learning (EdTech)',
        'Bike & Car Booking',
        'E-Commerce Portals',
        'Technical Content (LiteSpark)',
      ],
    },
  ];

  return (
    <section id="skills" className="py-24 bg-slate-950/50 border-y border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 mb-2 block">
            Technical Skills
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Core Competencies & Tooling
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Over a decade of practical expertise across modern frameworks, relational databases, and engineering team leadership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-6 sm:p-7 border border-white/5 hover:border-purple-500/30 transition-all hover:-translate-y-1.5 shadow-lg group"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {cat.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{cat.title}</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {cat.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/[0.04] text-slate-300 border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white transition-all cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
