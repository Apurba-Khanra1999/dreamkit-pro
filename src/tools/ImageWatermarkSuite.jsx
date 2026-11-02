import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Stamp,
  Type,
  Image as ImageIcon,
  Grid,
  Sliders,
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
  RotateCw,
  Layers,
  Sparkles,
  ExternalLink,
  Move,
  Upload
} from 'lucide-react';
import {
  formatBytes,
  applyWatermark,
  createSampleLogo,
  createSampleBaseImage,
  downloadBlob
} from '../utils/imageWatermarkUtils';
import { createZipArchive } from '../utils/imageCompressorUtils';

// 9-Point Grid Position definitions
const GRID_POSITIONS = [
  { id: 'nw', label: 'Top-Left', short: 'TL' },
  { id: 'n', label: 'Top-Center', short: 'TC' },
  { id: 'ne', label: 'Top-Right', short: 'TR' },
  { id: 'w', label: 'Center-Left', short: 'CL' },
  { id: 'c', label: 'Center', short: 'C' },
  { id: 'e', label: 'Center-Right', short: 'CR' },
  { id: 'sw', label: 'Bottom-Left', short: 'BL' },
  { id: 's', label: 'Bottom-Center', short: 'BC' },
  { id: 'se', label: 'Bottom-Right', short: 'BR' },
];

const FONT_FAMILIES = [
  { label: 'Sans-Serif (Modern / Clean)', value: 'Inter, system-ui, -apple-system, sans-serif' },
  { label: 'Impact (Bold / Watermark Stamp)', value: 'Impact, "Arial Black", sans-serif' },
  { label: 'Serif (Editorial / Classic)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Monospace (Technical / Code)', value: '"Courier New", Courier, monospace' },
  { label: 'Cursive / Script (Signature)', value: '"Brush Script MT", cursive, sans-serif' },
];

const QUICK_TEXT_PRESETS = [
  '© 2026 DreamKit Studio',
  'PROOF - DO NOT COPY',
  'CONFIDENTIAL',
  'DRAFT / PREVIEW',
  'ORIGINAL ARTWORK',
];

export default function ImageWatermarkSuite({ _theme = 'dark', onNotify }) {
  // Navigation tabs: 'single' | 'bulk' | 'guide'
  const [activeTab, setActiveTab] = useState('single');

  // --- SINGLE MODE STATE ---
  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState(null);
  const [sourceDimensions, setSourceDimensions] = useState({ width: 0, height: 0 });
  const [processedResult, setProcessedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderError, setRenderError] = useState(null);

  // Watermark Type: 'text' | 'image'
  const [watermarkType, setWatermarkType] = useState('text');

  // Text Watermark Settings
  const [wmText, setWmText] = useState('© 2026 DreamKit Studio');
  const [wmFontFamily, setWmFontFamily] = useState('Inter, system-ui, -apple-system, sans-serif');
  const [wmFontSize, setWmFontSize] = useState(36);
  const [wmFontWeight, setWmFontWeight] = useState('bold');
  const [wmColor, setWmColor] = useState('#ffffff');
  const [wmOpacity, setWmOpacity] = useState(75);
  const [wmHasShadow, setWmHasShadow] = useState(true);
  const [wmShadowColor, setWmShadowColor] = useState('#000000');
  const [wmHasBadge, setWmHasBadge] = useState(false);
  const [wmBadgeColor, setWmBadgeColor] = useState('rgba(0, 0, 0, 0.55)');

  // Logo Watermark Settings
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [logoScale, setLogoScale] = useState(20); // % of image width
  const [logoOpacity, setLogoOpacity] = useState(80);

  // Layout & Alignment Settings
  const [layoutMode, setLayoutMode] = useState('position'); // 'position' | 'tile'
  const [gridPosition, setGridPosition] = useState('se'); // 'nw' ... 'se'
  const [margin, setMargin] = useState(35);
  const [rotation, setRotation] = useState(0); // -180 to +180

  // Diagonal Tile Settings
  const [tileAngle, setTileAngle] = useState(-30);
  const [tileGapX, setTileGapX] = useState(160);
  const [tileGapY, setTileGapY] = useState(160);

  // Output Format Settings
  const [outputFormat, setOutputFormat] = useState('image/png'); // 'image/png' | 'image/jpeg' | 'image/webp'
  const [outputQuality, setOutputQuality] = useState(90);

  // Preview Mode
  const [previewZoom, setPreviewZoom] = useState('fit'); // 'fit' | '100' | '150'
  const [viewCompare, setViewCompare] = useState('result'); // 'result' | 'original'
  const [copied, setCopied] = useState(false);

  // --- BULK MODE STATE ---
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, isRunning: false });
  const [isZipping, setIsZipping] = useState(false);

  // Drag over states
  const [isDraggingSingle, setIsDraggingSingle] = useState(false);
  const [isDraggingBulk, setIsDraggingBulk] = useState(false);

  // Canvas ref for live preview rendering
  const canvasRef = useRef(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      if (processedResult?.url) URL.revokeObjectURL(processedResult.url);
      bulkQueue.forEach(item => {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      });
    };
  }, [sourcePreviewUrl, logoPreviewUrl, processedResult, bulkQueue]);

  // Load Single Image File
  const handleSingleFileSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please select a valid image file (PNG, JPEG, WebP, etc.).', 'error');
      return;
    }

    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    const url = URL.createObjectURL(file);
    setSourceFile(file);
    setSourcePreviewUrl(url);

    // Get dimensions
    const img = new Image();
    img.onload = () => {
      setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  }, [sourcePreviewUrl, onNotify]);

  // Load Custom Logo File
  const handleLogoSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please select a valid logo image (PNG or WebP recommended).', 'error');
      return;
    }
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    const url = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreviewUrl(url);
    setWatermarkType('image');
  }, [logoPreviewUrl, onNotify]);

  // Load Built-in Preset Logo
  const handleLoadSampleLogo = async (type) => {
    try {
      const sampleFile = await createSampleLogo(type);
      handleLogoSelect(sampleFile);
      if (onNotify) onNotify(`Loaded "${type}" seal overlay`, 'success');
    } catch {
      if (onNotify) onNotify('Failed to generate sample logo', 'error');
    }
  };

  // Load Built-in Demo Base Images
  const handleLoadDemoImage = async (type = 'landscape') => {
    try {
      setIsProcessing(true);
      const demoFile = await createSampleBaseImage(type);
      handleSingleFileSelect(demoFile);
      if (onNotify) onNotify('Sample photography loaded! Customize your watermark.', 'info');
    } catch {
      if (onNotify) onNotify('Failed to load sample image', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-render single watermark whenever settings change
  const renderSingleWatermark = useCallback(async () => {
    if (!sourceFile) return;

    setIsProcessing(true);
    setRenderError(null);

    try {
      const opts = {
        type: watermarkType,
        text: wmText,
        fontSize: Number(wmFontSize),
        fontFamily: wmFontFamily,
        fontWeight: wmFontWeight,
        color: wmColor,
        opacity: Number(wmOpacity) / 100,
        hasShadow: wmHasShadow,
        shadowColor: wmShadowColor,
        hasBadge: wmHasBadge,
        badgeColor: wmBadgeColor,
        logoSource: logoFile,
        logoScale: Number(logoScale),
        logoOpacity: Number(logoOpacity) / 100,
        layout: layoutMode,
        position: gridPosition,
        margin: Number(margin),
        rotation: Number(rotation),
        tileGapX: Number(tileGapX),
        tileGapY: Number(tileGapY),
        tileAngle: Number(tileAngle),
        format: outputFormat,
        quality: Number(outputQuality) / 100,
      };

      const result = await applyWatermark(sourceFile, opts);
      setProcessedResult(result);
    } catch (err) {
      setRenderError(err?.message || 'Failed to render watermark');
      if (onNotify) onNotify(err?.message || 'Render failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [
    sourceFile,
    watermarkType,
    wmText,
    wmFontSize,
    wmFontFamily,
    wmFontWeight,
    wmColor,
    wmOpacity,
    wmHasShadow,
    wmShadowColor,
    wmHasBadge,
    wmBadgeColor,
    logoFile,
    logoScale,
    logoOpacity,
    layoutMode,
    gridPosition,
    margin,
    rotation,
    tileGapX,
    tileGapY,
    tileAngle,
    outputFormat,
    outputQuality,
    onNotify
  ]);

  // Debounced auto-render when settings update
  useEffect(() => {
    if (!sourceFile) return;
    const timer = setTimeout(() => {
      renderSingleWatermark();
    }, 120);
    return () => clearTimeout(timer);
  }, [renderSingleWatermark, sourceFile]);

  // Copy watermarked image to clipboard
  const handleCopyToClipboard = async () => {
    if (!processedResult?.blob) return;
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        let clipBlob = processedResult.blob;
        if (processedResult.format !== 'image/png') {
          const pngResult = await applyWatermark(sourceFile, {
            type: watermarkType,
            text: wmText,
            fontSize: Number(wmFontSize),
            fontFamily: wmFontFamily,
            fontWeight: wmFontWeight,
            color: wmColor,
            opacity: Number(wmOpacity) / 100,
            hasShadow: wmHasShadow,
            shadowColor: wmShadowColor,
            hasBadge: wmHasBadge,
            badgeColor: wmBadgeColor,
            logoSource: logoFile,
            logoScale: Number(logoScale),
            logoOpacity: Number(logoOpacity) / 100,
            layout: layoutMode,
            position: gridPosition,
            margin: Number(margin),
            rotation: Number(rotation),
            tileGapX: Number(tileGapX),
            tileGapY: Number(tileGapY),
            tileAngle: Number(tileAngle),
            format: 'image/png',
          });
          clipBlob = pngResult.blob;
        }
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': clipBlob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onNotify) onNotify('Watermarked image copied to clipboard!', 'success');
      } else {
        throw new Error('Clipboard image API not supported in this browser.');
      }
    } catch {
      if (onNotify) onNotify('Clipboard copy failed. Please download the image instead.', 'error');
    }
  };

  // Download Single Result
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
    if (onNotify) onNotify(`Added ${validFiles.length} image(s) to queue`, 'info');
  };

  // Process all items in bulk queue
  const processBulkQueue = async () => {
    if (!bulkQueue.length || bulkProgress.isRunning) return;

    setBulkProgress({ current: 0, total: bulkQueue.length, isRunning: true });

    const opts = {
      type: watermarkType,
      text: wmText,
      fontSize: Number(wmFontSize),
      fontFamily: wmFontFamily,
      fontWeight: wmFontWeight,
      color: wmColor,
      opacity: Number(wmOpacity) / 100,
      hasShadow: wmHasShadow,
      shadowColor: wmShadowColor,
      hasBadge: wmHasBadge,
      badgeColor: wmBadgeColor,
      logoSource: logoFile,
      logoScale: Number(logoScale),
      logoOpacity: Number(logoOpacity) / 100,
      layout: layoutMode,
      position: gridPosition,
      margin: Number(margin),
      rotation: Number(rotation),
      tileGapX: Number(tileGapX),
      tileGapY: Number(tileGapY),
      tileAngle: Number(tileAngle),
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
        const res = await applyWatermark(item.file, opts);
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
    if (onNotify) onNotify('Batch watermarking completed!', 'success');
  };

  // Download All Bulk as ZIP
  const handleDownloadBulkZip = async () => {
    const finishedItems = bulkQueue.filter(item => item.status === 'done' && item.result?.blob);
    if (!finishedItems.length) {
      if (onNotify) onNotify('No processed images ready to download.', 'error');
      return;
    }

    setIsZipping(true);
    try {
      const zipFiles = finishedItems.map(item => ({
        name: item.result.name,
        blob: item.result.blob,
      }));

      const zipBlob = await createZipArchive(zipFiles);
      downloadBlob(zipBlob, `watermarked-images-${Date.now()}.zip`);
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

  // Load Sample Batch Files
  const handleLoadSampleBatch = async () => {
    try {
      const sample1 = await createSampleBaseImage('landscape');
      const sample2 = await createSampleBaseImage('abstract');
      handleBulkFilesSelect([sample1, sample2]);
      if (onNotify) onNotify('Loaded 2 sample images for batch processing', 'info');
    } catch {
      if (onNotify) onNotify('Failed to load sample batch', 'error');
    }
  };

  // Apply Pre-configured Template
  const applyPresetTemplate = (preset) => {
    if (preset.type) setWatermarkType(preset.type);
    if (preset.text) setWmText(preset.text);
    if (preset.layout) setLayoutMode(preset.layout);
    if (preset.position) setGridPosition(preset.position);
    if (preset.fontSize) setWmFontSize(preset.fontSize);
    if (preset.opacity !== undefined) setWmOpacity(preset.opacity);
    if (preset.hasShadow !== undefined) setWmHasShadow(preset.hasShadow);
    if (preset.hasBadge !== undefined) setWmHasBadge(preset.hasBadge);
    if (preset.rotation !== undefined) setRotation(preset.rotation);
    if (preset.tileAngle !== undefined) setTileAngle(preset.tileAngle);
    if (preset.logoPreset) {
      handleLoadSampleLogo(preset.logoPreset);
    }
    setActiveTab('single');
    if (onNotify) onNotify(`Applied "${preset.name}" preset!`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP HEADER & NAVIGATION BAR - DREAMKIT UNIFIED STYLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Stamp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Image Watermark Studio
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                100% Client-Side
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stamp custom signatures, brand logos, copyright seals, or diagonal anti-theft proof grids with zero server uploads.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'single'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>Watermark Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Watermark</span>
            {bulkQueue.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                {bulkQueue.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets & Guides</span>
          </button>
        </div>
      </div>

      {/* GLOBAL ACTIVE IMAGE STATUS BAR (WHEN SOURCE FILE IS LOADED) */}
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear Image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE WATERMARK STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'single' && (
        <>
          {/* EMPTY STATE / DROPZONE WHEN NO IMAGE LOADED */}
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
                Supports PNG, JPG, WebP, SVG, AVIF • Processed 100% locally with high-DPI canvas
              </p>

              <div
                className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-slate-400">Quick Test:</span>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('landscape')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
                >
                  Sunset Landscape
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('abstract')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
                >
                  Brand Showcase
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: MAIN PREVIEW CANVAS & STATS (8 Cols) */}
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
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setViewCompare('result')}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                          viewCompare === 'result'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Watermarked
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewCompare('original')}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                          viewCompare === 'original'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Original
                      </button>
                    </div>

                    {isProcessing && (
                      <span className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Rendering...</span>
                      </span>
                    )}
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPreviewZoom('fit')}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                          previewZoom === 'fit'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Fit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom('100')}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                          previewZoom === '100'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        100%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom('150')}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                          previewZoom === '150'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        150%
                      </button>
                    </div>
                  </div>
                </div>

                {/* MAIN CANVAS STAGE CONTAINER */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 shadow-md min-h-[440px] max-h-[640px] flex items-center justify-center p-4 select-none">
                  <div className="w-full h-full flex items-center justify-center overflow-auto max-h-[580px]">
                    <img
                      src={viewCompare === 'result' ? (processedResult?.url || sourcePreviewUrl) : sourcePreviewUrl}
                      alt="Watermark preview"
                      className={`rounded-lg transition-transform duration-150 ${
                        previewZoom === 'fit'
                          ? 'max-h-[520px] max-w-full object-contain'
                          : previewZoom === '150'
                          ? 'max-w-none scale-150 transform-gpu'
                          : 'max-w-none'
                      }`}
                    />
                  </div>
                </div>

                {/* STATS BANNER UNDERNEATH VIEWPORT */}
                {processedResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Dimensions</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {processedResult.width} × {processedResult.height} px
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Watermarked Size</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {formatBytes(processedResult.size)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Export Format</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono">
                        {outputFormat.replace('image/', '')} ({outputQuality}%)
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Rendered in {processedResult.durationMs}ms
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCopyToClipboard}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Copy image to clipboard"
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
                {/* CARD 1: WATERMARK STYLE & CONTENT */}
                <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Watermark Style</span>
                    </h3>
                  </div>

                  {/* Mode Toggle: Text vs Logo */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setWatermarkType('text')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        watermarkType === 'text'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>Text Mark</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWatermarkType('image')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        watermarkType === 'image'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Logo Overlay</span>
                    </button>
                  </div>

                  {/* TEXT MODE CONTROLS */}
                  {watermarkType === 'text' ? (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Signature / Text
                        </label>
                        <input
                          type="text"
                          value={wmText}
                          onChange={(e) => setWmText(e.target.value)}
                          placeholder="e.g. © 2026 Your Name"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        {/* Quick Text Pills */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {QUICK_TEXT_PRESETS.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setWmText(p)}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Font
                          </label>
                          <select
                            value={wmFontFamily}
                            onChange={(e) => setWmFontFamily(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                          >
                            {FONT_FAMILIES.map((f) => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Weight
                          </label>
                          <select
                            value={wmFontWeight}
                            onChange={(e) => setWmFontWeight(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                          >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                            <option value="900">Black (900)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Size</label>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{wmFontSize}px</span>
                          </div>
                          <input
                            type="range"
                            min="12"
                            max="140"
                            step="2"
                            value={wmFontSize}
                            onChange={(e) => setWmFontSize(Number(e.target.value))}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Opacity</label>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{wmOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            step="1"
                            value={wmOpacity}
                            onChange={(e) => setWmOpacity(Number(e.target.value))}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Text Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={wmColor}
                              onChange={(e) => setWmColor(e.target.value)}
                              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                            />
                            <input
                              type="text"
                              value={wmColor}
                              onChange={(e) => setWmColor(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col justify-end space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={wmHasShadow}
                                onChange={(e) => setWmHasShadow(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                              />
                              <span>Drop Shadow</span>
                            </label>
                            {wmHasShadow && (
                              <input
                                type="color"
                                value={wmShadowColor}
                                onChange={(e) => setWmShadowColor(e.target.value)}
                                title="Shadow Color"
                                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={wmHasBadge}
                                onChange={(e) => setWmHasBadge(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                              />
                              <span>Pill Badge</span>
                            </label>
                            {wmHasBadge && (
                              <select
                                value={wmBadgeColor}
                                onChange={(e) => setWmBadgeColor(e.target.value)}
                                className="text-[10px] px-1 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                              >
                                <option value="rgba(0, 0, 0, 0.55)">Dark</option>
                                <option value="rgba(255, 255, 255, 0.7)">Light</option>
                                <option value="rgba(79, 70, 229, 0.7)">Indigo</option>
                                <option value="rgba(239, 68, 68, 0.7)">Red</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* LOGO OVERLAY MODE CONTROLS */
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Logo File
                        </label>
                        {!logoFile ? (
                          <div
                            onClick={() => document.getElementById('logo-file-upload')?.click()}
                            className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-3.5 text-center cursor-pointer bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-all"
                          >
                            <input
                              id="logo-file-upload"
                              type="file"
                              accept="image/png,image/webp,image/svg+xml,image/jpeg"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleLogoSelect(e.target.files[0]);
                              }}
                            />
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Upload Logo (PNG / WebP)</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Transparent background recommended</p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={logoPreviewUrl}
                                alt="Logo"
                                className="w-8 h-8 object-contain bg-slate-200 dark:bg-slate-800 rounded p-1"
                              />
                              <span className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate max-w-[140px]">
                                {logoFile.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setLogoFile(null);
                                if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
                                setLogoPreviewUrl(null);
                              }}
                              className="text-xs text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Built-in Sample Seals */}
                        <div className="mt-3">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">
                            Or pick sample seals:
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleLoadSampleLogo('badge')}
                              className="text-[11px] px-2 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium text-center transition-colors cursor-pointer"
                            >
                              Verified Seal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoadSampleLogo('copyright')}
                              className="text-[11px] px-2 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-medium text-center transition-colors cursor-pointer"
                            >
                              Shield ©
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoadSampleLogo('stamp')}
                              className="text-[11px] px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium text-center transition-colors cursor-pointer"
                            >
                              Confidential
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Logo Scale</label>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{logoScale}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="60"
                            step="1"
                            value={logoScale}
                            onChange={(e) => setLogoScale(Number(e.target.value))}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Opacity</label>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{logoOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            step="1"
                            value={logoOpacity}
                            onChange={(e) => setLogoOpacity(Number(e.target.value))}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 2: PLACEMENT & GEOMETRY */}
                <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Placement & Layout</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setLayoutMode('position')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        layoutMode === 'position'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span>9-Point Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayoutMode('tile')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        layoutMode === 'tile'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Diagonal Tiled</span>
                    </button>
                  </div>

                  {layoutMode === 'position' ? (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                          Anchor Position
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 w-full max-w-[210px] mx-auto p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                          {GRID_POSITIONS.map((pos) => {
                            const isSelected = gridPosition === pos.id;
                            return (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() => setGridPosition(pos.id)}
                                title={pos.label}
                                className={`h-9 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                {pos.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Margin</label>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{margin}px</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="160"
                            step="5"
                            value={margin}
                            onChange={(e) => setMargin(Number(e.target.value))}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rotation</label>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{rotation}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={rotation}
                            onChange={(e) => setRotation(Number(e.target.value))}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* DIAGONAL TILED CONTROLS */
                    <div className="space-y-3.5">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        <span className="font-bold">Diagonal Proof Protection:</span> Sweeps continuous repeating diagonal watermarks across the full canvas to prevent unauthorized copying.
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Angle</label>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{tileAngle}°</span>
                          </div>
                          <input
                            type="range"
                            min="-90"
                            max="90"
                            step="5"
                            value={tileAngle}
                            onChange={(e) => setTileAngle(Number(e.target.value))}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gap</label>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{tileGapX}px</span>
                          </div>
                          <input
                            type="range"
                            min="60"
                            max="300"
                            step="10"
                            value={tileGapX}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setTileGapX(val);
                              setTileGapY(val);
                            }}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 3: OUTPUT FORMAT */}
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
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Compression Quality</label>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{outputQuality}%</span>
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
      {/* TAB 2: BULK BATCH WATERMARK */}
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
              Batch watermark 10, 50, or 100 images simultaneously using your current watermark configuration.
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
                    Applying {watermarkType === 'text' ? `"${wmText}"` : 'Logo'} ({layoutMode === 'position' ? gridPosition.toUpperCase() : 'Diagonal Tile'})
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
                        <span>Processing ({bulkProgress.current}/{bulkProgress.total})...</span>
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
                          <span>Processing</span>
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
      {/* TAB 3: PRESETS & WATERMARK GUIDE */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* QUICK PRESET TEMPLATES */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>One-Click Professional Presets</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apply industry-standard watermark configurations with a single click:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {[
                {
                  name: 'Subtle Signature',
                  desc: 'Bottom-Right, 45% opacity, clean white text with soft shadow for photography portfolios.',
                  type: 'text',
                  text: '© 2026 DreamKit Photography',
                  layout: 'position',
                  position: 'se',
                  fontSize: 28,
                  opacity: 45,
                  hasShadow: true,
                  hasBadge: false,
                },
                {
                  name: 'Security Proof Tiling',
                  desc: 'Continuous diagonal tiled grid across entire image to safeguard client draft previews.',
                  type: 'text',
                  text: 'PROOF - DO NOT COPY',
                  layout: 'tile',
                  tileAngle: -35,
                  fontSize: 34,
                  opacity: 28,
                  hasShadow: false,
                  hasBadge: false,
                },
                {
                  name: 'Confidential Legal Stamp',
                  desc: 'Center red stamp emblem with tilted rotation for confidential internal documents.',
                  type: 'image',
                  logoPreset: 'stamp',
                  layout: 'position',
                  position: 'c',
                  rotation: -12,
                  opacity: 55,
                },
                {
                  name: 'Social Media Badge Pill',
                  desc: 'Bottom-Left with dark translucent pill container for maximum readability on complex backgrounds.',
                  type: 'text',
                  text: '@dreamkit_studio',
                  layout: 'position',
                  position: 'sw',
                  fontSize: 30,
                  opacity: 85,
                  hasShadow: false,
                  hasBadge: true,
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

          {/* BEST PRACTICES & REFERENCE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>Copyright Legal Notice Standards</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Under the Berne Convention and US Copyright Act (17 U.S.C. § 401), an effective copyright notice contains three elements:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">The Symbol:</span> The &copy; symbol, word &quot;Copyright&quot;, or abbreviation &quot;Copr.&quot;</li>
                <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">Year of First Publication:</span> e.g. 2026.</li>
                <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">Name of Owner:</span> Individual name or company entity.</li>
              </ul>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                &copy; 2026 DreamKit Studio. All Rights Reserved.
              </div>
            </div>

            <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Watermark Protection vs Aesthetics</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Choosing the right placement balance:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">Corner Signatures (BR / BL):</span> Visually appealing and non-intrusive, ideal for social media and client deliverables.</li>
                <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">Diagonal Full Tiling:</span> Un-croppable protection across the entire image field, ideal for stock photos and contract proofs.</li>
                <li><span className="font-semibold text-indigo-600 dark:text-indigo-400">High Contrast Pill Badge:</span> Ensures legibility regardless of whether the image background is pitch black or bright white.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
