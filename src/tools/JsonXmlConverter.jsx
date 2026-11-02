import React, { useState, useCallback } from 'react';
import { 
  FileCode, 
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
  CheckCircle2
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { formatBytes, extractJsonErrorDetails } from '../utils/jsonUtils';
import { 
  jsonToXml, 
  xmlToJson, 
  SAMPLE_JSON_FOR_XML, 
  SAMPLE_XML_FOR_JSON 
} from '../utils/xmlUtils';

export default function JsonXmlConverter({ theme, onNotify }) {
  // Mode: 'json-to-xml' | 'xml-to-json'
  const [mode, setMode] = useState('json-to-xml');
  const [inputVal, setInputVal] = useState(SAMPLE_JSON_FOR_XML);
  const [outputVal, setOutputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // XML Configuration Options
  const [rootTag, setRootTag] = useState('root');
  const [indent, setIndent] = useState('2');
  const [includeDeclaration, setIncludeDeclaration] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  const isJsonToXml = mode === 'json-to-xml';

  // Process conversion
  const handleConvert = useCallback(() => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter content to convert.' });
      return;
    }

    if (isJsonToXml) {
      // 1. JSON to XML
      try {
        const parsed = JSON.parse(inputVal);
        const xml = jsonToXml(parsed, {
          rootTag: rootTag.trim() || 'root',
          indent: indent === 'none' ? 'none' : indent,
          includeDeclaration,
          arrayItemTag: 'item'
        });
        setOutputVal(xml);
        setError(null);
        onNotify?.({ 
          type: 'success', 
          title: 'Converted to XML', 
          message: `Generated ${xml.split('\n').length} lines of clean XML.` 
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
        onNotify?.({ type: 'error', title: 'Conversion Failed', message: 'Invalid JSON syntax.' });
      }
    } else {
      // 2. XML to JSON
      const res = xmlToJson(inputVal);
      if (res.success) {
        setOutputVal(res.result);
        setError(null);
        onNotify?.({ 
          type: 'success', 
          title: 'Converted to JSON', 
          message: `Generated formatted JSON successfully.` 
        });
      } else {
        setError({
          type: 'xml',
          title: 'XML Syntax Error',
          message: res.error,
          line: null,
          column: null,
          snippet: null
        });
        setOutputVal('');
        onNotify?.({ type: 'error', title: 'Conversion Failed', message: 'Invalid XML document.' });
      }
    }
  }, [inputVal, isJsonToXml, rootTag, indent, includeDeclaration, onNotify]);

  // Mode Switcher handler
  const handleSwitchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setInputVal(newMode === 'json-to-xml' ? SAMPLE_JSON_FOR_XML : SAMPLE_XML_FOR_JSON);
    setOutputVal('');
    setError(null);
  };

  // Swap output back to input & flip direction
  const handleSwap = () => {
    if (!outputVal) return;
    const nextMode = isJsonToXml ? 'xml-to-json' : 'json-to-xml';
    setInputVal(outputVal);
    setOutputVal('');
    setMode(nextMode);
    setError(null);
    onNotify?.({ 
      type: 'info', 
      title: 'Swapped & Flipped', 
      message: `Switched direction to ${nextMode === 'json-to-xml' ? 'JSON to XML' : 'XML to JSON'}.` 
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
    const filename = isJsonToXml ? 'converted.xml' : 'converted.json';
    const mime = isJsonToXml ? 'application/xml' : 'application/json';
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
              onClick={() => handleSwitchMode('json-to-xml')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isJsonToXml
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>JSON to XML</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('xml-to-json')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isJsonToXml
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>XML to JSON</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleConvert}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <FileCode className="w-4 h-4" />
            <span>{isJsonToXml ? 'Convert to XML' : 'Convert to JSON'}</span>
          </button>

          {/* Options toggle button (when in JSON to XML mode) */}
          {isJsonToXml && (
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
              <span>XML Options</span>
            </button>
          )}
        </div>

        {/* Status Badge */}
        {outputVal && !error && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Conversion ready</span>
          </div>
        )}
      </div>

      {/* XML Conversion Options Drawer (Configurable root, indent, declaration) */}
      {isJsonToXml && showOptions && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-950/80 shadow-xs flex flex-wrap items-center gap-4 text-xs animate-slide-in">
          {/* Root Tag Name */}
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Root Tag:</label>
            <input
              type="text"
              value={rootTag}
              onChange={(e) => setRootTag(e.target.value)}
              placeholder="root"
              className="w-28 px-2.5 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Indentation Format */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Indentation:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIndent('2')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${indent === '2' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                2 Sp
              </button>
              <button
                type="button"
                onClick={() => setIndent('4')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${indent === '4' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                4 Sp
              </button>
              <button
                type="button"
                onClick={() => setIndent('none')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${indent === 'none' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                Minified
              </button>
            </div>
          </div>

          {/* Include XML Header Declaration */}
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={includeDeclaration}
              onChange={(e) => setIncludeDeclaration(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Include <code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">&lt;?xml version="1.0"?&gt;</code></span>
          </label>
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
                {isJsonToXml ? 'Input JSON' : 'Input XML'}
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
                  setInputVal(isJsonToXml ? SAMPLE_JSON_FOR_XML : SAMPLE_XML_FOR_JSON);
                  setError(null);
                  setOutputVal('');
                  onNotify?.({ type: 'info', title: 'Sample Loaded', message: 'Loaded sample data.' });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:border-indigo-200 text-xs shadow-xs"
                title="Load sample"
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
                  accept=".json,.xml,.txt"
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
              placeholder={isJsonToXml ? '{\n  "enter": "JSON to convert to XML"\n}' : '<root>\n  <enter>XML to convert to JSON</enter>\n</root>'}
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
                {isJsonToXml ? 'Converted XML' : 'Converted JSON'}
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

            {/* Output editor or empty state */}
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
                  <FileCode className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Ready to Convert
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
                  {isJsonToXml
                    ? 'Enter JSON data and click Convert to XML to generate formatted XML markup.'
                    : 'Paste valid XML document and click Convert to JSON to generate structured JSON.'}
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
