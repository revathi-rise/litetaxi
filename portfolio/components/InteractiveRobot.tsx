'use client';

import React, { useState, useEffect, useRef } from 'react';

interface InteractiveRobotProps {
  isSpeaking: boolean;
  onClick?: () => void;
}

export default function InteractiveRobot({ isSpeaking, onClick }: InteractiveRobotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [waving, setWaving] = useState(false);

  // Track mouse coordinates across the screen so the robot looks at the client
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalized coordinates (-1 to 1) with dampening
      const dx = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2.5)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2.5)));

      setMousePos({ x: dx, y: dy });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Trigger wave on hover or when speaking
  useEffect(() => {
    if (isSpeaking || isHovered) {
      setWaving(true);
    } else {
      const t = setTimeout(() => setWaving(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isSpeaking, isHovered]);

  // Derived head and eye offsets
  const headTranslateX = mousePos.x * 12;
  const headTranslateY = mousePos.y * 8;
  const headRotate = mousePos.x * 14;

  const eyeTranslateX = mousePos.x * 14;
  const eyeTranslateY = mousePos.y * 10;

  // 3D Parallax tilt for the whole robot container
  const tiltX = -mousePos.y * 8;
  const tiltY = mousePos.x * 10;

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Click to interact with SparkBot"
      className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto flex flex-col items-center justify-center cursor-pointer select-none py-2 group"
      style={{
        perspective: '1000px',
      }}
    >
      {/* Seamless Ambient Lighting - No hard borders, blends 100% into background */}
      <div
        className={`absolute inset-0 -top-8 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isSpeaking
            ? 'bg-gradient-to-tr from-cyan-500/25 via-purple-600/30 to-pink-500/20 scale-110'
            : isHovered
            ? 'bg-gradient-to-tr from-cyan-500/20 via-purple-600/20 to-transparent scale-105'
            : 'bg-gradient-to-tr from-cyan-500/10 via-purple-600/10 to-transparent scale-95 opacity-60'
        }`}
      />

      {/* Main 3D Tilted Robot Canvas */}
      <div
        className="w-full relative transition-transform duration-200 ease-out flex items-center justify-center"
        style={{
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <svg
          viewBox="0 0 400 420"
          className="w-full h-auto max-h-[340px] drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* White ceramic armor gradient */}
            <linearGradient id="armorWhite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="85%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Armor dark shading for depth */}
            <linearGradient id="armorDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Visor obsidian glass gradient */}
            <linearGradient id="visorGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#090d16" />
              <stop offset="50%" stopColor="#050811" />
              <stop offset="100%" stopColor="#020408" />
            </linearGradient>

            {/* Glowing neon cyan */}
            <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>

            {/* Glowing neon purple */}
            <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>

            {/* Hologram tablet glass */}
            <linearGradient id="holoGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="neonBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="heavyGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ==================================================== */}
          {/* 1. CYBERNETIC NEON PEDESTAL (Grounded, Merged Base)   */}
          {/* ==================================================== */}
          <g id="pedestal" transform="translate(0, 10)">
            {/* Ambient floor glow */}
            <ellipse cx="200" cy="375" rx="140" ry="28" fill="#38bdf8" opacity="0.15" filter="url(#heavyGlow)" />
            <ellipse cx="200" cy="375" rx="110" ry="22" fill="#a855f7" opacity="0.2" filter="url(#heavyGlow)" />

            {/* Outer metallic rim base */}
            <ellipse cx="200" cy="380" rx="120" ry="24" fill="#0f172a" stroke="#1e293b" strokeWidth="3" />
            <ellipse cx="200" cy="377" rx="118" ry="23" fill="none" stroke="url(#purpleGlow)" strokeWidth="2" filter="url(#neonBlur)" opacity="0.8" />

            {/* Inner illuminated platform disc */}
            <ellipse cx="200" cy="372" rx="95" ry="18" fill="#090d16" stroke="url(#cyanGlow)" strokeWidth="3" />
            <ellipse cx="200" cy="372" rx="92" ry="17" fill="none" stroke="#38bdf8" strokeWidth="1.5" filter="url(#neonBlur)" />

            {/* Concentric futuristic energy rings */}
            <ellipse cx="200" cy="372" rx="70" ry="12" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
            <ellipse cx="200" cy="372" rx="42" ry="7" fill="none" stroke="#a855f7" strokeWidth="1.5" opacity="0.9" />

            {/* Holographic light beams rising from platform */}
            <line x1="130" y1="365" x2="130" y2="330" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <line x1="270" y1="365" x2="270" y2="330" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <circle cx="130" cy="328" r="2" fill="#38bdf8" filter="url(#neonBlur)" />
            <circle cx="270" cy="328" r="2" fill="#38bdf8" filter="url(#neonBlur)" />
          </g>

          {/* ==================================================== */}
          {/* 2. FLOATING HOLOGRAPHIC BADGES (Tech Parallax)       */}
          {/* ==================================================== */}
          {/* Left: Code badge < / > */}
          <g
            className="transition-transform duration-500 ease-out"
            style={{
              transform: `translate(${mousePos.x * -6}px, ${mousePos.y * -4 + (isSpeaking ? -3 : 0)}px)`,
            }}
          >
            <rect
              x="50"
              y="170"
              width="54"
              height="40"
              rx="12"
              fill="#090d16"
              fillOpacity="0.8"
              stroke="#38bdf8"
              strokeWidth="1.5"
              filter="url(#neonBlur)"
            />
            <text
              x="77"
              y="196"
              textAnchor="middle"
              fill="#38bdf8"
              fontFamily="monospace"
              fontWeight="bold"
              fontSize="16"
            >
              &lt;/&gt;
            </text>
          </g>

          {/* Right Top: Idea Lightbulb */}
          <g
            className="transition-transform duration-500 ease-out"
            style={{
              transform: `translate(${mousePos.x * 6}px, ${mousePos.y * -5}px)`,
            }}
          >
            <circle
              cx="285"
              cy="150"
              r="22"
              fill="#090d16"
              fillOpacity="0.8"
              stroke="#c084fc"
              strokeWidth="1.5"
              filter="url(#neonBlur)"
            />
            <path
              d="M285 137 C279 137 275 141 275 146 C275 149 277 152 280 154 L280 158 L290 158 L290 154 C293 152 295 149 295 146 C295 141 291 137 285 137 Z M282 161 L288 161"
              stroke="#e879f9"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Right Bottom: Hologram Interactive Chart Panel */}
          <g
            className="transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${mousePos.x * 4}px, ${mousePos.y * 3}px)`,
            }}
          >
            <rect
              x="255"
              y="225"
              width="68"
              height="50"
              rx="10"
              fill="url(#holoGlass)"
              stroke="#38bdf8"
              strokeWidth="2"
              filter="url(#neonBlur)"
            />
            {/* Hologram Bar Chart */}
            <rect x="265" y="255" width="7" height="12" rx="2" fill="#38bdf8" />
            <rect x="276" y="247" width="7" height="20" rx="2" fill="#38bdf8" />
            <rect x="287" y="240" width="7" height="27" rx="2" fill="#38bdf8" />
            <rect x="298" y="233" width="7" height="34" rx="2" fill="#22d3ee" filter="url(#neonBlur)" />
            {/* Growth curve overlay */}
            <path
              d="M266 254 Q 285 242, 303 232"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>

          {/* ==================================================== */}
          {/* 3. ROBOT BODY: Legs, Feet, Torso                     */}
          {/* ==================================================== */}
          {/* Feet grounded on pedestal */}
          <g id="feet">
            {/* Left Foot */}
            <ellipse cx="165" cy="360" rx="18" ry="9" fill="url(#armorWhite)" stroke="#64748b" strokeWidth="1.5" />
            <ellipse cx="165" cy="358" rx="14" ry="6" fill="#f8fafc" />
            <path d="M152 359 Q 165 354, 178 359" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.8" />

            {/* Right Foot */}
            <ellipse cx="235" cy="360" rx="18" ry="9" fill="url(#armorWhite)" stroke="#64748b" strokeWidth="1.5" />
            <ellipse cx="235" cy="358" rx="14" ry="6" fill="#f8fafc" />
            <path d="M222 359 Q 235 354, 248 359" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.8" />
          </g>

          {/* Legs */}
          <g id="legs">
            {/* Left Leg */}
            <rect x="156" y="308" width="18" height="46" rx="9" fill="url(#armorWhite)" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="165" cy="328" r="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Right Leg */}
            <rect x="226" y="308" width="18" height="46" rx="9" fill="url(#armorWhite)" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="235" cy="328" r="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          </g>

          {/* Pelvis / Waist connector */}
          <ellipse cx="200" cy="305" rx="34" ry="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <ellipse cx="200" cy="303" rx="26" ry="8" fill="#1e293b" />

          {/* Torso & Chest Armor */}
          <g id="torso">
            {/* Main curved glossy chest */}
            <path
              d="M162 238 C 160 215, 240 215, 238 238 C 242 275, 230 302, 200 302 C 170 302, 158 275, 162 238 Z"
              fill="url(#armorWhite)"
              stroke="#64748b"
              strokeWidth="2"
            />
            {/* Specular highlight on chest */}
            <path
              d="M172 232 C 185 224, 215 224, 228 232 C 215 236, 185 236, 172 232 Z"
              fill="#ffffff"
              opacity="0.9"
            />

            {/* Chest Center Emblem: Glowing "R" Shield Badge */}
            <circle cx="200" cy="256" r="14" fill="#090d16" stroke="#38bdf8" strokeWidth="2" filter="url(#neonBlur)" />
            <text
              x="200"
              y="262"
              textAnchor="middle"
              fill="#38bdf8"
              fontFamily="sans-serif"
              fontWeight="900"
              fontSize="14"
              filter="url(#neonBlur)"
            >
              R
            </text>

            {/* Cyan power line on lower abdomen */}
            <path
              d="M185 282 Q 200 286, 215 282"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              filter="url(#neonBlur)"
            />
          </g>

          {/* ==================================================== */}
          {/* 4. INTERACTIVE HANDS & ARMS                          */}
          {/* ==================================================== */}

          {/* RIGHT ARM & HAND: Points / touches the hologram panel */}
          <g
            id="rightArm"
            className="transition-transform duration-200 ease-out"
            style={{
              transform: `translate(${mousePos.x * 6}px, ${mousePos.y * 5}px)`,
              transformOrigin: '228px 235px',
            }}
          >
            {/* Shoulder joint */}
            <circle cx="230" cy="236" r="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            {/* Arm segment */}
            <path
              d="M232 238 Q 248 248, 258 250"
              fill="none"
              stroke="url(#armorWhite)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M232 238 Q 248 248, 258 250"
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Forearm pointing to hologram */}
            <circle cx="258" cy="250" r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Pointing Hand with glowing cyan fingertip */}
            <ellipse cx="268" cy="246" rx="6" ry="5" fill="url(#armorWhite)" />
            <path d="M270 245 L280 240" stroke="url(#armorWhite)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="281" cy="239" r="3" fill="#38bdf8" filter="url(#heavyGlow)" />
          </g>

          {/* LEFT ARM & HAND: Interactive Waving & Gesturing */}
          <g
            id="leftArm"
            className="transition-transform duration-300 ease-out"
            style={{
              transform: waving
                ? 'rotate(-28deg) translate(-8px, -12px)'
                : `rotate(${mousePos.x * -12}deg) translate(${mousePos.x * -4}px, ${mousePos.y * 3}px)`,
              transformOrigin: '170px 235px',
            }}
          >
            {/* Shoulder joint */}
            <circle cx="170" cy="236" r="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            {/* Arm segment */}
            <path
              d="M168 238 Q 152 248, 142 250"
              fill="none"
              stroke="url(#armorWhite)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M168 238 Q 152 248, 142 250"
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Elbow joint */}
            <circle cx="142" cy="250" r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Waving Forearm & Hand */}
            <g
              style={{
                transform: waving ? 'rotate(35deg)' : 'rotate(0deg)',
                transformOrigin: '142px 250px',
                transition: 'transform 0.4s ease-in-out',
              }}
            >
              <path
                d="M142 250 Q 130 240, 126 228"
                fill="none"
                stroke="url(#armorWhite)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Hand Palm */}
              <circle cx="124" cy="224" r="8" fill="url(#armorWhite)" stroke="#64748b" strokeWidth="1.5" />
              {/* Robotic Fingers */}
              <circle cx="118" cy="217" r="2.5" fill="#38bdf8" />
              <circle cx="123" cy="214" r="2.5" fill="#38bdf8" />
              <circle cx="128" cy="216" r="2.5" fill="#38bdf8" />
              {/* Waving sparkle when active */}
              {waving && (
                <path
                  d="M110 205 L116 205 M113 202 L113 208"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  filter="url(#neonBlur)"
                />
              )}
            </g>
          </g>

          {/* ==================================================== */}
          {/* 5. INTERACTIVE HEAD & HELMET (Tracks User Cursor)    */}
          {/* ==================================================== */}
          <g
            id="headGroup"
            className="transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${headTranslateX}px, ${headTranslateY}px) rotate(${headRotate}deg)`,
              transformOrigin: '200px 185px',
            }}
          >
            {/* Neck joint */}
            <rect x="190" y="196" width="20" height="15" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

            {/* Top Antennas with Glowing Cyan Spheres */}
            {/* Left Antenna */}
            <line x1="165" y1="120" x2="152" y2="82" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            <circle cx="152" cy="82" r="6" fill="#38bdf8" filter="url(#heavyGlow)" />
            <circle cx="152" cy="82" r="3" fill="#ffffff" />

            {/* Right Antenna */}
            <line x1="235" y1="120" x2="248" y2="82" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            <circle cx="248" cy="82" r="6" fill="#38bdf8" filter="url(#heavyGlow)" />
            <circle cx="248" cy="82" r="3" fill="#ffffff" />

            {/* Side Ear-Pods / Audio Headphone Cups */}
            {/* Left Ear-Pod */}
            <rect x="134" y="142" width="14" height="38" rx="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <line x1="141" y1="148" x2="141" y2="174" stroke="#38bdf8" strokeWidth="2" filter="url(#neonBlur)" />

            {/* Right Ear-Pod */}
            <rect x="252" y="142" width="14" height="38" rx="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <line x1="259" y1="148" x2="259" y2="174" stroke="#38bdf8" strokeWidth="2" filter="url(#neonBlur)" />

            {/* Main Outer Glossy White Ceramic Helmet */}
            <ellipse
              cx="200"
              cy="162"
              rx="62"
              ry="52"
              fill="url(#armorWhite)"
              stroke="#64748b"
              strokeWidth="2"
            />
            {/* Top curved specular shine on helmet */}
            <path
              d="M160 135 C 180 120, 220 120, 240 135 C 220 126, 180 126, 160 135 Z"
              fill="#ffffff"
              opacity="0.9"
            />

            {/* Inner Dark Glass Visor */}
            <rect
              x="152"
              y="132"
              width="96"
              height="60"
              rx="24"
              fill="url(#visorGlass)"
              stroke="#1e293b"
              strokeWidth="2"
            />
            {/* Visor glassy curved reflection */}
            <path
              d="M156 142 C 176 136, 224 136, 244 142 C 224 138, 176 138, 156 142 Z"
              fill="#38bdf8"
              opacity="0.3"
            />

            {/* DIGITAL CYAN LED EYES & MOUTH (Track Client's Cursor) */}
            <g
              className="transition-transform duration-100 ease-out"
              style={{
                transform: `translate(${eyeTranslateX}px, ${eyeTranslateY}px)`,
              }}
            >
              {/* When Blinking */}
              {isBlinking ? (
                <>
                  <line x1="172" y1="158" x2="188" y2="158" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" filter="url(#neonBlur)" />
                  <line x1="212" y1="158" x2="228" y2="158" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" filter="url(#neonBlur)" />
                </>
              ) : (
                <>
                  {/* Left Cyan LED Smiling Eye */}
                  <path
                    d="M172 162 Q 180 150, 188 162"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#neonBlur)"
                  />
                  {/* Right Cyan LED Smiling Eye */}
                  <path
                    d="M212 162 Q 220 150, 228 162"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#neonBlur)"
                  />
                </>
              )}

              {/* Digital LED Cute Smile / Speaking Mouth Visualizer */}
              {isSpeaking ? (
                /* Pulsing animated mouth while speaking aloud */
                <ellipse
                  cx="200"
                  cy="176"
                  rx="7"
                  ry="5"
                  fill="#38bdf8"
                  filter="url(#neonBlur)"
                  className="animate-pulse"
                />
              ) : (
                /* Calm happy cyber smile */
                <path
                  d="M194 174 Q 200 179, 206 174"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#neonBlur)"
                />
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* Interactive Status Indicator beneath Robot */}
      <div className="flex items-center gap-2 mt-2 font-mono text-[11px] text-slate-400 group-hover:text-cyan-400 transition-colors">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>
          {isSpeaking
            ? 'Speaking Live to you...'
            : isHovered
            ? '✦ Wave to SparkBot (Click to speak)'
            : '✦ Move mouse to interact with SparkBot'}
        </span>
      </div>
    </div>
  );
}
