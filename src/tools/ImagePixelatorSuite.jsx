import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Grid3X3,
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
  Sparkles,
  ExternalLink,
  Split,
  Columns,
  Square,
  Circle,
  ShieldAlert,
  Sliders,
  Eye,
  Palette,
  Layers,
  ShieldCheck
} from 'lucide-react';
import {
  PIXEL_SHAPES,
  RETRO_PALETTES,
  pixelateImage,
  createPixelatorSampleImage,
  formatBytes,
  downloadBlob
} from '../utils/imagePixelatorUtils';
import { createZipArchive } from '../utils/imageCompressorUtils';

export default function ImagePixelatorSuite({ _theme = 'dark', onNotify }) {
  // Navigation tabs: 'single' | 'bulk' | 'presets'
  const [activeTab, setActiveTab] = useState('single');

  // --- SINGLE MODE STATE ---
  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState(null);
  const [sourceDimensions, setSourceDimensions] = useState({ width: 0, height: 0 });
  const [processedResult, setProcessedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderError, setRenderError] = useState(null);

  // Pixelation Settings
  const [pixelShape, setPixelShape] = useState('square'); // 'square' | 'circle' | 'diamond' | 'hexagon'
  const [pixelSize, setPixelSize] = useState(16); // 2 to 80 px
  const [retroPalette, setRetroPalette] = useState('original'); // 'original' | 'pico8' | 'gameboy' | 'cga' | 'c64' | 'cyberpunk' | 'mono_1bit'
  const [contrastBoost, setContrastBoost] = useState(0); // -50 to 100 (%)
  const [saturationBoost, setSaturationBoost] = useState(0); // -100 to 100 (%)
  
  // Grid Overlay
  const [showGrid, setShowGrid] = useState(false);
  const [gridColor, setGridColor] = useState('#000000');
  const [gridOpacity, setGridOpacity] = useState(0.25);

  // Application Mode
  const [applyMode, setApplyMode] = useState('full'); // 'full' | 'region' | 'invert_region'
  const [regionBox, setRegionBox] = useState({ x: 30, y: 30, width: 40, height: 40 }); // percentages (0-100)

  // Output Format Settings
  const [outputFormat, setOutputFormat] = useState('image/png'); // 'image/png' | 'image/jpeg' | 'image/webp'
  const [outputQuality, setOutputQuality] = useState(92);

  // Viewport & Inspection Settings
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'side-by-side' | 'pixelated'
  const [splitPos, setSplitPos] = useState(50); // percentage 0 to 100
  const [zoomLevel, setZoomLevel] = useState('fit'); // 'fit' | '100' | '150'
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

  // Refs to track active object URLs for unmount-only cleanup
  const sourcePreviewUrlRef = useRef(null);
  const processedResultUrlRef = useRef(null);
  const bulkQueueUrlsRef = useRef([]);

  // Cleanup object URLs strictly on unmount
  useEffect(() => {
    return () => {
      if (sourcePreviewUrlRef.current) {
        URL.revokeObjectURL(sourcePreviewUrlRef.current);
        sourcePreviewUrlRef.current = null;
      }
      if (processedResultUrlRef.current) {
        URL.revokeObjectURL(processedResultUrlRef.current);
        processedResultUrlRef.current = null;
      }
      bulkQueueUrlsRef.current.forEach(item => {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
      bulkQueueUrlsRef.current = [];
    };
  }, []);

  // Load single image handler
  const handleSingleFileSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please select a valid image file (PNG, JPEG, WebP, etc.).', 'error');
      return;
    }

    if (sourcePreviewUrlRef.current) {
      URL.revokeObjectURL(sourcePreviewUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    sourcePreviewUrlRef.current = url;
    setSourceFile(file);
    setSourcePreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  }, [onNotify]);

  // Load synthetic sample image
  const handleLoadDemoImage = async (type = 'arcade') => {
    try {
      setIsProcessing(true);
      const demoFile = await createPixelatorSampleImage(type);
      handleSingleFileSelect(demoFile);
      if (type === 'idcard') {
        setApplyMode('region');
        setRegionBox({ x: 26, y: 35, width: 24, height: 26 });
      } else {
        setApplyMode('full');
      }
      if (onNotify) onNotify(`Loaded demo ${type} image!`, 'info');
    } catch {
      if (onNotify) onNotify('Failed to generate sample image', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process current single image
  const executePixelate = useCallback(async () => {
    const inputSource = sourceFile || sourcePreviewUrl;
    if (!inputSource) return;

    try {
      setIsProcessing(true);
      setRenderError(null);

      const options = {
        shape: pixelShape,
        pixelSize: Number(pixelSize),
        palette: retroPalette,
        contrast: Number(contrastBoost),
        saturation: Number(saturationBoost),
        grid: showGrid,
        showGrid,
        gridColor,
        gridOpacity: Number(gridOpacity),
        applyMode,
        mode: applyMode,
        regionBox,
        format: outputFormat,
        quality: outputQuality / 100
      };

      const result = await pixelateImage(inputSource, options);

      setProcessedResult(prev => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        processedResultUrlRef.current = result.url;
        return result;
      });
    } catch (err) {
      setRenderError(err.message || 'Error processing pixelation');
      if (onNotify) onNotify(err.message || 'Failed to pixelate image', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [
    sourceFile,
    sourcePreviewUrl,
    pixelShape,
    pixelSize,
    retroPalette,
    contrastBoost,
    saturationBoost,
    showGrid,
    gridColor,
    gridOpacity,
    applyMode,
    regionBox,
    outputFormat,
    outputQuality,
    onNotify
  ]);

  // Debounced auto-render when settings change
  useEffect(() => {
    if (!sourceFile && !sourcePreviewUrl) return;
    const timer = setTimeout(() => {
      executePixelate();
    }, 180);
    return () => clearTimeout(timer);
  }, [executePixelate, sourceFile, sourcePreviewUrl]);

  // Split slider mouse & touch drag events
  const handleSplitDragStart = () => {
    isDraggingSplit.current = true;
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingSplit.current || !splitSliderRef.current) return;
      const rect = splitSliderRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const pos = ((clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.min(100, Math.max(0, pos)));
    };

    const handleEnd = () => {
      isDraggingSplit.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    if (!processedResult?.blob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        let blobToCopy = processedResult.blob;
        if (blobToCopy.type !== 'image/png') {
          const inputSource = sourceFile || sourcePreviewUrl;
          const pngResult = await pixelateImage(inputSource, {
            shape: pixelShape,
            pixelSize: Number(pixelSize),
            palette: retroPalette,
            contrast: Number(contrastBoost),
            saturation: Number(saturationBoost),
            grid: showGrid,
            gridColor,
            gridOpacity: Number(gridOpacity),
            applyMode,
            regionBox,
            format: 'image/png',
            quality: 1.0
          });
          blobToCopy = pngResult.blob;
        }
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blobToCopy })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onNotify) onNotify('Pixelated image copied to clipboard!', 'success');
      } else {
        throw new Error('Clipboard API not supported in this browser');
      }
    } catch {
      if (onNotify) onNotify('Failed to copy image to clipboard.', 'error');
    }
  };

  // Download single processed result
  const handleDownloadSingle = () => {
    if (!processedResult?.blob) return;
    const originalBase = sourceFile?.name?.replace(/\.[^/.]+$/, '') || 'pixelated-artwork';
    const ext = outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/webp' ? 'webp' : 'png';
    const filename = `${originalBase}-pixelated-${pixelShape}-${pixelSize}px.${ext}`;
    downloadBlob(processedResult.blob, filename);
    if (onNotify) onNotify(`Downloaded ${filename}!`, 'success');
  };

  // Reset single mode
  const handleClearSingle = () => {
    if (sourcePreviewUrlRef.current) {
      URL.revokeObjectURL(sourcePreviewUrlRef.current);
      sourcePreviewUrlRef.current = null;
    }
    if (processedResultUrlRef.current) {
      URL.revokeObjectURL(processedResultUrlRef.current);
      processedResultUrlRef.current = null;
    }
    setSourceFile(null);
    setSourcePreviewUrl(null);
    setProcessedResult(null);
    setSourceDimensions({ width: 0, height: 0 });
    setRenderError(null);
  };

  // --- BULK QUEUE HANDLERS ---
  const handleBulkFilesSelect = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      if (onNotify) onNotify('Please select valid image files.', 'error');
      return;
    }

    const newItems = validFiles.map((file, idx) => ({
      id: `bulk_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      originalUrl: URL.createObjectURL(file),
      status: 'pending', // 'pending' | 'processing' | 'done' | 'failed'
      result: null,
      error: null
    }));

    setBulkQueue(prev => [...prev, ...newItems]);
    if (onNotify) onNotify(`Added ${newItems.length} images to batch queue`, 'info');
  };

  const handleRemoveBulkItem = (id) => {
    setBulkQueue(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleClearBulkQueue = () => {
    bulkQueue.forEach(item => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    });
    setBulkQueue([]);
    setBulkProgress({ current: 0, total: 0, isRunning: false });
  };

  const handleProcessBulkQueue = async () => {
    if (bulkQueue.length === 0 || bulkProgress.isRunning) return;

    setBulkProgress({ current: 0, total: bulkQueue.length, isRunning: true });

    for (let i = 0; i < bulkQueue.length; i++) {
      const item = bulkQueue[i];
      if (item.status === 'done') {
        setBulkProgress(prev => ({ ...prev, current: i + 1 }));
        continue;
      }

      setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing' } : q));

      try {
        const options = {
          shape: pixelShape,
          pixelSize: Number(pixelSize),
          palette: retroPalette,
          contrast: Number(contrastBoost),
          saturation: Number(saturationBoost),
          grid: showGrid,
          showGrid,
          gridColor,
          gridOpacity: Number(gridOpacity),
          applyMode,
          mode: applyMode,
          regionBox,
          format: outputFormat,
          quality: outputQuality / 100
        };

        const result = await pixelateImage(item.originalUrl, options);

        setBulkQueue(prev => prev.map(q => {
          if (q.id === item.id) {
            return {
              ...q,
              status: 'done',
              result,
              error: null
            };
          }
          return q;
        }));
      } catch (err) {
        setBulkQueue(prev => prev.map(q => {
          if (q.id === item.id) {
            return {
              ...q,
              status: 'failed',
              error: err.message || 'Processing error'
            };
          }
          return q;
        }));
      }

      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
    }

    setBulkProgress(prev => ({ ...prev, isRunning: false }));
    if (onNotify) onNotify('Batch pixelation processing complete!', 'success');
  };

  // Download All as ZIP
  const handleDownloadBulkZip = async () => {
    const doneItems = bulkQueue.filter(i => i.status === 'done' && i.result?.blob);
    if (doneItems.length === 0) {
      if (onNotify) onNotify('No processed images ready for ZIP archive.', 'error');
      return;
    }

    try {
      setIsZipping(true);
      const ext = outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/webp' ? 'webp' : 'png';
      
      const zipFiles = doneItems.map((item) => {
        const originalBase = item.name.replace(/\.[^/.]+$/, '');
        const filename = `${originalBase}-pixelated-${pixelShape}-${pixelSize}px.${ext}`;
        return {
          name: filename,
          blob: item.result.blob
        };
      });

      const zipBlob = await createZipArchive(zipFiles);
      downloadBlob(zipBlob, `dreamkit-pixelated-bundle-${pixelShape}-${Date.now()}.zip`);
      if (onNotify) onNotify(`Downloaded ZIP bundle containing ${doneItems.length} images!`, 'success');
    } catch {
      if (onNotify) onNotify('Failed to generate ZIP archive.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  // Apply one-click preset
  const applyPreset = (preset) => {
    setPixelShape(preset.shape);
    setPixelSize(preset.size);
    setRetroPalette(preset.palette);
    setContrastBoost(preset.contrast);
    setSaturationBoost(preset.saturation);
    setShowGrid(preset.grid);
    if (preset.gridColor) setGridColor(preset.gridColor);
    if (preset.gridOpacity) setGridOpacity(preset.gridOpacity);
    if (preset.applyMode) setApplyMode(preset.applyMode);
    if (preset.regionBox) setRegionBox(preset.regionBox);

    setActiveTab('single');
    if (onNotify) onNotify(`Applied "${preset.name}" preset!`, 'success');
  };

  // Quick preset definitions
  const PRESETS = [
    {
      id: 'arcade_8bit',
      name: '8-Bit Retro Arcade',
      category: 'Retro Gaming',
      description: 'Classic 16-color fantasy console mosaic with high contrast and subtle pixel gridlines.',
      shape: 'square',
      size: 14,
      palette: 'pico8',
      contrast: 25,
      saturation: 20,
      grid: true,
      gridColor: '#000000',
      gridOpacity: 0.25,
      applyMode: 'full'
    },
    {
      id: 'gameboy_1989',
      name: 'Game Boy 1989',
      category: 'Retro Gaming',
      description: 'Authentic 4-shade pea-soup monochrome green palette from the legendary 1989 handheld.',
      shape: 'square',
      size: 10,
      palette: 'gameboy',
      contrast: 35,
      saturation: 0,
      grid: false,
      applyMode: 'full'
    },
    {
      id: 'halftone_dots',
      name: 'Modern Halftone Dot Matrix',
      category: 'Modern Graphic Design',
      description: 'Offset circular halftone dots mimicking screen printing and vintage newspaper lithography.',
      shape: 'circle',
      size: 16,
      palette: 'original',
      contrast: 15,
      saturation: 30,
      grid: false,
      applyMode: 'full'
    },
    {
      id: 'privacy_shield',
      name: 'Confidential Privacy Shield',
      category: 'Security & PII',
      description: 'Selective censor box for anonymizing faces, ID documents, license plates, and sensitive credentials.',
      shape: 'square',
      size: 18,
      palette: 'original',
      contrast: 0,
      saturation: 0,
      grid: false,
      applyMode: 'region',
      regionBox: { x: 25, y: 25, width: 50, height: 50 }
    },
    {
      id: 'cyberpunk_honeycomb',
      name: 'Cyberpunk Honeycomb',
      category: 'Synthwave & Sci-Fi',
      description: 'Futuristic hexagonal tessellation quantized against high-voltage neon synthwave pigments.',
      shape: 'hexagon',
      size: 22,
      palette: 'cyberpunk',
      contrast: 20,
      saturation: 40,
      grid: true,
      gridColor: '#00f0ff',
      gridOpacity: 0.35,
      applyMode: 'full'
    },
    {
      id: 'c64_nostalgia',
      name: 'Commodore 64 Classic',
      category: 'Retro Computing',
      description: 'VIC-II 16-color palette replication matching 1980s 8-bit home computers and demoscene art.',
      shape: 'square',
      size: 12,
      palette: 'c64',
      contrast: 20,
      saturation: 15,
      grid: false,
      applyMode: 'full'
    }
  ];

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
            <Grid3X3 className="w-3.5 h-3.5" />
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
            <span>Batch Pixelate</span>
            {bulkQueue.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                {bulkQueue.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'presets'
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
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Zero Server Uploads • 100% In-Browser</span>
        </div>
      </div>

      {/* =========================================================================
          GLOBAL ACTIVE IMAGE STATUS BAR (WHEN SOURCE FILE IS LOADED)
         ========================================================================= */}
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
              onClick={handleClearSingle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Clear Image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: SINGLE PIXELATOR STUDIO
         ========================================================================= */}
      {activeTab === 'single' && (
        <div className="space-y-6">
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
                <Grid3X3 className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
                Drop an image here, or browse from computer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                Supports PNG, JPG, WebP, SVG, AVIF, BMP • Processed 100% locally with high-DPI canvas
              </p>

              <div
                className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-slate-400">Try Instant Demo:</span>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('arcade')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
                >
                  🚀 Arcade Hero
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('cyberpunk')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
                >
                  🌆 Cyberpunk City
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('idcard')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium transition-colors"
                >
                  🪪 ID Card Censor
                </button>
              </div>
            </div>
          ) : (
            /* Main 2-Column Studio View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* =========================================================
                  LEFT COLUMN: CANVAS VIEWPORT & COMPARISON INSPECTION
                 ========================================================= */}
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
                    {/* View Mode Pills */}
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                          viewMode === 'split'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Split</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('side-by-side')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                          viewMode === 'side-by-side'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Side-by-Side</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('pixelated')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                          viewMode === 'pixelated'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pixelated</span>
                      </button>
                    </div>

                    {isProcessing && (
                      <span className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Quantizing...</span>
                      </span>
                    )}
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      {['fit', '100', '150'].map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setZoomLevel(z)}
                          className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                            zoomLevel === z
                              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {z === 'fit' ? 'Fit' : `${z}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MAIN STAGE VIEWPORT CONTAINER */}
                <div
                  className="relative rounded-2xl overflow-hidden bg-slate-900 dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 shadow-md min-h-[440px] max-h-[640px] flex items-center justify-center select-none"
                >
                  {/* 1. SPLIT VIEW MODE */}
                  {viewMode === 'split' && (
                    <div
                      ref={splitSliderRef}
                      className="relative w-full h-full min-h-[440px] flex items-center justify-center overflow-hidden cursor-ew-resize"
                      onMouseDown={handleSplitDragStart}
                      onTouchStart={handleSplitDragStart}
                    >
                      {/* Pixelated Image (Right / Underneath) */}
                      {processedResult?.url ? (
                        <img
                          src={processedResult.url}
                          alt="Pixelated Output"
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

                      {/* Original Sharp Image (Left / Clipped overlay via CSS clipPath) */}
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
                            className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-7 h-7 rounded-full bg-white text-slate-800 shadow-lg flex items-center justify-center text-xs font-bold pointer-events-auto border border-slate-300 cursor-ew-resize hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Split className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Censor Region Visual Indicator */}
                      {applyMode !== 'full' && (
                        <div
                          className="absolute pointer-events-none border-2 border-dashed border-rose-500 bg-rose-500/10 z-20 rounded"
                          style={{
                            left: `${regionBox.x}%`,
                            top: `${regionBox.y}%`,
                            width: `${regionBox.width}%`,
                            height: `${regionBox.height}%`,
                          }}
                        >
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white uppercase shadow">
                            {applyMode === 'region' ? 'Censor Shield' : 'Sharp Subject'}
                          </span>
                        </div>
                      )}

                      {/* Corner Badges */}
                      <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <span className="px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                          Original
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 z-10 pointer-events-none">
                        <span className="px-2 py-1 rounded bg-indigo-600/90 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                          {pixelShape} ({pixelSize}px)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. SIDE-BY-SIDE MODE */}
                  {viewMode === 'side-by-side' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 w-full h-full max-h-[600px] overflow-auto">
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/50 border border-slate-800 relative">
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white uppercase">
                          Original
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
                          Pixelated ({pixelShape})
                        </div>
                        <img
                          src={processedResult?.url || sourcePreviewUrl}
                          alt="Pixelated"
                          className={`max-h-[460px] object-contain rounded transition-transform duration-150 ${
                            zoomLevel === '150' ? 'scale-150 transform-gpu' : ''
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. PIXELATED ONLY MODE */}
                  {viewMode === 'pixelated' && (
                    <div className="p-4 flex items-center justify-center w-full h-full max-h-[600px] overflow-auto">
                      <img
                        src={processedResult?.url || sourcePreviewUrl}
                        alt="Pixelated Full"
                        className={`max-h-[540px] max-w-full object-contain rounded-lg shadow-lg transition-transform duration-150 ${
                          zoomLevel === '150' ? 'scale-150 transform-gpu' : ''
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* BOTTOM STATS & ACTION BANNER */}
                {processedResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Original Size</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {formatBytes(sourceFile.size)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {sourceDimensions.width} × {sourceDimensions.height} px
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Pixelated Output</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {formatBytes(processedResult.blob.size)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">
                        {outputFormat.replace('image/', '')} ({outputQuality}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Shape & Palette</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase truncate block">
                        {pixelShape} • {pixelSize}px
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {RETRO_PALETTES[retroPalette]?.label} ({processedResult.durationMs}ms)
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCopyToClipboard}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Copy pixelated image to clipboard"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSingle}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      {processedResult.url && (
                        <a
                          href={processedResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                          title="Open Full Resolution in New Tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================
                  RIGHT COLUMN: SETTINGS & CONTROLS PANELS (4 Cols)
                 ========================================================= */}
              <div className="lg:col-span-4 space-y-4">
                {/* CARD 1: CELL GEOMETRY & PIXEL SIZE */}
                <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-500" />
                      Pixel Geometry & Size
                    </h3>
                  </div>

                  {/* Cell Shape Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Cell Tessellation Shape
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(PIXEL_SHAPES).map(([key, info]) => {
                        const Icon = key === 'circle' ? Circle : Square;
                        const isSelected = pixelShape === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setPixelShape(key)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold block truncate">{info.label}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{info.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pixel Size Slider */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Pixel Cell Size
                      </label>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                        {pixelSize} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={80}
                      step={1}
                      value={pixelSize}
                      onChange={(e) => setPixelSize(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>2px (Fine)</span>
                      <span>16px (Standard)</span>
                      <span>80px (Chunky)</span>
                    </div>

                    {/* Quick chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[4, 8, 12, 16, 24, 32, 48].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPixelSize(s)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                            pixelSize === s
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {s}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid Lines Overlay Toggle */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Tile Grid Lines Overlay
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showGrid}
                          onChange={(e) => setShowGrid(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600" />
                      </label>
                    </div>

                    {showGrid && (
                      <div className="grid grid-cols-2 gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                            Grid Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={gridColor}
                              onChange={(e) => setGridColor(e.target.value)}
                              className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                            />
                            <span className="text-xs font-mono text-slate-600 dark:text-slate-300 uppercase">
                              {gridColor}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            <span>Opacity</span>
                            <span>{Math.round(gridOpacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0.05}
                            max={1.0}
                            step={0.05}
                            value={gridOpacity}
                            onChange={(e) => setGridOpacity(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: RETRO COLOR PALETTES & GRADING */}
                <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-500" />
                      Retro Palettes & Color Grading
                    </h3>
                  </div>

                  {/* Palette Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Color Quantization Palette
                    </label>
                    <div className="space-y-2">
                      {Object.entries(RETRO_PALETTES).map(([key, pal]) => {
                        const isSelected = retroPalette === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setRetroPalette(key)}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold">{pal.label}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                                {pal.colors ? `${pal.colors.length} colors` : 'Truecolor'}
                              </span>
                            </div>

                            {/* Color Swatch Bar */}
                            {pal.colors ? (
                              <div className="flex h-3 rounded-md overflow-hidden border border-slate-700/40 shadow-inner">
                                {pal.colors.map((c, idx) => (
                                  <div
                                    key={idx}
                                    className="flex-1 h-full"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="h-3 rounded-md overflow-hidden bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-purple-500 border border-slate-700/40 shadow-inner" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contrast & Saturation Boost Sliders */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Contrast Boost</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                          {contrastBoost > 0 ? `+${contrastBoost}%` : `${contrastBoost}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-50}
                        max={100}
                        step={5}
                        value={contrastBoost}
                        onChange={(e) => setContrastBoost(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Saturation Punch</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold font-mono">
                          {saturationBoost > 0 ? `+${saturationBoost}%` : `${saturationBoost}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        step={5}
                        value={saturationBoost}
                        onChange={(e) => setSaturationBoost(Number(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 3: APPLICATION MODE & REGION CENSOR */}
                <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      Coverage & Privacy Shield
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setApplyMode('full')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        applyMode === 'full'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Entire Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyMode('region')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        applyMode === 'region'
                          ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Censor Box
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyMode('invert_region')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        applyMode === 'invert_region'
                          ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Invert Box
                    </button>
                  </div>

                  {applyMode !== 'full' && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        Position the Privacy Shield Box over sensitive areas:
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Pos X</span>
                            <span>{regionBox.x}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={90}
                            value={regionBox.x}
                            onChange={(e) => setRegionBox(prev => ({ ...prev, x: Number(e.target.value) }))}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Pos Y</span>
                            <span>{regionBox.y}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={90}
                            value={regionBox.y}
                            onChange={(e) => setRegionBox(prev => ({ ...prev, y: Number(e.target.value) }))}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Width</span>
                            <span>{regionBox.width}%</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={90}
                            value={regionBox.width}
                            onChange={(e) => setRegionBox(prev => ({ ...prev, width: Number(e.target.value) }))}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Height</span>
                            <span>{regionBox.height}%</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={90}
                            value={regionBox.height}
                            onChange={(e) => setRegionBox(prev => ({ ...prev, height: Number(e.target.value) }))}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Quick preset positions */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setRegionBox({ x: 30, y: 30, width: 40, height: 40 })}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          Center Box
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegionBox({ x: 35, y: 15, width: 30, height: 35 })}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          Face / Portrait
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegionBox({ x: 10, y: 65, width: 80, height: 25 })}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          Bottom Third
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 4: EXPORT FORMAT & QUALITY */}
                <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-500" />
                      Output Format & Quality
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { format: 'image/png', label: 'PNG', hint: 'Lossless' },
                      { format: 'image/webp', label: 'WebP', hint: 'Modern' },
                      { format: 'image/jpeg', label: 'JPEG', hint: 'Small Size' }
                    ].map((f) => (
                      <button
                        key={f.format}
                        type="button"
                        onClick={() => setOutputFormat(f.format)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          outputFormat === f.format
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold block">{f.label}</span>
                        <span className="text-[10px] text-slate-400 block">{f.hint}</span>
                      </button>
                    ))}
                  </div>

                  {outputFormat !== 'image/png' && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Encoding Quality</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{outputQuality}%</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={100}
                        step={1}
                        value={outputQuality}
                        onChange={(e) => setOutputQuality(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: BULK QUEUE PIXELATOR
         ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          {/* Multi-file Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingBulk(true); }}
            onDragLeave={() => setIsDraggingBulk(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingBulk(false);
              if (e.dataTransfer.files) handleBulkFilesSelect(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById('bulk-file-upload')?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDraggingBulk
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-400 dark:hover:border-indigo-600'
            }`}
          >
            <input
              id="bulk-file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleBulkFilesSelect(e.target.files);
              }}
            />
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                <FileArchive className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Batch Pixelate Multiple Images
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select multiple files to process them concurrently with current shape ({pixelShape}) and palette ({RETRO_PALETTES[retroPalette]?.label}).
              </p>

              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all">
                <Upload className="w-3.5 h-3.5" />
                Select Multiple Files
              </span>
            </div>
          </div>

          {/* Bulk Queue Management & Actions */}
          {bulkQueue.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Queue: {bulkQueue.length} {bulkQueue.length === 1 ? 'file' : 'files'}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({bulkQueue.filter(i => i.status === 'done').length} completed)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleProcessBulkQueue}
                    disabled={bulkProgress.isRunning}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    <Zap className={`w-3.5 h-3.5 ${bulkProgress.isRunning ? 'animate-spin' : ''}`} />
                    {bulkProgress.isRunning ? 'Processing...' : 'Process All'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBulkZip}
                    disabled={isZipping || bulkQueue.filter(i => i.status === 'done').length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <FileArchive className="w-3.5 h-3.5" />
                    {isZipping ? 'Archiving...' : 'Download ZIP Bundle'}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearBulkQueue}
                    disabled={bulkProgress.isRunning}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {bulkProgress.isRunning && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-indigo-300">
                    <span>Processing Batch Queue...</span>
                    <span>{bulkProgress.current} / {bulkProgress.total}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Queue Items Table */}
              <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bulkQueue.map((item) => (
                    <div key={item.id} className="p-3 sm:p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-black flex items-center justify-center">
                          <img
                            src={item.result?.url || item.originalUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{formatBytes(item.size)}</span>
                            {item.result && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-mono">
                                  {formatBytes(item.result.blob.size)} ({item.result.durationMs}ms)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Pending
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Processing
                          </span>
                        )}
                        {item.status === 'done' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Done
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Failed
                          </span>
                        )}

                        {item.status === 'done' && item.result && (
                          <button
                            type="button"
                            onClick={() => {
                              const ext = outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/webp' ? 'webp' : 'png';
                              downloadBlob(item.result.blob, `${item.name.replace(/\.[^/.]+$/, '')}-pixelated.${ext}`);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Download this file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveBulkItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: PRESETS & TECHNICAL GUIDE
         ========================================================================= */}
      {activeTab === 'presets' && (
        <div className="space-y-8">
          {/* Curated Presets Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                One-Click Retro & Privacy Presets
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                        {preset.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {preset.size}px • {preset.shape}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Load Preset Into Studio
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Educational & Technical Guide */}
          <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Technical Guide: Canvas Pixelation & Color Quantization
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  How high-performance client-side tessellation and perceptual nearest-neighbor matching work.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <Square className="w-4 h-4 text-indigo-500" /> Geometric Cell Tessellation
                </h4>
                <p>
                  Pixelation groups spatial blocks of size <code className="text-indigo-500">S × S</code> and calculates the arithmetic mean of RGB channels across all interior pixels. DreamKit renders multiple shapes:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
                  <li><strong>Square:</strong> Traditional raster mosaic.</li>
                  <li><strong>Circle:</strong> Halftone print screening.</li>
                  <li><strong>Diamond:</strong> 45° angled rhomboid grid.</li>
                  <li><strong>Hexagon:</strong> Honeycomb packing with offset coordinate rows.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-purple-500" /> Perceptual Color Matching
                </h4>
                <p>
                  Human eyes are substantially more sensitive to green wavelengths than red or blue. Rather than naïve Euclidean distance, our nearest-neighbor quantization engine computes weighted luminance distance:
                </p>
                <div className="p-2 rounded bg-black/40 font-mono text-[10px] text-indigo-300">
                  ΔE² = 0.30(ΔR)² + 0.59(ΔG)² + 0.11(ΔB)²
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  This reproduces authentic 8-bit shades with high perceptual fidelity.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Privacy & PII Protection
                </h4>
                <p>
                  Pixelation is widely used to obscure identity in broadcast news and legal filings.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
                  <li><strong>Cell Size:</strong> Always use at least 16px to 24px cells on faces to prevent AI super-resolution de-anonymization.</li>
                  <li><strong>Zero Leakage:</strong> Processing executes 100% in local browser memory without uploading raw credentials to any cloud server.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
