import React, { useState, useCallback } from 'react';
import { 
  Palette, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Download, 
  Upload, 
  ClipboardPaste,
  Wand2,
  Minimize2,
  AlignLeft,
  Settings2,
  Code2,
  TrendingDown,
  AlertCircle,
  ArrowDownAZ
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { formatBytes } from '../utils/jsonUtils';
import { 
  formatCss, 
  minifyCss, 
  SAMPLE_CSS 
} from '../utils/cssUtils';

export default function CssFormatter({ theme, onNotify }) {
  const [inputVal, setInputVal] = useState(SAMPLE_CSS);
  const [outputVal, setOutputVal] = useState('');
  const [indent, setIndent] = useState('2');
  const [removeComments, setRemoveComments] = useState(false);
  const [sortProperties, setSortProperties] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [minifiedStats, setMinifiedStats] = useState(null);

  // Beautify / Format CSS
  const handleFormat = useCallback((currentIndent = indent, currentSort = sortProperties) => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter CSS to format.' });
      return;
    }

    const res = formatCss(inputVal, { 
      indent: currentIndent,
      removeComments,
      sortProperties: currentSort
    });

    if (res.success) {
      setOutputVal(res.result);
      setError(null);
      setMinifiedStats(null);
      onNotify?.({
        type: 'success',
        title: 'Formatted Successfully',
        message: `${res.stats.lines} lines • ${res.stats.chars.toLocaleString()} characters`
      });
    } else {
      setError(res.error);
      setOutputVal('');
      setMinifiedStats(null);
      onNotify?.({ type: 'error', title: 'Formatting Failed', message: res.error });
    }
  }, [inputVal, indent, removeComments, sortProperties, onNotify]);

  // Minify CSS
  const handleMinify = () => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter CSS to minify.' });
      return;
    }

    const res = minifyCss(inputVal, { 
      preserveBanners: false 
    });

    if (res.success) {
      setOutputVal(res.result);
      setError(null);
      setMinifiedStats(res.stats);
      onNotify?.({
        type: 'success',
        title: 'Minified Successfully',
        message: `${res.stats.reductionPercentage}% reduction (${res.stats.savedChars.toLocaleString()} chars saved)`
      });
    } else {
      setError(res.error);
      setOutputVal('');
      setMinifiedStats(null);
      onNotify?.({ type: 'error', title: 'Minification Failed', message: res.error });
    }
  };

  // Swap output back to input
  const handleSwap = () => {
    if (!outputVal) return;
    setInputVal(outputVal);
    setOutputVal('');
    setError(null);
    setMinifiedStats(null);
    onNotify?.({ type: 'info', title: 'Swapped', message: 'Output copied to input editor.' });
  };

  const handleCopy = async () => {
    if (!outputVal) return;
    const ok = await copyToClipboard(outputVal);
    if (ok) {
      setCopied(true);
      onNotify?.({ type: 'success', title: 'Copied', message: 'CSS copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!outputVal) return;
    downloadJsonFile(outputVal, 'styles.css', 'text/css');
    onNotify?.({ type: 'success', title: 'Downloaded', message: 'Saved as styles.css' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { content, warning, fileName } = await readUploadedJsonFile(file);
      setInputVal(content);
      setError(null);
      setOutputVal('');
      setMinifiedStats(null);
      if (warning) {
        onNotify?.({ type: 'warning', title: 'Large File Warning', message: warning });
      } else {
        onNotify?.({ type: 'success', title: 'File Loaded', message: `Loaded ${fileName}` });
      }
    } catch (err) {
      onNotify?.({ type: 'error', title: 'Upload Failed', message: err.message });
    } finally {
      e.target.value = '';
    }
  };

  const handlePasteClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputVal(text);
          setError(null);
          onNotify?.({ type: 'info', title: 'Pasted', message: 'Pasted content from clipboard' });
          return;
        }
      }
      onNotify?.({ type: 'info', title: 'Paste Hint', message: 'Use Ctrl+V or Cmd+V to paste into editor.' });
    } catch {
      onNotify?.({ type: 'info', title: 'Paste Hint', message: 'Use Ctrl+V or Cmd+V to paste into editor.' });
    }
  };

  const inputCharCount = inputVal.length;
  const inputLineCount = inputVal ? inputVal.split('\n').length : 0;
  const inputByteSize = new Blob([inputVal]).size;

  const outputCharCount = outputVal.length;
  const outputLineCount = outputVal ? outputVal.split('\n').length : 0;
  const outputByteSize = new Blob([outputVal]).size;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Action Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Action Button: Format CSS */}
          <button
            type="button"
            onClick={() => handleFormat()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <Wand2 className="w-4 h-4" />
            <span>Format CSS</span>
          </button>

          {/* Minify Button */}
          <button
            type="button"
            onClick={handleMinify}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200/80 dark:border-slate-700 transition-colors shadow-xs"
          >
            <Minimize2 className="w-4 h-4 text-indigo-500" />
            <span>Minify CSS</span>
          </button>

          {/* Indentation Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="px-1.5 text-slate-400 flex items-center" title="Indentation">
              <AlignLeft className="w-3.5 h-3.5" />
            </span>
            <button
              type="button"
              onClick={() => {
                setIndent('2');
                if (outputVal && !error) handleFormat('2', sortProperties);
              }}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                indent === '2'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2 Sp
            </button>
            <button
              type="button"
              onClick={() => {
                setIndent('4');
                if (outputVal && !error) handleFormat('4', sortProperties);
              }}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                indent === '4'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              4 Sp
            </button>
            <button
              type="button"
              onClick={() => {
                setIndent('tab');
                if (outputVal && !error) handleFormat('tab', sortProperties);
              }}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                indent === 'tab'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tab
            </button>
          </div>

          {/* Options toggle */}
          <button
            type="button"
            onClick={() => setShowOptions(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
              showOptions
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Options</span>
          </button>
        </div>

        {/* Quick status pill */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          <span>CSS3 + Variables + Media Queries</span>
        </div>
      </div>

      {/* Options Drawer */}
      {showOptions && (
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-950/80 shadow-xs flex flex-wrap items-center gap-5 text-xs animate-slide-in">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={removeComments}
              onChange={(e) => setRemoveComments(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Strip CSS Comments (<code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">/* ... */</code>)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={sortProperties}
              onChange={(e) => {
                setSortProperties(e.target.checked);
                if (outputVal && !error) handleFormat(indent, e.target.checked);
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sort CSS properties alphabetically</span>
          </label>
        </div>
      )}

      {/* Minification Statistics Dashboard Card */}
      {minifiedStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-indigo-50/70 dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-slate-900/90 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-xs animate-fade-in text-xs">
          <div className="flex flex-col p-2.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-indigo-100/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span>Reduction</span>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              -{minifiedStats.reductionPercentage}%
            </div>
          </div>
          <div className="flex flex-col p-2.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="text-slate-500 mb-1">Original Size</div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {minifiedStats.originalChars.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">{formatBytes(minifiedStats.originalBytes)}</div>
          </div>
          <div className="flex flex-col p-2.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="text-slate-500 mb-1">Minified Size</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {minifiedStats.minifiedChars.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">{formatBytes(minifiedStats.minifiedBytes)}</div>
          </div>
          <div className="flex flex-col p-2.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="text-slate-500 mb-1">Space Saved</div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {minifiedStats.savedChars.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">chars saved ({formatBytes(minifiedStats.savedBytes)})</div>
          </div>
        </div>
      )}

      {/* Editor Panels (Desktop Side-by-Side, Mobile Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Left Column: Input Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Input Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Input CSS
              </span>
              {inputCharCount > 0 && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <span>•</span>
                  <span>{inputCharCount.toLocaleString()} chars</span>
                  <span>•</span>
                  <span>{inputLineCount} lines</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{formatBytes(inputByteSize)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setInputVal(SAMPLE_CSS);
                  setError(null);
                  setOutputVal('');
                  setMinifiedStats(null);
                  onNotify?.({ type: 'info', title: 'Sample Loaded', message: 'Sample CSS stylesheet loaded.' });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:border-indigo-200 text-xs shadow-xs cursor-pointer"
                title="Load sample CSS"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sample</span>
              </button>

              <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:border-indigo-200 text-xs shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span>Upload</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".css,.txt"
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handlePasteClick}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs shadow-xs cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-slate-400" />
                <span>Paste</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputVal('');
                  setOutputVal('');
                  setError(null);
                  setMinifiedStats(null);
                }}
                disabled={!inputVal}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-40 cursor-pointer"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[420px]">
            <CodeEditor
              value={inputVal}
              onChange={(val) => {
                setInputVal(val);
                if (error) setError(null);
              }}
              placeholder={`/* Enter or paste CSS styles here */\n.container {\n  display: flex;\n  justify-content: center;\n}`}
              theme={theme}
              onExecuteShortcut={() => handleFormat()}
            />
          </div>
        </div>

        {/* Right Column: Output Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Output Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {minifiedStats ? 'Minified CSS' : 'Formatted CSS Output'}
              </span>

              {outputVal && !error && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <span>•</span>
                  <span>{outputCharCount.toLocaleString()} chars</span>
                  <span>•</span>
                  <span>{outputLineCount} lines</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{formatBytes(outputByteSize)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {outputVal && !error && (
                <button
                  type="button"
                  onClick={handleSwap}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                  title="Replace input with this output"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Swap</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputVal || Boolean(error)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 disabled:opacity-40'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputVal || Boolean(error)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[420px] relative flex flex-col">
            {/* Error state */}
            {error && (
              <div className="p-4 bg-red-50/75 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs">CSS Processing Error</div>
                  <div className="text-xs mt-0.5">{error}</div>
                </div>
              </div>
            )}

            {/* Output editor */}
            {outputVal ? (
              <div className="flex-1 w-full h-full">
                <CodeEditor
                  value={outputVal}
                  readOnly={true}
                  theme={theme}
                  minHeight="420px"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/40">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 mb-3 border border-indigo-100 dark:border-slate-700/60">
                  <Code2 className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Ready to Format
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
                  Enter CSS and click Format CSS to beautify declarations or Minify CSS to compress into single line.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span>Pro-tip: Press</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-300 dark:border-slate-600">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-300 dark:border-slate-600">Enter</kbd>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
