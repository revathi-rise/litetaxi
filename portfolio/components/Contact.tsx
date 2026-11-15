'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle, Send, Loader2, Sparkles, Youtube } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setToastMessage('Message dispatched! Thank you for reaching out, Revathi will respond promptly.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        window.location.href = `mailto:revathimss7@gmail.com?subject=${encodeURIComponent(
          formData.subject || 'Portfolio Inquiry'
        )}&body=${encodeURIComponent(
          `Hi Revathi,\n\n${formData.message}\n\nFrom: ${formData.name} (${formData.email})`
        )}`;
        setToastMessage('Opening your email client...');
      }
    } catch (_) {
      window.location.href = `mailto:revathimss7@gmail.com?subject=${encodeURIComponent(
        formData.subject || 'Portfolio Inquiry'
      )}&body=${encodeURIComponent(
        `Hi Revathi,\n\n${formData.message}\n\nFrom: ${formData.name} (${formData.email})`
      )}`;
      setToastMessage('Opening your email client...');
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  return (
    <section id="contact" className="py-24 bg-slate-950/70 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
            <span>Get In Touch</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Let&apos;s Build Something Exceptional
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Whether you have a technical leadership opportunity, project coordination consulting, or want to discuss full-stack engineering, I&apos;d love to connect.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Coordinates */}
          <div className="lg:col-span-5 bg-slate-900/60 rounded-3xl p-8 sm:p-10 border border-slate-800 space-y-5 shadow-xl backdrop-blur-md">
            <h3 className="text-2xl font-bold text-white mb-2">Direct Coordinates</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Feel free to connect directly via email or phone. I respond promptly within 24 hours.
            </p>

            <div className="space-y-3.5 pt-2">
              <a
                href="mailto:revathimss7@gmail.com"
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-purple-500/60 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Direct Email</div>
                  <div className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    revathimss7@gmail.com
                  </div>
                </div>
              </a>

              <a
                href="tel:+919994157428"
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/60 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Direct Phone</div>
                  <div className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    +91 99941 57428
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Location</div>
                  <div className="text-sm font-bold text-white">
                    Coimbatore, India • Open to Remote & Hybrid Roles
                  </div>
                </div>
              </div>

              <a
                href="https://www.youtube.com/@litespark-r2r/shorts"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-rose-500/60 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Educational Channel</div>
                  <div className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                    LiteSpark Tech Shorts (@litespark-r2r)
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-slate-900/60 rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl backdrop-blur-md">
            <h3 className="text-2xl font-bold text-white mb-6">Send a Direct Message</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Johnson"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. alex@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Technical Lead / Engineering Opportunity"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your project, team requirements, or what you'd like to discuss..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-600 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900 border border-purple-500 text-white text-sm font-semibold shadow-2xl animate-in slide-in-from-bottom duration-300">
          <CheckCircle className="w-5 h-5 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
