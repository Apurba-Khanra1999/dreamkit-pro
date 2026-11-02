import React, { useState, useCallback, useMemo } from 'react';
import { 
  Link2, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Download, 
  Upload, 
  ClipboardPaste, 
  ListFilter, 
  Plus, 
  ChevronDown, 
  Code2, 
  Sliders, 
  ExternalLink,
  Layers,
  FileJson
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { 
  encodeUrl, 
  decodeUrl, 
  parseUrlDetails, 
  buildUrlString, 
  URL_PRESETS, 
  ENCODING_MODES, 
  generateUrlCode 
} from '../utils/urlUtils';

export default function UrlEncoderTool({ theme, onNotify }) {
  const [direction, setDirection] = useState('encode'); // 'encode' | 'decode'
  const [encodeMode, setEncodeMode] = useState('component'); // 'component' | 'full' | 'rfc3986' | 'form'
  const [plusAsSpace, setPlusAsSpace] = useState(true);
  const [inputVal, setInputVal] = useState(URL_PRESETS[0].url);
  const [outputVal, setOutputVal] = useState('');

  // Active view tab: 'editors' | 'builder' | 'code'
  const [activeView, setActiveView] = useState('editors');
  const [selectedCodeLang, setSelectedCodeLang] = useState('javascript');

  const [showPresets, setShowPresets] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse URL details for query parameter builder
  const activeUrlForParsing = useMemo(() => {
    return direction === 'decode' && outputVal ? outputVal : inputVal;
  }, [inputVal, outputVal, direction]);

  const parsedDetails = useMemo(() => {
    return parseUrlDetails(activeUrlForParsing);
  }, [activeUrlForParsing]);

  // Derived base parameters from parsed URL
  const baseParams = useMemo(() => {
    return parsedDetails?.params || [];
  }, [parsedDetails]);

  // Temporary newly added parameters that haven't been committed to URL yet
  const [extraParams, setExtraParams] = useState([]);

  // Full displayed parameters list
  const builderParams = useMemo(() => {
    return [...baseParams, ...extraParams];
  }, [baseParams, extraParams]);

  // Execute Encode or Decode
  const handleProcess = useCallback((curDirection = direction, curMode = encodeMode, curPlus = plusAsSpace) => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Enter a URL or query string to process.' });
      return;
    }

    if (curDirection === 'encode') {
      const res = encodeUrl(inputVal, { mode: curMode });
      if (res.success) {
        setOutputVal(res.result);
        onNotify?.({
          type: 'success',
          title: 'URL Encoded',
          message: `${res.stats.encodedLength} chars (${res.stats.diff >= 0 ? '+' : ''}${res.stats.diff} chars expansion)`
        });
      } else {
        onNotify?.({ type: 'error', title: 'Encoding Error', message: res.error });
      }
    } else {
      const res = decodeUrl(inputVal, { plusAsSpace: curPlus });
      if (res.success) {
        setOutputVal(res.result);
        onNotify?.({
          type: 'success',
          title: 'URL Decoded',
          message: `${res.stats.decodedLength} chars extracted.`
        });
      } else {
        onNotify?.({ type: 'error', title: 'Decoding Error', message: res.error });
      }
    }
  }, [inputVal, direction, encodeMode, plusAsSpace, onNotify]);

  // Swap input and output
  const handleSwap = () => {
    if (!outputVal) return;
    setInputVal(outputVal);
    setOutputVal('');
    setDirection(prev => prev === 'encode' ? 'decode' : 'encode');
    onNotify?.({ type: 'info', title: 'Swapped', message: 'Output copied to input editor.' });
  };

  const handleCopy = async (text, label = 'Content') => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      onNotify?.({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!outputVal) return;
    downloadJsonFile(outputVal, direction === 'encode' ? 'encoded-url.txt' : 'decoded-url.txt', 'text/plain');
    onNotify?.({ type: 'success', title: 'Downloaded', message: 'Saved URL to text file.' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { content, fileName } = await readUploadedJsonFile(file);
      setInputVal(content);
      setOutputVal('');
      onNotify?.({ type: 'success', title: 'Loaded File', message: `Loaded ${fileName}` });
    } catch (err) {
      onNotify?.({ type: 'error', title: 'Upload Failed', message: err.message });
    } finally {
      e.target.value = '';
    }
  };

  // Query Parameter Builder actions
  const handleParamChange = (id, field, newValue) => {
    const updated = builderParams.map(p => {
      if (p.id === id) {
        return { ...p, [field]: newValue };
      }
      return p;
    });

    // Check if the modified param was in extraParams
    setExtraParams(prev => prev.map(p => p.id === id ? { ...p, [field]: newValue } : p));

    if (parsedDetails) {
      const newUrl = buildUrlString(parsedDetails, updated);
      if (direction === 'encode') {
        setInputVal(newUrl);
      } else {
        setOutputVal(newUrl);
      }
    }
  };

  const handleAddParam = () => {
    const newParam = {
      id: Math.random().toString(36).substring(2, 9),
      key: '',
      value: ''
    };
    setExtraParams(prev => [...prev, newParam]);
  };

  const handleDeleteParam = (id) => {
    setExtraParams(prev => prev.filter(p => p.id !== id));
    const updated = builderParams.filter(p => p.id !== id);

    if (parsedDetails) {
      const newUrl = buildUrlString(parsedDetails, updated);
      if (direction === 'encode') {
        setInputVal(newUrl);
      } else {
        setOutputVal(newUrl);
      }
    }
  };

  const handleExportParamsAsJson = () => {
    if (!builderParams.length) return;
    const obj = {};
    builderParams.forEach(p => {
      if (p.key.trim()) obj[p.key.trim()] = p.value;
    });
    downloadJsonFile(JSON.stringify(obj, null, 2), 'url-params.json', 'application/json');
    onNotify?.({ type: 'success', title: 'Exported JSON', message: 'Saved parameters as JSON file.' });
  };

  // Code snippets
  const codeSnippets = useMemo(() => {
    return generateUrlCode(direction, inputVal || 'https://example.com/api?query=test');
  }, [direction, inputVal]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Main Mode & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direction Selector */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setDirection('encode');
                setOutputVal('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                direction === 'encode'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Encode URL
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection('decode');
                setOutputVal('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                direction === 'decode'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Decode URL
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => handleProcess()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <Link2 className="w-4 h-4" />
            <span>{direction === 'encode' ? 'Run Encode' : 'Run Decode'}</span>
          </button>

          {/* Mode Selector (in encode mode) */}
          {direction === 'encode' && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <select
                value={encodeMode}
                onChange={(e) => {
                  setEncodeMode(e.target.value);
                  if (outputVal) handleProcess(direction, e.target.value, plusAsSpace);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {ENCODING_MODES.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Decode Option: + as space */}
          {direction === 'decode' && (
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={plusAsSpace}
                onChange={(e) => {
                  setPlusAsSpace(e.target.checked);
                  if (outputVal) handleProcess(direction, encodeMode, e.target.checked);
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Decode <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">+</code> as space</span>
            </label>
          )}

          {/* Presets Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresets(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Presets</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPresets && (
              <div className="absolute left-0 mt-2 w-80 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-30 p-1.5 text-xs animate-scale-in">
                <div className="px-2.5 py-1.5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  Sample URL Templates
                </div>
                {URL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setInputVal(preset.url);
                      setOutputVal('');
                      setShowPresets(false);
                      onNotify?.({ type: 'info', title: 'Preset Loaded', message: `Loaded ${preset.title}` });
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 flex flex-col gap-0.5 transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveView('editors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'editors'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Dual Editor
          </button>

          <button
            type="button"
            onClick={() => setActiveView('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'builder'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-indigo-500" />
            <span>URL Parser ({builderParams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'code'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: DUAL EDITOR VIEW */}
      {activeView === 'editors' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Left Panel: Input Editor */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {direction === 'encode' ? 'Raw URL / Query String to Encode' : 'Encoded URI to Decode'}
                  </span>
                  {inputVal && (
                    <span className="text-slate-400 text-xs">• {inputVal.length.toLocaleString()} chars</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Upload</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt,.url"
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator.clipboard?.readText) {
                          const t = await navigator.clipboard.readText();
                          if (t) setInputVal(t);
                        }
                      } catch {
                        // ignore
                      }
                    }}
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
                    }}
                    disabled={!inputVal}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-40 cursor-pointer"
                    title="Clear input"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[380px]">
                <CodeEditor
                  value={inputVal}
                  onChange={setInputVal}
                  placeholder={direction === 'encode' ? 'Enter full URL or query parameters to encode...' : 'Paste encoded URI sequence to decode...'}
                  theme={theme}
                  onExecuteShortcut={() => handleProcess()}
                />
              </div>
            </div>

            {/* Right Panel: Output Editor */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {direction === 'encode' ? 'Encoded URL Output' : 'Decoded URL Output'}
                  </span>
                  {outputVal && (
                    <span className="text-slate-400 text-xs">• {outputVal.length.toLocaleString()} chars</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {outputVal && (
                    <button
                      type="button"
                      onClick={handleSwap}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                      title="Swap output back to input"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="hidden sm:inline">Swap</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopy(outputVal, 'URL Output')}
                    disabled={!outputVal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!outputVal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[380px] relative">
                {outputVal ? (
                  <CodeEditor
                    value={outputVal}
                    readOnly={true}
                    theme={theme}
                    minHeight="380px"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <Link2 className="w-10 h-10 mb-2 opacity-40 text-indigo-400" />
                    <p className="text-xs">Click {direction === 'encode' ? 'Run Encode' : 'Run Decode'} to view processed URL</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE URL PARSER & QUERY BUILDER */}
      {activeView === 'builder' && (
        <div className="space-y-4 animate-fade-in">
          {/* Structural Components Breakdown */}
          {parsedDetails && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>URL Structural Components</span>
                </div>
                {parsedDetails.isValidUrl && (
                  <a
                    href={parsedDetails.origin + parsedDetails.pathname + (parsedDetails.search || '')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open in browser</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Protocol</span>
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {parsedDetails.protocol || 'None'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Host / Domain</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {parsedDetails.hostname || 'None'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Port</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {parsedDetails.port || 'Default'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Pathname</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">
                    {parsedDetails.pathname || '/'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Parameters Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Query Parameters ({builderParams.length})
                </span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  (Changes update the full URL live)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddParam}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Parameter</span>
                </button>

                {builderParams.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportParamsAsJson}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Export JSON</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-2">
              {builderParams.length > 0 ? (
                <div className="space-y-2">
                  {builderParams.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 group focus-within:border-indigo-400 transition-colors"
                    >
                      <span className="text-slate-400 font-mono text-[10px] w-5 text-center select-none font-bold">
                        {idx + 1}
                      </span>

                      {/* Key Input */}
                      <input
                        type="text"
                        value={p.key}
                        onChange={(e) => handleParamChange(p.id, 'key', e.target.value)}
                        placeholder="Parameter Key..."
                        className="w-1/3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      <span className="text-slate-400 select-none font-mono">=</span>

                      {/* Value Input */}
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => handleParamChange(p.id, 'value', e.target.value)}
                        placeholder="Parameter Value..."
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      {/* Delete Param */}
                      <button
                        type="button"
                        onClick={() => handleDeleteParam(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                        title="Delete parameter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <ListFilter className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
                  <p className="text-xs">No query parameters detected in URL. Click "Add Parameter" to start building.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CODE SNIPPET GENERATOR */}
      {activeView === 'code' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              {['javascript', 'python', 'php', 'go'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedCodeLang(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedCodeLang === lang
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : lang.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(codeSnippets[selectedCodeLang], `${selectedCodeLang} snippet`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="min-h-[380px]">
            <CodeEditor
              value={codeSnippets[selectedCodeLang]}
              readOnly={true}
              theme={theme}
              minHeight="380px"
            />
          </div>
        </div>
      )}
    </div>
  );
}
