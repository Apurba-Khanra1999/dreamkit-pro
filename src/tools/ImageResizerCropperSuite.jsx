import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop,
  Scaling,
  Sliders,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  AlertCircle,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Grid3X3,
  Copy,
  Check,
  Maximize2,
  Smartphone,
  Monitor,
  Lock,
  Unlock,
  ArrowRight
} from 'lucide-react';
import {
  DIMENSION_PRESETS,
  ASPECT_RATIO_PRESETS,
  formatBytes,
  loadImage,
  resizeImage,
  cropAndTransformImage,
  createEditorSampleImage,
  downloadBlob
} from '../utils/imageEditorUtils';

export default function ImageResizerCropperSuite({ _theme = 'dark', onNotify }) {
  // Navigation tabs: 'resizer' | 'cropper' | 'presets'
  const [activeTab, setActiveTab] = useState('resizer');

  // Shared Image Source
  const [currentFile, setCurrentFile] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  const [sourceUrl, setSourceUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  // --- RESIZER STATE ---
  const [widthStr, setWidthStr] = useState('1280');
  const [heightStr, setHeightStr] = useState('720');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatioValue, setAspectRatioValue] = useState(16 / 9);
  const [resizeMode, setResizeMode] = useState('fit'); // 'fit' | 'stretch' | 'pad' | 'cover'
  const [padColor, setPadColor] = useState('#ffffff');
  const [smoothing, setSmoothing] = useState(true);
  const [resizeFormat, setResizeFormat] = useState('image/png');
  const [resizeQuality, setResizeQuality] = useState(90);
  const [resizerResult, setResizerResult] = useState(null);
  const [resizerLoading, setResizerLoading] = useState(false);

  // --- CROPPER STATE ---
  const stageCanvasRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [selectedRatio, setSelectedRatio] = useState('free'); // 'free', '1:1', '16:9', etc.
  const [showGrid, setShowGrid] = useState(true);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [cropFormat, setCropFormat] = useState('image/png');
  const [cropQuality, setCropQuality] = useState(90);
  const [croppedResult, setCroppedResult] = useState(null);
  const [cropperLoading, setCropperLoading] = useState(false);

  // Display bounds for crop box overlay
  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });

  // Dragging state ref
  const dragRef = useRef(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (resizerResult?.url) URL.revokeObjectURL(resizerResult.url);
      if (croppedResult?.url) URL.revokeObjectURL(croppedResult.url);
    };
  }, [sourceUrl, resizerResult, croppedResult]);

  // Handle incoming image file
  const handleImageLoaded = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please select a valid image file.', 'error');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);

      const url = URL.createObjectURL(file);
      const img = await loadImage(url);

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      setCurrentFile(file);
      setImageElement(img);
      setSourceUrl(url);

      // Initialize Resizer
      setWidthStr(String(w));
      setHeightStr(String(h));
      setAspectRatioValue(w / h);

      // Initialize Cropper (centered 80% box)
      const cropW = Math.round(w * 0.8);
      const cropH = Math.round(h * 0.8);
      const cropX = Math.round((w - cropW) / 2);
      const cropY = Math.round((h - cropH) / 2);
      setCropRect({ x: cropX, y: cropY, width: cropW, height: cropH });
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setSelectedRatio('free');
      setCroppedResult(null);

      if (onNotify) onNotify(`Loaded "${file.name}" (${w}×${h} px)`, 'success');
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to decode image');
      if (onNotify) onNotify('Failed to load image', 'error');
    } finally {
      setLoading(false);
    }
  }, [sourceUrl, onNotify]);

  // Load sample demo image
  const handleLoadSample = async (type = 'photo') => {
    try {
      setLoading(true);
      const sample = await createEditorSampleImage(type);
      await handleImageLoaded(sample);
    } catch {
      if (onNotify) onNotify('Failed to create sample image', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- RESIZER EXECUTION & LOGIC ---
  const executeResize = useCallback(async (customW, customH) => {
    if (!imageElement) return;
    const targetW = customW !== undefined ? customW : parseInt(widthStr, 10);
    const targetH = customH !== undefined ? customH : parseInt(heightStr, 10);

    if (!targetW || targetW <= 0 || !targetH || targetH <= 0) return;

    try {
      setResizerLoading(true);
      const res = await resizeImage(imageElement, {
        targetWidth: targetW,
        targetHeight: targetH,
        mode: resizeMode,
        padColor,
        smoothing,
        format: resizeFormat,
        quality: resizeQuality / 100,
      });
      setResizerResult(res);
    } catch (err) {
      setErrorMsg(err?.message || 'Resize failed');
    } finally {
      setResizerLoading(false);
    }
  }, [imageElement, widthStr, heightStr, resizeMode, padColor, smoothing, resizeFormat, resizeQuality]);

  // Debounced auto-resize when inputs change
  useEffect(() => {
    if (!imageElement) return;
    const w = parseInt(widthStr, 10);
    const h = parseInt(heightStr, 10);
    if (!w || w <= 0 || !h || h <= 0) return;

    const timer = setTimeout(() => {
      executeResize(w, h);
    }, 250);
    return () => clearTimeout(timer);
  }, [imageElement, widthStr, heightStr, resizeMode, padColor, smoothing, resizeFormat, resizeQuality, executeResize]);

  const handleWidthChange = (val) => {
    setWidthStr(val);
    const num = parseInt(val, 10);
    if (num > 0 && lockAspectRatio && aspectRatioValue) {
      setHeightStr(String(Math.max(1, Math.round(num / aspectRatioValue))));
    }
  };

  const handleHeightChange = (val) => {
    setHeightStr(val);
    const num = parseInt(val, 10);
    if (num > 0 && lockAspectRatio && aspectRatioValue) {
      setWidthStr(String(Math.max(1, Math.round(num * aspectRatioValue))));
    }
  };

  const applyScalePercentage = (pct) => {
    if (!imageElement) return;
    const origW = imageElement.naturalWidth || imageElement.width;
    const origH = imageElement.naturalHeight || imageElement.height;
    const newW = Math.max(1, Math.round(origW * (pct / 100)));
    const newH = Math.max(1, Math.round(origH * (pct / 100)));
    setWidthStr(String(newW));
    setHeightStr(String(newH));
  };

  const applyDimensionPreset = (preset) => {
    setWidthStr(String(preset.width));
    setHeightStr(String(preset.height));
    if (preset.width && preset.height) {
      setAspectRatioValue(preset.width / preset.height);
    }
    if (onNotify) onNotify(`Applied preset: ${preset.label} (${preset.width}×${preset.height})`, 'info');
  };

  // --- CROPPER STAGE CANVAS RENDERING ---
  // Draws the base image with rotation and flips applied directly onto stageCanvas
  useEffect(() => {
    if (!imageElement || activeTab !== 'cropper') return;

    const canvas = stageCanvasRef.current;
    if (!canvas) return;

    const origW = imageElement.naturalWidth || imageElement.width;
    const origH = imageElement.naturalHeight || imageElement.height;

    const normRot = ((rotation % 360) + 360) % 360;
    const isPerp = normRot === 90 || normRot === 270;
    const stageW = isPerp ? origH : origW;
    const stageH = isPerp ? origW : origH;

    canvas.width = stageW;
    canvas.height = stageH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, stageW, stageH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Apply orientation matrix
    ctx.save();
    ctx.translate(stageW / 2, stageH / 2);
    ctx.rotate((normRot * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(imageElement, -origW / 2, -origH / 2);
    ctx.restore();

    setStageDimensions({ width: stageW, height: stageH });
  }, [imageElement, rotation, flipH, flipV, activeTab]);

  // Observe displayed size of the stage canvas in viewport
  useEffect(() => {
    if (!stageCanvasRef.current) return;
    const canvas = stageCanvasRef.current;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setWrapperSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(canvas);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [stageDimensions, activeTab]);

  // Execute Crop operation
  const executeCrop = useCallback(async () => {
    if (!imageElement) return;
    try {
      setCropperLoading(true);
      const res = await cropAndTransformImage(imageElement, cropRect, {
        rotation,
        flipH,
        flipV,
        format: cropFormat,
        quality: cropQuality / 100,
      });
      setCroppedResult(res);
    } catch (err) {
      setErrorMsg(err?.message || 'Crop failed');
    } finally {
      setCropperLoading(false);
    }
  }, [imageElement, cropRect, rotation, flipH, flipV, cropFormat, cropQuality]);

  // Trigger crop when crop parameters change
  useEffect(() => {
    if (activeTab === 'cropper' && imageElement) {
      const timer = setTimeout(() => {
        executeCrop();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, imageElement, cropRect, rotation, flipH, flipV, cropFormat, cropQuality, executeCrop]);

  // Aspect Ratio Selection
  const handleSelectAspectRatio = (presetId) => {
    setSelectedRatio(presetId);
    const found = ASPECT_RATIO_PRESETS.find(p => p.id === presetId);
    if (!found || found.ratio === null) return;

    const r = found.ratio;
    const stageW = stageDimensions.width;
    const stageH = stageDimensions.height;

    let newW = cropRect.width;
    let newH = Math.round(newW / r);

    if (newH > stageH) {
      newH = stageH;
      newW = Math.round(newH * r);
    }
    if (newW > stageW) {
      newW = stageW;
      newH = Math.round(newW / r);
    }

    const newX = Math.max(0, Math.min(stageW - newW, Math.round((stageW - newW) / 2)));
    const newY = Math.max(0, Math.min(stageH - newH, Math.round((stageH - newH) / 2)));

    setCropRect({ x: newX, y: newY, width: newW, height: newH });
  };

  // Maximize Crop to full edges
  const handleMaximizeCrop = () => {
    const stageW = stageDimensions.width;
    const stageH = stageDimensions.height;
    const found = ASPECT_RATIO_PRESETS.find(p => p.id === selectedRatio);

    if (!found || found.ratio === null) {
      setCropRect({ x: 0, y: 0, width: stageW, height: stageH });
    } else {
      const r = found.ratio;
      let newW = stageW;
      let newH = Math.round(newW / r);
      if (newH > stageH) {
        newH = stageH;
        newW = Math.round(newH * r);
      }
      const newX = Math.round((stageW - newW) / 2);
      const newY = Math.round((stageH - newH) / 2);
      setCropRect({ x: newX, y: newY, width: newW, height: newH });
    }
  };

  // Rotation Controls
  const handleRotate = (dir = 'cw') => {
    const delta = dir === 'cw' ? 90 : -90;
    const newRot = (((rotation + delta) % 360) + 360) % 360;
    setRotation(newRot);

    // Swap crop box dimensions to match new orientation
    setCropRect(prev => {
      const nextW = Math.min(prev.height, stageDimensions.height);
      const nextH = Math.min(prev.width, stageDimensions.width);
      return {
        x: 0,
        y: 0,
        width: nextW,
        height: nextH,
      };
    });
  };

  // Reset Transformations
  const handleResetTransformations = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setSelectedRatio('free');
    if (imageElement) {
      const w = imageElement.naturalWidth || imageElement.width;
      const h = imageElement.naturalHeight || imageElement.height;
      setCropRect({
        x: Math.round(w * 0.1),
        y: Math.round(h * 0.1),
        width: Math.round(w * 0.8),
        height: Math.round(h * 0.8),
      });
    }
  };

  // --- CROP BOX INTERACTIVE POINTER HANDLING ---
  const handlePointerDown = (e, actionType) => {
    e.preventDefault();
    e.stopPropagation();

    if (!stageCanvasRef.current) return;
    const rect = stageCanvasRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const scaleX = stageDimensions.width / rect.width;
    const scaleY = stageDimensions.height / rect.height;

    const currentPreset = ASPECT_RATIO_PRESETS.find(p => p.id === selectedRatio);
    const ratio = currentPreset ? currentPreset.ratio : null;

    dragRef.current = {
      action: actionType,
      startX: e.clientX,
      startY: e.clientY,
      origCrop: { ...cropRect },
      scaleX,
      scaleY,
      ratio,
    };
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragRef.current) return;
      const { action, startX, startY, origCrop, scaleX, scaleY, ratio } = dragRef.current;

      const deltaX = (e.clientX - startX) * scaleX;
      const deltaY = (e.clientY - startY) * scaleY;

      const stageW = stageDimensions.width;
      const stageH = stageDimensions.height;
      const minDimension = 30;

      let { x, y, width, height } = origCrop;

      if (action === 'move') {
        x = Math.max(0, Math.min(stageW - width, Math.round(origCrop.x + deltaX)));
        y = Math.max(0, Math.min(stageH - height, Math.round(origCrop.y + deltaY)));
      } else {
        // Handle resizing in 8 directions
        if (action.includes('e')) {
          width = Math.max(minDimension, Math.min(stageW - origCrop.x, Math.round(origCrop.width + deltaX)));
        }
        if (action.includes('s')) {
          height = Math.max(minDimension, Math.min(stageH - origCrop.y, Math.round(origCrop.height + deltaY)));
        }
        if (action.includes('w')) {
          const maxLeft = origCrop.x + origCrop.width - minDimension;
          x = Math.max(0, Math.min(maxLeft, Math.round(origCrop.x + deltaX)));
          width = origCrop.width + (origCrop.x - x);
        }
        if (action.includes('n')) {
          const maxTop = origCrop.y + origCrop.height - minDimension;
          y = Math.max(0, Math.min(maxTop, Math.round(origCrop.y + deltaY)));
          height = origCrop.height + (origCrop.y - y);
        }

        // Apply aspect ratio lock if active
        if (ratio) {
          if (action === 'e' || action === 'w' || action === 'se' || action === 'sw') {
            height = Math.round(width / ratio);
          } else {
            width = Math.round(height * ratio);
          }

          if (x + width > stageW) {
            width = stageW - x;
            height = Math.round(width / ratio);
          }
          if (y + height > stageH) {
            height = stageH - y;
            width = Math.round(height * ratio);
          }
        }
      }

      setCropRect({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    const handlePointerUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        executeCrop();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [stageDimensions, executeCrop]);

  // Copy helper
  const handleCopy = async (blob) => {
    if (!blob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onNotify) onNotify('Image copied to clipboard!', 'success');
      } else {
        throw new Error('ClipboardItem API not supported');
      }
    } catch {
      if (onNotify) onNotify('Could not copy directly to clipboard. Please download.', 'info');
    }
  };

  // Convert crop rect into on-screen display coordinates
  const scaleDisplayX = wrapperSize.width > 0 && stageDimensions.width > 0 ? wrapperSize.width / stageDimensions.width : 1;
  const scaleDisplayY = wrapperSize.height > 0 && stageDimensions.height > 0 ? wrapperSize.height / stageDimensions.height : 1;

  const cropScreenLeft = Math.round(cropRect.x * scaleDisplayX);
  const cropScreenTop = Math.round(cropRect.y * scaleDisplayY);
  const cropScreenWidth = Math.round(cropRect.width * scaleDisplayX);
  const cropScreenHeight = Math.round(cropRect.height * scaleDisplayY);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Mode Tab Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('resizer')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'resizer'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scaling className="w-3.5 h-3.5" />
            <span>Image Resizer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cropper')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cropper'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Image Cropper</span>
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
            <Sliders className="w-3.5 h-3.5" />
            <span>Dimension Presets</span>
          </button>
        </div>

        {/* Client-Side Processing Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Pixel-Accurate • 100% In-Browser</span>
        </div>
      </div>

      {/* Global Image Status Bar when an image is active */}
      {currentFile && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
              {currentFile.name}
            </span>
            <span className="text-slate-400 font-mono">
              ({imageElement ? `${imageElement.naturalWidth}×${imageElement.naturalHeight}` : ''} px • {formatBytes(currentFile.size)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer font-medium transition-colors">
              <RefreshCw className="w-3 h-3" />
              <span>Change Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageLoaded(e.target.files[0]);
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setCurrentFile(null);
                setImageElement(null);
                setSourceUrl(null);
                setResizerResult(null);
                setCroppedResult(null);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Remove image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Empty State / Upload Dropzone */}
      {!currentFile ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleImageLoaded(e.dataTransfer.files[0]);
          }}
          className="flex flex-col items-center justify-center p-10 sm:p-16 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111622] text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
            {loading ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
            Upload an image to resize or crop
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6">
            Supports JPEG, PNG, WebP, GIF, SVG, and BMP. Runs entirely in your browser with zero server uploads.
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
                  if (e.target.files?.[0]) handleImageLoaded(e.target.files[0]);
                }}
              />
            </label>

            <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="px-2 text-slate-400 font-medium">Or try demo:</span>
              <button
                type="button"
                onClick={() => handleLoadSample('photo')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
              >
                Sunset Photo
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('art')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
              >
                Vector Artwork
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('pixel')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
              >
                Retro Pixel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: IMAGE RESIZER */}
          {/* ========================================================================= */}
          {activeTab === 'resizer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Preview Viewport (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
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

                  {/* Resized Image Output */}
                  {resizerLoading && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-white gap-2">
                      <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                      <span className="text-xs font-semibold">Rescaling image...</span>
                    </div>
                  )}

                  {resizerResult?.url ? (
                    <img
                      src={resizerResult.url}
                      alt="Resized output"
                      className="max-h-[540px] max-w-full object-contain rounded-lg shadow-xl"
                      style={{ imageRendering: smoothing ? 'auto' : 'pixelated' }}
                    />
                  ) : (
                    <img
                      src={sourceUrl}
                      alt="Original input"
                      className="max-h-[540px] max-w-full object-contain"
                    />
                  )}

                  {/* Dimension Pill Overlay */}
                  <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-lg text-xs font-bold bg-slate-950/80 text-white backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-2">
                    <span>{widthStr} &times; {heightStr} px</span>
                    {imageElement && (
                      <span className="text-slate-400 font-normal">
                        (Original: {imageElement.naturalWidth}&times;{imageElement.naturalHeight})
                      </span>
                    )}
                  </div>
                </div>

                {/* Resizer Metrics & Actions Bar */}
                {resizerResult && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Output Resolution</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {resizerResult.width} &times; {resizerResult.height} px
                        </span>
                      </div>
                      <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                        <span className="text-slate-400 block text-[11px]">File Weight</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {formatBytes(resizerResult.size)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(resizerResult.blob)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadBlob(resizerResult.blob, `resized-${resizerResult.width}x${resizerResult.height}.${resizeFormat === 'image/jpeg' ? 'jpg' : resizeFormat === 'image/webp' ? 'webp' : 'png'}`)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Resized</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Resizer Controls Sidebar (4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                      <Scaling className="w-4 h-4 text-indigo-500" />
                      <span>Resize Controls</span>
                    </div>
                  </div>

                  {/* Quick Preset Selector in Resizer */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Standard Dimension Preset
                    </label>
                    <select
                      onChange={(e) => {
                        const p = DIMENSION_PRESETS.find(item => item.id === e.target.value);
                        if (p) applyDimensionPreset(p);
                      }}
                      defaultValue=""
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium cursor-pointer"
                    >
                      <option value="" disabled>Select a standard size...</option>
                      {DIMENSION_PRESETS.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.label} ({p.width}×{p.height})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Width & Height with Lock Aspect Ratio */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Pixel Dimensions</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextLock = !lockAspectRatio;
                          setLockAspectRatio(nextLock);
                          if (nextLock) {
                            const w = parseInt(widthStr, 10);
                            const h = parseInt(heightStr, 10);
                            if (w > 0 && h > 0) setAspectRatioValue(w / h);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          lockAspectRatio
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {lockAspectRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        <span>{lockAspectRatio ? 'Ratio Locked' : 'Freeform'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Width (px)</span>
                        <input
                          type="number"
                          value={widthStr}
                          onChange={(e) => handleWidthChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono font-bold outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Height (px)</span>
                        <input
                          type="number"
                          value={heightStr}
                          onChange={(e) => handleHeightChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono font-bold outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Percentage Presets */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Scale by Percentage
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {[25, 50, 75, 100, 150, 200].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => applyScalePercentage(pct)}
                          className="py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer text-center"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resize Fit Mode */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Resize Fitting Mode
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setResizeMode('fit')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          resizeMode === 'fit'
                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>Proportional</div>
                        <span className="text-[10px] text-slate-500 block">Fit within bounds</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResizeMode('stretch')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          resizeMode === 'stretch'
                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>Stretch</div>
                        <span className="text-[10px] text-slate-500 block">Force exact W×H</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResizeMode('pad')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          resizeMode === 'pad'
                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>Pad / Letterbox</div>
                        <span className="text-[10px] text-slate-500 block">Exact canvas + pad</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResizeMode('cover')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          resizeMode === 'cover'
                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>Center Crop</div>
                        <span className="text-[10px] text-slate-500 block">Fill & clip edges</span>
                      </button>
                    </div>

                    {resizeMode === 'pad' && (
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="text-slate-400">Pad Background:</span>
                        <input
                          type="color"
                          value={padColor === 'transparent' ? '#ffffff' : padColor}
                          onChange={(e) => setPadColor(e.target.value)}
                          className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => setPadColor('transparent')}
                          className="px-2 py-1 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-500 cursor-pointer"
                        >
                          Transparent
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Resampling Filter */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block">Smoothing Filter</span>
                      <span className="text-[11px] text-slate-400">
                        {smoothing ? 'High Bicubic (smooth photos)' : 'Nearest Neighbor (pixel art)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSmoothing(!smoothing)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        smoothing
                          ? 'bg-indigo-600 text-white'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {smoothing ? 'Smooth' : 'Pixelated'}
                    </button>
                  </div>

                  {/* Output Format & Quality */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Export Format
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'image/png', label: 'PNG' },
                        { id: 'image/webp', label: 'WebP' },
                        { id: 'image/jpeg', label: 'JPEG' },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setResizeFormat(f.id)}
                          className={`py-1.5 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                            resizeFormat === f.id
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {resizeFormat !== 'image/png' && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>Quality: {resizeQuality}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={resizeQuality}
                          onChange={(e) => setResizeQuality(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: IMAGE CROPPER */}
          {/* ========================================================================= */}
          {activeTab === 'cropper' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Interactive Cropper Stage Viewport (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md min-h-[460px] max-h-[620px] flex items-center justify-center p-4 select-none">
                  {/* Subtle checkerboard */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #475569 25%, transparent 25%), linear-gradient(-45deg, #475569 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #475569 75%), linear-gradient(-45deg, transparent 75%, #475569 75%)`,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />

                  {/* Stage Canvas Container: Canvas and overlay share exact same bounding client box */}
                  <div ref={stageWrapperRef} className="relative inline-block max-w-full max-h-[540px]">
                    <canvas
                      ref={stageCanvasRef}
                      className="max-h-[520px] max-w-full object-contain block rounded-lg shadow-xl"
                    />

                    {/* Interactive Overlay Directly on Canvas Bounds */}
                    {wrapperSize.width > 0 && wrapperSize.height > 0 && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* 1. Darkened Scrims around Crop Box */}
                        {/* Top Scrim */}
                        <div
                          className="absolute bg-black/65"
                          style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            height: Math.max(0, cropScreenTop),
                          }}
                        />
                        {/* Bottom Scrim */}
                        <div
                          className="absolute bg-black/65"
                          style={{
                            top: Math.min(wrapperSize.height, cropScreenTop + cropScreenHeight),
                            left: 0,
                            right: 0,
                            bottom: 0,
                          }}
                        />
                        {/* Left Scrim */}
                        <div
                          className="absolute bg-black/65"
                          style={{
                            top: Math.max(0, cropScreenTop),
                            left: 0,
                            width: Math.max(0, cropScreenLeft),
                            height: Math.max(0, cropScreenHeight),
                          }}
                        />
                        {/* Right Scrim */}
                        <div
                          className="absolute bg-black/65"
                          style={{
                            top: Math.max(0, cropScreenTop),
                            left: Math.min(wrapperSize.width, cropScreenLeft + cropScreenWidth),
                            right: 0,
                            height: Math.max(0, cropScreenHeight),
                          }}
                        />

                        {/* 2. Interactive Crop Rectangle Box */}
                        <div
                          onPointerDown={(e) => handlePointerDown(e, 'move')}
                          className="absolute pointer-events-auto border-2 border-indigo-400 bg-transparent cursor-move shadow-md"
                          style={{
                            left: cropScreenLeft,
                            top: cropScreenTop,
                            width: cropScreenWidth,
                            height: cropScreenHeight,
                          }}
                        >
                          {/* Rule of Thirds 3x3 Grid */}
                          {showGrid && (
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                              <div className="border-r border-b border-white" />
                              <div className="border-r border-b border-white" />
                              <div className="border-b border-white" />
                              <div className="border-r border-b border-white" />
                              <div className="border-r border-b border-white" />
                              <div className="border-b border-white" />
                              <div className="border-r border-white" />
                              <div className="border-r border-white" />
                              <div />
                            </div>
                          )}

                          {/* 4 Corner Drag Handles */}
                          <div
                            onPointerDown={(e) => handlePointerDown(e, 'nw')}
                            className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize shadow-md"
                          />
                          <div
                            onPointerDown={(e) => handlePointerDown(e, 'ne')}
                            className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize shadow-md"
                          />
                          <div
                            onPointerDown={(e) => handlePointerDown(e, 'sw')}
                            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize shadow-md"
                          />
                          <div
                            onPointerDown={(e) => handlePointerDown(e, 'se')}
                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize shadow-md"
                          />

                          {/* 4 Edge Drag Handles */}
                          <div
                            onPointerDown={(e) => handlePointerDown(e, 'n')}
                            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-indigo-600 rounded-xs cursor-ns-resize shadow-md"
                          />
                          <div
                            onPointerDown={(e) => handlePointerDown(e, 's')}
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-indigo-600 rounded-xs cursor-ns-resize shadow-md"
                          />
                          <div
                            onPointerDown={(e) => handlePointerDown(e, 'w')}
                            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-white border border-indigo-600 rounded-xs cursor-ew-resize shadow-md"
                          />
                          <div
                            onPointerDown={(e) => handlePointerDown(e, 'e')}
                            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-white border border-indigo-600 rounded-xs cursor-ew-resize shadow-md"
                          />

                          {/* Floating Dimension Tag */}
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950/80 text-white backdrop-blur-md pointer-events-none border border-white/20 shadow-md">
                            {cropRect.width} &times; {cropRect.height} px
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cropper Toolbar & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowGrid(!showGrid)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        showGrid
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                      <span>Grid (3&times;3)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleMaximizeCrop}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize Crop</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {croppedResult && (
                      <button
                        type="button"
                        onClick={() => handleCopy(croppedResult.blob)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={executeCrop}
                      disabled={cropperLoading}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {cropperLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crop className="w-3.5 h-3.5" />}
                      <span>Apply Crop</span>
                    </button>

                    {croppedResult && (
                      <button
                        type="button"
                        onClick={() => downloadBlob(croppedResult.blob, `cropped-${croppedResult.width}x${croppedResult.height}.${cropFormat === 'image/jpeg' ? 'jpg' : cropFormat === 'image/webp' ? 'webp' : 'png'}`)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Cropped</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cropped Output Thumbnail Preview & Chain to Resizer */}
                {croppedResult && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                        <img
                          src={croppedResult.url}
                          alt="Cropped thumbnail"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white block">
                          Cropped Output Ready
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{croppedResult.width} &times; {croppedResult.height} px</span>
                          <span>&bull;</span>
                          <span>{formatBytes(croppedResult.size)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setWidthStr(String(croppedResult.width));
                        setHeightStr(String(croppedResult.height));
                        setAspectRatioValue(croppedResult.width / croppedResult.height);
                        setActiveTab('resizer');
                        if (onNotify) onNotify(`Loaded ${croppedResult.width}×${croppedResult.height} px into Image Resizer!`, 'success');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Send to Resizer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Cropper Controls Sidebar (4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                      <Crop className="w-4 h-4 text-indigo-500" />
                      <span>Crop & Orientation</span>
                    </div>
                  </div>

                  {/* Aspect Ratio Lock Presets */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Aspect Ratio Lock
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {ASPECT_RATIO_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectAspectRatio(p.id)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedRatio === p.id
                              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div>{p.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rotate & Flip Tools */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Transform & Rotate</span>
                      {(rotation !== 0 || flipH || flipV) && (
                        <button
                          type="button"
                          onClick={handleResetTransformations}
                          className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleRotate('ccw')}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1 font-medium transition-colors cursor-pointer"
                        title="Rotate 90° Counter-Clockwise"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-[10px]">-90&deg;</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRotate('cw')}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1 font-medium transition-colors cursor-pointer"
                        title="Rotate 90° Clockwise"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span className="text-[10px]">+90&deg;</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFlipH(!flipH)}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 font-medium transition-colors cursor-pointer ${
                          flipH
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50'
                        }`}
                        title="Flip Horizontal"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                        <span className="text-[10px]">Flip H</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFlipV(!flipV)}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 font-medium transition-colors cursor-pointer ${
                          flipV
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50'
                        }`}
                        title="Flip Vertical"
                      >
                        <FlipVertical className="w-4 h-4" />
                        <span className="text-[10px]">Flip V</span>
                      </button>
                    </div>
                  </div>

                  {/* Exact Coordinates Inputs */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Crop Box Coordinates (px)
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">X Position</span>
                        <input
                          type="number"
                          value={cropRect.x}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setCropRect(prev => ({ ...prev, x: Math.min(stageDimensions.width - prev.width, val) }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Y Position</span>
                        <input
                          type="number"
                          value={cropRect.y}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setCropRect(prev => ({ ...prev, y: Math.min(stageDimensions.height - prev.height, val) }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Width</span>
                        <input
                          type="number"
                          value={cropRect.width}
                          onChange={(e) => {
                            const val = Math.max(20, parseInt(e.target.value, 10) || 20);
                            setCropRect(prev => ({ ...prev, width: Math.min(stageDimensions.width - prev.x, val) }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Height</span>
                        <input
                          type="number"
                          value={cropRect.height}
                          onChange={(e) => {
                            const val = Math.max(20, parseInt(e.target.value, 10) || 20);
                            setCropRect(prev => ({ ...prev, height: Math.min(stageDimensions.height - prev.y, val) }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Output Format */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Crop Export Format
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'image/png', label: 'PNG' },
                        { id: 'image/webp', label: 'WebP' },
                        { id: 'image/jpeg', label: 'JPEG' },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setCropFormat(f.id)}
                          className={`py-1.5 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                            cropFormat === f.id
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {cropFormat !== 'image/png' && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>Quality: {cropQuality}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={cropQuality}
                          onChange={(e) => setCropQuality(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DIMENSION PRESETS DIRECTORY */}
          {/* ========================================================================= */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Standard Resolution & Social Media Directory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click any standard platform size to instantly load into the Resizer or Cropper.
                </p>
              </div>

              {/* Social Media Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>Social Media Platforms</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {DIMENSION_PRESETS.filter(p => p.category === 'social').map(p => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {p.label}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {p.ratio}
                          </span>
                        </div>
                        <span className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400 block mt-1">
                          {p.width} &times; {p.height} px
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            applyDimensionPreset(p);
                            setActiveTab('resizer');
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer text-center"
                        >
                          Use in Resizer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Find closest ratio or set freeform crop to preset width/height
                            const stageW = stageDimensions.width;
                            const stageH = stageDimensions.height;
                            const r = p.width / p.height;
                            let cropW = Math.min(stageW, Math.round(stageH * r));
                            let cropH = Math.round(cropW / r);
                            if (cropH > stageH) {
                              cropH = stageH;
                              cropW = Math.round(cropH * r);
                            }
                            const cropX = Math.round((stageW - cropW) / 2);
                            const cropY = Math.round((stageH - cropH) / 2);
                            setCropRect({ x: cropX, y: cropY, width: cropW, height: cropH });
                            const foundRatio = ASPECT_RATIO_PRESETS.find(a => a.id === p.ratio);
                            setSelectedRatio(foundRatio ? foundRatio.id : 'free');
                            setActiveTab('cropper');
                          }}
                          className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Crop Ratio
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Web & Display Section */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Monitor className="w-4 h-4 text-emerald-500" />
                  <span>Display & Web Resolutions</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {DIMENSION_PRESETS.filter(p => p.category === 'web').map(p => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {p.label}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {p.ratio}
                          </span>
                        </div>
                        <span className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">
                          {p.width} &times; {p.height} px
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            applyDimensionPreset(p);
                            setActiveTab('resizer');
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer text-center"
                        >
                          Use in Resizer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
