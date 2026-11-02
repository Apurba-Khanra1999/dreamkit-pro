import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Stamp,
  Type,
  Image as ImageIcon,
  Layers,
  Download,
  Eye,
  Check,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  getPdfInfo,
  renderWatermarkPreviewCanvas,
  applyWatermarkToPdf,
  generateSampleWatermarkPdf,
  generateSampleStampDataUrl,
  getTargetPageIndices,
  TEXT_WATERMARK_PRESETS,
  GRID_POSITIONS,
  COLOR_SWATCHES,
  getWatermarkHistory,
  saveWatermarkHistory,
  clearWatermarkHistory
} from '../utils/pdfWatermarkUtils';

export default function PdfWatermarkSuite({ _theme = 'dark', onNotify }) {
  // Input Document State
  const [loadedDoc, setLoadedDoc] = useState(null); // { name, size, formattedSize, pageCount, pageWidth, pageHeight, buffer }
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ current: 0, total: 0, percent: 0, stage: '' });
  const [errorMessage, setErrorMessage] = useState(null);

  // Active Settings Tab: 'text' | 'image' | 'scope'
  const [activeTab, setActiveTab] = useState('text');

  // Text Watermark Configuration
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmFontFamily, setWmFontFamily] = useState('Helvetica-Bold');
  const [wmFontSize, setWmFontSize] = useState(50);
  const [wmColor, setWmColor] = useState('#dc2626');
  const [wmOpacity, setWmOpacity] = useState(28);
  const [wmAngle, setWmAngle] = useState(45);
  const [wmLayoutMode, setWmLayoutMode] = useState('position'); // 'position' | 'tile'
  const [wmGridPosition, setWmGridPosition] = useState('c'); // 'nw' ... 'se'
  const [wmMargin, setWmMargin] = useState(36);
  const [wmOffsetX, setWmOffsetX] = useState(0);
  const [wmOffsetY, setWmOffsetY] = useState(0);
  const [wmTileSpacingX, setWmTileSpacingX] = useState(120);
  const [wmTileSpacingY, setWmTileSpacingY] = useState(120);

  // Image Watermark Configuration
  const [selectedBuiltInStamp, setSelectedBuiltInStamp] = useState('approved');
  const [wmImageSource, setWmImageSource] = useState(() => generateSampleStampDataUrl('approved'));
  const [wmImageName, setWmImageName] = useState('Approved_Stamp.png');
  const [wmImageScale, setWmImageScale] = useState(35); // % of page width

  // Page Targeting & Scope
  const [pagesMode, setPagesMode] = useState('all'); // 'all' | 'first' | 'last' | 'odd' | 'even' | 'custom'
  const [customRange, setCustomRange] = useState('');

  // Live Canvas Preview State
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [isPreviewRendering, setIsPreviewRendering] = useState(false);

  // Result State
  const [watermarkResult, setWatermarkResult] = useState(null);
  const [historyList, setHistoryList] = useState(() => getWatermarkHistory());
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Load a PDF document buffer into state
  const handleLoadPdfBuffer = useCallback(async (buffer, filename = 'document.pdf') => {
    setIsLoadingDoc(true);
    setErrorMessage(null);
    setWatermarkResult(null);

    try {
      const info = await getPdfInfo(buffer, filename);
      setLoadedDoc(info);
      setCurrentPage(1);

      if (onNotify) {
        onNotify(`Loaded "${filename}" (${info.pageCount} ${info.pageCount === 1 ? 'page' : 'pages'})`, 'success');
      }
    } catch (err) {
      console.error('Failed to load PDF:', err);
      setErrorMessage(err.message || 'Failed to inspect PDF document. Make sure it is a valid, unencrypted PDF.');
      if (onNotify) {
        onNotify('Failed to parse PDF document.', 'error');
      }
    } finally {
      setIsLoadingDoc(false);
    }
  }, [onNotify]);

  // 1-Click Sample PDF Loader
  const handleLoadSamplePdf = useCallback(async () => {
    setIsLoadingDoc(true);
    setErrorMessage(null);
    try {
      const sample = await generateSampleWatermarkPdf();
      await handleLoadPdfBuffer(sample.buffer, sample.name);
    } catch (err) {
      console.error('Failed to create sample PDF:', err);
      setErrorMessage('Failed to generate sample document.');
    } finally {
      setIsLoadingDoc(false);
    }
  }, [handleLoadPdfBuffer]);

  // File Upload Handlers
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      handleLoadPdfBuffer(reader.result, file.name);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please drop a valid PDF file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      handleLoadPdfBuffer(reader.result, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  // Image Watermark Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedBuiltInStamp(null);
    setWmImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setWmImageSource(reader.result);
      if (onNotify) onNotify(`Uploaded stamp image "${file.name}"`, 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Select Built-in Stamp
  const handleSelectBuiltInStamp = (stampType) => {
    setSelectedBuiltInStamp(stampType);
    const url = generateSampleStampDataUrl(stampType);
    setWmImageSource(url);
    setWmImageName(`${stampType.toUpperCase()}_STAMP.png`);
  };

  // Select Text Preset
  const handleSelectPreset = (preset) => {
    setWmText(preset.text);
    setWmColor(preset.color);
    setWmOpacity(preset.opacity);
    setWmAngle(preset.angle);
    setWmFontSize(preset.size);
    if (onNotify) onNotify(`Applied preset: "${preset.label}"`, 'info');
  };

  // Render Live Preview with Debounce
  const watermarkConfig = useMemo(() => ({
    type: activeTab === 'image' ? 'image' : 'text',
    text: wmText,
    fontFamily: wmFontFamily,
    fontSize: wmFontSize,
    color: wmColor,
    opacity: wmOpacity,
    angle: wmAngle,
    layoutMode: wmLayoutMode,
    gridPosition: wmGridPosition,
    margin: wmMargin,
    offsetX: wmOffsetX,
    offsetY: wmOffsetY,
    tileSpacingX: wmTileSpacingX,
    tileSpacingY: wmTileSpacingY,
    imageSource: wmImageSource,
    imageScale: wmImageScale,
    pagesMode,
    customRange
  }), [
    activeTab,
    wmText,
    wmFontFamily,
    wmFontSize,
    wmColor,
    wmOpacity,
    wmAngle,
    wmLayoutMode,
    wmGridPosition,
    wmMargin,
    wmOffsetX,
    wmOffsetY,
    wmTileSpacingX,
    wmTileSpacingY,
    wmImageSource,
    wmImageScale,
    pagesMode,
    customRange
  ]);

  useEffect(() => {
    if (!loadedDoc?.buffer) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsPreviewRendering(true);
      try {
        const previewUrl = await renderWatermarkPreviewCanvas({
          pdfBuffer: loadedDoc.buffer,
          pageNum: currentPage,
          scale: 0.65,
          watermarkConfig
        });
        if (isMounted && previewUrl) {
          setPreviewDataUrl(previewUrl);
        }
      } catch (err) {
        console.error('Preview error:', err);
      } finally {
        if (isMounted) setIsPreviewRendering(false);
      }
    }, 60);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loadedDoc, currentPage, watermarkConfig]);

  // Process Document & Apply Watermark
  const handleApplyWatermark = async () => {
    if (!loadedDoc?.buffer) {
      setErrorMessage('Please load a PDF document first.');
      return;
    }

    if (activeTab === 'text' && !wmText.trim()) {
      setErrorMessage('Please enter watermark text.');
      return;
    }

    if (activeTab === 'image' && !wmImageSource) {
      setErrorMessage('Please select or upload a stamp image.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressInfo({ current: 0, total: loadedDoc.pageCount, percent: 0, stage: 'Preparing document...' });

    try {
      const result = await applyWatermarkToPdf(
        loadedDoc.buffer,
        watermarkConfig,
        (progress) => setProgressInfo(progress)
      );

      const downloadName = loadedDoc.name.replace(/\.[^/.]+$/, '') + '_watermarked.pdf';
      const outputResult = {
        ...result,
        filename: downloadName,
        watermarkType: activeTab === 'image' ? 'Image Stamp' : `Text: "${wmText}"`,
        blob: new Blob([result.pdfBytes], { type: 'application/pdf' })
      };

      setWatermarkResult(outputResult);

      // Save to local history
      saveWatermarkHistory({
        filename: downloadName,
        size: result.size,
        formattedSize: result.formattedSize,
        pageCount: result.pageCount,
        watermarkedPagesCount: result.watermarkedPagesCount,
        watermarkType: activeTab === 'image' ? 'Image Stamp' : `Text: "${wmText}"`
      });
      setHistoryList(getWatermarkHistory());

      if (onNotify) {
        onNotify(`Successfully watermarked ${result.watermarkedPagesCount} pages!`, 'success');
      }
    } catch (err) {
      console.error('Watermarking failed:', err);
      setErrorMessage(err.message || 'Failed to apply watermark to document.');
      if (onNotify) onNotify('Watermarking failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Trigger
  const handleDownloadResult = () => {
    if (!watermarkResult?.blob) return;
    const url = URL.createObjectURL(watermarkResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = watermarkResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Calculate targeted pages summary
  const targetIndices = loadedDoc
    ? getTargetPageIndices(pagesMode, loadedDoc.pageCount, customRange)
    : [];
  const isCurrentPageTargeted = targetIndices.includes(currentPage - 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/40 dark:border-indigo-800/40">
              <Stamp className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  PDF Watermark Studio
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Client-Side
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Stamp, brand, and protect your PDF documents with customizable diagonal security text, official seals, or tiled mosaics. 100% private in-browser vector execution.
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLoadSamplePdf}
              disabled={isLoadingDoc || isProcessing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Document</span>
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

        {/* Security & Privacy Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Server Transmission: Document remains 100% local on your device.</span>
          </div>
          {loadedDoc && (
            <div className="hidden sm:flex items-center gap-3">
              <span>Pages: <strong className="text-slate-900 dark:text-white">{loadedDoc.pageCount}</strong></span>
              <span>•</span>
              <span>Size: <strong className="text-slate-900 dark:text-white">{loadedDoc.formattedSize}</strong></span>
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

      {/* Main Workspace: If no document loaded, show Dropzone; else show Dual Pane Workspace */}
      {!loadedDoc ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all p-12 text-center flex flex-col items-center justify-center ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-[#111622]/50 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs">
            <Upload className="w-8 h-8 stroke-[1.75]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Drop your PDF document here
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Drag & drop any multi-page PDF or click to browse. Files are processed entirely in memory.
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
                handleLoadSamplePdf();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Try Sample Document
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Info Bar & Quick Preset Bar */}
          <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {loadedDoc.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {loadedDoc.pageCount} {loadedDoc.pageCount === 1 ? 'page' : 'pages'} • {loadedDoc.formattedSize}
                </div>
              </div>
            </div>

            {/* Change File button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileInputChange}
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

          {/* Quick Presets Strip */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#0c111a] border border-slate-200/60 dark:border-slate-800/60 p-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Quick Security Presets:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {TEXT_WATERMARK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('text');
                    handleSelectPreset(preset);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                    wmText === preset.text && activeTab === 'text'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Column Layout: Left = Customization Controls, Right = Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Controls Tabs */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'text'
                      ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Text Watermark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('image')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'image'
                      ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Logo / Seal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('scope')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'scope'
                      ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Pages ({targetIndices.length})</span>
                </button>
              </div>

              {/* TAB 1: TEXT WATERMARK SETTINGS */}
              {activeTab === 'text' && (
                <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                  
                  {/* Text Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={wmText}
                      onChange={(e) => setWmText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Font Family & Size */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Font Family
                      </label>
                      <select
                        value={wmFontFamily}
                        onChange={(e) => setWmFontFamily(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Helvetica-Bold">Helvetica Bold</option>
                        <option value="Helvetica">Helvetica Regular</option>
                        <option value="Times-Bold">Times New Roman Bold</option>
                        <option value="Times-Roman">Times New Roman</option>
                        <option value="Courier-Bold">Courier Bold</option>
                        <option value="Courier">Courier Regular</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Size ({wmFontSize} pt)
                        </label>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="120"
                        value={wmFontSize}
                        onChange={(e) => setWmFontSize(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Watermark Color
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap flex-1">
                        {COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={swatch.hex}
                            type="button"
                            onClick={() => setWmColor(swatch.hex)}
                            className={`w-6 h-6 rounded-full transition-transform border ${
                              wmColor.toLowerCase() === swatch.hex.toLowerCase()
                                ? 'scale-125 border-slate-900 dark:border-white shadow-xs ring-2 ring-indigo-500/50'
                                : 'border-black/10 dark:border-white/10 hover:scale-110'
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                            title={swatch.name}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={wmColor}
                        onChange={(e) => setWmColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0 bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Opacity & Rotation Sliders */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Opacity</span>
                        <span className="text-slate-500 font-mono">{wmOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={wmOpacity}
                        onChange={(e) => setWmOpacity(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Rotation Angle</span>
                        <span className="text-slate-500 font-mono">{wmAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        value={wmAngle}
                        onChange={(e) => setWmAngle(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 mt-1">
                        {[0, 30, 45, -45, 90].map((deg) => (
                          <button
                            key={deg}
                            type="button"
                            onClick={() => setWmAngle(deg)}
                            className={`px-2 py-0.5 text-2xs font-mono rounded-md border ${
                              wmAngle === deg
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Layout Mode: Single vs. Tiled Grid */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Layout Pattern</span>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={() => setWmLayoutMode('position')}
                          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                            wmLayoutMode === 'position'
                              ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          Single Stamp
                        </button>
                        <button
                          type="button"
                          onClick={() => setWmLayoutMode('tile')}
                          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                            wmLayoutMode === 'tile'
                              ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          Tiled Mosaic Grid
                        </button>
                      </div>
                    </div>

                    {wmLayoutMode === 'position' ? (
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1.5">
                            Anchor Placement:
                          </span>
                          <div className="grid grid-cols-3 gap-1.5 max-w-[180px]">
                            {GRID_POSITIONS.map((pos) => (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() => setWmGridPosition(pos.id)}
                                className={`py-1.5 text-xs font-semibold rounded-md border transition-all ${
                                  wmGridPosition === pos.id
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {pos.short}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Margin & Offsets */}
                        <div className="grid grid-cols-3 gap-2 text-2xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <div>
                            <span className="text-slate-500 block mb-0.5">Margin ({wmMargin} pt)</span>
                            <input
                              type="range"
                              min="10"
                              max="80"
                              value={wmMargin}
                              onChange={(e) => setWmMargin(parseInt(e.target.value, 10))}
                              className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                            />
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">X Offset ({wmOffsetX})</span>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={wmOffsetX}
                              onChange={(e) => setWmOffsetX(parseInt(e.target.value, 10))}
                              className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                            />
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">Y Offset ({wmOffsetY})</span>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={wmOffsetY}
                              onChange={(e) => setWmOffsetY(parseInt(e.target.value, 10))}
                              className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Tiling Spacing Controls */
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-slate-500 block mb-1">
                            Horizontal Gap ({wmTileSpacingX} pt)
                          </label>
                          <input
                            type="range"
                            min="60"
                            max="240"
                            value={wmTileSpacingX}
                            onChange={(e) => setWmTileSpacingX(parseInt(e.target.value, 10))}
                            className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-1">
                            Vertical Gap ({wmTileSpacingY} pt)
                          </label>
                          <input
                            type="range"
                            min="60"
                            max="240"
                            value={wmTileSpacingY}
                            onChange={(e) => setWmTileSpacingY(parseInt(e.target.value, 10))}
                            className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: LOGO / SEAL STAMP SETTINGS */}
              {activeTab === 'image' && (
                <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                  {/* Built-in Stamps */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Choose an Official Stamp or Upload Custom Image:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'approved', label: 'Approved', color: 'text-emerald-600' },
                        { id: 'confidential', label: 'Confidential', color: 'text-red-600' },
                        { id: 'verified', label: 'Verified', color: 'text-blue-600' },
                        { id: 'preview', label: 'Preview', color: 'text-slate-600' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectBuiltInStamp(item.id)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            selectedBuiltInStamp === item.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <Stamp className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
                          <span className="text-2xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Image Upload */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs truncate">
                        <span className="text-slate-500 block">Current Stamp:</span>
                        <strong className="text-slate-900 dark:text-white truncate block max-w-[200px]">
                          {wmImageName}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
                      >
                        Upload Custom Logo
                      </button>
                    </div>
                  </div>

                  {/* Size Scale Slider */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Stamp Size</span>
                        <span className="text-slate-500 font-mono">{wmImageScale}% of page</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={wmImageScale}
                        onChange={(e) => setWmImageScale(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Opacity</span>
                        <span className="text-slate-500 font-mono">{wmOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={wmOpacity}
                        onChange={(e) => setWmOpacity(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Rotation Angle</span>
                        <span className="text-slate-500 font-mono">{wmAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        value={wmAngle}
                        onChange={(e) => setWmAngle(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 3x3 Grid Position */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Anchor Placement:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 max-w-[180px]">
                      {GRID_POSITIONS.map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setWmGridPosition(pos.id)}
                          className={`py-1.5 text-xs font-semibold rounded-md border transition-all ${
                            wmGridPosition === pos.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {pos.short}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PAGE TARGETING & SCOPE */}
              {activeTab === 'scope' && (
                <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Target Pages
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'all', label: 'All Pages' },
                        { id: 'first', label: 'First Page Only' },
                        { id: 'last', label: 'Last Page Only' },
                        { id: 'odd', label: 'Odd Pages (1, 3, 5...)' },
                        { id: 'even', label: 'Even Pages (2, 4, 6...)' },
                        { id: 'custom', label: 'Custom Range' }
                      ].map((scope) => (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => setPagesMode(scope.id)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            pagesMode === scope.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 font-semibold text-indigo-700 dark:text-indigo-300'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          {scope.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {pagesMode === 'custom' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Enter Page Range
                      </label>
                      <input
                        type="text"
                        value={customRange}
                        onChange={(e) => setCustomRange(e.target.value)}
                        placeholder="e.g. 1-3, 5, 8"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      <span className="text-2xs text-slate-500 mt-1 block">
                        Separate pages or ranges with commas. Example: 1-2, 4
                      </span>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400">
                    Target Summary: Watermark will be applied to{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {targetIndices.length} of {loadedDoc.pageCount}
                    </strong>{' '}
                    pages.
                  </div>
                </div>
              )}

              {/* PRIMARY ACTION BUTTON */}
              <button
                type="button"
                onClick={handleApplyWatermark}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying Watermark ({progressInfo.percent}%)...</span>
                  </>
                ) : (
                  <>
                    <Stamp className="w-4 h-4" />
                    <span>Apply Watermark to PDF</span>
                  </>
                )}
              </button>

              {/* Processing Progress Bar */}
              {isProcessing && (
                <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex justify-between text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    <span>{progressInfo.stage || 'Watermarking pages...'}</span>
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

            {/* RIGHT COLUMN: Live Interactive Document Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                
                {/* Preview Header & Page Nav */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Live Document Preview
                    </h3>
                    {isCurrentPageTargeted ? (
                      <span className="px-2 py-0.5 text-2xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Watermarked Page
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-2xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Excluded from Watermark
                      </span>
                    )}
                  </div>

                  {/* Page Stepper */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1 || isPreviewRendering}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[70px] text-center">
                      {currentPage} / {loadedDoc.pageCount}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= loadedDoc.pageCount || isPreviewRendering}
                      onClick={() => setCurrentPage((p) => Math.min(loadedDoc.pageCount, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Canvas Render Frame */}
                <div className="relative min-h-[460px] max-h-[620px] rounded-xl bg-slate-100 dark:bg-[#0c111a] border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center p-4 overflow-auto">
                  {isPreviewRendering && !previewDataUrl && (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span className="text-xs">Rendering preview...</span>
                    </div>
                  )}

                  {previewDataUrl && (
                    <div className="relative shadow-lg rounded-sm overflow-hidden bg-white max-w-full">
                      <img
                        src={previewDataUrl}
                        alt={`Page ${currentPage} preview`}
                        className="max-h-[580px] w-auto object-contain block select-none"
                      />
                    </div>
                  )}

                  {/* Rendering overlay pulse */}
                  {isPreviewRendering && previewDataUrl && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-2xs font-mono flex items-center gap-1.5 shadow-xs">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  )}
                </div>

                {/* Preview Footer details */}
                <div className="mt-3 flex items-center justify-between text-2xs text-slate-400 dark:text-slate-500">
                  <span>Interactive high-fidelity canvas inspection</span>
                  <span>{loadedDoc.pageWidth} × {loadedDoc.pageHeight} pt</span>
                </div>
              </div>
            </div>

          </div>

          {/* SUCCESS / DOWNLOAD DASHBOARD */}
          {watermarkResult && (
            <div className="rounded-2xl bg-white dark:bg-[#111622] border border-emerald-200 dark:border-emerald-800/80 shadow-md p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Watermarked PDF Ready!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Successfully applied {watermarkResult.watermarkType} across {watermarkResult.watermarkedPagesCount} pages.
                    </p>
                  </div>
                </div>

                {/* Primary Download Action */}
                <button
                  type="button"
                  onClick={handleDownloadResult}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Watermarked PDF</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500 block mb-0.5">Original Size</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {watermarkResult.formattedOriginalSize}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500 block mb-0.5">Output Size</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {watermarkResult.formattedSize}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500 block mb-0.5">Total Pages</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {watermarkResult.pageCount}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500 block mb-0.5">Pages Watermarked</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 text-sm">
                    {watermarkResult.watermarkedPagesCount}
                  </strong>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* RECENT WATERMARK HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <History className="w-4 h-4 text-indigo-500" />
                <span>Recent Watermarking Tasks</span>
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
                No recent watermarking tasks found.
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
                        {item.watermarkType} • {item.formattedSize}
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
                    clearWatermarkHistory();
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
