import React, { useState } from 'react';
import { Braces, Code2, Minimize2, Menu, X, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

function GithubIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function Header({ activeTool, setActiveTool, theme, onToggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (toolId) => {
    setActiveTool(toolId);
    setMobileMenuOpen(false);
    // Smooth scroll to tool section
    const el = document.getElementById('tool-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0B0F17]/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <a 
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex items-center gap-3 focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Braces className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                    JSON<span className="text-indigo-600 dark:text-indigo-400">Studio</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    Client-side
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal hidden sm:inline">
                  Fast. Clean. Developer-friendly.
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => handleNavClick('formatter')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTool === 'formatter'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Formatter</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('minifier')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTool === 'minifier'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Minimize2 className="w-4 h-4" />
              <span>Minifier</span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Privacy Badge */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium px-2.5 py-1 rounded-lg bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% In-Browser</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            {/* GitHub Link */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer noopener"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              title="View on GitHub"
              aria-label="GitHub Repository"
            >
              <GithubIcon className="w-5 h-5" />
            </a>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
            <div className="flex flex-col gap-1.5 pb-2">
              <button
                type="button"
                onClick={() => handleNavClick('formatter')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTool === 'formatter'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Code2 className="w-4 h-4 text-indigo-500" />
                <span>JSON Formatter & Beautifier</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('minifier')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTool === 'minifier'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Minimize2 className="w-4 h-4 text-indigo-500" />
                <span>JSON Minifier</span>
              </button>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Zero server calls. Private browser execution.</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
