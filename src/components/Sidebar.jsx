import React, { useState, useMemo } from 'react';
import { 
  Braces, 
  Search, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  PanelLeftClose
} from 'lucide-react';
import { TOOL_CATEGORIES, TOOLS_REGISTRY } from '../config/toolsRegistry';

export default function Sidebar({
  activeTool,
  onSelectTool,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tools based on search input (excluding 'landing' & 'login' standalone views)
  const filteredTools = useMemo(() => {
    const tools = TOOLS_REGISTRY.filter((t) => t.id !== 'landing' && t.id !== 'login');
    if (!searchQuery.trim()) return tools;
    const q = searchQuery.toLowerCase();
    return tools.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.navLabel.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleToolClick = (tool) => {
    if (!tool.isAvailable) {
      // Planned tool feedback
      return;
    }
    onSelectTool(tool.id);
    onCloseMobile();
  };

  const badgeColorClass = (variant) => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'success':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'emerald':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'warning':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0c111a] border-r border-slate-200/90 dark:border-slate-800/90 transition-all duration-300 ease-in-out shadow-lg lg:shadow-none ${
          /* Desktop collapsed or expanded width */
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        } ${
          /* Mobile open/closed translation */
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <div 
            onClick={() => { onSelectTool('dashboard'); onCloseMobile(); }}
            className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Braces className="w-5 h-5 stroke-[2.5]" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white truncate">
                    JSON<span className="text-indigo-600 dark:text-indigo-400">Studio</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    Pro
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Developer Workspace
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Trigger */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search (when not collapsed on desktop, or on mobile) */}
        {(!collapsed || mobileOpen) && (
          <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tools Navigation Section */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 scrollbar-thin">
          {TOOL_CATEGORIES.map((category) => {
            const categoryTools = filteredTools.filter((t) => t.category === category.id);
            if (categoryTools.length === 0) return null;

            return (
              <div key={category.id} className="space-y-1">
                {/* Category Header Label */}
                {(!collapsed || mobileOpen) && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {category.title}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-0.5">
                  {categoryTools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    const isAvailable = tool.isAvailable;

                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleToolClick(tool)}
                        disabled={!isAvailable}
                        title={collapsed && !mobileOpen ? `${tool.title} ${!isAvailable ? '(Planned)' : ''}` : undefined}
                        className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                            : isAvailable
                            ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                            : 'opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-600'
                        } ${collapsed && !mobileOpen ? 'justify-center px-0' : ''}`}
                      >
                        {/* Icon */}
                        <div
                          className={`shrink-0 transition-transform ${
                            isActive
                              ? 'text-white scale-105'
                              : isAvailable
                              ? 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                              : 'text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4 stroke-[2]" />
                        </div>

                        {/* Title and Badge (hidden when collapsed) */}
                        {(!collapsed || mobileOpen) && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="text-xs truncate">
                              {tool.navLabel}
                            </span>
                            
                            <div className="flex items-center gap-1.5 ml-2">
                              {tool.badge && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                    isActive
                                      ? 'bg-indigo-700/60 text-white border-indigo-400/30'
                                      : badgeColorClass(tool.badgeVariant)
                                  }`}
                                >
                                  {tool.badge}
                                </span>
                              )}
                              {tool.shortcut && !isActive && (
                                <span className="hidden xl:inline font-mono text-[9px] text-slate-400 dark:text-slate-500">
                                  {tool.shortcut}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Collapsed Active Indicator Dot */}
                        {collapsed && !mobileOpen && isActive && (
                          <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-white ring-2 ring-indigo-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredTools.length === 0 && (
            <div className="text-center py-6 px-3">
              <p className="text-xs text-slate-400">No matching tools found</p>
            </div>
          )}
        </div>

        {/* Sidebar Footer with Engine & Security Card */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
          {(!collapsed || mobileOpen) ? (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    Client Sandbox
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    100% In-Browser Privacy
                  </span>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
          ) : (
            <div className="flex justify-center" title="100% Client-side sandbox">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
