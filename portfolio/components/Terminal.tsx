'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Terminal as TermIcon,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Play,
  Square,
  MessageSquare,
} from 'lucide-react';

interface HistoryItem {
  command: string;
  output: string | React.ReactNode;
}

export default function Terminal() {
  // ==========================================
  // RIGHT SIDE: CLI Terminal State & Logic
  // ==========================================
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      command: 'whoami',
      output: 'Revathi K. — Technical Lead | Full-Stack Web Development (10+ Years Experience)',
    },
    {
      command: 'help',
      output:
        'Available commands: whoami, skills, projects, experience, awards, education, youtube, contact, cat resume.txt, sudo hire-me, clear',
    },
  ]);

  const terminalScrollRef = useRef<HTMLDivElement>(null);

  const executeCliCommand = (cmdStr: string) => {
    const cmd = cmdStr.trim();
    if (!cmd) return;
    const lower = cmd.toLowerCase();

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
            <div>• <span className="text-white font-semibold">projects</span> : List of 7 production platforms</div>
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
            Revathi K. — Technical Lead at Techno Tackle Software Solutions. 10+ years driving web application development, developer mentorship, QA coordination, and architectural governance.
          </div>
        );
        break;

      case 'skills':
        result = (
          <div className="space-y-1 text-slate-300">
            <div><span className="text-cyan-400 font-bold">[Leadership]</span>: Team leadership, client communication, Agile/Scrum, CI/CD governance</div>
            <div><span className="text-cyan-400 font-bold">[Backend]</span>: PHP, Laravel, CodeIgniter, Yii/Yii2, Node.js, NestJS, REST APIs</div>
            <div><span className="text-cyan-400 font-bold">[Frontend]</span>: React.js, Next.js, JavaScript (ES6+), Tailwind CSS, Bootstrap</div>
            <div><span className="text-cyan-400 font-bold">[Databases]</span>: MySQL, PostgreSQL, Relational Schema Design</div>
            <div><span className="text-cyan-400 font-bold">[DevOps]</span>: Docker, GitHub Actions CI/CD, Linux / VPS Deployment</div>
          </div>
        );
        break;

      case 'projects':
        result = (
          <div className="space-y-1 text-slate-300">
            <div>1. <span className="text-purple-400 font-bold">Vtagu · Video Streaming</span> [PHP CodeIgniter, MySQL, Razorpay]</div>
            <div>2. <span className="text-purple-400 font-bold">LiteTaxi · Mobility Platform</span> [NestJS, React, PostgreSQL, Docker]</div>
            <div>3. <span className="text-purple-400 font-bold">JobGatez · Recruitment Portal</span> [PHP CodeIgniter, MySQL, jQuery]</div>
            <div>4. <span className="text-purple-400 font-bold">STW ERP · Supply Chain</span> [PHP CodeIgniter, MySQL, QR Codes, AfterShip]</div>
            <div>5. <span className="text-purple-400 font-bold">Literact · E-Learning</span> [PHP CodeIgniter, MySQL, Razorpay Paywalls]</div>
            <div>6. <span className="text-purple-400 font-bold">Glanz Special Tools · Industrial Tools</span> [PHP Laravel, MySQL]</div>
            <div>7. <span className="text-purple-400 font-bold">Nikmat Furniture · E-Commerce</span> [PHP, MySQL, Catalog & Cart]</div>
          </div>
        );
        break;

      case 'experience':
        result = (
          <div className="space-y-1 text-slate-300">
            <div>• <span className="text-cyan-400 font-semibold">2022 — Present</span>: Technical Lead @ Techno Tackle Software Solutions</div>
            <div>• <span className="text-cyan-400 font-semibold">2020 — 2022</span>: Software Engineer @ Haqto Technologies</div>
            <div>• <span className="text-cyan-400 font-semibold">2017 — 2020</span>: PHP Programmer @ Independent Consultant</div>
            <div>• <span className="text-cyan-400 font-semibold">2015 — 2017</span>: PHP Programmer @ Panjabootham Groups</div>
            <div>• <span className="text-cyan-400 font-semibold">2014 — 2015</span>: Designer & Developer @ SRK IT Solutions</div>
          </div>
        );
        break;

      case 'awards':
        result = (
          <div className="space-y-1 text-amber-300">
            <div>🏆 <span className="font-bold">Top Gun</span> — Recognized for superior delivery performance and execution.</div>
            <div>🏆 <span className="font-bold">Emerging Leader</span> — Honored for team mentorship, ownership, and coordination.</div>
            <div>🏆 <span className="font-bold">Best Team Player</span> — Celebrated for cross-functional collaboration and empathy.</div>
          </div>
        );
        break;

      case 'education':
        result = (
          <div className="space-y-1 text-slate-300">
            <div>• <span className="text-white font-bold">M.Sc. Software Systems</span> — Sree Saraswathi Thyagaraja College (2009–2014) · <span className="text-emerald-400 font-semibold">80%</span></div>
            <div>• <span className="text-white font-bold">Higher Secondary (12th)</span> — V.R.T. Govt Girls HSS (2008–2009) · <span className="text-emerald-400 font-semibold">82%</span></div>
          </div>
        );
        break;

      case 'youtube':
        result = (
          <div className="text-slate-300">
            LiteSpark YouTube Channel: <a href="https://www.youtube.com/@litespark-r2r/shorts" target="_blank" rel="noreferrer" className="text-rose-400 underline font-semibold">@litespark-r2r</a>
          </div>
        );
        break;

      case 'contact':
        result = (
          <div className="text-slate-300">
            Email: <a href="mailto:revathimss7@gmail.com" className="text-purple-400 underline">revathimss7@gmail.com</a> | Phone: <a href="tel:+919994157428" className="text-cyan-400 underline">+91 99941 57428</a>
          </div>
        );
        break;

      case 'cat resume.txt':
        result = (
          <div className="text-slate-300 border-l-2 border-purple-500 pl-3 space-y-1">
            <div className="text-purple-400 font-bold">REVATHI K. — TECHNICAL LEAD & ARCHITECT</div>
            <div>Experience: 10+ Years in Web Application Engineering & Team Governance</div>
            <div>Email: revathimss7@gmail.com • Phone: +91 99941 57428</div>
            <div>Stack: PHP, Laravel, Yii2, Next.js, React, Node.js, MySQL, PostgreSQL, Docker</div>
          </div>
        );
        break;

      case 'sudo hire-me':
        result = (
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>ACCESS GRANTED! Dispatching leadership interview invitation to: revathimss7@gmail.com</span>
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

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    executeCliCommand(inputVal);
    setInputVal('');
  };

  // ==========================================
  // LEFT SIDE: Standing Voice-Enabled Robot
  // ==========================================
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechText, setSpeechText] = useState(
    "Hello! I am SparkBot, Revathi's cybernetic assistant. Ask me anything about Revathi, and I will explain it aloud through your speakers!"
  );
  const [customQuery, setCustomQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Text-To-Speech Function (System Speakers)
  const speakAloud = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any previous speech

    if (!speechEnabled) {
      setSpeechText(text);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick best natural English voice available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
      voices.find((v) => v.name.includes('Natural') && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeechText(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Pre-configured questions & explanations about Revathi
  const explainTopics = [
    {
      title: '👤 Tell me about Revathi',
      subtitle: 'Who is she & background',
      speakText:
        'Revathi K is a Senior Technical Lead and Full-Stack Architect with over 10 years of proven delivery across enterprise ERP, high-concurrency video streaming, and scalable web solutions. She specializes in guiding engineering teams, client coordination, and architectural governance.',
      cliCmd: 'whoami',
    },
    {
      title: '💻 What are her core skills?',
      subtitle: 'Full-stack & DevOps stack',
      speakText:
        'Revathi is deeply skilled in PHP frameworks including Laravel, CodeIgniter, and Yii2, alongside modern frontend architectures using Next.js and React. She designs scalable MySQL and PostgreSQL relational schemas, and implements Docker and GitHub Actions CI/CD pipelines.',
      cliCmd: 'skills',
    },
    {
      title: '📦 Explain her top projects',
      subtitle: 'Vtagu, LiteTaxi, STW ERP',
      speakText:
        'Revathi has engineered major production systems: Vtagu video streaming with high-volume Razorpay billing, LiteTaxi mobility dispatch platform, JobGatez recruitment portal, and STW enterprise ERP featuring automated SKU QR codes and real-time logistics tracking.',
      cliCmd: 'projects',
    },
    {
      title: '🏆 Why should we hire her?',
      subtitle: 'Awards & leadership track',
      speakText:
        'Revathi has earned multiple honors including Top Gun for superior execution, Emerging Leader for developer mentorship, and Best Team Player. She maintains a 100 percent on-time delivery track across a decade of enterprise web initiatives.',
      cliCmd: 'awards',
    },
    {
      title: '📬 How can I contact her?',
      subtitle: 'Direct email & phone coordinates',
      speakText:
        'You can reach Revathi directly by email at revathimss7@gmail.com or by phone at +91 99941 57428. She is open to Technical Lead and Architect opportunities worldwide.',
      cliCmd: 'contact',
    },
  ];

  const handleSelectTopic = (topic: (typeof explainTopics)[0]) => {
    speakAloud(topic.speakText);
    executeCliCommand(topic.cliCmd);
  };

  // Custom question answering
  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const q = customQuery.trim();
    if (!q) return;

    setCustomQuery('');
    const lower = q.toLowerCase();

    let answer = '';
    let cmd = 'whoami';

    if (lower.includes('skill') || lower.includes('stack') || lower.includes('tech') || lower.includes('php') || lower.includes('next')) {
      answer = 'Revathi specializes in PHP, Laravel, CodeIgniter, Yii2, React, Next.js, Node.js, PostgreSQL, MySQL, and Docker CI/CD automation.';
      cmd = 'skills';
    } else if (lower.includes('project') || lower.includes('vtagu') || lower.includes('taxi') || lower.includes('work')) {
      answer = 'Her premier projects include Vtagu video streaming, LiteTaxi ride-booking platform, STW ERP with QR codes, and JobGatez talent recruitment.';
      cmd = 'projects';
    } else if (lower.includes('experience') || lower.includes('year') || lower.includes('company')) {
      answer = 'Revathi has over 10 years of software engineering experience, currently serving as Technical Lead at Techno Tackle Software Solutions.';
      cmd = 'experience';
    } else if (lower.includes('award') || lower.includes('achievement') || lower.includes('hire')) {
      answer = 'Revathi is a 3-time awardee honored as Top Gun, Emerging Leader, and Best Team Player for superior delivery cadence and developer mentorship.';
      cmd = 'awards';
    } else if (lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('reach')) {
      answer = 'You can contact Revathi directly at revathimss7@gmail.com or call +91 99941 57428.';
      cmd = 'contact';
    } else if (lower.includes('education') || lower.includes('degree') || lower.includes('college')) {
      answer = 'Revathi holds a Master of Science in Software Systems with 80% marks from Sree Saraswathi Thyagaraja College.';
      cmd = 'education';
    } else {
      answer = `Revathi K is a Technical Lead with a decade of engineering excellence in enterprise web applications. Check the CLI simulator on the right for full details!`;
      cmd = 'whoami';
    }

    speakAloud(answer);
    executeCliCommand(cmd);
  };

  // Microphone Speech-to-Text (if supported)
  const handleToggleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your question below.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setCustomQuery(transcript);
        // Automatically ask and speak
        const lower = transcript.toLowerCase();
        let answer = `Revathi K is an accomplished Technical Lead and Architect with 10+ years of experience.`;
        let cmd = 'whoami';
        if (lower.includes('project')) {
          answer = 'Her notable projects include Vtagu video streaming, LiteTaxi, and STW ERP.';
          cmd = 'projects';
        } else if (lower.includes('skill')) {
          answer = 'She specializes in PHP, Laravel, Next.js, Node.js, and DevOps.';
          cmd = 'skills';
        }
        speakAloud(answer);
        executeCliCommand(cmd);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (_) {
      setIsListening(false);
    }
  };

  return (
    <section id="terminal" className="py-24 relative bg-slate-950/70 border-y border-slate-800/80 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Voice-Interactive Robot & CLI</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            Ask SparkBot About Revathi
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Click any topic below or ask a question. The standing cyber robot on the left will <span className="text-purple-300 font-semibold">speak aloud through your speakers</span> and control the CLI on the right!
          </p>
        </div>

        {/* 2-Column Layout: Standing Robot on Left + CLI on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* ==================================================== */}
          {/* LEFT COLUMN: Standing Robot with System Speaker Voice */}
          {/* ==================================================== */}
          <div className="lg:col-span-6 flex flex-col bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-purple-950/25 border-2 border-purple-500/40 hover:border-purple-400/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-purple-950/40 backdrop-blur-xl relative justify-between transition-all duration-300">

            {/* Top Toolbar: Speaker & Voice Control */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  SparkBot AI
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
                  Voice Engine 2.4
                </span>
              </div>

              {/* Speaker Mute/Unmute & Stop Controls */}
              <div className="flex items-center gap-2">
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white text-xs font-semibold transition-all active:scale-95"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop Voice</span>
                  </button>
                )}

                <button
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  title={speechEnabled ? 'Mute speaker voice' : 'Enable speaker voice'}
                  className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
                    speechEnabled
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 hover:bg-purple-500 hover:text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {speechEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
                  <span className="hidden sm:inline font-semibold">
                    {speechEnabled ? 'Speaker ON' : 'Muted'}
                  </span>
                </button>
              </div>
            </div>

            {/* Standing Robot Character & Speech Visualizer */}
            <div className="py-4 flex flex-col items-center justify-center relative">
              
              {/* Dynamic Speech Balloon HUD */}
              <div className="w-full mb-4 bg-slate-950/80 border border-purple-500/40 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-lg relative min-h-[75px] flex items-center justify-center text-center">
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 border-b border-r border-purple-500/40 rotate-45" />
                <p className="italic">
                  {isSpeaking ? (
                    <span className="text-cyan-300 font-medium">🗣️ &ldquo;{speechText}&rdquo;</span>
                  ) : (
                    <span>&ldquo;{speechText}&rdquo;</span>
                  )}
                </p>
              </div>

              {/* The Standing Robot Graphic */}
              <div className="relative w-48 h-64 sm:w-56 sm:h-72 flex items-center justify-center my-2">
                
                {/* Ambient Cyber Pedestal Ring (Floor Projection) */}
                <div className="absolute bottom-0 w-44 sm:w-52 h-8 rounded-full bg-gradient-to-r from-purple-500/20 via-cyan-500/40 to-purple-500/20 border border-cyan-400/40 shadow-lg shadow-cyan-400/30 blur-[1px] animate-pulse" />

                {/* SVG Standing Humanoid Cyber Robot */}
                <svg
                  viewBox="0 0 200 260"
                  className={`w-full h-full transition-transform duration-500 ${
                    isSpeaking ? 'scale-105' : 'hover:scale-102'
                  }`}
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Floating zero-gravity shadow */}
                  <ellipse cx="100" cy="245" rx="55" ry="8" fill="#a855f7" fillOpacity="0.25" filter="blur(4px)" />

                  {/* Left & Right Legs */}
                  <g id="legs">
                    <rect x="76" y="165" width="16" height="60" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                    <rect x="108" y="165" width="16" height="60" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                    {/* Knee joint LEDs */}
                    <circle cx="84" cy="195" r="4" fill="#38bdf8" />
                    <circle cx="116" cy="195" r="4" fill="#38bdf8" />
                    {/* Cyber Feet */}
                    <path d="M70 225 H92 C95 225 96 230 92 232 H68 C64 230 65 225 70 225 Z" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                    <path d="M108 225 H130 C134 225 135 230 131 232 H107 C103 230 104 225 108 225 Z" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                  </g>

                  {/* Mechanical Arms & Hands */}
                  <g id="arms">
                    {/* Left Arm */}
                    <path d="M55 105 L40 145 L48 165" stroke="#475569" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="48" cy="165" r="6" fill="#38bdf8" />
                    {/* Right Arm (Waving or Gesturing) */}
                    <path
                      d={isSpeaking ? "M145 105 L165 135 L160 115" : "M145 105 L160 145 L152 165"}
                      stroke="#475569"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-300"
                    />
                    <circle cx={isSpeaking ? "160" : "152"} cy={isSpeaking ? "115" : "165"} r="6" fill="#c084fc" />
                  </g>

                  {/* Torso & Arc Reactor Core */}
                  <g id="torso">
                    <rect x="65" y="95" width="70" height="72" rx="16" fill="url(#torsoGradient)" stroke="#818cf8" strokeWidth="2.5" />
                    {/* Chest Armor Plates */}
                    <path d="M75 105 H125 L120 125 H80 Z" fill="#0f172a" fillOpacity="0.8" />
                    {/* Glowing Arc Reactor Center */}
                    <circle cx="100" cy="138" r="16" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
                    <circle
                      cx="100"
                      cy="138"
                      r="10"
                      fill="#38bdf8"
                      className={isSpeaking ? "animate-ping origin-center" : "animate-pulse"}
                    />
                    <circle cx="100" cy="138" r="5" fill="#ffffff" />
                  </g>

                  {/* Robot Head & Helmet */}
                  <g id="head">
                    {/* Neck */}
                    <rect x="90" y="80" width="20" height="18" rx="4" fill="#334155" />
                    
                    {/* Antennas */}
                    <path d="M70 42 L80 55" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="68" cy="38" r="4" fill="#ec4899" className="animate-pulse" />
                    <path d="M130 42 L120 55" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="132" cy="38" r="4" fill="#38bdf8" className="animate-pulse" />

                    {/* Main Helmet */}
                    <rect x="68" y="45" width="64" height="42" rx="12" fill="url(#helmetGradient)" stroke="#a855f7" strokeWidth="2.5" />
                    
                    {/* Cyber Visor Display */}
                    <rect x="74" y="52" width="52" height="20" rx="8" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                    
                    {/* Glowing Eyes inside Visor */}
                    <g id="eyes">
                      <circle cx="86" cy="62" r="4.5" fill="#38bdf8">
                        {isSpeaking && <animate attributeName="r" values="4.5;3;4.5" dur="0.4s" repeatCount="indefinite" />}
                      </circle>
                      <circle cx="86" cy="62" r="2" fill="#ffffff" />

                      <circle cx="114" cy="62" r="4.5" fill="#38bdf8">
                        {isSpeaking && <animate attributeName="r" values="4.5;3;4.5" dur="0.4s" repeatCount="indefinite" />}
                      </circle>
                      <circle cx="114" cy="62" r="2" fill="#ffffff" />
                    </g>

                    {/* Animated Mouth Equalizer (Moves when speaking) */}
                    <g id="mouth" className="transition-all duration-150">
                      {isSpeaking ? (
                        <>
                          <line x1="88" y1="80" x2="88" y2="74" stroke="#c084fc" strokeWidth="2" strokeLinecap="round">
                            <animate attributeName="y2" values="74;71;74" dur="0.25s" repeatCount="indefinite" />
                          </line>
                          <line x1="94" y1="80" x2="94" y2="71" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
                            <animate attributeName="y2" values="71;76;71" dur="0.3s" repeatCount="indefinite" />
                          </line>
                          <line x1="100" y1="80" x2="100" y2="70" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round">
                            <animate attributeName="y2" values="70;76;70" dur="0.2s" repeatCount="indefinite" />
                          </line>
                          <line x1="106" y1="80" x2="106" y2="71" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
                            <animate attributeName="y2" values="71;75;71" dur="0.28s" repeatCount="indefinite" />
                          </line>
                          <line x1="112" y1="80" x2="112" y2="74" stroke="#c084fc" strokeWidth="2" strokeLinecap="round">
                            <animate attributeName="y2" values="74;72;74" dur="0.22s" repeatCount="indefinite" />
                          </line>
                        </>
                      ) : (
                        <line x1="90" y1="78" x2="110" y2="78" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      )}
                    </g>
                  </g>

                  {/* Color Gradients */}
                  <defs>
                    <linearGradient id="torsoGradient" x1="65" y1="95" x2="135" y2="167" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1e1b4b" />
                      <stop offset="0.5" stopColor="#312e81" />
                      <stop offset="1" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="helmetGradient" x1="68" y1="45" x2="132" y2="87" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4c1d95" />
                      <stop offset="0.5" stopColor="#2e1065" />
                      <stop offset="1" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Soundwave equalizer indicator when speaking */}
              {isSpeaking && (
                <div className="flex items-center gap-1.5 mt-1 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full">
                  <span className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider">
                    Speaking Live
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-2 bg-pink-400 rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.25s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Interactive Question Buttons */}
            <div className="space-y-2 pt-2">
              <p className="text-xs text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tap a question to hear SparkBot answer aloud:</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {explainTopics.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectTopic(item)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-purple-600/90 border border-slate-700/80 hover:border-purple-400 text-left transition-all hover:scale-[1.02] active:scale-95 shadow-sm group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-white flex items-center justify-between">
                      <span>{item.title}</span>
                      <Play className="w-3 h-3 text-cyan-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-[11px] text-slate-400 group-hover:text-purple-200 truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice & Custom Ask Input Bar */}
            <form onSubmit={handleAskQuestion} className="pt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Ask SparkBot anything about Revathi..."
                  className="w-full bg-slate-950/90 border border-slate-800 focus:border-purple-500 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  title="Speak into microphone"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-cyan-400'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!customQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: Developer CLI Simulator               */}
          {/* ==================================================== */}
          <div className="lg:col-span-6 flex flex-col bg-slate-900/90 border-2 border-slate-800 hover:border-slate-700 rounded-3xl shadow-2xl overflow-hidden font-mono text-xs sm:text-sm backdrop-blur-md transition-all duration-300">
            
            {/* Title Bar */}
            <div className="bg-slate-950/90 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                <TermIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>revathi@cloud: ~/resume</span>
              </div>
              <div className="text-emerald-400 text-xs font-semibold">● bash 5.2</div>
            </div>

            {/* Terminal Body */}
            <div
              ref={terminalScrollRef}
              className="p-5 sm:p-6 max-h-[460px] min-h-[400px] overflow-y-auto space-y-4 flex-1"
            >
              <div className="text-slate-500 text-xs">
                Type &apos;<span className="text-slate-300">help</span>&apos; to view all interactive commands.
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
                  placeholder="Type a command (projects, awards, skills, clear)..."
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-slate-600 focus:ring-0 text-xs sm:text-sm"
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
            </div>

            {/* Quick Command Action Bar at bottom of CLI */}
            <div className="bg-slate-950/70 px-4 py-2.5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs text-slate-400">
              <span className="text-slate-500 text-[11px] font-semibold flex-shrink-0">Quick run:</span>
              {['whoami', 'skills', 'projects', 'sudo hire-me', 'clear'].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => executeCliCommand(cmd)}
                  className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-purple-600 hover:text-white border border-slate-700 text-[11px] text-slate-300 transition-colors flex-shrink-0 font-mono"
                >
                  {cmd}
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
