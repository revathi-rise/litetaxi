'use client';

import React, { useState } from 'react';

export default function WhatsAppButton() {
  const [isHovered, setIsHovered] = useState(false);
  const phoneNumber = '919994157428';
  const defaultMessage = encodeURIComponent(
    'Hello Revathi, I visited your portfolio and would like to connect!'
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <aside
      aria-label="Direct WhatsApp contact"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 select-none"
    >
      {/* Floating Tooltip / Chat Pill */}
      <div
        className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl transition-all duration-300 pointer-events-none ${
          isHovered
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-3'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Chat with Revathi on WhatsApp</span>
      </div>

      {/* Main WhatsApp Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Chat with Revathi on WhatsApp"
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#25D366] to-[#128C7E] text-white shadow-[0_10px_35px_rgba(37,211,102,0.45)] hover:shadow-[0_15px_45px_rgba(37,211,102,0.7)] hover:scale-110 active:scale-95 transition-all duration-300"
      >
        {/* Pulsing beacon radar ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

        {/* Glossy top specular reflection */}
        <span className="absolute inset-x-2 top-1 h-3 rounded-t-full bg-white/20 pointer-events-none blur-[0.5px]" />

        {/* WhatsApp Official SVG Icon */}
        <svg
          viewBox="0 0 32 32"
          className="w-7 h-7 fill-current relative z-10 drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M16.01 3C8.83 3 3 8.82 3 16c0 2.45.68 4.75 1.86 6.71L3 29l6.46-1.82C11.38 28.28 13.63 29 16.01 29c7.18 0 13.01-5.82 13.01-13S23.19 3 16.01 3zm0 23.82c-2.12 0-4.1-.6-5.8-1.65l-.42-.25-4.28 1.21 1.23-4.14-.27-.44C5.35 19.83 4.78 17.97 4.78 16c0-6.19 5.04-11.23 11.23-11.23 6.19 0 11.23 5.04 11.23 11.23s-5.04 11.23-11.23 11.23zm6.16-8.42c-.34-.17-2-.99-2.31-1.1-.31-.11-.53-.17-.76.17s-.87 1.1-1.07 1.32-.4.25-.74.09c-.34-.17-1.42-.52-2.71-1.67-1-.89-1.68-1.99-1.88-2.33s-.02-.52.15-.69c.15-.15.34-.4.51-.59.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.08-.17-.76-1.83-1.04-2.5-.28-.68-.56-.58-.76-.59l-.65-.01c-.23 0-.59.09-.9.43-.31.34-1.2 1.17-1.2 2.86s1.23 3.32 1.4 3.55c.17.23 2.42 3.7 5.86 5.18.82.35 1.46.56 1.96.72.82.26 1.57.22 2.16.14.66-.1 2.03-.83 2.31-1.63.29-.8.29-1.49.2-1.63-.08-.14-.3-.23-.64-.4z" />
        </svg>

        {/* Online Status Green Dot */}
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#07090e] shadow-sm flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
      </a>
    </aside>
  );
}
