import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Contrast,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  FileArchive,
  AlertCircle,
  Zap,
  Info,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Split,
  Columns,
  Layers,
  BarChart2,
  SlidersHorizontal
} from 'lucide-react';
import {
  GRAYSCALE_METHODS,
  TONING_PRESETS,
  formatBytes,
  convertToGrayscale,
  createGrayscaleSampleImage,
  downloadBlob
} from '../utils/imageGrayscaleUtils';
import { createZipArchive } from '../utils/imageCompressorUtils';

export default function ImageGrayscaleSuite({ _theme = 'dark', onNotify }) {
  // Navigation tabs: 'single' | 'bulk' | 'guide'
  const [activeTab, setActiveTab] = useState('single');

  // --- SINGLE MODE STATE ---
  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState(null);
  const [sourceDimensions, setSourceDimensions] = useState({ width: 0, height: 0 });
  const [processedResult, setProcessedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderError, setRenderError] = useState(null);

  // Conversion Settings
  const [method, setMethod] = useState('rec709');
  const [intensity, setIntensity] = useState(100); // 0 to 100%
  const [contrast, setContrast] = useState(0); // -100 to +100
  const [brightness, setBrightness] = useState(0); // -100 to +100
  const [gamma, setGamma] = useState(1.0); // 0.2 to 2.5
  const [thresholdValue, setThresholdValue] = useState(128); // 0 to 255
  const [toning, setToning] = useState('none'); // 'none', 'sepia', etc.
  const [vignette, setVignette] = useState(0); // 0 to 100%
  const [filmGrain, setFilmGrain] = useState(0); // 0 to 100%

  // Output Format Settings
  const [outputFormat, setOutputFormat] = useState('image/png'); // 'image/png' | 'image/jpeg' | 'image/webp'
  const [outputQuality, setOutputQuality] = useState(90);

  // Viewport & Inspection Settings
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'side-by-side' | 'grayscale'
  const [splitPos, setSplitPos] = useState(50); // percentage 0 to 100
  const [zoomLevel, setZoomLevel] = useState('fit'); // 'fit' | '100' | '150'
  const [showHistogram, setShowHistogram] = useState(false);
  const [copied, setCopied] = useState(false);

  const splitSliderRef = useRef(null);
  const isDraggingSplit = useRef(false);

  // --- BULK MODE STATE ---
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, isRunning: false });
  const [isZipping, setIsZipping] = useState(false);

  // Drag over states
  const [isDraggingSingle, setIsDraggingSingle] = useState(false);
  const [isDraggingBulk, setIsDraggingBulk] = useState(false);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
      if (processedResult?.url) URL.revokeObjectURL(processedResult.url);
      bulkQueue.forEach(item => {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      });
    };
  }, [sourcePreviewUrl, processedResult, bulkQueue]);

  // Load single image handler
  const handleSingleFileSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please select a valid image file (PNG, JPEG, WebP, etc.).', 'error');
      return;
    }

    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    const url = URL.createObjectURL(file);
    setSourceFile(file);
    setSourcePreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  }, [sourcePreviewUrl, onNotify]);

  // Load synthetic sample image
  const handleLoadDemoImage = async (type = 'landscape') => {
    try {
      setIsProcessing(true);
      const demoFile = await createGrayscaleSampleImage(type);
      handleSingleFileSelect(demoFile);
      if (onNotify) onNotify(`Loaded colorful ${type} sample!`, 'info');
    } catch {
      if (onNotify) onNotify('Failed to load sample image', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-render single grayscale image whenever settings change
  const renderSingleGrayscale = useCallback(async () => {
    if (!sourceFile) return;

    setIsProcessing(true);
    setRenderError(null);

    try {
      const opts = {
        method,
        intensity: Number(intensity),
        contrast: Number(contrast),
        brightness: Number(brightness),
        gamma: Number(gamma),
        thresholdValue: Number(thresholdValue),
        toning,
        vignette: Number(vignette),
        filmGrain: Number(filmGrain),
        format: outputFormat,
        quality: Number(outputQuality) / 100,
      };

      const result = await convertToGrayscale(sourceFile, opts);
      setProcessedResult(result);
    } catch (err) {
      setRenderError(err?.message || 'Failed to convert image');
      if (onNotify) onNotify(err?.message || 'Conversion failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [
    sourceFile,
    method,
    intensity,
    contrast,
    brightness,
    gamma,
    thresholdValue,
    toning,
    vignette,
    filmGrain,
    outputFormat,
    outputQuality,
    onNotify
  ]);

  // Debounced auto-render when settings update
  useEffect(() => {
    if (!sourceFile) return;
    const timer = setTimeout(() => {
      renderSingleGrayscale();
    }, 100);
    return () => clearTimeout(timer);
  }, [renderSingleGrayscale, sourceFile]);

  // Split-screen mouse/touch slider logic
  const handleSplitMove = useCallback((clientX) => {
    if (!splitSliderRef.current) return;
    const rect = splitSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = Math.round((x / rect.width) * 100);
    setSplitPos(percentage);
  }, []);

  const handlePointerDown = () => {
    isDraggingSplit.current = true;
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingSplit.current) return;
      handleSplitMove(e.clientX);
    };

    const handlePointerUp = () => {
      isDraggingSplit.current = false;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handleSplitMove]);

  // Copy grayscale image to clipboard
  const handleCopyToClipboard = async () => {
    if (!processedResult?.blob) return;
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        let clipBlob = processedResult.blob;
        if (processedResult.format !== 'image/png') {
          const pngRes = await convertToGrayscale(sourceFile, {
            method,
            intensity: Number(intensity),
            contrast: Number(contrast),
            brightness: Number(brightness),
            gamma: Number(gamma),
            thresholdValue: Number(thresholdValue),
            toning,
            vignette: Number(vignette),
            filmGrain: Number(filmGrain),
            format: 'image/png',
          });
          clipBlob = pngRes.blob;
        }
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': clipBlob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onNotify) onNotify('Grayscale image copied to clipboard!', 'success');
      } else {
        throw new Error('ClipboardItem API not supported');
      }
    } catch {
      if (onNotify) onNotify('Clipboard copy failed. Please download the image.', 'error');
    }
  };

  // Download single result
  const handleDownloadSingle = () => {
    if (!processedResult?.blob) return;
    downloadBlob(processedResult.blob, processedResult.name);
    if (onNotify) onNotify(`Downloaded ${processedResult.name}`, 'success');
  };

  // --- BULK BATCH LOGIC ---
  const handleBulkFilesSelect = (fileList) => {
    const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!validFiles.length) {
      if (onNotify) onNotify('Please select valid image files.', 'error');
      return;
    }

    const newItems = validFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      name: file.name,
      size: file.size,
      originalUrl: URL.createObjectURL(file),
      status: 'pending',
      result: null,
      error: null,
    }));

    setBulkQueue(prev => [...prev, ...newItems]);
    if (onNotify) onNotify(`Added ${validFiles.length} image(s) to batch queue`, 'info');
  };

  // Process all items in bulk queue
  const processBulkQueue = async () => {
    if (!bulkQueue.length || bulkProgress.isRunning) return;

    setBulkProgress({ current: 0, total: bulkQueue.length, isRunning: true });

    const opts = {
      method,
      intensity: Number(intensity),
      contrast: Number(contrast),
      brightness: Number(brightness),
      gamma: Number(gamma),
      thresholdValue: Number(thresholdValue),
      toning,
      vignette: Number(vignette),
      filmGrain: Number(filmGrain),
      format: outputFormat,
      quality: Number(outputQuality) / 100,
    };

    const updatedQueue = [...bulkQueue];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (item.status === 'done') {
        setBulkProgress(prev => ({ ...prev, current: i + 1 }));
        continue;
      }

      item.status = 'processing';
      setBulkQueue([...updatedQueue]);

      try {
        const res = await convertToGrayscale(item.file, opts);
        item.status = 'done';
        item.result = res;
      } catch (err) {
        item.status = 'error';
        item.error = err?.message || 'Processing failed';
      }

      setBulkProgress({ current: i + 1, total: updatedQueue.length, isRunning: true });
      setBulkQueue([...updatedQueue]);
    }

    setBulkProgress(prev => ({ ...prev, isRunning: false }));
    if (onNotify) onNotify('Batch conversion completed!', 'success');
  };

  // Download all as ZIP
  const handleDownloadBulkZip = async () => {
    const finishedItems = bulkQueue.filter(item => item.status === 'done' && item.result?.blob);
    if (!finishedItems.length) {
      if (onNotify) onNotify('No converted images ready to download.', 'error');
      return;
    }

    setIsZipping(true);
    try {
      const zipFiles = finishedItems.map(item => ({
        name: item.result.name,
        blob: item.result.blob,
      }));

      const zipBlob = await createZipArchive(zipFiles);
      downloadBlob(zipBlob, `grayscale-images-${Date.now()}.zip`);
      if (onNotify) onNotify(`Downloaded batch ZIP with ${finishedItems.length} images!`, 'success');
    } catch (err) {
      if (onNotify) onNotify(`Failed to create ZIP: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsZipping(false);
    }
  };

  // Clear Bulk Queue
  const clearBulkQueue = () => {
    bulkQueue.forEach(item => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    });
    setBulkQueue([]);
    setBulkProgress({ current: 0, total: 0, isRunning: false });
  };

  // Load sample batch
  const handleLoadSampleBatch = async () => {
    try {
      const s1 = await createGrayscaleSampleImage('landscape');
      const s2 = await createGrayscaleSampleImage('portrait');
      const s3 = await createGrayscaleSampleImage('abstract');
      handleBulkFilesSelect([s1, s2, s3]);
      if (onNotify) onNotify('Loaded 3 sample images for batch processing', 'info');
    } catch {
      if (onNotify) onNotify('Failed to load sample batch', 'error');
    }
  };

  // Apply one-click preset template
  const applyPresetTemplate = (preset) => {
    if (preset.method) setMethod(preset.method);
    if (preset.contrast !== undefined) setContrast(preset.contrast);
    if (preset.brightness !== undefined) setBrightness(preset.brightness);
    if (preset.gamma !== undefined) setGamma(preset.gamma);
    if (preset.toning) setToning(preset.toning);
    if (preset.vignette !== undefined) setVignette(preset.vignette);
    if (preset.filmGrain !== undefined) setFilmGrain(preset.filmGrain);
    if (preset.intensity !== undefined) setIntensity(preset.intensity);
    if (preset.thresholdValue !== undefined) setThresholdValue(preset.thresholdValue);
    setActiveTab('single');
    if (onNotify) onNotify(`Applied "${preset.name}" preset!`, 'success');
  };

  // Reset adjustments
  const handleResetAdjustments = () => {
    setContrast(0);
    setBrightness(0);
    setGamma(1.0);
    setToning('none');
    setVignette(0);
    setFilmGrain(0);
    setIntensity(100);
    setThresholdValue(128);
    if (onNotify) onNotify('Tone adjustments reset to default.', 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Mode Tab Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'single'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Contrast className="w-3.5 h-3.5" />
            <span>Single Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Convert</span>
            {bulkQueue.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                {bulkQueue.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets & Guides</span>
          </button>
        </div>

        {/* Client-Side Processing Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero Server Uploads • 100% In-Browser</span>
        </div>
      </div>

      {/* GLOBAL ACTIVE IMAGE STATUS BAR (WHEN SINGLE FILE IS LOADED) */}
      {sourceFile && activeTab === 'single' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 text-xs shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
              <img src={sourcePreviewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{sourceFile.name}</span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              {sourceDimensions.width} × {sourceDimensions.height} px
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              {formatBytes(sourceFile.size)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="change-source-file-input"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change Image</span>
              <input
                id="change-source-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSingleFileSelect(e.target.files[0]);
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setSourceFile(null);
                if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
                setSourcePreviewUrl(null);
                setProcessedResult(null);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Clear Image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE GRAYSCALE STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'single' && (
        <>
          {/* EMPTY STATE / DROPZONE */}
          {!sourceFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingSingle(true);
              }}
              onDragLeave={() => setIsDraggingSingle(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingSingle(false);
                if (e.dataTransfer.files?.[0]) handleSingleFileSelect(e.dataTransfer.files[0]);
              }}
              onClick={() => document.getElementById('single-file-upload')?.click()}
              className={`relative flex flex-col items-center justify-center p-8 sm:p-14 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
                isDraggingSingle
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-400 dark:hover:border-indigo-600'
              }`}
            >
              <input
                id="single-file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSingleFileSelect(e.target.files[0]);
                }}
              />
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
                Drop an image here, or browse from computer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                Supports PNG, JPG, WebP, SVG, AVIF • Processed 100% in-browser with fine tone grading
              </p>

              <div
                className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-slate-400">Quick Test:</span>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('landscape')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  Sunset Mountain
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('portrait')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  Studio Portrait
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('abstract')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  Geometric Abstract
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: VIEWPORT & STATS (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                {renderError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{renderError}</span>
                  </div>
                )}

                {/* VIEWPORT CONTROLS HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
                  <div className="flex items-center gap-2">
                    {/* View Modes */}
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                          viewMode === 'split'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Split</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('side-by-side')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                          viewMode === 'side-by-side'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Side-by-Side</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('grayscale')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                          viewMode === 'grayscale'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Contrast className="w-3.5 h-3.5" />
                        <span>Grayscale Only</span>
                      </button>
                    </div>

                    {isProcessing && (
                      <span className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Processing...</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Histogram Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowHistogram(prev => !prev)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                        showHistogram
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Toggle Luminance Histogram"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Histogram</span>
                    </button>

                    {/* Zoom Controls */}
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setZoomLevel('fit')}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                          zoomLevel === 'fit'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Fit
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel('100')}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                          zoomLevel === '100'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        100%
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel('150')}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                          zoomLevel === '150'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        150%
                      </button>
                    </div>
                  </div>
                </div>

                {/* MAIN STAGE VIEWPORT CONTAINER */}
                <div
                  ref={splitSliderRef}
                  className="relative rounded-2xl overflow-hidden bg-slate-900 dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 shadow-md min-h-[440px] max-h-[640px] flex items-center justify-center select-none"
                >
                  {/* 1. SPLIT VIEW MODE */}
                  {viewMode === 'split' && (
                    <div className="relative w-full h-full min-h-[440px] flex items-center justify-center overflow-hidden">
                      {/* Grayscale Base Image (Right / Underneath) */}
                      {processedResult?.url ? (
                        <img
                          src={processedResult.url}
                          alt="Grayscale preview"
                          className={`max-h-[540px] max-w-full object-contain pointer-events-none transition-transform duration-150 ${
                            zoomLevel === '150' ? 'scale-150 transform-gpu' : ''
                          }`}
                        />
                      ) : (
                        <img
                          src={sourcePreviewUrl}
                          alt="Original preview"
                          className="max-h-[540px] max-w-full object-contain pointer-events-none"
                        />
                      )}

                      {/* Original Color Image (Left / Clipped overlay via CSS clipPath) */}
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
                        style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                      >
                        <img
                          src={sourcePreviewUrl}
                          alt="Original full"
                          className={`max-h-[540px] max-w-full object-contain pointer-events-none transition-transform duration-150 ${
                            zoomLevel === '150' ? 'scale-150 transform-gpu' : ''
                          }`}
                        />
                      </div>

                      {/* Draggable Divider Line */}
                      <div
                        className="absolute top-0 bottom-0 z-20 pointer-events-none"
                        style={{ left: `${splitPos}%` }}
                      >
                        <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] relative -left-px">
                          <div
                            onPointerDown={handlePointerDown}
                            className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-7 h-7 rounded-full bg-white text-slate-800 shadow-lg flex items-center justify-center text-xs font-bold pointer-events-auto border border-slate-300 cursor-ew-resize hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Split className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Corner Badges */}
                      <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-950/80 text-white backdrop-blur-md border border-white/10 shadow-xs">
                          ORIGINAL COLOR
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 z-10 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-950/90 text-indigo-300 backdrop-blur-md border border-indigo-500/30 shadow-xs uppercase">
                          GRAYSCALE ({method})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. SIDE-BY-SIDE MODE */}
                  {viewMode === 'side-by-side' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 w-full h-full max-h-[600px] overflow-auto">
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/50 border border-slate-800 relative">
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-slate-200">
                          ORIGINAL COLOR
                        </div>
                        <img
                          src={sourcePreviewUrl}
                          alt="Original"
                          className={`max-h-[460px] object-contain rounded transition-transform duration-150 ${
                            zoomLevel === '150' ? 'scale-150 transform-gpu' : ''
                          }`}
                        />
                      </div>

                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/50 border border-slate-800 relative">
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 uppercase">
                          GRAYSCALE ({method})
                        </div>
                        <img
                          src={processedResult?.url || sourcePreviewUrl}
                          alt="Grayscale"
                          className={`max-h-[460px] object-contain rounded transition-transform duration-150 ${
                            zoomLevel === '150' ? 'scale-150 transform-gpu' : ''
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. GRAYSCALE ONLY MODE */}
                  {viewMode === 'grayscale' && (
                    <div className="p-4 flex items-center justify-center w-full h-full max-h-[600px] overflow-auto">
                      <img
                        src={processedResult?.url || sourcePreviewUrl}
                        alt="Grayscale Full"
                        className={`max-h-[540px] max-w-full object-contain rounded-lg shadow-lg transition-transform duration-150 ${
                          zoomLevel === '150' ? 'scale-150 transform-gpu' : ''
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* OPTIONAL LIVE LUMINANCE HISTOGRAM */}
                {showHistogram && processedResult?.histogram && (
                  <div className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Luminance Frequency Distribution (256 Levels)</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Shadows (0-85) • Midtones (86-170) • Highlights (171-255)
                      </span>
                    </div>

                    {/* SVG Histogram Chart */}
                    <div className="h-20 w-full bg-slate-50 dark:bg-slate-950/60 rounded-lg p-1.5 flex items-end gap-px overflow-hidden border border-slate-200/80 dark:border-slate-800/80">
                      {(() => {
                        const hist = processedResult.histogram;
                        const maxVal = Math.max(...hist, 1);
                        return hist.map((count, level) => {
                          const heightPct = Math.min(100, (count / maxVal) * 100);
                          let color = '#64748b'; // midtone
                          if (level < 86) color = '#3b82f6'; // shadows
                          else if (level > 170) color = '#f59e0b'; // highlights
                          return (
                            <div
                              key={level}
                              title={`Luminance ${level}: ${count.toLocaleString()} pixels`}
                              className="flex-1 rounded-t-xs transition-all"
                              style={{
                                height: `${Math.max(2, heightPct)}%`,
                                backgroundColor: color,
                                opacity: 0.85,
                              }}
                            />
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* BOTTOM STATS & ACTION BANNER */}
                {processedResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Original Size</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {formatBytes(sourceFile.size)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {processedResult.width} × {processedResult.height} px
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Grayscale Size</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {formatBytes(processedResult.size)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">
                        {outputFormat.replace('image/', '')} ({outputQuality}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Method</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase truncate block">
                        {method}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Processed in {processedResult.durationMs}ms
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCopyToClipboard}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Copy grayscale image to clipboard"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSingle}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <a
                        href={processedResult.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                        title="Open full size in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: CONTROLS & SETTINGS (4 Cols) */}
              <div className="lg:col-span-4 space-y-5">
                {/* CARD 1: GRAYSCALE METHOD & INTENSITY */}
                <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Contrast className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Grayscale Formula</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Conversion Algorithm
                      </label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      >
                        {GRAYSCALE_METHODS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.tag})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {GRAYSCALE_METHODS.find(m => m.id === method)?.description}
                      </p>
                    </div>

                    {/* Threshold Cutoff Slider (When in threshold or dither mode) */}
                    {(method === 'threshold' || method === 'dither') && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                            Binarization Threshold
                          </label>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                            {thresholdValue} / 255
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="245"
                          step="1"
                          value={thresholdValue}
                          onChange={(e) => setThresholdValue(Number(e.target.value))}
                          className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Grayscale Intensity Slider (Blend between original color and monochrome) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Grayscale Intensity
                        </label>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          {intensity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>Original Color (0%)</span>
                        <span>Full B&W (100%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: TONE GRADING & ADJUSTMENTS */}
                <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Tone Grading</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleResetAdjustments}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Toning Color Tint Pills */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Monochrome Toning
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TONING_PRESETS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setToning(t.id)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                            toning === t.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-500/30'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.previewBg }} />
                          <span className="truncate">{t.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contrast & Brightness Sliders */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contrast</label>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          {contrast > 0 ? `+${contrast}` : contrast}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="2"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Brightness</label>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          {brightness > 0 ? `+${brightness}` : brightness}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="2"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Vignette & Film Grain Sliders */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vignette</label>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{vignette}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={vignette}
                        onChange={(e) => setVignette(Number(e.target.value))}
                        className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Film Grain</label>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{filmGrain}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={filmGrain}
                        onChange={(e) => setFilmGrain(Number(e.target.value))}
                        className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 3: OUTPUT FORMAT & QUALITY */}
                <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Export Format</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'PNG', mime: 'image/png' },
                      { label: 'WebP', mime: 'image/webp' },
                      { label: 'JPEG', mime: 'image/jpeg' },
                    ].map((fmt) => (
                      <button
                        key={fmt.mime}
                        type="button"
                        onClick={() => setOutputFormat(fmt.mime)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          outputFormat === fmt.mime
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  {outputFormat !== 'image/png' && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Compression Quality
                        </label>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          {outputQuality}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={outputQuality}
                        onChange={(e) => setOutputQuality(Number(e.target.value))}
                        className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BULK BATCH CONVERTER */}
      {/* ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          {/* BATCH DROPZONE */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingBulk(true);
            }}
            onDragLeave={() => setIsDraggingBulk(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingBulk(false);
              if (e.dataTransfer.files?.length) handleBulkFilesSelect(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById('bulk-files-input')?.click()}
            className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
              isDraggingBulk
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-400 dark:hover:border-indigo-600'
            }`}
          >
            <input
              id="bulk-files-input"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleBulkFilesSelect(e.target.files);
              }}
            />
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
              Drop Multiple Images Here, or browse
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
              Batch convert 10, 50, or 100 images simultaneously using your current grayscale algorithm and tone settings.
            </p>

            <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => document.getElementById('bulk-files-input')?.click()}
                className="text-xs px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Browse Images
              </button>
              <button
                type="button"
                onClick={handleLoadSampleBatch}
                className="text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Load Sample Batch
              </button>
            </div>
          </div>

          {/* BATCH CONTROLS & QUEUE */}
          {bulkQueue.length > 0 && (
            <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              {/* STATUS BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Batch Queue</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                      {bulkQueue.length} {bulkQueue.length === 1 ? 'file' : 'files'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Applying {method.toUpperCase()} ({toning !== 'none' ? `${toning} tone` : 'neutral'})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={clearBulkQueue}
                    disabled={bulkProgress.isRunning}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Clear All
                  </button>

                  <button
                    type="button"
                    onClick={processBulkQueue}
                    disabled={bulkProgress.isRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {bulkProgress.isRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Converting ({bulkProgress.current}/{bulkProgress.total})...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Process All Images</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBulkZip}
                    disabled={isZipping || !bulkQueue.some(i => i.status === 'done')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isZipping ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating ZIP...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-3.5 h-3.5" />
                        <span>Download ZIP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PROGRESS BAR */}
              {bulkProgress.isRunning && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                    <span>Batch Progress</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* QUEUE ITEMS TABLE */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {bulkQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-slate-400 w-5">{idx + 1}.</span>
                      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0">
                        <img
                          src={item.result?.url || item.originalUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-xs">{item.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatBytes(item.size)}
                          {item.result && (
                            <span className="text-emerald-600 dark:text-emerald-400 ml-2 font-medium">
                              ➔ {formatBytes(item.result.size)} ({item.result.durationMs}ms)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {item.status === 'pending' && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Pending
                        </span>
                      )}
                      {item.status === 'processing' && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 font-medium">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Converting</span>
                        </span>
                      )}
                      {item.status === 'done' && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3" />
                          <span>Done</span>
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Error
                        </span>
                      )}

                      {item.result && (
                        <button
                          type="button"
                          onClick={() => downloadBlob(item.result.blob, item.result.name)}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Download Image"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setBulkQueue(q => q.filter(i => i.id !== item.id));
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remove File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRESETS & EDUCATIONAL GUIDE */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* QUICK PRESET TEMPLATES */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>One-Click Artistic Monochrome Presets</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apply curated photographic styles with fine-tuned tonal balance, contrast curves, and tinting:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {[
                {
                  name: 'Modern Studio B&W',
                  desc: 'BT.709 luminance with punchy clarity, +18 contrast, and crisp midtone sharpness for portrait & commercial work.',
                  method: 'rec709',
                  contrast: 18,
                  brightness: 2,
                  toning: 'none',
                  vignette: 0,
                  filmGrain: 0,
                },
                {
                  name: 'Classic Film Noir',
                  desc: 'High-contrast moody monochrome with dramatic edge vignetting and analog silver-halide film grain.',
                  method: 'bt601',
                  contrast: 32,
                  brightness: -6,
                  toning: 'none',
                  vignette: 35,
                  filmGrain: 25,
                },
                {
                  name: 'Vintage Sepia Print',
                  desc: 'Authentic 19th-century photographic print with warm reddish-brown sepia tonality and soft vignetting.',
                  method: 'rec709',
                  contrast: 12,
                  brightness: 4,
                  toning: 'sepia',
                  vignette: 25,
                  filmGrain: 15,
                },
                {
                  name: 'Cyanotype Blueprint',
                  desc: 'Historic Prussian blue monochrome process invented in 1842, famous for botanical prints and architectural plans.',
                  method: 'rec709',
                  contrast: 22,
                  brightness: 0,
                  toning: 'cyanotype',
                  vignette: 15,
                  filmGrain: 10,
                },
                {
                  name: '1-Bit Newspaper Dither',
                  desc: 'Floyd-Steinberg error diffusion halftoning for authentic retro print, zine, and dot-matrix aesthetics.',
                  method: 'dither',
                  thresholdValue: 128,
                  contrast: 25,
                  toning: 'none',
                },
                {
                  name: 'Infrared Simulation',
                  desc: 'Simulates red optical filter used in black & white landscape photography. Turns blue skies dark and makes foliage glow.',
                  method: 'red_channel',
                  contrast: 26,
                  brightness: 6,
                  toning: 'none',
                  vignette: 10,
                },
              ].map((preset) => (
                <div
                  key={preset.name}
                  className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-xs"
                >
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{preset.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate(preset)}
                    className="mt-4 w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 hover:text-white border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-600 font-semibold text-xs transition-all cursor-pointer"
                  >
                    Apply Preset
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* EDUCATIONAL REFERENCE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>The Science of Luminance Formulas</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Human eyes do not perceive all colors with equal sensitivity. Our retinas possess far more green-sensitive cone cells:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">ITU-R BT.709:</span>{' '}
                  <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                    0.2126 R + 0.7152 G + 0.0722 B
                  </code>{' '}
                  - Modern digital standard calibrated for sRGB and Rec.709 displays.
                </li>
                <li>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">ITU-R BT.601:</span>{' '}
                  <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                    0.299 R + 0.587 G + 0.114 B
                  </code>{' '}
                  - Historic analog television and JPEG standard, placing slightly more weight on red.
                </li>
                <li>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Arithmetic Mean:</span>{' '}
                  <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                    (R + G + B) / 3
                  </code>{' '}
                  - Mathematically uniform but feels unnaturally dark in greens and bright in blues.
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Ansel Adams &amp; Zone System Tips</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tips for achieving stunning black and white image quality:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">Check the Histogram:</span> A good B&amp;W photo features pixels spanning across deep blacks (Zone 0), rich midtone textures (Zone V), and crisp specular highlights (Zone IX).</li>
                <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">Use Channel Isolation:</span> The Red Channel isolates dramatic sky textures while Green softens skin blemishes.</li>
                <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">100% In-Browser Privacy:</span> No image leaves your device. All pixel calculations execute on high-speed HTML5 Canvas.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
