import React, { useState, useCallback } from 'react';
import { 
  FileText, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Download, 
  Upload, 
  ClipboardPaste,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Wand2,
  AlignLeft,
  Settings2
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { formatBytes } from '../utils/jsonUtils';
import { 
  formatYaml, 
  validateYaml, 
  yamlToJson, 
  jsonToYaml, 
  SAMPLE_YAML 
} from '../utils/yamlUtils';

export default function YamlFormatter({ theme, onNotify }) {
  const [inputVal, setInputVal] = useState(SAMPLE_YAML);
  const [outputVal, setOutputVal] = useState('');
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null); // { valid: boolean, message: string }
  const [showOptions, setShowOptions] = useState(false);

  // Beautify / Format YAML
  const handleFormat = useCallback((currentIndent = indent) => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter YAML to format.' });
      return;
    }

    const res = formatYaml(inputVal, { 
      indent: parseInt(currentIndent, 10) || 2, 
      sortMapEntries: sortKeys 
    });

    if (res.success) {
      setOutputVal(res.result);
      setError(null);
      setValidationStatus({ valid: true, message: 'Valid YAML formatted successfully.' });
      onNotify?.({
        type: 'success',
        title: 'Formatted Successfully',
        message: `${res.stats.lines} lines • ${res.stats.chars.toLocaleString()} characters`
      });
    } else {
      setError(res.error);
      setOutputVal('');
      setValidationStatus({ valid: false, message: res.error.message || 'YAML syntax error detected.' });
      onNotify?.({
        type: 'error',
        title: 'Formatting Failed',
        message: res.error.message || 'Syntax error in YAML.'
      });
    }
  }, [inputVal, indent, sortKeys, onNotify]);

  // Validate YAML syntax
  const handleValidate = () => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter YAML to validate.' });
      return;
    }

    const valRes = validateYaml(inputVal);
    if (valRes.isValid) {
      setError(null);
      setValidationStatus({ valid: true, message: 'Valid YAML. Syntax check passed with 0 errors.' });
      onNotify?.({
        type: 'success',
        title: 'Valid YAML',
        message: 'No syntax or indentation errors found.'
      });
    } else {
      setError(valRes.error);
      setValidationStatus({ valid: false, message: valRes.error.message || 'Invalid syntax detected.' });
      onNotify?.({
        type: 'error',
        title: 'Validation Failed',
        message: valRes.error.message || 'Syntax error found.'
      });
    }
  };

  // Convert YAML to JSON
  const handleConvertToJson = () => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Enter YAML to convert to JSON.' });
      return;
    }

    const res = yamlToJson(inputVal);
    if (res.success) {
      setOutputVal(res.result);
      setError(null);
      setValidationStatus({ valid: true, message: 'Converted YAML to formatted JSON.' });
      onNotify?.({
        type: 'success',
        title: 'Converted to JSON',
        message: 'Generated formatted JSON successfully.'
      });
    } else {
      setError({
        title: 'Conversion Error',
        message: res.error,
        line: 1,
        column: 1,
        snippet: ''
      });
      onNotify?.({ type: 'error', title: 'Conversion Failed', message: res.error });
    }
  };

  // Convert JSON to YAML
  const handleConvertJsonToYaml = () => {
    if (!inputVal.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Enter JSON to convert to YAML.' });
      return;
    }

    const res = jsonToYaml(inputVal, { indent: parseInt(indent, 10) || 2 });
    if (res.success) {
      setOutputVal(res.result);
      setError(null);
      setValidationStatus({ valid: true, message: 'Converted JSON to YAML markup.' });
      onNotify?.({
        type: 'success',
        title: 'Converted to YAML',
        message: 'Generated clean YAML document.'
      });
    } else {
      setError({
        title: 'Conversion Error',
        message: res.error,
        line: 1,
        column: 1,
        snippet: ''
      });
      onNotify?.({ type: 'error', title: 'Conversion Failed', message: res.error });
    }
  };

  // Swap output back to input
  const handleSwap = () => {
    if (!outputVal) return;
    setInputVal(outputVal);
    setOutputVal('');
    setError(null);
    setValidationStatus(null);
    onNotify?.({ type: 'info', title: 'Swapped', message: 'Output copied to input editor.' });
  };

  const handleCopy = async () => {
    if (!outputVal) return;
    const ok = await copyToClipboard(outputVal);
    if (ok) {
      setCopied(true);
      onNotify?.({ type: 'success', title: 'Copied', message: 'Content copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!outputVal) return;
    const isJson = outputVal.trim().startsWith('{') || outputVal.trim().startsWith('[');
    const filename = isJson ? 'converted.json' : 'formatted.yaml';
    const mime = isJson ? 'application/json' : 'text/yaml';
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
      setValidationStatus(null);
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
          setValidationStatus(null);
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
          {/* Primary Action Button: Format YAML */}
          <button
            type="button"
            onClick={() => handleFormat()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <Wand2 className="w-4 h-4" />
            <span>Format YAML</span>
          </button>

          {/* Validate Button */}
          <button
            type="button"
            onClick={handleValidate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200/80 dark:border-slate-700 transition-colors shadow-xs"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
            <span>Validate Syntax</span>
          </button>

          {/* YAML to JSON conversion */}
          <button
            type="button"
            onClick={handleConvertToJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200/80 dark:border-slate-700 transition-colors shadow-xs"
            title="Convert YAML payload to JSON"
          >
            <span>YAML → JSON</span>
          </button>

          {/* JSON to YAML conversion */}
          <button
            type="button"
            onClick={handleConvertJsonToYaml}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200/80 dark:border-slate-700 transition-colors shadow-xs"
            title="Convert JSON payload to YAML"
          >
            <span>JSON → YAML</span>
          </button>

          {/* Formatting Options toggle */}
          <button
            type="button"
            onClick={() => setShowOptions(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
              showOptions
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title="Formatting settings"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Options</span>
          </button>
        </div>

        {/* Validation Status Badge */}
        {validationStatus && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
            validationStatus.valid
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            {validationStatus.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span>{validationStatus.message}</span>
          </div>
        )}
      </div>

      {/* Options Drawer */}
      {showOptions && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-950/80 shadow-xs flex flex-wrap items-center gap-5 text-xs animate-slide-in">
          {/* Indentation */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5" /> Indentation:
            </span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setIndent('2');
                  if (outputVal && !error) handleFormat('2');
                }}
                className={`px-3 py-0.5 rounded text-[11px] font-medium transition-colors ${indent === '2' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
              >
                2 Spaces
              </button>
              <button
                type="button"
                onClick={() => {
                  setIndent('4');
                  if (outputVal && !error) handleFormat('4');
                }}
                className={`px-3 py-0.5 rounded text-[11px] font-medium transition-colors ${indent === '4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
              >
                4 Spaces
              </button>
            </div>
          </div>

          {/* Sort Keys Alphabetically */}
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => {
                setSortKeys(e.target.checked);
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Sort map keys alphabetically</span>
          </label>
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
                Input YAML
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
                  setInputVal(SAMPLE_YAML);
                  setError(null);
                  setValidationStatus(null);
                  setOutputVal('');
                  onNotify?.({ type: 'info', title: 'Sample Loaded', message: 'Kubernetes YAML manifest loaded.' });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:border-indigo-200 text-xs shadow-xs"
                title="Load sample YAML"
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
                  accept=".yaml,.yml,.txt,.json"
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
                  setValidationStatus(null);
                }}
                disabled={!inputVal}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-40"
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
                if (validationStatus) setValidationStatus(null);
              }}
              placeholder={`# Paste or type YAML here\nservice:\n  name: my-app\n  port: 8080`}
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
                Processed Output
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

          <div className="flex-1 min-h-[420px] relative flex flex-col">
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
                    <p className="text-xs text-red-800 dark:text-red-200 mb-2 leading-relaxed">
                      {error.message}
                    </p>
                    {error.snippet && (
                      <pre className="p-2.5 bg-red-100 dark:bg-slate-950 rounded-lg font-mono text-[11px] text-red-900 dark:text-red-300 overflow-x-auto whitespace-pre">
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
                  minHeight="420px"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/40">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 mb-3 border border-indigo-100 dark:border-slate-700/60">
                  <FileText className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Ready to Format
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
                  Enter your YAML document and click Format YAML or Validate Syntax to inspect structure.
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
