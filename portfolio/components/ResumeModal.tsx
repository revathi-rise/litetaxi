'use client';

import { X, Printer, Mail, Phone, MapPin, Youtube, Award, GraduationCap } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResumeModal({ isOpen, onClose }: ResumeModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-10 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/80 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <img
              src="/profile.jpg"
              alt="Revathi K."
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover object-top ring-2 ring-purple-500/50 shadow-lg flex-shrink-0"
            />
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">REVATHI K.</h2>
              <p className="text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">TECHNICAL LEAD | FULL-STACK WEB DEVELOPMENT</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>revathimss7@gmail.com</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+91 99941 57428</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Coimbatore, India</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30 transition-all self-start sm:self-center"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* Resume Content */}
        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          
          {/* Professional Summary */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">Professional Summary</h3>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
              Technology professional with 10+ years of experience in web application development, maintenance, and delivery. 
              Experienced in leading developers and QA engineers, coordinating with clients, and contributing to platforms across 
              e-commerce, ERP, job portals, e-learning, video streaming, and booking applications. Hands-on 
              experience with PHP frameworks, JavaScript technologies, React/Next.js, Node.js/NestJS, and relational databases.
            </p>
          </div>

          {/* Technical Skills */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">Technical Skills</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <strong className="text-white block mb-0.5">Leadership:</strong>
                <span className="text-slate-400">Team leadership, client communication, project coordination, delivery</span>
              </div>
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <strong className="text-white block mb-0.5">Backend:</strong>
                <span className="text-slate-400">PHP, Laravel, CodeIgniter, Yii/Yii2, Node.js, NestJS</span>
              </div>
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <strong className="text-white block mb-0.5">Frontend:</strong>
                <span className="text-slate-400">JavaScript, jQuery, React.js, Next.js, HTML, CSS, Bootstrap, Tailwind CSS</span>
              </div>
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <strong className="text-white block mb-0.5">Databases:</strong>
                <span className="text-slate-400">MySQL, PostgreSQL</span>
              </div>
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 sm:col-span-2">
                <strong className="text-white block mb-0.5">Tools & Platforms:</strong>
                <span className="text-slate-400">Git, WordPress, Magento, Hardhat, Thirdweb, Photoshop, AfterShip, QR Generation</span>
              </div>
            </div>
          </div>

          {/* Professional Experience */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">Professional Experience</h3>
            
            <div className="space-y-4">
              <div className="border-l-2 border-purple-500 pl-4 py-1">
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="font-bold text-white text-sm">Technical Lead</span>
                  <span className="font-mono text-cyan-400">2022 — Present</span>
                </div>
                <div className="text-xs text-purple-300 font-semibold mb-1.5">Techno Tackle Software Solutions · Coimbatore</div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  <li>Lead and coordinate developers and QA engineers.</li>
                  <li>Manage client communication alongside technical delivery and team coordination.</li>
                </ul>
              </div>

              <div className="border-l-2 border-purple-500 pl-4 py-1">
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="font-bold text-white text-sm">Software Engineer</span>
                  <span className="font-mono text-cyan-400">2020 — 2022</span>
                </div>
                <div className="text-xs text-purple-300 font-semibold mb-1.5">Haqto Technologies · Coimbatore</div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  <li>Developed and maintained video-streaming, gaming, job-portal, and e-learning websites.</li>
                  <li>Worked on car and bike booking applications, ERP systems, and shopping portals.</li>
                </ul>
              </div>

              <div className="border-l-2 border-purple-500 pl-4 py-1">
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="font-bold text-white text-sm">PHP Programmer</span>
                  <span className="font-mono text-cyan-400">2017 — 2020</span>
                </div>
                <div className="text-xs text-purple-300 font-semibold mb-1.5">Freelance</div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  <li>Built custom PHP web applications and mobile-responsive websites.</li>
                  <li>Designed and developed shopping portals and classified-listing websites.</li>
                </ul>
              </div>

              <div className="border-l-2 border-purple-500 pl-4 py-1">
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="font-bold text-white text-sm">PHP Programmer</span>
                  <span className="font-mono text-cyan-400">2015 — 2017</span>
                </div>
                <div className="text-xs text-purple-300 font-semibold mb-1.5">Panjabootham Groups · Chennai</div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  <li>Worked as a full-time PHP programmer and designed a PHP-based recharge portal.</li>
                </ul>
              </div>

              <div className="border-l-2 border-purple-500 pl-4 py-1">
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="font-bold text-white text-sm">Designer & Developer</span>
                  <span className="font-mono text-cyan-400">2014 — 2015</span>
                </div>
                <div className="text-xs text-purple-300 font-semibold mb-1.5">SRK IT Solutions · Chennai</div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  <li>Worked on HTML website design and PHP development, with practical experience using Yii.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Selected Projects */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">Selected Projects (7 Major Deliveries)</h3>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="font-bold text-white text-sm flex justify-between">
                  <span>Vtagu · Video Streaming</span>
                  <span className="text-[11px] font-mono text-cyan-400">PHP (CodeIgniter), MySQL, jQuery</span>
                </div>
                <p className="text-slate-400 mt-1">Implemented video playback and user-account features, Razorpay premium plans, and video administration tools.</p>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="font-bold text-white text-sm flex justify-between">
                  <span>JobGatez · Job Portal</span>
                  <span className="text-[11px] font-mono text-cyan-400">PHP (CodeIgniter), MySQL, jQuery</span>
                </div>
                <p className="text-slate-400 mt-1">Built candidate, employer, and placement-cell workflows, job posting/search, shortlisting, and admin approval tools.</p>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="font-bold text-white text-sm flex justify-between">
                  <span>Literact · E-Learning</span>
                  <span className="text-[11px] font-mono text-cyan-400">PHP (CodeIgniter), MySQL, jQuery</span>
                </div>
                <p className="text-slate-400 mt-1">Developed instructor/student workflows, course management, paid course access, Razorpay integration, and admin controls.</p>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="font-bold text-white text-sm flex justify-between">
                  <span>STW ERP</span>
                  <span className="text-[11px] font-mono text-cyan-400">PHP (CodeIgniter), MySQL, jQuery</span>
                </div>
                <p className="text-slate-400 mt-1">Implemented purchase/sales workflows, product QR codes, AfterShip tracking, dynamic invoices, Excel imports, and table backups.</p>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="font-bold text-white text-sm flex justify-between">
                  <span>Quiklr · Bike Ride</span>
                  <span className="text-[11px] font-mono text-cyan-400">PHP (CodeIgniter), MySQL, jQuery</span>
                </div>
                <p className="text-slate-400 mt-1">Developed booking APIs, driver registration, estimated fare calculations, Razorpay payments, and admin pricing controls.</p>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="font-bold text-white text-sm flex justify-between">
                  <span>Glanz Special Tools · E-commerce</span>
                  <span className="text-[11px] font-mono text-cyan-400">PHP (Laravel), MySQL, jQuery</span>
                </div>
                <p className="text-slate-400 mt-1">Developed e-commerce functionality, Razorpay payment integration, and product administration.</p>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="font-bold text-white text-sm flex justify-between">
                  <span>Nikmat Furniture · E-Commerce</span>
                  <span className="text-[11px] font-mono text-cyan-400">PHP, MySQL, jQuery, Bootstrap</span>
                </div>
                <p className="text-slate-400 mt-1">Developed furniture shopping portal, dynamic category catalogs, interactive cart, order tracking, and WhatsApp support integration.</p>
              </div>
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span>Education</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span><strong>M.Sc. Software Systems</strong> — Sree Saraswathi Thyagaraja College, Pollachi (2009–2014)</span>
                <span className="font-bold text-emerald-400">80%</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span><strong>Higher Secondary (12th)</strong> — V.R.T. Government Girls Higher Secondary School, Anaimalai (2008–2009)</span>
                <span className="font-semibold text-white">82%</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span><strong>SSLC (10th)</strong> — V.R.T. Government Girls Higher Secondary School, Anaimalai (2007–2008)</span>
                <span className="font-semibold text-white">76%</span>
              </div>
            </div>
          </div>

          {/* Recognition & Additional Information */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Recognition & Additional Information</span>
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5">
              <li><strong>Awards:</strong> Top Gun, Emerging Leader, and Best Team Player.</li>
              <li>Completed Rich Internet Application training at Appin Technology Lab, Coimbatore.</li>
              <li>
                Created and managed <strong>LiteSpark</strong>, a YouTube Shorts channel focused on technical and educational content: 
                <a href="https://www.youtube.com/@litespark-r2r/shorts" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline ml-1 font-semibold">
                  https://www.youtube.com/@litespark-r2r/shorts
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
