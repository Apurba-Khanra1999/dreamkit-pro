import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Image as ImageIcon,
  Sliders,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  AlertCircle,
  FileArchive,
  Split,
  Columns,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  Copy,
  Check
} from 'lucide-react';
import {
  compressImage,
  createZipArchive,
  formatBytes,
  createSampleImage,
  downloadBlob
} from '../utils/imageCompressorUtils';

export default function ImageCompressorSuite({ _theme = 'dark', onNotify }) {
  // Navigation tabs: 'single' | 'bulk' | 'guide'
  const [activeTab, setActiveTab] = useState('single');

  // --- SINGLE COMPRESSOR STATE ---
  const [singleFile, setSingleFile] = useState(null);
  const [singleOriginalUrl, setSingleOriginalUrl] = useState(null);
  const [singleResult, setSingleResult] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState(null);

  // Single Settings
  const [format, setFormat] = useState('webp'); // 'original' | 'webp' | 'jpeg' | 'png'
  const [quality, setQuality] = useState(80); // 1 to 100
  const [scale, setScale] = useState(100); // 25, 50, 75, 100
  const [maxWidth, setMaxWidth] = useState('');
  const [maxHeight, setMaxHeight] = useState('');

  // Single Inspection View Mode: 'split' | 'side-by-side' | 'compressed'
  const [viewMode, setViewMode] = useState('split');
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = fit, 1.5 = 150%, 2 = 200%
  const [copied, setCopied] = useState(false);

  const splitSliderRef = useRef(null);
  const isDraggingSplit = useRef(false);

  // --- BULK COMPRESSOR STATE ---
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, isRunning: false });
  const [bulkFormat, setBulkFormat] = useState('webp');
  const [bulkQuality, setBulkQuality] = useState(80);
  const [bulkScale, setBulkScale] = useState(100);
  const [bulkMaxWidth, setBulkMaxWidth] = useState('');
  const [isZipping, setIsZipping] = useState(false);

  // Dropzone drag-over state
  const [isDraggingSingle, setIsDraggingSingle] = useState(false);
  const [isDraggingBulk, setIsDraggingBulk] = useState(false);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (singleOriginalUrl) URL.revokeObjectURL(singleOriginalUrl);
      if (singleResult?.url) URL.revokeObjectURL(singleResult.url);
      bulkFiles.forEach(item => {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      });
    };
  }, [singleOriginalUrl, singleResult, bulkFiles]);

  // Trigger single compression when settings or file change
  const executeSingleCompression = useCallback(async (fileToCompress, customOpts = {}) => {
    if (!fileToCompress) return;
    setSingleLoading(true);
    setSingleError(null);

    const opts = {
      format: customOpts.format !== undefined ? customOpts.format : format,
      quality: (customOpts.quality !== undefined ? customOpts.quality : quality) / 100,
      scale: customOpts.scale !== undefined ? customOpts.scale : scale,
      maxWidth: customOpts.maxWidth !== undefined ? customOpts.maxWidth : (maxWidth ? parseInt(maxWidth, 10) : null),
      maxHeight: customOpts.maxHeight !== undefined ? customOpts.maxHeight : (maxHeight ? parseInt(maxHeight, 10) : null),
    };

    try {
      const res = await compressImage(fileToCompress, opts);
      setSingleResult(res);
    } catch (err) {
      setSingleError(err?.message || 'Failed to compress image.');
      if (onNotify) onNotify(err?.message || 'Compression failed', 'error');
    } finally {
      setSingleLoading(false);
    }
  }, [format, quality, scale, maxWidth, maxHeight, onNotify]);

  // Load single image handler
  const handleSingleImageSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please select a valid image file (JPEG, PNG, WebP, etc.).', 'error');
      return;
    }

    if (singleOriginalUrl) URL.revokeObjectURL(singleOriginalUrl);
    const url = URL.createObjectURL(file);
    setSingleFile(file);
    setSingleOriginalUrl(url);
    setSingleResult(null);

    executeSingleCompression(file);
  }, [singleOriginalUrl, executeSingleCompression, onNotify]);

  // Load sample image
  const handleLoadSample = async (type = 'landscape') => {
    try {
      setSingleLoading(true);
      const sample = await createSampleImage(type, 1600, 1000);
      handleSingleImageSelect(sample);
      if (onNotify) onNotify(`Loaded high-resolution ${type} sample!`, 'success');
    } catch {
      if (onNotify) onNotify('Failed to create sample image.', 'error');
    } finally {
      setSingleLoading(false);
    }
  };

  // Split comparison mouse/touch slider logic
  const handleSplitMove = useCallback((clientX) => {
    if (!splitSliderRef.current) return;
    const rect = splitSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSplitPos(percent);
  }, []);

  const handleMouseDownSplit = (e) => {
    isDraggingSplit.current = true;
    handleSplitMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingSplit.current) return;
      handleSplitMove(e.clientX);
    };

    const handleMouseUp = () => {
      isDraggingSplit.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleSplitMove]);

  // Copy compressed image to clipboard
  const handleCopyImage = async () => {
    if (!singleResult?.blob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        let clipboardBlob = singleResult.blob;
        if (clipboardBlob.type !== 'image/png') {
          const res = await compressImage(singleFile, { format: 'png', quality: 1 });
          clipboardBlob = res.blob;
        }
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': clipboardBlob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onNotify) onNotify('Image copied to clipboard!', 'success');
      } else {
        throw new Error('ClipboardItem API not supported');
      }
    } catch {
      if (onNotify) onNotify('Could not copy image directly. Use download instead.', 'info');
    }
  };

  // Re-compress when slider values change with debounce
  useEffect(() => {
    if (!singleFile) return;
    const timer = setTimeout(() => {
      executeSingleCompression(singleFile);
    }, 250);
    return () => clearTimeout(timer);
  }, [format, quality, scale, maxWidth, maxHeight, singleFile, executeSingleCompression]);

  // --- BULK COMPRESSION HANDLERS ---
  const handleBulkFilesAdded = (filesList) => {
    const newItems = [];
    for (const f of filesList) {
      if (f.type.startsWith('image/')) {
        newItems.push({
          id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file: f,
          originalUrl: URL.createObjectURL(f),
          status: 'pending',
          result: null,
          error: null,
        });
      }
    }

    if (newItems.length === 0) {
      if (onNotify) onNotify('No valid image files detected.', 'error');
      return;
    }

    setBulkFiles(prev => [...prev, ...newItems]);
    if (onNotify) onNotify(`Added ${newItems.length} image(s) to queue.`, 'info');
  };

  // Add 4 sample batch images
  const handleAddBulkSamples = async () => {
    try {
      const s1 = await createSampleImage('landscape', 1600, 1000);
      const s2 = await createSampleImage('minimal', 1200, 1200);
      const s3 = await createSampleImage('texture', 1400, 900);
      const s4 = await createSampleImage('badge', 1000, 600);
      handleBulkFilesAdded([s1, s2, s3, s4]);
      if (onNotify) onNotify('Added 4 sample images to batch!', 'success');
    } catch {
      if (onNotify) onNotify('Failed to create sample batch.', 'error');
    }
  };

  // Process all bulk images
  const processBulkQueue = async () => {
    if (bulkFiles.length === 0 || bulkProgress.isRunning) return;

    setBulkProgress({ current: 0, total: bulkFiles.length, isRunning: true });

    const updated = [...bulkFiles];
    const opts = {
      format: bulkFormat,
      quality: bulkQuality / 100,
      scale: bulkScale,
      maxWidth: bulkMaxWidth ? parseInt(bulkMaxWidth, 10) : null,
    };

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') {
        setBulkProgress(prev => ({ ...prev, current: i + 1 }));
        continue;
      }

      updated[i] = { ...updated[i], status: 'processing' };
      setBulkFiles([...updated]);

      try {
        const res = await compressImage(updated[i].file, opts);
        updated[i] = {
          ...updated[i],
          status: 'done',
          result: res,
          error: null,
        };
      } catch (err) {
        updated[i] = {
          ...updated[i],
          status: 'error',
          error: err?.message || 'Compression failed',
        };
      }

      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
      setBulkFiles([...updated]);
    }

    setBulkProgress(prev => ({ ...prev, isRunning: false }));
    if (onNotify) onNotify('Batch compression complete!', 'success');
  };

  // Download all bulk files as a ZIP
  const handleDownloadAllZip = async () => {
    const doneItems = bulkFiles.filter(item => item.status === 'done' && item.result?.blob);
    if (doneItems.length === 0) {
      if (onNotify) onNotify('No compressed files available to download.', 'error');
      return;
    }

    setIsZipping(true);
    try {
      const filesForZip = doneItems.map(item => ({
        name: item.result.name,
        blob: item.result.blob,
      }));

      const zipBlob = await createZipArchive(filesForZip);
      downloadBlob(zipBlob, `compressed-images-${Date.now()}.zip`);
      if (onNotify) onNotify(`Downloaded ZIP archive with ${doneItems.length} images!`, 'success');
    } catch (err) {
      if (onNotify) onNotify(`Failed to generate ZIP: ${err?.message || 'unknown error'}`, 'error');
    } finally {
      setIsZipping(false);
    }
  };

  // Download all files individually
  const handleDownloadAllIndividually = () => {
    const doneItems = bulkFiles.filter(item => item.status === 'done' && item.result?.blob);
    if (doneItems.length === 0) return;

    doneItems.forEach((item, index) => {
      setTimeout(() => {
        downloadBlob(item.result.blob, item.result.name);
      }, index * 200);
    });

    if (onNotify) onNotify(`Triggered download for ${doneItems.length} images.`, 'info');
  };

  // Clear bulk list
  const handleClearBulk = () => {
    bulkFiles.forEach(item => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    });
    setBulkFiles([]);
    setBulkProgress({ current: 0, total: 0, isRunning: false });
  };

  // Calculate bulk summary stats
  const bulkStats = bulkFiles.reduce((acc, curr) => {
    acc.totalOriginalBytes += curr.file.size;
    if (curr.status === 'done' && curr.result) {
      acc.totalCompressedBytes += curr.result.compressedSize;
      acc.completedCount++;
    } else {
      acc.totalCompressedBytes += curr.file.size;
    }
    return acc;
  }, { totalOriginalBytes: 0, totalCompressedBytes: 0, completedCount: 0 });

  const bulkSavedBytes = Math.max(0, bulkStats.totalOriginalBytes - bulkStats.totalCompressedBytes);
  const bulkSavedPercent = bulkStats.totalOriginalBytes > 0
    ? Math.round((bulkSavedBytes / bulkStats.totalOriginalBytes) * 100)
    : 0;

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
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Single Compressor</span>
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
            <FileArchive className="w-3.5 h-3.5" />
            <span>Bulk Batch ({bulkFiles.length})</span>
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
            <Info className="w-3.5 h-3.5" />
            <span>Format Guide</span>
          </button>
        </div>

        {/* Client-Side Privacy Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero Server Uploads • 100% Client-Side</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE IMAGE COMPRESSOR */}
      {/* ========================================================================= */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Preview Area (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            {singleError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{singleError}</span>
              </div>
            )}

            {/* Upload Zone / Empty State */}
            {!singleFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingSingle(true); }}
                onDragLeave={() => setIsDraggingSingle(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingSingle(false);
                  if (e.dataTransfer.files?.[0]) handleSingleImageSelect(e.dataTransfer.files[0]);
                }}
                className={`relative flex flex-col items-center justify-center p-8 sm:p-14 rounded-2xl border-2 border-dashed transition-all text-center ${
                  isDraggingSingle
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-400 dark:hover:border-indigo-600'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Drop an image here, or browse from computer
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6">
                  Supports JPEG, PNG, WebP, GIF, BMP, and SVG. Images are processed 100% locally in your browser with zero server uploads.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleSingleImageSelect(e.target.files[0]);
                      }}
                    />
                  </label>

                  <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="px-2 text-slate-400 font-medium">Or load demo:</span>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('landscape')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                    >
                      Landscape
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('minimal')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                    >
                      Vector Art
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('texture')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                    >
                      Fine Grid
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visual Viewport Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
                  {/* Mode Buttons */}
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 mr-1.5 font-medium">Mode:</span>
                    <button
                      type="button"
                      onClick={() => setViewMode('split')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        viewMode === 'split'
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Split Slider</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('side-by-side')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        viewMode === 'side-by-side'
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Side-by-Side</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('compressed')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        viewMode === 'compressed'
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Compressed</span>
                    </button>
                  </div>

                  {/* Zoom Controls & Replace */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          zoomLevel === 1 ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Fit
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1.5)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          zoomLevel === 1.5 ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        150%
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(2)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          zoomLevel === 2 ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        200%
                      </button>
                    </div>

                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors font-medium">
                      <RefreshCw className="w-3 h-3" />
                      <span>Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleSingleImageSelect(e.target.files[0]);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setSingleFile(null);
                        setSingleResult(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Clear image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Viewport Container */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md min-h-[420px] max-h-[640px] flex items-center justify-center select-none">
                  {/* Subtle checkerboard pattern for alpha transparency */}
                  <div 
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #475569 25%, transparent 25%), linear-gradient(-45deg, #475569 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #475569 75%), linear-gradient(-45deg, transparent 75%, #475569 75%)`,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />

                  {/* Loading Spinner Overlay */}
                  {singleLoading && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-white gap-2">
                      <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                      <span className="text-xs font-semibold tracking-wide">Compressing on client canvas...</span>
                    </div>
                  )}

                  {/* 1. SPLIT COMPARISON SLIDER VIEW */}
                  {viewMode === 'split' && (
                    <div
                      ref={splitSliderRef}
                      onMouseDown={handleMouseDownSplit}
                      className="relative w-full h-full min-h-[420px] flex items-center justify-center cursor-ew-resize overflow-hidden"
                    >
                      {/* Image container scaled by zoom */}
                      <div
                        className="relative max-w-full max-h-[600px] flex items-center justify-center transition-transform"
                        style={{ transform: `scale(${zoomLevel})` }}
                      >
                        {/* Compressed Image (Right / Base) */}
                        {singleResult?.url ? (
                          <img
                            src={singleResult.url}
                            alt="Compressed preview"
                            className="max-h-[560px] max-w-full object-contain pointer-events-none"
                          />
                        ) : (
                          <img
                            src={singleOriginalUrl}
                            alt="Original preview"
                            className="max-h-[560px] max-w-full object-contain pointer-events-none"
                          />
                        )}

                        {/* Original Image (Left / Clipped overlay via CSS clipPath) */}
                        <div
                          className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
                          style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                        >
                          <img
                            src={singleOriginalUrl}
                            alt="Original full"
                            className="max-h-[560px] max-w-full object-contain pointer-events-none"
                          />
                        </div>

                        {/* Draggable Divider Line */}
                        <div
                          className="absolute top-0 bottom-0 z-20 pointer-events-none"
                          style={{ left: `${splitPos}%` }}
                        >
                          <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] relative -left-px">
                            <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-7 h-7 rounded-full bg-white text-slate-800 shadow-lg flex items-center justify-center text-xs font-bold pointer-events-auto border border-slate-300">
                              <Split className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Corner Badges */}
                      <div className="absolute top-3 left-3 z-20 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-950/80 text-white backdrop-blur-md border border-white/10 shadow-sm">
                          ORIGINAL ({formatBytes(singleFile.size)})
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 z-20 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-950/90 text-indigo-300 backdrop-blur-md border border-indigo-500/30 shadow-sm">
                          COMPRESSED ({singleResult ? formatBytes(singleResult.compressedSize) : '...'})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. SIDE-BY-SIDE VIEW */}
                  {viewMode === 'side-by-side' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 w-full h-full max-h-[600px] overflow-auto">
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/50 border border-slate-800 relative">
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-slate-200">
                          ORIGINAL ({formatBytes(singleFile.size)})
                        </div>
                        <img
                          src={singleOriginalUrl}
                          alt="Original"
                          className="max-h-[460px] object-contain rounded"
                          style={{ transform: `scale(${zoomLevel})` }}
                        />
                      </div>

                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/50 border border-slate-800 relative">
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/80 text-indigo-200">
                          COMPRESSED ({singleResult ? formatBytes(singleResult.compressedSize) : '...'})
                        </div>
                        {singleResult?.url ? (
                          <img
                            src={singleResult.url}
                            alt="Compressed"
                            className="max-h-[460px] object-contain rounded"
                            style={{ transform: `scale(${zoomLevel})` }}
                          />
                        ) : (
                          <span className="text-xs text-slate-500">Processing...</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. COMPRESSED ONLY VIEW */}
                  {viewMode === 'compressed' && (
                    <div className="p-4 flex items-center justify-center w-full h-full">
                      {singleResult?.url ? (
                        <img
                          src={singleResult.url}
                          alt="Compressed view"
                          className="max-h-[560px] object-contain rounded-lg shadow-lg"
                          style={{ transform: `scale(${zoomLevel})` }}
                        />
                      ) : (
                        <img
                          src={singleOriginalUrl}
                          alt="Original view"
                          className="max-h-[560px] object-contain"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Savings Banner underneath viewport */}
                {singleResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Original Size</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatBytes(singleResult.originalSize)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {singleResult.originalWidth} &times; {singleResult.originalHeight} px
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Compressed Size</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {formatBytes(singleResult.compressedSize)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {singleResult.width} &times; {singleResult.height} px
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Reduction</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-extrabold ${
                          singleResult.savedPercentage > 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-amber-500'
                        }`}>
                          {singleResult.savedPercentage > 0 ? `-${singleResult.savedPercentage}%` : '+0%'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          ({formatBytes(Math.abs(singleResult.savedBytes))} saved)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Processed in {singleResult.durationMs}ms
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCopyImage}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadBlob(singleResult.blob, singleResult.name)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Compression Controls & Tweaks (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Compression Settings</span>
                </div>
                {singleLoading && (
                  <span className="text-[10px] text-indigo-500 font-medium animate-pulse">Updating...</span>
                )}
              </div>

              {/* 1. Format Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Output Format
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormat('webp')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      format === 'webp'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>WebP</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                        Best
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      30% smaller, modern web standard
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('jpeg')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      format === 'jpeg'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold">JPEG</div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Universal compatibility
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      format === 'png'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold">PNG</div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Lossless & crisp transparency
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('original')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      format === 'original'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold">Original</div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Keep input file extension
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Quality Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Compression Quality</span>
                  <div className="flex items-center gap-1.5 font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    <span>{quality}%</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">
                      {quality >= 85 ? '(Maximum)' : quality >= 70 ? '(High)' : quality >= 50 ? '(Balanced)' : '(Aggressive)'}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <button type="button" onClick={() => setQuality(40)} className="hover:text-indigo-500 cursor-pointer">40% Compact</button>
                  <button type="button" onClick={() => setQuality(60)} className="hover:text-indigo-500 cursor-pointer">60% Medium</button>
                  <button type="button" onClick={() => setQuality(80)} className="hover:text-indigo-500 cursor-pointer font-bold text-indigo-500">80% Optimal</button>
                  <button type="button" onClick={() => setQuality(92)} className="hover:text-indigo-500 cursor-pointer">92% Crisp</button>
                </div>
              </div>

              {/* 3. Resize & Dimension Scaling */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Resize & Downscaling
                </label>

                {/* Percentage Scale Buttons */}
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[100, 75, 50, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setScale(pct)}
                      className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                        scale === pct
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                {/* Max Width / Max Height bounds */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Max Width (px)</span>
                    <input
                      type="number"
                      placeholder="e.g. 1920"
                      value={maxWidth}
                      onChange={(e) => setMaxWidth(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Max Height (px)</span>
                    <input
                      type="number"
                      placeholder="e.g. 1080"
                      value={maxHeight}
                      onChange={(e) => setMaxHeight(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                  <span className="text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => { setMaxWidth('1920'); setMaxHeight(''); setScale(100); }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:text-indigo-500 cursor-pointer"
                  >
                    1920px (FHD)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMaxWidth('1200'); setMaxHeight(''); setScale(100); }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:text-indigo-500 cursor-pointer"
                  >
                    1200px (Web)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMaxWidth('600'); setMaxHeight(''); setScale(100); }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:text-indigo-500 cursor-pointer"
                  >
                    600px (Thumb)
                  </button>
                  {(maxWidth || maxHeight || scale !== 100) && (
                    <button
                      type="button"
                      onClick={() => { setMaxWidth(''); setMaxHeight(''); setScale(100); }}
                      className="px-2 py-0.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Security & EXIF notice */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Privacy & Metadata Stripped</span>
                </div>
                <p className="leading-relaxed">
                  Compression automatically removes EXIF camera details, GPS locations, and author tags for privacy and minimal payload size.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BULK IMAGE COMPRESSOR */}
      {/* ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          {/* Bulk Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingBulk(true); }}
            onDragLeave={() => setIsDraggingBulk(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingBulk(false);
              if (e.dataTransfer.files?.length) handleBulkFilesAdded(Array.from(e.dataTransfer.files));
            }}
            className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all text-center ${
              isDraggingBulk
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111622] hover:border-indigo-400 dark:hover:border-indigo-600'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileArchive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Bulk Multi-Image Batch Compressor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Drag and drop up to 50+ images at once. Download individually or as a single packaged .zip archive.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddBulkSamples}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Load 4 Demo Images
                </button>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add Images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) handleBulkFilesAdded(Array.from(e.target.files));
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Bulk Controls & Settings Ribbon */}
          {bulkFiles.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Global Compression Settings */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {/* Format */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Format:</span>
                    <select
                      value={bulkFormat}
                      onChange={(e) => setBulkFormat(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <option value="webp">WebP (Best Compression)</option>
                      <option value="jpeg">JPEG (Universal)</option>
                      <option value="png">PNG (Lossless)</option>
                      <option value="original">Preserve Original</option>
                    </select>
                  </div>

                  {/* Quality Slider */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Quality:</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={bulkQuality}
                      onChange={(e) => setBulkQuality(Number(e.target.value))}
                      className="w-24 sm:w-32 accent-indigo-600 cursor-pointer"
                    />
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold w-10">
                      {bulkQuality}%
                    </span>
                  </div>

                  {/* Scale selection */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Scale:</span>
                    <select
                      value={bulkScale}
                      onChange={(e) => setBulkScale(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <option value="100">100% (Original)</option>
                      <option value="75">75%</option>
                      <option value="50">50%</option>
                      <option value="25">25%</option>
                    </select>
                  </div>

                  {/* Max Width */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Max Width:</span>
                    <select
                      value={bulkMaxWidth}
                      onChange={(e) => setBulkMaxWidth(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <option value="">Original Width</option>
                      <option value="1920">1920px (Full HD)</option>
                      <option value="1200">1200px (Web standard)</option>
                      <option value="800">800px (Mobile/Blog)</option>
                    </select>
                  </div>
                </div>

                {/* Primary Batch Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={processBulkQueue}
                    disabled={bulkProgress.isRunning}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {bulkProgress.isRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Compressing ({bulkProgress.current}/{bulkProgress.total})</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Compress All ({bulkFiles.length})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    disabled={bulkStats.completedCount === 0 || isZipping}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isZipping ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Building ZIP...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-3.5 h-3.5" />
                        <span>Download ZIP ({bulkStats.completedCount})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAllIndividually}
                    disabled={bulkStats.completedCount === 0}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download files individually"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Individual Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearBulk}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Clear All"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Aggregate Statistics Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Total Files</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    {bulkFiles.length} images ({bulkStats.completedCount} processed)
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Original Weight</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-300">
                    {formatBytes(bulkStats.totalOriginalBytes)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Compressed Weight</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatBytes(bulkStats.totalCompressedBytes)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Total Space Saved</span>
                  <span className={`text-sm font-extrabold ${bulkSavedPercent > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    -{bulkSavedPercent}% ({formatBytes(bulkSavedBytes)})
                  </span>
                </div>
              </div>

              {/* Progress bar when batch runs */}
              {bulkProgress.isRunning && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Processing batch queue...</span>
                    <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-200"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bulk File Queue List */}
          {bulkFiles.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {bulkFiles.map((item, index) => {
                  const isDone = item.status === 'done' && item.result;
                  const isProcessing = item.status === 'processing';
                  const isError = item.status === 'error';

                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                          <img
                            src={isDone ? item.result.url : item.originalUrl}
                            alt={item.file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                            {item.file.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{formatBytes(item.file.size)}</span>
                            {isDone && (
                              <>
                                <span>&rarr;</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {formatBytes(item.result.compressedSize)}
                                </span>
                                <span>&bull;</span>
                                <span>{item.result.width} &times; {item.result.height} px</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status badge & actions */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        {isDone && (
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.result.savedPercentage > 0
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {item.result.savedPercentage > 0 ? `-${item.result.savedPercentage}%` : '0%'}
                          </span>
                        )}

                        {isProcessing && (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing</span>
                          </div>
                        )}

                        {isError && (
                          <span className="text-xs text-rose-500 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}

                        {item.status === 'pending' && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Ready
                          </span>
                        )}

                        {/* Individual Download */}
                        {isDone && (
                          <button
                            type="button"
                            onClick={() => downloadBlob(item.result.blob, item.result.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                            title="Download this compressed image"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}

                        {/* Remove from queue */}
                        <button
                          type="button"
                          onClick={() => {
                            if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
                            if (item.result?.url) URL.revokeObjectURL(item.result.url);
                            setBulkFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove from batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FORMAT & COMPRESSION GUIDE */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* WebP Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  WebP (Recommended)
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">97%+ Browser Support</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Modern Web Standard</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Created by Google, WebP provides 25-35% superior lossy compression compared to JPEG at equivalent visual quality. Supports full 8-bit alpha transparency and animation.
              </p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Best for: Website hero images, blogs, ecommerce catalogs</li>
                <li>Reduces Core Web Vitals LCP load times dramatically</li>
                <li>Supports both lossy and lossless algorithms</li>
              </ul>
            </div>

            {/* JPEG Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  JPEG / JPG
                </span>
                <span className="text-[11px] font-semibold text-slate-500">100% Universal</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Photography & Broad Compatibility</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The venerable standard for photographic content with smooth tonal gradations. Does not support transparency (transparent pixels are cleanly blended into a white background).
              </p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Best for: Email templates, legacy app compatibility, print backups</li>
                <li>Sweet spot quality: 75% to 85% for minimal artifacting</li>
                <li>Zero transparency support</li>
              </ul>
            </div>

            {/* PNG Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
                  PNG
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Lossless Master</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Graphics & Alpha Transparency</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                PNG uses DEFLATE lossless compression. It preserves every single pixel without loss of crisp lines, making it ideal for UI screenshots, diagrams, and transparent logos.
              </p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Best for: Logos, iconography, user interface screenshots</li>
                <li>Preserves 100% sharp text edges without ringing artifacts</li>
                <li>Larger file sizes for realistic continuous-tone photographs</li>
              </ul>
            </div>
          </div>

          {/* Best Practices Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900/60 border border-indigo-900/40 text-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>Google PageSpeed & Core Web Vitals Optimization Checklist</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="space-y-2">
                <div className="font-semibold text-white">1. Serve images in next-gen formats (WebP / AVIF)</div>
                <p className="text-slate-400 leading-relaxed">
                  Google Lighthouse penalizes JPEG and PNG assets on mobile if WebP can reduce payload size by more than 20 KB. Converting to WebP 80% satisfies this audit effortlessly.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">2. Properly size images</div>
                <p className="text-slate-400 leading-relaxed">
                  Never serve a 4000px camera photo inside a 400px blog container. Use the downscaling presets (e.g. 1200px or 1920px) to match the actual display device resolution.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">3. Strip unnecessary metadata (EXIF & GPS)</div>
                <p className="text-slate-400 leading-relaxed">
                  Camera EXIF metadata can easily add 15 to 60 KB of overhead per image while leaking private location coordinates. DreamKit automatically removes this during processing.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">4. Zero Telemetry & Privacy</div>
                <p className="text-slate-400 leading-relaxed">
                  All compression runs directly on your CPU/GPU hardware using the browser HTML5 Canvas engine. No images are ever uploaded to cloud servers or third-party APIs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
