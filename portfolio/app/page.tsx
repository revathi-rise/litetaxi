'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Metrics from '@/components/Metrics';
import About from '@/components/About';
import Skills from '@/components/Skills';
import Projects from '@/components/Projects';
import Testimonials from '@/components/Testimonials';
import Experience from '@/components/Experience';
import Terminal from '@/components/Terminal';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import ResumeModal from '@/components/ResumeModal';

export default function Home() {
  const [resumeOpen, setResumeOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.hash) {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 relative selection:bg-purple-500/30 selection:text-white">
      {/* Navigation */}
      <Navbar onOpenResume={() => setResumeOpen(true)} />

      {/* Hero Section */}
      <Hero onOpenResume={() => setResumeOpen(true)} />

      {/* Metrics Bar */}
      <Metrics />

      {/* About & Engineering Philosophy */}
      <About />

      {/* Skills Arsenal */}
      <Skills />

      {/* 7 Selected Projects from Resume */}
      <Projects />

      {/* Happy Clients Testimonials */}
      {/* <Testimonials /> */}

      {/* Professional Experience Timeline */}
      <Experience />

      {/* Interactive Developer CLI Terminal */}
      <Terminal />

      {/* Direct Contact Coordinates & Form */}
      <Contact />

      {/* Footer */}
      <Footer />

      {/* Full Resume Modal */}
      <ResumeModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} />
    </main>
  );
}
