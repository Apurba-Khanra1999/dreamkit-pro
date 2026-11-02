import React, { useState, useCallback } from 'react';
import { 
  Minimize2, 
  CheckCircle2, 
  TrendingDown,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import EditorToolbar from '../components/EditorToolbar';
import OutputPanel from '../components/OutputPanel';
import { minifyJson, validateJson, SAMPLE_JSON, formatBytes } from '../utils/jsonUtils';

export default function JsonMinifier({ theme, onNotify }) {
  const [inputJson, setInputJson] = useState(SAMPLE_JSON);
  const [outputJson, setOutputJson] = useState('');
  const [error, setError] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);
  const [stats, setStats] = useState(null);

  // Minify JSON
  const handleMinify = useCallback(() => {
    if (!inputJson.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter JSON to minify.' });
      return;
    }

    const result = minifyJson(inputJson);
    if (result.success) {
      setOutputJson(result.result);
      setError(null);
      setStats(result.stats);
      setValidationStatus({ valid: true, message: 'Valid JSON minified successfully.' });
      onNotify?.({
        type: 'success',
        title: 'Minified Successfully',
        message: `${result.stats.reductionPercentage}% reduction (${result.stats.savedChars.toLocaleString()} characters saved)`,
      });
    } else {
      setError(result.error);
      setOutputJson('');
      setStats(null);
      setValidationStatus({ valid: false, message: result.error.cleanMessage || 'Invalid JSON syntax.' });
      onNotify?.({
        type: 'error',
        title: 'Minification Failed',
        message: result.error.cleanMessage || 'Syntax error in JSON.',
      });
    }
  }, [inputJson, onNotify]);

  // Validate JSON
  const handleValidate = () => {
    if (!inputJson.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter JSON to validate.' });
      return;
    }

    const validation = validateJson(inputJson);
    if (validation.isValid) {
      setError(null);
      setValidationStatus({ valid: true, message: 'Valid JSON. Syntax is clean and correct.' });
      onNotify?.({
        type: 'success',
        title: 'Valid JSON',
        message: 'Syntax check passed without errors.',
      });
    } else {
      setError(validation.error);
      setValidationStatus({ valid: false, message: validation.error.cleanMessage || 'Syntax error found.' });
      onNotify?.({
        type: 'error',
        title: 'Validation Failed',
        message: validation.error.cleanMessage || 'Invalid syntax detected.',
      });
    }
  };

  // Load sample JSON
  const handleLoadSample = () => {
    setInputJson(SAMPLE_JSON);
    setError(null);
    setValidationStatus(null);
    onNotify?.({ type: 'info', title: 'Sample Loaded', message: 'Indented sample JSON loaded for minification test.' });
  };

  // Clear input & output
  const handleClear = () => {
    setInputJson('');
    setOutputJson('');
    setError(null);
    setValidationStatus(null);
    setStats(null);
  };

  // Swap input and output
  const handleSwap = () => {
    if (!outputJson) return;
    setInputJson(outputJson);
    setOutputJson('');
    setError(null);
    setValidationStatus(null);
    setStats(null);
    onNotify?.({ type: 'info', title: 'Swapped', message: 'Output copied to input editor.' });
  };

  return (
    <div className="space-y-4">
      {/* Action Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Action Button: Minify JSON */}
          <button
            type="button"
            onClick={handleMinify}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Minify JSON</span>
          </button>

          {/* Validate Button */}
          <button
            type="button"
            onClick={handleValidate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm border border-slate-200/80 dark:border-slate-700 transition-colors shadow-xs"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
            <span>Validate JSON</span>
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
              <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span>{validationStatus.message}</span>
          </div>
        )}
      </div>

      {/* Minification Statistics Dashboard Card (Displayed when minified successfully) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-indigo-50/70 dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-slate-900/90 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm animate-fade-in">
          {/* Card 1: Reduction Percentage */}
          <div className="flex flex-col p-3 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-indigo-100/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
              <span>Reduction</span>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.reductionPercentage > 0 ? `-${stats.reductionPercentage}%` : '0%'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats.reductionPercentage > 0 ? 'Space efficiency' : 'Already compact'}
            </div>
          </div>

          {/* Card 2: Original Size */}
          <div className="flex flex-col p-3 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
              Original Size
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">
              {stats.originalChars.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              characters ({formatBytes(stats.originalBytes)})
            </div>
          </div>

          {/* Card 3: Minified Size */}
          <div className="flex flex-col p-3 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
              Minified Size
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.minifiedChars.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              characters ({formatBytes(stats.minifiedBytes)})
            </div>
          </div>

          {/* Card 4: Characters Saved */}
          <div className="flex flex-col p-3 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
              Saved Space
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">
              {stats.savedChars.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              chars saved ({formatBytes(stats.savedBytes)})
            </div>
          </div>
        </div>
      )}

      {/* Editor Panels (Desktop Side-by-Side, Mobile Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Left Column: Input Editor */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <EditorToolbar
            title="Input JSON to Minify"
            value={inputJson}
            onClear={handleClear}
            onLoadSample={handleLoadSample}
            onUploadContent={(content) => {
              setInputJson(content);
              setError(null);
              setValidationStatus(null);
            }}
            onPaste={(text) => {
              setInputJson(text);
              setError(null);
              setValidationStatus(null);
            }}
            showIndentSelector={false}
            onNotify={onNotify}
          />
          <div className="flex-1 min-h-[380px]">
            <CodeEditor
              value={inputJson}
              onChange={(val) => {
                setInputJson(val);
                if (error) setError(null);
                if (validationStatus) setValidationStatus(null);
              }}
              placeholder={`{\n  "paste": "unminified JSON here",\n  "will_be_compressed": true\n}`}
              theme={theme}
              onExecuteShortcut={handleMinify}
            />
          </div>
        </div>

        {/* Right Column: Output Panel */}
        <OutputPanel
          title="Minified JSON (Single-line)"
          outputValue={outputJson}
          error={error}
          stats={stats}
          onSwap={handleSwap}
          onClearOutput={() => {
            setOutputJson('');
            setError(null);
            setStats(null);
          }}
          onNotify={onNotify}
          downloadFilename="minified.json"
        >
          <CodeEditor
            value={outputJson}
            readOnly={true}
            theme={theme}
            minHeight="380px"
          />
        </OutputPanel>

      </div>
    </div>
  );
}
