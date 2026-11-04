import React from 'react';
import {
  ShieldCheck,
  Zap,
  Cpu,
  ArrowUp,
  Terminal,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers,
  Code2,
  Images,
  FileText
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({ onSelectTool }) {
  const handleToolClick = (toolId) => {
    if (onSelectTool) {
      onSelectTool(toolId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full mt-auto border-t border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-[#0B0E14]/90 backdrop-blur-xl transition-colors duration-200 select-none">
      {/* Top Value / Trust Highlights Bar */}
      <div className="border-b border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Value Card 1 */}
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/[0.06] shadow-2xs">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Lock className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  100% Client-Side Privacy
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Files and data never leave your browser. Zero cloud uploads, zero telemetry, full military privacy.
                </p>
              </div>
            </div>

            {/* Value Card 2 */}
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/[0.06] shadow-2xs">
              <div className="p-2 rounded-xl bg-[#673DE6]/10 text-[#673DE6] dark:text-[#A78BFA] shrink-0">
                <Zap className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Sub-Millisecond Engine
                  <span className="w-1.5 h-1.5 rounded-full bg-[#673DE6]" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Powered by WebAssembly, Web Audio, and hardware Canvas rendering for near-instant execution.
                </p>
              </div>
            </div>

            {/* Value Card 3 */}
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/[0.06] shadow-2xs">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Cpu className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  42+ Local Developer Tools
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Consolidate all your formatting, media compression, PDF workflows, and encoding into one suite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">

          {/* Column 1: Brand & About */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 space-y-4">
            <div
              onClick={() => handleToolClick('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group w-fit"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#673DE6] to-[#8B5CF6] flex items-center justify-center text-white shadow-xs shadow-[#673DE6]/30 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                  <path d="M4 4h4v16H4zM16 4h4v16h-4zM8 10h8v4H8z" />
                </svg>
              </div>
              <span className="font-extrabold text-base tracking-wider text-slate-900 dark:text-white uppercase font-sans">
                Dream<span className="text-[#673DE6] dark:text-[#A78BFA]">Kit</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The high-performance, privacy-first developer workspace. 100% offline-ready and local-first.
            </p>

            {/* Quick Status Pill */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operational • Client-Side</span>
            </div>

            {/* Quick Switcher Hint */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                ⌘K
              </span>
              <span>Quick Jump to tool</span>
            </div>
          </div>

          {/* Column 2: Code & Formatters */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Code & Format</span>
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('formatter')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  JSON Formatter
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('minifier')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  JSON Minifier
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('json_xml')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  JSON ⇄ XML Converter
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('json_csv')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  JSON ⇄ CSV Converter
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('yaml_formatter')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  YAML Formatter
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('html_table')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  HTML Table Generator
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Media & Creative */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5 text-pink-500" />
              <span>Media & Creative</span>
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('image_compressor')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  Image Compressor
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('image_converter')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  Format Converter (WebP/PNG)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('image_resizer')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  Image Resizer & Crop
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('favicon_generator')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  Favicon Generator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('svg_optimizer')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  SVG Optimizer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('color_palette')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  Color Palette Extractor
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: PDF & Documents */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>PDF & Documents</span>
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('pdf_compressor')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  PDF Compressor (WASM)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('pdf_merger')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  PDF Merger
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('pdf_splitter')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  PDF Splitter & Cutter
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('pdf_signature')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  Digital PDF Signer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('pdf_ocr')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  PDF OCR Text Extractor
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('pdf_watermark')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  PDF Watermark
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Security & Encoders */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Security & Suite</span>
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('base64')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  Base64 Encoder / Decoder
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('jwt_debugger')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  JWT Token Decoder
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('qr_code_generator')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  QR Code Studio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('regex_tester')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  RegEx Tester & Analyzer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('seo_audit')}
                  className="hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  SEO Audit Suite
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleToolClick('dashboard')}
                  className="text-[#673DE6] dark:text-[#A78BFA] font-bold hover:underline cursor-pointer"
                >
                  Explore All 42+ Tools →
                </button>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Legal & Back to Top Bar */}
      <div className="border-t border-slate-200/70 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright & Architecture Note */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>&copy; {CURRENT_YEAR} DreamKit Studio.</span>
            <span className="hidden sm:inline">•</span>
            <span>All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
              Developed by Inktagon
            </span>
          </div>

          {/* Quick Actions & Back to top button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleToolClick('landing')}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
            >
              Landing Page
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('dashboard')}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#673DE6] dark:hover:text-[#A78BFA] transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#673DE6] dark:hover:text-[#A78BFA] hover:border-[#673DE6]/40 dark:hover:border-[#673DE6]/40 transition-all shadow-2xs hover:-translate-y-0.5 cursor-pointer active:translate-y-0"
              title="Back to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
