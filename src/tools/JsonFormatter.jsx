import React, { useState, useCallback } from 'react';
import { 
  Wand2, 
  CheckCircle2, 
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import EditorToolbar from '../components/EditorToolbar';
import OutputPanel from '../components/OutputPanel';
import { formatJson, validateJson, SAMPLE_JSON } from '../utils/jsonUtils';

export default function JsonFormatter({ theme, onNotify }) {
  const [inputJson, setInputJson] = useState(SAMPLE_JSON);
  const [outputJson, setOutputJson] = useState('');
  const [indent, setIndent] = useState('2');
  const [error, setError] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null); // { valid: boolean, message: string }
  const [stats, setStats] = useState(null);

  // Beautify / Format JSON
  const handleFormat = useCallback((currentIndent = indent) => {
    if (!inputJson.trim()) {
      onNotify?.({ type: 'warning', title: 'Empty Input', message: 'Please enter JSON to format.' });
      return;
    }

    const result = formatJson(inputJson, currentIndent);
    if (result.success) {
      setOutputJson(result.result);
      setError(null);
      setStats(result.stats);
      setValidationStatus({ valid: true, message: 'Valid JSON formatted successfully.' });
      onNotify?.({
        type: 'success',
        title: 'Formatted Successfully',
        message: `${result.stats.lines} lines • ${result.stats.chars.toLocaleString()} characters`,
      });
    } else {
      setError(result.error);
      setOutputJson('');
      setStats(null);
      setValidationStatus({ valid: false, message: result.error.cleanMessage || 'Invalid JSON syntax.' });
      onNotify?.({
        type: 'error',
        title: 'Formatting Failed',
        message: result.error.cleanMessage || 'Syntax error in JSON.',
      });
    }
  }, [inputJson, indent, onNotify]);

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

  // Change indentation
  const handleIndentChange = (newIndent) => {
    setIndent(newIndent);
    if (outputJson && !error) {
      handleFormat(newIndent);
    }
  };

  // Load sample JSON
  const handleLoadSample = () => {
    setInputJson(SAMPLE_JSON);
    setError(null);
    setValidationStatus(null);
    onNotify?.({ type: 'info', title: 'Sample Loaded', message: 'Realistic JSON data loaded into editor.' });
  };

  // Clear input
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
    onNotify?.({ type: 'info', title: 'Swapped', message: 'Output copied to input for further editing.' });
  };

  return (
    <div className="space-y-4">
      {/* Action Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Action Button: Beautify / Format */}
          <button
            type="button"
            onClick={() => handleFormat()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>Beautify / Format JSON</span>
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

      {/* Editor Panels (Desktop Side-by-Side, Mobile Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Left Column: Input Editor */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <EditorToolbar
            title="Input JSON"
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
            indent={indent}
            onChangeIndent={handleIndentChange}
            showIndentSelector={true}
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
              placeholder={`{\n  "paste": "your JSON here",\n  "nested": {\n    "array": [1, 2, 3]\n  }\n}`}
              theme={theme}
              onExecuteShortcut={() => handleFormat()}
            />
          </div>
        </div>

        {/* Right Column: Output Panel */}
        <OutputPanel
          title="Formatted JSON"
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
          downloadFilename="formatted.json"
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
