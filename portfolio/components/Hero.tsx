'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  Mail,
  Youtube,
  Github,
  Linkedin,
  Terminal as TerminalIcon,
  Award,
  ArrowRight,
  CheckCircle2,
  QrCode,
  ExternalLink,
} from 'lucide-react';

interface HeroProps {
  onOpenResume: () => void;
}

export default function Hero({ onOpenResume }: HeroProps) {
  const roles = [
    'Technical Lead & Full-Stack Architect',
    'PHP Frameworks Specialist (Laravel, Yii2, CodeIgniter)',
    'Modern Web Architect (Next.js, React, Node.js)',
    'Enterprise ERP & Database Architect',
    'Creator of LiteSpark Tech Channel',
  ];

  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQrPopover, setShowQrPopover] = useState(false);

  useEffect(() => {
    const current = roles[roleIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText.length < current.length) {
      timeout = setTimeout(() => {
        setDisplayText(current.substring(0, displayText.length + 1));
      }, 65);
    } else if (!isDeleting && displayText.length === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2400);
    } else if (isDeleting && displayText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayText(current.substring(0, displayText.length - 1));
      }, 30);
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setRoleIndex((prev) => (prev + 1) % roles.length);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, roleIndex]);

  return (
    <section id="hero" className="relative pt-24 pb-8 sm:pt-28 sm:pb-20 md:pt-28 md:pb-12 overflow-hidden">
      {/* Background ambient ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-end">

          {/* ================= LEFT COLUMN: Typography & Actions (Reference Layout) ================= */}
          <div className="lg:col-span-7 flex flex-col items-start text-left z-10">

            {/* "Hi I am" */}
            <span className="text-sm sm:text-base font-medium text-slate-400 mb-0.5 tracking-wide">
              Hi I am
            </span>

            {/* Name */}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-200 mb-1.5">
              Revathi K.
            </h2>

            {/* Large Role Title (Matches Reference Image Banner) */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-3">
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Technical Lead
              </span>

            </h1>

            {/* Typing dynamic subtitle */}
            <div className="text-sm sm:text-base font-mono text-cyan-300 flex items-center gap-2 h-7 mb-4">
              <span className="text-purple-400 font-bold">&gt;</span>
              <span>{displayText}</span>
              <span className="w-0.5 h-4 bg-purple-400 animate-pulse" />
            </div>

            {/* Summary description */}
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mb-5">
              Technology professional with <strong className="text-slate-200">10+ years of proven delivery</strong> across
              web application engineering, developer &amp; QA leadership, and scalable platforms in ERP, recruitment, video streaming, and mobility.
            </p>

            {/* Social Icons Row (Reference: Square/Rounded Icons with subtle borders) */}
            <div className="flex items-center gap-2.5 mb-5">
              <a
                href="https://www.youtube.com/@litespark-r2r/shorts"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-all shadow-md"
                title="LiteSpark YouTube Channel"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/revathi-k-175226b3/"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-all shadow-md"
                title="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/revathi-rise/"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/10 flex items-center justify-center text-slate-400 hover:text-purple-400 transition-all shadow-md"
                title="GitHub Profile"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="mailto:revathimss7@gmail.com"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/10 flex items-center justify-center text-slate-400 hover:text-purple-300 transition-all shadow-md"
                title="Email: revathimss7@gmail.com"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="#terminal"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/10 flex items-center justify-center text-slate-400 hover:text-purple-400 transition-all shadow-md"
                title="Developer CLI Terminal"
              >
                <TerminalIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Action Buttons Row ("Hire Me" + "Download CV") */}
            <div className="flex flex-wrap items-center gap-3.5 mb-6 w-full sm:w-auto">
              <a
                href="#contact"
                className="px-7 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:-translate-y-0.5 transition-all text-xs sm:text-sm flex items-center gap-2"
              >
                <span>Hire Me</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={onOpenResume}
                className="px-7 py-3 rounded-xl font-bold text-slate-200 border border-slate-700 hover:border-purple-500/60 bg-slate-900/70 hover:bg-purple-500/10 hover:text-white transition-all text-xs sm:text-sm backdrop-blur-md flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Download CV</span>
              </button>
            </div>

            {/* Metrics Box (Reference Image Bottom Card: "10+ Experiences", "200+ Projects Done", "100% Happy Clients") */}
            <div className="w-full sm:w-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between sm:justify-start gap-6 sm:gap-8 shadow-xl backdrop-blur-md">
              <div>
                <div className="text-lg sm:text-xl font-black text-purple-400">10+</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Experiences</div>
              </div>
              <div className="w-px h-7 bg-slate-800" />
              <div>
                <div className="text-lg sm:text-xl font-black text-cyan-400">200+</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Projects Done</div>
              </div>
              <div className="w-px h-7 bg-slate-800" />
              <div>
                <div className="text-lg sm:text-xl font-black text-emerald-400">100%</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Happy Clients</div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: Large Circular Spotlight + Perfectly Framed Cutout ================= */}
          <div className="lg:col-span-5 relative flex items-end justify-center">
            <div className="relative w-full max-w-[380px] sm:max-w-[420px] lg:max-w-[480px] flex items-end justify-center top-[49px]">

              {/* Radial ambient spotlight behind the circle */}
              <div className="absolute bottom-6 w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] bg-gradient-to-tr from-purple-600/30 via-indigo-500/20 to-cyan-500/20 rounded-full blur-[60px] pointer-events-none" />

              {/* Large Dark Circle Disc (Matches Reference Image) */}
              <div className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] lg:w-[420px] lg:h-[420px] rounded-full bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-[#0b0f19] border border-purple-500/25 shadow-2xl shadow-purple-950/40 relative flex items-end justify-center">

                {/* Subtle internal ring for depth */}
                <div className="absolute inset-2 sm:inset-3 rounded-full border border-white/5 pointer-events-none" />

                {/* Floating Achievement Pill (Top Left) */}
                <div className="absolute -top-2 -left-2 sm:-left-4 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/95 border border-purple-500/40 text-[11px] font-bold text-slate-200 shadow-xl backdrop-blur-md">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>3x Honors Awardee</span>
                </div>

                {/* Floating LiteSpark YouTube Channel Pill with QR Popover (Mid/Bottom Left) */}
                <div
                  className="absolute bottom-12 -left-3 sm:-left-6 z-30"
                  onMouseEnter={() => setShowQrPopover(true)}
                  onMouseLeave={() => setShowQrPopover(false)}
                >
                  <button
                    type="button"
                    onClick={() => setShowQrPopover((prev) => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/95 border border-rose-500/40 hover:border-rose-400 text-[11px] font-bold text-slate-200 shadow-xl backdrop-blur-md transition-all hover:scale-105 group"
                    title="Scan QR to subscribe to LiteSpark"
                  >
                    <Youtube className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span>LiteSpark</span>
                    <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-0.5">
                      <QrCode className="w-2.5 h-2.5" />
                      QR
                    </span>
                  </button>

                  {/* Popover Card */}
                  {showQrPopover && (
                    <div className="absolute bottom-full left-0 mb-3 w-52 p-3 rounded-2xl bg-slate-950/95 border border-purple-500/40 shadow-2xl shadow-purple-950/60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-40 flex flex-col items-center text-center">
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-white">
                          <Youtube className="w-3.5 h-3.5 text-rose-500" />
                          <span>LiteSpark</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Channel
                        </span>
                      </div>

                      {/* QR Code Container */}
                      <a
                        href="https://www.youtube.com/@litespark-r2r/shorts"
                        target="_blank"
                        rel="noreferrer"
                        className="w-36 h-36 bg-white p-2 rounded-xl shadow-inner ring-1 ring-purple-500/30 hover:ring-purple-400 transition-all flex items-center justify-center group/qr"
                      >
                        <img
                          src="/litespark-qr.png"
                          alt="LiteSpark YouTube QR Code"
                          className="w-full h-full object-contain group-hover/qr:scale-105 transition-transform"
                        />
                      </a>

                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        Scan with camera to subscribe
                      </p>

                      <a
                        href="https://www.youtube.com/@litespark-r2r/shorts"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-md shadow-rose-600/20 transition-all"
                      >
                        <span>Visit Channel</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Floating Status Pill (Bottom Right) */}
                <div className="absolute bottom-2 -right-2 sm:-right-4 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/95 border border-cyan-500/40 text-[11px] font-bold text-slate-200 shadow-xl backdrop-blur-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Verified Tech Lead</span>
                </div>

                {/* The Cutout Image (Scaled up slightly to adjust with banner) */}
                <img
                  src="/profile-cutout.png"
                  alt="Revathi K. - Technical Lead"
                  className="relative z-20 w-auto h-[380px] sm:h-[450px] lg:h-[510px] max-w-none object-contain object-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.85)] filter"
                />

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}