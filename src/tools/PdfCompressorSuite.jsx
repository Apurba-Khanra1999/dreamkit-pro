import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Download,
  ExternalLink,
  RefreshCw,
  Sliders,
  Eye,
  Trash2,
  History,
  FileCheck,
  FileText
} from 'lucide-react';
import {
  COMPRESSION_PRESETS,
  formatBytes,
  cloneBuffer,
  loadPdfMetadata,
  compressPdf,
  renderPageThumbnail,
  generateSamplePdf,
  downloadPdfBlob,
  openPdfInNewTab,
  getCompressionHistory,
  saveCompressionHistory,
  clearCompressionHistory
} from '../utils/pdfCompressorUtils';

export default function PdfCompressorSuite({ _theme = 'dark', onNotify }) {
  // --- FILE & METADATA STATE ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBuffer, setFileBuffer] = useState(null);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [originalThumbnail, setOriginalThumbnail] = useState(null);

  // --- COMPRESSION SETTINGS STATE ---
  const [compressionMode, setCompressionMode] = useState('balanced');
  const [customOptions, setCustomOptions] = useState({
    scale: 1.5,
    quality: 0.72,
    colorMode: 'color', // 'color' | 'grayscale'
    stripMetadata: true,
    pageRange: ''
  });

  // --- PROCESSING & PROGRESS STATE ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({
    current: 0,
    total: 0,
    stage: '',
    percent: 0
  });
  const [errorMessage, setErrorMessage] = useState(null);

  // --- RESULT STATE ---
  const [compressedResult, setCompressedResult] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50); // Split slider 0 - 100%

  // --- HISTORY & DRAWER STATE ---
  const [historyList, setHistoryList] = useState(() => getCompressionHistory());
  const [showHistory, setShowHistory] = useState(false);

  // --- DRAG & DROP STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Handle File Loading
  const handleLoadPdf = useCallback(async (rawBuffer, filename = 'document.pdf') => {
    try {
      setErrorMessage(null);
      setCompressedResult(null);
      setIsProcessing(true);
      setProgressInfo({ current: 1, total: 1, stage: 'Reading document structure...', percent: 20 });

      // Always create our own dedicated clone in state to ensure it is never detached
      const safeBuffer = cloneBuffer(rawBuffer);
      const meta = await loadPdfMetadata(cloneBuffer(safeBuffer));
      setPdfMeta(meta);
      setFileBuffer(cloneBuffer(safeBuffer));
      setSelectedFile({ name: filename, size: safeBuffer.byteLength });

      // Render original page 1 preview thumbnail using a cloned copy
      const thumb = await renderPageThumbnail(cloneBuffer(safeBuffer), 1, 0.6);
      setOriginalThumbnail(thumb);

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Document Loaded',
          message: `Loaded "${filename}" (${meta.pageCount} ${meta.pageCount === 1 ? 'page' : 'pages'})`
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to read PDF document. Ensure file is not password-protected.');
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Load Failed',
          message: err.message || 'Failed to read PDF document'
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  }, [onNotify]);

  // File Input Handler
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      if (onNotify) {
        onNotify({
          type: 'warning',
          title: 'Invalid File',
          message: 'Please select a valid .pdf file.'
        });
      }
      return;
    }
    const buffer = await file.arrayBuffer();
    handleLoadPdf(buffer, file.name);
  };

  // Drag & Drop Handlers
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
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      if (onNotify) {
        onNotify({
          type: 'warning',
          title: 'Invalid File',
          message: 'Please drop a valid .pdf file.'
        });
      }
      return;
    }
    const buffer = await file.arrayBuffer();
    handleLoadPdf(buffer, file.name);
  };

  // Quick Sample Generator
  const handleLoadSample = async (type) => {
    try {
      setIsProcessing(true);
      setProgressInfo({ current: 1, total: 1, stage: `Generating sample ${type}...`, percent: 40 });
      const sampleBytes = await generateSamplePdf(type);
      const name = type === 'invoice' ? 'Sample_Business_Contract.pdf' : 'Sample_Illustrated_Report.pdf';
      await handleLoadPdf(cloneBuffer(sampleBytes), name);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create sample PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Compression
  const handleCompress = async () => {
    if (!fileBuffer || fileBuffer.byteLength === 0) {
      if (onNotify) {
        onNotify({
          type: 'warning',
          title: 'Notice',
          message: 'Please load a PDF document before compressing.'
        });
      }
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const result = await compressPdf({
        arrayBuffer: cloneBuffer(fileBuffer),
        mode: compressionMode,
        customOptions,
        onProgress: (prog) => {
          setProgressInfo(prog);
        }
      });

      setCompressedResult(result);

      // Save to local history
      saveCompressionHistory({
        filename: selectedFile?.name || 'document.pdf',
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        percentReduction: result.percentReduction,
        savedBytes: result.savedBytes,
        mode: compressionMode,
        pageCount: result.pageCount
      });
      setHistoryList(getCompressionHistory());

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Compression Complete',
          message: `Successfully reduced by ${result.percentReduction}% (${result.formattedSaved} saved)!`
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Compression failed. Please try a different preset.');
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Compression Error',
          message: err.message || 'Compression failed'
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Download Output
  const handleDownload = () => {
    if (!compressedResult) return;
    const baseName = selectedFile?.name ? selectedFile.name.replace(/\.pdf$/i, '') : 'document';
    const outputName = `${baseName}_compressed.pdf`;
    downloadPdfBlob(compressedResult.compressedBytes, outputName);
    if (onNotify) {
      onNotify({
        type: 'success',
        title: 'Download Started',
        message: `Downloaded ${outputName}`
      });
    }
  };

  // Preview in New Tab
  const handlePreview = () => {
    if (!compressedResult) return;
    openPdfInNewTab(compressedResult.compressedBytes);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action & Status Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Status & Privacy Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            Client-Side Pure
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Files never leave your browser • 100% In-Browser</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>History ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          FILE UPLOAD & DROP ZONE
         ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 scale-[0.99]'
              : 'border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 bg-slate-50/50 dark:bg-slate-900/40'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-xs border border-rose-200 dark:border-rose-900/60">
            <Upload className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {selectedFile ? 'Drop another PDF or click to replace' : 'Click to select or drag & drop a PDF document'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accepts any standard PDF. Supported modes: Scanned docs, digital resumes, reports, and portfolios.
          </p>

          {/* Quick Sample Chips */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Or try a sample:</span>
            </span>
            <button
              type="button"
              onClick={() => handleLoadSample('invoice')}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-rose-400 cursor-pointer transition-colors"
            >
              📄 Business Contract (2 pages)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('report')}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-rose-400 cursor-pointer transition-colors"
            >
              📊 Illustrated Report (3 pages)
            </button>
          </div>
        </div>

        {/* Selected File Overview Card */}
        {pdfMeta && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              {originalThumbnail ? (
                <img
                  src={originalThumbnail}
                  alt="Page 1 preview"
                  className="w-12 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-12 h-16 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-1 truncate">
                <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                  {selectedFile?.name}
                </span>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{pdfMeta.formattedSize}</span>
                  <span>•</span>
                  <span>{pdfMeta.pageCount} {pdfMeta.pageCount === 1 ? 'page' : 'pages'}</span>
                  {pdfMeta.dimensions && (
                    <>
                      <span>•</span>
                      <span>{pdfMeta.dimensions.width} × {pdfMeta.dimensions.height} pt</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompress}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compressing PDF...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Compress Document</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Live Progress Bar */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-900 dark:text-rose-200">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                <span>{progressInfo.stage || 'Optimizing document...'}</span>
              </span>
              <span className="font-mono">{progressInfo.percent}%</span>
            </div>
            <div className="w-full h-2 bg-rose-200 dark:bg-rose-900/60 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressInfo.percent}%` }}
                className="h-full bg-rose-600 rounded-full transition-all duration-300"
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
          COMPRESSION PRESET SELECTOR & TUNING SETTINGS
         ========================================================================= */}
      {fileBuffer && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>Compression Presets & Profiles</span>
            </h2>
            <span className="text-xs text-slate-400">Select target profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.values(COMPRESSION_PRESETS).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setCompressionMode(preset.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                  compressionMode === preset.id
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs ring-1 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {preset.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {preset.description}
                  </p>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full self-start ${
                  preset.badgeVariant === 'emerald'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : preset.badgeVariant === 'amber'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : preset.badgeVariant === 'blue'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : preset.badgeVariant === 'purple'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                }`}>
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Custom Settings Panel (If Custom Mode Selected) */}
          {compressionMode === 'custom' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                Custom Parameter Controls
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Quality Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                    <span>JPEG Quality</span>
                    <span className="font-mono text-rose-500">{Math.round(customOptions.quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    step="5"
                    value={Math.round(customOptions.quality * 100)}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, quality: parseInt(e.target.value, 10) / 100 }))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">Lower value yields smaller file size</span>
                </div>

                {/* Resolution / Scale Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                    <span>DPI Resolution Scale</span>
                    <span className="font-mono text-rose-500">{customOptions.scale}x ({Math.round(customOptions.scale * 72)} DPI)</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="2.0"
                    step="0.25"
                    value={customOptions.scale}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">1.0x = 72 DPI (Web), 1.5x = 108 DPI, 2.0x = 144 DPI</span>
                </div>

                {/* Color Mode Switcher */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Color Space</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomOptions(prev => ({ ...prev, colorMode: 'color' }))}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        customOptions.colorMode === 'color'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Full Color
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomOptions(prev => ({ ...prev, colorMode: 'grayscale' }))}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        customOptions.colorMode === 'grayscale'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Grayscale B&W
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Grayscale saves up to 40% additional space</span>
                </div>
              </div>

              {/* Page Range & Metadata Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Page Range (Optional, e.g. 1-3, 5)
                  </label>
                  <input
                    type="text"
                    value={customOptions.pageRange}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, pageRange: e.target.value }))}
                    placeholder="Leave empty for all pages"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="stripMetaCheck"
                    checked={customOptions.stripMetadata}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, stripMetadata: e.target.checked }))}
                    className="rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="stripMetaCheck" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    Strip non-essential metadata (Author, Producer, Creation timestamps)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          RESULTS DASHBOARD (AFTER COMPRESSION)
         ========================================================================= */}
      {compressedResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Hero Reduction Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Original Size
              </span>
              <p className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200">
                {formatBytes(compressedResult.originalSize)}
              </p>
              <span className="text-[10px] text-slate-400">Pre-compression size</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Compressed Size
              </span>
              <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatBytes(compressedResult.compressedSize)}
              </p>
              <span className="text-[10px] text-emerald-500 font-medium">Ready for download</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Bytes Saved
              </span>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {compressedResult.formattedSaved}
              </p>
              <span className="text-[10px] text-slate-400">Reduced footprint</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider block">
                Total Reduction
              </span>
              <p className="text-2xl font-black font-mono">
                -{compressedResult.percentReduction}%
              </p>
              <span className="text-[10px] text-emerald-100 font-medium">
                {compressedResult.isSmaller ? 'Optimized' : 'Lossless Retained'}
              </span>
            </div>
          </div>

          {/* Interactive Visual Comparison Slider (Before vs After) */}
          {originalThumbnail && compressedResult.previews && compressedResult.previews[0] && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-rose-500" />
                  <span>Visual Quality Inspection (Page 1 Split View)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Drag slider to compare Before (Left) vs After (Right)
                </span>
              </div>

              <div className="relative max-w-lg mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 select-none shadow-md">
                {/* After Image (Full width background) */}
                <img
                  src={compressedResult.previews[0]}
                  alt="Compressed preview"
                  className="w-full h-auto block object-contain max-h-[500px]"
                />
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600/90 text-white backdrop-blur-xs">
                  Compressed ({formatBytes(compressedResult.compressedSize)})
                </span>

                {/* Before Image (Clipped on top) */}
                <div
                  style={{ width: `${sliderPosition}%` }}
                  className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-2xl"
                >
                  <img
                    src={originalThumbnail}
                    alt="Original preview"
                    className="w-full max-w-none h-full object-cover"
                    style={{ width: '100%', height: '100%', objectPosition: 'left top' }}
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-white backdrop-blur-xs">
                    Original ({formatBytes(compressedResult.originalSize)})
                  </span>
                </div>

                {/* Divider Line & Handle */}
                <div
                  style={{ left: `${sliderPosition}%` }}
                  className="absolute inset-y-0 -ml-3 w-6 flex items-center justify-center cursor-ew-resize pointer-events-none"
                >
                  <div className="w-6 h-6 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center text-[10px] font-black">
                    ⇄
                  </div>
                </div>

                {/* Invisible input range on top for easy dragging */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(parseInt(e.target.value, 10))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Action Download & Preview Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Document ready! Saved <strong>{compressedResult.formattedSaved}</strong> with <strong>{compressedResult.mode}</strong> optimization.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePreview}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Compressed PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          HISTORY DRAWER MODAL
         ========================================================================= */}
      {showHistory && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>Recent PDF Compressions ({historyList.length})</span>
            </span>

            {historyList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearCompressionHistory();
                  setHistoryList([]);
                  if (onNotify) {
                    onNotify({
                      type: 'info',
                      title: 'History Cleared',
                      message: 'Cleared PDF compression history'
                    });
                  }
                }}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {historyList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No past compressions recorded yet.
              </div>
            ) : (
              historyList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="truncate space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {item.filename}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleString()} • {item.pageCount} pages • {item.mode}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                    <span className="text-slate-400 line-through">
                      {formatBytes(item.originalSize)}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatBytes(item.compressedSize)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      -{item.percentReduction}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
