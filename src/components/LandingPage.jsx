import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldCheck, Zap, ArrowRight, Check, Star, Sparkles, Terminal,
  Copy, CheckCircle2, Lock, Cpu, ChevronDown, ChevronUp,
  Clock, DollarSign, Palette, FileText, Video, Volume2, Braces, X,
  HelpCircle, Command, Heart, Globe, ArrowUpRight, Play,
  Code2, FileCode, Database, Fingerprint, Image, GitCompare, MousePointer2,
  Sun, Moon
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

function useCounter(target, duration = 1600) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return count;
}

function AnimCounter({ value, suffix = '' }) {
  const count = useCounter(value);
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function LandingPage({ 
  onLaunchApp, 
  onSelectTool, 
  theme = 'light', 
  onToggleTheme,
  currentUser = null,
  onLogin,
  onLogout
}) {
  const isDark = theme === 'dark';

  const handleNavigate = (toolId) => {
    if (onSelectTool && toolId) onSelectTool(toolId);
    else if (onLaunchApp) onLaunchApp();
  };

  const [heroTab, setHeroTab] = useState('json');
  const [billingCycle, setBillingCycle] = useState('annual');
  const [teamSize, setTeamSize] = useState(15);
  const [openFaq, setOpenFaq] = useState(null);
  const [terminalTab, setTerminalTab] = useState('npx');
  const [playgroundInput, setPlaygroundInput] = useState(
    '{"project":"DreamKit","version":"2.5","engine":"WebAssembly","latency_ms":0,"privacy":"100%","tools":42,"offline":true}'
  );
  const [playgroundCopied, setPlaygroundCopied] = useState(false);
  const [terminalCopied, setTerminalCopied] = useState(false);

  const playgroundFormatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(playgroundInput), null, 2);
    } catch {
      return '// Invalid JSON — fix the syntax above';
    }
  }, [playgroundInput]);

  const terminalCmds = {
    npx: 'npx dreamkit-cli@latest start',
    curl: 'curl -fsSL https://get.dreamkit.dev | sh',
    docker: 'docker run -p 5173:5173 ghcr.io/dreamkit/studio:latest',
    npm: 'npm install -g @dreamkit/core-toolkit',
  };

  const roiHours = teamSize * 16;
  const roiDollars = roiHours * 85 * 12;

  const faqs = [
    { q: 'How is DreamKit 100% private with zero uploads?', a: 'Every engine runs inside your browser JavaScript and WebAssembly sandbox. Files are loaded into device RAM via FileReader and never touch a network socket. There is no backend, no API, and no telemetry endpoint.' },
    { q: 'Does DreamKit work offline or behind a corporate firewall?', a: 'Yes. DreamKit registers a Service Worker that pre-caches the entire app shell and Wasm binaries. After first load, cut your Wi-Fi and everything keeps working — ideal for air-gapped security teams and strict enterprise firewall environments.' },
    { q: 'What is the difference between the Free tier and Pro?', a: 'Free gives unlimited access to all 42 client-side utilities with no time limits or file size caps. Pro adds team palette sync, batch ZIP processing, advanced OCR rasterization, CLI integrations, priority GitHub support, and early feature drops.' },
    { q: 'What video and audio formats does the Audio Extractor support?', a: "DreamKit's Web Audio demuxer handles MP4, WebM, MOV, MKV, AVI, and M4V containers. Output formats include lossless 16-bit PCM WAV (44.1kHz stereo), compressed MP3, and OGG Vorbis. You can trim start/end, normalize peaks to -0.2 dBFS, and apply mono downmix." },
    { q: 'Can my team self-host DreamKit on Kubernetes or AWS?', a: 'Yes. The Enterprise tier includes a single-container Docker image with zero external dependencies. Deploy to Amazon ECS, Google Cloud Run, Fly.io, or an air-gapped private Kubernetes cluster. The binary is under 40MB and serves 100+ concurrent users from a single node.' },
    { q: 'Is DreamKit compliant with HIPAA, SOC2, and GDPR?', a: 'Because DreamKit never transmits any client data, it is architecturally compliant with HIPAA Safe Harbor, SOC2 Type II (no cloud egress), and GDPR Article 25 (privacy by design). We provide a Data Processing Addendum (DPA) for Enterprise customers.' },
  ];

  const testimonials = [
    { name: 'Elena Rostova', role: 'Staff Infrastructure Engineer', company: 'Meridian Fintech', text: "Our engineers were pasting production JWT tokens into sketchy online JSON formatters. DreamKit fixed that overnight. It's now pinned by every engineer on the team.", rating: 5, tag: 'HIPAA Safe', accent: 'indigo' },
    { name: 'Marcus Vance', role: 'Principal Frontend Architect', company: 'Orion Cloud', text: 'The Color Palette Generator replaced three separate design tools. The WCAG 2.1 contrast matrix and Tailwind token export saved two full sprint days in our last design system overhaul.', rating: 5, tag: 'Design System', accent: 'purple' },
    { name: 'Dr. Sarah Lin', role: 'Head of ML Engineering', company: 'Waypoint Robotics', text: 'Extracting clean audio from gigabyte drone footage in the browser — no uploads, instant, works in the field with no Wi-Fi. This felt like magic the first time I used it.', rating: 5, tag: 'Field Engineering', accent: 'pink' },
    { name: 'James Okafor', role: 'Senior Security Architect', company: 'Fortress Capital', text: 'SOC2 auditors loved it. Zero cloud egress means zero data-at-rest risk. We migrated 60 engineers from a paid cloud tool to DreamKit free and nobody complained.', rating: 5, tag: 'SOC2 Certified', accent: 'emerald' },
    { name: 'Priya Nair', role: 'Lead UI Engineer', company: 'Pulse Design Systems', text: "The SVG optimizer and HTML table generator are embarrassingly good. I keep finding new utilities I didn't know existed. It genuinely feels like the IDE of web tools.", rating: 5, tag: 'Power User', accent: 'amber' },
    { name: 'Tobias Kern', role: 'DevOps Platform Engineer', company: 'Stratos Infrastructure', text: 'Runs in our air-gapped Kubernetes cluster behind a VPN. No egress, no ingress. The Docker image is under 40MB and handles dozens of concurrent users effortlessly.', rating: 5, tag: 'Self-Hosted', accent: 'cyan' },
  ];

  const tools = [
    { icon: Braces, label: 'JSON Formatter', desc: 'Format, validate, minify', id: 'formatter', color: 'indigo' },
    { icon: Volume2, label: 'Audio Extractor', desc: 'Video to WAV/MP3/OGG', id: 'audio_extractor', color: 'purple' },
    { icon: Palette, label: 'Color Palette', desc: '36 themes + WCAG audit', id: 'color_palette', color: 'pink' },
    { icon: FileText, label: 'PDF Engine', desc: 'Compress, merge, OCR', id: 'pdf_converter', color: 'amber' },
    { icon: Image, label: 'Image Studio', desc: 'Resize, compress, convert', id: 'image_compressor', color: 'emerald' },
    { icon: Code2, label: 'Code Formatters', desc: 'CSS, JS, SQL, HTML', id: 'css_formatter', color: 'cyan' },
    { icon: Fingerprint, label: 'JWT Debugger', desc: 'Decode and verify tokens', id: 'jwt_debugger', color: 'rose' },
    { icon: Globe, label: 'SEO Audit', desc: 'Serp preview, schema', id: 'seo_audit', color: 'violet' },
    { icon: GitCompare, label: 'JSON Converter', desc: 'JSON to XML / CSV', id: 'json_xml', color: 'teal' },
    { icon: Database, label: 'SQL Formatter', desc: 'Beautify SQL queries', id: 'sql_formatter', color: 'orange' },
    { icon: FileCode, label: 'HTML Table', desc: 'CSV to HTML table', id: 'html_table', color: 'lime' },
    { icon: MousePointer2, label: 'QR Generator', desc: 'Custom QR codes', id: 'qr_code_generator', color: 'sky' },
  ];

  const colorMap = isDark ? {
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    teal: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    lime: 'bg-lime-500/15 text-lime-400 border-lime-500/20',
    sky: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  } : {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    pink: 'bg-pink-50 text-pink-700 border-pink-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    violet: 'bg-violet-50 text-violet-700 border-violet-200/80',
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80',
    orange: 'bg-orange-50 text-orange-700 border-orange-200/80',
    lime: 'bg-lime-50 text-lime-700 border-lime-200/80',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/80',
  };

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#060911] text-slate-100' : 'bg-[#FAFBFC] text-slate-900'
    }`}>

      {/* AMBIENT BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full blur-3xl"
          style={{ 
            background: isDark 
              ? 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 50%, transparent 80%)'
              : 'radial-gradient(ellipse, rgba(99,102,241,0.09) 0%, rgba(139,92,246,0.04) 50%, transparent 80%)'
          }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[500px] rounded-full blur-3xl"
          style={{ 
            background: isDark
              ? 'radial-gradient(ellipse, rgba(236,72,153,0.1) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(236,72,153,0.05) 0%, transparent 70%)'
          }} />
        <div className={`absolute inset-0 ${isDark ? 'opacity-[0.025]' : 'opacity-[0.04]'}`}
          style={{ 
            backgroundImage: `linear-gradient(${isDark ? 'rgba(148,163,184,1)' : 'rgba(100,116,139,1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(148,163,184,1)' : 'rgba(100,116,139,1)'} 1px, transparent 1px)`, 
            backgroundSize: '60px 60px' 
          }} />
      </div>

      {/* ═══════ NAVBAR ═══════ */}
      <nav className={`sticky top-0 z-50 w-full transition-colors duration-200 ${
        isDark ? 'border-b border-white/[0.07] bg-[#060911]/80 backdrop-blur-2xl' : 'border-b border-slate-200/80 bg-white/80 backdrop-blur-2xl shadow-xs'
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[68px] items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Braces className="w-4 h-4 stroke-[2.5] text-white" />
                <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 ${isDark ? 'border-[#060911]' : 'border-white'}`} />
              </div>
              <div>
                <div className={`text-sm font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Dream<span className="text-indigo-600 dark:text-indigo-400">Kit</span>
                </div>
                <div className={`text-[10px] leading-none mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Studio v2.5</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {[['Features', '#features'], ['Tools', '#tools'], ['Playground', '#playground'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
                <a key={label} href={href} 
                  className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}>
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Theme Toggle Button */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                  title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                  className={`p-2 rounded-xl transition-all border ${
                    isDark
                      ? 'bg-slate-800/80 text-amber-300 border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
                  }`}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${
                    isDark 
                      ? 'bg-indigo-950/40 border-indigo-800/80 text-indigo-300' 
                      : 'bg-indigo-50/70 border-indigo-200 text-indigo-800'
                  }`}>
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="User Avatar" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Sign Out"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={onLogin ? onLogin : () => handleNavigate('login')}
                  className={`hidden sm:block text-[13px] font-semibold transition-colors px-3 py-2 cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign in
                </button>
              )}
              <button type="button" onClick={onLaunchApp}
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white overflow-hidden group shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-transform"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }}>
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Launch Studio
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-8 sm:pb-16 max-w-7xl mx-auto">

        <div className="flex justify-center mb-8">
          <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-sm shadow-2xs ${
            isDark 
              ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' 
              : 'border-indigo-200/80 bg-indigo-50 text-indigo-700'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            v2.5 — Audio Extractor + 36-Theme Color Engine just shipped
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">

          {/* Left text */}
          <div className="space-y-7">
            <h1 className={`text-[clamp(2.5rem,6vw,4.25rem)] font-black tracking-tight leading-[1.06] ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}>
              The{' '}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400">
                  local-first
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70" />
              </span>
              {' '}developer suite built for zero latency.
            </h1>

            <p className={`text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed max-w-lg ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Replace every sketchy online converter with{' '}
              <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                42 high-performance utilities
              </strong> — JSON, WebAssembly audio demuxing, PDF OCR, and WCAG color science. All in your browser RAM.
            </p>

            <div className={`flex flex-wrap items-center gap-4 text-[13px] ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {['#6366f1', '#8b5cf6', '#ec4899', '#10b981'].map((c, i) => (
                    <div key={i} className={`w-6 h-6 rounded-full border-2 ${isDark ? 'border-[#060911]' : 'border-white'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="font-medium">45,000+ engineers</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                <span className={`ml-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>4.9</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Zero server uploads
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={onLaunchApp}
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-[15px] text-white overflow-hidden shadow-xl shadow-indigo-600/25 active:scale-[0.98] transition-all"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #db2777 100%)' }}>
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                Start Free — No Signup
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700" />
              </button>
              <a href="#playground"
                className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-[15px] transition-all ${
                  isDark
                    ? 'text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20'
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 shadow-sm'
                }`}>
                <Play className="w-4 h-4 fill-current text-indigo-500" />
                Live Playground
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {[{ icon: Lock, text: 'HIPAA Safe' }, { icon: ShieldCheck, text: 'SOC2 Compliant' }, { icon: Globe, text: 'Works Offline' }].map(({ icon: Icon, text }) => (
                <div key={text} className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border shadow-2xs ${
                  isDark 
                    ? 'text-slate-400 bg-white/[0.03] border-white/[0.07]' 
                    : 'text-slate-600 bg-white border-slate-200/80'
                }`}>
                  <Icon className="w-3.5 h-3.5 text-indigo-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right macOS window */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl blur-2xl" 
              style={{ 
                background: isDark
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15), rgba(236,72,153,0.2))'
                  : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08), rgba(236,72,153,0.1))'
              }} />
            <div className={`relative rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
              isDark 
                ? 'border-white/10 bg-[#0B0F1A]' 
                : 'border-slate-200/90 bg-white shadow-slate-300/50'
            }`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${
                isDark ? 'bg-[#080C15] border-white/[0.07]' : 'bg-slate-50/90 border-slate-200/80'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  <span className={`ml-3 text-[11px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>dreamkit — workspace</span>
                </div>
                <div className={`flex items-center gap-0.5 p-1 rounded-lg border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-slate-200/60 border-slate-200'
                }`}>
                  {[{ id: 'json', label: 'JSON', icon: Braces }, { id: 'audio', label: 'Audio', icon: Volume2 }, { id: 'color', label: 'Color', icon: Palette }, { id: 'pdf', label: 'PDF', icon: FileText }].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button key={tab.id} type="button" onClick={() => setHeroTab(tab.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          heroTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'
                        }`}>
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  0ms
                </div>
              </div>

              <div className="p-5 min-h-[300px]">
                {heroTab === 'json' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">auth_payload.json</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3 stroke-[3]" /> Valid JSON</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl border font-mono text-[11px] ${
                        isDark ? 'bg-black/40 border-white/[0.08]' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className={`text-[10px] font-sans font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>Raw Input</div>
                        <div className={`break-all leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>{`{"id":"usr_9918","tier":"enterprise","quota":999999}`}</div>
                      </div>
                      <div className={`p-3 rounded-xl border font-mono text-[11px] ${
                        isDark ? 'bg-black/60 border-indigo-500/30' : 'bg-slate-900 border-indigo-400/40 text-emerald-300'
                      }`}>
                        <div className="text-[10px] text-indigo-400 font-sans font-bold uppercase tracking-wide mb-2">Formatted</div>
                        <pre className="text-[10px] leading-relaxed text-slate-200 dark:text-slate-200">{`{\n  "id": "usr_9918",\n  "tier": "enterprise",\n  "quota": 999999\n}`}</pre>
                      </div>
                    </div>
                    <div className={`text-[10px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>Parsed in 0.2ms • No network calls • Zero telemetry</div>
                  </div>
                )}
                {heroTab === 'audio' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>cinematic_trailer.mp4 (312 MB)</span>
                      </div>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">WAV 16-bit 44.1kHz</span>
                    </div>
                    <div className={`p-4 rounded-xl border ${
                      isDark ? 'bg-black/50 border-purple-500/25' : 'bg-slate-50 border-purple-200'
                    }`}>
                      <div className="flex items-end gap-0.5 h-20">
                        {[20,40,65,30,85,55,95,40,100,75,60,45,80,90,70,50,85,95,40,65,30,75,90,55,100,80,45,60,70,85,40,95,60,75,50,85].map((h, i) => (
                          <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-full ${
                            i >= 9 && i <= 25 
                              ? 'bg-gradient-to-t from-purple-600 to-pink-500' 
                              : isDark ? 'bg-white/10' : 'bg-slate-200'
                          }`} />
                        ))}
                      </div>
                      <div className={`flex justify-between text-[10px] font-mono mt-2 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                        <span>Trim: 00:09.0</span>
                        <span className="text-pink-600 dark:text-pink-400 font-bold">Selected: 16.4s</span>
                        <span>End: 00:25.4</span>
                      </div>
                    </div>
                  </div>
                )}
                {heroTab === 'color' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Cyberpunk Neon — Harmony 5</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold">WCAG AAA</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 h-24">
                      {[{ hex: '#0D0221', label: 'Void' }, { hex: '#0F084B', label: 'Abyss' }, { hex: '#26408B', label: 'Cobalt' }, { hex: '#FF007F', label: 'Neon Pink' }, { hex: '#00F0FF', label: 'Cyan' }].map((s) => (
                        <div key={s.hex} style={{ backgroundColor: s.hex }} className="rounded-xl flex flex-col justify-end p-2 shadow-md hover:scale-105 transition-transform cursor-pointer">
                          <div className="text-[9px] font-mono font-bold text-white/90 drop-shadow-sm">{s.hex}</div>
                          <div className="text-[9px] text-white/70 truncate drop-shadow-sm">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-[10px] text-center font-mono font-bold">
                      {['4.5:1', '3.1:1', '2.8:1', '7.2:1', '8.1:1'].map((r, i) => (
                        <div key={i} className={`py-1 rounded-md ${
                          i >= 3 
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-transparent' 
                            : 'text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/40 border border-amber-200 dark:border-transparent'
                        }`}>{r}</div>
                      ))}
                    </div>
                  </div>
                )}
                {heroTab === 'pdf' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>PDF Compression Pipeline</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">-87.8% Size</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Original', value: '14.8 MB', sub: 'Uncompressed', accent: isDark ? 'text-slate-300' : 'text-slate-800', border: isDark ? 'border-white/10' : 'border-slate-200' },
                        { label: 'Optimized', value: '1.8 MB', sub: 'Saved 13 MB', accent: 'text-emerald-600 dark:text-emerald-400', border: isDark ? 'border-emerald-500/30' : 'border-emerald-200' },
                        { label: 'OCR Output', value: '100% Vector', sub: 'Markdown export', accent: 'text-purple-600 dark:text-purple-400', border: isDark ? 'border-purple-500/30' : 'border-purple-200' }
                      ].map((card) => (
                        <div key={card.label} className={`p-3 rounded-xl border ${card.border} ${isDark ? 'bg-black/40' : 'bg-slate-50'}`}>
                          <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{card.label}</div>
                          <div className={`text-sm font-black font-mono mt-1 ${card.accent}`}>{card.value}</div>
                          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{card.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div className={`text-[10px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>Processed in browser RAM • 0 bytes uploaded • pdf-lib engine</div>
                  </div>
                )}
              </div>

              <div className={`flex items-center justify-between px-4 py-2.5 border-t text-[10px] font-mono ${
                isDark ? 'bg-[#080C15] border-white/[0.07]' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Air-gapped • Zero egress
                </div>
                <button type="button" onClick={onLaunchApp} className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 transition-colors">
                  Open full studio
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ METRICS ═══════ */}
      <section className={`py-10 px-4 sm:px-6 lg:px-8 border-y transition-colors ${
        isDark ? 'border-white/[0.06] bg-white/[0.01]' : 'border-slate-200/80 bg-white shadow-2xs'
      }`}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: 42, suffix: '+', label: 'Browser-Native Utilities', color: isDark ? 'text-white' : 'text-slate-900' },
            { value: 0, suffix: ' ms', label: 'Server Round-Trip Latency', color: 'text-indigo-600 dark:text-indigo-400' },
            { value: 100, suffix: '%', label: 'Client-Side Privacy', color: 'text-emerald-600 dark:text-emerald-400' },
            { value: 45000, suffix: '+', label: 'Engineers Trust DreamKit', color: 'text-pink-600 dark:text-pink-400' }
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${stat.color}`}>
                <AnimCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className={`text-[12px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FEATURES (id: features) ═══════ */}
      <section id="features" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
            <span className="w-8 h-[1px] bg-indigo-500" />
            Why DreamKit
            <span className="w-8 h-[1px] bg-indigo-500" />
          </div>
          <h2 className={`text-[clamp(2rem,4vw,3.5rem)] font-black tracking-tight leading-tight ${
            isDark ? 'text-white' : 'text-slate-950'
          }`}>
            Engineered for engineers who care about{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 dark:from-indigo-400 dark:to-pink-400">
              privacy and performance.
            </span>
          </h2>
          <p className={`text-base leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Not another ad-infested converter site. A unified, zero-telemetry professional workstation that lives in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className={`md:col-span-8 relative p-8 rounded-3xl border transition-all overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-br from-indigo-950/50 via-[#0D1222] to-[#080C14] border-indigo-500/15 hover:border-indigo-500/35' 
              : 'bg-white border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-md'
          }`}>
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative space-y-4 max-w-md">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                isDark ? 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}><Cpu className="w-6 h-6" /></div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                WebAssembly Audio Demuxer — Lossless and Instant
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Extract clean 16-bit PCM WAV or MP3 audio from any video file (MP4, MKV, WebM, MOV) at multi-gigabyte scale, using native Web Audio API decoding and zero network bytes.
              </p>
              <div className={`pt-4 border-t flex items-center justify-between text-xs font-mono ${
                isDark ? 'border-white/[0.07]' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  Web Audio PCM Engine Active
                </div>
                <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>0 bytes uploaded</span>
              </div>
            </div>
          </div>

          <div className={`md:col-span-4 relative p-7 rounded-3xl border transition-all overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-br from-emerald-950/40 via-[#0D1222] to-[#080C14] border-emerald-500/15 hover:border-emerald-500/35' 
              : 'bg-white border-slate-200/90 hover:border-emerald-300 shadow-sm hover:shadow-md'
          }`}>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative space-y-4 h-full flex flex-col justify-between">
              <div>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border mb-4 ${
                  isDark ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                }`}><ShieldCheck className="w-5 h-5" /></div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Air-Gapped by Design</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Confidential API keys, JWT tokens, and database credentials never leave device RAM. Architecturally SOC2 and HIPAA-safe.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                HIPAA • SOC2 • GDPR Safe
              </div>
            </div>
          </div>

          <div className={`md:col-span-4 relative p-7 rounded-3xl border transition-all overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-br from-pink-950/40 via-[#0D1222] to-[#080C14] border-pink-500/15 hover:border-pink-500/35' 
              : 'bg-white border-slate-200/90 hover:border-pink-300 shadow-sm hover:shadow-md'
          }`}>
            <div className="absolute top-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative space-y-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                isDark ? 'bg-pink-500/15 border-pink-500/25 text-pink-400' : 'bg-pink-50 border-pink-200 text-pink-600'
              }`}><Palette className="w-5 h-5" /></div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>WCAG Color Science Engine</h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                36 curated palettes, color blindness simulation, pairwise contrast ratios, and one-click Tailwind + CSS variable export.
              </p>
              <div className="flex gap-1.5">{['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981'].map((c) => <div key={c} className="w-7 h-7 rounded-lg shadow-xs" style={{ backgroundColor: c }} />)}</div>
            </div>
          </div>

          <div className={`md:col-span-8 relative p-8 rounded-3xl border transition-all overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-br from-purple-950/40 via-[#0D1222] to-[#080C14] border-purple-500/15 hover:border-purple-500/35' 
              : 'bg-white border-slate-200/90 hover:border-purple-300 shadow-sm hover:shadow-md'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  isDark ? 'bg-purple-500/15 border-purple-500/25 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'
                }`}><Command className="w-6 h-6" /></div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Keyboard-First Command Palette</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Navigate all 42 tools without lifting your hands. Global <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                    isDark ? 'text-purple-400 bg-purple-950/50' : 'text-purple-700 bg-purple-50'
                  }`}>Cmd+K</code> switcher, tool-specific shortcuts, and instant results.
                </p>
              </div>
              <div className="space-y-2">
                {[{ keys: ['Cmd', 'K'], desc: 'Open command palette' }, { keys: ['Cmd', '1'], desc: 'Jump to JSON Formatter' }, { keys: ['Ctrl', 'Enter'], desc: 'Run and format instantly' }, { keys: ['Space'], desc: 'Regenerate color palette' }].map((s) => (
                  <div key={s.desc} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {s.keys.map((k) => (
                        <kbd key={k} className={`px-2 py-1 rounded-md border font-mono font-bold text-[11px] shadow-2xs ${
                          isDark ? 'bg-white/10 border-white/15 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                        }`}>{k}</kbd>
                      ))}
                    </div>
                    <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`md:col-span-12 p-8 rounded-3xl border overflow-hidden transition-colors ${
            isDark ? 'bg-[#0B0F1A] border-white/[0.07]' : 'bg-white border-slate-200/90 shadow-sm'
          }`}>
            <div className="text-center mb-8 space-y-2">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>DreamKit vs. Everything Else</h3>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Why 45,000 engineers switched from random online tools.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                    <th className={`text-left py-3 px-4 font-semibold text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Capability</th>
                    <th className="py-3 px-4 text-center">
                      <div className={`inline-flex items-center gap-2 font-bold text-xs px-3 py-1.5 rounded-full border ${
                        isDark 
                          ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' 
                          : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                      }`}>
                        <Braces className="w-3.5 h-3.5" /> DreamKit Studio
                      </div>
                    </th>
                    <th className={`py-3 px-4 text-center font-medium text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Ad-Supported Sites</th>
                    <th className={`py-3 px-4 text-center font-medium text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Desktop Software</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                  {[
                    ['100% In-Browser Privacy', true, false, true],
                    ['Zero Upload / Zero Server Logs', true, false, true],
                    ['Offline and Air-Gapped Ready', true, false, true],
                    ['Multi-GB Audio/Video Demuxing', true, false, true],
                    ['No Installation (Browser Native)', true, true, false],
                    ['42+ Unified Utilities in One Tab', true, false, false],
                    ['Sub-millisecond Wasm Performance', true, false, false],
                    ['Free — No Credit Card Required', true, false, false]
                  ].map(([feat, dk, ads, desktop]) => (
                    <tr key={feat} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/70'}`}>
                      <td className={`py-3 px-4 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{feat}</td>
                      <td className={`py-3 px-4 text-center ${isDark ? 'bg-indigo-950/20' : 'bg-indigo-50/50'}`}>
                        {dk ? (
                          <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Yes
                          </div>
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{ads ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 mx-auto" /> : <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />}</td>
                      <td className="py-3 px-4 text-center">{desktop ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 mx-auto" /> : <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TOOLS (id: tools) ═══════ */}
      <section id="tools" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest font-mono">
              <span className="w-8 h-[1px] bg-pink-500" />
              42+ Utilities
            </div>
            <h2 className={`text-[clamp(2rem,4vw,3rem)] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Everything you need,<br />nothing you don't.
            </h2>
          </div>
          <button type="button" onClick={onLaunchApp} 
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors group shrink-0">
            Browse all 42 tools <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const cls = colorMap[tool.color] || colorMap.indigo;
            return (
              <button key={tool.id + tool.label} type="button" onClick={() => handleNavigate(tool.id)}
                className={`group p-4 rounded-2xl border transition-all text-left shadow-2xs ${
                  isDark 
                    ? 'bg-white/[0.03] border-white/[0.07] hover:border-white/20 hover:bg-white/[0.06]' 
                    : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-md'
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-3 ${cls}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className={`text-[13px] font-bold transition-colors leading-tight ${
                  isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-900 group-hover:text-indigo-600'
                }`}>
                  {tool.label}
                </div>
                <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{tool.desc}</div>
              </button>
            );
          })}
          <button type="button" onClick={onLaunchApp}
            className={`group p-4 rounded-2xl border transition-all text-left col-span-2 sm:col-span-1 flex flex-col justify-between shadow-xs ${
              isDark 
                ? 'bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border-indigo-500/25 hover:border-indigo-500/50' 
                : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300'
            }`}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className={`text-[13px] font-bold leading-tight ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>Open Studio</div>
              <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>All 42+ tools</div>
            </div>
          </button>
        </div>
      </section>

      {/* ═══════ PLAYGROUND (id: playground) ═══════ */}
      <section id="playground" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Terminal className="w-3.5 h-3.5" />
            Interactive Sandbox
          </div>
          <h2 className={`text-[clamp(2rem,4vw,3rem)] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
            Try the engine right now.
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Zero page reloads. Zero network calls. Pure browser execution.
          </p>
        </div>
        <div className={`rounded-3xl border overflow-hidden shadow-2xl transition-colors ${
          isDark ? 'border-white/[0.08] bg-[#0B0F1A]' : 'border-slate-200/90 bg-white shadow-slate-300/40'
        }`}>
          <div className={`flex items-center justify-between px-5 py-3 border-b ${
            isDark ? 'bg-[#080C15] border-white/[0.07]' : 'bg-slate-50 border-slate-200/80'
          }`}>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className={`text-[11px] font-mono ml-2 ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
                JSON Formatter Playground
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          </div>
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Raw Input</span>
                <button type="button" onClick={() => setPlaygroundInput('{"project":"DreamKit","active":true,"stars":14200,"engine":"Wasm","memory_mb":18}')}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold transition-colors">
                  Load sample
                </button>
              </div>
              <textarea value={playgroundInput} onChange={(e) => setPlaygroundInput(e.target.value)} rows={9} spellCheck={false}
                className={`w-full p-4 rounded-xl border font-mono text-[12px] focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none ${
                  isDark 
                    ? 'bg-black/50 border-white/[0.08] text-slate-200 focus:border-indigo-500/60' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                }`} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Formatted Output</span>
                <button type="button" onClick={() => { navigator.clipboard.writeText(playgroundFormatted); setPlaygroundCopied(true); setTimeout(() => setPlaygroundCopied(false), 2000); }}
                  className={`flex items-center gap-1 transition-colors ${
                    isDark ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}>
                  {playgroundCopied ? <><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <pre className={`w-full h-[220px] p-4 rounded-xl border font-mono text-[12px] overflow-auto select-all whitespace-pre-wrap break-all ${
                isDark 
                  ? 'bg-black/70 border-indigo-500/20 text-emerald-300' 
                  : 'bg-slate-950 border-slate-800 text-emerald-400'
              }`}>
                {playgroundFormatted}
              </pre>
            </div>
          </div>
          <div className="px-5 sm:px-6 pb-5">
            <div className={`rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
              isDark ? 'bg-black/40 border-white/[0.07]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center gap-1 p-1 rounded-lg border shrink-0 ${
                isDark ? 'bg-white/[0.05] border-white/[0.07]' : 'bg-slate-200/60 border-slate-200'
              }`}>
                {['npx', 'curl', 'docker', 'npm'].map((tab) => (
                  <button key={tab} type="button" onClick={() => setTerminalTab(tab)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono uppercase transition-all ${
                      terminalTab === tab 
                        ? 'bg-indigo-600 text-white shadow-2xs' 
                        : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'
                    }`}>{tab}</button>
                ))}
              </div>
              <span className={`font-mono text-[12px] flex-1 truncate ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                {terminalCmds[terminalTab]}
              </span>
              <button type="button" onClick={() => { navigator.clipboard.writeText(terminalCmds[terminalTab]); setTerminalCopied(true); setTimeout(() => setTerminalCopied(false), 2000); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  isDark ? 'bg-white/[0.07] hover:bg-white/10 text-white' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs'
                }`}>
                {terminalCopied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {terminalCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                Parsed in less than 0.4ms — in-browser only
              </div>
              <button type="button" onClick={onLaunchApp} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-xs">
                Open all 42 tools <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ ROI CALCULATOR ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className={`rounded-3xl border p-8 sm:p-12 shadow-2xl transition-colors ${
          isDark 
            ? 'border-indigo-500/25 bg-gradient-to-br from-indigo-950/40 via-[#0B0F1A] to-[#080C14]' 
            : 'border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 shadow-slate-200/50'
        }`}>
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
              <Clock className="w-3.5 h-3.5" />
              ROI Estimator
            </div>
            <h2 className={`text-[clamp(1.75rem,3.5vw,2.75rem)] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Calculate your team's annual savings.
            </h2>
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Engineering Team Size</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 text-lg font-bold">{teamSize} Engineers</span>
              </div>
              <input type="range" min="1" max="100" value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                className={`w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-200'
                }`} />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>1 dev</span><span>50 devs</span><span>100 devs</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-black/30 border-white/[0.08]' : 'bg-white border-slate-200/90 shadow-2xs'
              }`}>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium"><Clock className="w-3.5 h-3.5 text-indigo-500" />Hours Saved / Month</div>
                <div className={`text-4xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>~{roiHours}</div>
                <div className="text-xs text-slate-500 mt-1">Based on 16 hrs/dev/month avg</div>
              </div>
              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-black/30 border-indigo-500/30' : 'bg-white border-indigo-200 shadow-2xs'
              }`}>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium"><DollarSign className="w-3.5 h-3.5 text-emerald-500" />Annual Productivity Value</div>
                <div className="text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400">${roiDollars.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">At $85/hr engineering rate</div>
              </div>
            </div>
            <div className="text-center">
              <button type="button" onClick={onLaunchApp} 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-colors shadow-lg shadow-indigo-600/25 active:scale-[0.98]">
                Start saving time now — free <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400">
            <Heart className="w-3.5 h-3.5 fill-current" />
            Wall of Love
          </div>
          <h2 className={`text-[clamp(2rem,4vw,3rem)] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
            Trusted by engineers at world-class companies.
          </h2>
        </div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {testimonials.map((t, i) => {
            const borders = isDark ? {
              indigo: 'border-indigo-500/20 hover:border-indigo-500/40',
              purple: 'border-purple-500/20 hover:border-purple-500/40',
              pink: 'border-pink-500/20 hover:border-pink-500/40',
              emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
              amber: 'border-amber-500/20 hover:border-amber-500/40',
              cyan: 'border-cyan-500/20 hover:border-cyan-500/40',
            } : {
              indigo: 'border-slate-200/90 hover:border-indigo-300',
              purple: 'border-slate-200/90 hover:border-purple-300',
              pink: 'border-slate-200/90 hover:border-pink-300',
              emerald: 'border-slate-200/90 hover:border-emerald-300',
              amber: 'border-slate-200/90 hover:border-amber-300',
              cyan: 'border-slate-200/90 hover:border-cyan-300',
            };
            const tags = isDark ? {
              indigo: 'bg-indigo-500/15 text-indigo-400',
              purple: 'bg-purple-500/15 text-purple-400',
              pink: 'bg-pink-500/15 text-pink-400',
              emerald: 'bg-emerald-500/15 text-emerald-400',
              amber: 'bg-amber-500/15 text-amber-400',
              cyan: 'bg-cyan-500/15 text-cyan-400',
            } : {
              indigo: 'bg-indigo-50 text-indigo-700',
              purple: 'bg-purple-50 text-purple-700',
              pink: 'bg-pink-50 text-pink-700',
              emerald: 'bg-emerald-50 text-emerald-700',
              amber: 'bg-amber-50 text-amber-700',
              cyan: 'bg-cyan-50 text-cyan-700',
            };
            return (
              <div key={i} className={`break-inside-avoid p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#0B0F1A] shadow-xl' : 'bg-white shadow-sm hover:shadow-md'
              } ${borders[t.accent]}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-0.5">{[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tags[t.accent]}`}>{t.tag}</span>
                </div>
                <p className={`text-[13px] leading-relaxed italic mb-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  "{t.text}"
                </p>
                <div className={`flex items-center gap-2.5 pt-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className={`text-[13px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.name}</div>
                    <div className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ PRICING (id: pricing) ═══════ */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
            <span className="w-8 h-[1px] bg-indigo-500" />
            Transparent Pricing
            <span className="w-8 h-[1px] bg-indigo-500" />
          </div>
          <h2 className={`text-[clamp(2rem,4vw,3rem)] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
            Start free. Scale when ready.
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            No credit card required. All 42 utilities are completely free forever.
          </p>
          <div className={`inline-flex items-center gap-2 p-1.5 rounded-2xl border ${
            isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button type="button" onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                billingCycle === 'monthly' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
              Monthly
            </button>
            <button type="button" onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all ${
                billingCycle === 'annual' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
              Annual
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold">SAVE 25%</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className={`flex flex-col p-8 rounded-3xl border shadow-xl transition-colors ${
            isDark ? 'bg-[#0B0F1A] border-white/[0.08]' : 'bg-white border-slate-200/90 shadow-slate-200/50'
          }`}>
            <div className="mb-6">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">Starter</div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Free Forever</h3>
              <p className="text-xs text-slate-500 mt-1">Individual engineers and personal projects.</p>
            </div>
            <div className="font-mono mb-6">
              <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>$0</span>
              <span className="text-xs text-slate-500 ml-2">/ forever</span>
            </div>
            <ul className={`flex-1 space-y-3 text-xs mb-8 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {['All 42 browser-native utilities', 'Unlimited JSON, minify, format', 'Audio extraction from video', 'Color palettes + WCAG audit', 'Offline PWA and service worker', 'Zero telemetry, zero data logs'].map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <button type="button" onClick={onLaunchApp} 
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                isDark 
                  ? 'text-white bg-white/[0.07] hover:bg-white/[0.12] border border-white/10' 
                  : 'text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200'
              }`}>
              Launch Free Studio
            </button>
          </div>

          <div className={`relative flex flex-col p-8 rounded-3xl border-2 border-indigo-600 shadow-2xl shadow-indigo-500/20 overflow-hidden ${
            isDark ? 'bg-gradient-to-b from-[#141A2E] to-[#0B0F1A]' : 'bg-white'
          }`}>
            <div className="absolute -top-px left-1/2 -translate-x-1/2">
              <div className="px-4 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-wider text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}>Most Popular</div>
            </div>
            <div className="mb-6 pt-4">
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono mb-1">Pro</div>
              <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Pro Specialist <Sparkles className="w-4 h-4 text-pink-500" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">Power engineers and senior creators.</p>
            </div>
            <div className="font-mono mb-6">
              <span className={`text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>${billingCycle === 'annual' ? '9' : '12'}</span>
              <span className="text-xs text-slate-500 ml-2">/ mo, billed {billingCycle}</span>
            </div>
            <ul className={`flex-1 space-y-3 text-xs mb-8 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {['Everything in Free tier', 'Batch multi-file ZIP processing', 'High-DPI PDF rasterization and OCR', 'Custom brand token exports', 'CLI sync integration', 'Priority support and early drops'].map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <button type="button" onClick={onLaunchApp} 
              className="w-full py-3 rounded-xl font-extrabold text-sm text-white transition-all shadow-md active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)' }}>
              Start 14-Day Free Trial
            </button>
          </div>

          <div className={`flex flex-col p-8 rounded-3xl border shadow-xl transition-colors ${
            isDark ? 'bg-[#0B0F1A] border-white/[0.08]' : 'bg-white border-slate-200/90 shadow-slate-200/50'
          }`}>
            <div className="mb-6">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">Enterprise</div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sovereign Deploy</h3>
              <p className="text-xs text-slate-500 mt-1">Engineering teams with compliance needs.</p>
            </div>
            <div className="font-mono mb-6">
              <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>${billingCycle === 'annual' ? '29' : '39'}</span>
              <span className="text-xs text-slate-500 ml-2">/ user / mo</span>
            </div>
            <ul className={`flex-1 space-y-3 text-xs mb-8 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {['Everything in Pro tier', 'Docker on-premise self-hosting', 'Custom SSO / SAML / Okta', 'Team palette and token sync', 'Dedicated Slack + SLA guarantee', 'Custom Wasm compilation pipeline'].map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <button type="button" onClick={onLaunchApp} 
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                isDark 
                  ? 'text-slate-200 bg-white/[0.07] hover:bg-white/[0.12] border border-white/10' 
                  : 'text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200'
              }`}>
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ (id: faq) ═══════ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </div>
          <h2 className={`text-[clamp(2rem,4vw,2.75rem)] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-2">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`rounded-2xl border transition-all ${
                isOpen 
                  ? isDark ? 'border-indigo-500/30 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50/50'
                  : isDark ? 'border-white/[0.07] bg-[#0B0F1A]' : 'border-slate-200/80 bg-white shadow-2xs'
              }`}>
                <button type="button" onClick={() => setOpenFaq(isOpen ? null : idx)} className="w-full px-6 py-5 text-left flex items-center justify-between gap-4">
                  <span className={`text-sm font-bold transition-colors ${
                    isOpen 
                      ? isDark ? 'text-indigo-300' : 'text-indigo-700'
                      : isDark ? 'text-white' : 'text-slate-900'
                  }`}>{item.q}</span>
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isOpen 
                      ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                      : isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-500'
                  }`}>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>
                {isOpen && (
                  <div className={`px-6 pb-6 text-sm leading-relaxed border-t pt-4 ${
                    isDark ? 'text-slate-400 border-indigo-500/10' : 'text-slate-600 border-indigo-100'
                  }`}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #500724 100%)' }} />
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(236,72,153,0.18) 0%, transparent 60%)' }} />
          <div className="relative text-center py-20 px-6 space-y-8 border border-white/[0.08] rounded-3xl">
            <div className="space-y-4 max-w-3xl mx-auto">
              <h2 className="text-[clamp(2rem,5vw,3.75rem)] font-black text-white tracking-tight leading-tight">
                The browser is your server.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Ship faster. Stay private.</span>
              </h2>
              <p className="text-base text-indigo-200/90 max-w-xl mx-auto leading-relaxed">
                Join 45,000+ engineers who trust DreamKit for JSON pipelines, audio demuxing, PDF engineering, and color systems — all in a single browser tab.
              </p>
            </div>
            <button type="button" onClick={onLaunchApp}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-extrabold text-[15px] text-slate-900 bg-white hover:bg-slate-100 shadow-2xl active:scale-[0.98] transition-all overflow-hidden cursor-pointer">
              <Zap className="w-5 h-5 text-indigo-600 fill-current" />
              Launch Studio — Free Forever
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex flex-wrap items-center justify-center gap-6 text-[12px] text-indigo-200/80">
              {['No account required', 'No credit card needed', 'Works offline', '42+ tools free forever'].map((t, i, arr) => (
                <React.Fragment key={t}>
                  <span>{t}</span>
                  {i < arr.length - 1 && <span className="w-1 h-1 rounded-full bg-current opacity-50" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className={`border-t py-14 px-4 sm:px-6 lg:px-8 text-xs transition-colors ${
        isDark ? 'border-white/[0.06] bg-[#040608] text-slate-500' : 'border-slate-200 bg-slate-100/90 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Braces className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>DreamKit Studio</span>
              </div>
              <p className={`text-[12px] max-w-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                The high-performance, local-first developer workstation. Built on WebAssembly, Web Audio API, and modern browser primitives.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                All 42 tools operational · Zero server tracking
              </div>
            </div>
            <div className="space-y-3">
              <div className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Developer Suite</div>
              <ul className="space-y-2">
                {[['JSON Formatter', 'formatter'], ['Audio Extractor', 'audio_extractor'], ['Color Palette Studio', 'color_palette'], ['PDF Converter and OCR', 'pdf_converter'], ['SVG Optimizer', 'svg_optimizer']].map(([label, id]) => (
                  <li key={id}>
                    <button type="button" onClick={() => handleNavigate(id)} 
                      className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <div className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Architecture</div>
              <ul className="space-y-2">
                {[['WebAssembly Engine', '#features'], ['Web Audio Demuxer', '#features'], ['WCAG Color Science', '#features'], ['Local RAM Sandbox', '#playground'], ['Offline Service Worker', '#faq']].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-indigo-600'}`}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <div className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Trust and Privacy</div>
              <ul className="space-y-2">
                {[['Privacy Guarantee', '#faq'], ['HIPAA Compliance', '#faq'], ['SOC2 Type II Safe', '#faq'], ['Zero Telemetry Policy', '#faq'], ['Pricing', '#pricing']].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-indigo-600'}`}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] ${
            isDark ? 'border-white/[0.04] text-slate-600' : 'border-slate-200 text-slate-500'
          }`}>
            <div>&copy; {CURRENT_YEAR} DreamKit Studio Inc. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={onLaunchApp} className="hover:underline font-semibold text-indigo-600 dark:text-indigo-400">Launch Studio</button>
              <span>·</span>
              <a href="#pricing" className="hover:underline">Pricing</a>
              <span>·</span>
              <a href="#faq" className="hover:underline">FAQ</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
