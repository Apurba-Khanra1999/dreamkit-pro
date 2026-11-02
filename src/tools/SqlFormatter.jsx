import React, { useState, useCallback } from 'react';
import { 
  Database, 
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
  TrendingDown,
  AlertCircle,
  Type
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { formatBytes } from '../utils/jsonUtils';
import { 
  formatSql, 
  minifySql, 
  SQL_DIALECTS, 
  SAMPLE_SQL 
} from '../utils/sqlUtils';

export default function SqlFormatter({ theme, onNotify }) {
  const [inputVal, setInputVal] = useState(SAMPLE_SQL);
  const [outputVal, setOutputVal] = useState('');
  const [dialect, setDialect] = useState('postgresql');
  const [indent, setIndent] = useState('2');
  const [keywordCase, setKeywordCase] = useState('upper'); // 'upper' | 'lower' | 'preserve'
  const [functionCase, setFunctionCase] = useState('upper');
  const [dataTypeCase, setDataTypeCase] = useState('upper');
  const [linesBetweenQueries, setLinesBetweenQueries] = useState('2');
  const [removeComments, setRemoveComments] = useState(false);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [minifiedStats, setMinifiedStats] = useState(null);

  // Format SQL Query
  const handleFormat = useCallback((
    currentDialect = dialect, 
    currentIndent = indent, 
    currentCase = keywordCase,
    currentComments = removeComments
  ) => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter SQL to format.' });
      return;
    }

    const res = formatSql(inputVal, {
      language: currentDialect,
      indent: currentIndent,
      keywordCase: currentCase,
      functionCase,
      dataTypeCase,
      linesBetweenQueries: parseInt(linesBetweenQueries, 10) || 2,
      removeComments: currentComments
    });

    if (res.success) {
      setOutputVal(res.result);
      setError(null);
      setMinifiedStats(null);
      onNotify?.({
        type: 'success',
        title: 'Formatted Successfully',
        message: `${res.stats.lines} lines • ${res.stats.chars.toLocaleString()} chars • ${res.stats.queryCount} queries`
      });
    } else {
      setError(res.error);
      setOutputVal('');
      setMinifiedStats(null);
      onNotify?.({ type: 'error', title: 'Formatting Failed', message: res.error });
    }
  }, [inputVal, dialect, indent, keywordCase, functionCase, dataTypeCase, linesBetweenQueries, removeComments, onNotify]);

  // Minify SQL Query
  const handleMinify = () => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter SQL to minify.' });
      return;
    }

    const res = minifySql(inputVal);

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
      onNotify?.({ type: 'success', title: 'Copied', message: 'SQL copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!outputVal) return;
    const filename = minifiedStats ? 'query.min.sql' : 'query.sql';
    downloadJsonFile(outputVal, filename, 'application/sql');
    onNotify?.({ type: 'success', title: 'Downloaded', message: `Saved as ${filename}` });
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
          {/* Primary Action Button: Format SQL */}
          <button
            type="button"
            onClick={() => handleFormat()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <Wand2 className="w-4 h-4" />
            <span>Format SQL</span>
          </button>

          {/* Minify Button */}
          <button
            type="button"
            onClick={handleMinify}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200/80 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <Minimize2 className="w-4 h-4 text-indigo-500" />
            <span>Minify SQL</span>
          </button>

          {/* Dialect Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={dialect}
              onChange={(e) => {
                const nextDialect = e.target.value;
                setDialect(nextDialect);
                if (outputVal && !error) handleFormat(nextDialect, indent, keywordCase, removeComments);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {SQL_DIALECTS.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Indentation Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="px-1.5 text-slate-400 flex items-center" title="Indentation">
              <AlignLeft className="w-3.5 h-3.5" />
            </span>
            <button
              type="button"
              onClick={() => {
                setIndent('2');
                if (outputVal && !error) handleFormat(dialect, '2', keywordCase, removeComments);
              }}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
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
                if (outputVal && !error) handleFormat(dialect, '4', keywordCase, removeComments);
              }}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
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
                if (outputVal && !error) handleFormat(dialect, 'tab', keywordCase, removeComments);
              }}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                indent === 'tab'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tab
            </button>
          </div>

          {/* Keyword Casing Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="px-1.5 text-slate-400 flex items-center" title="Keyword Case">
              <Type className="w-3.5 h-3.5" />
            </span>
            <button
              type="button"
              onClick={() => {
                setKeywordCase('upper');
                if (outputVal && !error) handleFormat(dialect, indent, 'upper', removeComments);
              }}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                keywordCase === 'upper'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Uppercase keywords (SELECT, FROM, WHERE)"
            >
              UPPER
            </button>
            <button
              type="button"
              onClick={() => {
                setKeywordCase('lower');
                if (outputVal && !error) handleFormat(dialect, indent, 'lower', removeComments);
              }}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                keywordCase === 'lower'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Lowercase keywords (select, from, where)"
            >
              lower
            </button>
            <button
              type="button"
              onClick={() => {
                setKeywordCase('preserve');
                if (outputVal && !error) handleFormat(dialect, indent, 'preserve', removeComments);
              }}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                keywordCase === 'preserve'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Preserve original keyword case"
            >
              Preserve
            </button>
          </div>

          {/* Options toggle */}
          <button
            type="button"
            onClick={() => setShowOptions(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
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
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span className="capitalize">{dialect} Dialect Active</span>
        </div>
      </div>

      {/* Options Drawer */}
      {showOptions && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-950/80 shadow-xs space-y-3 text-xs animate-slide-in">
          <div className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5">
            SQL Dialect &amp; Formatting Options
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={removeComments}
                onChange={(e) => {
                  setRemoveComments(e.target.checked);
                  if (outputVal && !error) handleFormat(dialect, indent, keywordCase, e.target.checked);
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Strip Comments (<code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">--</code> &amp; <code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">/* */</code>)</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Function Case:</span>
              <select
                value={functionCase}
                onChange={(e) => {
                  setFunctionCase(e.target.value);
                  if (outputVal && !error) handleFormat();
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="upper">UPPERCASE (COUNT, MAX)</option>
                <option value="lower">lowercase (count, max)</option>
                <option value="preserve">Preserve</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Data Type Case:</span>
              <select
                value={dataTypeCase}
                onChange={(e) => {
                  setDataTypeCase(e.target.value);
                  if (outputVal && !error) handleFormat();
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="upper">UPPERCASE (VARCHAR, INT)</option>
                <option value="lower">lowercase (varchar, int)</option>
                <option value="preserve">Preserve</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Empty Lines Between Queries:</span>
              <select
                value={linesBetweenQueries}
                onChange={(e) => {
                  setLinesBetweenQueries(e.target.value);
                  if (outputVal && !error) handleFormat();
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="1">1 Empty Line</option>
                <option value="2">2 Empty Lines</option>
                <option value="3">3 Empty Lines</option>
              </select>
            </div>
          </div>
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
                Input SQL Query
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
                  setInputVal(SAMPLE_SQL);
                  setError(null);
                  setOutputVal('');
                  setMinifiedStats(null);
                  onNotify?.({ type: 'info', title: 'Sample Loaded', message: 'Sample analytical SQL query loaded.' });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:border-indigo-200 text-xs shadow-xs cursor-pointer"
                title="Load sample SQL query"
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
                  accept=".sql,.txt"
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
              placeholder={`-- Enter or paste SQL query here\nSELECT * FROM users WHERE active = true;`}
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
                {minifiedStats ? 'Minified SQL' : 'Formatted SQL Output'}
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
                  <div className="font-semibold text-xs">SQL Processing Error</div>
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
                  <Database className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Ready to Format SQL
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
                  Enter SQL query and select your database dialect (PostgreSQL, MySQL, BigQuery, SQLite, etc.) to format or minify.
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
