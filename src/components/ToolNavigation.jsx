import React from 'react';
import { TOOLS_REGISTRY } from '../config/toolsRegistry';

export default function ToolNavigation({ activeTool, setActiveTool: _setActiveTool }) {
  const currentTool = TOOLS_REGISTRY.find(t => t.id === activeTool) || TOOLS_REGISTRY[1];
  const Icon = currentTool.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-200 dark:border-slate-800 pb-4">
      {/* Active Tool Meta Info */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
          <Icon className="w-5 h-5 stroke-[2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentTool.title}
            </h1>
            {currentTool.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70">
                {currentTool.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentTool.description}
          </p>
        </div>
      </div>

      {/* Global Shortcut Hint */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <span className="hidden md:inline">Execute shortcut:</span>
        <div className="flex items-center gap-1 font-mono text-[11px] bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
          <kbd className="font-semibold text-slate-700 dark:text-slate-300">Ctrl</kbd>
          <span>/</span>
          <kbd className="font-semibold text-slate-700 dark:text-slate-300">⌘</kbd>
          <span>+</span>
          <kbd className="font-semibold text-slate-700 dark:text-slate-300">Enter</kbd>
        </div>
      </div>
    </div>
  );
}
