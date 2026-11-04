import React, { useState, useMemo, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Palette,
  ShieldCheck,
  Maximize2,
  Grid,
  Type
} from 'lucide-react';
import {
  IMAGE_DIMENSION_PRESETS,
  IMAGE_COLOR_PALETTES,
  IMAGE_PATTERNS,
  generatePlaceholderImageSvg,
  renderSvgToCanvas,
  triggerFileDownload,
  svgToDataUri
} from '../utils/placeholderGeneratorUtils';

export default function PlaceholderGeneratorSuite({ _theme = 'dark', onNotify }) {
  // --- Placeholder Image State ---
  const [imgWidth, setImgWidth] = useState(800);
  const [imgHeight, setImgHeight] = useState(600);
  const [aspectRatioLock, setAspectRatioLock] = useState('free'); // 'free' | '16:9' | '4:3' | '1:1' | '9:16'
  const [customText, setCustomText] = useState('');
  const [subText, setSubText] = useState('Placeholder Image');
  const [showAutoDimensions, setShowAutoDimensions] = useState(true);
  const [selectedImagePalette, setSelectedImagePalette] = useState('indigo');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [selectedPattern, setSelectedPattern] = useState('grid');
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);

  // Code Output Tab & Feedback
  const [imageSnippetTab, setImageSnippetTab] = useState('html'); // 'html' | 'svg' | 'css' | 'markdown' | 'data_uri'
  const [copiedKey, setCopiedKey] = useState(null);
  const [isExportingRaster, setIsExportingRaster] = useState(false);

  // Notification helper
  const notify = useCallback((msg, type = 'success') => {
    if (onNotify) {
      if (typeof onNotify === 'function') {
        onNotify(msg, type);
      }
    }
  }, [onNotify]);

  // Copy helper
  const handleCopyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      notify('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      notify('Failed to copy to clipboard.', 'error');
    }
  };

  // --- Image Aspect Ratio Handlers ---
  const handleSetDimensionPreset = (preset) => {
    setImgWidth(preset.width);
    setImgHeight(preset.height);
    notify(`Set dimensions to ${preset.width} × ${preset.height} (${preset.label.split(' ')[0]})`, 'info');
  };

  const handleWidthChange = (val) => {
    const w = Math.max(20, Math.min(4000, parseInt(val, 10) || 20));
    setImgWidth(w);
    if (aspectRatioLock === '16:9') setImgHeight(Math.round((w * 9) / 16));
    else if (aspectRatioLock === '4:3') setImgHeight(Math.round((w * 3) / 4));
    else if (aspectRatioLock === '1:1') setImgHeight(w);
    else if (aspectRatioLock === '9:16') setImgHeight(Math.round((w * 16) / 9));
  };

  const handleHeightChange = (val) => {
    const h = Math.max(20, Math.min(4000, parseInt(val, 10) || 20));
    setImgHeight(h);
    if (aspectRatioLock === '16:9') setImgWidth(Math.round((h * 16) / 9));
    else if (aspectRatioLock === '4:3') setImgWidth(Math.round((h * 4) / 3));
    else if (aspectRatioLock === '1:1') setImgWidth(h);
    else if (aspectRatioLock === '9:16') setImgWidth(Math.round((h * 9) / 16));
  };

  // --- Generate Output SVG ---
  const generatedImageSvg = useMemo(() => {
    return generatePlaceholderImageSvg({
      width: imgWidth,
      height: imgHeight,
      text: customText,
      subText,
      showDimensions: showAutoDimensions,
      paletteId: selectedImagePalette,
      gradientAngle,
      pattern: selectedPattern,
      borderWidth,
      borderRadius
    });
  }, [
    imgWidth,
    imgHeight,
    customText,
    subText,
    showAutoDimensions,
    selectedImagePalette,
    gradientAngle,
    selectedPattern,
    borderWidth,
    borderRadius
  ]);

  // Data URI
  const imageDataUri = useMemo(() => svgToDataUri(generatedImageSvg), [generatedImageSvg]);

  // --- Downloads ---
  const handleDownloadImageSvg = () => {
    const blob = new Blob([generatedImageSvg], { type: 'image/svg+xml' });
    triggerFileDownload(blob, `placeholder_${imgWidth}x${imgHeight}.svg`);
    notify('SVG Image downloaded!', 'success');
  };

  const handleDownloadImagePng = async () => {
    setIsExportingRaster(true);
    try {
      const canvas = await renderSvgToCanvas(generatedImageSvg, imgWidth, imgHeight);
      canvas.toBlob((blob) => {
        if (blob) {
          triggerFileDownload(blob, `placeholder_${imgWidth}x${imgHeight}.png`);
          notify('PNG Image downloaded!', 'success');
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      notify('Failed to export PNG raster.', 'error');
    } finally {
      setIsExportingRaster(false);
    }
  };

  const handleCopyImagePng = async () => {
    setIsExportingRaster(true);
    try {
      const canvas = await renderSvgToCanvas(generatedImageSvg, imgWidth, imgHeight);
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard?.write) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          notify('PNG image copied directly to clipboard!', 'success');
        } else {
          notify('Clipboard image copy not supported in this browser.', 'error');
        }
      }, 'image/png');
    } catch {
      notify('Failed to copy image.', 'error');
    } finally {
      setIsExportingRaster(false);
    }
  };

  // --- Snippet Strings ---
  const imageSnippets = useMemo(() => {
    return {
      html: `<img src="${imageDataUri}" alt="Placeholder" width="${imgWidth}" height="${imgHeight}" />`,
      svg: generatedImageSvg,
      css: `.hero-placeholder {\n  background-image: url("${imageDataUri}");\n  background-size: cover;\n  background-position: center;\n}`,
      markdown: `![Placeholder (${imgWidth}x${imgHeight})](${imageDataUri})`,
      data_uri: imageDataUri
    };
  }, [imageDataUri, generatedImageSvg, imgWidth, imgHeight]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Action & Status Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Left: Badges & Capability Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            Vector SVG & PNG
          </span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% In-Browser • Zero Server Uploads</span>
          </div>
        </div>

        {/* Quick Actions (Download SVG & PNG) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadImageSvg}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800/80 transition-all cursor-pointer"
            title="Download SVG Placeholder"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG</span>
          </button>
          <button
            type="button"
            disabled={isExportingRaster}
            onClick={handleDownloadImagePng}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            title="Download PNG Placeholder"
          >
            {isExportingRaster ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Dimensions & Ratio Box */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-indigo-500" />
                <span>Dimensions & Aspect Ratio</span>
              </h2>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {imgWidth} × {imgHeight} px
              </span>
            </div>

            {/* Width / Height Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Width (px)</label>
                <input
                  type="number"
                  min="20"
                  max="4000"
                  value={imgWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Height (px)</label>
                <input
                  type="number"
                  min="20"
                  max="4000"
                  value={imgHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Ratio Lock Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Aspect Ratio Lock:</span>
              <div className="grid grid-cols-5 gap-1.5 text-xs">
                {[
                  { id: 'free', label: 'Free' },
                  { id: '16:9', label: '16:9' },
                  { id: '4:3', label: '4:3' },
                  { id: '1:1', label: '1:1' },
                  { id: '9:16', label: '9:16' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setAspectRatioLock(r.id);
                      if (r.id === '16:9') setImgHeight(Math.round((imgWidth * 9) / 16));
                      else if (r.id === '4:3') setImgHeight(Math.round((imgWidth * 3) / 4));
                      else if (r.id === '1:1') setImgHeight(imgWidth);
                      else if (r.id === '9:16') setImgHeight(Math.round((imgWidth * 16) / 9));
                    }}
                    className={`py-1.5 text-xs font-medium rounded-lg border text-center transition-all ${
                      aspectRatioLock === r.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimension Quick Presets */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Dimension Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {IMAGE_DIMENSION_PRESETS.slice(0, 8).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSetDimensionPreset(preset)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all ${
                      imgWidth === preset.width && imgHeight === preset.height
                        ? 'border-indigo-500 bg-indigo-500 text-white font-semibold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {preset.width}×{preset.height}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Typography & Custom Label Box */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-emerald-500" />
              <span>Text & Labels</span>
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-500 dark:text-slate-400 font-medium">Primary Label</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-indigo-600 dark:text-indigo-400">
                    <input
                      type="checkbox"
                      checked={showAutoDimensions}
                      onChange={(e) => setShowAutoDimensions(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Auto Dimensions</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={showAutoDimensions ? `${imgWidth} × ${imgHeight}` : 'Enter text (e.g. Hero Banner)...'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Subtitle / Category</label>
                <input
                  type="text"
                  value={subText}
                  onChange={(e) => setSubText(e.target.value)}
                  placeholder="e.g. Aspect Ratio 16:9, Wireframe..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Visual Palettes & Patterns Box */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-500" />
              <span>Color Palettes & Gradients</span>
            </h2>

            {/* Color Swatch Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {IMAGE_COLOR_PALETTES.map((palette) => {
                const isSelected = selectedImagePalette === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setSelectedImagePalette(palette.id)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="w-full h-7 rounded-lg mb-1.5 shadow-xs"
                      style={{
                        background: `linear-gradient(135deg, ${palette.start}, ${palette.end})`
                      }}
                    />
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {palette.name}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Gradient Angle Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Gradient Angle</span>
                <span className="font-mono font-bold">{gradientAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={gradientAngle}
                onChange={(e) => setGradientAngle(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Pattern Overlay Grid */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-slate-400" />
                <span>Pattern Texture Overlay:</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_PATTERNS.map((pat) => (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => setSelectedPattern(pat.id)}
                    className={`p-2 text-xs rounded-xl border text-center transition-all ${
                      selectedPattern === pat.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {pat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border & Rounded Corners */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Border</span>
                  <span className="font-mono">{borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="2"
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Corner Radius</span>
                  <span className="font-mono">{borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="4"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Preview & Export Studio */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Visual Canvas Preview Card */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Live Vector & Canvas Preview
                </h2>
              </div>
              <span className="text-xs font-mono font-medium text-slate-400">
                {imgWidth} × {imgHeight} px
              </span>
            </div>

            {/* Visual Display Container */}
            <div className="min-h-[360px] p-6 rounded-xl bg-slate-100 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
              <div
                className="max-w-full max-h-[460px] shadow-lg rounded transition-transform"
                dangerouslySetInnerHTML={{ __html: generatedImageSvg }}
              />
            </div>

            {/* Action Buttons: Download SVG, PNG, Copy */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImageSvg}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SVG</span>
                </button>

                <button
                  type="button"
                  disabled={isExportingRaster}
                  onClick={handleDownloadImagePng}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  {isExportingRaster ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Download PNG</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isExportingRaster}
                onClick={handleCopyImagePng}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy PNG Image</span>
              </button>
            </div>
          </div>

          {/* Code Snippets Studio */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {[
                  { id: 'html', label: 'HTML <img>' },
                  { id: 'svg', label: 'Raw SVG' },
                  { id: 'css', label: 'CSS Background' },
                  { id: 'markdown', label: 'Markdown' },
                  { id: 'data_uri', label: 'Data URI' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setImageSnippetTab(tab.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      imageSnippetTab === tab.id
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleCopyText(imageSnippets[imageSnippetTab], `img_${imageSnippetTab}`)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1.5"
              >
                {copiedKey === `img_${imageSnippetTab}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === `img_${imageSnippetTab}` ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="p-4">
              <textarea
                readOnly
                value={imageSnippets[imageSnippetTab]}
                className="w-full h-36 p-3 font-mono text-xs bg-slate-900 text-emerald-400 dark:text-emerald-300 rounded-xl resize-none focus:outline-none"
                spellCheck="false"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
