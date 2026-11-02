import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Share2,
  Download,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  FileArchive,
  AlertCircle,
  Zap,
  Info,
  ExternalLink,
  Crop,
  Layers,
  Sliders,
  Eye,
  Layout
} from 'lucide-react';
import {
  SOCIAL_PLATFORMS,
  SOCIAL_PRESETS,
  resizeSocialMediaImage,
  createSocialMediaSampleImage,
  formatBytes,
  downloadBlob
} from '../utils/socialMediaResizerUtils';
import { createZipArchive } from '../utils/imageCompressorUtils';

export default function SocialMediaResizerSuite({ _theme = 'dark', onNotify }) {
  // Navigation tabs: 'single' | 'pack' | 'guide'
  const [activeTab, setActiveTab] = useState('single');

  // --- SOURCE IMAGE STATE ---
  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState(null);
  const [sourceDimensions, setSourceDimensions] = useState({ width: 0, height: 0 });
  const [processedResult, setProcessedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderError, setRenderError] = useState(null);

  // --- SINGLE RESIZER SETTINGS ---
  const [selectedPlatform, setSelectedPlatform] = useState('all'); // 'all' | 'instagram' | 'youtube' | etc.
  const [selectedPresetId, setSelectedPresetId] = useState('yt_thumbnail'); // default YouTube 1280x720
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [aspectRatioValue, setAspectRatioValue] = useState(1);

  // Fit & Composition Settings
  const [fitMode, setFitMode] = useState('cover'); // 'cover' | 'contain' | 'stretch'
  const [anchor, setAnchor] = useState('center'); // 'center' | 'top' | 'bottom' | 'left' | 'right'
  const [paddingType, setPaddingType] = useState('blur'); // 'blur' | 'color' | 'gradient' | 'transparent'
  const [paddingColor, setPaddingColor] = useState('#0f172a');
  const [gradientType, setGradientType] = useState('dark'); // 'dark' | 'sunset' | 'ocean' | 'neon'
  const [blurStrength, setBlurStrength] = useState(30);

  // Safe area guide overlay
  const [showSafeArea, setShowSafeArea] = useState(true);

  // Output settings
  const [outputFormat, setOutputFormat] = useState('image/png'); // 'image/png' | 'image/jpeg' | 'image/webp'
  const [outputQuality, setOutputQuality] = useState(92);

  // Viewport Settings
  const [zoomLevel, setZoomLevel] = useState('fit'); // 'fit' | '100' | '150'
  const [copied, setCopied] = useState(false);
  const [isDraggingSingle, setIsDraggingSingle] = useState(false);

  // --- MULTI-PLATFORM PACK EXPORT STATE ---
  const [selectedPackPresets, setSelectedPackPresets] = useState(() => [
    'yt_thumbnail',
    'ig_portrait',
    'ig_square',
    'ig_story',
    'x_post',
    'li_post',
    'pin_standard',
    'tt_video'
  ]);
  const [packResults, setPackResults] = useState([]);
  const [packProgress, setPackProgress] = useState({ current: 0, total: 0, isRunning: false });
  const [isZipping, setIsZipping] = useState(false);

  // Current active preset object
  const currentPreset = SOCIAL_PRESETS.find(p => p.id === selectedPresetId) || SOCIAL_PRESETS[0];

  // Refs to track active object URLs for unmount-only cleanup
  const sourcePreviewUrlRef = useRef(null);
  const processedResultUrlRef = useRef(null);
  const packResultsUrlsRef = useRef([]);

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
      packResultsUrlsRef.current.forEach(itemUrl => {
        if (itemUrl) URL.revokeObjectURL(itemUrl);
      });
      packResultsUrlsRef.current = [];
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
      setCustomWidth(img.naturalWidth);
      setCustomHeight(img.naturalHeight);
      setAspectRatioValue(img.naturalWidth / img.naturalHeight);
    };
    img.src = url;
  }, [onNotify]);

  // Load sample demo image
  const handleLoadDemoImage = async (type = 'creator') => {
    try {
      setIsProcessing(true);
      const demoFile = await createSocialMediaSampleImage(type);
      handleSingleFileSelect(demoFile);
      if (type === 'creator') setSelectedPresetId('yt_thumbnail');
      else if (type === 'brand') setSelectedPresetId('ig_portrait');
      else setSelectedPresetId('pin_standard');
      if (onNotify) onNotify(`Loaded demo ${type} visual!`, 'info');
    } catch {
      if (onNotify) onNotify('Failed to generate sample image', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute single resize
  const executeResize = useCallback(async () => {
    const inputSource = sourceFile || sourcePreviewUrl;
    if (!inputSource) return;

    try {
      setIsProcessing(true);
      setRenderError(null);

      const targetW = isCustomMode ? customWidth : currentPreset.width;
      const targetH = isCustomMode ? customHeight : currentPreset.height;
      const presetName = isCustomMode ? `custom-${targetW}x${targetH}` : currentPreset.id;

      const options = {
        targetWidth: targetW,
        targetHeight: targetH,
        fitMode,
        anchor,
        paddingType,
        paddingColor,
        gradientType,
        blurStrength: Number(blurStrength),
        format: outputFormat,
        quality: outputQuality / 100,
        presetName,
        filename: sourceFile?.name,
      };

      const result = await resizeSocialMediaImage(inputSource, options);

      setProcessedResult(prev => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        processedResultUrlRef.current = result.url;
        return result;
      });
    } catch (err) {
      setRenderError(err.message || 'Error processing social resize');
      if (onNotify) onNotify(err.message || 'Failed to resize image', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [
    sourceFile,
    sourcePreviewUrl,
    isCustomMode,
    customWidth,
    customHeight,
    currentPreset,
    fitMode,
    anchor,
    paddingType,
    paddingColor,
    gradientType,
    blurStrength,
    outputFormat,
    outputQuality,
    onNotify
  ]);

  // Debounced auto-render when settings change
  useEffect(() => {
    if (!sourceFile && !sourcePreviewUrl) return;
    const timer = setTimeout(() => {
      executeResize();
    }, 160);
    return () => clearTimeout(timer);
  }, [executeResize, sourceFile, sourcePreviewUrl]);

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    if (!processedResult?.blob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        let blobToCopy = processedResult.blob;
        if (blobToCopy.type !== 'image/png') {
          const targetW = isCustomMode ? customWidth : currentPreset.width;
          const targetH = isCustomMode ? customHeight : currentPreset.height;
          const inputSource = sourceFile || sourcePreviewUrl;
          const pngResult = await resizeSocialMediaImage(inputSource, {
            targetWidth: targetW,
            targetHeight: targetH,
            fitMode,
            anchor,
            paddingType,
            paddingColor,
            gradientType,
            blurStrength: Number(blurStrength),
            format: 'image/png',
            quality: 1.0,
            presetName: currentPreset.id,
            filename: sourceFile?.name,
          });
          blobToCopy = pngResult.blob;
        }
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blobToCopy })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onNotify) onNotify('Image copied to clipboard!', 'success');
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
    downloadBlob(processedResult.blob, processedResult.name);
    if (onNotify) onNotify(`Downloaded ${processedResult.name}!`, 'success');
  };

  // Clear single image
  const handleClearSingle = () => {
    if (sourcePreviewUrlRef.current) {
      URL.revokeObjectURL(sourcePreviewUrlRef.current);
      sourcePreviewUrlRef.current = null;
    }
    if (processedResultUrlRef.current) {
      URL.revokeObjectURL(processedResultUrlRef.current);
      processedResultUrlRef.current = null;
    }
    packResultsUrlsRef.current.forEach(itemUrl => {
      if (itemUrl) URL.revokeObjectURL(itemUrl);
    });
    packResultsUrlsRef.current = [];

    setSourceFile(null);
    setSourcePreviewUrl(null);
    setProcessedResult(null);
    setPackResults([]);
    setSourceDimensions({ width: 0, height: 0 });
    setRenderError(null);
  };

  // Handle custom dimensions with lock ratio
  const handleWidthChange = (val) => {
    const w = Math.max(16, Number(val) || 16);
    setCustomWidth(w);
    if (lockAspectRatio && aspectRatioValue) {
      setCustomHeight(Math.max(16, Math.round(w / aspectRatioValue)));
    }
  };

  const handleHeightChange = (val) => {
    const h = Math.max(16, Number(val) || 16);
    setCustomHeight(h);
    if (lockAspectRatio && aspectRatioValue) {
      setCustomWidth(Math.max(16, Math.round(h * aspectRatioValue)));
    }
  };

  // Filtered preset list by platform tab
  const filteredPresets = selectedPlatform === 'all'
    ? SOCIAL_PRESETS
    : SOCIAL_PRESETS.filter(p => p.platform === selectedPlatform);

  // --- MULTI-PLATFORM PACK BATCH GENERATOR ---
  const togglePackPreset = (presetId) => {
    setSelectedPackPresets(prev => {
      if (prev.includes(presetId)) {
        return prev.filter(id => id !== presetId);
      }
      return [...prev, presetId];
    });
  };

  const selectAllPackPresets = () => {
    setSelectedPackPresets(SOCIAL_PRESETS.map(p => p.id));
  };

  const deselectAllPackPresets = () => {
    setSelectedPackPresets([]);
  };

  const handleGeneratePack = async () => {
    const inputSource = sourceFile || sourcePreviewUrl;
    if (!inputSource) {
      if (onNotify) onNotify('Please upload or select an image first.', 'error');
      return;
    }
    if (selectedPackPresets.length === 0) {
      if (onNotify) onNotify('Please select at least one format in the pack.', 'error');
      return;
    }

    setPackProgress({ current: 0, total: selectedPackPresets.length, isRunning: true });
    const results = [];

    for (let i = 0; i < selectedPackPresets.length; i++) {
      const pid = selectedPackPresets[i];
      const preset = SOCIAL_PRESETS.find(p => p.id === pid);
      if (!preset) continue;

      try {
        const options = {
          targetWidth: preset.width,
          targetHeight: preset.height,
          fitMode,
          anchor,
          paddingType,
          paddingColor,
          gradientType,
          blurStrength: Number(blurStrength),
          format: outputFormat,
          quality: outputQuality / 100,
          presetName: preset.id,
          filename: sourceFile?.name,
        };

        const res = await resizeSocialMediaImage(inputSource, options);
        results.push({
          preset,
          ...res,
        });
      } catch (err) {
        console.error(`Failed to generate preset ${pid}:`, err);
      }

      setPackProgress({ current: i + 1, total: selectedPackPresets.length, isRunning: true });
    }

    setPackResults(prev => {
      prev.forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
      packResultsUrlsRef.current = results.map(r => r.url).filter(Boolean);
      return results;
    });
    setPackProgress(prev => ({ ...prev, isRunning: false }));
    if (onNotify) onNotify(`Generated ${results.length} multi-platform assets!`, 'success');
  };

  // Download all pack assets as ZIP
  const handleDownloadPackZip = async () => {
    if (packResults.length === 0) {
      if (onNotify) onNotify('No generated assets to bundle. Please click "Generate Selected Assets" first.', 'error');
      return;
    }

    try {
      setIsZipping(true);
      const zipFiles = packResults.map(item => ({
        name: item.name,
        blob: item.blob,
      }));

      const zipBlob = await createZipArchive(zipFiles);
      const originalBase = sourceFile?.name?.replace(/\.[^/.]+$/, '') || 'social-media-kit';
      downloadBlob(zipBlob, `${originalBase}-social-pack-${Date.now()}.zip`);
      if (onNotify) onNotify(`Downloaded ZIP bundle with ${packResults.length} assets!`, 'success');
    } catch {
      if (onNotify) onNotify('Failed to build ZIP archive.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* =========================================================================
          TOP HEADER & NAVIGATION BAR - DREAMKIT UNIFIED STYLE
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Social Media Image Resizer
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                100% Client-Side
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crop, mirror blur, and adapt images into verified dimensions for Instagram, YouTube, TikTok, Twitter/X, Facebook, and LinkedIn.
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
            <Crop className="w-3.5 h-3.5" />
            <span>Single Resizer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pack')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pack'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Platform Pack</span>
            {packResults.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                {packResults.length}
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
            <Info className="w-3.5 h-3.5" />
            <span>Platform Specs</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          GLOBAL ACTIVE IMAGE STATUS BAR (WHEN SOURCE FILE IS LOADED)
         ========================================================================= */}
      {sourceFile && (
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
          TAB 1: SINGLE RESIZER STUDIO
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
                <Share2 className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
                Drop your image here, or browse from computer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                Supports PNG, JPG, WebP, SVG, AVIF • Instant multi-format social resizing
              </p>

              <div
                className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-slate-400">Try Instant Demo:</span>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('creator')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
                >
                  🎙️ Gaming / Podcast Creator
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('brand')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
                >
                  🛍️ Brand Product Showcase
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoImage('travel')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
                >
                  🌅 Sunset Travel Landscape
                </button>
              </div>
            </div>
          ) : (
            /* Main 2-Column Studio View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* =========================================================
                  LEFT COLUMN: CANVAS VIEWPORT & ACTION STATS (8 Cols)
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
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {isCustomMode ? 'Custom Canvas' : `${currentPreset.platformName} • ${currentPreset.name}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-bold">
                      {isCustomMode ? `${customWidth} × ${customHeight}` : `${currentPreset.width} × ${currentPreset.height} (${currentPreset.aspectRatio})`}
                    </span>

                    {isProcessing && (
                      <span className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Rendering...</span>
                      </span>
                    )}
                  </div>

                  {/* Right controls: Safe Area & Zoom */}
                  <div className="flex items-center gap-2">
                    {!isCustomMode && currentPreset.safeArea && (
                      <button
                        type="button"
                        onClick={() => setShowSafeArea(prev => !prev)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                          showSafeArea
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                        title="Toggle safe area composition guide"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Safe Area</span>
                      </button>
                    )}

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
                  className="relative rounded-2xl overflow-hidden bg-slate-900 dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 shadow-md min-h-[440px] max-h-[640px] flex items-center justify-center p-4 select-none"
                >
                  <div className="relative flex items-center justify-center max-w-full max-h-full">
                    {/* Rendered Image */}
                    <img
                      src={processedResult?.url || sourcePreviewUrl}
                      alt="Resized Social Media Output"
                      className={`block max-h-[540px] max-w-full object-contain rounded shadow-2xl transition-transform duration-150 ${
                        zoomLevel === '150' ? 'scale-150 transform-gpu' : ''
                      }`}
                    />

                    {/* Safe Area Overlay Guide (Non-destructive) */}
                    {!isCustomMode && showSafeArea && currentPreset.safeArea && processedResult && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {currentPreset.safeArea.top && (
                          <div
                            className="absolute top-0 inset-x-0 bg-rose-500/15 border-b border-rose-400 flex items-center justify-center text-[10px] font-bold text-rose-300 uppercase tracking-wider"
                            style={{ height: `${(currentPreset.safeArea.top / currentPreset.height) * 100}%` }}
                          >
                            Top UI Exclusion Zone
                          </div>
                        )}
                        {currentPreset.safeArea.bottom && (
                          <div
                            className="absolute bottom-0 inset-x-0 bg-rose-500/15 border-t border-rose-400 flex items-center justify-center text-[10px] font-bold text-rose-300 uppercase tracking-wider"
                            style={{ height: `${(currentPreset.safeArea.bottom / currentPreset.height) * 100}%` }}
                          >
                            Bottom Captions & Audio Zone
                          </div>
                        )}
                        {currentPreset.safeArea.width && (
                          <div
                            className="absolute border-2 border-dashed border-amber-400 bg-amber-400/10 flex items-center justify-center text-[11px] font-bold text-amber-300 uppercase tracking-wider"
                            style={{
                              width: `${(currentPreset.safeArea.width / currentPreset.width) * 100}%`,
                              height: `${(currentPreset.safeArea.height / currentPreset.height) * 100}%`,
                            }}
                          >
                            Safe Area (Text & Logos)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                      <span className="text-[11px] font-medium text-slate-400 block">Social Canvas Output</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {formatBytes(processedResult.blob.size)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {processedResult.width} × {processedResult.height} px ({outputFormat.replace('image/', '').toUpperCase()})
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Strategy</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase truncate block">
                        {fitMode} {fitMode === 'contain' ? `(${paddingType})` : `(${anchor})`}
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
                        title="Copy resized image to clipboard"
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
                  RIGHT COLUMN: SETTINGS & PRESETS (4 Cols)
                 ========================================================= */}
              <div className="lg:col-span-4 space-y-4">
                {/* CARD 1: PLATFORM PRESET SELECTOR */}
                <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layout className="w-4 h-4 text-indigo-500" />
                      Target Social Platform
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsCustomMode(prev => !prev)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        isCustomMode
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isCustomMode ? 'Using Custom' : 'Custom Size'}
                    </button>
                  </div>

                  {isCustomMode ? (
                    /* Custom Dimensions Mode */
                    <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            min={16}
                            max={8000}
                            value={customWidth}
                            onChange={(e) => handleWidthChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            min={16}
                            max={8000}
                            value={customHeight}
                            onChange={(e) => handleHeightChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                          <input
                            type="checkbox"
                            checked={lockAspectRatio}
                            onChange={(e) => {
                              setLockAspectRatio(e.target.checked);
                              if (e.target.checked && customHeight > 0) {
                                setAspectRatioValue(customWidth / customHeight);
                              }
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span>Lock Aspect Ratio</span>
                        </label>

                        {/* Quick aspect ratio chips */}
                        <div className="flex gap-1">
                          {['1:1', '16:9', '9:16', '4:5'].map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                const [rw, rh] = r.split(':').map(Number);
                                const newW = 1080;
                                const newH = Math.round((newW / rw) * rh);
                                setCustomWidth(newW);
                                setCustomHeight(newH);
                                setAspectRatioValue(rw / rh);
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Preset Platform Selector */
                    <div className="space-y-3">
                      {/* Platform Category Tabs */}
                      <div className="flex flex-wrap gap-1 pb-1">
                        <button
                          type="button"
                          onClick={() => setSelectedPlatform('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            selectedPlatform === 'all'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          All Platforms
                        </button>
                        {Object.values(SOCIAL_PLATFORMS).slice(0, 5).map(plat => (
                          <button
                            key={plat.id}
                            type="button"
                            onClick={() => setSelectedPlatform(plat.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              selectedPlatform === plat.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {plat.name}
                          </button>
                        ))}
                      </div>

                      {/* Presets List */}
                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredPresets.map(preset => {
                          const isSelected = selectedPresetId === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setSelectedPresetId(preset.id);
                                setIsCustomMode(false);
                              }}
                              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs'
                                  : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold truncate">{preset.name}</span>
                                  {preset.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                                      {preset.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 block">
                                  {preset.platformName} • {preset.aspectRatio}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0">
                                {preset.width} × {preset.height}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 2: FIT STRATEGY & COMPOSITION */}
                <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-500" />
                      Fit Strategy & Background
                    </h3>
                  </div>

                  {/* Fit Mode Selector */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setFitMode('cover')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        fitMode === 'cover'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Cover (Crop)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFitMode('contain')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        fitMode === 'contain'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Contain (Pad)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFitMode('stretch')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        fitMode === 'stretch'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Stretch
                    </button>
                  </div>

                  {/* Cover Mode: Anchor selector */}
                  {fitMode === 'cover' && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                        Crop Focus Anchor
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { id: 'top', label: 'Top' },
                          { id: 'center', label: 'Center' },
                          { id: 'bottom', label: 'Bottom' },
                          { id: 'left', label: 'Left' },
                          { id: 'right', label: 'Right' },
                        ].map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setAnchor(a.id)}
                            className={`py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-center ${
                              anchor === a.id
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contain Mode: Background padding options */}
                  {fitMode === 'contain' && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                        Pillar / Letterbox Background
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'blur', label: '✨ Blurred Mirror', desc: 'Popular for TikTok & Reels' },
                          { id: 'color', label: '🎨 Solid Color', desc: 'Custom border color' },
                          { id: 'gradient', label: '🌈 Gradient', desc: 'Modern mesh background' },
                          { id: 'transparent', label: '🏁 Transparent', desc: 'For PNG & WebP' },
                        ].map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPaddingType(p.id)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              paddingType === p.id
                                ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">{p.label}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{p.desc}</span>
                          </button>
                        ))}
                      </div>

                      {/* Blur intensity slider */}
                      {paddingType === 'blur' && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Mirror Blur Radius</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{blurStrength}px</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={60}
                            value={blurStrength}
                            onChange={(e) => setBlurStrength(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Color picker */}
                      {paddingType === 'color' && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Border Color</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={paddingColor}
                              onChange={(e) => setPaddingColor(e.target.value)}
                              className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                            />
                            <span className="text-xs font-mono uppercase text-slate-700 dark:text-slate-300">{paddingColor}</span>
                          </div>
                        </div>
                      )}

                      {/* Gradient picker */}
                      {paddingType === 'gradient' && (
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {[
                            { id: 'dark', label: 'Dark' },
                            { id: 'sunset', label: 'Sunset' },
                            { id: 'ocean', label: 'Ocean' },
                            { id: 'neon', label: 'Neon' },
                          ].map(g => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setGradientType(g.id)}
                              className={`py-1 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${
                                gradientType === g.id
                                  ? 'bg-purple-600 text-white font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CARD 3: EXPORT FORMAT & QUALITY */}
                <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-500" />
                      Output Format & Quality
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { format: 'image/png', label: 'PNG', hint: 'Crisp / Graphics' },
                      { format: 'image/webp', label: 'WebP', hint: 'Small & Fast' },
                      { format: 'image/jpeg', label: 'JPEG', hint: 'Photo Standard' }
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
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Compression Quality</span>
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
          TAB 2: MULTI-PLATFORM PACK EXPORT (PRODUCTIVITY KIT)
         ========================================================================= */}
      {activeTab === 'pack' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  One-Click Multi-Platform Asset Generator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select the social formats you need. DreamKit will adapt your image into all selected resolutions and package them into an organized ZIP archive.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPackPresets}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Select All ({SOCIAL_PRESETS.length})
                </button>
                <button
                  type="button"
                  onClick={deselectAllPackPresets}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Checkbox Grid of Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {SOCIAL_PRESETS.map(preset => {
                const isChecked = selectedPackPresets.includes(preset.id);
                return (
                  <label
                    key={preset.id}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePackPreset(preset.id)}
                      className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{preset.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{preset.aspectRatio}</span>
                      </div>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-medium block">
                        {preset.width} × {preset.height} px
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">{preset.platformName}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {selectedPackPresets.length} formats selected • Fit mode: <strong className="uppercase">{fitMode}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePack}
                  disabled={!sourceFile || packProgress.isRunning || selectedPackPresets.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 ${packProgress.isRunning ? 'animate-spin' : ''}`} />
                  {packProgress.isRunning ? 'Generating Assets...' : `Generate ${selectedPackPresets.length} Formats`}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPackZip}
                  disabled={isZipping || packResults.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <FileArchive className="w-3.5 h-3.5" />
                  {isZipping ? 'Archiving...' : 'Download ZIP Bundle'}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {packProgress.isRunning && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-indigo-300">
                  <span>Rendering Social Media Pack...</span>
                  <span>{packProgress.current} / {packProgress.total}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${(packProgress.current / packProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Generated Pack Gallery */}
          {packResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Generated Assets ({packResults.length} files)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {packResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-3 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="aspect-video bg-black/40 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                        <img src={item.url} alt={item.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {item.preset.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.width} × {item.height} px • {formatBytes(item.size)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadBlob(item.blob, item.name)}
                      className="w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: PLATFORM SPECS & CHEATSHEET
         ========================================================================= */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  2026 Social Media Aspect Ratio & Resolution Cheatsheet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Official specifications and safe zones to ensure your artwork never gets blurry, pixelated, or cropped awkwardly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {Object.values(SOCIAL_PLATFORMS).map(plat => {
                const presets = SOCIAL_PRESETS.filter(p => p.platform === plat.id);
                return (
                  <div
                    key={plat.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plat.color }} />
                        {plat.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">{presets.length} Formats</span>
                    </div>

                    <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                      {presets.map(p => (
                        <div key={p.id} className="pt-1.5 flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="truncate pr-2">{p.name}</span>
                          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                            {p.width}×{p.height}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
