import React, { useState, useEffect, useCallback } from 'react';
import {
  FileImage,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  FileArchive,
  AlertCircle,
  Sliders,
  Zap,
  Info,
  ShieldCheck,
  Palette
} from 'lucide-react';
import {
  FORMAT_OPTIONS,
  formatBytes,
  convertImage,
  createConverterSampleImage,
  downloadBlob
} from '../utils/imageConverterUtils';
import { createZipArchive } from '../utils/imageCompressorUtils';

export default function ImageFormatConverterSuite({ _theme = 'dark', onNotify }) {
  // Navigation tabs: 'single' | 'bulk' | 'guide'
  const [activeTab, setActiveTab] = useState('single');

  // --- SINGLE CONVERTER STATE ---
  const [singleFile, setSingleFile] = useState(null);
  const [singleOriginalUrl, setSingleOriginalUrl] = useState(null);
  const [singleResult, setSingleResult] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState(null);

  // Single Settings
  const [targetFormat, setTargetFormat] = useState('webp');
  const [quality, setQuality] = useState(85);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [icoSizes, setIcoSizes] = useState([16, 32, 48]);
  const [codeSnippetTab, setCodeSnippetTab] = useState('datauri'); // 'datauri' | 'html' | 'css'

  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // --- BULK CONVERTER STATE ---
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, isRunning: false });
  const [bulkTargetFormat, setBulkTargetFormat] = useState('webp');
  const [bulkQuality, setBulkQuality] = useState(85);
  const [bulkBackgroundColor, setBulkBackgroundColor] = useState('#ffffff');
  const [isZipping, setIsZipping] = useState(false);

  // Dropzone drag-over indicators
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

  // Execute single conversion
  const executeSingleConversion = useCallback(async (fileToConvert, customOpts = {}) => {
    if (!fileToConvert) return;
    setSingleLoading(true);
    setSingleError(null);

    const opts = {
      quality: (customOpts.quality !== undefined ? customOpts.quality : quality) / 100,
      backgroundColor: customOpts.backgroundColor !== undefined ? customOpts.backgroundColor : backgroundColor,
      icoSizes: customOpts.icoSizes || icoSizes,
    };

    const fmt = customOpts.format || targetFormat;

    try {
      const res = await convertImage(fileToConvert, fmt, opts);
      setSingleResult(res);
    } catch (err) {
      setSingleError(err?.message || 'Conversion failed.');
      if (onNotify) onNotify(err?.message || 'Conversion failed', 'error');
    } finally {
      setSingleLoading(false);
    }
  }, [quality, backgroundColor, icoSizes, targetFormat, onNotify]);

  // Load single image handler
  const handleSingleImageSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please select a valid image file (PNG, JPEG, WebP, SVG, BMP, etc.).', 'error');
      return;
    }

    if (singleOriginalUrl) URL.revokeObjectURL(singleOriginalUrl);
    const url = URL.createObjectURL(file);
    setSingleFile(file);
    setSingleOriginalUrl(url);
    setSingleResult(null);

    executeSingleConversion(file);
  }, [singleOriginalUrl, executeSingleConversion, onNotify]);

  // Load sample demo image
  const handleLoadSample = async (type = 'logo') => {
    try {
      setSingleLoading(true);
      const sample = await createConverterSampleImage(type);
      handleSingleImageSelect(sample);
      if (onNotify) onNotify(`Loaded demo ${type} image!`, 'success');
    } catch {
      if (onNotify) onNotify('Failed to create sample image.', 'error');
    } finally {
      setSingleLoading(false);
    }
  };

  // Re-run single conversion on setting changes
  useEffect(() => {
    if (!singleFile) return;
    const timer = setTimeout(() => {
      executeSingleConversion(singleFile);
    }, 200);
    return () => clearTimeout(timer);
  }, [targetFormat, quality, backgroundColor, icoSizes, singleFile, executeSingleConversion]);

  // Copy converted image to clipboard
  const handleCopyImage = async () => {
    if (!singleResult) return;
    try {
      if (targetFormat === 'base64' || targetFormat === 'svg') {
        const textToCopy = targetFormat === 'base64' ? singleResult.base64 : await singleResult.blob.text();
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onNotify) onNotify('Copied text to clipboard!', 'success');
      } else if (navigator.clipboard && window.ClipboardItem && singleResult.blob) {
        let clipboardBlob = singleResult.blob;
        if (clipboardBlob.type !== 'image/png') {
          const res = await convertImage(singleFile, 'png');
          clipboardBlob = res.blob;
        }
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': clipboardBlob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onNotify) onNotify('Image copied to clipboard!', 'success');
      } else {
        throw new Error('ClipboardItem API not supported');
      }
    } catch {
      if (onNotify) onNotify('Could not copy image. Use download instead.', 'info');
    }
  };

  // Copy code snippet helper
  const handleCopyCodeSnippet = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    if (onNotify) onNotify('Code snippet copied to clipboard!', 'success');
  };

  // Toggle ICO size checkbox
  const handleToggleIcoSize = (size) => {
    setIcoSizes(prev => {
      if (prev.includes(size)) {
        if (prev.length === 1) return prev; // keep at least one size
        return prev.filter(s => s !== size);
      }
      return [...prev, size].sort((a, b) => a - b);
    });
  };

  // --- BULK CONVERSION HANDLERS ---
  const handleBulkFilesAdded = (filesList) => {
    const newItems = [];
    for (const f of filesList) {
      if (f.type.startsWith('image/')) {
        newItems.push({
          id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file: f,
          originalUrl: URL.createObjectURL(f),
          status: 'pending', // 'pending' | 'processing' | 'done' | 'error'
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

  // Load 4 demo bulk images
  const handleAddBulkSamples = async () => {
    try {
      const s1 = await createConverterSampleImage('logo');
      const s2 = await createConverterSampleImage('photo');
      const s3 = await createConverterSampleImage('art');
      handleBulkFilesAdded([s1, s2, s3]);
      if (onNotify) onNotify('Added 3 sample images to batch!', 'success');
    } catch {
      if (onNotify) onNotify('Failed to create sample batch.', 'error');
    }
  };

  // Process bulk queue
  const processBulkQueue = async () => {
    if (bulkFiles.length === 0 || bulkProgress.isRunning) return;

    setBulkProgress({ current: 0, total: bulkFiles.length, isRunning: true });

    const updated = [...bulkFiles];
    const opts = {
      quality: bulkQuality / 100,
      backgroundColor: bulkBackgroundColor,
      icoSizes: [16, 32, 48],
    };

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') {
        setBulkProgress(prev => ({ ...prev, current: i + 1 }));
        continue;
      }

      updated[i] = { ...updated[i], status: 'processing' };
      setBulkFiles([...updated]);

      try {
        const res = await convertImage(updated[i].file, bulkTargetFormat, opts);
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
          error: err?.message || 'Conversion failed',
        };
      }

      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
      setBulkFiles([...updated]);
    }

    setBulkProgress(prev => ({ ...prev, isRunning: false }));
    if (onNotify) onNotify('Bulk format conversion complete!', 'success');
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const doneItems = bulkFiles.filter(item => item.status === 'done' && item.result?.blob);
    if (doneItems.length === 0) {
      if (onNotify) onNotify('No converted files available to download.', 'error');
      return;
    }

    setIsZipping(true);
    try {
      const filesForZip = doneItems.map(item => ({
        name: item.result.name,
        blob: item.result.blob,
      }));

      const zipBlob = await createZipArchive(filesForZip);
      downloadBlob(zipBlob, `converted-${bulkTargetFormat}-images-${Date.now()}.zip`);
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

    if (onNotify) onNotify(`Triggered download for ${doneItems.length} files.`, 'info');
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

  // Bulk stats
  const bulkStats = bulkFiles.reduce((acc, curr) => {
    acc.totalOriginalBytes += curr.file.size;
    if (curr.status === 'done' && curr.result) {
      acc.totalConvertedBytes += curr.result.convertedSize;
      acc.completedCount++;
    } else {
      acc.totalConvertedBytes += curr.file.size;
    }
    return acc;
  }, { totalOriginalBytes: 0, totalConvertedBytes: 0, completedCount: 0 });

  const bulkSavedBytes = Math.max(0, bulkStats.totalOriginalBytes - bulkStats.totalConvertedBytes);
  const bulkSavedPercent = bulkStats.totalOriginalBytes > 0
    ? Math.round((bulkSavedBytes / bulkStats.totalOriginalBytes) * 100)
    : 0;

  const currentFormatMeta = FORMAT_OPTIONS.find(f => f.id === targetFormat) || FORMAT_OPTIONS[0];

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
            <FileImage className="w-3.5 h-3.5" />
            <span>Single Converter</span>
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
            <span>Format Matrix</span>
          </button>
        </div>

        {/* Client-Side Processing Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero Server Uploads • 100% In-Browser</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE IMAGE FORMAT CONVERTER */}
      {/* ========================================================================= */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Area: Preview / Output (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {singleError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{singleError}</span>
              </div>
            )}

            {!singleFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingSingle(true); }}
                onDragLeave={() => setIsDraggingSingle(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingSingle(false);
                  if (e.dataTransfer.files?.[0]) handleSingleImageSelect(e.dataTransfer.files[0]);
                }}
                className={`relative flex flex-col items-center justify-center p-10 sm:p-16 rounded-2xl border-2 border-dashed transition-all text-center ${
                  isDraggingSingle
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111622] hover:border-indigo-400 dark:hover:border-indigo-600'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Upload an image to convert format
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6">
                  Supports PNG, JPEG, WebP, SVG, BMP, GIF, and ICO. 100% private in-browser conversion.
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

                  <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="px-2 text-slate-400 font-medium">Or try demo:</span>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('logo')}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      Transparent Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('photo')}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      Landscape Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('art')}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      Circuit Vector
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Viewport with checkerboard */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md min-h-[460px] max-h-[620px] flex items-center justify-center p-4">
                  {/* Checkerboard transparency backdrop */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #475569 25%, transparent 25%), linear-gradient(-45deg, #475569 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #475569 75%), linear-gradient(-45deg, transparent 75%, #475569 75%)`,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />

                  {/* Loading overlay */}
                  {singleLoading && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-white gap-2">
                      <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                      <span className="text-xs font-semibold">Converting format on client canvas...</span>
                    </div>
                  )}

                  {/* Converted Image Output or Base64 / SVG Code view */}
                  {targetFormat === 'base64' && singleResult?.base64 ? (
                    <div className="w-full max-h-[520px] overflow-auto p-4 bg-slate-950/90 rounded-xl border border-slate-800 text-xs font-mono space-y-3 z-10">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCodeSnippetTab('datauri')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                              codeSnippetTab === 'datauri' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Data URI
                          </button>
                          <button
                            type="button"
                            onClick={() => setCodeSnippetTab('html')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                              codeSnippetTab === 'html' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            HTML &lt;img&gt;
                          </button>
                          <button
                            type="button"
                            onClick={() => setCodeSnippetTab('css')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                              codeSnippetTab === 'css' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            CSS
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const val = codeSnippetTab === 'datauri' 
                              ? singleResult.base64 
                              : codeSnippetTab === 'html' 
                                ? singleResult.htmlSnippet 
                                : singleResult.cssSnippet;
                            handleCopyCodeSnippet(val);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCode ? 'Copied' : 'Copy Snippet'}</span>
                        </button>
                      </div>

                      <pre className="text-indigo-300 whitespace-pre-wrap break-all select-all max-h-[380px] overflow-auto text-[11px] p-2 bg-black/40 rounded-lg">
                        {codeSnippetTab === 'datauri' && singleResult.base64}
                        {codeSnippetTab === 'html' && singleResult.htmlSnippet}
                        {codeSnippetTab === 'css' && singleResult.cssSnippet}
                      </pre>
                    </div>
                  ) : singleResult?.url ? (
                    <img
                      src={singleResult.url}
                      alt="Converted output"
                      className="max-h-[540px] max-w-full object-contain rounded-lg shadow-xl"
                    />
                  ) : (
                    <img
                      src={singleOriginalUrl}
                      alt="Original input"
                      className="max-h-[540px] max-w-full object-contain"
                    />
                  )}

                  {/* Format Pill Overlay */}
                  <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-lg text-xs font-bold bg-slate-950/80 text-white backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-2">
                    <span className="text-emerald-400">{singleResult ? singleResult.format.toUpperCase() : '...'}</span>
                    <span className="text-slate-400 font-normal">
                      ({singleResult ? `${singleResult.width}×${singleResult.height}` : ''} px)
                    </span>
                  </div>

                  {/* Change & Clear buttons */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 text-xs cursor-pointer font-medium backdrop-blur-md border border-white/10 transition-colors">
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
                      className="p-1 rounded-lg bg-slate-950/80 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                      title="Clear image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics & Actions Footer Bar */}
                {singleResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Original Input</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatBytes(singleResult.originalSize)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {singleFile?.type || 'image'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Converted Output</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {formatBytes(singleResult.convertedSize)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {singleResult.mimeType}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Payload Delta</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-extrabold ${
                          singleResult.savedPercentage > 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-amber-500'
                        }`}>
                          {singleResult.savedPercentage > 0 ? `-${singleResult.savedPercentage}%` : `+${Math.abs(singleResult.savedPercentage)}%`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({formatBytes(Math.abs(singleResult.savedBytes))})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Converted in {singleResult.durationMs}ms
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

          {/* Right Column: Format Switcher & Options (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Target Format</span>
                </div>
                {singleLoading && (
                  <span className="text-[10px] text-indigo-500 font-medium animate-pulse">Converting...</span>
                )}
              </div>

              {/* Format Selection Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Output Format
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTargetFormat(f.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        targetFormat === f.id
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{f.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          {f.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1 line-clamp-1">
                        {f.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Specific Controls */}
              {/* Quality Slider (for WebP and JPEG) */}
              {currentFormatMeta.supportsQuality && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Compression Quality</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      {quality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Small File (60%)</span>
                    <span className="font-bold text-indigo-500">Balanced (85%)</span>
                    <span>Crisp (95%)</span>
                  </div>
                </div>
              )}

              {/* Background Color Filler (for JPEG or opaque conversion) */}
              {targetFormat === 'jpeg' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <Palette className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Background Fill (for Transparent Pixels)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    JPEG does not support alpha channels. Transparent areas will be filled with:
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setBackgroundColor('#ffffff')}
                        className={`px-2 py-1 rounded border cursor-pointer ${
                          backgroundColor === '#ffffff' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        White
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackgroundColor('#000000')}
                        className={`px-2 py-1 rounded border cursor-pointer ${
                          backgroundColor === '#000000' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Black
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ICO Size Checkboxes */}
              {targetFormat === 'ico' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Bundled Favicon Resolutions
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Generates a multi-resolution ICO icon containing:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[16, 32, 48, 64, 128].map(size => {
                      const active = icoSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleToggleIcoSize(size)}
                          className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-bold text-center border cursor-pointer transition-colors ${
                            active
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          {size}&times;{size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Security & Privacy Notice */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Private In-Browser Execution</span>
                </div>
                <p className="leading-relaxed">
                  Conversions are rendered purely on your device GPU/CPU canvas. No image buffers are ever transmitted across the internet.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BULK FORMAT CONVERTER */}
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
                    Bulk Multi-Image Batch Format Converter
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Convert 50+ images at once into WebP, PNG, JPEG, or Favicon ICO, and download as a single .zip archive.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddBulkSamples}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Load 3 Demo Images
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
                {/* Global Settings */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Convert All To:</span>
                    <select
                      value={bulkTargetFormat}
                      onChange={(e) => setBulkTargetFormat(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                    >
                      <option value="webp">WebP (Modern Standard)</option>
                      <option value="png">PNG (Lossless)</option>
                      <option value="jpeg">JPEG (Universal)</option>
                      <option value="ico">ICO (Windows Favicon)</option>
                      <option value="bmp">BMP (Bitmap)</option>
                    </select>
                  </div>

                  {(bulkTargetFormat === 'webp' || bulkTargetFormat === 'jpeg') && (
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
                  )}

                  {bulkTargetFormat === 'jpeg' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Fill:</span>
                      <input
                        type="color"
                        value={bulkBackgroundColor}
                        onChange={(e) => setBulkBackgroundColor(e.target.value)}
                        className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
                      />
                    </div>
                  )}
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
                        <span>Converting ({bulkProgress.current}/{bulkProgress.total})</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Convert All ({bulkFiles.length})</span>
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
                    {bulkFiles.length} images ({bulkStats.completedCount} converted)
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Original Weight</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-300">
                    {formatBytes(bulkStats.totalOriginalBytes)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Output Weight</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatBytes(bulkStats.totalConvertedBytes)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Total Space Saved</span>
                  <span className={`text-sm font-extrabold ${bulkSavedPercent > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    -{bulkSavedPercent}% ({formatBytes(bulkSavedBytes)})
                  </span>
                </div>
              </div>

              {/* Progress Bar when running */}
              {bulkProgress.isRunning && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Batch format conversion in progress...</span>
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
                                  {formatBytes(item.result.convertedSize)}
                                </span>
                                <span>&bull;</span>
                                <span className="text-emerald-500 font-semibold">{item.result.format.toUpperCase()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        {isDone && (
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.result.savedPercentage > 0
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {item.result.savedPercentage > 0 ? `-${item.result.savedPercentage}%` : `+${Math.abs(item.result.savedPercentage)}%`}
                          </span>
                        )}

                        {isProcessing && (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Converting</span>
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
                            title="Download this file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}

                        {/* Remove button */}
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
      {/* TAB 3: FORMAT MATRIX & COMPARISON GUIDE */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FORMAT_OPTIONS.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{f.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                    .{f.ext}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {f.description}
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                  <div>Alpha Transparency: <span className="font-semibold text-slate-700 dark:text-slate-300">{f.supportsAlpha ? 'Yes' : 'No'}</span></div>
                  <div>Compression Type: <span className="font-semibold text-slate-700 dark:text-slate-300">{f.supportsQuality ? 'Lossy (Adjustable)' : 'Lossless / Standard'}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Core Web Vitals Notice */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900/60 border border-indigo-900/40 text-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>Which image format should you choose for web performance?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              For general website delivery, <strong>WebP</strong> is the recommended industry standard, delivering up to 30% reduction in bytes compared to JPEG while preserving alpha transparency. Use <strong>PNG</strong> when pixel-perfect sharp text, vector logos, or UI screenshot clarity is paramount. Use <strong>ICO</strong> specifically for multi-resolution website favicons.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
