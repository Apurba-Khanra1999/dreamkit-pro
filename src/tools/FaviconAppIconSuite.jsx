import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  FileArchive,
  AlertCircle,
  Zap,
  Eye,
  Type,
  Image as ImageIcon,
  Smartphone,
  Globe,
  Monitor,
  Code2,
  FileJson,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import {
  GRADIENT_PALETTES,
  FONT_OPTIONS,
  formatBytes,
  renderMasterCanvas,
  generateFaviconPackage,
  createFaviconSample,
  downloadBlob,
  canvasToBlob
} from '../utils/faviconGeneratorUtils';
import { createZipArchive } from '../utils/imageCompressorUtils';

export default function FaviconAppIconSuite({ _theme = 'dark', onNotify }) {
  // --- CREATION MODES ---
  const [creationMode, setCreationMode] = useState('text'); // 'image' | 'text'

  // --- IMAGE SOURCE STATE ---
  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState(null);
  const [sourceDimensions, setSourceDimensions] = useState({ width: 0, height: 0 });

  // --- TEXT & MONOGRAM STUDIO STATE ---
  const [textInput, setTextInput] = useState('⚡');
  const [selectedFont, setSelectedFont] = useState('display');
  const [fontSizePct, setFontSizePct] = useState(58);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textShadow, setTextShadow] = useState(true);

  // --- STYLING & SHAPE STATE ---
  const [paddingPct, setPaddingPct] = useState(12);
  const [bgType, setBgType] = useState('gradient'); // 'transparent' | 'color' | 'gradient'
  const [bgColor, setBgColor] = useState('#4f46e5');
  const [selectedGradientId, setSelectedGradientId] = useState('indigo_violet');
  const [shape, setShape] = useState('squircle'); // 'none' | 'squircle' | 'rounded' | 'circle' | 'hexagon'
  const [cornerRadius, setCornerRadius] = useState(24);

  // --- APP METADATA ---
  const [appName, setAppName] = useState('DreamKit App');
  const [shortName, setShortName] = useState('DreamKit');
  const [themeColor, setThemeColor] = useState('#4f46e5');
  const [manifestBgColor, setManifestBgColor] = useState('#ffffff');

  // --- LIVE PREVIEW & TABS ---
  const [previewPlatform, setPreviewPlatform] = useState('browser'); // 'browser' | 'google' | 'ios' | 'android' | 'windows'
  const [activeTab, setActiveTab] = useState('assets'); // 'assets' | 'code' | 'manifest' | 'browserconfig'
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'browser' | 'ios' | 'android' | 'windows'

  // --- GENERATION & EXPORT STATE ---
  const [masterPreviewUrl, setMasterPreviewUrl] = useState(null);
  const [packageResult, setPackageResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState(null);

  // --- REFS FOR UNMOUNT-ONLY CLEANUP ---
  const sourcePreviewUrlRef = useRef(null);
  const masterPreviewUrlRef = useRef(null);
  const packageUrlsRef = useRef([]);

  // Cleanup object URLs strictly on unmount
  useEffect(() => {
    return () => {
      if (sourcePreviewUrlRef.current) {
        URL.revokeObjectURL(sourcePreviewUrlRef.current);
        sourcePreviewUrlRef.current = null;
      }
      if (masterPreviewUrlRef.current) {
        URL.revokeObjectURL(masterPreviewUrlRef.current);
        masterPreviewUrlRef.current = null;
      }
      packageUrlsRef.current.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
      packageUrlsRef.current = [];
    };
  }, []);

  // Selected gradient config
  const currentGradient = useMemo(() => {
    return GRADIENT_PALETTES.find(g => g.id === selectedGradientId) || GRADIENT_PALETTES[0];
  }, [selectedGradientId]);

  // Selected font config
  const currentFont = useMemo(() => {
    return FONT_OPTIONS.find(f => f.id === selectedFont) || FONT_OPTIONS[0];
  }, [selectedFont]);

  // Load single image file
  const handleFileSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please select a valid image file (PNG, SVG, JPEG, WebP).', 'error');
      return;
    }

    if (sourcePreviewUrlRef.current) {
      URL.revokeObjectURL(sourcePreviewUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    sourcePreviewUrlRef.current = url;
    setSourceFile(file);
    setSourcePreviewUrl(url);
    setCreationMode('image');

    const img = new Image();
    img.onload = () => {
      setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  }, [onNotify]);

  // Load demo sample
  const handleLoadDemo = async (type = 'lightning') => {
    try {
      setIsProcessing(true);
      const demoFile = await createFaviconSample(type);
      handleFileSelect(demoFile);
      if (type === 'lightning') {
        setAppName('TechSpark Pro');
        setShortName('TechSpark');
        setThemeColor('#4f46e5');
      } else if (type === 'fintech') {
        setAppName('Apex Diamond');
        setShortName('Apex');
        setThemeColor('#059669');
      } else if (type === 'studio') {
        setAppName('Lumina Studio');
        setShortName('Lumina');
        setThemeColor('#c026d3');
      } else {
        setAppName('Monogram Luxury');
        setShortName('Monogram');
        setThemeColor('#1e293b');
      }
      if (onNotify) onNotify(`Loaded demo icon preset!`, 'info');
    } catch {
      if (onNotify) onNotify('Failed to generate demo icon', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-generate master preview canvas and full icon package
  const executeGeneration = useCallback(async () => {
    try {
      setIsProcessing(true);
      setRenderError(null);

      const renderOptions = {
        targetSize: 512,
        mode: creationMode,
        sourceImage: sourceFile || sourcePreviewUrl,
        text: textInput || '⚡',
        fontFamily: currentFont.family,
        fontSize: Number(fontSizePct),
        textColor,
        textShadow,
        padding: Number(paddingPct),
        bgType,
        bgColor,
        gradientColors: currentGradient.colors,
        gradientAngle: currentGradient.angle,
        shape,
        radius: Number(cornerRadius),
      };

      const metadata = {
        name: appName,
        shortName,
        themeColor,
        bgColor: manifestBgColor,
      };

      // 1. Render Master Canvas for preview
      const masterCanvas = await renderMasterCanvas(renderOptions);
      const masterBlob = await canvasToBlob(masterCanvas, 'image/png');
      const newMasterUrl = URL.createObjectURL(masterBlob);

      if (masterPreviewUrlRef.current) {
        URL.revokeObjectURL(masterPreviewUrlRef.current);
      }
      masterPreviewUrlRef.current = newMasterUrl;
      setMasterPreviewUrl(newMasterUrl);

      // 2. Generate Full Multi-Platform Package
      const pkg = await generateFaviconPackage(renderOptions, metadata);

      // Revoke old package URLs
      packageUrlsRef.current.forEach(u => {
        if (u) URL.revokeObjectURL(u);
      });
      packageUrlsRef.current = pkg.items.map(it => it.url).filter(Boolean);

      setPackageResult(pkg);
    } catch (err) {
      console.error(err);
      setRenderError(err.message || 'Error generating favicon package');
      if (onNotify) onNotify(err.message || 'Failed to render icons', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [
    creationMode,
    sourceFile,
    sourcePreviewUrl,
    textInput,
    currentFont,
    fontSizePct,
    textColor,
    textShadow,
    paddingPct,
    bgType,
    bgColor,
    currentGradient,
    shape,
    cornerRadius,
    appName,
    shortName,
    themeColor,
    manifestBgColor,
    onNotify
  ]);

  // Debounced auto-render when styling or parameters change
  useEffect(() => {
    const timer = setTimeout(() => {
      executeGeneration();
    }, 180);
    return () => clearTimeout(timer);
  }, [executeGeneration]);

  // Clear / Reset to Defaults
  const handleReset = () => {
    if (sourcePreviewUrlRef.current) {
      URL.revokeObjectURL(sourcePreviewUrlRef.current);
      sourcePreviewUrlRef.current = null;
    }
    setSourceFile(null);
    setSourcePreviewUrl(null);
    setSourceDimensions({ width: 0, height: 0 });
    setCreationMode('text');
    setTextInput('⚡');
    setBgType('gradient');
    setSelectedGradientId('indigo_violet');
    setShape('squircle');
    setPaddingPct(12);
  };

  // Download All Assets (.ZIP)
  const handleDownloadZip = async () => {
    if (!packageResult || packageResult.items.length === 0) {
      if (onNotify) onNotify('No generated icons available to bundle.', 'error');
      return;
    }

    try {
      setIsZipping(true);
      const zipFiles = [];

      // Add all image blobs
      for (const item of packageResult.items) {
        zipFiles.push({
          name: item.name,
          blob: item.blob,
        });
      }

      // Add site.webmanifest
      zipFiles.push({
        name: 'site.webmanifest',
        blob: new Blob([packageResult.manifestText], { type: 'application/json' }),
      });

      // Add browserconfig.xml
      zipFiles.push({
        name: 'browserconfig.xml',
        blob: new Blob([packageResult.browserConfigXml], { type: 'application/xml' }),
      });

      // Add README.txt
      zipFiles.push({
        name: 'README.txt',
        blob: new Blob([packageResult.readmeText], { type: 'text/plain' }),
      });

      const zipBlob = await createZipArchive(zipFiles);
      const cleanAppName = appName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      downloadBlob(zipBlob, `${cleanAppName}-favicon-package.zip`);
      if (onNotify) onNotify(`Downloaded complete favicon zip package!`, 'success');
    } catch {
      if (onNotify) onNotify('Failed to create ZIP package.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  // Download single asset
  const handleDownloadSingle = (item) => {
    downloadBlob(item.blob, item.name);
    if (onNotify) onNotify(`Downloaded ${item.name}!`, 'success');
  };

  // Copy code snippet helper
  const handleCopyCode = async (codeText, key = 'code') => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopiedCodeKey(key);
      setTimeout(() => setCopiedCodeKey(null), 2000);
      if (onNotify) onNotify('Copied to clipboard!', 'success');
    } catch {
      if (onNotify) onNotify('Failed to copy to clipboard', 'error');
    }
  };

  // Copy PNG image to clipboard
  const handleCopyPng = async () => {
    const pngItem = packageResult?.items.find(i => i.name === 'favicon-32x32.png') || packageResult?.items[0];
    if (!pngItem?.blob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngItem.blob })
        ]);
        if (onNotify) onNotify('32x32 Favicon copied to clipboard!', 'success');
      }
    } catch {
      if (onNotify) onNotify('Clipboard copy not supported for image', 'error');
    }
  };

  // Filtered presets by category
  const filteredItems = useMemo(() => {
    if (!packageResult?.items) return [];
    if (selectedCategory === 'all') return packageResult.items;
    return packageResult.items.filter(it => it.preset.category === selectedCategory);
  }, [packageResult, selectedCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action & Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Left: Status & Capability Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            PWA Ready
          </span>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>100% In-Browser • Multi-Platform Bundle</span>
          </div>
        </div>

        {/* Global Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={executeGeneration}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800/80 transition-all cursor-pointer disabled:opacity-50"
            title="Re-render all platform assets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping || !packageResult}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            title="Download full icon bundle as ZIP"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Bundling...' : 'Download Package (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ERROR BANNER
         ========================================================================= */}
      {renderError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{renderError}</span>
        </div>
      )}

      {/* =========================================================================
          MAIN INTERFACE WORKSPACE (2 COLUMNS: CONFIG CONTROLS & LIVE PREVIEW/PACK)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =======================================================================
            LEFT COLUMN: CONTROLS & DESIGN STUDIO (5 COLS)
           ======================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* CREATION MODE TOGGLE */}
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex">
            <button
              type="button"
              onClick={() => setCreationMode('text')}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                creationMode === 'text'
                  ? 'bg-white dark:bg-[#111622] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text & Emoji Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('image')}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                creationMode === 'image'
                  ? 'bg-white dark:bg-[#111622] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Upload Image / SVG</span>
            </button>
          </div>

          {/* STUDIO CONTROLS CARD */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            {creationMode === 'image' ? (
              /* IMAGE UPLOAD MODE */
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Source Image / Logo
                </label>

                {sourcePreviewUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 p-1 flex items-center justify-center">
                        <img src={sourcePreviewUrl} alt="Source" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {sourceFile ? sourceFile.name : 'Active Image'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {sourceDimensions.width} × {sourceDimensions.height} px
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                      title="Clear source image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer transition-colors group">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                    <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Click or drag icon/logo file here
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      PNG, SVG, JPEG, or WebP (square recommended)
                    </span>
                  </label>
                )}

                {/* Demo Presets Row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                    Or try a designer preset:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadDemo('lightning')}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tech Spark</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadDemo('fintech')}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Fintech Diamond</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadDemo('studio')}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-fuchsia-500" />
                      <span>Creative Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadDemo('monogram')}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <Type className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Minimal Monogram</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* TEXT & EMOJI STUDIO MODE */
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                    Icon Text or Emoji
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="e.g. ⚡ or DK"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-1">
                      {['⚡', '🚀', 'DK', 'A'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTextInput(s)}
                          className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Font & Color Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Font Family
                    </label>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {FONT_OPTIONS.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-8 h-7 rounded border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Size & Text Shadow */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Font Scale</span>
                    <span className="font-mono text-slate-500">{fontSizePct}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={90}
                    value={fontSizePct}
                    onChange={(e) => setFontSizePct(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={textShadow}
                        onChange={(e) => setTextShadow(e.target.checked)}
                        className="rounded text-indigo-600 accent-indigo-600"
                      />
                      <span>Drop Shadow</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* COMMON STYLING CONTROLS */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
              {/* SHAPE MASK SELECTOR */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Icon Base Shape
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'squircle', label: 'Squircle' },
                    { id: 'circle', label: 'Circle' },
                    { id: 'rounded', label: 'Rounded' },
                    { id: 'none', label: 'Square' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setShape(s.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                        shape === s.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {(shape === 'rounded' || shape === 'squircle') && (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Corner Curvature</span>
                      <span className="font-mono text-slate-500">{cornerRadius}%</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={40}
                      value={cornerRadius}
                      onChange={(e) => setCornerRadius(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* BACKGROUND FILL SELECTOR */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Background Fill
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {['gradient', 'color', 'transparent'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBgType(t)}
                      className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium capitalize border transition-all cursor-pointer ${
                        bgType === t
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {bgType === 'gradient' && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {GRADIENT_PALETTES.map((grad) => (
                      <button
                        key={grad.id}
                        type="button"
                        onClick={() => setSelectedGradientId(grad.id)}
                        className={`h-7 rounded-lg border-2 transition-transform cursor-pointer relative overflow-hidden ${
                          selectedGradientId === grad.id ? 'border-white ring-2 ring-indigo-500 scale-105' : 'border-transparent'
                        }`}
                        style={{
                          background: `linear-gradient(${grad.angle}deg, ${grad.colors.join(', ')})`
                        }}
                        title={grad.name}
                      />
                    ))}
                  </div>
                )}

                {bgType === 'color' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase"
                    />
                  </div>
                )}
              </div>

              {/* PADDING / MARGIN SLIDER */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Safe Margin / Padding
                  </span>
                  <span className="font-mono text-slate-500">{paddingPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={35}
                  value={paddingPct}
                  onChange={(e) => setPaddingPct(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  Adds safe breathing room so icons are not clipped on circular or squircle masks.
                </p>
              </div>
            </div>

            {/* PWA & APP METADATA ACCORDION */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Web App & PWA Metadata
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">App Name</span>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    placeholder="My App"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Short Name</span>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    placeholder="App"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Theme Color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Background Color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={manifestBgColor}
                      onChange={(e) => setManifestBgColor(e.target.value)}
                      className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={manifestBgColor}
                      onChange={(e) => setManifestBgColor(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN: REALISTIC DEVICE PREVIEW & ASSET GALLERY (7 COLS)
           ======================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* REALISTIC PREVIEW CONTAINER */}
          <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* PLATFORM SWITCHER HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Live Device Previews
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {[
                  { id: 'browser', label: 'Browser Tab', icon: Globe },
                  { id: 'google', label: 'Google SERP', icon: SearchIcon },
                  { id: 'ios', label: 'iOS Home', icon: Smartphone },
                  { id: 'android', label: 'Android PWA', icon: Smartphone },
                  { id: 'windows', label: 'Windows Tile', icon: Monitor },
                ].map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPreviewPlatform(p.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        previewPlatform === p.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PREVIEW STAGE */}
            <div className="p-6 bg-slate-100/70 dark:bg-[#0c1017] min-h-[220px] flex items-center justify-center">
              {/* 1. BROWSER TAB PREVIEW */}
              {previewPlatform === 'browser' && (
                <div className="w-full max-w-lg rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-xl">
                  {/* Browser Chrome Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-300/80 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-700/80">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    {/* Fake URL Bar */}
                    <div className="flex-1 max-w-xs mx-4 px-3 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/80 text-[11px] text-slate-500 font-mono truncate text-center">
                      https://{shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com
                    </div>
                    <div className="w-8" />
                  </div>

                  {/* Active Tab Bar */}
                  <div className="flex items-end px-3 pt-2 bg-slate-200 dark:bg-slate-850 gap-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-white dark:bg-[#111622] text-xs font-medium text-slate-800 dark:text-slate-200 shadow-xs max-w-xs truncate border-t border-x border-slate-300/80 dark:border-slate-700">
                      {masterPreviewUrl ? (
                        <img src={masterPreviewUrl} alt="Favicon" className="w-4 h-4 rounded-xs shrink-0 object-contain" />
                      ) : (
                        <div className="w-4 h-4 bg-indigo-500 rounded-xs" />
                      )}
                      <span className="truncate">{appName}</span>
                      <span className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm leading-none ml-1 cursor-default">×</span>
                    </div>
                    <div className="px-3 py-1 text-xs text-slate-400 truncate hidden sm:block">
                      New Tab
                    </div>
                  </div>

                  {/* Tab Body Viewport */}
                  <div className="p-8 bg-white dark:bg-[#111622] flex items-center justify-center text-center">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        Browser Tab Favicon Active
                      </p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Rendered crisp at 16x16 & 32x32 standard browser resolution
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. GOOGLE SERP PREVIEW */}
              {previewPlatform === 'google' && (
                <div className="w-full max-w-md p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-lg space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {masterPreviewUrl && (
                        <img src={masterPreviewUrl} alt="SERP icon" className="w-4 h-4 object-contain rounded-xs" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {appName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        https://www.{shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com &gt; app
                      </p>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    {appName} - Official Modern Web Application
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    Access high-performance tools, verified platform specifications, and responsive cloud services with instant browser-based execution.
                  </p>
                </div>
              )}

              {/* 3. APPLE IOS HOME SCREEN PREVIEW */}
              {previewPlatform === 'ios' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative group p-1">
                    <div className="w-20 h-20 rounded-[22%] bg-gradient-to-tr from-slate-800 to-slate-900 shadow-2xl p-0.5 overflow-hidden ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center transition-transform group-hover:scale-105">
                      {masterPreviewUrl && (
                        <img src={masterPreviewUrl} alt="iOS App Icon" className="w-full h-full object-cover rounded-[22%]" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[90px] truncate text-center">
                    {shortName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">180 × 180 px</span>
                </div>
              )}

              {/* 4. ANDROID PWA ADAPTIVE PREVIEW */}
              {previewPlatform === 'android' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative p-1">
                    <div className="w-20 h-20 rounded-full bg-slate-900 shadow-xl overflow-hidden ring-2 ring-emerald-500/30 flex items-center justify-center">
                      {masterPreviewUrl && (
                        <img src={masterPreviewUrl} alt="Android Icon" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[90px] truncate text-center">
                    {shortName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">192 & 512 px Adaptive</span>
                </div>
              )}

              {/* 5. WINDOWS START MENU TILE */}
              {previewPlatform === 'windows' && (
                <div
                  className="w-36 h-36 rounded-md shadow-xl p-3 flex flex-col justify-between text-white transition-transform hover:scale-102"
                  style={{ backgroundColor: themeColor }}
                >
                  <div className="flex justify-end">
                    <span className="text-[10px] opacity-75 font-mono">150 × 150</span>
                  </div>
                  <div className="flex items-center justify-center py-1">
                    {masterPreviewUrl && (
                      <img src={masterPreviewUrl} alt="Tile Icon" className="w-14 h-14 object-contain drop-shadow-md" />
                    )}
                  </div>
                  <span className="text-xs font-bold truncate drop-shadow-xs">
                    {shortName}
                  </span>
                </div>
              )}
            </div>

            {/* QUICK ACTIONS BAR */}
            <div className="p-3 bg-white dark:bg-[#111622] border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2 text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>15 icon sizes generated automatically</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPng}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const icoItem = packageResult?.items.find(i => i.preset.id === 'ico');
                    if (icoItem) handleDownloadSingle(icoItem);
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download favicon.ico</span>
                </button>
              </div>
            </div>
          </div>

          {/* TABBED ASSETS / CODE / MANIFEST SECTION */}
          <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* TABS HEADER */}
            <div className="flex items-center border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 px-2 overflow-x-auto">
              {[
                { id: 'assets', label: 'Generated Icons Gallery', icon: Layers },
                { id: 'code', label: 'HTML <head> Tags', icon: Code2 },
                { id: 'manifest', label: 'site.webmanifest', icon: FileJson },
                { id: 'browserconfig', label: 'browserconfig.xml', icon: Monitor },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: ASSETS GALLERY */}
            {activeTab === 'assets' && (
              <div className="p-4 space-y-4">
                {/* CATEGORY FILTER PILLS */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'All Files (15)' },
                    { id: 'browser', label: 'Browsers' },
                    { id: 'ios', label: 'Apple iOS' },
                    { id: 'android', label: 'Android PWA' },
                    { id: 'windows', label: 'Windows Tiles' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* GRID OF ASSET CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredItems.map((item) => (
                    <div
                      key={item.name}
                      className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkerboard tile for icon preview */}
                        <div
                          className="w-11 h-11 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden"
                          style={{
                            backgroundImage: `linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`,
                            backgroundSize: '10px 10px',
                            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                          }}
                        >
                          <img src={item.url} alt={item.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-mono">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {item.preset.platform} • {item.width}×{item.height} px
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatBytes(item.size)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(item)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                        title={`Download ${item.name}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: HTML HEAD CODE */}
            {activeTab === 'code' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Paste inside your &lt;head&gt; tags:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(packageResult?.htmlHeadSnippet || '', 'head')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    {copiedCodeKey === 'head' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCodeKey === 'head' ? 'Copied!' : 'Copy HTML'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[300px]">
                  {packageResult?.htmlHeadSnippet || '<!-- Generating HTML tags... -->'}
                </pre>
              </div>
            )}

            {/* TAB CONTENT: SITE.WEBMANIFEST */}
            {activeTab === 'manifest' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Generated site.webmanifest:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(packageResult?.manifestText || '', 'manifest')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    {copiedCodeKey === 'manifest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCodeKey === 'manifest' ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[300px]">
                  {packageResult?.manifestText || '{\n  /* Generating manifest... */\n}'}
                </pre>
              </div>
            )}

            {/* TAB CONTENT: BROWSERCONFIG.XML */}
            {activeTab === 'browserconfig' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Generated browserconfig.xml (Windows 10/11 Tiles):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(packageResult?.browserConfigXml || '', 'xml')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    {copiedCodeKey === 'xml' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCodeKey === 'xml' ? 'Copied!' : 'Copy XML'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-amber-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[300px]">
                  {packageResult?.browserConfigXml || '<!-- Generating browserconfig... -->'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline SearchIcon helper for Google SERP preview
function SearchIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
