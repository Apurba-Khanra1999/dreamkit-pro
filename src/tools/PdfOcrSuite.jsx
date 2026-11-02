import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ScanText,
  FileText,
  Table,
  Code,
  Copy,
  Check,
  Download,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Upload,
  Cpu,
  Layers,
  Wand2
} from 'lucide-react';
import {
  getPdfOcrInfo,
  renderPageToCanvas,
  preprocessCanvas,
  extractPdfWithOcr,
  generateSampleScannedInvoicePdf,
  getOcrHistory,
  saveOcrHistory,
  clearOcrHistory
} from '../utils/pdfOcrUtils';

export default function PdfOcrSuite({ _theme = 'dark', onNotify }) {
  // Input PDF Document State
  const [loadedDoc, setLoadedDoc] = useState(null); // { name, size, formattedSize, pageCount, pages, hasDigitalText, buffer }
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Extraction Engine Configuration
  const [engineMode, setEngineMode] = useState('auto'); // 'auto' | 'ocr' | 'native'
  const [preprocessFilter, setPreprocessFilter] = useState('contrast'); // 'contrast' | 'grayscale' | 'binarize' | 'none'
  const [pageRange, setPageRange] = useState('all'); // 'all' | 'first' | 'last' | 'custom'
  const [customPages, setCustomPages] = useState('');

  // Processing & Live Progress
  const [isExtracting, setIsExtracting] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ current: 0, total: 0, percent: 0, stage: '' });

  // Extracted Results State
  const [extractionResult, setExtractionResult] = useState(null);
  const [activeOutputTab, setActiveOutputTab] = useState('text'); // 'text' | 'markdown' | 'csv' | 'json' | 'visual'
  const [copied, setCopied] = useState(false);

  // Visual Page Inspector State
  const [pageCanvasDataUrl, setPageCanvasDataUrl] = useState(null);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [hoveredWord, setHoveredWord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // History State
  const [historyList, setHistoryList] = useState(() => getOcrHistory());
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // File Input Drag and Drop
  const fileInputRef = useRef(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Load PDF Buffer
  const handleLoadPdfBuffer = useCallback(async (buffer, filename = 'document.pdf') => {
    setIsLoadingDoc(true);
    setErrorMessage(null);
    setExtractionResult(null);
    setPageCanvasDataUrl(null);

    try {
      const info = await getPdfOcrInfo(buffer, filename);
      setLoadedDoc(info);
      setCurrentPage(1);

      if (onNotify) {
        onNotify(`Loaded "${filename}" (${info.pageCount} ${info.pageCount === 1 ? 'page' : 'pages'})`, 'success');
      }
    } catch (err) {
      console.error('Failed to load PDF for OCR:', err);
      setErrorMessage(err.message || 'Failed to inspect PDF document.');
      if (onNotify) onNotify('Failed to inspect PDF.', 'error');
    } finally {
      setIsLoadingDoc(false);
    }
  }, [onNotify]);

  // Load Sample Scanned Invoice
  const handleLoadSampleInvoice = useCallback(async () => {
    setIsLoadingDoc(true);
    setErrorMessage(null);
    try {
      const sample = await generateSampleScannedInvoicePdf();
      await handleLoadPdfBuffer(sample.buffer, sample.name);
    } catch (err) {
      console.error('Failed to load sample invoice:', err);
      setErrorMessage('Failed to generate sample invoice.');
    } finally {
      setIsLoadingDoc(false);
    }
  }, [handleLoadPdfBuffer]);

  // Render Current Page Canvas for Visual Inspector
  useEffect(() => {
    if (!loadedDoc?.buffer) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      setIsRenderingPage(true);
      renderPageToCanvas(loadedDoc.buffer, currentPage, 1.5)
        .then((res) => {
          if (isMounted && res?.canvas) {
            // Apply preprocessing preview if in OCR mode
            const finalCanvas = preprocessFilter !== 'none'
              ? preprocessCanvas(res.canvas, preprocessFilter)
              : res.canvas;
            setPageCanvasDataUrl(finalCanvas.toDataURL('image/jpeg', 0.9));
          }
        })
        .catch((err) => console.error('Canvas render error:', err))
        .finally(() => {
          if (isMounted) setIsRenderingPage(false);
        });
    }, 15);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loadedDoc, currentPage, preprocessFilter]);

  // Execute OCR Extraction
  const handleRunOcrExtraction = async () => {
    if (!loadedDoc?.buffer) {
      setErrorMessage('Please load a PDF document first.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);
    setProgressInfo({ current: 0, total: loadedDoc.pageCount, percent: 0, stage: 'Initializing extraction engine...' });

    try {
      const result = await extractPdfWithOcr(
        loadedDoc.buffer,
        {
          engineMode,
          filter: preprocessFilter,
          pageRange,
          customPages
        },
        (progress) => setProgressInfo(progress)
      );

      setExtractionResult(result);

      // Save to local history
      saveOcrHistory({
        filename: loadedDoc.name,
        size: loadedDoc.size,
        formattedSize: loadedDoc.formattedSize,
        pageCount: result.pageCount,
        processedPagesCount: result.processedPagesCount,
        wordCount: result.wordCount,
        charCount: result.charCount,
        confidence: result.avgConfidence
      });
      setHistoryList(getOcrHistory());

      if (onNotify) {
        onNotify(`Extracted ${result.wordCount} words across ${result.processedPagesCount} pages!`, 'success');
      }
    } catch (err) {
      console.error('OCR Extraction failed:', err);
      setErrorMessage(err.message || 'Failed to extract text from PDF document.');
      if (onNotify) onNotify('Extraction failed.', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  // Copy to Clipboard
  const handleCopyText = (content) => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      if (onNotify) onNotify('Copied extracted text to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download Output File
  const handleDownloadFile = (content, extension, mimeType) => {
    if (!content) return;
    const baseName = loadedDoc?.name.replace(/\.[^/.]+$/, '') || 'document';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_extracted.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Filter words for current page visual inspector
  const currentPageData = useMemo(() => {
    if (!extractionResult?.pages) return null;
    return extractionResult.pages.find((p) => p.pageNumber === currentPage);
  }, [extractionResult, currentPage]);

  const filteredWords = useMemo(() => {
    if (!currentPageData?.words) return [];
    if (!searchQuery.trim()) return currentPageData.words;
    const q = searchQuery.toLowerCase();
    return currentPageData.words.filter((w) => w.text && w.text.toLowerCase().includes(q));
  }, [currentPageData, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/40 dark:border-indigo-800/40">
              <ScanText className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  PDF OCR Text Extractor
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Client-Side OCR
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Extract text from scanned PDFs, raster receipts, invoices, and documents. Supports Tesseract OCR, image contrast filters, bounding boxes, and export to TXT, Markdown, CSV, and JSON.
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLoadSampleInvoice}
              disabled={isLoadingDoc || isExtracting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({historyList.length})</span>
            </button>
          </div>
        </div>

        {/* Security & Document Info Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>100% In-Browser Optical Character Recognition • Zero External Server Uploads</span>
          </div>
          {loadedDoc && (
            <div className="hidden sm:flex items-center gap-3">
              <span>Pages: <strong className="text-slate-900 dark:text-white">{loadedDoc.pageCount}</strong></span>
              <span>•</span>
              <span>
                Document Type:{' '}
                <strong className={loadedDoc.hasDigitalText ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}>
                  {loadedDoc.hasDigitalText ? 'Digital PDF' : 'Scanned / Raster Image'}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm font-medium">
            {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Workspace */}
      {!loadedDoc ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => handleLoadPdfBuffer(reader.result, file.name);
              reader.readAsArrayBuffer(file);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all p-12 text-center flex flex-col items-center justify-center ${
            isDraggingFile
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-[#111622]/50 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => handleLoadPdfBuffer(reader.result, file.name);
                reader.readAsArrayBuffer(file);
              }
              e.target.value = '';
            }}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs">
            <Upload className="w-8 h-8 stroke-[1.75]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Drop your scanned PDF document here
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Drag & drop receipts, scanned invoices, books, or contracts to extract plain text, markdown, CSV, and word bounding boxes.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              Browse Files
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSampleInvoice();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Load Scanned Sample Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Header & Engine Config Bar */}
          <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                    {loadedDoc.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {loadedDoc.pageCount} {loadedDoc.pageCount === 1 ? 'page' : 'pages'} • {loadedDoc.formattedSize} •{' '}
                    <span className={loadedDoc.hasDigitalText ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}>
                      {loadedDoc.hasDigitalText ? 'Contains Vector Text' : 'Likely Scanned Image'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => handleLoadPdfBuffer(reader.result, file.name);
                      reader.readAsArrayBuffer(file);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Change Document
                </button>
                <button
                  type="button"
                  onClick={() => setLoadedDoc(null)}
                  className="p-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* OCR Tuning Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              
              {/* Engine Mode */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Extraction Engine:</span>
                </label>
                <select
                  value={engineMode}
                  onChange={(e) => setEngineMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="auto">Smart Hybrid (Auto-Detect OCR)</option>
                  <option value="ocr">Deep OCR (Force Tesseract Engine)</option>
                  <option value="native">Fast Vector Text Stream</option>
                </select>
              </div>

              {/* Preprocessing Filter */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Image Preprocessing:</span>
                </label>
                <select
                  value={preprocessFilter}
                  onChange={(e) => setPreprocessFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="contrast">High Contrast (Recommended for Scans)</option>
                  <option value="binarize">Sharp Binarization (Black & White)</option>
                  <option value="grayscale">Grayscale Normalization</option>
                  <option value="none">Original Colors (No Filter)</option>
                </select>
              </div>

              {/* Page Range */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Page Scope:</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="all">All Pages ({loadedDoc.pageCount})</option>
                    <option value="first">First Page Only</option>
                    <option value="last">Last Page Only</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  {pageRange === 'custom' && (
                    <input
                      type="text"
                      value={customPages}
                      onChange={(e) => setCustomPages(e.target.value)}
                      placeholder="1-2, 4"
                      className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              </div>

            </div>

            {/* Run Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRunOcrExtraction}
                disabled={isExtracting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Text & OCR ({progressInfo.percent}%)...</span>
                  </>
                ) : (
                  <>
                    <ScanText className="w-4 h-4 stroke-[2.5]" />
                    <span>Extract Text & Run OCR</span>
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {isExtracting && (
                <div className="space-y-1.5 mt-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex justify-between text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    <span>{progressInfo.stage || 'Extracting characters...'}</span>
                    <span>{progressInfo.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-indigo-200/50 dark:bg-indigo-900/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                      style={{ width: `${progressInfo.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RESULTS DASHBOARD */}
          {extractionResult && (
            <div className="space-y-6">
              
              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-2xs text-slate-500 uppercase tracking-wider block font-semibold">Total Words</span>
                  <strong className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {extractionResult.wordCount.toLocaleString()}
                  </strong>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-2xs text-slate-500 uppercase tracking-wider block font-semibold">Characters</span>
                  <strong className="text-xl font-bold text-slate-900 dark:text-white">
                    {extractionResult.charCount.toLocaleString()}
                  </strong>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-2xs text-slate-500 uppercase tracking-wider block font-semibold">OCR Confidence</span>
                  <strong className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {extractionResult.avgConfidence}%
                  </strong>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-2xs text-slate-500 uppercase tracking-wider block font-semibold">Pages Processed</span>
                  <strong className="text-xl font-bold text-slate-900 dark:text-white">
                    {extractionResult.processedPagesCount} of {extractionResult.pageCount}
                  </strong>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-2xs text-slate-500 uppercase tracking-wider block font-semibold">Reading Time</span>
                  <strong className="text-xl font-bold text-slate-900 dark:text-white">
                    ~{extractionResult.readingTimeMinutes} min
                  </strong>
                </div>
              </div>

              {/* Output Tabs & Export Bar */}
              <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  
                  {/* Format Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActiveOutputTab('text')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        activeOutputTab === 'text'
                          ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Plain Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveOutputTab('markdown')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        activeOutputTab === 'markdown'
                          ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Markdown</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveOutputTab('csv')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        activeOutputTab === 'csv'
                          ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Tabular CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveOutputTab('json')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        activeOutputTab === 'json'
                          ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>JSON Bounding Boxes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveOutputTab('visual')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        activeOutputTab === 'visual'
                          ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Visual Page Inspector</span>
                    </button>
                  </div>

                  {/* Copy & Download Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const content =
                          activeOutputTab === 'markdown'
                            ? extractionResult.markdown
                            : activeOutputTab === 'csv'
                            ? extractionResult.csv
                            : activeOutputTab === 'json'
                            ? extractionResult.json
                            : extractionResult.fullText;
                        handleCopyText(content);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeOutputTab === 'markdown') {
                          handleDownloadFile(extractionResult.markdown, 'md', 'text/markdown');
                        } else if (activeOutputTab === 'csv') {
                          handleDownloadFile(extractionResult.csv, 'csv', 'text/csv');
                        } else if (activeOutputTab === 'json') {
                          handleDownloadFile(extractionResult.json, 'json', 'application/json');
                        } else {
                          handleDownloadFile(extractionResult.fullText, 'txt', 'text/plain');
                        }
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        Download .{activeOutputTab === 'markdown' ? 'md' : activeOutputTab === 'csv' ? 'csv' : activeOutputTab === 'json' ? 'json' : 'txt'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: PLAIN TEXT */}
                {activeOutputTab === 'text' && (
                  <div className="space-y-2">
                    <textarea
                      readOnly
                      value={extractionResult.fullText}
                      rows={16}
                      className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#0c111a] border border-slate-200/60 dark:border-slate-800/60 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden resize-y"
                    />
                  </div>
                )}

                {/* TAB 2: MARKDOWN */}
                {activeOutputTab === 'markdown' && (
                  <div className="space-y-2">
                    <textarea
                      readOnly
                      value={extractionResult.markdown}
                      rows={16}
                      className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#0c111a] border border-slate-200/60 dark:border-slate-800/60 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden resize-y"
                    />
                  </div>
                )}

                {/* TAB 3: CSV */}
                {activeOutputTab === 'csv' && (
                  <div className="space-y-2">
                    <textarea
                      readOnly
                      value={extractionResult.csv}
                      rows={16}
                      className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#0c111a] border border-slate-200/60 dark:border-slate-800/60 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden resize-y"
                    />
                  </div>
                )}

                {/* TAB 4: JSON WITH BOUNDING BOXES */}
                {activeOutputTab === 'json' && (
                  <div className="space-y-2">
                    <textarea
                      readOnly
                      value={extractionResult.json}
                      rows={16}
                      className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#0c111a] border border-slate-200/60 dark:border-slate-800/60 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden resize-y"
                    />
                  </div>
                )}

                {/* TAB 5: VISUAL PAGE INSPECTOR WITH BOUNDING BOX OVERLAYS */}
                {activeOutputTab === 'visual' && (
                  <div className="space-y-4">
                    
                    {/* Visual Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs">
                      
                      {/* Search Inside OCR Document */}
                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search recognized text on page..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Bounding Box Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="checkbox"
                          checked={showBoundingBoxes}
                          onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                          className="accent-indigo-600 w-4 h-4 rounded"
                        />
                        <span>Highlight Word Bounding Boxes</span>
                      </label>

                      {/* Page Stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentPage <= 1 || isRenderingPage}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Page {currentPage} of {loadedDoc.pageCount}
                        </span>
                        <button
                          type="button"
                          disabled={currentPage >= loadedDoc.pageCount || isRenderingPage}
                          onClick={() => setCurrentPage((p) => Math.min(loadedDoc.pageCount, p + 1))}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Canvas & Overlay Viewport */}
                    <div className="relative min-h-[500px] max-h-[680px] rounded-xl bg-slate-100 dark:bg-[#0c111a] border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center p-4 overflow-auto select-none">
                      {isRenderingPage && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                          <span>Rendering page {currentPage}...</span>
                        </div>
                      )}

                      {pageCanvasDataUrl && (
                        <div className="relative shadow-xl rounded-sm overflow-hidden bg-white max-w-full">
                          <img
                            src={pageCanvasDataUrl}
                            alt={`Page ${currentPage}`}
                            className="max-h-[620px] w-auto object-contain block select-none"
                          />

                          {/* OVERLAY BOUNDING BOXES */}
                          {showBoundingBoxes &&
                            filteredWords.map((word, wIdx) => {
                              // If coordinates are available
                              if (word.x === undefined || word.y === undefined) return null;
                              return (
                                <div
                                  key={wIdx}
                                  onMouseEnter={() => setHoveredWord(word)}
                                  onMouseLeave={() => setHoveredWord(null)}
                                  style={{
                                    left: `${word.x * 1.5}px`,
                                    top: `${word.y * 1.5}px`,
                                    width: `${Math.max(12, (word.width || 20) * 1.5)}px`,
                                    height: `${Math.max(10, (word.height || 12) * 1.5)}px`
                                  }}
                                  className="absolute border border-indigo-500/60 bg-indigo-500/10 hover:bg-indigo-500/30 hover:border-indigo-600 cursor-pointer transition-colors"
                                  title={`"${word.text}" (Confidence: ${word.confidence || 100}%)`}
                                />
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* Tooltip detail bar */}
                    {hoveredWord && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-slate-400">Recognized Word:</span>{' '}
                          <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm ml-1">
                            "{hoveredWord.text}"
                          </strong>
                        </div>
                        <div className="text-slate-500">
                          Confidence: <strong className="text-emerald-600">{hoveredWord.confidence || 100}%</strong> • Bounds: [{Math.round(hoveredWord.x)}, {Math.round(hoveredWord.y)}]
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      )}

      {/* RECENT OCR HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <History className="w-4 h-4 text-indigo-500" />
                <span>Recent OCR Extraction Tasks</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent OCR extractions found.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.filename}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {item.wordCount?.toLocaleString()} words • {item.confidence}% confidence • {item.formattedSize}
                      </div>
                    </div>
                    <span className="text-2xs text-slate-400 shrink-0">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              {historyList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearOcrHistory();
                    setHistoryList([]);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear History
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="ml-auto px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
