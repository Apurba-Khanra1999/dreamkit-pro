import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Contrast,
  SunMedium,
  Sliders,
  Printer,
  Sparkles,
  ShieldCheck,
  History,
  Download,
  RefreshCw,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Upload,
  Trash2,
  ArrowRight,
  Gauge,
  ZoomIn,
  Split,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import {
  GRAYSCALE_MODES,
  DPI_PRESETS,
  getPdfGrayscaleInfo,
  renderPdfPageToCanvas,
  convertPdfToGrayscale,
  generateSampleColorPdf,
  getGrayscaleHistory,
  saveGrayscaleHistory,
  clearGrayscaleHistory
} from '../utils/pdfGrayscaleUtils';

export default function PdfGrayscaleSuite({ _theme = 'dark', onNotify }) {
  // Document State
  const [loadedDoc, setLoadedDoc] = useState(null); // { name, size, formattedSize, pageCount, pages, firstPageWidth, firstPageHeight, buffer }
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Conversion Options
  const [selectedMode, setSelectedMode] = useState('rec709');
  const [contrast, setContrast] = useState(0); // -50 to +50
  const [brightness, setBrightness] = useState(0); // -50 to +50
  const [dpi, setDpi] = useState(150); // 72, 150, 300
  const [jpegQuality, setJpegQuality] = useState(88); // 60 to 100
  const [pageRange, setPageRange] = useState('all'); // 'all' | 'first' | 'last' | 'custom'
  const [customPages, setCustomPages] = useState('');

  // Live Preview State
  const [previewViewMode, setPreviewViewMode] = useState('split'); // 'split' | 'grayscale' | 'original'
  const [colorPreviewUrl, setColorPreviewUrl] = useState(null);
  const [grayscalePreviewUrl, setGrayscalePreviewUrl] = useState(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100); // 100%

  // Conversion Processing State
  const [isConverting, setIsConverting] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ current: 0, total: 0, percent: 0, stage: '' });
  const [conversionResult, setConversionResult] = useState(null);

  // History State
  const [historyList, setHistoryList] = useState(() => getGrayscaleHistory());
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Drag and Drop Ref
  const fileInputRef = useRef(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Load PDF Buffer
  const handleLoadPdfBuffer = useCallback(async (buffer, filename = 'document.pdf') => {
    setIsLoadingDoc(true);
    setErrorMessage(null);
    setConversionResult(null);
    setColorPreviewUrl(null);
    setGrayscalePreviewUrl(null);

    try {
      const info = await getPdfGrayscaleInfo(buffer, filename);
      setLoadedDoc(info);
      setCurrentPage(1);

      if (onNotify) {
        onNotify(`Loaded "${filename}" (${info.pageCount} ${info.pageCount === 1 ? 'page' : 'pages'})`, 'success');
      }
    } catch (err) {
      console.error('Failed to load PDF for grayscale conversion:', err);
      setErrorMessage(err.message || 'Failed to inspect PDF document.');
      if (onNotify) onNotify('Failed to inspect PDF document.', 'error');
    } finally {
      setIsLoadingDoc(false);
    }
  }, [onNotify]);

  // Load Built-in Vibrant Color Sample PDF
  const handleLoadSamplePdf = useCallback(async () => {
    setIsLoadingDoc(true);
    setErrorMessage(null);
    try {
      const sample = await generateSampleColorPdf();
      await handleLoadPdfBuffer(sample.buffer, sample.name);
    } catch (err) {
      console.error('Failed to generate sample PDF:', err);
      setErrorMessage('Failed to generate sample PDF.');
    } finally {
      setIsLoadingDoc(false);
    }
  }, [handleLoadPdfBuffer]);

  // Handle User File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      if (onNotify) onNotify('Please select a valid PDF file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      handleLoadPdfBuffer(event.target.result, file.name);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read uploaded file.');
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        if (onNotify) onNotify('Please drop a valid PDF file.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        handleLoadPdfBuffer(event.target.result, file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Render Page Preview (Color & Grayscale) whenever Page, Mode, Contrast, or Brightness changes
  useEffect(() => {
    if (!loadedDoc?.buffer) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsRenderingPreview(true);
      try {
        // Render Color Preview
        const colorResult = await renderPdfPageToCanvas(loadedDoc.buffer, currentPage, 1.25, null);
        if (!isMounted) return;
        if (colorResult) {
          setColorPreviewUrl(colorResult.dataUrl);
        }

        // Render Grayscale Preview
        const grayResult = await renderPdfPageToCanvas(loadedDoc.buffer, currentPage, 1.25, {
          mode: selectedMode,
          contrast,
          brightness
        });
        if (!isMounted) return;
        if (grayResult) {
          setGrayscalePreviewUrl(grayResult.dataUrl);
        }
      } catch (err) {
        console.error('Failed to render preview canvas:', err);
      } finally {
        if (isMounted) setIsRenderingPreview(false);
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loadedDoc, currentPage, selectedMode, contrast, brightness]);

  // Execute Grayscale Conversion on Entire PDF
  const handleConvertPdf = async () => {
    if (!loadedDoc?.buffer) return;

    setIsConverting(true);
    setProgressInfo({ current: 0, total: loadedDoc.pageCount, percent: 0, stage: 'Preparing document...' });

    try {
      const result = await convertPdfToGrayscale(
        loadedDoc.buffer,
        {
          mode: selectedMode,
          contrast,
          brightness,
          dpi,
          jpegQuality,
          pageRange,
          customPages
        },
        (prog) => {
          setProgressInfo(prog);
        }
      );

      setConversionResult(result);

      // Save to localStorage history
      const historyItem = {
        name: loadedDoc.name,
        originalSize: loadedDoc.formattedSize,
        grayscaleSize: result.formattedSize,
        compressionRatio: result.compressionRatio,
        pageCount: loadedDoc.pageCount,
        convertedPagesCount: result.convertedPagesCount,
        mode: selectedMode,
        dpi
      };
      saveGrayscaleHistory(historyItem);
      setHistoryList(getGrayscaleHistory());

      if (onNotify) {
        onNotify(`Successfully converted to grayscale (${result.formattedSize})`, 'success');
      }
    } catch (err) {
      console.error('Conversion failed:', err);
      if (onNotify) onNotify(err.message || 'Grayscale conversion failed.', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  // Download Converted Grayscale PDF
  const handleDownload = () => {
    if (!conversionResult?.pdfBytes) return;

    const blob = new Blob([conversionResult.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = loadedDoc?.name?.replace(/\.pdf$/i, '') || 'document';
    a.href = url;
    a.download = `${baseName}_grayscale_${selectedMode}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onNotify) onNotify('Grayscale PDF downloaded.', 'info');
  };

  // Open Preview of Converted PDF in a new browser tab
  const handleOpenInNewTab = () => {
    if (!conversionResult?.pdfBytes) return;
    const blob = new Blob([conversionResult.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Clear History
  const handleClearHistory = () => {
    clearGrayscaleHistory();
    setHistoryList([]);
    if (onNotify) onNotify('Conversion history cleared.', 'info');
  };

  // Current active mode details
  const activeModeDetails = useMemo(() => {
    return GRAYSCALE_MODES.find((m) => m.id === selectedMode) || GRAYSCALE_MODES[0];
  }, [selectedMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Action & Status Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Status & Privacy Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            Toner Saver & Archival
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Local & Private • Zero Server Uploads</span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
            title="Conversion History"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>History</span>
            {historyList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-500 text-white font-mono">
                {historyList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Configuration Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Upload / Loaded Card */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Source Document</span>
              </h2>
              {loadedDoc && (
                <button
                  onClick={() => setLoadedDoc(null)}
                  className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {!loadedDoc ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDraggingFile
                    ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Click to upload or drag & drop PDF
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Works 100% in your browser. Files are never uploaded to any server.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSamplePdf();
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Try Vibrant Color Sample (3-Page Report)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {loadedDoc.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {loadedDoc.formattedSize}
                      </span>
                      <span>•</span>
                      <span>
                        {loadedDoc.pageCount} {loadedDoc.pageCount === 1 ? 'Page' : 'Pages'}
                      </span>
                      <span>•</span>
                      <span>
                        {loadedDoc.firstPageWidth} × {loadedDoc.firstPageHeight} pt
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span>Selected document ready for conversion</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Replace Document
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {isLoadingDoc && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-indigo-600 dark:text-indigo-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading and analyzing PDF document...</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Grayscale Mode Selection */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Conversion Algorithm</span>
              </label>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {activeModeDetails.tag}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GRAYSCALE_MODES.map((mode) => {
                const isSelected = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`text-left p-3 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-900 dark:text-white shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {mode.name.split(' (')[0]}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {mode.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contrast & Brightness Tuning Sliders */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <SunMedium className="w-4 h-4 text-amber-500" />
                <span>Tone & Contrast Enhancement</span>
              </label>
              {(contrast !== 0 || brightness !== 0) && (
                <button
                  onClick={() => {
                    setContrast(0);
                    setBrightness(0);
                  }}
                  className="text-xs text-indigo-500 hover:underline font-medium"
                >
                  Reset Defaults
                </button>
              )}
            </div>

            {/* Contrast Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Contrast Boost</span>
                <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">
                  {contrast > 0 ? `+${contrast}` : contrast}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Softer (-50)</span>
                <span>Normal (0)</span>
                <span>Punchy (+50)</span>
              </div>
            </div>

            {/* Brightness Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Brightness Adjustment</span>
                <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">
                  {brightness > 0 ? `+${brightness}` : brightness}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Darker (-50)</span>
                <span>Default (0)</span>
                <span>Brighter (+50)</span>
              </div>
            </div>
          </div>

          {/* Quality & Resolution Settings */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-500" />
                <span>Output Resolution & Compression</span>
              </label>
            </div>

            {/* DPI Preset Selector */}
            <div className="space-y-2">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block">
                Rendering DPI
              </span>
              <div className="grid grid-cols-3 gap-2">
                {DPI_PRESETS.map((preset) => {
                  const isSelected = dpi === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setDpi(preset.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <p className="text-xs font-bold">{preset.id} DPI</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{preset.label.split(' ')[1] || 'Standard'}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* JPEG Quality Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">JPEG Quality</span>
                <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">
                  {jpegQuality}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                value={jpegQuality}
                onChange={(e) => setJpegQuality(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Small File (60%)</span>
                <span>Standard (88%)</span>
                <span>Maximum (100%)</span>
              </div>
            </div>

            {/* Page Range Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="text-xs text-slate-600 dark:text-slate-300 font-medium block">
                Page Scope
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'all', label: 'All Pages' },
                  { id: 'first', label: 'First' },
                  { id: 'last', label: 'Last' },
                  { id: 'custom', label: 'Custom' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPageRange(item.id)}
                    className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-all ${
                      pageRange === item.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {pageRange === 'custom' && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={customPages}
                    onChange={(e) => setCustomPages(e.target.value)}
                    placeholder="e.g. 1, 3-5, 8"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Specify comma-separated pages or ranges.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div>
            <button
              type="button"
              disabled={!loadedDoc || isConverting}
              onClick={handleConvertPdf}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                !loadedDoc || isConverting
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 active:scale-[0.99]'
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Converting PDF to Grayscale...</span>
                </>
              ) : (
                <>
                  <Contrast className="w-4 h-4" />
                  <span>
                    Convert {loadedDoc ? `(${loadedDoc.pageCount} ${loadedDoc.pageCount === 1 ? 'page' : 'pages'})` : 'to Grayscale'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Conversion Progress Bar */}
          {isConverting && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-indigo-500/30 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {progressInfo.stage || 'Processing document...'}
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {progressInfo.percent}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-200 ease-out rounded-full"
                  style={{ width: `${progressInfo.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 text-right">
                Page {progressInfo.current} of {progressInfo.total}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Visual Before & After Inspector & Results */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Preview Card */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Side-by-Side Visual Preview
                </h2>
                {isRenderingPreview && (
                  <span className="flex items-center gap-1 text-[11px] text-indigo-500">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Rendering...</span>
                  </span>
                )}
              </div>

              {/* View Mode Toggle: Split vs Grayscale vs Original */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('split')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                    previewViewMode === 'split'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Side-by-side comparison"
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Split Comparison</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('grayscale')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    previewViewMode === 'grayscale'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Grayscale Only
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('original')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    previewViewMode === 'original'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Original Color
                </button>
              </div>
            </div>

            {/* Canvas / Image Display Container */}
            <div className="min-h-[380px] bg-slate-100 dark:bg-[#0c1017] rounded-xl border border-slate-200 dark:border-slate-800/80 p-4 flex items-center justify-center relative overflow-hidden">
              {!loadedDoc ? (
                <div className="text-center p-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center mx-auto text-slate-400">
                    <Contrast className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Upload a PDF or select the vibrant sample to inspect real-time grayscale preview
                  </p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  {/* Split View */}
                  {previewViewMode === 'split' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {/* Left: Original Full-Color */}
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center justify-between w-full px-1">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Original Color
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                            Full RGB
                          </span>
                        </div>
                        <div className="w-full bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center overflow-auto max-h-[500px]">
                          {colorPreviewUrl ? (
                            <img
                              src={colorPreviewUrl}
                              alt="Original Color Preview"
                              className="max-h-[460px] object-contain rounded shadow-sm transition-transform duration-200"
                              style={{ transform: `scale(${previewZoom / 100})` }}
                            />
                          ) : (
                            <div className="py-20 text-xs text-slate-400 flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Loading original color...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Converted Grayscale Output */}
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center justify-between w-full px-1">
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            Grayscale Output
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                            {activeModeDetails.name.split(' (')[0]}
                          </span>
                        </div>
                        <div className="w-full bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center overflow-auto max-h-[500px]">
                          {grayscalePreviewUrl ? (
                            <img
                              src={grayscalePreviewUrl}
                              alt="Grayscale Converted Preview"
                              className="max-h-[460px] object-contain rounded shadow-sm transition-transform duration-200"
                              style={{ transform: `scale(${previewZoom / 100})` }}
                            />
                          ) : (
                            <div className="py-20 text-xs text-slate-400 flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Applying {activeModeDetails.name}...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Single Grayscale View */}
                  {previewViewMode === 'grayscale' && (
                    <div className="w-full flex flex-col items-center space-y-2">
                      <div className="flex items-center justify-between w-full px-2">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          Grayscale Preview ({activeModeDetails.name})
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-3 max-h-[520px] overflow-auto">
                        {grayscalePreviewUrl ? (
                          <img
                            src={grayscalePreviewUrl}
                            alt="Grayscale Preview"
                            className="max-h-[480px] object-contain rounded shadow-sm"
                            style={{ transform: `scale(${previewZoom / 100})` }}
                          />
                        ) : (
                          <div className="py-24 text-xs text-slate-400 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Rendering preview...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Single Original View */}
                  {previewViewMode === 'original' && (
                    <div className="w-full flex flex-col items-center space-y-2">
                      <div className="flex items-center justify-between w-full px-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Original Color Document
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-3 max-h-[520px] overflow-auto">
                        {colorPreviewUrl ? (
                          <img
                            src={colorPreviewUrl}
                            alt="Original Color Preview"
                            className="max-h-[480px] object-contain rounded shadow-sm"
                            style={{ transform: `scale(${previewZoom / 100})` }}
                          />
                        ) : (
                          <div className="py-24 text-xs text-slate-400 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Rendering original...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Page Stepper & Preview Zoom Controls */}
            {loadedDoc && (
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isRenderingPreview}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-medium text-slate-700 dark:text-slate-300 px-1">
                    Page <span className="font-bold">{currentPage}</span> of {loadedDoc.pageCount}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= loadedDoc.pageCount || isRenderingPreview}
                    onClick={() => setCurrentPage((p) => Math.min(loadedDoc.pageCount, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Zoom:</span>
                  {[75, 100, 125].map((z) => (
                    <button
                      key={z}
                      onClick={() => setPreviewZoom(z)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                        previewZoom === z
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {z}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversion Success Dashboard */}
          {conversionResult && (
            <div className="bg-white dark:bg-[#111622] rounded-2xl border border-indigo-500/40 p-6 shadow-md space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Conversion Complete</span>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Ready
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Your document has been re-rendered and compacted into clean monochrome/grayscale PDF.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Grayscale PDF</span>
                  </button>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">Original Size</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {conversionResult.formattedOriginalSize}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">Grayscale Size</p>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {conversionResult.formattedSize}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">Size Optimization</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {conversionResult.compressionRatio}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">Pages Converted</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {conversionResult.convertedPagesCount} / {conversionResult.pageCount}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Grayscale Conversions
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {historyList.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {historyList.length === 0 ? (
                <div className="py-12 text-center space-y-2 text-slate-400 text-xs">
                  <History className="w-8 h-8 mx-auto opacity-30" />
                  <p>No conversion history recorded yet.</p>
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{item.pageCount} pages</span>
                        <span>•</span>
                        <span className="font-medium text-indigo-500">{item.mode}</span>
                        <span>•</span>
                        <span>{item.dpi} DPI</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-slate-400 line-through">{item.originalSize}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-500 font-bold">{item.grayscaleSize}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{item.compressionRatio}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
