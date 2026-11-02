import React, { useState, useCallback, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Download, 
  Search, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Code2, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile } from '../utils/fileUtils';
import { 
  generateV4,
  generateBatchUuids, 
  formatUuidOutput, 
  inspectUuid, 
  UUID_NAMESPACES, 
  generateUuidCode 
} from '../utils/uuidUtils';

export default function UuidGenerator({ theme, onNotify }) {
  // Main view tab: 'generator' | 'inspector' | 'code'
  const [activeTab, setActiveTab] = useState('generator');

  // Generator Options
  const [version, setVersion] = useState('v4'); // 'v4' | 'v7' | 'v1' | 'v5' | 'nil' | 'max'
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [urn, setUrn] = useState(false);

  // V5 specific options
  const [v5Namespace, setV5Namespace] = useState(UUID_NAMESPACES.DNS);
  const [v5Name, setV5Name] = useState('example.com');

  // Output formatting: 'lines' | 'json' | 'sql' | 'csv' | 'array_js'
  const [outputFormat, setOutputFormat] = useState('lines');
  const [generatedList, setGeneratedList] = useState(() => Array.from({ length: 5 }, () => generateV4()));
  const [isGenerating, setIsGenerating] = useState(false);

  // Inspector state
  const [inspectInput, setInspectInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedCodeLang, setSelectedCodeLang] = useState('javascript');

  // Trigger UUID generation
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const results = await generateBatchUuids(count, version, {
        uppercase,
        hyphens,
        braces,
        urn,
        v5Namespace,
        v5Name
      });
      setGeneratedList(results);
      onNotify?.({
        type: 'success',
        title: 'UUIDs Generated',
        message: `Generated ${results.length} ${version.toUpperCase()} identifier${results.length > 1 ? 's' : ''}.`
      });
    } catch (err) {
      onNotify?.({ type: 'error', title: 'Generation Failed', message: err.message });
    } finally {
      setIsGenerating(false);
    }
  }, [count, version, uppercase, hyphens, braces, urn, v5Namespace, v5Name, onNotify]);

  // Formatted output text
  const formattedOutput = useMemo(() => {
    return formatUuidOutput(generatedList, outputFormat);
  }, [generatedList, outputFormat]);

  // Real-time UUID Inspection
  const inspectionResult = useMemo(() => {
    const input = inspectInput.trim() || (generatedList[0] || '');
    return inspectUuid(input);
  }, [inspectInput, generatedList]);

  // Copy helper
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
    if (!formattedOutput) return;
    const ext = outputFormat === 'json' ? 'json' : outputFormat === 'sql' ? 'sql' : 'txt';
    const mime = outputFormat === 'json' ? 'application/json' : 'text/plain';
    downloadJsonFile(formattedOutput, `uuids_${version}_${Date.now()}.${ext}`, mime);
    onNotify?.({ type: 'success', title: 'Downloaded', message: `Saved ${generatedList.length} UUIDs.` });
  };

  // Code snippets
  const codeSnippets = useMemo(() => {
    return generateUuidCode(version);
  }, [version]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Action Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Navigation Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generator</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('inspector');
                if (!inspectInput && generatedList[0]) {
                  setInspectInput(generatedList[0]);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Inspector &amp; Validator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code Snippets</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Privacy Badge */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>RFC 4122 / RFC 9562 • Cryptographically Secure (CSPRNG)</span>
        </div>
      </div>

      {/* TAB 1: GENERATOR */}
      {activeTab === 'generator' && (
        <div className="space-y-4 animate-fade-in">
          {/* Version Selection & Controls Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            {/* Version Selector Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                  UUID Version:
                </span>
                {[
                  { id: 'v4', title: 'UUID v4 (Random)', desc: 'Standard cryptographically secure random' },
                  { id: 'v7', title: 'UUID v7 (Time-Ordered)', desc: 'RFC 9562 Unix millisecond ordered' },
                  { id: 'v1', title: 'UUID v1 (Timestamp)', desc: 'Gregorian date & node' },
                  { id: 'v5', title: 'UUID v5 (SHA-1 Name)', desc: 'Name-based hash namespace' },
                  { id: 'nil', title: 'Nil (0000...)', desc: 'All zero boundary' },
                  { id: 'max', title: 'Max (ffff...)', desc: 'All one boundary' },
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVersion(v.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      version === v.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                    title={v.desc}
                  >
                    {v.title}
                  </button>
                ))}
              </div>

              {/* Generate Primary Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Generate UUIDs</span>
              </button>
            </div>

            {/* V5 Inputs if v5 selected */}
            {version === 'v5' && (
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex flex-wrap items-center gap-4 text-xs animate-slide-in">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Namespace:</span>
                  <select
                    value={v5Namespace}
                    onChange={(e) => setV5Namespace(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-mono text-xs cursor-pointer"
                  >
                    <option value={UUID_NAMESPACES.DNS}>DNS (6ba7b810-...)</option>
                    <option value={UUID_NAMESPACES.URL}>URL (6ba7b811-...)</option>
                    <option value={UUID_NAMESPACES.OID}>OID (6ba7b812-...)</option>
                    <option value={UUID_NAMESPACES.X500}>X500 (6ba7b814-...)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Name:</span>
                  <input
                    type="text"
                    value={v5Name}
                    onChange={(e) => setV5Name(e.target.value)}
                    placeholder="e.g. example.com or user-id"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* Formatting & Quantity Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              {/* Quantity Selector */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Quantity:</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {[1, 5, 10, 25, 50, 100].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        count === n
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-4 text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Uppercase</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={hyphens}
                    onChange={(e) => setHyphens(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Hyphens (8-4-4-4-12)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={braces}
                    onChange={(e) => setBraces(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Braces <code className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{'{...}'}</code></span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={urn}
                    onChange={(e) => setUrn(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>URN prefix <code className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">urn:uuid:</code></span>
                </label>
              </div>
            </div>
          </div>

          {/* Results Editor Output Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Generated UUIDs
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  {generatedList.length} Total
                </span>
              </div>

              {/* Output Format Selector & Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-400 font-medium">Format:</span>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="lines" className="bg-white dark:bg-slate-900">Plain text (1 per line)</option>
                    <option value="json" className="bg-white dark:bg-slate-900">JSON Array</option>
                    <option value="sql" className="bg-white dark:bg-slate-900">SQL INSERT statement</option>
                    <option value="csv" className="bg-white dark:bg-slate-900">CSV</option>
                    <option value="array_js" className="bg-white dark:bg-slate-900">JavaScript Array</option>
                  </select>
                </div>

                {generatedList.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedList[0], 'First UUID')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                      title="Copy first UUID only"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy 1st</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(formattedOutput, 'All UUIDs')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{copied ? 'Copied' : 'Copy All'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Save</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="min-h-[360px]">
              <CodeEditor
                value={formattedOutput}
                readOnly={true}
                theme={theme}
                minHeight="360px"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSPECTOR & VALIDATOR */}
      {activeTab === 'inspector' && (
        <div className="space-y-4 animate-fade-in">
          {/* Input Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-indigo-500" />
              <span>Enter or Paste UUID / GUID to Inspect</span>
            </span>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/50">
              <input
                type="text"
                value={inspectInput}
                onChange={(e) => setInspectInput(e.target.value)}
                placeholder="e.g. 01a18bb4-9c90-7505-9d7f-f021f2a80100, {xxxxxxxx-...}, or compact 32-hex"
                className="flex-1 bg-transparent font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setInspectInput('')}
                className="p-1 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Validation & Details Card */}
          {inspectionResult && (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {inspectionResult.isValid ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Valid UUID Identifier</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Invalid UUID Format</span>
                    </span>
                  )}
                </div>

                {inspectionResult.isValid && (
                  <button
                    type="button"
                    onClick={() => handleCopy(inspectionResult.formatted, 'Canonical UUID')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono font-semibold hover:text-indigo-600 cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy Canonical</span>
                  </button>
                )}
              </div>

              {inspectionResult.isValid ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Version */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Version</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm block">
                      {inspectionResult.version}
                    </span>
                  </div>

                  {/* Variant */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Variant</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm block">
                      {inspectionResult.variant}
                    </span>
                  </div>

                  {/* Embedded Timestamp if available (v1 / v7) */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Extracted Creation Time</span>
                    </span>
                    {inspectionResult.timestamp ? (
                      <div>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
                          {inspectionResult.timestamp.local}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate font-mono">
                          {inspectionResult.timestamp.utc}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Not embedded (Random / Hashed)</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inspectionResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CODE SNIPPETS */}
      {activeTab === 'code' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'javascript', label: 'JavaScript' },
                { id: 'python', label: 'Python' },
                { id: 'sql', label: 'SQL Dialects' },
                { id: 'go', label: 'Go' },
                { id: 'csharp', label: 'C# / .NET' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedCodeLang(lang.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCodeLang === lang.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {lang.label}
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

          <div className="min-h-[360px]">
            <CodeEditor
              value={codeSnippets[selectedCodeLang] || ''}
              readOnly={true}
              theme={theme}
              minHeight="360px"
            />
          </div>
        </div>
      )}
    </div>
  );
}
