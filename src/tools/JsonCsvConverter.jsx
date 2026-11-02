import React, { useState, useCallback, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Download, 
  Upload, 
  ClipboardPaste,
  AlertCircle,
  Settings2,
  CheckCircle2,
  Table as TableIcon,
  Code2
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { formatBytes, extractJsonErrorDetails } from '../utils/jsonUtils';
import { 
  jsonToCsv, 
  csvToJson, 
  parseCsvRows,
  SAMPLE_JSON_FOR_CSV, 
  SAMPLE_CSV_FOR_JSON 
} from '../utils/csvUtils';

export default function JsonCsvConverter({ theme, onNotify }) {
  // Mode: 'json-to-csv' | 'csv-to-json'
  const [mode, setMode] = useState('json-to-csv');
  const [inputVal, setInputVal] = useState(SAMPLE_JSON_FOR_CSV);
  const [outputVal, setOutputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Output view: 'code' | 'table'
  const [outputView, setOutputView] = useState('code');

  // Options
  const [delimiter, setDelimiter] = useState(',');
  const [flatten, setFlatten] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  // Conversion metadata
  const [meta, setMeta] = useState(null); // { rowCount, colCount, headers }

  const isJsonToCsv = mode === 'json-to-csv';

  // Process conversion
  const handleConvert = useCallback(() => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter content to convert.' });
      return;
    }

    if (isJsonToCsv) {
      // 1. JSON to CSV
      try {
        const parsed = JSON.parse(inputVal);
        const res = jsonToCsv(parsed, {
          delimiter,
          flatten,
          includeHeader
        });
        setOutputVal(res.csv);
        setMeta({
          rowCount: res.rowCount,
          colCount: res.colCount,
          headers: res.headers,
          rows: res.rows
        });
        setError(null);
        onNotify?.({ 
          type: 'success', 
          title: 'Converted to CSV', 
          message: `${res.rowCount} rows and ${res.colCount} columns generated.` 
        });
      } catch (err) {
        const errDetails = extractJsonErrorDetails(inputVal, err);
        setError({
          type: 'json',
          title: 'JSON Parse Error',
          message: errDetails.cleanMessage || err.message,
          line: errDetails.line,
          column: errDetails.column,
          snippet: errDetails.snippet
        });
        setOutputVal('');
        setMeta(null);
        onNotify?.({ type: 'error', title: 'Conversion Failed', message: 'Invalid JSON syntax.' });
      }
    } else {
      // 2. CSV to JSON
      const res = csvToJson(inputVal, { delimiter });
      if (res.success) {
        setOutputVal(res.result);
        setMeta({
          rowCount: res.rowCount,
          colCount: res.colCount,
          headers: res.headers
        });
        setError(null);
        onNotify?.({ 
          type: 'success', 
          title: 'Converted to JSON', 
          message: `Generated JSON array with ${res.rowCount} objects.` 
        });
      } else {
        setError({
          type: 'csv',
          title: 'CSV Syntax Error',
          message: res.error,
          line: null,
          column: null,
          snippet: null
        });
        setOutputVal('');
        setMeta(null);
        onNotify?.({ type: 'error', title: 'Conversion Failed', message: 'Invalid CSV structure.' });
      }
    }
  }, [inputVal, isJsonToCsv, delimiter, flatten, includeHeader, onNotify]);

  // Table rows for visual preview
  const tableData = useMemo(() => {
    if (!outputVal || error) return null;

    if (isJsonToCsv) {
      // CSV string
      const parsedRows = parseCsvRows(outputVal, delimiter);
      if (parsedRows.length === 0) return null;
      const headers = includeHeader ? parsedRows[0] : parsedRows[0].map((_, i) => `Col ${i + 1}`);
      const rows = includeHeader ? parsedRows.slice(1) : parsedRows;
      return { headers, rows };
    } else {
      // JSON string
      try {
        const list = JSON.parse(outputVal);
        if (!Array.isArray(list) || list.length === 0) return null;
        const headers = Object.keys(list[0]);
        const rows = list.map(item => headers.map(h => String(item[h] ?? '')));
        return { headers, rows };
      } catch {
        return null;
      }
    }
  }, [outputVal, error, isJsonToCsv, delimiter, includeHeader]);

  // Mode switcher
  const handleSwitchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setInputVal(newMode === 'json-to-csv' ? SAMPLE_JSON_FOR_CSV : SAMPLE_CSV_FOR_JSON);
    setOutputVal('');
    setMeta(null);
    setError(null);
  };

  // Swap output back to input & flip direction
  const handleSwap = () => {
    if (!outputVal) return;
    const nextMode = isJsonToCsv ? 'csv-to-json' : 'json-to-csv';
    setInputVal(outputVal);
    setOutputVal('');
    setMeta(null);
    setMode(nextMode);
    setError(null);
    onNotify?.({ 
      type: 'info', 
      title: 'Swapped & Flipped', 
      message: `Switched direction to ${nextMode === 'json-to-csv' ? 'JSON to CSV' : 'CSV to JSON'}.` 
    });
  };

  const handleCopy = async () => {
    if (!outputVal) return;
    const ok = await copyToClipboard(outputVal);
    if (ok) {
      setCopied(true);
      onNotify?.({ type: 'success', title: 'Copied', message: 'Output copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!outputVal) return;
    const filename = isJsonToCsv ? 'converted.csv' : 'converted.json';
    const mime = isJsonToCsv ? 'text/csv' : 'application/json';
    downloadJsonFile(outputVal, filename, mime);
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
      setMeta(null);
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
      {/* Top Action & Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleSwitchMode('json-to-csv')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isJsonToCsv
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>JSON to CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('csv-to-json')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isJsonToCsv
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>CSV to JSON</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleConvert}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isJsonToCsv ? 'Convert to CSV' : 'Convert to JSON'}</span>
          </button>

          {/* Options toggle */}
          <button
            type="button"
            onClick={() => setShowOptions(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              showOptions
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>CSV Settings</span>
          </button>
        </div>

        {/* Stats Badge */}
        {meta && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {meta.rowCount.toLocaleString()} rows • {meta.colCount} cols
            </span>
          </div>
        )}
      </div>

      {/* Options Drawer */}
      {showOptions && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-950/80 shadow-xs flex flex-wrap items-center gap-5 text-xs animate-slide-in">
          {/* Delimiter */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Delimiter:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDelimiter(',')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${delimiter === ',' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                Comma (,)
              </button>
              <button
                type="button"
                onClick={() => setDelimiter(';')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${delimiter === ';' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                Semicolon (;)
              </button>
              <button
                type="button"
                onClick={() => setDelimiter('\t')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${delimiter === '\t' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                Tab
              </button>
              <button
                type="button"
                onClick={() => setDelimiter('|')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${delimiter === '|' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                Pipe (|)
              </button>
            </div>
          </div>

          {/* Flatten Nested Objects (JSON to CSV only) */}
          {isJsonToCsv && (
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={flatten}
                onChange={(e) => setFlatten(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Flatten nested keys (<code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">user.name</code>)</span>
            </label>
          )}

          {/* Include Header (JSON to CSV only) */}
          {isJsonToCsv && (
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Include Header Row</span>
            </label>
          )}
        </div>
      )}

      {/* Editor Panels (Desktop Side-by-Side, Mobile Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Left Column: Input Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isJsonToCsv ? 'Input JSON Data' : 'Input CSV Data'}
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
                  setInputVal(isJsonToCsv ? SAMPLE_JSON_FOR_CSV : SAMPLE_CSV_FOR_JSON);
                  setError(null);
                  setOutputVal('');
                  setMeta(null);
                  onNotify?.({ type: 'info', title: 'Sample Loaded', message: 'Loaded sample data.' });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:border-indigo-200 text-xs shadow-xs"
                title="Load sample data"
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
                  accept=".json,.csv,.txt"
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handlePasteClick}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs shadow-xs"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-slate-400" />
                <span>Paste</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputVal('');
                  setOutputVal('');
                  setMeta(null);
                  setError(null);
                }}
                disabled={!inputVal}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-40"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[400px]">
            <CodeEditor
              value={inputVal}
              onChange={(val) => {
                setInputVal(val);
                if (error) setError(null);
              }}
              placeholder={isJsonToCsv ? '[\n  {\n    "id": 1,\n    "name": "Example"\n  }\n]' : 'id,name,role\n1,Example,Admin'}
              theme={theme}
              onExecuteShortcut={handleConvert}
            />
          </div>
        </div>

        {/* Right Column: Output Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Output Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isJsonToCsv ? 'Converted CSV Output' : 'Converted JSON Output'}
              </span>

              {/* View toggle (Code vs Table) */}
              {tableData && !error && (
                <div className="inline-flex p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 ml-2">
                  <button
                    type="button"
                    onClick={() => setOutputView('code')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      outputView === 'code' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputView('table')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      outputView === 'table' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <TableIcon className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                </div>
              )}

              {outputVal && !error && (
                <div className="hidden xl:flex items-center gap-1.5 text-slate-400 text-xs">
                  <span>•</span>
                  <span>{outputCharCount.toLocaleString()} chars</span>
                  <span>•</span>
                  <span>{outputLineCount} lines</span>
                  <span>•</span>
                  <span>{formatBytes(outputByteSize)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {outputVal && !error && (
                <button
                  type="button"
                  onClick={handleSwap}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs"
                  title="Swap output to input and invert mode"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Swap & Flip</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputVal || Boolean(error)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs ${
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[400px] relative flex flex-col">
            {/* Error state */}
            {error ? (
              <div className="p-4 bg-red-50/75 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-red-700 dark:text-red-300">
                        {error.title}
                      </span>
                      {error.line && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                          Line {error.line}, Col {error.column}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-red-800 dark:text-red-200 mb-2">
                      {error.message}
                    </p>
                    {error.snippet && (
                      <pre className="p-2.5 bg-red-100 dark:bg-slate-950 rounded-lg font-mono text-[11px] text-red-900 dark:text-red-300 overflow-x-auto">
                        {error.snippet}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Output editor or table view */}
            {outputVal ? (
              outputView === 'table' && tableData ? (
                <div className="flex-1 overflow-auto max-h-[460px] p-2 bg-slate-50/50 dark:bg-slate-900/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-12 text-center">
                          #
                        </th>
                        {tableData.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80 font-mono text-[11px]">
                      {tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-3 py-2 text-center text-slate-400 font-sans text-[10px]">
                            {rIdx + 1}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 w-full h-full">
                  <CodeEditor
                    value={outputVal}
                    readOnly={true}
                    theme={theme}
                    minHeight="400px"
                  />
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/40">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 mb-3 border border-indigo-100 dark:border-slate-700/60">
                  <FileSpreadsheet className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Ready to Convert
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
                  {isJsonToCsv
                    ? 'Enter JSON data and click Convert to CSV to generate tabular spreadsheet rows.'
                    : 'Paste CSV text and click Convert to JSON to create structured JSON array.'}
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
