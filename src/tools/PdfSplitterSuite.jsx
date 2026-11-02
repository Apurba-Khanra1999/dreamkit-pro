import React, { useState, useRef, useMemo } from 'react';
import {
  Scissors,
  FileText,
  Upload,
  Sparkles,
  Download,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  History,
  Trash2,
  Archive,
  Grid,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Square,
  FileCheck,
  Check
} from 'lucide-react';
import {
  cloneBuffer,
  loadPdfDocumentForSplit,
  calculateSplitPlan,
  splitPdf,
  createSplitZipBlob,
  generateSampleSplitPdf,
  downloadPdfBlob,
  downloadZipBlob,
  openPdfInNewTab,
  getSplitHistory,
  saveSplitHistory,
  clearSplitHistory
} from '../utils/pdfSplitterUtils';

export default function PdfSplitterSuite({ _theme = 'dark', onNotify }) {
  // --- DOCUMENT & QUEUE STATE ---
  const [currentDoc, setCurrentDoc] = useState(null); // { id, name, baseName, size, formattedSize, pageCount, pages: [...], buffer }
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [progressInfo, setProgressInfo] = useState({
    current: 0,
    total: 0,
    stage: '',
    percent: 0
  });
  const [errorMessage, setErrorMessage] = useState(null);

  // --- SPLIT MODE & CONFIG STATE ---
  // Modes: 'all' | 'range' | 'fixed' | 'extract_selected'
  const [splitMode, setSplitMode] = useState('all');
  const [customPrefix, setCustomPrefix] = useState('');

  // Mode 2: Range String (e.g. '1-2, 3-4, 5-6')
  const [rangeString, setRangeString] = useState('1-2, 3-4, 5-6');

  // Mode 3: Fixed chunk size
  const [chunkSize, setChunkSize] = useState(2);

  // Mode 4: Visual Selection
  const [selectedPages, setSelectedPages] = useState([]); // array of 1-indexed numbers e.g. [1, 2, 4]
  const [combineSelected, setCombineSelected] = useState(true);

  // --- PAGE GRID DISPLAY CONTROLS ---
  const [gridSize, setGridSize] = useState('medium'); // 'small' | 'medium' | 'large'

  // --- SPLIT RESULTS STATE ---
  const [splitResult, setSplitResult] = useState(null);

  // --- HISTORY & DRAWER STATE ---
  const [historyList, setHistoryList] = useState(() => getSplitHistory());
  const [showHistory, setShowHistory] = useState(false);

  // --- DRAG & DROP STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Calculate live split plan
  const computedPlan = useMemo(() => {
    if (!currentDoc) return { parts: [], error: null };
    return calculateSplitPlan({
      mode: splitMode,
      totalPages: currentDoc.pageCount,
      config: {
        rangeString,
        chunkSize,
        combineSelected
      },
      selectedPages
    });
  }, [currentDoc, splitMode, rangeString, chunkSize, combineSelected, selectedPages]);

  // Load a PDF file from buffer
  const handleLoadDocument = async (fileObj, filename = 'document.pdf') => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSplitResult(null);

      let buffer;
      if (fileObj instanceof ArrayBuffer) {
        buffer = fileObj;
      } else if (fileObj instanceof Blob || fileObj instanceof File) {
        buffer = await fileObj.arrayBuffer();
      } else {
        throw new Error('Unsupported file source.');
      }

      const docInfo = await loadPdfDocumentForSplit(
        cloneBuffer(buffer),
        filename,
        (p) => setProgressInfo(p)
      );

      setCurrentDoc(docInfo);
      setCustomPrefix(docInfo.baseName);

      // Default selection: select all pages
      const allNums = Array.from({ length: docInfo.pageCount }, (_, i) => i + 1);
      setSelectedPages(allNums);

      // Configure default range string based on page count
      if (docInfo.pageCount <= 2) {
        setRangeString('1, 2');
      } else if (docInfo.pageCount <= 4) {
        setRangeString('1-2, 3-4');
      } else {
        setRangeString('1-2, 3-4, 5-6');
      }

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'PDF Loaded',
          message: `Loaded "${filename}" (${docInfo.pageCount} pages, ${docInfo.formattedSize})`
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to read PDF document.');
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Load Failed',
          message: err.message || 'Failed to load PDF document'
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        await handleLoadDocument(file, file.name);
      } else if (onNotify) {
        onNotify({
          type: 'warning',
          title: 'Invalid File',
          message: 'Please drop a valid .pdf file.'
        });
      }
    }
  };

  const handleFileInputChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      await handleLoadDocument(file, file.name);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1-Click Sample Generator
  const handleLoadSample = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressInfo({ current: 1, total: 1, stage: 'Generating realistic 6-page report...', percent: 50 });

      const sample = await generateSampleSplitPdf();
      await handleLoadDocument(sample.buffer, sample.name);

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Sample PDF Loaded',
          message: 'Loaded 6-page Corporate Annual Report sample.'
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate sample PDF');
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Selection handlers
  const togglePageSelect = (pageNumber) => {
    setSelectedPages((prev) =>
      prev.includes(pageNumber)
        ? prev.filter((p) => p !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
  };

  const selectAllPages = () => {
    if (!currentDoc) return;
    const all = Array.from({ length: currentDoc.pageCount }, (_, i) => i + 1);
    setSelectedPages(all);
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
  };

  const selectEvenPages = () => {
    if (!currentDoc) return;
    const evens = [];
    for (let i = 2; i <= currentDoc.pageCount; i += 2) {
      evens.push(i);
    }
    setSelectedPages(evens);
  };

  const selectOddPages = () => {
    if (!currentDoc) return;
    const odds = [];
    for (let i = 1; i <= currentDoc.pageCount; i += 2) {
      odds.push(i);
    }
    setSelectedPages(odds);
  };

  const invertSelection = () => {
    if (!currentDoc) return;
    const inverted = [];
    for (let i = 1; i <= currentDoc.pageCount; i++) {
      if (!selectedPages.includes(i)) {
        inverted.push(i);
      }
    }
    setSelectedPages(inverted);
  };

  // Run the Split operation
  const handleExecuteSplit = async () => {
    if (!currentDoc) return;
    if (computedPlan.error) {
      setErrorMessage(computedPlan.error);
      return;
    }
    if (!computedPlan.parts || computedPlan.parts.length === 0) {
      setErrorMessage('Split plan is empty. Please verify your split settings.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSplitResult(null);

      const modeLabels = {
        all: 'All Pages (Individual)',
        range: 'Custom Page Ranges',
        fixed: `Fixed Chunks (${chunkSize} pgs)`,
        extract_selected: combineSelected ? 'Consolidated Selection' : 'Extracted Pages'
      };

      const result = await splitPdf({
        buffer: currentDoc.buffer,
        filename: currentDoc.name,
        splitPlan: computedPlan.parts,
        customPrefix,
        onProgress: (p) => setProgressInfo(p)
      });

      setSplitResult(result);

      // Save to local history
      saveSplitHistory({
        title: currentDoc.name,
        mode: splitMode,
        modeLabel: modeLabels[splitMode] || splitMode,
        originalPages: currentDoc.pageCount,
        outputFilesCount: result.totalOutputFiles,
        totalSize: result.totalOutputBytes
      });
      setHistoryList(getSplitHistory());

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Split Completed',
          message: `Successfully generated ${result.totalOutputFiles} PDF documents (${result.formattedTotalOutputSize})!`
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to split PDF.');
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Split Error',
          message: err.message || 'PDF splitting failed.'
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Download all split files as ZIP archive
  const handleDownloadAllZip = async () => {
    if (!splitResult || !splitResult.files || splitResult.files.length === 0) return;

    try {
      setIsZipping(true);
      const zipBlob = await createSplitZipBlob(splitResult.files);
      const zipName = `${customPrefix || 'split_documents'}_all_parts.zip`;
      downloadZipBlob(zipBlob, zipName);

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'ZIP Download Started',
          message: `Bundled ${splitResult.files.length} PDFs into "${zipName}".`
        });
      }
    } catch (err) {
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'ZIP Failed',
          message: err.message || 'Failed to generate ZIP archive.'
        });
      }
    } finally {
      setIsZipping(false);
    }
  };

  // Reset file
  const handleResetFile = () => {
    setCurrentDoc(null);
    setSplitResult(null);
    setErrorMessage(null);
    setSelectedPages([]);
  };

  // History Clear
  const handleClearHistory = () => {
    clearSplitHistory();
    setHistoryList([]);
    if (onNotify) {
      onNotify({
        type: 'info',
        title: 'History Cleared',
        message: 'PDF split history cleared.'
      });
    }
  };

  const SPLIT_MODES = [
    {
      id: 'all',
      name: 'All Pages (Individual)',
      badge: `${currentDoc?.pageCount || 1} Files`,
      badgeVariant: 'indigo',
      description: 'Extract every single page into its own individual 1-page PDF document.'
    },
    {
      id: 'range',
      name: 'Custom Page Ranges',
      badge: 'Custom',
      badgeVariant: 'purple',
      description: 'Group pages into custom ranges (e.g., 1-2, 3-4, 5-6) or custom groupings.'
    },
    {
      id: 'fixed',
      name: 'Fixed Page Chunks',
      badge: `Every ${chunkSize} pgs`,
      badgeVariant: 'emerald',
      description: 'Divide the document uniformly into multi-page chunks of N pages each.'
    },
    {
      id: 'extract_selected',
      name: 'Extract Selected Pages',
      badge: `${selectedPages.length} Selected`,
      badgeVariant: 'amber',
      description: 'Extract specifically selected pages as a single consolidated PDF or individual files.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* =========================================================================
          MODULE HEADER (STANDARD DREAMKIT TOOL SUITE HEADER)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                PDF Splitter Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                Lossless Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Extract pages, split by custom ranges, divide into fixed chunks, or visually select pages with instant ZIP archive export.
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>History ({historyList.length})</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local Browser Processing</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HISTORY DRAWER / PANEL
         ========================================================================= */}
      {showHistory && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent PDF Splits
              </h3>
            </div>
            {historyList.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No split history recorded yet. Completed document splits will be logged here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {historyList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]" title={item.title}>
                      {item.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium shrink-0">
                      {item.modeLabel || item.mode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{item.originalPages} pgs → <strong className="text-slate-700 dark:text-slate-300">{item.outputFilesCount} files</strong></span>
                    <span>{item.formattedSize}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          FILE UPLOAD & DROP ZONE (OR COMPACT LOADED FILE BAR)
         ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {!currentDoc ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-xs border border-indigo-200 dark:border-indigo-900/60">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Click to select or drag & drop a PDF document to split
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Extract all individual pages, split by custom ranges, divide into fixed chunks, or select pages visually.
            </p>

            {/* Quick Sample Trigger */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick test:</span>
              </span>
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isProcessing}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 cursor-pointer transition-colors disabled:opacity-50"
              >
                📄 Load 6-Page Sample PDF (Corporate Annual Report)
              </button>
            </div>
          </div>
        ) : (
          /* Active Document Details Bar */
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {currentDoc.pages[0]?.thumbnail ? (
                <img
                  src={currentDoc.pages[0].thumbnail}
                  alt="Page 1 thumbnail"
                  className="w-11 h-15 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-11 h-15 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <span className="font-bold text-sm text-slate-900 dark:text-white block truncate" title={currentDoc.name}>
                  {currentDoc.name}
                </span>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 flex-wrap">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{currentDoc.formattedSize}</span>
                  <span>•</span>
                  <span>{currentDoc.pageCount} {currentDoc.pageCount === 1 ? 'page' : 'pages'}</span>
                  <span>•</span>
                  <span>{currentDoc.pages[0]?.width || 595} × {currentDoc.pages[0]?.height || 842} pt</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleResetFile}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                <span>Remove</span>
              </button>

              <button
                type="button"
                onClick={handleExecuteSplit}
                disabled={isProcessing || !computedPlan.parts || computedPlan.parts.length === 0 || !!computedPlan.error}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Splitting PDF...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Split Document ({computedPlan.parts?.length || 0} Files)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Progress Bar */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>{progressInfo.stage || 'Transforming PDF...'}</span>
              </span>
              <span className="font-mono">{progressInfo.percent}%</span>
            </div>
            <div className="w-full h-2 bg-indigo-200 dark:bg-indigo-900/60 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressInfo.percent}%` }}
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          SPLITTING STRATEGY & CONFIGURATION PANEL
         ========================================================================= */}
      {currentDoc && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Splitting Strategy & Output Mode</span>
            </h2>
            <span className="text-xs text-slate-400">Select extraction method</span>
          </div>

          {/* Strategy Preset Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SPLIT_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSplitMode(mode.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                  splitMode === mode.id
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {mode.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {mode.description}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full self-start ${
                    mode.badgeVariant === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : mode.badgeVariant === 'purple'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : mode.badgeVariant === 'amber'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}
                >
                  {mode.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Mode-Specific Custom Controls */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-4">
            {splitMode === 'all' && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  Each page from 1 to {currentDoc.pageCount} will be generated as a standalone 1-page document with zero loss.
                </span>
              </div>
            )}

            {splitMode === 'range' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Custom Page Ranges (comma separated):
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Available pages: 1 – {currentDoc.pageCount}
                  </span>
                </div>

                <input
                  type="text"
                  value={rangeString}
                  onChange={(e) => setRangeString(e.target.value)}
                  placeholder="e.g. 1-2, 3-4, 5-6"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-400 text-[11px]">Presets:</span>
                  {currentDoc.pageCount >= 4 && (
                    <button
                      type="button"
                      onClick={() => setRangeString('1-2, 3-4')}
                      className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:border-indigo-400 cursor-pointer"
                    >
                      1-2, 3-4
                    </button>
                  )}
                  {currentDoc.pageCount >= 6 && (
                    <button
                      type="button"
                      onClick={() => setRangeString('1-2, 3-4, 5-6')}
                      className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:border-indigo-400 cursor-pointer"
                    >
                      1-2, 3-4, 5-6
                    </button>
                  )}
                  {currentDoc.pageCount >= 3 && (
                    <button
                      type="button"
                      onClick={() => setRangeString(`1, 2-${currentDoc.pageCount}`)}
                      className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:border-indigo-400 cursor-pointer"
                    >
                      Cover vs Rest: 1, 2-{currentDoc.pageCount}
                    </button>
                  )}
                </div>
              </div>
            )}

            {splitMode === 'fixed' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Chunk Size (number of pages per split file):
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Yields {Math.ceil(currentDoc.pageCount / chunkSize)} output files
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={currentDoc.pageCount}
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Math.max(1, parseInt(e.target.value || '1', 10)))}
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />

                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 5, 10].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setChunkSize(sz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          chunkSize === sz
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        {sz} {sz === 1 ? 'pg' : 'pgs'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {splitMode === 'extract_selected' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Selected Pages in Grid: <strong className="text-indigo-600 dark:text-indigo-400">{selectedPages.join(', ') || 'None'}</strong>
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {selectedPages.length} of {currentDoc.pageCount} selected
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="combine_option"
                      checked={combineSelected}
                      onChange={() => setCombineSelected(true)}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="font-medium">Combine all selected pages into 1 consolidated PDF</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="combine_option"
                      checked={!combineSelected}
                      onChange={() => setCombineSelected(false)}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="font-medium">Export each selected page as an individual file</span>
                  </label>
                </div>
              </div>
            )}

            {/* Custom Output Prefix */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                Output File Prefix:
              </label>
              <input
                type="text"
                value={customPrefix}
                onChange={(e) => setCustomPrefix(e.target.value)}
                placeholder="Prefix for split files"
                className="max-w-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 font-mono">
                e.g. {customPrefix || 'document'}_part_1.pdf
              </span>
            </div>

            {/* Planned Output Chips */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Planned Output ({computedPlan.parts?.length || 0} PDF files):</span>
                </span>
                {computedPlan.error && (
                  <span className="text-xs text-rose-500 font-normal">
                    {computedPlan.error}
                  </span>
                )}
              </div>

              {computedPlan.parts && computedPlan.parts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {computedPlan.parts.map((p, idx) => (
                    <span
                      key={p.id || idx}
                      className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-mono"
                    >
                      {p.label} ({p.pageIndices.length} {p.pageIndices.length === 1 ? 'pg' : 'pgs'})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DOCUMENT PAGE INSPECTOR (VISUAL THUMBNAIL GRID)
         ========================================================================= */}
      {currentDoc && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-500" />
                <span>Visual Page Selector & Inspector ({currentDoc.pageCount} Pages)</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Click any page to toggle selection • <strong>{selectedPages.length} selected</strong>
              </span>
            </div>

            {/* Selection Toolbar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={selectAllPages}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                All
              </button>
              <button
                type="button"
                onClick={deselectAllPages}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                None
              </button>
              <button
                type="button"
                onClick={selectOddPages}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Odd
              </button>
              <button
                type="button"
                onClick={selectEvenPages}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Even
              </button>
              <button
                type="button"
                onClick={invertSelection}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Invert
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Zoom:</span>
                <button
                  type="button"
                  onClick={() => setGridSize('small')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                    gridSize === 'small' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  S
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize('medium')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                    gridSize === 'medium' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize('large')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                    gridSize === 'large' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  L
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnail Cards Grid */}
          <div
            className={`grid gap-3 ${
              gridSize === 'small'
                ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
                : gridSize === 'large'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            }`}
          >
            {currentDoc.pages.map((page) => {
              const isSelected = selectedPages.includes(page.pageNumber);
              return (
                <div
                  key={page.pageNumber}
                  onClick={() => togglePageSelect(page.pageNumber)}
                  className={`group relative rounded-xl border p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Thumbnail viewport */}
                  <div className="relative aspect-[1/1.35] w-full rounded-lg bg-white overflow-hidden shadow-inner flex items-center justify-center border border-slate-200/60">
                    {page.thumbnail ? (
                      <img
                        src={page.thumbnail}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6 opacity-40" />
                        <span className="text-[10px] mt-1">Page {page.pageNumber}</span>
                      </div>
                    )}

                    {/* Selection Pill */}
                    <div className="absolute top-1.5 right-1.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-slate-900/50 text-white/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Square className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Page Footer */}
                  <div className="mt-2 flex items-center justify-between text-xs px-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      Page {page.pageNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {page.width}x{page.height}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          RESULTS DASHBOARD (AFTER SUCCESSFUL SPLIT)
         ========================================================================= */}
      {splitResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Output Files
              </span>
              <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {splitResult.totalOutputFiles}
              </p>
              <span className="text-[10px] text-indigo-500 font-medium">Split PDF documents</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pages Extracted
              </span>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {splitResult.totalOutputPages}
              </p>
              <span className="text-[10px] text-slate-400">From {currentDoc?.pageCount} source pages</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Combined Size
              </span>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {splitResult.formattedTotalOutputSize}
              </p>
              <span className="text-[10px] text-slate-400">Lossless object streams</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 space-y-1">
              <span className="text-[11px] font-semibold text-indigo-100 uppercase tracking-wider block">
                Status
              </span>
              <p className="text-2xl font-black font-mono">
                Ready!
              </p>
              <span className="text-[10px] text-indigo-100 font-medium">100% Client-Side Pure</span>
            </div>
          </div>

          {/* Individual Split Files List */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Generated Split PDF Documents ({splitResult.files.length})</span>
              </span>

              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 transition-all"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{isZipping ? 'Archiving...' : 'Download All as ZIP'}</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {splitResult.files.map((file, idx) => (
                <div
                  key={file.id || idx}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-xs" title={file.name}>
                        {file.name}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{file.label}</span>
                        <span>•</span>
                        <span>{file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}</span>
                        <span>•</span>
                        <span>{file.formattedSize}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => openPdfInNewTab(file.bytes)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadPdfBlob(file.bytes, file.name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Download & Preview Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                All {splitResult.totalOutputFiles} split documents created successfully! Download individually or package in a ZIP archive.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer transition-all disabled:opacity-50"
              >
                <Archive className="w-4 h-4" />
                <span>{isZipping ? 'Archiving...' : 'Download All as ZIP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
