import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  ArrowLeftRight, 
  AlertCircle, 
  Code2, 
  FileCode2, 
  Trash2
} from 'lucide-react';
import { copyToClipboard, downloadJsonFile } from '../utils/fileUtils';
import { formatBytes } from '../utils/jsonUtils';

export default function OutputPanel({
  title = "Output JSON",
  outputValue = "",
  error = null,
  _stats = null,
  onSwap,
  onClearOutput,
  onNotify,
  downloadFilename = "formatted.json",
  children,
}) {
  const [copied, setCopied] = useState(false);

  const charCount = outputValue.length;
  const lineCount = outputValue ? outputValue.split('\n').length : 0;
  const byteSize = new Blob([outputValue]).size;

  const handleCopy = async () => {
    if (!outputValue) return;
    const ok = await copyToClipboard(outputValue);
    if (ok) {
      setCopied(true);
      onNotify?.({ type: 'success', title: 'Copied!', message: 'JSON copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } else {
      onNotify?.({ type: 'error', title: 'Copy Failed', message: 'Could not access clipboard.' });
    }
  };

  const handleDownload = () => {
    if (!outputValue) return;
    const success = downloadJsonFile(outputValue, downloadFilename);
    if (success) {
      onNotify?.({ type: 'success', title: 'Downloaded', message: `Saved as ${downloadFilename}` });
    } else {
      onNotify?.({ type: 'error', title: 'Download Failed', message: 'Could not create file download.' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-sm">
            <FileCode2 className="w-4 h-4 text-emerald-500" />
            <span>{title}</span>
          </div>

          {outputValue && !error && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <span className="hidden sm:inline">•</span>
              <span>{charCount.toLocaleString()} chars</span>
              <span>•</span>
              <span>{lineCount.toLocaleString()} {lineCount === 1 ? 'line' : 'lines'}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{formatBytes(byteSize)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Swap Input & Output */}
          {onSwap && outputValue && !error && (
            <button
              type="button"
              onClick={onSwap}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-slate-600 transition-colors shadow-sm"
              title="Replace input with this output"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Swap</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!outputValue || Boolean(error)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!outputValue || Boolean(error)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Download as .json file"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Download</span>
          </button>

          {/* Clear Output */}
          {onClearOutput && outputValue && (
            <button
              type="button"
              onClick={onClearOutput}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              title="Clear output"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 min-h-[360px] relative flex flex-col">
        {/* Error State Banner */}
        {error ? (
          <div className="p-4 sm:p-5 bg-red-50/70 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-red-700 dark:text-red-300">
                    Syntax Error
                  </span>
                  {error.line && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                      Line {error.line}, Column {error.column}
                    </span>
                  )}
                  {error.position !== null && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                      Char {error.position}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-200 leading-relaxed mb-3">
                  {error.cleanMessage || error.message}
                </p>

                {error.snippet && (
                  <div className="mt-2 p-3 bg-red-100/80 dark:bg-slate-950 rounded-lg border border-red-200 dark:border-red-900/80 overflow-x-auto">
                    <div className="text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold mb-1">
                      Error Context (Line {error.line})
                    </div>
                    <pre className="font-mono text-xs text-red-900 dark:text-red-300 whitespace-pre">
                      {error.snippet}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Output Editor or Empty State */}
        {outputValue ? (
          <div className="flex-1 w-full h-full">
            {children}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 mb-3 border border-indigo-100 dark:border-slate-700/60">
              <Code2 className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              No Output Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-4">
              Enter or paste your JSON in the input panel and click the primary action button to process.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <span>Pro-tip: Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300 font-semibold text-[10px] border border-slate-300 dark:border-slate-600">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300 font-semibold text-[10px] border border-slate-300 dark:border-slate-600">Enter</kbd>
              <span>to execute</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
