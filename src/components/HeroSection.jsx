import React from 'react';
import { Code2, Minimize2, Zap, Lock } from 'lucide-react';

export default function HeroSection({ activeTool, onSelectTool }) {
  const handleSelect = (toolId) => {
    onSelectTool(toolId);
    const el = document.getElementById('tool-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative pt-8 pb-8 sm:pt-12 sm:pb-10 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none rounded-full -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 mb-5 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
          <span>Client-Side Processing Engine</span>
          <span className="w-1 h-1 rounded-full bg-indigo-400" />
          <span className="text-slate-500 dark:text-slate-400">Zero Latency</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-4">
          Your JSON.{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent">
            Clean, Valid, Ready.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
          Format, beautify, and minify JSON instantly with a fast, private, browser-based toolkit.
        </p>

        {/* Two Prominent Tool-Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6 text-left">
          {/* Card 1: Formatter */}
          <button
            type="button"
            onClick={() => handleSelect('formatter')}
            className={`group relative p-5 rounded-2xl border transition-all duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
              activeTool === 'formatter'
                ? 'bg-white dark:bg-slate-900 border-indigo-500/80 dark:border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl transition-colors ${
                activeTool === 'formatter'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
              }`}>
                <Code2 className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                activeTool === 'formatter'
                  ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }`}>
                {activeTool === 'formatter' ? 'Active' : 'Select'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              JSON Formatter
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Make messy JSON readable with custom indentation & syntax validation.
            </p>
          </button>

          {/* Card 2: Minifier */}
          <button
            type="button"
            onClick={() => handleSelect('minifier')}
            className={`group relative p-5 rounded-2xl border transition-all duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
              activeTool === 'minifier'
                ? 'bg-white dark:bg-slate-900 border-indigo-500/80 dark:border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl transition-colors ${
                activeTool === 'minifier'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
              }`}>
                <Minimize2 className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                activeTool === 'minifier'
                  ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }`}>
                {activeTool === 'minifier' ? 'Active' : 'Select'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              JSON Minifier
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Remove unnecessary whitespace and calculate compression reduction.
            </p>
          </button>
        </div>

        {/* Privacy Note Guarantee */}
        <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Your JSON stays in your browser. No upload, no account, no database.</span>
        </div>
      </div>
    </section>
  );
}
