import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker for Vite browser bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const STORAGE_WATERMARK_HISTORY_KEY = 'dreamkit_pdf_watermark_history';

/**
 * Safely clone an ArrayBuffer or Uint8Array so it is never detached by PDF.js workers
 */
export function cloneBuffer(input) {
  if (!input) return new ArrayBuffer(0);
  if (input instanceof Uint8Array) {
    const copy = new Uint8Array(input.length);
    copy.set(input);
    return copy.buffer;
  }
  if (input instanceof ArrayBuffer) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(new Uint8Array(input));
    return copy.buffer;
  }
  return new ArrayBuffer(0);
}

/**
 * Safely create a Uint8Array copy that can be transferred without affecting source data
 */
export function toTransferableUint8Array(input) {
  if (!input) return new Uint8Array(0);
  if (input instanceof Uint8Array) {
    const copy = new Uint8Array(input.length);
    copy.set(input);
    return copy;
  }
  if (input instanceof ArrayBuffer) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(new Uint8Array(input));
    return copy;
  }
  return new Uint8Array(0);
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Convert Hex Color (#RRGGBB or #RGB) to PDF-lib rgb(0-1, 0-1, 0-1)
 */
export function hexToPdfRgb(hex = '#dc2626') {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) {
    return rgb(0.86, 0.15, 0.15); // Fallback red
  }
  const num = parseInt(clean, 16);
  return rgb(
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255
  );
}

/**
 * Standard Fonts Map
 */
export const STANDARD_FONTS_MAP = {
  'Helvetica': StandardFonts.Helvetica,
  'Helvetica-Bold': StandardFonts.HelveticaBold,
  'Helvetica-Oblique': StandardFonts.HelveticaOblique,
  'Times-Roman': StandardFonts.TimesRoman,
  'Times-Bold': StandardFonts.TimesRomanBold,
  'Courier': StandardFonts.Courier,
  'Courier-Bold': StandardFonts.CourierBold
};

/**
 * Quick Text Presets
 */
export const TEXT_WATERMARK_PRESETS = [
  { id: 'confidential', label: 'CONFIDENTIAL', text: 'CONFIDENTIAL', color: '#dc2626', opacity: 28, angle: 45, size: 54 },
  { id: 'draft', label: 'DRAFT', text: 'DRAFT', color: '#64748b', opacity: 32, angle: 45, size: 64 },
  { id: 'sample', label: 'SAMPLE', text: 'SAMPLE', color: '#4f46e5', opacity: 30, angle: 45, size: 60 },
  { id: 'do_not_copy', label: 'DO NOT COPY', text: 'DO NOT COPY', color: '#b91c1c', opacity: 32, angle: 45, size: 50 },
  { id: 'approved', label: 'APPROVED', text: 'APPROVED', color: '#16a34a', opacity: 35, angle: 0, size: 48 },
  { id: 'top_secret', label: 'TOP SECRET', text: 'TOP SECRET', color: '#991b1b', opacity: 35, angle: 45, size: 52 },
  { id: 'for_review', label: 'FOR REVIEW ONLY', text: 'FOR REVIEW ONLY', color: '#d97706', opacity: 30, angle: 45, size: 42 },
  { id: 'copyright', label: 'COPYRIGHT © 2026', text: 'COPYRIGHT © 2026 DREAMKIT', color: '#475569', opacity: 35, angle: 0, size: 28 }
];

/**
 * 9-Point Grid Positions
 */
export const GRID_POSITIONS = [
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

/**
 * Color Swatches for Quick Selection
 */
export const COLOR_SWATCHES = [
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Dark Burgundy', hex: '#991b1b' },
  { name: 'Indigo Blue', hex: '#4f46e5' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Emerald Green', hex: '#16a34a' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Slate Gray', hex: '#64748b' },
  { name: 'Charcoal Black', hex: '#1e293b' }
];

/**
 * Generate Sample Badge Stamps (Canvas rendered to PNG data URL)
 */
export function generateSampleStampDataUrl(type = 'approved') {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 400, 400);

  if (type === 'approved') {
    // Green circular seal with double rings and stars
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(200, 200, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(200, 200, 160, 0, Math.PI * 2);
    ctx.stroke();

    // Top Arc Text
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ OFFICIAL DOCUMENT ★', 200, 95);

    // Center Ribbon Banner
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(30, 160, 340, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Impact, "Arial Black", sans-serif';
    ctx.fillText('APPROVED', 200, 205);

    // Bottom Date
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('VERIFIED & VALIDATED', 200, 305);
  } else if (type === 'confidential') {
    // Red rectangular stamp
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 110, 340, 180);

    ctx.lineWidth = 4;
    ctx.strokeRect(45, 125, 310, 150);

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 44px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CONFIDENTIAL', 200, 185);

    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('DO NOT DISCLOSE', 200, 235);
  } else if (type === 'verified') {
    // Blue badge seal
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(200, 200, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(200, 200, 165, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', 200, 140);

    ctx.font = 'bold 36px Impact, "Arial Black", sans-serif';
    ctx.fillText('VERIFIED', 200, 215);

    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('AUTHENTIC RECORD', 200, 260);
  } else {
    // Draft Stamp
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(200, 200, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 52px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PREVIEW', 200, 175);

    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('NOT FINAL VERSION', 200, 235);
  }

  const url = canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return url;
}

/**
 * Parse page targeting rules into array of 0-based page indices
 */
export function getTargetPageIndices(rule = 'all', totalPages = 1, customRange = '') {
  if (totalPages <= 0) return [];

  switch (rule) {
    case 'first':
      return [0];
    case 'last':
      return [totalPages - 1];
    case 'odd':
      return Array.from({ length: totalPages }, (_, i) => i).filter(i => (i + 1) % 2 !== 0);
    case 'even':
      return Array.from({ length: totalPages }, (_, i) => i).filter(i => (i + 1) % 2 === 0);
    case 'custom': {
      if (!customRange || !customRange.trim()) {
        return Array.from({ length: totalPages }, (_, i) => i);
      }
      const set = new Set();
      const parts = customRange.split(/[,;]/);
      for (const part of parts) {
        const clean = part.trim();
        if (!clean) continue;
        if (clean.includes('-')) {
          const [s, e] = clean.split('-');
          const start = parseInt(s.trim(), 10);
          const end = parseInt(e.trim(), 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.max(1, Math.min(start, end));
            const max = Math.min(totalPages, Math.max(start, end));
            for (let p = min; p <= max; p++) set.add(p - 1);
          }
        } else {
          const num = parseInt(clean, 10);
          if (!isNaN(num) && num >= 1 && num <= totalPages) {
            set.add(num - 1);
          }
        }
      }
      return Array.from(set).sort((a, b) => a - b);
    }
    case 'all':
    default:
      return Array.from({ length: totalPages }, (_, i) => i);
  }
}

/**
 * Calculate (cx, cy) anchor point on a PDF page coordinate system
 * Note: In PDF coordinate system, (0, 0) is at Bottom-Left!
 */
export function calculatePdfAnchor(position, pageWidth, pageHeight, itemWidth, itemHeight, margin = 36) {
  const halfW = itemWidth / 2;
  const halfH = itemHeight / 2;

  switch (position) {
    case 'nw': // Top-Left
      return { cx: margin + halfW, cy: pageHeight - margin - halfH };
    case 'n': // Top-Center
      return { cx: pageWidth / 2, cy: pageHeight - margin - halfH };
    case 'ne': // Top-Right
      return { cx: pageWidth - margin - halfW, cy: pageHeight - margin - halfH };
    case 'w': // Center-Left
      return { cx: margin + halfW, cy: pageHeight / 2 };
    case 'c': // Center
      return { cx: pageWidth / 2, cy: pageHeight / 2 };
    case 'e': // Center-Right
      return { cx: pageWidth - margin - halfW, cy: pageHeight / 2 };
    case 'sw': // Bottom-Left
      return { cx: margin + halfW, cy: margin + halfH };
    case 's': // Bottom-Center
      return { cx: pageWidth / 2, cy: margin + halfH };
    case 'se': // Bottom-Right
    default:
      return { cx: pageWidth - margin - halfW, cy: margin + halfH };
  }
}

/**
 * Convert any image data (URL, File, Blob, ImageElement) to PNG Uint8Array for PDF embedding
 */
export async function convertImageToPngBytes(imageSource) {
  if (!imageSource) return null;

  // If already Uint8Array or ArrayBuffer, check if PNG/JPG
  if (imageSource instanceof Uint8Array || imageSource instanceof ArrayBuffer) {
    return new Uint8Array(imageSource);
  }

  // Load into HTMLImageElement
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 400;
      canvas.height = img.naturalHeight || img.height || 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    };

    img.onerror = () => {
      reject(new Error('Failed to decode image watermark'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      reject(new Error('Unsupported image source'));
    }
  });
}

/**
 * Load PDF file information and get page count and first page dimensions
 */
export async function getPdfInfo(rawBuffer, filename = 'document.pdf') {
  const safeBuffer = cloneBuffer(rawBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const firstPage = pageCount > 0 ? pdfDoc.getPage(0) : null;
  const { width, height } = firstPage ? firstPage.getSize() : { width: 595, height: 842 };

  return {
    name: filename,
    size: safeBuffer.byteLength,
    formattedSize: formatBytes(safeBuffer.byteLength),
    pageCount,
    pageWidth: Math.round(width),
    pageHeight: Math.round(height),
    buffer: safeBuffer
  };
}

/**
 * Render a single page thumbnail with live watermark overlay on Canvas
 */
export async function renderWatermarkPreviewCanvas({
  pdfBuffer,
  pageNum = 1,
  scale = 0.5,
  watermarkConfig
}) {
  if (typeof document === 'undefined') return null;

  try {
    const safeBuffer = cloneBuffer(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({
      data: toTransferableUint8Array(safeBuffer)
    });
    const pdf = await loadingTask.promise;
    if (pageNum < 1 || pageNum > pdf.numPages) return null;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;

    // 1. Draw base white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Render PDF content
    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    // Check if this page should have watermark applied
    const targetIndices = getTargetPageIndices(
      watermarkConfig.pagesMode || 'all',
      pdf.numPages,
      watermarkConfig.customRange || ''
    );

    if (!targetIndices.includes(pageNum - 1)) {
      // Return rendered page as is (no watermark on this page)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      canvas.width = 0;
      canvas.height = 0;
      return dataUrl;
    }

    // 3. Render Watermark on Canvas
    const {
      type = 'text', // 'text' | 'image'
      text = 'CONFIDENTIAL',
      fontSize = 48,
      fontFamily = 'Helvetica-Bold',
      color = '#dc2626',
      opacity = 30, // 0 - 100
      angle = 45, // -90 to 90
      layoutMode = 'position', // 'position' | 'tile'
      gridPosition = 'c', // 'nw' ... 'se'
      margin = 36,
      offsetX = 0,
      offsetY = 0,
      imageSource = null,
      imageScale = 30, // % of width
      tileSpacingX = 120,
      tileSpacingY = 120
    } = watermarkConfig;

    const normOpacity = Math.max(0.02, Math.min(1, opacity / 100));
    ctx.save();
    ctx.globalAlpha = normOpacity;

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const pointScale = scale; // viewport scale relative to 72 DPI PDF points

    if (type === 'text') {
      const scaledFontSize = Math.max(8, fontSize * pointScale);
      const isBold = fontFamily.includes('Bold');
      const isItalic = fontFamily.includes('Oblique');
      const fontName = fontFamily.includes('Courier')
        ? 'Courier, monospace'
        : fontFamily.includes('Times')
        ? 'Georgia, serif'
        : 'system-ui, -apple-system, sans-serif';

      ctx.font = `${isBold ? 'bold ' : ''}${isItalic ? 'italic ' : ''}${scaledFontSize}px ${fontName}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const textH = scaledFontSize;

      if (layoutMode === 'tile') {
        // Repeated Grid Tiling across entire canvas
        const stepX = Math.max(100, (textW + tileSpacingX) * pointScale);
        const stepY = Math.max(80, (textH + tileSpacingY) * pointScale);
        const rad = (-angle * Math.PI) / 180; // In Canvas, clockwise is positive

        for (let y = -canvasH * 0.3; y < canvasH * 1.4; y += stepY) {
          const rowIdx = Math.floor(y / stepY);
          const xOffset = (rowIdx % 2) * (stepX / 2);
          for (let x = -canvasW * 0.3; x < canvasW * 1.4; x += stepX) {
            ctx.save();
            ctx.translate(x + xOffset, y);
            ctx.rotate(rad);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      } else {
        // Single 9-point grid placement
        const scaledMargin = margin * pointScale;
        const scaledOffsetX = offsetX * pointScale;
        const scaledOffsetY = -offsetY * pointScale; // inverted for canvas top-left

        // Calculate anchor in canvas coordinates (top-left is 0,0)
        let cx = canvasW / 2;
        let cy = canvasH / 2;

        if (gridPosition.includes('w')) cx = scaledMargin + textW / 2;
        else if (gridPosition.includes('e')) cx = canvasW - scaledMargin - textW / 2;

        if (gridPosition.startsWith('n')) cy = scaledMargin + textH / 2;
        else if (gridPosition.startsWith('s')) cy = canvasH - scaledMargin - textH / 2;

        cx += scaledOffsetX;
        cy += scaledOffsetY;

        ctx.translate(cx, cy);
        ctx.rotate((-angle * Math.PI) / 180);
        ctx.fillText(text, 0, 0);
      }
    } else if (type === 'image' && imageSource) {
      // Draw image watermark
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
      });

      if (img.width && img.height) {
        const targetW = canvasW * (imageScale / 100);
        const targetH = targetW * (img.height / img.width);

        if (layoutMode === 'tile') {
          const stepX = targetW + tileSpacingX * pointScale;
          const stepY = targetH + tileSpacingY * pointScale;
          const rad = (-angle * Math.PI) / 180;

          for (let y = -canvasH * 0.2; y < canvasH * 1.3; y += stepY) {
            const rowIdx = Math.floor(y / stepY);
            const xOffset = (rowIdx % 2) * (stepX / 2);
            for (let x = -canvasW * 0.2; x < canvasW * 1.3; x += stepX) {
              ctx.save();
              ctx.translate(x + xOffset, y);
              ctx.rotate(rad);
              ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
              ctx.restore();
            }
          }
        } else {
          const scaledMargin = margin * pointScale;
          const scaledOffsetX = offsetX * pointScale;
          const scaledOffsetY = -offsetY * pointScale;

          let cx = canvasW / 2;
          let cy = canvasH / 2;

          if (gridPosition.includes('w')) cx = scaledMargin + targetW / 2;
          else if (gridPosition.includes('e')) cx = canvasW - scaledMargin - targetW / 2;

          if (gridPosition.startsWith('n')) cy = scaledMargin + targetH / 2;
          else if (gridPosition.startsWith('s')) cy = canvasH - scaledMargin - targetH / 2;

          cx += scaledOffsetX;
          cy += scaledOffsetY;

          ctx.translate(cx, cy);
          ctx.rotate((-angle * Math.PI) / 180);
          ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
        }
      }
    }

    ctx.restore();

    const resultDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    canvas.width = 0;
    canvas.height = 0;
    return resultDataUrl;
  } catch {
    return null;
  }
}

/**
 * Apply Watermark to PDF Document using PDF-Lib (100% Client-Side)
 */
export async function applyWatermarkToPdf(rawBuffer, config, onProgress = null) {
  const safeBuffer = cloneBuffer(rawBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The loaded PDF document contains zero pages.');
  }

  const {
    type = 'text', // 'text' | 'image'
    text = 'CONFIDENTIAL',
    fontSize = 48,
    fontFamily = 'Helvetica-Bold',
    color = '#dc2626',
    opacity = 30, // 0 - 100
    angle = 45, // -90 to 90
    layoutMode = 'position', // 'position' | 'tile'
    gridPosition = 'c', // 'nw' ... 'se'
    margin = 36,
    offsetX = 0,
    offsetY = 0,
    imageSource = null,
    imageScale = 30, // % of page width
    tileSpacingX = 140,
    tileSpacingY = 140,
    pagesMode = 'all',
    customRange = '',
    _layer = 'foreground' // 'foreground' | 'background'
  } = config;

  const targetIndices = getTargetPageIndices(pagesMode, totalPages, customRange);
  if (targetIndices.length === 0) {
    throw new Error('No pages selected matching the specified page range.');
  }

  // Pre-load font or image
  let embeddedFont = null;
  let embeddedImage = null;

  if (type === 'text') {
    const fontName = STANDARD_FONTS_MAP[fontFamily] || StandardFonts.HelveticaBold;
    embeddedFont = await pdfDoc.embedFont(fontName);
  } else if (type === 'image' && imageSource) {
    const imgBytes = await convertImageToPngBytes(imageSource);
    if (!imgBytes) {
      throw new Error('Failed to load or parse image watermark.');
    }
    // Try PNG first, fallback to JPG
    try {
      embeddedImage = await pdfDoc.embedPng(imgBytes);
    } catch {
      embeddedImage = await pdfDoc.embedJpg(imgBytes);
    }
  }

  const pdfColor = hexToPdfRgb(color);
  const normOpacity = Math.max(0.02, Math.min(1, opacity / 100));
  const rotAngle = degrees(angle);
  const rad = (angle * Math.PI) / 180;

  // Process target pages with progress
  for (let i = 0; i < targetIndices.length; i++) {
    const pageIndex = targetIndices[i];
    const page = pdfDoc.getPage(pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    if (onProgress) {
      const percent = Math.round(((i + 1) / targetIndices.length) * 100);
      onProgress({
        current: i + 1,
        total: targetIndices.length,
        percent,
        stage: `Watermarking page ${pageIndex + 1} of ${totalPages}...`
      });
    }

    if (type === 'text' && embeddedFont) {
      const textW = embeddedFont.widthOfTextAtSize(text, fontSize);
      const textH = embeddedFont.heightAtSize(fontSize);

      if (layoutMode === 'tile') {
        const stepX = Math.max(80, textW + tileSpacingX);
        const stepY = Math.max(60, textH + tileSpacingY);

        for (let y = -pageHeight * 0.3; y < pageHeight * 1.4; y += stepY) {
          const rowIdx = Math.floor(y / stepY);
          const xOffset = (rowIdx % 2) * (stepX / 2);
          for (let x = -pageWidth * 0.3; x < pageWidth * 1.4; x += stepX) {
            const cx = x + xOffset;
            const cy = y;

            // Calculate anchor (x,y) from center (cx,cy) with rotation
            const dx = (textW / 2) * Math.cos(rad) - (textH / 2) * Math.sin(rad);
            const dy = (textW / 2) * Math.sin(rad) + (textH / 2) * Math.cos(rad);

            page.drawText(text, {
              x: cx - dx,
              y: cy - dy,
              size: fontSize,
              font: embeddedFont,
              color: pdfColor,
              opacity: normOpacity,
              rotate: rotAngle
            });
          }
        }
      } else {
        // Single anchor placement
        const anchor = calculatePdfAnchor(gridPosition, pageWidth, pageHeight, textW, textH, margin);
        const cx = anchor.cx + offsetX;
        const cy = anchor.cy + offsetY;

        const dx = (textW / 2) * Math.cos(rad) - (textH / 2) * Math.sin(rad);
        const dy = (textW / 2) * Math.sin(rad) + (textH / 2) * Math.cos(rad);

        page.drawText(text, {
          x: cx - dx,
          y: cy - dy,
          size: fontSize,
          font: embeddedFont,
          color: pdfColor,
          opacity: normOpacity,
          rotate: rotAngle
        });
      }
    } else if (type === 'image' && embeddedImage) {
      const targetW = pageWidth * (imageScale / 100);
      const targetH = targetW * (embeddedImage.height / embeddedImage.width);

      if (layoutMode === 'tile') {
        const stepX = targetW + tileSpacingX;
        const stepY = targetH + tileSpacingY;

        for (let y = -pageHeight * 0.2; y < pageHeight * 1.3; y += stepY) {
          const rowIdx = Math.floor(y / stepY);
          const xOffset = (rowIdx % 2) * (stepX / 2);
          for (let x = -pageWidth * 0.2; x < pageWidth * 1.3; x += stepX) {
            const cx = x + xOffset;
            const cy = y;

            const dx = (targetW / 2) * Math.cos(rad) - (targetH / 2) * Math.sin(rad);
            const dy = (targetW / 2) * Math.sin(rad) + (targetH / 2) * Math.cos(rad);

            page.drawImage(embeddedImage, {
              x: cx - dx,
              y: cy - dy,
              width: targetW,
              height: targetH,
              opacity: normOpacity,
              rotate: rotAngle
            });
          }
        }
      } else {
        const anchor = calculatePdfAnchor(gridPosition, pageWidth, pageHeight, targetW, targetH, margin);
        const cx = anchor.cx + offsetX;
        const cy = anchor.cy + offsetY;

        const dx = (targetW / 2) * Math.cos(rad) - (targetH / 2) * Math.sin(rad);
        const dy = (targetW / 2) * Math.sin(rad) + (targetH / 2) * Math.cos(rad);

        page.drawImage(embeddedImage, {
          x: cx - dx,
          y: cy - dy,
          width: targetW,
          height: targetH,
          opacity: normOpacity,
          rotate: rotAngle
        });
      }
    }
  }

  const watermarkedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    pdfBytes: watermarkedPdfBytes,
    size: watermarkedPdfBytes.byteLength,
    formattedSize: formatBytes(watermarkedPdfBytes.byteLength),
    originalSize: safeBuffer.byteLength,
    formattedOriginalSize: formatBytes(safeBuffer.byteLength),
    pageCount: totalPages,
    watermarkedPagesCount: targetIndices.length,
    watermarkedPages: targetIndices.map(i => i + 1)
  };
}

/**
 * Generate a 3-page Sample Business Document for instant 1-click testing
 */
export async function generateSampleWatermarkPdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // --- Page 1: Executive Proposal Cover ---
  const p1 = pdfDoc.addPage([595, 842]); // A4
  // Dark header bar
  p1.drawRectangle({
    x: 0,
    y: 730,
    width: 595,
    height: 112,
    color: rgb(0.08, 0.12, 0.22)
  });
  p1.drawText('CONFIDENTIAL STRATEGY PROPOSAL', { x: 45, y: 795, size: 20, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Client Engagement & Architectural Plan 2026', { x: 45, y: 765, size: 12, font, color: rgb(0.65, 0.75, 0.95) });

  p1.drawText('1. Executive Overview', { x: 45, y: 690, size: 14, font: bold, color: rgb(0.12, 0.16, 0.28) });
  p1.drawText(
    'This document outlines the security architecture and performance benchmarks for next-generation\n' +
    'document processing. All computational steps execute strictly within the user\'s client runtime,\n' +
    'ensuring complete data confidentiality, GDPR compliance, and zero external exfiltration risks.',
    { x: 45, y: 660, size: 10, font, lineHeight: 16, color: rgb(0.25, 0.28, 0.35) }
  );

  p1.drawText('2. Key Project Milestones', { x: 45, y: 580, size: 14, font: bold, color: rgb(0.12, 0.16, 0.28) });
  const milestones = [
    '• Phase 1: In-browser Vector PDF Engine Integration (Q1 2026)',
    '• Phase 2: Client-side PKZip Archive Packaging & Decompression (Q2 2026)',
    '• Phase 3: High-DPI Canvas Rendering and Real-time Watermark Inspection (Q3 2026)',
    '• Phase 4: Full Multi-page Production Deployment (Q4 2026)'
  ];
  milestones.forEach((m, idx) => {
    p1.drawText(m, { x: 55, y: 550 - idx * 24, size: 10, font, color: rgb(0.2, 0.25, 0.35) });
  });

  // Table Preview
  p1.drawRectangle({ x: 45, y: 340, width: 505, height: 85, color: rgb(0.96, 0.97, 0.99) });
  p1.drawRectangle({ x: 45, y: 395, width: 505, height: 30, color: rgb(0.15, 0.23, 0.38) });
  p1.drawText('Module Name', { x: 55, y: 407, size: 10, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Execution Model', { x: 230, y: 407, size: 10, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Status', { x: 440, y: 407, size: 10, font: bold, color: rgb(1, 1, 1) });

  p1.drawText('PDF Watermark Studio', { x: 55, y: 375, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
  p1.drawText('100% Client-Side Local Memory', { x: 230, y: 375, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
  p1.drawText('ACTIVE', { x: 440, y: 375, size: 9.5, font: bold, color: rgb(0.08, 0.55, 0.25) });

  p1.drawText('Page 1 of 3 — Proprietary & Confidential', { x: 45, y: 40, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

  // --- Page 2: Financial Terms & Agreement ---
  const p2 = pdfDoc.addPage([595, 842]);
  p2.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.12, 0.16, 0.28) });
  p2.drawText('FINANCIAL TERMS & SLA COMMITMENT', { x: 45, y: 800, size: 18, font: bold, color: rgb(1, 1, 1) });

  p2.drawText('3. Resource Allocation & Investment Schedule', { x: 45, y: 720, size: 14, font: bold, color: rgb(0.12, 0.16, 0.28) });
  p2.drawText(
    'The following schedule details the planned resource distribution for document security pipelines.\n' +
    'All figures are fixed-price and guaranteed against scope changes during the 2026 fiscal cycle.',
    { x: 45, y: 690, size: 10, font, lineHeight: 16, color: rgb(0.25, 0.28, 0.35) }
  );

  const budgetItems = [
    { desc: 'Local WebAssembly PDF Parser & Compaction Core', fee: '$24,500' },
    { desc: 'High-Resolution 300 DPI Canvas Rendering Pipelines', fee: '$18,200' },
    { desc: 'OpenXML DOCX & XLSX Universal Decompression', fee: '$19,800' },
    { desc: 'Automated Real-time Watermark Engine & Stamping', fee: '$15,500' }
  ];
  budgetItems.forEach((b, idx) => {
    p2.drawRectangle({ x: 45, y: 620 - idx * 36, width: 505, height: 28, color: idx % 2 === 0 ? rgb(0.96, 0.97, 0.99) : rgb(1, 1, 1) });
    p2.drawText(b.desc, { x: 55, y: 630 - idx * 36, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
    p2.drawText(b.fee, { x: 470, y: 630 - idx * 36, size: 9.5, font: bold, color: rgb(0.1, 0.2, 0.4) });
  });

  p2.drawText('Page 2 of 3 — Proprietary & Confidential', { x: 45, y: 40, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

  // --- Page 3: Signatures & Certification ---
  const p3 = pdfDoc.addPage([595, 842]);
  p3.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.15, 0.23, 0.38) });
  p3.drawText('SIGNATURES & COMPLIANCE CERTIFICATION', { x: 45, y: 800, size: 18, font: bold, color: rgb(1, 1, 1) });

  p3.drawText('4. Certification of Authenticity', { x: 45, y: 720, size: 14, font: bold, color: rgb(0.12, 0.16, 0.28) });
  p3.drawText(
    'By affixing digital or mechanical signatures below, both parties confirm that all terms,\n' +
    'specifications, and data processing guidelines outlined in this agreement are accepted in full.\n' +
    'Unauthorized reproduction or redistribution of this document is strictly prohibited.',
    { x: 45, y: 690, size: 10, font, lineHeight: 16, color: rgb(0.25, 0.28, 0.35) }
  );

  // Signature boxes
  p3.drawRectangle({ x: 55, y: 520, width: 220, height: 100, color: rgb(0.97, 0.98, 1) });
  p3.drawLine({ start: { x: 70, y: 560 }, end: { x: 250, y: 560 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  p3.drawText('Authorized Executive Signatory', { x: 70, y: 540, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) });

  p3.drawRectangle({ x: 320, y: 520, width: 220, height: 100, color: rgb(0.97, 0.98, 1) });
  p3.drawLine({ start: { x: 335, y: 560 }, end: { x: 515, y: 560 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  p3.drawText('Chief Technology Officer / Auditor', { x: 335, y: 540, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) });

  p3.drawText('Page 3 of 3 — Proprietary & Confidential', { x: 45, y: 40, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    name: 'Sample_Strategy_Proposal.pdf',
    size: pdfBytes.byteLength,
    formattedSize: formatBytes(pdfBytes.byteLength),
    pageCount: 3,
    buffer: pdfBytes.buffer
  };
}

/**
 * Watermark History Storage Handlers
 */
export function getWatermarkHistory() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_WATERMARK_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatermarkHistory(item) {
  if (typeof localStorage === 'undefined' || !item) return;
  try {
    const history = getWatermarkHistory();
    const updated = [
      {
        id: `wm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...item
      },
      ...history
    ].slice(0, 15);
    localStorage.setItem(STORAGE_WATERMARK_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearWatermarkHistory() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_WATERMARK_HISTORY_KEY);
  } catch {
    // Ignore
  }
}
