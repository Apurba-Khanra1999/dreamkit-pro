import React, { useState, useCallback, useMemo } from 'react';
import { 
  Binary, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Download, 
  Upload, 
  Wand2, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  Hash, 
  Settings2, 
  ChevronDown,
  Eye,
  FileCode
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { formatBytes } from '../utils/jsonUtils';
import { 
  encodeTextToBase64, 
  decodeBase64ToText, 
  hexToBase64, 
  base64ToHex, 
  readFileAsDataUri,
  parseDataUri, 
  BASE64_PRESETS 
} from '../utils/base64Utils';

export default function Base64Tool({ theme, onNotify }) {
  // Primary sub-mode: 'text' | 'file' | 'hex'
  const [subMode, setSubMode] = useState('text');

  // Text mode direction: 'encode' | 'decode'
  const [direction, setDirection] = useState('encode');
  const [inputVal, setInputVal] = useState(BASE64_PRESETS[0].content);
  const [outputVal, setOutputVal] = useState('');

  // Options
  const [urlSafe, setUrlSafe] = useState(false);
  const [stripPadding, setStripPadding] = useState(false);
  const [lineWrap, setLineWrap] = useState('0'); // '0', '64', '76'
  const [showOptions, setShowOptions] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // File to Base64 state
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [uploadedFileType, setUploadedFileType] = useState('');
  const [fileDataUri, setFileDataUri] = useState('');
  const [fileSnippetFormat, setFileSnippetFormat] = useState('datauri'); // 'datauri' | 'raw' | 'html' | 'css'

  // Hex mode direction: 'hex_to_b64' | 'b64_to_hex'
  const [hexDirection, setHexDirection] = useState('hex_to_b64');
  const [hexInput, setHexInput] = useState(BASE64_PRESETS[3].content);
  const [hexOutput, setHexOutput] = useState('');

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Process Text Encode / Decode
  const handleProcessText = useCallback((
    curDirection = direction, 
    curUrlSafe = urlSafe, 
    curStrip = stripPadding, 
    curWrap = lineWrap
  ) => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter content to process.' });
      return;
    }

    if (curDirection === 'encode') {
      const res = encodeTextToBase64(inputVal, {
        urlSafe: curUrlSafe,
        stripPadding: curStrip,
        lineWrap: parseInt(curWrap, 10) || 0
      });

      if (res.success) {
        setOutputVal(res.result);
        setError(null);
        setStats(res.stats);
        onNotify?.({
          type: 'success',
          title: 'Base64 Encoded',
          message: `${res.stats.encodedChars.toLocaleString()} characters generated (+${res.stats.overheadPercentage}% overhead)`
        });
      } else {
        setError(res.error);
        setOutputVal('');
        setStats(null);
        onNotify?.({ type: 'error', title: 'Encoding Failed', message: res.error });
      }
    } else {
      const res = decodeBase64ToText(inputVal);

      if (res.success) {
        setOutputVal(res.result);
        setError(null);
        setStats(res.stats);
        onNotify?.({
          type: 'success',
          title: 'Base64 Decoded',
          message: `${res.stats.decodedChars.toLocaleString()} characters extracted.`
        });
      } else {
        setError(res.error);
        setOutputVal('');
        setStats(null);
        onNotify?.({ type: 'error', title: 'Decoding Failed', message: res.error });
      }
    }
  }, [inputVal, direction, urlSafe, stripPadding, lineWrap, onNotify]);

  // Process Hex Mode
  const handleProcessHex = useCallback(() => {
    if (!hexInput.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Hex Input', message: 'Please enter hex string to convert.' });
      return;
    }

    if (hexDirection === 'hex_to_b64') {
      const res = hexToBase64(hexInput);
      if (res.success) {
        setHexOutput(res.result);
        setError(null);
        onNotify?.({ type: 'success', title: 'Converted to Base64', message: 'Hex converted successfully.' });
      } else {
        setError(res.error);
        setHexOutput('');
        onNotify?.({ type: 'error', title: 'Conversion Error', message: res.error });
      }
    } else {
      const res = base64ToHex(hexInput);
      if (res.success) {
        setHexOutput(res.result);
        setError(null);
        onNotify?.({ type: 'success', title: 'Converted to Hex', message: 'Base64 converted to Hex.' });
      } else {
        setError(res.error);
        setHexOutput('');
        onNotify?.({ type: 'error', title: 'Conversion Error', message: res.error });
      }
    }
  }, [hexInput, hexDirection, onNotify]);

  // Process File Upload for File to Base64
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (subMode === 'file') {
        const dataUri = await readFileAsDataUri(file);
        setUploadedFileName(file.name);
        setUploadedFileSize(file.size);
        setUploadedFileType(file.type || 'application/octet-stream');
        setFileDataUri(dataUri);
        onNotify?.({
          type: 'success',
          title: 'File Encoded to Base64',
          message: `${file.name} (${formatBytes(file.size)})`
        });
      } else {
        const { content, fileName } = await readUploadedJsonFile(file);
        setInputVal(content);
        setError(null);
        onNotify?.({ type: 'success', title: 'Loaded File', message: `Loaded ${fileName}` });
      }
    } catch (err) {
      onNotify?.({ type: 'error', title: 'Upload Failed', message: err.message });
    } finally {
      e.target.value = '';
    }
  };

  // Swap input and output
  const handleSwap = () => {
    if (!outputVal) return;
    setInputVal(outputVal);
    setOutputVal('');
    setDirection(prev => prev === 'encode' ? 'decode' : 'encode');
    setError(null);
    setStats(null);
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
    const content = subMode === 'hex' ? hexOutput : outputVal;
    if (!content) return;
    const ext = direction === 'encode' ? 'b64.txt' : 'txt';
    downloadJsonFile(content, `base64_result.${ext}`, 'text/plain');
    onNotify?.({ type: 'success', title: 'Downloaded', message: `Saved as base64_result.${ext}` });
  };

  // Format Decoded JSON
  const handleFormatDecodedJson = () => {
    if (!outputVal) return;
    try {
      const parsed = JSON.parse(outputVal);
      setOutputVal(JSON.stringify(parsed, null, 2));
      onNotify?.({ type: 'success', title: 'Formatted JSON', message: 'Decoded payload formatted as indented JSON.' });
    } catch {
      onNotify?.({ type: 'warning', title: 'Not JSON', message: 'Decoded text is not a valid JSON string.' });
    }
  };

  // File snippet output value based on selected tab
  const fileSnippetValue = useMemo(() => {
    if (!fileDataUri) return '';
    const parsed = parseDataUri(fileDataUri);
    const rawB64 = parsed ? parsed.base64Data : fileDataUri;

    switch (fileSnippetFormat) {
      case 'raw':
        return rawB64;
      case 'html':
        return `<img src="${fileDataUri}" alt="${uploadedFileName || 'Base64 image'}" />`;
      case 'css':
        return `background-image: url("${fileDataUri}");`;
      case 'datauri':
      default:
        return fileDataUri;
    }
  }, [fileDataUri, fileSnippetFormat, uploadedFileName]);

  const parsedFileData = useMemo(() => {
    return parseDataUri(fileDataUri);
  }, [fileDataUri]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Main Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* SubMode Pills */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setSubMode('text');
                setError(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subMode === 'text'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text &amp; JSON</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubMode('file');
                setError(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subMode === 'file'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>File &amp; Image (Data URI)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubMode('hex');
                setError(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subMode === 'hex'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Hex ⇄ Base64</span>
            </button>
          </div>

          {/* Presets dropdown in Text mode */}
          {subMode === 'text' && (
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
                <div className="absolute left-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-30 p-1.5 text-xs animate-scale-in">
                  <div className="px-2.5 py-1.5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                    Sample Data
                  </div>
                  {BASE64_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setInputVal(preset.content);
                        setOutputVal('');
                        setError(null);
                        setDirection('encode');
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
          )}
        </div>

        {/* Right Info Pill */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Binary className="w-3.5 h-3.5 text-indigo-500" />
          <span>100% In-Browser UTF-8 Safe</span>
        </div>
      </div>

      {/* SUBMODE: TEXT & JSON BASE64 */}
      {subMode === 'text' && (
        <div className="space-y-4 animate-fade-in">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Direction selector */}
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setDirection('encode');
                    setOutputVal('');
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    direction === 'encode'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Encode to Base64
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirection('decode');
                    setOutputVal('');
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    direction === 'decode'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Decode from Base64
                </button>
              </div>

              {/* Run button */}
              <button
                type="button"
                onClick={() => handleProcessText()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <Binary className="w-4 h-4" />
                <span>{direction === 'encode' ? 'Run Encode' : 'Run Decode'}</span>
              </button>

              {/* Options Toggle */}
              <button
                type="button"
                onClick={() => setShowOptions(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  showOptions
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Format Options</span>
              </button>
            </div>

            {/* Quick Format Decoded JSON button if available */}
            {direction === 'decode' && outputVal && !error && (
              <button
                type="button"
                onClick={handleFormatDecodedJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Format as JSON</span>
              </button>
            )}
          </div>

          {/* Options Drawer */}
          {showOptions && (
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-950/80 shadow-xs flex flex-wrap items-center gap-5 text-xs animate-slide-in">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={urlSafe}
                  onChange={(e) => {
                    setUrlSafe(e.target.checked);
                    if (outputVal && !error && direction === 'encode') {
                      handleProcessText('encode', e.target.checked, stripPadding, lineWrap);
                    }
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Base64URL Safe (replaces <code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">+</code> and <code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">/</code> with <code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">-</code> and <code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">_</code>)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={stripPadding}
                  onChange={(e) => {
                    setStripPadding(e.target.checked);
                    if (outputVal && !error && direction === 'encode') {
                      handleProcessText('encode', urlSafe, e.target.checked, lineWrap);
                    }
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Strip Padding (<code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">=</code>)</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Line Wrap:</span>
                <select
                  value={lineWrap}
                  onChange={(e) => {
                    setLineWrap(e.target.value);
                    if (outputVal && !error && direction === 'encode') {
                      handleProcessText('encode', urlSafe, stripPadding, e.target.value);
                    }
                  }}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="0">No line breaks (Single line)</option>
                  <option value="64">64 characters (RFC 2045)</option>
                  <option value="76">76 characters (MIME standard)</option>
                </select>
              </div>
            </div>
          )}

          {/* Metrics card if available */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 mb-0.5">Input Length</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {(direction === 'encode' ? stats.originalChars : stats.encodedChars)?.toLocaleString()} chars
                </div>
                <div className="text-[10px] text-slate-400">{formatBytes(direction === 'encode' ? stats.originalBytes : stats.encodedBytes)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 mb-0.5">Output Length</div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {(direction === 'encode' ? stats.encodedChars : stats.decodedChars)?.toLocaleString()} chars
                </div>
                <div className="text-[10px] text-slate-400">{formatBytes(direction === 'encode' ? stats.encodedBytes : stats.decodedBytes)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 mb-0.5">Size Expansion</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {direction === 'encode' ? `+${stats.overheadPercentage}%` : 'Standard 4:3'}
                </div>
                <div className="text-[10px] text-slate-400">Base64 6-bit per byte ratio</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 mb-0.5">Format Mode</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {urlSafe ? 'Base64URL' : 'Standard Base64'}
                </div>
                <div className="text-[10px] text-slate-400">{stripPadding ? 'Unpadded' : 'Padded (=)'}</div>
              </div>
            </div>
          )}

          {/* Editors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Input Panel */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {direction === 'encode' ? 'Plain Text / JSON to Encode' : 'Base64 Encoded Input'}
                </span>
                <div className="flex items-center gap-1.5">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Upload</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt,.json,.xml,.csv,.b64"
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setInputVal('');
                      setOutputVal('');
                      setError(null);
                      setStats(null);
                    }}
                    disabled={!inputVal}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-40 cursor-pointer"
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
                  placeholder={direction === 'encode' ? 'Enter text, JSON, or payload to encode into Base64...' : 'Paste Base64 encoded string here to decode...'}
                  theme={theme}
                  onExecuteShortcut={() => handleProcessText()}
                />
              </div>
            </div>

            {/* Output Panel */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {direction === 'encode' ? 'Base64 Encoded Result' : 'Decoded Plain Text Result'}
                </span>
                <div className="flex items-center gap-1.5">
                  {outputVal && !error && (
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
                    onClick={() => handleCopy(outputVal, 'Result')}
                    disabled={!outputVal || Boolean(error)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
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

              <div className="flex-1 min-h-[400px] relative flex flex-col">
                {error && (
                  <div className="p-4 bg-red-50/75 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs">Base64 Error</div>
                      <div className="text-xs mt-0.5">{error}</div>
                    </div>
                  </div>
                )}
                {outputVal ? (
                  <div className="flex-1 w-full h-full">
                    <CodeEditor
                      value={outputVal}
                      readOnly={true}
                      theme={theme}
                      minHeight="400px"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 mb-3 border border-indigo-100 dark:border-slate-700/60">
                      <Binary className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Ready to Process
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
                      Enter content on the left and click {direction === 'encode' ? 'Run Encode' : 'Run Decode'} to transform.
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
      )}

      {/* SUBMODE: FILE & IMAGE TO BASE64 (DATA URI) */}
      {subMode === 'file' && (
        <div className="space-y-4 animate-fade-in">
          {/* File Upload Drop Area */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors text-center">
            <input
              type="file"
              id="file-b64-upload"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-b64-upload"
              className="flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                Choose a file or image to convert to Base64
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-4">
                Supports PNG, JPG, GIF, WebP, SVG, PDF, Audio, and Binary files up to 25MB. Processed entirely in browser memory.
              </p>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all">
                Select File from Disk
              </span>
            </label>
          </div>

          {/* Results Card if File Loaded */}
          {fileDataUri && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start animate-fade-in">
              {/* Media Preview & Meta Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-200">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    <span>File Preview</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                    {uploadedFileType}
                  </span>
                </div>

                {/* Visual Preview */}
                <div className="w-full min-h-[180px] max-h-[260px] rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-3 overflow-hidden">
                  {parsedFileData?.isImage ? (
                    <img
                      src={fileDataUri}
                      alt={uploadedFileName}
                      className="max-h-[240px] max-w-full object-contain rounded-lg shadow-xs"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                      <FileCode className="w-10 h-10 mb-2 text-indigo-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{uploadedFileName}</span>
                      <span className="text-[11px] text-slate-400 mt-1">Non-image binary file ({uploadedFileType})</span>
                    </div>
                  )}
                </div>

                {/* File Specs Table */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">File Name:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{uploadedFileName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Original Size:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatBytes(uploadedFileSize)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Base64 String Length:</span>
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{fileDataUri.length.toLocaleString()} chars</span>
                  </div>
                </div>
              </div>

              {/* Snippet & Data URI Export Column */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                  {/* Format Selector Pills */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'datauri', label: 'Data URI' },
                      { id: 'raw', label: 'Raw Base64' },
                      { id: 'html', label: 'HTML <img>' },
                      { id: 'css', label: 'CSS background' },
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setFileSnippetFormat(fmt.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          fileSnippetFormat === fmt.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(fileSnippetValue, fileSnippetFormat)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        downloadJsonFile(fileSnippetValue, `${uploadedFileName || 'file'}.b64.txt`, 'text/plain');
                        onNotify?.({ type: 'success', title: 'Downloaded', message: 'Saved Base64 Data URI.' });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px]">
                  <CodeEditor
                    value={fileSnippetValue}
                    readOnly={true}
                    theme={theme}
                    minHeight="300px"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBMODE: HEX ⇄ BASE64 */}
      {subMode === 'hex' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setHexDirection('hex_to_b64');
                    setHexOutput('');
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    hexDirection === 'hex_to_b64'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Hex to Base64
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHexDirection('b64_to_hex');
                    setHexOutput('');
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    hexDirection === 'b64_to_hex'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Base64 to Hex
                </button>
              </div>

              <button
                type="button"
                onClick={handleProcessHex}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <Hash className="w-4 h-4" />
                <span>Convert</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Hex Input */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {hexDirection === 'hex_to_b64' ? 'Hexadecimal Input String' : 'Base64 Input String'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHexInput('');
                    setHexOutput('');
                    setError(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-h-[360px]">
                <CodeEditor
                  value={hexInput}
                  onChange={(val) => {
                    setHexInput(val);
                    if (error) setError(null);
                  }}
                  placeholder={hexDirection === 'hex_to_b64' ? 'Enter hex string (e.g. 48656c6c6f)...' : 'Enter Base64 string to convert to Hex...'}
                  theme={theme}
                  onExecuteShortcut={handleProcessHex}
                />
              </div>
            </div>

            {/* Hex Output */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {hexDirection === 'hex_to_b64' ? 'Base64 Output' : 'Hexadecimal Output'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(hexOutput, 'Converted value')}
                  disabled={!hexOutput}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex-1 min-h-[360px] relative flex flex-col">
                {error && (
                  <div className="p-4 bg-red-50/75 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs">Hex Error</div>
                      <div className="text-xs mt-0.5">{error}</div>
                    </div>
                  </div>
                )}
                <div className="flex-1 w-full h-full">
                  <CodeEditor
                    value={hexOutput}
                    readOnly={true}
                    theme={theme}
                    minHeight="360px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
