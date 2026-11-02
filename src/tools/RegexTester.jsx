import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Download, 
  Upload, 
  ClipboardPaste, 
  AlertCircle, 
  BookOpen, 
  Code, 
  Replace, 
  Layers, 
  ChevronDown, 
  CheckCircle2, 
  X,
  HelpCircle
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { 
  REGEX_FLAGS, 
  COMMON_REGEX_PRESETS, 
  REGEX_CHEAT_SHEET, 
  testRegex, 
  replaceRegex, 
  generateCodeSnippet 
} from '../utils/regexUtils';

export default function RegexTester({ theme, onNotify }) {
  const [pattern, setPattern] = useState(COMMON_REGEX_PRESETS[0].pattern);
  const [flags, setFlags] = useState(COMMON_REGEX_PRESETS[0].flags);
  const [testString, setTestString] = useState(COMMON_REGEX_PRESETS[0].testString);
  const [replacement, setReplacement] = useState('[$&]');
  
  // Active sub-tab: 'match' | 'replace' | 'code'
  const [activeTab, setActiveTab] = useState('match');
  const [selectedSnippetLang, setSelectedSnippetLang] = useState('javascript');
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Toggle regex flag
  const toggleFlag = (flagChar) => {
    setFlags(prev => {
      if (prev.includes(flagChar)) {
        return prev.replace(flagChar, '');
      } else {
        // Keep in canonical order g, i, m, s, u, y
        const flagOrder = ['g', 'i', 'm', 's', 'u', 'y'];
        const newSet = new Set([...prev, flagChar]);
        return flagOrder.filter(f => newSet.has(f)).join('');
      }
    });
  };

  // Evaluate matching results in real-time
  const matchResult = useMemo(() => {
    return testRegex(pattern, flags, testString);
  }, [pattern, flags, testString]);

  // Evaluate replacement in real-time
  const replaceResult = useMemo(() => {
    if (activeTab !== 'replace') return { result: testString, replacedCount: 0 };
    return replaceRegex(pattern, flags, testString, replacement);
  }, [pattern, flags, testString, replacement, activeTab]);

  // Code snippet
  const codeSnippet = useMemo(() => {
    return generateCodeSnippet(pattern, flags, selectedSnippetLang, replacement);
  }, [pattern, flags, selectedSnippetLang, replacement]);

  // Load preset
  const handleLoadPreset = (preset) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setTestString(preset.testString);
    setShowPresetDropdown(false);
    onNotify?.({
      type: 'info',
      title: 'Preset Loaded',
      message: `Loaded ${preset.title}`
    });
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

  const handleDownloadResult = () => {
    const content = activeTab === 'replace' ? replaceResult.result : JSON.stringify(matchResult.matches, null, 2);
    const filename = activeTab === 'replace' ? 'replaced-text.txt' : 'regex-matches.json';
    const mime = activeTab === 'replace' ? 'text/plain' : 'application/json';
    downloadJsonFile(content, filename, mime);
    onNotify?.({ type: 'success', title: 'Downloaded', message: `Saved as ${filename}` });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { content, warning, fileName } = await readUploadedJsonFile(file);
      setTestString(content);
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

  const handleInsertToken = useCallback((token) => {
    setPattern(prev => prev + token);
    onNotify?.({ type: 'info', title: 'Token Inserted', message: `Added "${token}" to pattern.` });
  }, [onNotify]);

  const testStringLength = testString.length;
  const testStringLines = testString ? testString.split('\n').length : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Pattern & Flags Interactive Header Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Main Regular Expression Input with Delimiters */}
          <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all">
            <span className="text-slate-400 font-mono text-lg font-bold select-none mr-2">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regular expression pattern..."
              className="flex-1 bg-transparent font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            <span className="text-slate-400 font-mono text-lg font-bold select-none ml-2">/</span>
            <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 ml-1 select-none">
              {flags || '—'}
            </span>
          </div>

          {/* Preset Patterns & Cheatsheet Quick Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Presets Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetDropdown(prev => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Presets</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPresetDropdown && (
                <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-30 p-1.5 text-xs animate-scale-in">
                  <div className="px-2.5 py-1.5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                    Common Patterns
                  </div>
                  {COMMON_REGEX_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleLoadPreset(preset)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 flex flex-col gap-0.5 transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>{preset.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                          {preset.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cheatsheet Toggle */}
            <button
              type="button"
              onClick={() => setShowCheatSheet(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                showCheatSheet
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Cheat Sheet</span>
            </button>
          </div>

        </div>

        {/* Flags Selector Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-xs font-medium mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Flags:</span>
            </span>
            {REGEX_FLAGS.map((f) => {
              const active = flags.includes(f.flag);
              return (
                <button
                  key={f.flag}
                  type="button"
                  onClick={() => toggleFlag(f.flag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  title={`${f.name} (${f.flag}): ${f.description}`}
                >
                  <span>{f.flag}</span>
                  <span className="text-[10px] font-sans opacity-80 hidden md:inline">({f.name})</span>
                </button>
              );
            })}
          </div>

          {/* Real-time Match Counter Badge */}
          {matchResult.isValid ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{matchResult.matchCount} {matchResult.matchCount === 1 ? 'match' : 'matches'} found</span>
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                ({matchResult.executionTimeMs} ms)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold">Invalid Regular Expression</span>
            </div>
          )}
        </div>

        {/* Syntax Error Notice if regex is invalid */}
        {!matchResult.isValid && matchResult.error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-800 dark:text-red-200 flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Regex Syntax Error: </span>
              <span>{matchResult.error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Cheat Sheet Expandable Drawer */}
      {showCheatSheet && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-950/80 shadow-sm space-y-4 text-xs animate-slide-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Regex Quick Reference (Click to insert token into pattern)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCheatSheet(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REGEX_CHEAT_SHEET.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                  {group.category}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.token}
                      type="button"
                      onClick={() => handleInsertToken(item.token)}
                      className="w-full text-left p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center justify-between gap-2 group transition-colors cursor-pointer"
                      title={`Click to insert ${item.token}`}
                    >
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 font-mono text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                        {item.token}
                      </code>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate text-right">
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('match')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'match'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Match &amp; Extract ({matchResult.matchCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('replace')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'replace'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Replace className="w-3.5 h-3.5" />
            <span>Replace / Substitute</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Generate Code</span>
          </button>
        </div>

        {/* Global Action: Download Results */}
        {activeTab !== 'code' && (
          <button
            type="button"
            onClick={handleDownloadResult}
            disabled={!testString || !matchResult.isValid}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Export</span>
          </button>
        )}
      </div>

      {/* Main Workspace based on Active Tab */}
      {activeTab === 'match' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Left Panel: Test String Editor */}
          <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Test String
                </span>
                {testStringLength > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <span>•</span>
                    <span>{testStringLength.toLocaleString()} chars</span>
                    <span>•</span>
                    <span>{testStringLines} lines</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Upload</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.log,.json,.csv,.sql,.js,.html"
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (navigator.clipboard?.readText) {
                        const t = await navigator.clipboard.readText();
                        if (t) setTestString(t);
                      }
                    } catch {
                      // fallback
                    }
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs shadow-xs cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-slate-400" />
                  <span>Paste</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestString('')}
                  disabled={!testString}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-40 cursor-pointer"
                  title="Clear test text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[440px]">
              <CodeEditor
                value={testString}
                onChange={setTestString}
                placeholder="Insert or paste text here to test your regular expression against..."
                theme={theme}
                minHeight="440px"
              />
            </div>
          </div>

          {/* Right Panel: Match Results Breakdown */}
          <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Matches &amp; Capture Groups
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  {matchResult.matchCount} Total
                </span>
              </div>

              {matchResult.matchCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(matchResult.matches, null, 2), 'Matches')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Copied' : 'Copy All'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[440px] max-h-[560px] overflow-y-auto p-4 space-y-3">
              {matchResult.matches.length > 0 ? (
                matchResult.matches.map((m) => (
                  <div
                    key={m.matchNumber}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    {/* Match Header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold text-[10px]">
                          Match #{m.matchNumber}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          Pos [{m.index} : {m.endIndex}] • {m.fullMatch.length} chars
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(m.fullMatch, `Match #${m.matchNumber}`)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded cursor-pointer"
                        title="Copy match"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Matched String Preview */}
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 font-mono text-xs text-slate-900 dark:text-slate-100 break-all select-all">
                      {m.fullMatch}
                    </div>

                    {/* Groups Breakdown if any */}
                    {m.groups.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Capture Groups ({m.groups.length})
                        </div>
                        <div className="space-y-1">
                          {m.groups.map((grp) => (
                            <div
                              key={grp.index}
                              className="flex items-center gap-2 text-xs p-1.5 rounded bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 font-mono"
                            >
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold shrink-0">
                                {grp.name ? `$<${grp.name}>` : `Group ${grp.index}`}
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 truncate flex-1 select-all">
                                {grp.value || <em className="text-slate-400 not-italic">empty</em>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <Search className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-1">
                    No Matches Found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    Check your pattern, flags, or test string. You can pick a pre-built template from the Presets menu above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Replace / Substitute Tab */}
      {activeTab === 'replace' && (
        <div className="space-y-4 animate-fade-in">
          {/* Replacement Controls Bar */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <Replace className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-semibold text-slate-500">Replacement:</span>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="Substitution string (e.g. [$1], $&, or custom text)..."
                className="flex-1 bg-transparent font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold">
                {replaceResult.replacedCount} replacements
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400" title="Tokens: $& = full match, $1 = group 1, $<name> = named group">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Tokens: $& (match), $1 (group)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Input Test String */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                Original Input Text
              </div>
              <div className="flex-1 min-h-[400px]">
                <CodeEditor
                  value={testString}
                  onChange={setTestString}
                  placeholder="Original text..."
                  theme={theme}
                  minHeight="400px"
                />
              </div>
            </div>

            {/* Output Substituted Text */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Substituted Result
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(replaceResult.result, 'Replaced text')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex-1 min-h-[400px]">
                <CodeEditor
                  value={replaceResult.result}
                  readOnly={true}
                  theme={theme}
                  minHeight="400px"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Code Snippet Tab */}
      {activeTab === 'code' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              {['javascript', 'python', 'php', 'go'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedSnippetLang(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedSnippetLang === lang
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
              onClick={() => handleCopy(codeSnippet, `${selectedSnippetLang} snippet`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="min-h-[380px]">
            <CodeEditor
              value={codeSnippet}
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
