'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Terminal as TermIcon,
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  Zap,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  User,
} from 'lucide-react';

interface HistoryItem {
  command: string;
  output: string | React.ReactNode;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: { label: string; action: string; cliCommand?: string }[];
  timestamp?: string;
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
  // LEFT SIDE: Interactive AI Robot Assistant
  // ==========================================
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const initialBotMessage: ChatMessage = {
    id: '1',
    sender: 'bot',
    text: "👋 Beep boop! I'm SparkBot, Revathi's AI assistant. What brings you to her portfolio today?",
    options: [
      { label: '🚀 Looking to Hire a Tech Lead', action: 'hire', cliCommand: 'whoami' },
      { label: '💻 Explore Core Tech Stack', action: 'skills', cliCommand: 'skills' },
      { label: '📦 Inspect Production Projects', action: 'projects', cliCommand: 'projects' },
      { label: '📬 How Can I Contact Her?', action: 'contact', cliCommand: 'contact' },
    ],
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialBotMessage]);

  const handleOptionClick = (option: { label: string; action: string; cliCommand?: string }) => {
    // 1. Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: option.label,
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Trigger CLI command if applicable
    if (option.cliCommand) {
      executeCliCommand(option.cliCommand);
    }

    // 3. Robot responds with questions and follow-ups
    setIsTyping(true);
    setTimeout(() => {
      let botResponse: ChatMessage;

      switch (option.action) {
        case 'hire':
          botResponse = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: '✨ Fantastic! Revathi brings 10+ years of proven engineering leadership across enterprise ERP, streaming, and full-stack systems. What is your team primarily looking for?',
            options: [
              { label: '🎯 Cross-Functional Team Leadership', action: 'leadership', cliCommand: 'experience' },
              { label: '⚡ Modern Full-Stack (Next.js / Node.js)', action: 'modern_stack', cliCommand: 'skills' },
              { label: '🛡️ Enterprise PHP / Laravel Architecture', action: 'php_stack', cliCommand: 'projects' },
              { label: '📅 Schedule an Interview Invite', action: 'invite', cliCommand: 'sudo hire-me' },
            ],
          };
          break;

        case 'skills':
        case 'modern_stack':
        case 'php_stack':
          botResponse = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: 'I just ran the `skills` command in the CLI on the right! Revathi is deeply experienced in PHP (Laravel/Yii/CodeIgniter), Next.js, Node.js, and CI/CD DevOps. Would you like to review her production projects?',
            options: [
              { label: '📦 Show 7 Selected Projects', action: 'projects', cliCommand: 'projects' },
              { label: '🏆 View Industry Honors & Awards', action: 'awards', cliCommand: 'awards' },
              { label: '📄 Read Summary Resume (cat resume.txt)', action: 'resume', cliCommand: 'cat resume.txt' },
            ],
          };
          break;

        case 'projects':
          botResponse = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: 'Check the CLI on the right! I printed her 7 featured production projects, including Vtagu (video streaming), LiteTaxi, and STW ERP. What would you like to explore next?',
            options: [
              { label: '🏆 View Awards & Honors', action: 'awards', cliCommand: 'awards' },
              { label: '🎓 View Academic Education', action: 'education', cliCommand: 'education' },
              { label: '🎬 Watch LiteSpark Tech Channel', action: 'youtube', cliCommand: 'youtube' },
            ],
          };
          break;

        case 'awards':
          botResponse = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: 'Revathi has received 3 honors: Top Gun (superior execution), Emerging Leader (mentorship & ownership), and Best Team Player! Ready to connect?',
            options: [
              { label: '📬 Get Direct Email & Phone', action: 'contact', cliCommand: 'contact' },
              { label: '🚀 Run sudo hire-me in CLI', action: 'invite', cliCommand: 'sudo hire-me' },
            ],
          };
          break;

        case 'contact':
        case 'invite':
          botResponse = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: '📬 You can reach Revathi directly at revathimss7@gmail.com or call +91 99941 57428. I also triggered access on the CLI terminal!',
            options: [
              { label: '🔄 Start Conversation Over', action: 'restart' },
              { label: '🧹 Clear Terminal History', action: 'clear_cli', cliCommand: 'clear' },
            ],
          };
          break;

        case 'clear_cli':
          botResponse = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: 'Console cleared! What else would you like to ask or explore?',
            options: [
              { label: '🚀 Explore Tech Stack', action: 'skills', cliCommand: 'skills' },
              { label: '📦 View Production Projects', action: 'projects', cliCommand: 'projects' },
            ],
          };
          break;

        default:
          botResponse = initialBotMessage;
          break;
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  const handleCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    const lower = query.toLowerCase();

    setTimeout(() => {
      let reply = '';
      let cmdToRun: string | undefined = undefined;

      if (lower.includes('experience') || lower.includes('year') || lower.includes('work')) {
        reply = 'Revathi has over 10 years of experience in software development and technical leadership across Techno Tackle, Haqto, and enterprise clients.';
        cmdToRun = 'experience';
      } else if (lower.includes('project') || lower.includes('portfolio') || lower.includes('vtagu') || lower.includes('taxi')) {
        reply = 'She has architected 7 major production systems including Vtagu (video streaming), LiteTaxi (mobility), and STW ERP. Check out the CLI on the right!';
        cmdToRun = 'projects';
      } else if (lower.includes('skill') || lower.includes('tech') || lower.includes('stack') || lower.includes('php') || lower.includes('next')) {
        reply = 'Her core stack spans PHP (Laravel/Yii/CodeIgniter), Next.js, React, Node.js, NestJS, MySQL, PostgreSQL, Docker, and CI/CD pipelines.';
        cmdToRun = 'skills';
      } else if (lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('reach')) {
        reply = 'You can reach her directly at revathimss7@gmail.com or +91 99941 57428.';
        cmdToRun = 'contact';
      } else if (lower.includes('hire') || lower.includes('interview') || lower.includes('salary') || lower.includes('role')) {
        reply = 'Revathi is open to Technical Lead, Engineering Manager, and Full-Stack Architect roles! I executed `sudo hire-me` for you.';
        cmdToRun = 'sudo hire-me';
      } else {
        reply = "I'm on it! Revathi is a 10+ year Technical Lead specializing in high-performance web applications and team delivery. Here are some quick questions you can ask me:";
      }

      if (cmdToRun) {
        executeCliCommand(cmdToRun);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        options: [
          { label: '💻 Show Core Skills', action: 'skills', cliCommand: 'skills' },
          { label: '📦 Show Projects', action: 'projects', cliCommand: 'projects' },
          { label: '📬 Contact Revathi', action: 'contact', cliCommand: 'contact' },
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleRestartChat = () => {
    setMessages([initialBotMessage]);
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <section id="terminal" className="py-24 relative bg-slate-950/60 border-y border-slate-800/80 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[350px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[350px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3 shadow-sm">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive AI & CLI Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            Meet SparkBot & Developer CLI
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Chat with Revathi&apos;s interactive robot on the left, or run live terminal commands directly in the CLI on the right.
          </p>
        </div>

        {/* 2-Column Layout: Robot on Left (lg:col-span-6) + CLI on Right (lg:col-span-6) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* ==================================================== */}
          {/* LEFT COLUMN: Interactive AI Robot Assistant Card      */}
          {/* ==================================================== */}
          <div className="lg:col-span-6 flex flex-col bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-purple-950/20 border-2 border-purple-500/40 hover:border-purple-400/80 rounded-3xl shadow-2xl shadow-purple-950/30 overflow-hidden backdrop-blur-xl transition-all duration-300">
            
            {/* Robot Header */}
            <div className="bg-slate-950/80 px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Animated Robot Avatar with Glowing Antenna and Eyes */}
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-500/30 flex-shrink-0 animate-pulse">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                    {/* Robot Visor / Eye glow */}
                    <div className="w-6 h-3 rounded-full bg-cyan-400/90 shadow-sm shadow-cyan-300 flex items-center justify-around px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                  {/* Glowing Signal LED */}
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      SparkBot
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE
                    </span>
                  </div>
                  <p className="text-xs text-purple-300/80 font-medium">Revathi&apos;s AI Portfolio Guide</p>
                </div>
              </div>

              {/* Reset Conversation Button */}
              <button
                onClick={handleRestartChat}
                title="Reset conversation"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1.5 group"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            {/* Robot Message Thread */}
            <div
              ref={chatScrollRef}
              className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 max-h-[460px] min-h-[380px]"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Bot Avatar Icon */}
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2.5`}>
                    {/* Message Bubble */}
                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-purple-600/20'
                          : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-none shadow-md backdrop-blur-md'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Interactive Clickable Question Options */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleOptionClick(opt)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-400 text-purple-200 hover:text-white text-xs font-semibold transition-all duration-200 hover:scale-[1.02] shadow-sm active:scale-95 text-left group"
                          >
                            <span>{opt.label}</span>
                            <ChevronRight className="w-3 h-3 text-purple-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* User Avatar Icon */}
                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Bot Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Custom Input Form for SparkBot */}
            <form
              onSubmit={handleCustomQuestion}
              className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask SparkBot a question or reply..."
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-purple-500/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                aria-label="Send message to SparkBot"
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-md shadow-purple-600/30 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
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
              className="p-5 sm:p-6 max-h-[460px] min-h-[380px] overflow-y-auto space-y-4 flex-1"
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
