import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home,
  AppWindow,
  Globe,
  Layers,
  FileText,
  ShieldCheck,
  Users,
  Search, 
  X, 
  ChevronRight, 
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { TOOLS_REGISTRY } from '../config/toolsRegistry';

// Category definitions for extreme left icon rail (Hostinger style)
// First option is Dashboard (which shows all tools)
const RAIL_CATEGORIES = [
  { id: 'overview', title: 'Dashboard', icon: Home, short: 'Dashboard' },
  { id: 'json', title: 'Code & Formatters', icon: AppWindow, short: 'Code' },
  { id: 'encoders', title: 'Encoders & Converters', icon: Globe, short: 'Encoders' },
  { id: 'media', title: 'Media & Creative', icon: Layers, short: 'Media' },
  { id: 'pdf', title: 'PDF & Documents', icon: FileText, short: 'PDF' },
  { id: 'analysis', title: 'Security & Analysis', icon: ShieldCheck, short: 'Security' },
];

export default function Sidebar({
  activeTool,
  onSelectTool,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onOpenProfileSettings
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Identify category of active tool
  const currentActiveCategory = useMemo(() => {
    const found = TOOLS_REGISTRY.find((t) => t.id === activeTool);
    if (!found) return 'overview';
    return found.category || 'overview';
  }, [activeTool]);

  // Selected category on the rail (defaults to 'overview' / Dashboard)
  const [selectedCategory, setSelectedCategory] = useState(currentActiveCategory);

  // Synchronize category on the rail when active tool changes externally,
  // but if user is already browsing in 'overview' (Dashboard / All tools), keep it unless activeTool is a special view
  useEffect(() => {
    if (activeTool === 'dashboard') {
      setSelectedCategory('overview');
    }
  }, [activeTool]);

  // Filter tools based on search input and selected category
  const displayTools = useMemo(() => {
    const validTools = TOOLS_REGISTRY.filter((t) => t.id !== 'landing' && t.id !== 'login');
    
    // When searching, search across all tools
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return validTools.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.navLabel.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    // When the first option (Dashboard) is selected, show ALL the tools!
    if (selectedCategory === 'overview') {
      return validTools;
    }

    // Filter tools for the selected specific category
    return validTools.filter((t) => t.category === selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleRailCategoryClick = (catId) => {
    setSelectedCategory(catId);
    setSearchQuery('');
    // If desktop sidebar was collapsed, expand it to reveal the submenu
    if (collapsed && onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const handleToolClick = (tool) => {
    if (!tool.isAvailable) return;
    onSelectTool(tool.id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Hostinger-Style Dual-Tier Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex transition-all duration-300 ease-in-out select-none shadow-xl lg:shadow-none ${
          /* Mobile slide-in translation */
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ========================================================= */}
        {/* EXTREME LEFT COLUMN: Category Icon Rail (Hostinger Style) */}
        {/* ========================================================= */}
        <div className="w-16 h-full flex flex-col items-center justify-between py-3.5 bg-white dark:bg-[#0E121A] border-r border-slate-200 dark:border-white/[0.08] shrink-0 z-20">
          {/* Top: Brand Symbol */}
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                onSelectTool('dashboard');
                setSelectedCategory('overview');
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#673DE6] to-[#8B5CF6] flex items-center justify-center text-white shadow-xs shadow-[#673DE6]/30 hover:scale-105 transition-transform cursor-pointer"
              title="DreamKit Dashboard"
            >
              {/* Hostinger geometric glyph inspired logo */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                <path d="M4 4h4v16H4zM16 4h4v16h-4zM8 10h8v4H8z" />
              </svg>
            </button>

            <div className="w-8 h-px bg-slate-200 dark:bg-white/[0.08] my-1" />

            {/* Category Navigation Icons */}
            <nav className="flex flex-col items-center gap-2 w-full px-2" aria-label="Category navigation">
              {RAIL_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isCatActive = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleRailCategoryClick(cat.id)}
                    className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer group ${
                      isCatActive
                        ? 'text-[#673DE6] dark:text-[#A78BFA] bg-[#F2EFFE] dark:bg-[#673DE6]/20 border border-[#673DE6]/30 dark:border-[#673DE6]/50 shadow-2xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                    title={cat.id === 'overview' ? 'Dashboard (All Tools)' : cat.title}
                    aria-label={cat.title}
                  >
                    <Icon className="w-5 h-5 stroke-[1.8]" />

                    {/* Tooltip on Hover for desktop */}
                    <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md z-50 hidden lg:block">
                      {cat.id === 'overview' ? 'Dashboard (All Tools)' : cat.title}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom: Profile Settings & Panel Collapse Toggle */}
          <div className="flex flex-col items-center gap-2 w-full px-2">
            {/* User Profile / Settings (Hostinger bottom user icon) */}
            <button
              type="button"
              onClick={onOpenProfileSettings}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group relative"
              title="Account & Preferences"
              aria-label="Account & Preferences"
            >
              <Users className="w-5 h-5 stroke-[1.8]" />
              <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md z-50 hidden lg:block">
                Account & Preferences
              </span>
            </button>

            {/* Desktop Collapse / Expand Rail Button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex w-11 h-11 rounded-xl items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group relative"
              title={collapsed ? 'Expand Menu Panel' : 'Collapse Menu Panel'}
              aria-label={collapsed ? 'Expand Menu Panel' : 'Collapse Menu Panel'}
            >
              {collapsed ? (
                <PanelLeft className="w-5 h-5 stroke-[1.8]" />
              ) : (
                <PanelLeftClose className="w-5 h-5 stroke-[1.8]" />
              )}
              <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md z-50">
                {collapsed ? 'Expand Menu Panel' : 'Collapse Menu Panel'}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Hostinger Submenu Items Panel */}
        {/* ========================================================= */}
        {(!collapsed || mobileOpen) && (
          <div className="w-60 sm:w-64 h-full flex flex-col bg-white dark:bg-[#141824] border-r border-slate-200 dark:border-white/[0.08] shrink-0">
            {/* Top Brand Header: HOSTINGER-style DREAMKIT */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] shrink-0">
              <div 
                onClick={() => {
                  onSelectTool('dashboard');
                  setSelectedCategory('overview');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center gap-2.5 cursor-pointer group"
                title="DreamKit Home"
              >
                {/* Hostinger-style brand text */}
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-900 dark:text-white fill-current">
                    <path d="M4 4h4v16H4zM16 4h4v16h-4zM8 10h8v4H8z" />
                  </svg>
                  <span className="font-extrabold text-[15px] tracking-widest text-slate-900 dark:text-white uppercase font-sans">
                    DREAMKIT
                  </span>
                </div>
              </div>

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hostinger Rounded Search Input */}
            <div className="px-3 pt-3.5 pb-2.5 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#673DE6] dark:focus:border-[#8B5CF6] transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Tool Items List (Hostinger Style) */}
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 scrollbar-thin">
              {displayTools.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No tools found for "{searchQuery}"
                </div>
              ) : (
                displayTools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  const isAvailable = tool.isAvailable;

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleToolClick(tool)}
                      disabled={!isAvailable}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all duration-150 group cursor-pointer ${
                        isActive
                          ? /* Hostinger active item: lavender background with purple text & icon (reference: Analytics) */
                            'bg-[#F2EFFE] dark:bg-[#673DE6]/25 text-[#673DE6] dark:text-[#A78BFA] font-bold border border-[#673DE6]/30 dark:border-[#673DE6]/50 shadow-2xs'
                          : isAvailable
                          ? 'text-slate-700 dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-[#1E2433] hover:text-slate-900 dark:hover:text-white font-medium'
                          : 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-[#673DE6] dark:text-[#A78BFA]'
                              : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{tool.title}</span>
                      </div>

                      {/* Right indicator: no chevron for active (like Analytics in ref image), chevron for others */}
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#673DE6] dark:bg-[#A78BFA] shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Submenu Footer: Suite Status */}
            <div className="px-4 py-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
              <span className="font-medium">
                {displayTools.length} {displayTools.length === 1 ? 'tool' : 'tools'}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
