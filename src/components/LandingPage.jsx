import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  ChevronLeft,
  ChevronRight,
  Workflow
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function LandingPage({
  onLaunchApp,
  onSelectTool,
  theme = 'light',
  onToggleTheme,
  currentUser = null,
  onLogin,
  onLogout,
  onOpenProfileSettings
}) {
  const isDark = theme === 'dark';

  const handleNavigate = (toolId) => {
    if (onSelectTool && toolId) onSelectTool(toolId);
    else if (onLaunchApp) onLaunchApp();
  };

  // Pricing state: monthly vs annual
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Testimonials carousel state
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const testimonials = [
    {
      id: 1,
      quote:
        "DreamKit completely replaced three sketchy web formatters our team was using. Knowing that zero code or client tokens ever leave the local browser gives our compliance officers total peace of mind.",
      author: 'Elena Rostova',
      role: 'Staff Infrastructure Architect',
      company: 'Meridian Fintech',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      quote:
        "The client-side PDF compressor and OCR suite is pure wizardry. Extracting text from 50-page scanned contracts in under two seconds with WebAssembly — no waiting for uploads, no file size caps.",
      author: 'Marcus Vance',
      role: 'Principal Frontend Engineer',
      company: 'Orion Cloud',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      quote:
        "The Color Palette Generator and WCAG 2.1 contrast matrix saved our design system overhaul two entire sprints. Exporting directly to Tailwind and CSS variables in one click is a game changer.",
      author: 'Dr. Sarah Lin',
      role: 'Head of Engineering',
      company: 'Waypoint Robotics',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 4,
      quote:
        "SOC2 auditors were thrilled to see our developers using a 100% in-browser toolkit. No cloud egress, zero data-at-rest risk, and the fastest JSON and regex diagnostics in the industry.",
      author: 'James Okafor',
      role: 'Director of Security',
      company: 'Fortress Capital',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    }
  ];

  const handleNextTestimonial = () => {
    setTestimonialIdx((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevTestimonial = () => {
    setTestimonialIdx((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
    }, 2000);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'bg-[#090D16] text-[#F8FAFC]' : 'bg-[#FAFAF9] text-[#0F172A]'
      } font-sans selection:bg-slate-900 selection:text-white`}
    >
      {/* =========================================================================
          1. TOP NAVIGATION BAR (Exact Hostinger / Modern Minimalist SaaS Header)
         ========================================================================= */}
      <header
        className={`sticky top-0 z-50 transition-colors backdrop-blur-md ${
          isDark
            ? 'bg-[#090D16]/80 border-b border-slate-800/80'
            : 'bg-[#FAFAF9]/80 border-b border-slate-200/80'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => handleNavigate('landing')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight font-sans">
              DreamKit <span className="text-indigo-600 dark:text-indigo-400">Pro</span>
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#features"
              className="hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#tools"
              className="hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Tools
            </a>
            <a
              href="#workflow"
              className="hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Workflow
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Testimonials
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle color theme"
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isDark
                  ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth / Account State */}
            {currentUser ? (
              <button
                onClick={onOpenProfileSettings}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate text-slate-700 dark:text-slate-300">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="hidden sm:inline-flex text-xs font-semibold px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Launch App Pill CTA */}
            <button
              onClick={() => handleNavigate('dashboard')}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION (Exact Reference: Title + Subtitle + Black Pill CTA)
         ========================================================================= */}
      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12] mb-6">
          Automate Workflow in Hours with <br className="hidden sm:block" />
          Intelligent Dev Tools
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed mb-8">
          Accelerate your development cycle with 40+ client-side developer, media, and PDF tools.
          Zero server uploads, 100% private in-browser execution, and instant native speeds.
        </p>

        {/* Primary Centered Black Pill CTA */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md shadow-slate-950/10 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95"
          >
            <span>Explore All Tools</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          3. HERO BENTO GRID (Exact match to reference image visual centerpiece!)
         ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          {/* ----------------- LEFT COLUMN (col-span-3) ----------------- */}
          <div className="md:col-span-3 flex flex-col gap-4 sm:gap-5">
            {/* Card 1: Integrations */}
            <div
              className={`p-6 rounded-3xl border flex flex-col justify-between h-[210px] transition-all hover:shadow-md ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800/80 shadow-sm'
                  : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Integration App Icons */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm">
                  G
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 font-bold text-xs shadow-sm">
                  VS
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center text-amber-600 font-bold text-xs shadow-sm">
                  Git
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight mb-1">
                  Integrations
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Seamlessly connects with your modern dev stack and cloud pipelines.
                </p>
              </div>
            </div>

            {/* Card 2: 2.5B+ Stat Card */}
            <div
              className={`p-6 rounded-3xl border flex flex-col justify-between h-[210px] transition-all hover:shadow-md ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800/80 shadow-sm'
                  : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
              }`}
            >
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white block mb-1">
                  2.5B+
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Data Operations
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Processed locally with zero network egress and zero server latency.
              </p>
            </div>
          </div>

          {/* ----------------- CENTER COLUMN: 3D AI MESH TALL CARD (col-span-5) ----------------- */}
          <div className="md:col-span-5">
            <div
              className="h-full min-h-[440px] rounded-3xl bg-[#090C12] border border-slate-800/90 relative overflow-hidden flex flex-col justify-between p-7 shadow-xl shadow-slate-950/20 group"
            >
              {/* Subtle Ambient Radial Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-red-600/10 blur-[80px] pointer-events-none" />

              {/* Top Header Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Neural Mesh Analyzer
                </span>
                <span className="text-[11px] font-mono text-slate-500">v2.5 WASM</span>
              </div>

              {/* Futuristic 3D Head / Point Cloud Wireframe SVG (Exact Reference Centerpiece) */}
              <div className="relative z-10 my-auto flex items-center justify-center py-4">
                <svg
                  viewBox="0 0 280 280"
                  className="w-56 h-56 sm:w-64 sm:h-64 drop-shadow-[0_0_25px_rgba(239,68,68,0.35)] transition-transform duration-700 group-hover:scale-105"
                  fill="none"
                >
                  <defs>
                    <radialGradient id="meshGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.8" />
                      <stop offset="70%" stop-color="#dc2626" stop-opacity="0.3" />
                      <stop offset="100%" stop-color="#991b1b" stop-opacity="0" />
                    </radialGradient>
                    <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#ef4444" stop-opacity="0" />
                      <stop offset="50%" stop-color="#f87171" stop-opacity="0.7" />
                      <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Geometric Wireframe Contour Nodes */}
                  <path
                    d="M 90,60 Q 140,40 190,60 Q 215,110 205,170 Q 185,225 140,240 Q 95,225 75,170 Q 65,110 90,60 Z"
                    stroke="#450a0a"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 110,80 Q 140,70 170,80 Q 185,120 180,165 Q 165,205 140,215 Q 115,205 100,165 Q 95,120 110,80 Z"
                    stroke="#7f1d1d"
                    strokeWidth="1"
                    strokeOpacity="0.6"
                  />

                  {/* Horizontal Wireframe Scan Contour Lines */}
                  {[75, 95, 115, 135, 155, 175, 195, 215].map((y, idx) => (
                    <line
                      key={idx}
                      x1={95 - idx * 2}
                      y1={y}
                      x2={185 + idx * 2}
                      y2={y}
                      stroke="#991b1b"
                      strokeWidth="0.8"
                      strokeOpacity="0.4"
                    />
                  ))}

                  {/* Vertical Facial Flow Contours */}
                  <path d="M 140,45 L 140,235" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.5" />
                  <path d="M 115,70 Q 120,140 125,210" stroke="#b91c1c" strokeWidth="0.75" strokeOpacity="0.4" />
                  <path d="M 165,70 Q 160,140 155,210" stroke="#b91c1c" strokeWidth="0.75" strokeOpacity="0.4" />

                  {/* High-Tech Glowing Red / Coral Matrix Points (Exact Reference Visual) */}
                  {[
                    [140, 50], [120, 65], [140, 65], [160, 65],
                    [105, 85], [125, 85], [140, 85], [155, 85], [175, 85],
                    [95, 105], [115, 105], [130, 105], [140, 105], [150, 105], [165, 105], [185, 105],
                    [90, 125], [110, 125], [125, 125], [140, 125], [155, 125], [170, 125], [190, 125],
                    [95, 145], [115, 145], [130, 145], [140, 145], [150, 145], [165, 145], [185, 145],
                    [105, 165], [120, 165], [132, 165], [140, 165], [148, 165], [160, 165], [175, 165],
                    [115, 185], [128, 185], [140, 185], [152, 185], [165, 185],
                    [125, 205], [135, 205], [140, 205], [145, 205], [155, 205],
                    [140, 225]
                  ].map(([cx, cy], i) => (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={i % 3 === 0 ? 2.8 : 2.0}
                      fill={i % 2 === 0 ? '#ef4444' : '#f87171'}
                      className="transition-all hover:r-4"
                    />
                  ))}

                  {/* Horizontal Scan Laser Bar with Animation */}
                  <rect x="60" y="115" width="160" height="4" fill="url(#scanGrad)" opacity="0.8" />
                </svg>
              </div>

              {/* Bottom Card Footer */}
              <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-xs font-mono text-slate-400">Memory: 2.1 MB / Client RAM</span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  0.02ms Latency
                </span>
              </div>
            </div>
          </div>

          {/* ----------------- RIGHT COLUMN (col-span-4) ----------------- */}
          <div className="md:col-span-4 flex flex-col gap-4 sm:gap-5">
            {/* Top Row: Two Side-by-Side Cards */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5 h-[210px]">
              {/* Card 1: 85% Lime Green Card */}
              <div className="p-5 rounded-3xl bg-[#D9F99D] text-slate-950 flex flex-col justify-between shadow-sm hover:scale-[1.02] transition-transform">
                <span className="text-4xl sm:text-5xl font-black tracking-tight block">
                  85%
                </span>
                <p className="text-[12px] font-semibold text-slate-900 leading-snug">
                  Faster turnaround on repetitive data &amp; media tasks.
                </p>
              </div>

              {/* Card 2: Dark File Tree Card */}
              <div className="p-5 rounded-3xl bg-[#090C12] border border-slate-800 flex flex-col justify-between text-slate-300 font-mono text-[11px] hover:shadow-md transition">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-semibold">Project Tree</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
                <div className="space-y-1.5 text-slate-400">
                  <div className="text-slate-200">📁 src/wasm/</div>
                  <div className="pl-3 text-cyan-400">⚡ engine.wasm</div>
                  <div className="pl-3 text-emerald-400">📄 schema.json</div>
                  <div className="pl-3 text-slate-400">📄 pdf_core.ts</div>
                </div>
                <span className="text-[10px] text-slate-500">100% In-Browser</span>
              </div>
            </div>

            {/* Bottom Card: Sky Blue Gradient Card with Team Avatars */}
            <div className="p-6 rounded-3xl bg-gradient-to-tr from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-sky-200/80 dark:border-indigo-900/50 flex flex-col justify-between h-[210px] hover:shadow-md transition">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight mb-1">
                  Trusted by 50,000+
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Engineers &amp; technical leads worldwide.
                </p>
              </div>

              {/* Floating Avatars Connected by Nodes */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex -space-x-2">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80"
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                  />
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                    +42
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                  Global Community →
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. STATS / METRICS ROW (Exact Reference: 20K↑, 72K↑, 86%↑)
         ========================================================================= */}
      <section className="border-y border-slate-200/80 dark:border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Stat 1 */}
          <div className="py-6 md:py-0 md:px-8 text-center md:text-left">
            <div className="flex items-baseline justify-center md:justify-start gap-1 mb-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
                20K
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-500">↑</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Active daily developers &amp; engineering teams relying on DreamKit Pro.
            </p>
          </div>

          {/* Stat 2 */}
          <div className="py-6 md:py-0 md:px-8 text-center md:text-left">
            <div className="flex items-baseline justify-center md:justify-start gap-1 mb-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
                72K
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-500">↑</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              File conversions &amp; data transformations executed every minute.
            </p>
          </div>

          {/* Stat 3 */}
          <div className="py-6 md:py-0 md:px-8 text-center md:text-left">
            <div className="flex items-baseline justify-center md:justify-start gap-1 mb-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
                86%
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-500">↑</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Time saved compared to legacy cloud uploads and server-side tools.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. FEATURES SECTION ("Features to Boost Your Productivity")
         ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Features to Boost Your <br className="hidden sm:block" />
              Productivity
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Everything you need to format, convert, compress, and inspect files without leaving your
            browser or transmitting sensitive code.
          </p>
        </div>

        {/* 2-Row Asymmetric Bento Grid (Exact Reference Layout) */}
        <div className="space-y-5">
          {/* Row 1: Two Wide Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Card 1: Workflow Automation (col-span-7) */}
            <div
              className={`md:col-span-7 p-7 rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Simulated UI Widget */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 mb-6">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-indigo-500" />
                    Pipeline Automation
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-[10px] font-bold">
                    Active
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">JSON Ingest &amp; Validate</span>
                    <span className="text-emerald-500 font-mono text-[11px]">✓ Validated</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Format (2 Spaces Indent)</span>
                    <span className="text-indigo-500 font-mono text-[11px]">⚡ 0.01ms</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Lossless PDF Compaction</span>
                    <span className="text-emerald-500 font-mono text-[11px]">-74% Size</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-1.5">
                  Seamless Workflow Automation
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Chain code formatting, schema conversions, and PDF optimizations into a single
                  frictionless local browser pipeline.
                </p>
              </div>
            </div>

            {/* Card 2: Real-Time Analytics Graph (col-span-5) */}
            <div
              className={`md:col-span-5 p-7 rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Simulated Chart Widget */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Performance Gain</span>
                    <span className="text-xl font-black text-slate-950 dark:text-white">$30.29 / ms</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    +42.8%
                  </span>
                </div>

                {/* SVG Area Chart */}
                <div className="h-24 w-full">
                  <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible" fill="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4" />
                        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,60 Q 30,50 60,55 T 120,30 T 160,35 T 200,10 L 200,80 L 0,80 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M 0,60 Q 30,50 60,55 T 120,30 T 160,35 T 200,10"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                    />
                    <circle cx="200" cy="10" r="3.5" fill="#0284c7" />
                  </svg>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-1.5">
                  Real-Time Analytics
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Inspect byte savings, compression percentages, and execution latency in real-time
                  as you transform your files.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Three Column Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 3: Team Collaboration */}
            <div
              className={`p-7 rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Simulated Avatars Node Widget */}
              <div className="h-32 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 p-4 mb-6 flex items-center justify-center relative">
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-500 overflow-hidden shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 overflow-hidden shadow-md scale-110">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-amber-500 overflow-hidden shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80"
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">
                  Team Collaboration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sync design token palettes, regex libraries, and custom watermark templates across
                  your entire team.
                </p>
              </div>
            </div>

            {/* Card 4: Task & Schedule Management */}
            <div
              className={`p-7 rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Simulated Calendar Schedule Tags Widget */}
              <div className="h-32 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 p-4 mb-6 flex flex-col justify-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Production Release • JSON Schema
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    PDF Signature &amp; Watermark Run
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Color Palette WCAG Contrast Audit
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">
                  Task Management
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Track developer workspaces, file history, and active utilities without cloud
                  dependencies.
                </p>
              </div>
            </div>

            {/* Card 5: AI-Powered Insights */}
            <div
              className={`p-7 rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Simulated Ascending Bar Chart Widget */}
              <div className="h-32 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 p-4 mb-6 flex items-end justify-center gap-3">
                <div className="w-6 bg-lime-300 dark:bg-lime-500/40 rounded-t h-10" />
                <div className="w-6 bg-lime-400 dark:bg-lime-500/60 rounded-t h-16" />
                <div className="w-6 bg-lime-500 dark:bg-lime-500/80 rounded-t h-20" />
                <div className="w-6 bg-emerald-500 rounded-t h-24 relative shadow-sm">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    +86%
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">
                  AI-Powered Insights
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Diagnostics that pinpoint exact syntax line and column offsets in broken JSON,
                  XML, or regex.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. "GET STARTED IN 3 SIMPLE STEPS" SECTION (Exact Match)
         ========================================================================= */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white mb-3">
          Get started in 3 simple steps
        </h2>
        <p className="max-w-xl mx-auto text-sm text-slate-500 dark:text-slate-400 mb-14">
          No credit cards, zero installation, and no API keys. Select a tool, process your files
          locally, and export immediately.
        </p>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Step 1 Card */}
          <div
            className={`p-7 rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
            }`}
          >
            {/* Step Mockup */}
            <div className="h-36 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 p-4 mb-6 flex flex-col justify-center items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Quick Launch</span>
              <button
                onClick={() => handleNavigate('dashboard')}
                className="px-4 py-2 rounded-full bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Select 40+ Tools</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-3">
                Step 1
              </span>
              <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">
                Quick Selection &amp; Setup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose from over 40+ specialized tools across code, media, PDF, and security
                suites.
              </p>
            </div>
          </div>

          {/* Step 2 Card */}
          <div
            className={`p-7 rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
            }`}
          >
            {/* Step Mockup */}
            <div className="h-36 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 p-4 mb-6 flex flex-col justify-center gap-2">
              <div className="text-[11px] text-slate-500 font-mono">Input: user_data.json</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full w-3/4 rounded-full" />
              </div>
              <div className="text-[10px] text-emerald-500 font-mono text-right">Processing locally...</div>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-3">
                Step 2
              </span>
              <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">
                Private In-Browser Execution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Transform code, compress PDFs, or extract audio directly in memory using WebAssembly.
              </p>
            </div>
          </div>

          {/* Step 3 Card */}
          <div
            className={`p-7 rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
            }`}
          >
            {/* Step Mockup */}
            <div className="h-36 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 p-4 mb-6 flex flex-col justify-center items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Complete &amp; Ready</span>
              <span className="text-[11px] text-slate-400 font-mono">1-Click Instant Download</span>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-3">
                Step 3
              </span>
              <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">
                Instant Lossless Export
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Download your optimized files or copy formatted code to clipboard with zero wait
                time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. PRICING SECTION ("Simple transparent pricing" - Exact Match to Reference!)
         ========================================================================= */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Pricing Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white mb-3">
            Simple transparent pricing
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Everything you need for solo development or team-wide air-gapped security.
          </p>

          {/* Monthly / Annual Pill Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Annual <span className="text-emerald-500 font-bold ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-8">
          {/* Tier 1: Starter Plan */}
          <div
            className={`p-8 rounded-3xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
            }`}
          >
            <div>
              <h3 className="font-bold text-lg text-slate-950 dark:text-white mb-1">Starter Plan</h3>
              <p className="text-xs text-slate-500 mb-6">For individual developers &amp; hobbyists</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-950 dark:text-white">$0.00</span>
                <span className="text-xs text-slate-400">/ forever</span>
              </div>

              <button
                onClick={() => handleNavigate('dashboard')}
                className="w-full py-2.5 rounded-full text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition cursor-pointer mb-6"
              >
                Start Free
              </button>

              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  All 40+ client-side tools
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Zero server uploads / 100% private
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  No file size or run limitations
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Full offline PWA capability
                </li>
              </ul>
            </div>
          </div>

          {/* Tier 2: Professional Plan (FEATURED - EXACT MATCH TO REFERENCE WITH LIME GLOW & LIME BUTTON) */}
          <div className="p-8 rounded-3xl bg-[#0B0F17] text-white border border-slate-800 relative overflow-hidden flex flex-col justify-between shadow-2xl">
            {/* Luminous Neon Lime/Yellow Radial Glow at Top Right (Exact Match) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/20 blur-[70px] pointer-events-none rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg text-white">Professional Plan</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-400/20 text-lime-300 border border-lime-400/30">
                  Popular
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">For power users &amp; senior engineers</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">
                  {billingCycle === 'annual' ? '$20.00' : '$25.00'}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              {/* Vibrant Neon Lime Pill Button (Exact Match) */}
              <button
                onClick={() => handleNavigate('dashboard')}
                className="w-full py-2.5 rounded-full text-xs font-bold bg-[#BEF264] text-slate-950 hover:bg-[#a3e635] shadow-md shadow-lime-400/20 transition cursor-pointer mb-6"
              >
                Get Started
              </button>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  Everything in Starter, plus:
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  Batch ZIP conversion &amp; bulk exports
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  High-DPI 300 DPI PDF rendering
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  WebAssembly OCR Text Extractor
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  Custom Watermark &amp; Signature presets
                </li>
              </ul>
            </div>
          </div>

          {/* Tier 3: Enterprise Plan */}
          <div
            className={`p-8 rounded-3xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
            }`}
          >
            <div>
              <h3 className="font-bold text-lg text-slate-950 dark:text-white mb-1">Enterprise Plan</h3>
              <p className="text-xs text-slate-500 mb-6">For security-conscious enterprises &amp; teams</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-950 dark:text-white">$800.00</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <button
                onClick={() => handleNavigate('dashboard')}
                className="w-full py-2.5 rounded-full text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition cursor-pointer mb-6"
              >
                Contact Sales
              </button>

              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Air-gapped Docker image deployment
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  SOC2, HIPAA &amp; GDPR DPA compliance
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Single Sign-On (SSO) SAML / Okta
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Dedicated SLA &amp; custom tool requests
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Full-Width Dark Custom Solutions Banner (Exact Match to Reference Bottom Pricing Banner!) */}
        <div className="p-8 rounded-3xl bg-[#0B0F17] text-white border border-slate-800 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          {/* Faint Geometric Pattern on the Right */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none flex items-center justify-end pr-8">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded ${
                    idx % 3 === 0 ? 'bg-slate-400' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 max-w-xl text-left">
            <h4 className="font-bold text-base sm:text-lg mb-1">
              Want a custom solution or self-hosted deployment?
            </h4>
            <p className="text-xs text-slate-400">
              We build custom in-browser tools, air-gapped images, and tailored security packages.
            </p>
          </div>

          <button
            onClick={() => handleNavigate('dashboard')}
            className="relative z-10 px-6 py-2.5 rounded-full text-xs font-bold bg-white text-slate-950 hover:bg-slate-100 transition whitespace-nowrap cursor-pointer active:scale-95 shadow-sm"
          >
            Contact Us
          </button>
        </div>
      </section>

      {/* =========================================================================
          8. TESTIMONIALS SECTION ("What Our Clients Say")
         ========================================================================= */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              What Our Clients Say
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            See how engineering teams and data architects protect client confidentiality and
            streamline workflows with DreamKit Pro.
          </p>
        </div>

        {/* 4 Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {testimonials.map((t, idx) => (
            <div
              key={t.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:shadow-md ${
                idx === testimonialIdx ? 'ring-2 ring-indigo-500/20' : ''
              } ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
              }`}
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6 italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white">{t.author}</h4>
                  <p className="text-[10px] text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation Buttons (Exact Match to Reference Circular Buttons) */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handlePrevTestimonial}
            aria-label="Previous testimonial"
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextTestimonial}
            aria-label="Next testimonial"
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          9. PRE-FOOTER CTA CARD ("Ready to Automate Your Workflow?")
         ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div
          className={`p-10 sm:p-14 rounded-3xl border text-center relative overflow-hidden ${
            isDark
              ? 'bg-slate-900/60 border-slate-800'
              : 'bg-white border-slate-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.03)]'
          }`}
        >
          {/* Subtle Faint Architectural Grid in Background */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white mb-4">
              Ready to Automate Your Workflow?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              Join over 50,000+ developers saving hours every single week with 100% private,
              zero-upload client-side tools.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleNavigate('dashboard')}
                className="w-full sm:w-auto px-7 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition cursor-pointer shadow-md"
              >
                Get Started Now
              </button>
              <button
                onClick={() => handleNavigate('dashboard')}
                className="w-full sm:w-auto px-7 py-3 rounded-full text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Explore 40+ Tools
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. FOOTER ("Simplifying workflows with powerful tools" - Exact Match!)
         ========================================================================= */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
          {/* Left Column: Heading + Newsletter Form (col-span-6) */}
          <div className="lg:col-span-6">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mb-6">
              Simplifying workflows <br />
              with powerful tools.
            </h3>

            {/* Newsletter Subscription Input */}
            <form onSubmit={handleNewsletterSubmit} className="max-w-md">
              <div className="flex items-center p-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus-within:border-slate-400 transition">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-2 text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition cursor-pointer shrink-0"
                >
                  {newsletterSubscribed ? 'Subscribed!' : 'Subscribe'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Get product updates and new tool announcements. No spam, ever.
              </p>
            </form>
          </div>

          {/* Right Columns: Links (col-span-6) */}
          <div className="lg:col-span-6 grid grid-cols-3 gap-8 text-xs">
            {/* Column 1: Core Tools */}
            <div>
              <h4 className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-[11px] mb-4">
                Core Tools
              </h4>
              <ul className="space-y-2.5 text-slate-500 dark:text-slate-400">
                <li>
                  <button onClick={() => handleNavigate('formatter')} className="hover:text-slate-950 dark:hover:text-white cursor-pointer">
                    JSON Formatter
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('pdf_compressor')} className="hover:text-slate-950 dark:hover:text-white cursor-pointer">
                    PDF Compressor
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('image_compressor')} className="hover:text-slate-950 dark:hover:text-white cursor-pointer">
                    Image Studio
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('jwt_debugger')} className="hover:text-slate-950 dark:hover:text-white cursor-pointer">
                    JWT Debugger
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('color_palette')} className="hover:text-slate-950 dark:hover:text-white cursor-pointer">
                    Color Palette
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Platform */}
            <div>
              <h4 className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-[11px] mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5 text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#features" className="hover:text-slate-950 dark:hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-slate-950 dark:hover:text-white">
                    Workflow
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-slate-950 dark:hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/llms.txt" className="hover:text-slate-950 dark:hover:text-white">
                    LLMs.txt API
                  </a>
                </li>
                <li>
                  <a href="/sitemap.xml" className="hover:text-slate-950 dark:hover:text-white">
                    Sitemap
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Security & Company */}
            <div>
              <h4 className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-[11px] mb-4">
                Security
              </h4>
              <ul className="space-y-2.5 text-slate-500 dark:text-slate-400">
                <li>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Zero Egress
                  </span>
                </li>
                <li>
                  <span className="hover:text-slate-950 dark:hover:text-white">Privacy Policy</span>
                </li>
                <li>
                  <span className="hover:text-slate-950 dark:hover:text-white">Terms of Service</span>
                </li>
                <li>
                  <span className="hover:text-slate-950 dark:hover:text-white">HIPAA Safe Harbor</span>
                </li>
                <li>
                  <span className="hover:text-slate-950 dark:hover:text-white">GDPR Compliant</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Line & Copyright */}
        <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {CURRENT_YEAR} DreamKit Pro. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built with 100% In-Browser WebAssembly</span>
            <span>Zero Server Transmission</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
