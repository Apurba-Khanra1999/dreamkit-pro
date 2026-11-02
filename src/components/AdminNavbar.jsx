import React from 'react';
import { 
  Menu, 
  Search, 
  ChevronRight, 
  Zap,
  Sparkles,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { TOOLS_REGISTRY } from '../config/toolsRegistry';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function AdminNavbar({
  activeTool,
  onSelectTool,
  onOpenMobileSidebar,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  currentUser = null,
  onLogin,
  onLogout,
}) {
  const currentToolMeta = TOOLS_REGISTRY.find((t) => t.id === activeTool) || TOOLS_REGISTRY[0];
  const Icon = currentToolMeta.icon;

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/80 dark:bg-[#0B0F17]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 transition-colors duration-200">
      <div className="h-full flex items-center justify-between gap-3">
        {/* Left: Mobile trigger & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb path */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium min-w-0">
            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
              Workspace
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 hidden sm:inline" />
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold truncate">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate">{currentToolMeta.title}</span>
            </div>
          </div>
        </div>

        {/* Right: Search command trigger, badges, theme toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* SaaS Landing Page Showcase Link */}
          {onSelectTool && (
            <button
              type="button"
              onClick={() => onSelectTool('landing')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="View SaaS Landing Page Showcase"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>
          )}

          {/* Quick Command Palette Button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 text-xs font-medium transition-all shadow-xs"
            title="Quick switch tools (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quick Jump...</span>
            <div className="hidden sm:flex items-center gap-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>

          {/* Privacy Pill */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium px-2.5 py-1 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>0ms Latency</span>
          </div>

          {/* User Auth Profile Badge or Sign In */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div 
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-900 dark:text-indigo-300 shadow-2xs"
                title={`Signed in as ${currentUser.email}`}
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline max-w-[100px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors shadow-xs cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              title="Sign in with Google or Email"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* GitHub link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs"
            title="GitHub Repository"
            aria-label="GitHub Repository"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
