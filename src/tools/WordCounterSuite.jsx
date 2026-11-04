import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Type,
  AlignLeft,
  Clock,
  BookOpen,
  Hash,
  BarChart3,
  SlidersHorizontal,
  Sparkles,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  Search,
  Share2,
  Target,
  RotateCcw,
  Volume2,
  PenTool,
  ShieldCheck
} from 'lucide-react';
import {
  analyzeText,
  getKeywordDensity,
  getPhraseDensity,
  checkSocialLimits,
  toUpper,
  toLower,
  toTitleCase,
  toSentenceCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase,
  toAlternatingCase,
  removeExtraSpaces,
  removeEmptyLines,
  removePunctuation,
  stripHtmlTags,
  reverseCharacters,
  reverseWords,
  sortLinesAsc,
  sortLinesDesc,
  SAMPLE_TEXTS
} from '../utils/textCounterUtils';

export default function WordCounterSuite({ _theme = 'dark', onNotify }) {
  // Main Text Content State
  const [text, setText] = useState(() => SAMPLE_TEXTS[0].text);
  const [activeSampleId, setActiveSampleId] = useState(SAMPLE_TEXTS[0].id);

  // Active Inspector Tab: 'overview' | 'readability' | 'keywords' | 'social' | 'transforms' | 'report'
  const [activeTab, setActiveTab] = useState('overview');

  // Reading & Speaking Speed Settings (WPM)
  const [readingWpm, setReadingWpm] = useState(225);
  const [speakingWpm, setSpeakingWpm] = useState(135);

  // Word Target Goal Feature
  const [enableGoal, setEnableGoal] = useState(false);
  const [targetGoalWords, setTargetGoalWords] = useState(500);

  // Editor Appearance & Search
  const [editorFont, setEditorFont] = useState('sans'); // 'sans' | 'mono'
  const [editorFontSize, setEditorFontSize] = useState('base'); // 'sm' | 'base' | 'lg'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStopWords, setFilterStopWords] = useState(true);

  // Selection Stats (live stats when user highlights text)
  const [selectionStats, setSelectionStats] = useState(null);

  // Copy status indicators
  const [copiedText, setCopiedText] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Reference to textarea
  const textareaRef = useRef(null);

  // Run comprehensive analysis
  const stats = useMemo(() => {
    return analyzeText(text, { readingWpm, speakingWpm, wordsPerPage: 250 });
  }, [text, readingWpm, speakingWpm]);

  // Keyword density and N-Grams
  const keywordDensity = useMemo(() => {
    return getKeywordDensity(text, { filterStopWords, minLength: 2, maxResults: 15 });
  }, [text, filterStopWords]);

  const phraseDensity = useMemo(() => {
    return getPhraseDensity(text, 2, 8, filterStopWords);
  }, [text, filterStopWords]);

  // Social limits
  const socialLimits = useMemo(() => {
    return checkSocialLimits(text);
  }, [text]);

  // Search matches count in real-time
  const searchMatchesCount = useMemo(() => {
    if (!searchKeyword.trim() || !text) return 0;
    try {
      const escaped = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = text.match(new RegExp(escaped, 'gi'));
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [text, searchKeyword]);

  // Handle Text Selection in Textarea
  const handleSelectText = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start !== end) {
      const selectedStr = text.substring(start, end);
      const selAnalysis = analyzeText(selectedStr);
      setSelectionStats({
        words: selAnalysis.words,
        chars: selAnalysis.characters,
        charsNoSpaces: selAnalysis.charactersNoSpaces
      });
    } else {
      setSelectionStats(null);
    }
  }, [text]);

  // Load Sample Text
  const handleLoadSample = (sample) => {
    setText(sample.text);
    setActiveSampleId(sample.id);
    setSelectionStats(null);
    if (onNotify) onNotify(`Loaded "${sample.title}"`, 'info');
  };

  // Clear Text
  const handleClear = () => {
    setText('');
    setActiveSampleId('');
    setSelectionStats(null);
    if (onNotify) onNotify('Cleared text content', 'info');
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        setActiveSampleId('');
        if (onNotify) onNotify('Pasted from clipboard!', 'success');
      }
    } catch {
      if (onNotify) onNotify('Clipboard read permission was denied', 'warning');
    }
  };

  // Copy Text
  const handleCopyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      if (onNotify) onNotify('Copied text to clipboard!', 'success');
    } catch {
      if (onNotify) onNotify('Failed to copy to clipboard', 'warning');
    }
  };

  // Download Text as .txt
  const handleDownloadTxt = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text_content_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onNotify) onNotify('Downloaded text file', 'success');
  };

  // Copy Comprehensive Report
  const handleCopyReport = async () => {
    const report = `# Content & Text Analysis Report
Generated: ${new Date().toLocaleString()}

## Key Metrics
- Words: ${stats.words}
- Characters (with spaces): ${stats.characters}
- Characters (without spaces): ${stats.charactersNoSpaces}
- Sentences: ${stats.sentences}
- Paragraphs: ${stats.paragraphs}
- Total Lines: ${stats.lines} (Non-empty: ${stats.nonEmptyLines})
- Estimated Pages: ${stats.pages} (at 250 words/page)

## Reading & Speaking Timings
- Estimated Reading Time: ${stats.readingTimeString} (at ${readingWpm} WPM)
- Estimated Speaking Time: ${stats.speakingTimeString} (at ${speakingWpm} WPM)
- Estimated Handwriting Time: ${stats.handwritingTimeString}

## Readability & Lexical Complexity
- Flesch Reading Ease: ${stats.readability.fleschEase} / 100 (${stats.readability.easeLabel})
- Flesch-Kincaid Grade Level: ${stats.readability.fleschGrade} (${stats.readability.gradeLabel})
- Automated Readability Index (ARI): ${stats.readability.ari}
- Gunning Fog Index: ${stats.readability.gunningFog}
- Coleman-Liau Index: ${stats.readability.colemanLiau}
- Total Syllables: ${stats.syllables}
- Average Word Length: ${stats.averageWordLength} characters
- Average Sentence Length: ${stats.averageSentenceLength} words
- Lexical Diversity: ${stats.lexicalDiversity}% (${stats.uniqueWords} unique words)
- Longest Word: "${stats.longestWord}" (${stats.longestWord.length} chars)

## Character Composition
- Alphabetic Letters: ${stats.letters}
- Numerical Digits: ${stats.digits}
- Punctuation Marks: ${stats.punctuation}
- Whitespace Characters: ${stats.spaces}
- Special Symbols: ${stats.specialChars}

---
Analyzed locally and securely in DreamKit Developer Studio.
`;

    try {
      await navigator.clipboard.writeText(report);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
      if (onNotify) onNotify('Analysis report copied to clipboard!', 'success');
    } catch {
      if (onNotify) onNotify('Failed to copy report', 'warning');
    }
  };

  // Download JSON Report
  const handleDownloadJsonReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      metrics: stats,
      topKeywords: keywordDensity,
      topPhrases: phraseDensity,
      socialLimits
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text_metrics_report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onNotify) onNotify('Downloaded JSON metrics report', 'success');
  };

  // File Upload Handler
  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setText(content);
        setActiveSampleId('');
        if (onNotify) onNotify(`Imported "${file.name}" successfully!`, 'success');
      }
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Apply Text Transformation
  const applyTransform = (transformFn, label) => {
    if (!text) return;
    const newText = transformFn(text);
    setText(newText);
    if (onNotify) onNotify(`Applied: ${label}`, 'success');
  };

  // Calculate Goal Progress
  const goalProgress = useMemo(() => {
    if (!enableGoal || targetGoalWords <= 0) return 0;
    return Math.min(100, Math.round((stats.words / targetGoalWords) * 100));
  }, [enableGoal, targetGoalWords, stats.words]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action & Status Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Left: Status & Capability Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Live Metrics
          </span>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>100% In-Browser • Real-time Content Intelligence</span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
            <input
              type="file"
              accept=".txt,.md,.rtf,.html,.json,.csv"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handlePaste}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Paste text from clipboard"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Clear all text"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            title="Copy text to clipboard"
          >
            {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SAMPLE TEXT QUICK LOADER BAR
         ========================================================================= */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Samples:</span>
        </span>
        <div className="flex items-center gap-2">
          {SAMPLE_TEXTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleLoadSample(sample)}
              className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeSampleId === sample.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {sample.title.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          HERO PRIMARY COUNTERS (TOP 6 CARDS)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Words Card */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Words
            </span>
            <Type className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 tracking-tight">
            {stats.words.toLocaleString()}
          </p>
          {enableGoal && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[10px] font-medium text-slate-400">
                <span>Goal: {targetGoalWords}</span>
                <span>{goalProgress}%</span>
              </div>
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    goalProgress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Characters (With Spaces) */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Characters
            </span>
            <Hash className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 tracking-tight">
            {stats.characters.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {stats.charactersNoSpaces.toLocaleString()} without spaces
          </span>
        </div>

        {/* Sentences */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Sentences
            </span>
            <AlignLeft className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 tracking-tight">
            {stats.sentences.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Avg {stats.averageSentenceLength} words / sent
          </span>
        </div>

        {/* Paragraphs */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Paragraphs
            </span>
            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 tracking-tight">
            {stats.paragraphs.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {stats.lines} total lines
          </span>
        </div>

        {/* Reading Time */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Reading Time
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1 tracking-tight">
            {stats.readingTimeString}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            at {readingWpm} words/min
          </span>
        </div>

        {/* Readability Score */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Readability
            </span>
            <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {stats.readability.fleschEase}
            </p>
            <span className="text-xs text-slate-400 font-mono">/100</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block truncate">
            {stats.readability.easeLabel}
          </span>
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE (EDITOR ON LEFT, ANALYTICS TABS ON RIGHT)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =======================================================================
            LEFT COLUMN: INTERACTIVE EDITOR & QUICK TRANSFORMS (7 COLS)
           ======================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`rounded-2xl bg-white dark:bg-[#111622] border transition-all shadow-xs ${
              isDragging
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200/80 dark:border-slate-800'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-slate-200/80 dark:border-slate-800 text-xs">
              {/* Appearance Controls */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditorFont('sans')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      editorFont === 'sans'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Sans
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorFont('mono')}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      editorFont === 'mono'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Mono
                  </button>
                </div>

                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditorFontSize('sm')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      editorFontSize === 'sm'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorFontSize('base')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      editorFontSize === 'base'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorFontSize('lg')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      editorFontSize === 'lg'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Keyword Search In Text */}
              <div className="flex items-center gap-1.5 relative">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Find in text..."
                    className="w-36 sm:w-44 pl-8 pr-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {searchKeyword && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                    {searchMatchesCount} {searchMatchesCount === 1 ? 'match' : 'matches'}
                  </span>
                )}
              </div>
            </div>

            {/* Main Interactive Textarea */}
            <div className="relative p-3">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onSelect={handleSelectText}
                onKeyUp={handleSelectText}
                onMouseUp={handleSelectText}
                placeholder="Type or paste your text here to begin instant word and readability counting..."
                rows={18}
                className={`w-full p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                  editorFont === 'mono' ? 'font-mono' : 'font-sans'
                } ${
                  editorFontSize === 'sm'
                    ? 'text-xs leading-relaxed'
                    : editorFontSize === 'lg'
                    ? 'text-base leading-loose'
                    : 'text-sm leading-relaxed'
                }`}
              />

              {/* Selection Stats Floating Overlay */}
              {selectionStats && (
                <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white dark:bg-white/95 dark:text-slate-900 text-[11px] font-mono shadow-lg backdrop-blur-xs flex items-center gap-2 border border-slate-700/50 animate-in fade-in">
                  <span className="font-semibold text-emerald-400 dark:text-emerald-600">
                    Selection:
                  </span>
                  <span>{selectionStats.words} words</span>
                  <span className="text-slate-500 dark:text-slate-400">•</span>
                  <span>{selectionStats.chars} chars</span>
                </div>
              )}
            </div>

            {/* Editor Footer Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span>{stats.lines} lines</span>
                <span>•</span>
                <span>{stats.pages} est. pages</span>
                <span>•</span>
                <span>{stats.syllables} syllables</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnableGoal(!enableGoal)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    enableGoal
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Target className="w-3 h-3" />
                  <span>{enableGoal ? 'Target Active' : 'Set Word Goal'}</span>
                </button>

                {enableGoal && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={10}
                      max={100000}
                      step={50}
                      value={targetGoalWords}
                      onChange={(e) => setTargetGoalWords(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-16 px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px]">words</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Transformations & Clean-Up Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                <span>1-Click Transformations & Text Cleaners</span>
              </span>
              <span className="text-[11px] text-slate-400">Instant modification</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyTransform(toUpper, 'UPPERCASE')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                UPPERCASE
              </button>
              <button
                type="button"
                onClick={() => applyTransform(toLower, 'lowercase')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                lowercase
              </button>
              <button
                type="button"
                onClick={() => applyTransform(toTitleCase, 'Title Case')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                Title Case
              </button>
              <button
                type="button"
                onClick={() => applyTransform(toSentenceCase, 'Sentence case')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                Sentence case
              </button>
              <button
                type="button"
                onClick={() => applyTransform(toCamelCase, 'camelCase')}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                camelCase
              </button>
              <button
                type="button"
                onClick={() => applyTransform(toPascalCase, 'PascalCase')}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                PascalCase
              </button>
              <button
                type="button"
                onClick={() => applyTransform(toSnakeCase, 'snake_case')}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                snake_case
              </button>
              <button
                type="button"
                onClick={() => applyTransform(toKebabCase, 'kebab-case')}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                kebab-case
              </button>
              <button
                type="button"
                onClick={() => applyTransform(toConstantCase, 'CONSTANT_CASE')}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                CONSTANT_CASE
              </button>
              <button
                type="button"
                onClick={() => applyTransform(toAlternatingCase, 'aLtErNaTiNg')}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                aLtErNaTiNg
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyTransform(removeExtraSpaces, 'Trim Extra Spaces')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Trim Spaces
              </button>
              <button
                type="button"
                onClick={() => applyTransform(removeEmptyLines, 'Remove Empty Lines')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Strip Empty Lines
              </button>
              <button
                type="button"
                onClick={() => applyTransform(stripHtmlTags, 'Strip HTML Tags')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Strip HTML
              </button>
              <button
                type="button"
                onClick={() => applyTransform(removePunctuation, 'Remove Punctuation')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Remove Punctuation
              </button>
              <button
                type="button"
                onClick={() => applyTransform(sortLinesAsc, 'Sort Lines A-Z')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Sort A-Z
              </button>
              <button
                type="button"
                onClick={() => applyTransform(sortLinesDesc, 'Sort Lines Z-A')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Sort Z-A
              </button>
              <button
                type="button"
                onClick={() => applyTransform(reverseWords, 'Reverse Words')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Reverse Words
              </button>
              <button
                type="button"
                onClick={() => applyTransform(reverseCharacters, 'Reverse Characters')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Reverse Chars
              </button>
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN: TABBED INTELLIGENCE & METRICS INSPECTOR (5 COLS)
           ======================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-1.5 gap-1 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('readability')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'readability'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Readability
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('keywords')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'keywords'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Keywords & Phrases
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'social'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Social Limits
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'report'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Export Report
              </button>
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="p-4">
              {/* ===============================================================
                  TAB 1: OVERVIEW & TEXT COMPOSITION
                 =============================================================== */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Detailed Timing Cards */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Duration & Speed Estimations</span>
                    </h3>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block font-medium">Silent Reading</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                          {stats.readingTimeString}
                        </span>
                        <span className="text-[9px] text-slate-400">{readingWpm} WPM</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block font-medium flex items-center justify-center gap-1">
                          <Volume2 className="w-2.5 h-2.5" />
                          <span>Speaking Pace</span>
                        </span>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
                          {stats.speakingTimeString}
                        </span>
                        <span className="text-[9px] text-slate-400">{speakingWpm} WPM</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block font-medium flex items-center justify-center gap-1">
                          <PenTool className="w-2.5 h-2.5" />
                          <span>Handwriting</span>
                        </span>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
                          {stats.handwritingTimeString}
                        </span>
                        <span className="text-[9px] text-slate-400">22 WPM</span>
                      </div>
                    </div>

                    {/* Speed Customization Sliders */}
                    <div className="mt-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          <span>Reading Speed</span>
                          <span className="font-mono text-emerald-500 font-bold">{readingWpm} WPM</span>
                        </div>
                        <input
                          type="range"
                          min={100}
                          max={450}
                          step={10}
                          value={readingWpm}
                          onChange={(e) => setReadingWpm(parseInt(e.target.value))}
                          className="w-full accent-emerald-500 mt-1 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          <span>Speaking Speed</span>
                          <span className="font-mono text-amber-500 font-bold">{speakingWpm} WPM</span>
                        </div>
                        <input
                          type="range"
                          min={80}
                          max={220}
                          step={5}
                          value={speakingWpm}
                          onChange={(e) => setSpeakingWpm(parseInt(e.target.value))}
                          className="w-full accent-amber-500 mt-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Character Composition Breakdown */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                      Character Composition
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Letters (a-z)</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.letters.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Digits (0-9)</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.digits.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Punctuation</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.punctuation.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Spaces</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.spaces.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lexical Diversity & Averages */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                      Lexical Richness & Averages
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Unique Words</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                          {stats.uniqueWords}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold">{stats.lexicalDiversity}%</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Avg Word Length</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                          {stats.averageWordLength}
                        </span>
                        <span className="text-[10px] text-slate-400">characters</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Avg Sentence</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                          {stats.averageSentenceLength}
                        </span>
                        <span className="text-[10px] text-slate-400">words</span>
                      </div>
                    </div>

                    {stats.longestWord && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Longest Word:</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          &quot;{stats.longestWord}&quot; ({stats.longestWord.length} chars)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===============================================================
                  TAB 2: READABILITY & GRADE LEVEL
                 =============================================================== */}
              {activeTab === 'readability' && (
                <div className="space-y-4">
                  {/* Hero Flesch Reading Ease Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Flesch Reading Ease
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {stats.readability.easeLabel}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                        {stats.readability.fleschEase}
                      </span>
                      <span className="text-sm text-slate-400 font-mono">/ 100</span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{ width: `${Math.min(100, stats.readability.fleschEase)}%` }}
                      />
                    </div>
                  </div>

                  {/* Multi-Index Readability Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block font-medium">Flesch-Kincaid Grade</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {stats.readability.fleschGrade}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {stats.readability.gradeLabel}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block font-medium">Automated Readability (ARI)</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {stats.readability.ari}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Grade level equivalent
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block font-medium">Gunning Fog Index</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {stats.readability.gunningFog}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Years of formal education
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block font-medium">Coleman-Liau Index</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {stats.readability.colemanLiau}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Character length formula
                      </span>
                    </div>
                  </div>

                  {/* Readability Reference Scale */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Target Audience Benchmark:
                    </span>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>90-100: Very Easy</span>
                      <span className="font-medium text-emerald-600">5th Grade Reader</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>70-89: Easy to Fairly Easy</span>
                      <span className="font-medium text-teal-600">6th-7th Grade (General Public)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>60-69: Standard</span>
                      <span className="font-medium text-indigo-600">8th-9th Grade (Optimal Web Copy)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>30-59: Difficult</span>
                      <span className="font-medium text-amber-600">High School & College</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>0-29: Academic / Complex</span>
                      <span className="font-medium text-rose-600">Specialized Technical Paper</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  TAB 3: KEYWORDS & N-GRAM PHRASES
                 =============================================================== */}
              {activeTab === 'keywords' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Top Keywords
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterStopWords}
                        onChange={(e) => setFilterStopWords(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span>Exclude Stop Words</span>
                    </label>
                  </div>

                  {keywordDensity.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No keyword occurrences found. Start typing above to inspect density.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {keywordDensity.map((item, idx) => (
                        <div
                          key={item.word}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-mono w-4">#{idx + 1}</span>
                              <span className="font-semibold">{item.word}</span>
                            </span>
                            <span className="font-mono text-slate-500 dark:text-slate-400">
                              {item.count}× ({item.density}%)
                            </span>
                          </div>
                          <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, item.density * 10)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2-Word Recurring Phrases */}
                  {phraseDensity.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
                        Recurring 2-Word Phrases
                      </span>
                      <div className="space-y-1.5 text-xs">
                        {phraseDensity.map((p) => (
                          <div
                            key={p.phrase}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center"
                          >
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">&quot;{p.phrase}&quot;</span>
                            <span className="font-mono text-slate-500">{p.count}× ({p.density}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===============================================================
                  TAB 4: SOCIAL MEDIA & PLATFORM LIMITS
                 =============================================================== */}
              {activeTab === 'social' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Platform Character Constraints
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Current: {stats.characters} chars
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                    {socialLimits.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all text-xs ${
                          item.status === 'overflow'
                            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60'
                            : item.status === 'warning'
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.name}</span>
                          </span>
                          <span
                            className={`font-mono text-[11px] font-bold ${
                              item.status === 'overflow'
                                ? 'text-rose-600 dark:text-rose-400'
                                : item.status === 'warning'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.current} / {item.limit}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden my-1.5">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              item.status === 'overflow'
                                ? 'bg-rose-500'
                                : item.status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                          <span>{item.recommended}</span>
                          {item.status === 'overflow' ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              Overflow: +{Math.abs(item.remaining)} chars
                            </span>
                          ) : (
                            <span>{item.remaining} remaining</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===============================================================
                  TAB 5: EXPORT & REPORTS
                 =============================================================== */}
              {activeTab === 'report' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">
                      Ready-to-Share Intelligence Report
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Export structured analytics for editorial reviews, copywriting briefs, or research papers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReport ? 'Report Copied!' : 'Copy Markdown Report'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadJsonReport}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadTxt}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .txt File</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Clean Text</span>
                    </button>
                  </div>

                  {/* Privacy Assurance Card */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      All textual metrics, keyword frequencies, and readability indexes are computed 100% locally in your browser.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
