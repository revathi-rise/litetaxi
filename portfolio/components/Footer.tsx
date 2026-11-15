'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, Mail, Youtube, Github, Linkedin, Phone } from 'lucide-react';

export default function Footer() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-12 bg-slate-950 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col items-center justify-center text-center gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            REVATHI
          </span>
        </div>

        {/* Social & Channel Icons */}
        <div className="flex items-center gap-3">
          <a
            href="mailto:revathimss7@gmail.com"
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-purple-400 hover:border-purple-500/50 transition-all"
            title="Email: revathimss7@gmail.com"
          >
            <Mail className="w-4 h-4" />
          </a>
          <a
            href="tel:+919994157428"
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
            title="Phone: +91 99941 57428"
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href="https://www.youtube.com/@litespark-r2r/shorts"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/50 transition-all"
            title="LiteSpark YouTube Channel"
          >
            <Youtube className="w-4 h-4" />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-purple-400 hover:border-purple-500/50 transition-all"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
            title="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap justify-center">
          <span>© {new Date().getFullYear()} Revathi K. Technical Lead | Full-Stack Web Development. All rights reserved.</span>
        </p>

      </div>

      {/* Floating Back to Top Button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-xl hover:bg-purple-600 hover:text-white transition-all animate-in fade-in"
          title="Back to Top"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </footer>
  );
}
