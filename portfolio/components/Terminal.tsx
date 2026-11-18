'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Terminal as TermIcon,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  Square,
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
  const [naturalFemaleVoice, setNaturalFemaleVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Helper to pick the best natural female English voice across Chrome, Edge, Safari & Windows
  const pickNaturalFemaleVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Preferred natural female English voices in order of quality
    const preferredFemaleNames = [
      'Jenny',               // Microsoft Jenny Online (Natural) - ultra-natural US female
      'Aria',                // Microsoft Aria Online (Natural) - crisp US female
      'Google US English',   // Chrome natural US female voice
      'Zira',                // Microsoft Zira - English (US) female standard
      'Samantha',            // Apple/macOS natural US female
      'Victoria',            // Apple UK female
      'Karen',               // Australian English female
      'Sonia',               // British English female
      'Neerja',              // Indian English female
      'Heera',               // Indian English female
    ];

    for (const name of preferredFemaleNames) {
      const match = voices.find(
        (v) => v.name.toLowerCase().includes(name.toLowerCase()) && v.lang.startsWith('en')
      );
      if (match) return match;
    }

    // Fallback: any voice explicitly containing 'female'
    const femaleFallback = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
    );
    if (femaleFallback) return femaleFallback;

    // Filter out known male voice names
    const maleNames = ['david', 'guy', 'mark', 'george', 'male', 'ravi', 'richard'];
    const nonMale = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        !maleNames.some((m) => v.name.toLowerCase().includes(m))
    );
    if (nonMale) return nonMale;

    return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  };

  // Pre-load and cache the natural female voice on mount and when voices change
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoice = () => {
      const v = pickNaturalFemaleVoice();
      if (v) setNaturalFemaleVoice(v);
    };

    updateVoice();
    window.speechSynthesis.onvoiceschanged = updateVoice;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Text-To-Speech Function (System Speakers)
  const speakAloud = (text: string) => {
    // 1. Immediately update speech balloon HUD on screen
    setSpeechText(text);
    setIsSpeaking(true);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTimeout(() => setIsSpeaking(false), 4000);
      return;
    }

    if (!speechEnabled) {
      setTimeout(() => setIsSpeaking(false), 2000);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05; // Slightly higher pitch for clear, natural, warm female resonance

      // Always use the cached natural female voice or dynamically pick it
      const voice = naturalFemaleVoice || pickNaturalFemaleVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      // Delay to avoid Chrome cancel bug
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (_) {
          setIsSpeaking(false);
        }
      }, 50);

      // Failsafe timer so speaking animation always terminates cleanly
      setTimeout(() => {
        setIsSpeaking(false);
      }, Math.max(4500, text.length * 85));
    } catch (_) {
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    setIsSpeaking(false);
  };

  // Comprehensive question answering engine
  const getAnswerForQuery = (query: string): string => {
    const lower = query.toLowerCase();

    if (
      lower.includes('who') ||
      lower.includes('about') ||
      lower.includes('intro') ||
      lower.includes('revathi') ||
      lower.includes('background') ||
      lower.includes('bio') ||
      lower.includes('summary') ||
      lower.includes('yourself')
    ) {
      return 'Revathi K is a Senior Technical Lead and Full-Stack Architect with over 10 years of proven delivery across enterprise ERP, high-concurrency video streaming, and scalable web solutions. She specializes in guiding engineering teams, client coordination, and architectural governance.';
    } else if (
      lower.includes('skill') ||
      lower.includes('stack') ||
      lower.includes('tech') ||
      lower.includes('php') ||
      lower.includes('next') ||
      lower.includes('react') ||
      lower.includes('node') ||
      lower.includes('database') ||
      lower.includes('docker')
    ) {
      return 'Revathi specializes in PHP, Laravel, CodeIgniter, Yii2, React, Next.js, Node.js, PostgreSQL, MySQL, and Docker CI/CD automation.';
    } else if (
      lower.includes('project') ||
      lower.includes('vtagu') ||
      lower.includes('taxi') ||
      lower.includes('work') ||
      lower.includes('portfolio') ||
      lower.includes('erp')
    ) {
      return 'Her premier projects include Vtagu video streaming with high-volume billing, LiteTaxi ride-booking platform, STW ERP with automated QR codes, and JobGatez talent recruitment.';
    } else if (
      lower.includes('experience') ||
      lower.includes('year') ||
      lower.includes('company') ||
      lower.includes('role') ||
      lower.includes('lead')
    ) {
      return 'Revathi has over 10 years of software engineering experience, currently serving as Technical Lead at Techno Tackle Software Solutions where she guides engineering architecture and delivery.';
    } else if (
      lower.includes('award') ||
      lower.includes('achievement') ||
      lower.includes('hire') ||
      lower.includes('why')
    ) {
      return 'Revathi is a 3-time awardee honored as Top Gun, Emerging Leader, and Best Team Player for superior delivery cadence and developer mentorship with a 100 percent on-time delivery track.';
    } else if (
      lower.includes('contact') ||
      lower.includes('email') ||
      lower.includes('phone') ||
      lower.includes('reach') ||
      lower.includes('number') ||
      lower.includes('call')
    ) {
      return 'You can contact Revathi directly by email at revathimss7@gmail.com or by phone at +91 99941 57428.';
    } else if (
      lower.includes('education') ||
      lower.includes('degree') ||
      lower.includes('college') ||
      lower.includes('study')
    ) {
      return 'Revathi holds a Master of Science in Software Systems with 80% marks from Sree Saraswathi Thyagaraja College.';
    } else {
      return `I am SparkBot, Revathi's AI assistant! I didn't recognize "${query}". Try asking me about her 10+ years experience, core skills (PHP, Laravel, Next.js), major projects (Vtagu, LiteTaxi, STW ERP), or contact coordinates!`;
    }
  };

  // Custom question answering
  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const q = customQuery.trim();
    if (!q) return;

    setCustomQuery('');
    const answer = getAnswerForQuery(q);
    speakAloud(answer);
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
        const answer = getAnswerForQuery(transcript);
        speakAloud(answer);
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
            Voice AI Assistant & Developer CLI
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Listen to SparkBot explain Revathi&apos;s background aloud through your system speakers on the left, or test independent developer commands in the CLI on the right.
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
                  className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${speechEnabled
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

            {/* Standing 3D Robot & Speech Visualizer */}
            <div className="py-2 flex flex-col items-center justify-center relative flex-1">

              {/* Dynamic Speech Balloon HUD */}
              <div className="w-full mb-3 bg-slate-950/80 border border-purple-500/40 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-lg relative min-h-[68px] flex items-center justify-center text-center">
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 border-b border-r border-purple-500/40 rotate-45" />
                <p className="italic">
                  {isSpeaking ? (
                    <span className="text-cyan-300 font-medium">🗣️ &ldquo;{speechText}&rdquo;</span>
                  ) : (
                    <span>&ldquo;{speechText}&rdquo;</span>
                  )}
                </p>
              </div>

              {/* The 3D Standing Robot - Seamlessly Merged with Background (Static & Stable, No Hover Movement) */}
              <div
                onClick={() =>
                  speakAloud(
                    "Hello! I am SparkBot, Revathi's AI assistant. Ask me anything below about her experience, skills, or projects!"
                  )
                }
                title="Click to hear SparkBot introduce Revathi"
                className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto flex flex-col items-center justify-center my-auto py-2 cursor-pointer select-none"
              >
                {/* 100% Seamless Ambient Aura (No hard borders or square box) */}
                <div
                  className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
                    isSpeaking
                      ? 'bg-gradient-to-tr from-cyan-500/25 via-blue-600/30 to-purple-500/20 opacity-90'
                      : 'bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-transparent opacity-50'
                  }`}
                />

                {/* Grounded 3D Robot Image (Merged with background, no movement on hover) */}
                <div className="relative flex flex-col items-center justify-center w-full">
                  <img
                    src="/robot.png"
                    alt="SparkBot AI Assistant"
                    className="w-full h-auto max-h-[320px] object-contain drop-shadow-[0_20px_40px_rgba(37,99,235,0.35)] relative z-10"
                    style={{
                      maskImage: 'radial-gradient(ellipse 94% 94% at 50% 50%, black 75%, transparent 100%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 94% 94% at 50% 50%, black 75%, transparent 100%)',
                    }}
                  />

                  {/* Soundwave equalizer indicator when speaking */}
                  {isSpeaking ? (
                    <div className="flex items-center gap-1.5 mt-3 bg-purple-500/10 border border-purple-500/30 px-3.5 py-1 rounded-full relative z-10 shadow-md">
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
                  ) : (
                    <span className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors mt-2 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span>✦ Click robot to speak</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Voice & Custom Ask Input Bar */}
            <form onSubmit={handleAskQuestion} className="pt-3 flex items-center gap-2 border-t border-slate-800/80">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Ask SparkBot anything about Revathi (skills, projects, experience)..."
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
