import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  FileCode2,
  Download,
  Copy,
  Check,
  Sliders,
  Palette,
  AlertCircle,
  Code2,
  Split,
  Sun,
  Moon,
  Upload,
  ArrowRight
} from 'lucide-react';
import {
  OPTIMIZER_PRESETS,
  DEFAULT_OPTIMIZER_OPTIONS,
  formatBytes,
  parseSvg,
  optimizeSvg,
  extractSvgColors,
  replaceSvgColor,
  recolorSvgMonochrome,
  invertSvgColors,
  grayscaleSvgColors,
  svgToReactJsx,
  svgToDataUri,
  formatSvgCode,
  minifySvgCode,
  svgToPngBlob,
  svgToJpegBlob,
  svgToWebpBlob,
  downloadBlob,
  SAMPLE_SVGS
} from '../utils/svgOptimizerUtils';

export default function SvgOptimizerSuite({ _theme = 'dark', onNotify }) {
  // --- CORE SVG CODE STATE ---
  const [rawSvgInput, setRawSvgInput] = useState(() => SAMPLE_SVGS[0].svg);
  const [activeSampleId, setActiveSampleId] = useState(SAMPLE_SVGS[0].id);

  // --- OPTIMIZER OPTIONS STATE ---
  const [selectedPresetId, setSelectedPresetId] = useState('balanced');
  const [options, setOptions] = useState(DEFAULT_OPTIMIZER_OPTIONS);

  // --- OPTIMIZATION RESULT STATE ---
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [syntaxError, setSyntaxError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- CANVAS & VIEWPORT STATE ---
  const [zoomLevel, setZoomLevel] = useState('fit'); // 'fit' | '50' | '100' | '150' | '200'
  const [viewportBg, setViewportBg] = useState('checkerboard'); // 'checkerboard' | 'dark' | 'light' | 'obsidian'
  const [viewMode, setViewMode] = useState('optimized'); // 'optimized' | 'split' | 'original'
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const isDraggingSplit = useRef(false);
  const splitContainerRef = useRef(null);

  // --- TABS & SIDEBAR STATE ---
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'palette' | 'editor' | 'export'
  const [reactComponentName, setReactComponentName] = useState('VectorIcon');
  const [rasterScale, setRasterScale] = useState(2); // 1x, 2x, 4x
  const [copiedCodeKey, setCopiedCodeKey] = useState(null);

  // --- PALETTE STATE ---
  const [detectedColors, setDetectedColors] = useState([]);
  const [selectedColorToReplace, setSelectedColorToReplace] = useState(null);
  const [replacementColor, setReplacementColor] = useState('#4f46e5');

  // Handle Preset Selection
  const handleSelectPreset = (presetId) => {
    setSelectedPresetId(presetId);
    const p = OPTIMIZER_PRESETS.find(item => item.id === presetId);
    if (p) {
      setOptions(p.options);
    }
  };

  // Option toggles
  const updateOption = (key, val) => {
    setSelectedPresetId('custom');
    setOptions(prev => ({ ...prev, [key]: val }));
  };

  // Run Optimization & Diagnostics
  const executeOptimize = useCallback(() => {
    try {
      setIsProcessing(true);
      setSyntaxError(null);

      // Verify syntax first
      parseSvg(rawSvgInput);

      // Optimize
      const res = optimizeSvg(rawSvgInput, options);
      setOptimizationResult(res);

      // Extract colors from current SVG
      const colors = extractSvgColors(res.svg);
      setDetectedColors(colors);
      if (colors.length > 0 && !selectedColorToReplace) {
        setSelectedColorToReplace(colors[0]);
      }
    } catch (err) {
      setSyntaxError(err.message || 'Invalid SVG markup');
      setOptimizationResult(null);
    } finally {
      setIsProcessing(false);
    }
  }, [rawSvgInput, options, selectedColorToReplace]);

  // Debounced auto-optimize
  useEffect(() => {
    const timer = setTimeout(() => {
      executeOptimize();
    }, 150);
    return () => clearTimeout(timer);
  }, [executeOptimize]);

  // Load Sample SVG
  const handleLoadSample = (sample) => {
    setActiveSampleId(sample.id);
    setRawSvgInput(sample.svg);
    if (onNotify) onNotify(`Loaded "${sample.title}"!`, 'info');
  };

  // Upload SVG File
  const handleFileUpload = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      if (onNotify) onNotify('Please select a valid .svg vector file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setActiveSampleId(null);
        setRawSvgInput(content);
        if (onNotify) onNotify(`Loaded ${file.name}!`, 'success');
      }
    };
    reader.onerror = () => {
      if (onNotify) onNotify('Failed to read SVG file.', 'error');
    };
    reader.readAsText(file);
  };

  // Format Raw Input Code
  const handleFormatCode = () => {
    try {
      const formatted = formatSvgCode(rawSvgInput, 2);
      setRawSvgInput(formatted);
      if (onNotify) onNotify('SVG code formatted with 2-space indentation.', 'info');
    } catch {
      if (onNotify) onNotify('Could not format code: syntax error.', 'error');
    }
  };

  // Minify Raw Input Code
  const handleMinifyCode = () => {
    try {
      const minified = minifySvgCode(rawSvgInput);
      setRawSvgInput(minified);
      if (onNotify) onNotify('SVG code minified into a single line.', 'info');
    } catch {
      if (onNotify) onNotify('Could not minify code.', 'error');
    }
  };

  // Replace Single Color
  const handleReplaceColor = () => {
    if (!selectedColorToReplace || !replacementColor) return;
    const currentCode = optimizationResult ? optimizationResult.svg : rawSvgInput;
    const updated = replaceSvgColor(currentCode, selectedColorToReplace, replacementColor);
    setRawSvgInput(updated);
    setSelectedColorToReplace(replacementColor);
    if (onNotify) onNotify(`Replaced ${selectedColorToReplace} with ${replacementColor}!`, 'success');
  };

  // Apply Theme Color Presets
  const handleRecolorTheme = (themeHex) => {
    const currentCode = optimizationResult ? optimizationResult.svg : rawSvgInput;
    const updated = recolorSvgMonochrome(currentCode, themeHex);
    setRawSvgInput(updated);
    if (onNotify) onNotify(`Applied monochrome theme palette!`, 'success');
  };

  // Invert Colors (Dark Mode)
  const handleInvertColors = () => {
    const currentCode = optimizationResult ? optimizationResult.svg : rawSvgInput;
    const updated = invertSvgColors(currentCode);
    setRawSvgInput(updated);
    if (onNotify) onNotify('Inverted SVG colors for dark mode!', 'success');
  };

  // Grayscale Colors
  const handleGrayscaleColors = () => {
    const currentCode = optimizationResult ? optimizationResult.svg : rawSvgInput;
    const updated = grayscaleSvgColors(currentCode);
    setRawSvgInput(updated);
    if (onNotify) onNotify('Converted SVG to monochrome grayscale!', 'success');
  };

  // Copy Helper
  const handleCopyText = async (text, key = 'copy') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCodeKey(key);
      setTimeout(() => setCopiedCodeKey(null), 2000);
      if (onNotify) onNotify('Copied to clipboard!', 'success');
    } catch {
      if (onNotify) onNotify('Failed to copy to clipboard', 'error');
    }
  };

  // Download Optimized SVG
  const handleDownloadSvg = () => {
    const code = optimizationResult ? optimizationResult.svg : rawSvgInput;
    const blob = new Blob([code], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'optimized-vector.svg');
    if (onNotify) onNotify('Downloaded optimized-vector.svg!', 'success');
  };

  // Download Raster PNG
  const handleDownloadRaster = async (format = 'png') => {
    try {
      const code = optimizationResult ? optimizationResult.svg : rawSvgInput;
      let blob;
      let filename;

      if (format === 'png') {
        blob = await svgToPngBlob(code, rasterScale);
        filename = `vector-export-${rasterScale}x.png`;
      } else if (format === 'jpeg') {
        blob = await svgToJpegBlob(code, rasterScale, '#ffffff');
        filename = `vector-export-${rasterScale}x.jpg`;
      } else {
        blob = await svgToWebpBlob(code, rasterScale);
        filename = `vector-export-${rasterScale}x.webp`;
      }

      downloadBlob(blob, filename);
      if (onNotify) onNotify(`Downloaded ${filename}!`, 'success');
    } catch (err) {
      if (onNotify) onNotify('Failed to export raster image: ' + err.message, 'error');
    }
  };

  // Split Slider Touch / Mouse handlers
  const handleSplitStart = () => {
    isDraggingSplit.current = true;
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingSplit.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
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

  // React JSX generated snippet
  const reactJsxSnippet = useMemo(() => {
    const code = optimizationResult ? optimizationResult.svg : rawSvgInput;
    return svgToReactJsx(code, reactComponentName);
  }, [optimizationResult, rawSvgInput, reactComponentName]);

  // Data URIs generated
  const dataUris = useMemo(() => {
    const code = optimizationResult ? optimizationResult.svg : rawSvgInput;
    return svgToDataUri(code);
  }, [optimizationResult, rawSvgInput]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* =========================================================================
          MODULE HEADER
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                SVG Optimizer & SVG Editor
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Lossless Vector
              </span>
              {isProcessing && (
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                  Optimizing...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Minify markup, strip editor junk, recolor palettes, inspect DOM nodes, and export to React JSX & high-DPI raster formats.
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload SVG</span>
            <input
              type="file"
              accept=".svg,image/svg+xml"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            title="Download optimized SVG file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          OPTIMIZATION METRICS BAR (WHEN RESULTS ARE AVAILABLE)
         ========================================================================= */}
      {optimizationResult && !syntaxError && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Original Size
            </span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
              {formatBytes(optimizationResult.origSize)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Optimized Size
            </span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {formatBytes(optimizationResult.optSize)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Reduction Savings
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                -{optimizationResult.reductionPct}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({formatBytes(optimizationResult.savedBytes)})
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Elements Cleaned
            </span>
            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
              {optimizationResult.elementCountBefore} → {optimizationResult.elementCountAfter}
              <span className="text-xs text-slate-400 font-normal ml-1">
                ({optimizationResult.strippedCount} junk stripped)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* SYNTAX ERROR ALERT */}
      {syntaxError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{syntaxError}</span>
        </div>
      )}

      {/* =========================================================================
          WORKSPACE (MAIN VIEWPORT STAGE & RIGHT TABBED INSPECTOR)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =======================================================================
            LEFT COLUMN: INTERACTIVE VISUAL CANVAS & VIEWPORT (7 COLS)
           ======================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* VIEWPORT CONTROLS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('optimized')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'optimized'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Optimized
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>Before / After</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('original')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'original'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Original
              </button>
            </div>

            {/* Background Selector & Zoom */}
            <div className="flex items-center gap-2">
              {/* Background Picker */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'checkerboard', title: 'Transparent Grid' },
                  { id: 'dark', title: 'Slate Dark' },
                  { id: 'light', title: 'White' },
                  { id: 'obsidian', title: 'Obsidian Black' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setViewportBg(bg.id)}
                    className={`w-6 h-6 rounded-md border transition-all cursor-pointer ${
                      viewportBg === bg.id ? 'ring-2 ring-emerald-500 border-white' : 'border-slate-300 dark:border-slate-700'
                    }`}
                    style={{
                      backgroundColor:
                        bg.id === 'dark'
                          ? '#0f172a'
                          : bg.id === 'light'
                          ? '#ffffff'
                          : bg.id === 'obsidian'
                          ? '#050811'
                          : undefined,
                      backgroundImage:
                        bg.id === 'checkerboard'
                          ? `linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`
                          : undefined,
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                    }}
                    title={bg.title}
                  />
                ))}
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {['fit', '100', '150', '200'].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoomLevel(z)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                      zoomLevel === z
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500'
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
            ref={splitContainerRef}
            className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md min-h-[440px] max-h-[600px] flex items-center justify-center p-6 select-none"
            style={{
              backgroundColor:
                viewportBg === 'dark'
                  ? '#0f172a'
                  : viewportBg === 'light'
                  ? '#ffffff'
                  : viewportBg === 'obsidian'
                  ? '#050811'
                  : '#1e293b',
              backgroundImage:
                viewportBg === 'checkerboard'
                  ? `linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`
                  : undefined,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
            }}
          >
            {/* VIEW MODE 1: SINGLE OPTIMIZED OR ORIGINAL VIEW */}
            {viewMode !== 'split' ? (
              <div
                className={`transition-transform duration-150 flex items-center justify-center max-w-full max-h-full ${
                  zoomLevel === '100'
                    ? 'scale-100'
                    : zoomLevel === '150'
                    ? 'scale-150'
                    : zoomLevel === '200'
                    ? 'scale-200'
                    : 'w-full h-full'
                }`}
                dangerouslySetInnerHTML={{
                  __html: viewMode === 'optimized' && optimizationResult
                    ? optimizationResult.svg
                    : rawSvgInput
                }}
              />
            ) : (
              /* VIEW MODE 2: INTERACTIVE SPLIT SLIDER BEFORE VS AFTER */
              <div className="relative w-full h-[400px] overflow-hidden flex items-center justify-center">
                {/* Background Layer: Original SVG */}
                <div
                  className="absolute inset-0 flex items-center justify-center select-none"
                  dangerouslySetInnerHTML={{ __html: rawSvgInput }}
                />

                {/* Foreground Layer: Optimized SVG (Clipped by splitPos) */}
                <div
                  className="absolute inset-0 flex items-center justify-center select-none overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                  dangerouslySetInnerHTML={{
                    __html: optimizationResult ? optimizationResult.svg : rawSvgInput
                  }}
                />

                {/* Split Handle Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] cursor-ew-resize z-20 flex items-center justify-center"
                  style={{ left: `${splitPos}%` }}
                  onMouseDown={handleSplitStart}
                  onTouchStart={handleSplitStart}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow-lg text-xs font-bold pointer-events-none">
                    ⇄
                  </div>
                </div>

                {/* Badges on split sides */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider pointer-events-none z-10">
                  Optimized ({splitPos.toFixed(0)}%)
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider pointer-events-none z-10">
                  Original
                </div>
              </div>
            )}
          </div>

          {/* SAMPLE PRESETS QUICK SELECTOR ROW */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              Sample Library:
            </span>
            {SAMPLE_SVGS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  activeSampleId === sample.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'bg-white dark:bg-[#111622] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN: TABBED INSPECTOR & CONTROLS (5 COLS)
           ======================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* TABS HEADER */}
            <div className="flex items-center border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-2 overflow-x-auto">
              {[
                { id: 'rules', label: 'Optimizer Rules', icon: Sliders },
                { id: 'palette', label: 'Colors & Theme', icon: Palette },
                { id: 'editor', label: 'SVG Markup', icon: Code2 },
                { id: 'export', label: 'Export & JSX', icon: Download },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OPTIMIZATION RULES */}
            {activeTab === 'rules' && (
              <div className="p-5 space-y-5">
                {/* PRESETS BUTTONS */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    Optimization Strategy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {OPTIMIZER_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                          selectedPresetId === p.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* COORDINATE PRECISION SLIDER */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Decimal Rounding Precision
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {options.roundNumbers ? `${options.precision} decimals` : 'Off (Full)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={options.precision}
                    onChange={(e) => updateOption('precision', Number(e.target.value))}
                    disabled={!options.roundNumbers}
                    className="w-full accent-emerald-600 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0 (integer)</span>
                    <span>1 (compact)</span>
                    <span>2 (standard)</span>
                    <span>3 (fine)</span>
                    <span>4 (exact)</span>
                  </div>
                </div>

                {/* INDIVIDUAL RULES CHECKLIST */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Active Cleaners
                  </label>

                  {[
                    { id: 'removeComments', label: 'Strip XML comments (<!-- ... -->)', desc: 'Removes all editor and author comments' },
                    { id: 'removeMetadata', label: 'Remove metadata & description tags', desc: '<metadata>, <desc>, <title>' },
                    { id: 'removeEditorData', label: 'Strip editor namespaces & attributes', desc: 'Inkscape, Illustrator, Figma, Sketch tags' },
                    { id: 'removeEmptyContainers', label: 'Remove empty container groups', desc: 'Empty <g>, <defs>, <clipPath> elements' },
                    { id: 'collapseRedundantGroups', label: 'Collapse redundant single-child groups', desc: 'Unwraps unnecessary <g> hierarchies' },
                    { id: 'roundNumbers', label: 'Round floating point path coordinates', desc: 'Compresses long 12-decimal path strings' },
                    { id: 'cleanupDefaultAttrs', label: 'Cleanup default attributes', desc: 'version="1.1", x="0", y="0"' },
                    { id: 'ensureViewBox', label: 'Ensure responsive viewBox', desc: 'Calculates viewBox from width/height if missing' },
                    { id: 'minifyWhitespace', label: 'Minify whitespace into single line', desc: 'Removes line breaks and indentations' },
                  ].map((rule) => (
                    <label
                      key={rule.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(options[rule.id])}
                        onChange={(e) => updateOption(rule.id, e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 accent-emerald-600"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {rule.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {rule.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: PALETTE INSPECTOR & RECOLOR STUDIO */}
            {activeTab === 'palette' && (
              <div className="p-5 space-y-5">
                {/* DETECTED COLORS PALETTE */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Detected SVG Colors ({detectedColors.length})
                    </label>
                    <span className="text-[11px] text-slate-400">Click a swatch to swap</span>
                  </div>

                  {detectedColors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {detectedColors.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColorToReplace(col)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                            selectedColorToReplace === col
                              ? 'ring-2 ring-emerald-500 border-white shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-md border border-black/10 shrink-0 inline-block"
                            style={{ backgroundColor: col }}
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">{col}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No explicit color attributes detected.</p>
                  )}
                </div>

                {/* COLOR REPLACEMENT TOOL */}
                {selectedColorToReplace && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Replace Selected Color:
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                        <span
                          className="w-5 h-5 rounded-md border border-black/10 inline-block"
                          style={{ backgroundColor: selectedColorToReplace }}
                        />
                        <span>{selectedColorToReplace}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={replacementColor}
                          onChange={(e) => setReplacementColor(e.target.value)}
                          className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={replacementColor}
                          onChange={(e) => setReplacementColor(e.target.value)}
                          className="w-24 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleReplaceColor}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Apply Color Replacement
                    </button>
                  </div>
                )}

                {/* THEME PRESET RECOLOR */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    One-Click Brand Themes
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Royal Indigo', color: '#4f46e5' },
                      { label: 'Emerald Mint', color: '#059669' },
                      { label: 'Electric Cyan', color: '#0284c7' },
                      { label: 'Sunset Amber', color: '#ea580c' },
                      { label: 'Neon Rose', color: '#e11d48' },
                      { label: 'Slate Obsidian', color: '#1e293b' },
                    ].map((th) => (
                      <button
                        key={th.label}
                        type="button"
                        onClick={() => handleRecolorTheme(th.color)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: th.color }}
                        />
                        <span className="font-medium truncate">{th.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleInvertColors}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Invert for Dark Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGrayscaleColors}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Grayscale Mode</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RAW SVG CODE EDITOR */}
            {activeTab === 'editor' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Live SVG Source Markup:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleFormatCode}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Prettify with 2-space indentation"
                    >
                      Prettify
                    </button>
                    <button
                      type="button"
                      onClick={handleMinifyCode}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Minify to single line"
                    >
                      Minify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyText(rawSvgInput, 'raw')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      title="Copy code"
                    >
                      {copiedCodeKey === 'raw' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <textarea
                  value={rawSvgInput}
                  onChange={(e) => setRawSvgInput(e.target.value)}
                  className="w-full h-[320px] p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  spellCheck={false}
                />
              </div>
            )}

            {/* TAB 4: REACT JSX & EXPORT STUDIO */}
            {activeTab === 'export' && (
              <div className="p-5 space-y-5">
                {/* REACT JSX COMPONENT EXPORT */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      React JSX Component
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyText(reactJsxSnippet, 'jsx')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-800"
                    >
                      {copiedCodeKey === 'jsx' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCodeKey === 'jsx' ? 'Copied JSX!' : 'Copy JSX'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Component Name:</span>
                    <input
                      type="text"
                      value={reactComponentName}
                      onChange={(e) => setReactComponentName(e.target.value)}
                      className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono"
                    />
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] max-h-[140px] overflow-x-auto leading-relaxed">
                    {reactJsxSnippet}
                  </pre>
                </div>

                {/* DATA URI / BASE64 EXPORT */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Data URI & CSS Background
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(dataUris.utf8Uri, 'utf8')}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center transition-colors cursor-pointer"
                    >
                      {copiedCodeKey === 'utf8' ? 'Copied Data URI!' : 'Copy SVG Data URI'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyText(dataUris.base64Uri, 'b64')}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center transition-colors cursor-pointer"
                    >
                      {copiedCodeKey === 'b64' ? 'Copied Base64!' : 'Copy Base64 URI'}
                    </button>
                  </div>
                </div>

                {/* RASTER PNG / JPEG / WEBP EXPORT */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Raster Image Export (High-DPI)
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                      {[1, 2, 4, 8].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRasterScale(s)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                            rasterScale === s
                              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                              : 'text-slate-500'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadRaster('png')}
                      className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold text-center shadow-xs transition-colors cursor-pointer"
                    >
                      Export PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadRaster('webp')}
                      className="py-2 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold text-center shadow-xs transition-colors cursor-pointer"
                    >
                      Export WebP
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadRaster('jpeg')}
                      className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center shadow-xs transition-colors cursor-pointer"
                    >
                      Export JPEG
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
