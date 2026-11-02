import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Command, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  Sparkles,
  Terminal
} from 'lucide-react';
import { TOOL_CATEGORIES, TOOLS_REGISTRY } from '../config/toolsRegistry';

export default function DashboardOverview({ onSelectTool }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const availableCount = TOOLS_REGISTRY.filter(t => t.isAvailable && t.id !== 'dashboard').length;
  const plannedCount = TOOLS_REGISTRY.filter(t => !t.isAvailable).length;

  const filteredTools = TOOLS_REGISTRY.filter(t => {
    if (t.id === 'dashboard') return false;
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-[#0B0F17] p-6 sm:p-8 text-white border border-indigo-900/50 shadow-xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Developer Admin Workspace</span>
            <span className="w-1 h-1 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Modular Architecture</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white mb-3">
            High-Performance Developer Suite
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
            A centralized dashboard for JSON processing, formatting, minification, and data transformations. Built to easily scale with new developer utilities.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTool('landing')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>View SaaS Landing Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectTool('formatter')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Launch JSON Formatter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectTool('minifier')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 backdrop-blur-sm transition-all cursor-pointer"
            >
              <span>Launch JSON Minifier</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI / Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tool Count */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Active Utilities
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {availableCount}{' '}
              <span className="text-xs font-normal text-slate-400">
                (+{plannedCount} extensible)
              </span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Modular registry enabled</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Privacy */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Data Privacy
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              100%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              0 bytes sent to external servers
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Execution Engine */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Execution Speed
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              &lt; 1 ms
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Native browser engine
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Keyboard Shortcuts */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Productivity Hotkey
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-1">
              Ctrl + Enter
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Instantly run active tool
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Command className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Developer Extensibility Guide Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-purple-50/80 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Adding New Tools to Your Dashboard
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Easily register any new tool by creating a component in <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 font-mono text-[11px] border border-slate-200 dark:border-slate-700">src/tools/</code> and adding an entry in <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 font-mono text-[11px] border border-slate-200 dark:border-slate-700">src/config/toolsRegistry.js</code>. It will automatically populate the sidebar, search bar, and launch grid.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Directory & Launch Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Tool Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse utilities or select a category below
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Tools ({TOOLS_REGISTRY.length - 1})
            </button>
            {TOOL_CATEGORIES.filter(c => c.id !== 'overview').map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Tool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            const isAvailable = tool.isAvailable;

            return (
              <div
                key={tool.id}
                className={`flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 ${
                  isAvailable
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-75'
                }`}
              >
                <div>
                  {/* Top: Icon & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-2.5 rounded-xl ${
                      isAvailable
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tool.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          tool.badgeVariant === 'primary'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                            : tool.badgeVariant === 'success' || tool.badgeVariant === 'emerald'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                        }`}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {tool.description}
                  </p>

                  {/* Feature Highlights */}
                  {tool.features && (
                    <div className="space-y-1.5 mb-5">
                      {tool.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Launch Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {isAvailable ? (
                    <button
                      type="button"
                      onClick={() => onSelectTool(tool.id)}
                      className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs"
                    >
                      <span>Open Utility</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl">
                      Extensible Slot (Planned)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
