'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon, Sparkles } from 'lucide-react';

interface HistoryItem {
  command: string;
  output: string | React.ReactNode;
}

export default function Terminal() {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      command: 'whoami',
      output: 'Revathi K. — Technical Lead | Full-Stack Web Development (10+ Years Experience)',
    },
    {
      command: 'help',
      output: 'Available commands: whoami, skills, projects, experience, awards, education, youtube, contact, cat resume.txt, sudo hire-me, clear',
    },
  ]);

  const terminalScrollRef = useRef<HTMLDivElement>(null);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();
    setInputVal('');

    if (lower === 'clear') {
      setHistory([]);
      return;
    }

    let result: string | React.ReactNode = '';

    switch (lower) {
      case 'help':
        result = (
          <div className="space-y-1 text-slate-300">
            <div className="text-purple-400 font-bold mb-1">Available CLI Commands:</div>
            <div>• <span className="text-white font-semibold">whoami</span> : Profile summary</div>
            <div>• <span className="text-white font-semibold">skills</span> : Core technical competencies</div>
            <div>• <span className="text-white font-semibold">projects</span> : List of 6 selected production systems</div>
            <div>• <span className="text-white font-semibold">experience</span> : Decade-long career milestones</div>
            <div>• <span className="text-white font-semibold">awards</span> : Honors and industry recognitions</div>
            <div>• <span className="text-white font-semibold">education</span> : Academic background & degrees</div>
            <div>• <span className="text-white font-semibold">youtube</span> : LiteSpark tech channel link</div>
            <div>• <span className="text-white font-semibold">contact</span> : Direct email and phone coordinates</div>
            <div>• <span className="text-white font-semibold">cat resume.txt</span> : Quick CV overview</div>
            <div>• <span className="text-white font-semibold">sudo hire-me</span> : Instant leadership interview invite</div>
            <div>• <span className="text-white font-semibold">clear</span> : Clear console</div>
          </div>
        );
        break;

      case 'whoami':
        result = (
          <div className="text-emerald-400">
            Revathi K. — Technical Lead at Techno Tackle Software Solutions. 10+ years driving web application development, developer mentorship, QA coordination, and client communication.
          </div>
        );
        break;

      case 'skills':
        result = (
          <div className="space-y-1 text-slate-300">
            <div><span className="text-cyan-400 font-bold">[Leadership]</span>: Team leadership, client communication, project coordination, delivery</div>
            <div><span className="text-cyan-400 font-bold">[Backend]</span>: PHP, Laravel, CodeIgniter, Yii/Yii2, Node.js, NestJS</div>
            <div><span className="text-cyan-400 font-bold">[Frontend]</span>: JavaScript, jQuery, React.js, Next.js, HTML, CSS, Bootstrap, Tailwind CSS</div>
            <div><span className="text-cyan-400 font-bold">[Databases]</span>: MySQL, PostgreSQL</div>
            <div><span className="text-cyan-400 font-bold">[Tools]</span>: Git, WordPress, Magento, Hardhat, Thirdweb, Photoshop</div>
          </div>
        );
        break;

      case 'projects':
        result = (
          <div className="space-y-1 text-slate-300">
            <div>1. <span className="text-purple-400 font-bold">Vtagu · Video Streaming</span> [PHP CodeIgniter, MySQL, jQuery, Razorpay]</div>
            <div>2. <span className="text-purple-400 font-bold">JobGatez · Job Portal</span> [PHP CodeIgniter, MySQL, jQuery, Placement Cell]</div>
            <div>3. <span className="text-purple-400 font-bold">Literact · E-Learning</span> [PHP CodeIgniter, MySQL, jQuery, Razorpay]</div>
            <div>4. <span className="text-purple-400 font-bold">STW ERP</span> [PHP CodeIgniter, MySQL, QR Codes, AfterShip, Invoices]</div>
            <div>5. <span className="text-purple-400 font-bold">Quiklr · Bike Ride</span> [PHP CodeIgniter, MySQL, Fare Calculation, Razorpay]</div>
            <div>6. <span className="text-purple-400 font-bold">Glanz Special Tools · E-commerce</span> [PHP Laravel, MySQL, Razorpay]</div>
            <div>7. <span className="text-purple-400 font-bold">Nikmat Furniture · E-Commerce</span> [PHP, MySQL, jQuery, Bootstrap, Cart & Tracking]</div>
          </div>
        );
        break;

      case 'experience':
        result = (
          <div className="space-y-1 text-slate-300">
            <div>• <span className="text-cyan-400 font-semibold">2022 — Present</span>: Technical Lead @ Techno Tackle Software Solutions (Coimbatore)</div>
            <div>• <span className="text-cyan-400 font-semibold">2020 — 2022</span>: Software Engineer @ Haqto Technologies (Coimbatore)</div>
            <div>• <span className="text-cyan-400 font-semibold">2017 — 2020</span>: PHP Programmer @ Freelance & Independent Consulting</div>
            <div>• <span className="text-cyan-400 font-semibold">2015 — 2017</span>: PHP Programmer @ Panjabootham Groups (Chennai)</div>
            <div>• <span className="text-cyan-400 font-semibold">2014 — 2015</span>: Designer & Developer @ SRK IT Solutions (Chennai)</div>
          </div>
        );
        break;

      case 'awards':
        result = (
          <div className="space-y-1 text-amber-300">
            <div>🏆 <span className="font-bold">Top Gun</span> — Recognized for superior delivery performance and technical execution.</div>
            <div>🏆 <span className="font-bold">Emerging Leader</span> — Honored for team mentorship, ownership, and coordination.</div>
            <div>🏆 <span className="font-bold">Best Team Player</span> — Celebrated for cross-functional collaboration and empathy.</div>
          </div>
        );
        break;

      case 'education':
        result = (
          <div className="space-y-1 text-slate-300">
            <div>• <span className="text-white font-bold">M.Sc. Software Systems</span> — Sree Saraswathi Thyagaraja College, Pollachi (2009–2014) · <span className="text-emerald-400 font-semibold">80%</span></div>
            <div>• <span className="text-white font-bold">Higher Secondary (12th)</span> — V.R.T. Govt Girls HSS, Anaimalai (2008–2009) · <span className="text-emerald-400 font-semibold">82%</span></div>
            <div>• <span className="text-white font-bold">SSLC (10th)</span> — V.R.T. Govt Girls HSS, Anaimalai (2007–2008) · <span className="text-emerald-400 font-semibold">76%</span></div>
          </div>
        );
        break;

      case 'youtube':
        result = (
          <div className="text-slate-300">
            LiteSpark YouTube Shorts Channel: <a href="https://www.youtube.com/@litespark-r2r/shorts" target="_blank" rel="noreferrer" className="text-rose-400 underline font-semibold">https://www.youtube.com/@litespark-r2r/shorts</a> (Technical & Educational content)
          </div>
        );
        break;

      case 'contact':
        result = (
          <div className="text-slate-300">
            Email: <a href="mailto:revathimss7@gmail.com" className="text-purple-400 underline">revathimss7@gmail.com</a> | Phone: <a href="tel:+919994157428" className="text-cyan-400 underline">+91 99941 57428</a> | Location: Coimbatore, India
          </div>
        );
        break;

      case 'cat resume.txt':
        result = (
          <div className="text-slate-300 border-l-2 border-purple-500 pl-3 space-y-1">
            <div className="text-purple-400 font-bold">REVATHI K. — TECHNICAL LEAD | FULL-STACK WEB DEVELOPMENT</div>
            <div>Experience: 10+ Years in Web Application Development, Maintenance, and Delivery</div>
            <div>Contact: revathimss7@gmail.com • +91 99941 57428</div>
            <div>Core: PHP, Laravel, Yii2, CodeIgniter, Next.js, Node.js, MySQL, PostgreSQL</div>
            <div>Status: Open for Technical Leadership and Senior Full-Stack Engineering roles</div>
          </div>
        );
        break;

      case 'sudo hire-me':
        result = (
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>ACCESS GRANTED! Dispatching leadership interview invitation to: revathimss7@gmail.com / +91 99941 57428</span>
          </div>
        );
        break;

      default:
        result = (
          <div className="text-red-400">
            zsh: command not found: {cmd}. Type <span className="text-white underline">help</span> for a list of commands.
          </div>
        );
        break;
    }

    setHistory((prev) => [...prev, { command: cmd, output: result }]);
    setTimeout(() => {
      if (terminalScrollRef.current) {
        terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  return (
    <section id="terminal" className="py-24 relative bg-slate-950/40 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
            <span>Interactive Console</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Developer CLI Simulator
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Interact with my system directly. Type commands like <code className="text-purple-400">projects</code>, <code className="text-cyan-400">awards</code>, or <code className="text-emerald-400">sudo hire-me</code>.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs sm:text-sm backdrop-blur-md">
          {/* Title Bar */}
          <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <TermIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>revathi@cloud: ~/resume</span>
            </div>
            <div className="text-emerald-400 text-xs">● bash 5.2</div>
          </div>

          {/* Terminal Body */}
          <div ref={terminalScrollRef} className="p-6 max-h-[420px] min-h-[300px] overflow-y-auto space-y-4">
            <div className="text-slate-500">
              Type &apos;<span className="text-slate-300">help</span>&apos; to view available interactive commands.
            </div>

            {history.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <span>revathi@cloud:~$</span>
                  <span className="text-white font-normal">{item.command}</span>
                </div>
                <div className="pl-4">{item.output}</div>
              </div>
            ))}

            <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2">
              <span className="text-purple-400 font-bold flex-shrink-0">revathi@cloud:~$</span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type a command (projects, awards, education, contact, clear)..."
                className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-slate-600 focus:ring-0"
                autoComplete="off"
                spellCheck="false"
              />
            </form>
          </div>
        </div>

      </div>
    </section>
  );
}
