import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Palette,
  Lock,
  Unlock,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  Sliders,
  Eye,
  Heart,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Moon,
  Sun,
  X,
  Shuffle,
  ArrowUpDown,
  Search,
  Glasses,
  Grid
} from 'lucide-react';
import {
  CURATED_PALETTES,
  PRESET_CATEGORIES,
  generateHarmonyPalette,
  formatColorObject,
  generateShadesAndTints,
  extractColorsFromImage,
  exportAsCssVariables,
  exportAsTailwind,
  exportAsScss,
  exportAsJson,
  exportAsSvg,
  generatePalettePng,
  getSavedPalettes,
  savePaletteToStorage,
  deleteSavedPalette,
  clearSavedPalettes,
  hslToHex,
  rgbToHsl,
  hexToRgb,
  getContrastRatio,
  simulateColorBlindness,
  sortPalette,
  getCrossContrastMatrix,
  sanitizeHex
} from '../utils/colorPaletteUtils';

export default function ColorPaletteSuite({ _theme = 'dark', onNotify }) {
  // Main Palette State (Array of color descriptor objects)
  const [colors, setColors] = useState(() => generateHarmonyPalette('analogous', '#6366F1', 5));
  const [harmonyType, setHarmonyType] = useState('analogous');
  const [paletteName, setPaletteName] = useState('DreamKit Studio Palette');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // Active Display Format for Swatch Subtitles ('hex' | 'rgb' | 'hsl' | 'cmyk')
  const [colorFormat, setColorFormat] = useState('hex');

  // Color Blindness Simulation ('normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia')
  const [colorBlindnessMode, setColorBlindnessMode] = useState('normal');

  // Modals & Panels
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTab, setExportTab] = useState('css'); // 'css' | 'tailwind' | 'scss' | 'json' | 'svg' | 'png'
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showPreviewMockup, setShowPreviewMockup] = useState(true);
  const [mockupTheme, setMockupTheme] = useState('dark'); // 'dark' | 'light'

  // Presets Modal Filter & Search State
  const [presetCategory, setPresetCategory] = useState('all');
  const [presetSearch, setPresetSearch] = useState('');

  // Inline Hex Editing on Swatch Cards
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingHexValue, setEditingHexValue] = useState('');

  // Image Extraction State
  const [extractedColors, setExtractedColors] = useState([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isExtractingImage, setIsExtractingImage] = useState(false);

  // Saved Palettes State
  const [savedList, setSavedList] = useState(() => getSavedPalettes());
  const [copiedItem, setCopiedItem] = useState(null);
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Hidden Color Picker Input Ref
  const colorPickerInputRef = useRef(null);
  const imageFileInputRef = useRef(null);

  // Toast Helper
  const notify = useCallback((msg, type = 'success') => {
    if (onNotify && typeof onNotify === 'function') {
      onNotify(msg, type);
    }
  }, [onNotify]);

  // Copy with Visual Feedback
  const handleCopyText = useCallback((text, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopiedItem(text);
    notify(label, 'success');
    setTimeout(() => {
      setCopiedItem(null);
    }, 2000);
  }, [notify]);

  // Generate / Roll New Palette (Preserving Locked Swatches)
  const handleGenerate = useCallback(() => {
    const lockedColor = colors.find(c => c.locked);
    const baseHex = lockedColor ? lockedColor.hex : colors[selectedColorIndex]?.hex || null;

    const newGenerated = generateHarmonyPalette(harmonyType, baseHex, colors.length);

    const merged = colors.map((current, i) => {
      if (current.locked) return current;
      return newGenerated[i] || newGenerated[0];
    });

    setColors(merged);
  }, [colors, harmonyType, selectedColorIndex]);

  // Keyboard Spacebar Listener to Trigger Generate
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate]);

  // Toggle Lock on Swatch
  const handleToggleLock = (index, e) => {
    if (e) e.stopPropagation();
    setColors(prev => prev.map((c, i) => i === index ? { ...c, locked: !c.locked } : c));
  };

  // Add a new color swatch
  const handleAddColor = () => {
    if (colors.length >= 8) {
      notify('Maximum 8 colors supported in the visualizer strip.', 'info');
      return;
    }
    const lastColor = colors[colors.length - 1];
    const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(lastColor.hex)));
    const newHex = hslToHex((h + 35) % 360, s, Math.min(85, l + 5));
    setColors([...colors, formatColorObject(newHex)]);
  };

  // Remove a color swatch
  const handleRemoveColor = (index, e) => {
    if (e) e.stopPropagation();
    if (colors.length <= 3) {
      notify('Minimum 3 colors required for a balanced palette.', 'info');
      return;
    }
    const filtered = colors.filter((_, i) => i !== index);
    setColors(filtered);
    if (selectedColorIndex >= filtered.length) {
      setSelectedColorIndex(filtered.length - 1);
    }
  };

  // Move color left or right
  const handleMoveColor = (index, direction, e) => {
    if (e) e.stopPropagation();
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= colors.length) return;

    const copy = [...colors];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setColors(copy);
    setSelectedColorIndex(targetIdx);
  };

  // Palette Sorting (Hue, Lightness, Saturation, Reverse)
  const handleSortPalette = (mode) => {
    const sorted = sortPalette(colors, mode);
    setColors(sorted);
    notify(`Palette organized by ${mode.replace('_', ' ')}!`, 'success');
  };

  // Update specific color from hex input or color picker
  const handleUpdateColorHex = (index, newHex) => {
    const sanitized = sanitizeHex(newHex);
    setColors(prev => prev.map((c, i) => {
      if (i === index) {
        return formatColorObject(sanitized, c.locked);
      }
      return c;
    }));
  };

  // Inline Hex Edit Confirm
  const handleConfirmInlineHex = (index) => {
    if (editingHexValue) {
      handleUpdateColorHex(index, editingHexValue);
    }
    setEditingIndex(null);
    setEditingHexValue('');
  };

  // Apply a curated palette
  const handleApplyCurated = (curated) => {
    const formatted = curated.colors.map(hex => formatColorObject(hex));
    setColors(formatted);
    setPaletteName(curated.name);
    setShowPresetsModal(false);
    setSelectedColorIndex(0);
    notify(`Applied "${curated.name}" preset!`, 'success');
  };

  // Load a completely random preset from the 36 library
  const handleRandomPreset = () => {
    const randomIndex = Math.floor(Math.random() * CURATED_PALETTES.length);
    const chosen = CURATED_PALETTES[randomIndex];
    handleApplyCurated(chosen);
  };

  // Save current palette to favorites
  const handleSavePalette = () => {
    const item = {
      id: `pal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: paletteName || 'Custom Palette',
      colors: colors.map(c => c.hex),
      harmony: harmonyType,
      createdAt: Date.now()
    };
    const updated = savePaletteToStorage(item);
    setSavedList(updated);
    notify(`Saved "${paletteName}" to favorites!`, 'success');
  };

  // Delete saved palette
  const handleDeleteSaved = (id, e) => {
    e.stopPropagation();
    const updated = deleteSavedPalette(id);
    setSavedList(updated);
    notify('Palette removed from favorites.', 'info');
  };

  // Clear all saved palettes
  const handleClearAllSaved = () => {
    clearSavedPalettes();
    setSavedList([]);
    notify('Cleared all saved palettes.', 'info');
  };

  // Image Upload & Extraction
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingImage(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      const extracted = await extractColorsFromImage(file, colors.length || 5);
      setExtractedColors(extracted);
      notify(`Extracted ${extracted.length} dominant colors from image!`, 'success');
    } catch (err) {
      console.error(err);
      notify('Failed to extract colors from image.', 'error');
    } finally {
      setIsExtractingImage(false);
    }
  };

  // Load demo synthetic synthwave image for instant extraction
  const handleLoadSampleImage = async () => {
    setIsExtractingImage(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
      skyGrad.addColorStop(0, '#0F084B');
      skyGrad.addColorStop(0.3, '#26408B');
      skyGrad.addColorStop(0.6, '#FF007F');
      skyGrad.addColorStop(0.85, '#FF8A00');
      skyGrad.addColorStop(1, '#FFE600');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = '#FFE600';
      ctx.beginPath();
      ctx.arc(150, 130, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1B0836';
      ctx.beginPath();
      ctx.moveTo(0, 200);
      ctx.lineTo(80, 130);
      ctx.lineTo(160, 200);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0D0221';
      ctx.beginPath();
      ctx.moveTo(120, 200);
      ctx.lineTo(210, 120);
      ctx.lineTo(300, 200);
      ctx.closePath();
      ctx.fill();

      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const previewUrl = URL.createObjectURL(blob);
      setImagePreviewUrl(previewUrl);

      const extracted = await extractColorsFromImage(blob, colors.length || 5);
      setExtractedColors(extracted);
      notify('Extracted vibrant palette from Synthwave demo image!', 'success');
    } catch (err) {
      console.error(err);
      notify('Could not generate sample image.', 'error');
    } finally {
      setIsExtractingImage(false);
    }
  };

  // Apply extracted image colors to main palette
  const handleApplyExtractedColors = () => {
    if (extractedColors.length === 0) return;
    setColors(extractedColors);
    setShowImageModal(false);
    setPaletteName('Extracted from Image');
    notify('Applied extracted palette to studio!', 'success');
  };

  // Filtered Presets based on Category and Search
  const filteredPresets = useMemo(() => {
    return CURATED_PALETTES.filter(p => {
      const matchesCategory = presetCategory === 'all' || p.category === presetCategory;
      const q = presetSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.colors.some(c => c.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [presetCategory, presetSearch]);

  // Selected Color Data
  const selectedColor = colors[selectedColorIndex] || colors[0];
  const shadesLadder = useMemo(() => {
    if (!selectedColor) return [];
    return generateShadesAndTints(selectedColor.hex);
  }, [selectedColor]);

  // Cross-Palette Contrast Matrix Data
  const crossContrastMatrix = useMemo(() => {
    return getCrossContrastMatrix(colors);
  }, [colors]);

  // Export Code Generated
  const exportCode = useMemo(() => {
    switch (exportTab) {
      case 'css':
        return exportAsCssVariables(colors, paletteName);
      case 'tailwind':
        return exportAsTailwind(colors, paletteName);
      case 'scss':
        return exportAsScss(colors);
      case 'json':
        return exportAsJson(colors, paletteName);
      case 'svg':
        return exportAsSvg(colors, paletteName);
      default:
        return '';
    }
  }, [exportTab, colors, paletteName]);

  // Download SVG File
  const handleDownloadSvg = () => {
    const svgStr = exportAsSvg(colors, paletteName);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paletteName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_palette.svg`;
    a.click();
    URL.revokeObjectURL(url);
    notify('SVG Swatch downloaded!', 'success');
  };

  // Download High-Resolution PNG Swatch Image
  const handleDownloadPng = async () => {
    setIsExportingPng(true);
    try {
      const { blob, filename } = await generatePalettePng(colors, paletteName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      notify('High-Res PNG Swatch Card downloaded!', 'success');
    } catch (err) {
      console.error(err);
      notify('Failed to generate PNG image.', 'error');
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* ======================================================== */}
      {/* 1. HEADER & CONTROL TOOLBAR                              */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Title & Editable Name */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Palette className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Color Palette Generator
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  Pro Studio
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Explore 36+ curated palettes, generate harmonies, simulate color vision, and export production tokens.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Primary Generate Button (Spacebar Triggered) */}
            <button
              type="button"
              onClick={handleGenerate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-md shadow-indigo-500/25 active:scale-98 transition-all"
              title="Generate new palette (Shortcut: Spacebar)"
            >
              <Shuffle className="w-4 h-4" />
              <span>Generate</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/20 text-white/90">
                Space
              </kbd>
            </button>

            {/* Presets Modal Button */}
            <button
              type="button"
              onClick={() => setShowPresetsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Presets ({CURATED_PALETTES.length})</span>
            </button>

            {/* Surprise Me / Random Preset Button */}
            <button
              type="button"
              onClick={handleRandomPreset}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 transition-colors"
              title="Pick a random designer preset combination"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Surprise Combo</span>
            </button>

            {/* Image Extractor Button */}
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Extract Image</span>
            </button>

            {/* Saved Favorites Button */}
            <button
              type="button"
              onClick={() => setShowSavedModal(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Saved ({savedList.length})</span>
            </button>

            {/* Contrast Matrix Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowMatrixModal(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Inspect cross-color contrast matrix"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden md:inline">Contrast Grid</span>
            </button>

            {/* Export Palette Button */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

          </div>

        </div>

        {/* Harmony, Vision Simulation, & Organization Sub-bar */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Harmony Rules Selector */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Harmony:</span>
              <select
                value={harmonyType}
                onChange={(e) => {
                  setHarmonyType(e.target.value);
                  const generated = generateHarmonyPalette(e.target.value, colors[selectedColorIndex]?.hex, colors.length);
                  setColors(prev => prev.map((c, i) => c.locked ? c : (generated[i] || generated[0])));
                }}
                className="px-2.5 py-1.5 rounded-lg font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="analogous">Analogous (Adjacent)</option>
                <option value="monochromatic">Monochromatic (Tone Scale)</option>
                <option value="triadic">Triadic (120° Triangle)</option>
                <option value="complementary">Complementary (Opposites)</option>
                <option value="split_complementary">Split Complementary</option>
                <option value="tetradic">Tetradic (Square/Rect)</option>
                <option value="golden_ratio">Golden Ratio (137.5°)</option>
                <option value="shades">Shades & Tints Scale</option>
                <option value="random">Random Aesthetic</option>
              </select>
            </div>

            {/* Color Blindness Vision Simulator */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Glasses className="w-3.5 h-3.5 text-indigo-500" />
                <span>Vision:</span>
              </span>
              <select
                value={colorBlindnessMode}
                onChange={(e) => {
                  setColorBlindnessMode(e.target.value);
                  if (e.target.value !== 'normal') {
                    notify(`Simulating ${e.target.value} color vision`, 'info');
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="normal">Normal Vision (Standard)</option>
                <option value="protanopia">Protanopia (Red-Blind, ~1%)</option>
                <option value="deuteranopia">Deuteranopia (Green-Blind, ~6%)</option>
                <option value="tritanopia">Tritanopia (Blue-Blind, ~0.1%)</option>
                <option value="achromatopsia">Achromatopsia (Monochrome)</option>
              </select>
            </div>

            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-500" />
                <span>Sort:</span>
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleSortPalette(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-2.5 py-1.5 rounded-lg font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="" disabled>Reorder Swatches...</option>
                <option value="hue">By Hue (Rainbow Spectrum)</option>
                <option value="lightness_desc">By Lightness (Dark to Light)</option>
                <option value="lightness_asc">By Lightness (Light to Dark)</option>
                <option value="saturation">By Saturation (Vivid to Muted)</option>
                <option value="reverse">Reverse Palette Order</option>
              </select>
            </div>

          </div>

          {/* Palette Size & Format Controls */}
          <div className="flex items-center gap-3">
            
            {/* Color Model Code Toggle */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Format:</span>
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {['hex', 'rgb', 'hsl', 'cmyk'].map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setColorFormat(fmt)}
                    className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase transition-all ${
                      colorFormat === fmt
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Swatch Count +/- */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Count:</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleRemoveColor(colors.length - 1)}
                  disabled={colors.length <= 3}
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Remove last color"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-bold text-slate-900 dark:text-white font-mono text-xs">
                  {colors.length}
                </span>
                <button
                  type="button"
                  onClick={handleAddColor}
                  disabled={colors.length >= 8}
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Add color swatch"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSavePalette}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 transition-colors"
              title="Save current palette to favorites"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Save</span>
            </button>

          </div>

        </div>

      </div>

      {/* Color Blindness Alert Banner (when active) */}
      {colorBlindnessMode !== 'normal' && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 animate-fade-in">
          <div className="flex items-center gap-2">
            <Glasses className="w-4 h-4 text-amber-500" />
            <span>
              Simulating <strong>{colorBlindnessMode.toUpperCase()}</strong> color vision deficiency. Swatches below reflect perceived shades.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setColorBlindnessMode('normal')}
            className="font-bold underline hover:no-underline"
          >
            Reset to Standard
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN PALETTE SWATCH STRIP (IMMERSIVE INTERACTIVE CARDS) */}
      {/* ======================================================== */}
      <div className="w-full">
        {/* Dynamic Responsive Grid: auto-fills columns cleanly based on card count */}
        <div className={`grid gap-3.5 ${
          colors.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
          colors.length === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
          colors.length === 5 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
          colors.length === 6 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6' :
          colors.length === 7 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7' :
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8'
        }`}>
          {colors.map((color, index) => {
            const isSelected = selectedColorIndex === index;
            const displayHex = colorBlindnessMode === 'normal'
              ? color.hex
              : simulateColorBlindness(color.hex, colorBlindnessMode);
            const textContrastColor = color.bestTextColor;

            return (
              <div
                key={color.id || index}
                onClick={() => setSelectedColorIndex(index)}
                style={{ backgroundColor: displayHex }}
                className={`relative group rounded-2xl h-80 sm:h-96 p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-md select-none ${
                  isSelected
                    ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 scale-102 z-10'
                    : 'hover:scale-101'
                }`}
              >
                {/* Top Action Bar (Lock, Copy, Move, Remove) */}
                <div className="flex items-center justify-between">
                  
                  {/* Lock Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleLock(index, e)}
                    style={{ color: textContrastColor }}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md transition-all ${
                      color.locked
                        ? 'bg-black/40 shadow-sm'
                        : 'bg-black/15 opacity-80 group-hover:opacity-100 hover:bg-black/30'
                    }`}
                    title={color.locked ? 'Color locked (will not change on spacebar)' : 'Lock color'}
                  >
                    {color.locked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </button>

                  {/* Right Tools (Move & Remove) */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={(e) => handleMoveColor(index, -1, e)}
                        style={{ color: textContrastColor }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/15 hover:bg-black/30 backdrop-blur-md"
                        title="Move Left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {index < colors.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleMoveColor(index, 1, e)}
                        style={{ color: textContrastColor }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/15 hover:bg-black/30 backdrop-blur-md"
                        title="Move Right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {colors.length > 3 && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveColor(index, e)}
                        style={{ color: textContrastColor }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/15 hover:bg-rose-600/80 backdrop-blur-md transition-colors"
                        title="Remove color"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>

                {/* Center Quick Copy Pill (Revealed on Hover) */}
                <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyText(color.hex, `Copied ${color.hex}!`);
                    }}
                    style={{ color: textContrastColor }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-black/25 hover:bg-black/40 backdrop-blur-md shadow-sm transition-all active:scale-95"
                  >
                    {copiedItem === color.hex ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedItem === color.hex ? 'Copied' : 'Copy Hex'}</span>
                  </button>
                </div>

                {/* Bottom Color Metadata Card */}
                <div
                  style={{ color: textContrastColor }}
                  className="rounded-xl p-3 bg-black/20 backdrop-blur-md space-y-1.5"
                >
                  {/* Hex / Format Value with Direct Inline Edit Trigger */}
                  <div className="flex items-center justify-between font-mono font-bold text-sm sm:text-base tracking-wider">
                    {editingIndex === index ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingHexValue}
                          onChange={(e) => setEditingHexValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmInlineHex(index);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          className="w-24 px-1.5 py-0.5 text-xs font-mono font-bold rounded bg-black/50 text-white border border-white/40 focus:outline-hidden"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleConfirmInlineHex(index)}
                          className="p-1 rounded bg-emerald-600 text-white text-[10px]"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingIndex(index);
                          setEditingHexValue(color.hex);
                        }}
                        className="hover:underline cursor-text"
                        title="Click to edit HEX directly"
                      >
                        {colorFormat === 'hex' && color.hex}
                        {colorFormat === 'rgb' && color.rgb}
                        {colorFormat === 'hsl' && color.hsl}
                        {colorFormat === 'cmyk' && color.cmyk}
                      </span>
                    )}

                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 uppercase font-sans font-semibold">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Nearest Name */}
                  <p className="text-xs font-medium opacity-90 truncate">
                    {color.name}
                  </p>

                  {/* WCAG Compliance Badge */}
                  <div className="flex items-center justify-between text-[10px] pt-1 opacity-80 border-t border-white/10">
                    <span>WCAG: {color.contrastWithWhite}:1</span>
                    <span className="font-semibold">
                      {color.wcagStatus.normalAaa ? 'AAA Pass' : color.wcagStatus.normalAa ? 'AA Pass' : 'Normal'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. COLOR FINE-TUNER & DETAILS INSPECTOR                  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Selected Swatch Controls & Sliders */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: selectedColor.hex }}
                className="w-9 h-9 rounded-xl shadow-xs border border-white/20"
              />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                  Fine-Tune Swatch #{selectedColorIndex + 1}
                  <span className="text-xs font-normal text-slate-400">({selectedColor.name})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adjust hue, saturation, and lightness in real time or pick with native color tool.
                </p>
              </div>
            </div>

            {/* Native Picker Trigger */}
            <div className="flex items-center gap-2">
              <input
                ref={colorPickerInputRef}
                type="color"
                value={selectedColor.hex}
                onChange={(e) => handleUpdateColorHex(selectedColorIndex, e.target.value)}
                className="w-9 h-9 rounded-xl cursor-pointer p-0.5 border border-slate-200 dark:border-slate-700 bg-transparent"
                title="Open native color picker"
              />
            </div>
          </div>

          {/* HSL Sliders */}
          <div className="space-y-4">
            
            {/* Hue Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>Hue (H)</span>
                <span className="font-mono">{selectedColor.hslObj.h}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedColor.hslObj.h}
                onChange={(e) => {
                  const newH = parseInt(e.target.value, 10);
                  const newHex = hslToHex(newH, selectedColor.hslObj.s, selectedColor.hslObj.l);
                  handleUpdateColorHex(selectedColorIndex, newHex);
                }}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
              />
            </div>

            {/* Saturation Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>Saturation (S)</span>
                <span className="font-mono">{selectedColor.hslObj.s}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedColor.hslObj.s}
                onChange={(e) => {
                  const newS = parseInt(e.target.value, 10);
                  const newHex = hslToHex(selectedColor.hslObj.h, newS, selectedColor.hslObj.l);
                  handleUpdateColorHex(selectedColorIndex, newHex);
                }}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${hslToHex(selectedColor.hslObj.h, 0, selectedColor.hslObj.l)}, ${hslToHex(selectedColor.hslObj.h, 100, selectedColor.hslObj.l)})`
                }}
              />
            </div>

            {/* Lightness Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>Lightness (L)</span>
                <span className="font-mono">{selectedColor.hslObj.l}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={selectedColor.hslObj.l}
                onChange={(e) => {
                  const newL = parseInt(e.target.value, 10);
                  const newHex = hslToHex(selectedColor.hslObj.h, selectedColor.hslObj.s, newL);
                  handleUpdateColorHex(selectedColorIndex, newHex);
                }}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #000000, ${hslToHex(selectedColor.hslObj.h, selectedColor.hslObj.s, 50)}, #ffffff)`
                }}
              />
            </div>

          </div>

          {/* Color Values Table (HEX, RGB, HSL, CMYK) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            
            <div 
              onClick={() => handleCopyText(selectedColor.hex, `Copied ${selectedColor.hex}!`)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>HEX</span>
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
              </div>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">
                {selectedColor.hex}
              </p>
            </div>

            <div 
              onClick={() => handleCopyText(selectedColor.rgb, `Copied ${selectedColor.rgb}!`)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>RGB</span>
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
              </div>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-1 truncate">
                {selectedColor.rgb}
              </p>
            </div>

            <div 
              onClick={() => handleCopyText(selectedColor.hsl, `Copied ${selectedColor.hsl}!`)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>HSL</span>
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
              </div>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-1 truncate">
                {selectedColor.hsl}
              </p>
            </div>

            <div 
              onClick={() => handleCopyText(selectedColor.cmyk, `Copied ${selectedColor.cmyk}!`)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>CMYK</span>
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
              </div>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-1 truncate">
                {selectedColor.cmyk}
              </p>
            </div>

          </div>

          {/* 10-Step Tonal Scale Ladder (Tailwind Style) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                10-Tier Tonal Scale (Tailwind Compatible)
              </span>
              <span className="text-slate-400 text-[11px]">Click to copy shade</span>
            </div>

            <div className="grid grid-cols-11 gap-1 rounded-xl overflow-hidden p-1 bg-slate-100 dark:bg-slate-900">
              {shadesLadder.map(step => (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => handleCopyText(step.hex, `Copied ${step.label} (${step.hex})`)}
                  style={{ backgroundColor: step.hex }}
                  className="group relative h-12 rounded-lg flex flex-col items-center justify-end p-1 transition-transform hover:scale-105 active:scale-95"
                  title={`${step.label}: ${step.hex}`}
                >
                  <span
                    style={{ color: step.textColor }}
                    className="font-mono text-[9px] font-bold opacity-80 group-hover:opacity-100"
                  >
                    {step.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Accessibility & WCAG Matrix */}
        <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                WCAG 2.1 Audit
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowMatrixModal(true)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View Full Grid</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Contrast Against White & Black */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  On Pure White (#FFF)
                </span>
                <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                  {selectedColor.contrastWithWhite}:1
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-bold ${
                  selectedColor.contrastWithWhite >= 4.5
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                }`}>
                  {selectedColor.contrastWithWhite >= 4.5 ? 'AA Pass' : 'AA Fail'}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  selectedColor.contrastWithWhite >= 7.0
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                }`}>
                  {selectedColor.contrastWithWhite >= 7.0 ? 'AAA Pass' : 'AAA Fail'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  On Dark Slate (#0F172A)
                </span>
                <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                  {selectedColor.contrastWithDark}:1
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-bold ${
                  selectedColor.contrastWithDark >= 4.5
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                }`}>
                  {selectedColor.contrastWithDark >= 4.5 ? 'AA Pass' : 'AA Fail'}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  selectedColor.contrastWithDark >= 7.0
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                }`}>
                  {selectedColor.contrastWithDark >= 7.0 ? 'AAA Pass' : 'AAA Fail'}
                </span>
              </div>
            </div>
          </div>

          {/* Cross-Palette Contrast Pairs */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Contrast vs. Other Swatches
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {colors.map((c, i) => {
                if (i === selectedColorIndex) return null;
                const ratio = getContrastRatio(selectedColor.hex, c.hex);
                return (
                  <div
                    key={c.id || i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        style={{ backgroundColor: c.hex }}
                        className="w-4 h-4 rounded-md border border-white/20"
                      />
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                        #{i + 1} {c.name}
                      </span>
                    </div>
                    <span className={`font-mono font-bold ${
                      ratio >= 4.5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}>
                      {ratio}:1
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. LIVE UI MOCKUP PREVIEWER                              */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Live Component Sandbox
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewMockup(!showPreviewMockup)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {showPreviewMockup ? 'Hide Sandbox' : 'Show Sandbox'}
            </button>
            {showPreviewMockup && (
              <button
                type="button"
                onClick={() => setMockupTheme(mockupTheme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {mockupTheme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{mockupTheme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mockup Card */}
        {showPreviewMockup && (
          <div
            style={{
              backgroundColor: mockupTheme === 'dark' ? '#090D16' : '#F8FAFC',
              color: mockupTheme === 'dark' ? '#F8FAFC' : '#0F172A'
            }}
            className="rounded-2xl p-6 sm:p-8 border border-slate-200/60 dark:border-slate-800/80 space-y-6 transition-colors shadow-inner"
          >
            {/* Mockup Navigation Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/20 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: colors[0]?.hex || '#4F46E5' }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs"
                >
                  ★
                </div>
                <span className="font-bold text-sm tracking-tight">Acme Studio</span>
              </div>
              <div className="flex items-center gap-3 text-xs opacity-75">
                <span>Features</span>
                <span>Pricing</span>
                <span>Docs</span>
              </div>
            </div>

            {/* Mockup Hero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              <div className="md:col-span-2 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: colors[1]?.hex ? `${colors[1].hex}22` : '#3B82F622',
                    color: colors[1]?.hex || '#3B82F6'
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Next-Generation Design System</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Empower your workflow with clean, accessible digital products.
                </h2>
                
                <p className="text-xs sm:text-sm opacity-75">
                  Every component dynamically maps directly to your active color palette tokens.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    style={{
                      backgroundColor: colors[0]?.hex || '#4F46E5',
                      color: colors[0]?.bestTextColor || '#FFF'
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-transform hover:scale-105 active:scale-95"
                  >
                    Get Started Free
                  </button>
                  <button
                    type="button"
                    style={{
                      backgroundColor: colors[2]?.hex ? `${colors[2].hex}25` : '#10B98125',
                      color: colors[2]?.hex || '#10B981',
                      borderColor: colors[2]?.hex || '#10B981'
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-opacity-30"
                  >
                    Live Interactive Demo
                  </button>
                </div>
              </div>

              {/* Mockup Metric Card Widget */}
              <div
                style={{
                  backgroundColor: mockupTheme === 'dark' ? '#111622' : '#FFFFFF',
                  borderColor: colors[3]?.hex || '#E2E8F0'
                }}
                className="p-5 rounded-2xl border shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold opacity-80">Conversion Velocity</span>
                  <span
                    style={{ color: colors[1]?.hex || '#3B82F6' }}
                    className="font-bold font-mono"
                  >
                    +34.8%
                  </span>
                </div>
                
                <div className="text-2xl font-black font-mono">
                  $128,490
                </div>

                {/* Multi-Color Progress Bar */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                  {colors.map((c, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: c.hex, width: `${100 / colors.length}%` }}
                      className="h-full"
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 5. MODAL: CURATED DESIGNER PRESETS (EXPANDED 36 COMBOS)  */}
      {/* ======================================================== */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-4xl bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Curated Designer Combinations ({CURATED_PALETTES.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hand-crafted palettes across UI dark themes, vibrant cyber neon, earth tones, and warm luxury.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetsModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Tabs & Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    placeholder="Search by name, description, hex..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Random preset trigger button */}
                <button
                  type="button"
                  onClick={handleRandomPreset}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800/80 transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Surprise Me</span>
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {PRESET_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPresetCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                      presetCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1">
              {filteredPresets.length === 0 ? (
                <div className="col-span-2 text-center py-12 space-y-2 text-slate-400">
                  <p className="text-sm font-semibold">No preset matches found</p>
                  <p className="text-xs">Try a different search query or select "All Combinations".</p>
                </div>
              ) : (
                filteredPresets.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleApplyCurated(item)}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all group hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                      {item.description}
                    </p>

                    <div className="flex h-11 rounded-lg overflow-hidden shadow-inner">
                      {item.colors.map((hex, i) => (
                        <div
                          key={i}
                          style={{ backgroundColor: hex }}
                          className="flex-1 transition-transform group-hover:scale-102"
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPresetsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: CROSS-PALETTE CONTRAST PAIR MATRIX (PRO TOOL)  */}
      {/* ======================================================== */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Cross-Color Contrast Matrix (NxN)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pairwise contrast ratios between every color in your palette. Minimum 4.5:1 required for WCAG AA.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-auto flex-1">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full text-xs text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-semibold text-slate-400">BG \ Text</th>
                      {colors.map((c, i) => (
                        <th key={i} className="p-2 font-mono">
                          <div className="flex flex-col items-center gap-1">
                            <div style={{ backgroundColor: c.hex }} className="w-4 h-4 rounded-full border border-white/20" />
                            <span className="text-[10px] text-slate-500">#{i + 1}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crossContrastMatrix.map((row) => (
                      <tr key={row.index} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-2 font-medium text-left flex items-center gap-2">
                          <div style={{ backgroundColor: row.color.hex }} className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                          <span className="font-mono text-xs truncate max-w-[100px]">{row.color.hex}</span>
                        </td>
                        {row.contrasts.map((col, colIdx) => (
                          <td key={colIdx} className="p-2">
                            {col.isSelf ? (
                              <span className="text-slate-300 dark:text-slate-700 font-mono">—</span>
                            ) : (
                              <span className={`px-2 py-1 rounded font-mono font-bold text-[11px] inline-block ${
                                col.aaa
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                  : col.aa
                                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}>
                                {col.ratio}:1
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> AAA Pass (≥7:1)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-500" /> AA Pass (≥4.5:1)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-400" /> Fail (&lt;4.5:1)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: EXPORT PALETTE                                 */}
      {/* ======================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Export Palette Tokens
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-xs font-semibold">
              {[
                { id: 'css', label: 'CSS Variables' },
                { id: 'tailwind', label: 'Tailwind Config' },
                { id: 'scss', label: 'SCSS' },
                { id: 'json', label: 'JSON' },
                { id: 'svg', label: 'SVG Swatch' },
                { id: 'png', label: 'PNG Image' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setExportTab(t.id)}
                  className={`px-3 py-2 border-b-2 transition-all ${
                    exportTab === t.id
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {exportTab === 'png' ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 mx-auto">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Download High-Resolution PNG Swatch Card
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Renders a polished, shareable swatch image with color names, hex labels, and RGB metrics.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    disabled={isExportingPng}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingPng ? 'Rendering PNG...' : 'Download PNG Swatch'}</span>
                  </button>
                </div>
              ) : exportTab === 'svg' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Vector SVG Swatch Markup</span>
                    <button
                      type="button"
                      onClick={handleDownloadSvg}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .svg File</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-64 border border-slate-800">
                    {exportCode}
                  </pre>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Ready to paste into your codebase</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(exportCode, `Copied ${exportTab.toUpperCase()} code!`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                    {exportCode}
                  </pre>
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL: IMAGE COLOR EXTRACTOR                          */}
      {/* ======================================================== */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Extract Palette from Image
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              <div
                onClick={() => imageFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50 space-y-2"
              >
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drop an image file
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports JPG, PNG, WebP, SVG, and GIF
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">No image on hand?</span>
                <button
                  type="button"
                  onClick={handleLoadSampleImage}
                  disabled={isExtractingImage}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Try Synthwave Demo Image
                </button>
              </div>

              {imagePreviewUrl && (
                <div className="space-y-3">
                  <div className="h-32 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {extractedColors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Extracted Dominant Palette ({extractedColors.length} colors)
                      </span>
                      <div className="flex h-12 rounded-xl overflow-hidden shadow-inner">
                        {extractedColors.map((c, i) => (
                          <div
                            key={i}
                            style={{ backgroundColor: c.hex }}
                            className="flex-1 flex items-center justify-center group relative cursor-pointer"
                            title={`${c.name} (${c.hex})`}
                          >
                            <span
                              style={{ color: c.bestTextColor }}
                              className="font-mono text-[9px] font-bold opacity-0 group-hover:opacity-100"
                            >
                              {c.hex}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyExtractedColors}
                disabled={extractedColors.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-all"
              >
                Apply to Studio
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. MODAL: SAVED FAVORITES                                */}
      {/* ======================================================== */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-current" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Saved Favorite Palettes ({savedList.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {savedList.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Heart className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No saved palettes yet
                  </p>
                  <p className="text-xs text-slate-400">
                    Click the "Save" heart button anytime to bookmark your favorite palettes.
                  </p>
                </div>
              ) : (
                savedList.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setColors(item.colors.map(hex => formatColorObject(hex)));
                      setPaletteName(item.name);
                      setShowSavedModal(false);
                      notify(`Loaded "${item.name}"!`, 'success');
                    }}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-rose-500 transition-colors">
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSaved(item.id, e)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Delete from saved"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex h-8 rounded-lg overflow-hidden shadow-xs">
                      {item.colors.map((hex, i) => (
                        <div
                          key={i}
                          style={{ backgroundColor: hex }}
                          className="flex-1"
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {savedList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSaved}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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
