import React from 'react';
import { 
  Menu, 
  Search, 
  ChevronRight, 
  Zap,
  LogIn,
  LogOut,
  User,
  Settings
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { TOOLS_REGISTRY } from '../config/toolsRegistry';

export default function AdminNavbar({
  activeTool,
  onOpenMobileSidebar,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  currentUser = null,
  onLogin,
  onLogout,
  onOpenProfileSettings
}) {
  const currentToolMeta = TOOLS_REGISTRY.find((t) => t.id === activeTool) || TOOLS_REGISTRY[0];
  const Icon = currentToolMeta.icon;

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/80 dark:bg-[#121620]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 transition-colors duration-200 select-none">
      <div className="h-full flex items-center justify-between gap-3">
        {/* Left: Mobile trigger & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Apple-Style Breadcrumb path */}
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

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Command Palette Button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/[0.06] text-xs font-medium transition-all shadow-2xs cursor-pointer"
            title="Quick jump to tool (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quick Jump</span>
            <div className="hidden sm:flex items-center gap-0.5 font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>

          {/* Privacy Pill */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium px-2.5 py-1 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>0ms Latency</span>
          </div>

          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 my-auto mx-0.5" />

          {/* USER PROFILE & LOGOUT SECTION */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Profile & Settings Button */}
              <button
                type="button"
                onClick={onOpenProfileSettings}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 text-xs font-semibold text-indigo-900 dark:text-indigo-300 transition-all shadow-2xs cursor-pointer group"
                title="Open Profile Settings"
              >
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="User Avatar" 
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-indigo-400/50" 
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline max-w-[110px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <Settings className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-45 transition-transform" />
              </button>

              {/* Dedicated Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/60 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Settings Button for Guests */}
              <button
                type="button"
                onClick={onOpenProfileSettings}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors shadow-2xs cursor-pointer"
                title="Preferences & Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Sign In Button */}
              <button
                type="button"
                onClick={onLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                title="Sign in with Google or Email"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
