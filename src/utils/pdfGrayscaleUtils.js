import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker for Vite browser bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const STORAGE_GRAYSCALE_HISTORY_KEY = 'dreamkit_pdf_grayscale_history';

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
 * Format bytes into human-readable string
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
 * Grayscale Conversion Algorithms for Documents & PDFs
 */
export const GRAYSCALE_MODES = [
  {
    id: 'rec709',
    name: 'ITU-R BT.709 (Standard Luminance)',
    description: 'Human eye weighted (0.2126 R + 0.7152 G + 0.0722 B). Natural, balanced tones for documents and graphics.',
    tag: 'Recommended'
  },
  {
    id: 'high_contrast',
    name: 'High-Contrast Document B&W',
    description: 'Enhances text density and brightens grayish paper backgrounds. Perfect for scanned documents, receipts, and faxes.',
    tag: 'Clear Text'
  },
  {
    id: 'ink_saver',
    name: 'Eco Print / Toner Saver',
    description: 'Lightens heavy color blocks, dark backgrounds, and headers to save 30%–50% printer ink while preserving crisp text.',
    tag: 'Save Ink'
  },
  {
    id: 'bt601',
    name: 'ITU-R BT.601 (Classic NTSC)',
    description: 'Traditional television formula (0.299 R + 0.587 G + 0.114 B). Warm, archival tonal distribution.',
    tag: 'Classic'
  },
  {
    id: 'threshold',
    name: 'Pure 1-Bit Monochrome (Binary)',
    description: 'Strict cutoff into pure black (0) and pure white (255). Ideal for line art, forms, and official legal filings.',
    tag: 'Monochrome'
  },
  {
    id: 'sepia',
    name: 'Warm Archival Sepia',
    description: 'Tones grayscale images with a warm vintage parchment amber hue for historical contracts and certificates.',
    tag: 'Archival'
  }
];

/**
 * DPI Presets for PDF Rasterization
 */
export const DPI_PRESETS = [
  { id: 72, label: '72 DPI (Draft / Web)', scale: 1.0, desc: 'Smallest file size, fast sharing' },
  { id: 150, label: '150 DPI (Standard)', scale: 150 / 72, desc: 'Balanced sharpness & speed (Recommended)' },
  { id: 300, label: '300 DPI (Print-Ready)', scale: 300 / 72, desc: 'Razor-sharp for physical printing' }
];

/**
 * Inspect PDF document metadata, page count, and dimensions
 */
export async function getPdfGrayscaleInfo(rawBuffer, filename = 'document.pdf') {
  const safeBuffer = cloneBuffer(rawBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data: toTransferableUint8Array(safeBuffer)
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  const pagesInfo = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    pagesInfo.push({
      pageNumber: i,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height)
    });
  }

  return {
    name: filename,
    size: safeBuffer.byteLength,
    formattedSize: formatBytes(safeBuffer.byteLength),
    pageCount,
    pages: pagesInfo,
    firstPageWidth: pagesInfo[0]?.width || 595,
    firstPageHeight: pagesInfo[0]?.height || 842,
    buffer: safeBuffer
  };
}

/**
 * Apply Grayscale transformation to an HTML Canvas
 */
export function applyGrayscaleFilterToCanvas(canvas, options = {}) {
  if (typeof document === 'undefined') return canvas;

  const {
    mode = 'rec709',
    contrast = 0, // -50 to +50
    brightness = 0, // -50 to +50
    thresholdCutoff = 160
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Calculate contrast multiplier
  // contrast factor formula: factor = (259 * (C + 255)) / (255 * (259 - C))
  const C = Math.max(-100, Math.min(100, contrast * 2));
  const contrastFactor = (259 * (C + 255)) / (255 * (259 - C));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let gray = 0;

    switch (mode) {
      case 'rec709':
        gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        break;
      case 'bt601':
        gray = 0.299 * r + 0.587 * g + 0.114 * b;
        break;
      case 'high_contrast': {
        // High-contrast document enhancement
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 210) {
          gray = 255; // White background
        } else if (lum < 110) {
          gray = Math.max(0, lum * 0.7); // Darken text
        } else {
          gray = (lum - 110) * (255 / 100);
        }
        break;
      }
      case 'ink_saver': {
        // Eco Print: lightens dark fills while preserving dark text lines
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (lum < 80) {
          gray = lum; // Keep dark black text sharp
        } else if (lum >= 80 && lum < 220) {
          gray = Math.min(255, lum + (255 - lum) * 0.45); // Lighten colored boxes & charts
        } else {
          gray = 255;
        }
        break;
      }
      case 'threshold': {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        gray = lum >= thresholdCutoff ? 255 : 0;
        break;
      }
      case 'sepia': {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        gray = lum;
        break;
      }
      default:
        gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    // Apply brightness
    if (brightness !== 0) {
      gray += brightness * 2.5;
    }

    // Apply contrast
    if (contrast !== 0 && mode !== 'threshold') {
      gray = contrastFactor * (gray - 128) + 128;
    }

    gray = Math.max(0, Math.min(255, gray));

    if (mode === 'sepia') {
      // Warm amber / parchment tone
      data[i] = Math.min(255, gray * 1.15); // R
      data[i + 1] = Math.min(255, gray * 0.95); // G
      data[i + 2] = Math.min(255, gray * 0.78); // B
    } else {
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Render a single page to a canvas and optionally apply grayscale
 */
export async function renderPdfPageToCanvas(rawBuffer, pageNum = 1, scale = 1.0, grayscaleOptions = null) {
  if (typeof document === 'undefined') return null;

  try {
    const safeBuffer = cloneBuffer(rawBuffer);
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

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    if (grayscaleOptions) {
      applyGrayscaleFilterToCanvas(canvas, grayscaleOptions);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const width = canvas.width;
    const height = canvas.height;
    canvas.width = 0;
    canvas.height = 0;

    return { dataUrl, width, height };
  } catch (err) {
    console.error('Failed to render page:', err);
    return null;
  }
}

/**
 * Convert Canvas to JPEG bytes
 */
export function canvasToJpegBytes(canvas, quality = 0.88) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob from canvas'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Parse page range string into 1-based array of page numbers
 */
export function parseTargetPages(rule = 'all', totalPages = 1, customRange = '') {
  if (totalPages <= 0) return [1];

  switch (rule) {
    case 'first':
      return [1];
    case 'last':
      return [totalPages];
    case 'custom': {
      if (!customRange || !customRange.trim()) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
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
            for (let p = min; p <= max; p++) set.add(p);
          }
        } else {
          const num = parseInt(clean, 10);
          if (!isNaN(num) && num >= 1 && num <= totalPages) {
            set.add(num);
          }
        }
      }
      const sorted = Array.from(set).sort((a, b) => a - b);
      return sorted.length > 0 ? sorted : [1];
    }
    case 'all':
    default:
      return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
}

/**
 * Convert Entire PDF to Grayscale and Reconstruct into a new PDF (100% Client-Side)
 *
 * @param {ArrayBuffer} rawBuffer - Source PDF buffer
 * @param {Object} options - { mode, contrast, brightness, dpi, jpegQuality, pageRange, customPages }
 * @param {Function} onProgress - Progress reporter callback
 */
export async function convertPdfToGrayscale(rawBuffer, options = {}, onProgress = null) {
  const safeBuffer = cloneBuffer(rawBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data: toTransferableUint8Array(safeBuffer)
  });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  if (totalPages === 0) {
    throw new Error('PDF document contains zero pages.');
  }

  const {
    mode = 'rec709',
    contrast = 0,
    brightness = 0,
    dpi = 150,
    jpegQuality = 88,
    pageRange = 'all',
    customPages = ''
  } = options;

  const targetPages = parseTargetPages(pageRange, totalPages, customPages);

  // Determine DPI scale
  const dpiPreset = DPI_PRESETS.find((p) => p.id === dpi) || DPI_PRESETS[1];
  const scale = dpiPreset.scale;
  const quality = Math.max(0.6, Math.min(1.0, jpegQuality / 100));

  const outputPdfDoc = await PDFDocument.create();

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];
    const page = await pdf.getPage(pageNum);
    const originalViewport = page.getViewport({ scale: 1.0 });
    const renderViewport = page.getViewport({ scale });

    if (onProgress) {
      const percent = Math.round(((idx + 1) / targetPages.length) * 100);
      onProgress({
        current: idx + 1,
        total: targetPages.length,
        percent,
        stage: `Converting Page ${pageNum} of ${totalPages} to grayscale (${dpi} DPI)...`
      });
    }

    // Render page to canvas at selected DPI
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(renderViewport.width);
    canvas.height = Math.round(renderViewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: renderViewport
    }).promise;

    // Apply Grayscale Filter
    applyGrayscaleFilterToCanvas(canvas, {
      mode,
      contrast,
      brightness
    });

    // Extract JPEG image bytes
    const jpegBytes = await canvasToJpegBytes(canvas, quality);
    canvas.width = 0;
    canvas.height = 0;

    // Embed Grayscale JPEG image into new PDF page
    const embeddedImg = await outputPdfDoc.embedJpg(jpegBytes);
    const newPage = outputPdfDoc.addPage([originalViewport.width, originalViewport.height]);

    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height
    });
  }

  const grayscalePdfBytes = await outputPdfDoc.save({ useObjectStreams: true });
  const compressionRatio = Math.round(
    ((safeBuffer.byteLength - grayscalePdfBytes.byteLength) / safeBuffer.byteLength) * 100
  );

  return {
    pdfBytes: grayscalePdfBytes,
    size: grayscalePdfBytes.byteLength,
    formattedSize: formatBytes(grayscalePdfBytes.byteLength),
    originalSize: safeBuffer.byteLength,
    formattedOriginalSize: formatBytes(safeBuffer.byteLength),
    compressionRatio: compressionRatio > 0 ? `${compressionRatio}% smaller` : 'Optimized',
    pageCount: totalPages,
    convertedPagesCount: targetPages.length,
    convertedPages: targetPages,
    dpi,
    mode
  };
}

/**
 * Generate a 3-page Vibrant Full-Color Sample Document for instant 1-click testing
 */
export async function generateSampleColorPdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // --- Page 1: Vibrant Hero Portfolio Cover ---
  const p1 = pdfDoc.addPage([595, 842]);
  // Rich indigo/violet header
  p1.drawRectangle({ x: 0, y: 710, width: 595, height: 132, color: { type: 'RGB', red: 0.29, green: 0.22, blue: 0.92 } });
  p1.drawText('ANNUAL DESIGN & MARKETING REPORT 2026', { x: 45, y: 795, size: 19, font: bold, color: { type: 'RGB', red: 1, green: 1, blue: 1 } });
  p1.drawText('Creative Portfolio, Brand Architecture & Campaign Metrics', { x: 45, y: 765, size: 11, font, color: { type: 'RGB', red: 0.82, green: 0.85, blue: 1 } });

  // Colorful Badges Strip
  const badges = [
    { label: 'Q1 BRANDING', color: { type: 'RGB', red: 0.92, green: 0.25, blue: 0.45 } },
    { label: 'Q2 PACKAGING', color: { type: 'RGB', red: 0.95, green: 0.55, blue: 0.12 } },
    { label: 'Q3 DIGITAL', color: { type: 'RGB', red: 0.08, green: 0.72, blue: 0.52 } },
    { label: 'Q4 CAMPAIGN', color: { type: 'RGB', red: 0.15, green: 0.55, blue: 0.95 } }
  ];
  badges.forEach((b, idx) => {
    p1.drawRectangle({ x: 45 + idx * 128, y: 725, width: 120, height: 22, color: b.color });
    p1.drawText(b.label, { x: 55 + idx * 128, y: 732, size: 9, font: bold, color: { type: 'RGB', red: 1, green: 1, blue: 1 } });
  });

  p1.drawText('1. Executive Vision & Creative Strategy', { x: 45, y: 660, size: 14, font: bold, color: { type: 'RGB', red: 0.12, green: 0.16, blue: 0.28 } });
  p1.drawText(
    'This portfolio showcases high-impact visual assets, product illustrations, and color palettes.\n' +
    'Notice how converting this document to grayscale optimizes it for physical black & white printers,\n' +
    'removes expensive color toner overhead, and produces publication-ready monochrome prints.',
    { x: 45, y: 630, size: 10, font, lineHeight: 16, color: { type: 'RGB', red: 0.25, green: 0.28, blue: 0.35 } }
  );

  // Color Grid Blocks
  const colorCards = [
    { title: 'Cobalt Blue Identity', color: { type: 'RGB', red: 0.12, green: 0.38, blue: 0.95 }, desc: 'Core brand primary' },
    { title: 'Sunset Crimson Gradient', color: { type: 'RGB', red: 0.92, green: 0.22, blue: 0.32 }, desc: 'Product highlights' },
    { title: 'Emerald Green Sustainability', color: { type: 'RGB', red: 0.08, green: 0.65, blue: 0.35 }, desc: 'Eco campaign badge' }
  ];
  colorCards.forEach((c, idx) => {
    p1.drawRectangle({ x: 45, y: 470 - idx * 60, width: 505, height: 48, color: { type: 'RGB', red: 0.96, green: 0.97, blue: 0.99 } });
    p1.drawRectangle({ x: 55, y: 478 - idx * 60, width: 32, height: 32, color: c.color });
    p1.drawText(c.title, { x: 100, y: 495 - idx * 60, size: 11, font: bold, color: { type: 'RGB', red: 0.1, green: 0.15, blue: 0.25 } });
    p1.drawText(c.desc, { x: 100, y: 482 - idx * 60, size: 9, font, color: { type: 'RGB', red: 0.4, green: 0.45, blue: 0.5 } });
  });

  p1.drawText('Page 1 of 3 — Full-Color High-Fidelity Creative Asset', { x: 45, y: 40, size: 8.5, font, color: { type: 'RGB', red: 0.5, green: 0.5, blue: 0.5 } });

  // --- Page 2: Multi-Color Analytics & Performance Charts ---
  const p2 = pdfDoc.addPage([595, 842]);
  p2.drawRectangle({ x: 0, y: 745, width: 595, height: 97, color: { type: 'RGB', red: 0.05, green: 0.45, blue: 0.75 } });
  p2.drawText('MULTI-CHANNEL REVENUE & REACH BENCHMARKS', { x: 45, y: 795, size: 17, font: bold, color: { type: 'RGB', red: 1, green: 1, blue: 1 } });
  p2.drawText('Audited Campaign Conversion Funnel & ROI Distribution', { x: 45, y: 768, size: 10.5, font, color: { type: 'RGB', red: 0.8, green: 0.92, blue: 1 } });

  p2.drawText('2. Campaign Revenue Breakdown by Category', { x: 45, y: 705, size: 13, font: bold, color: { type: 'RGB', red: 0.12, green: 0.16, blue: 0.28 } });

  // Colorful Bar Chart simulation
  const chartBars = [
    { label: 'Organic Search Traffic', val: '88%', w: 380, color: { type: 'RGB', red: 0.2, green: 0.45, blue: 0.95 } },
    { label: 'Social Video Campaigns', val: '74%', w: 320, color: { type: 'RGB', red: 0.92, green: 0.28, blue: 0.42 } },
    { label: 'Email Newsletter Reach', val: '62%', w: 270, color: { type: 'RGB', red: 0.95, green: 0.62, blue: 0.15 } },
    { label: 'Affiliate Partner Network', val: '51%', w: 220, color: { type: 'RGB', red: 0.12, green: 0.72, blue: 0.48 } }
  ];
  chartBars.forEach((bar, idx) => {
    const barY = 635 - idx * 45;
    p2.drawText(bar.label, { x: 45, y: barY + 14, size: 9.5, font: bold, color: { type: 'RGB', red: 0.2, green: 0.25, blue: 0.35 } });
    p2.drawRectangle({ x: 45, y: barY - 4, width: 420, height: 14, color: { type: 'RGB', red: 0.92, green: 0.94, blue: 0.96 } });
    p2.drawRectangle({ x: 45, y: barY - 4, width: bar.w, height: 14, color: bar.color });
    p2.drawText(bar.val, { x: 475, y: barY - 2, size: 10, font: bold, color: bar.color });
  });

  // Table
  p2.drawRectangle({ x: 45, y: 340, width: 505, height: 95, color: { type: 'RGB', red: 0.97, green: 0.98, blue: 1 } });
  p2.drawRectangle({ x: 45, y: 405, width: 505, height: 30, color: { type: 'RGB', red: 0.12, green: 0.25, blue: 0.45 } });
  p2.drawText('Channel', { x: 55, y: 417, size: 9.5, font: bold, color: { type: 'RGB', red: 1, green: 1, blue: 1 } });
  p2.drawText('Color Tag', { x: 230, y: 417, size: 9.5, font: bold, color: { type: 'RGB', red: 1, green: 1, blue: 1 } });
  p2.drawText('Growth', { x: 450, y: 417, size: 9.5, font: bold, color: { type: 'RGB', red: 1, green: 1, blue: 1 } });

  p2.drawText('Direct Consumer Platform', { x: 55, y: 382, size: 9, font, color: { type: 'RGB', red: 0.2, green: 0.2, blue: 0.2 } });
  p2.drawText('Vibrant Cyan', { x: 230, y: 382, size: 9, font, color: { type: 'RGB', red: 0.05, green: 0.5, blue: 0.8 } });
  p2.drawText('+42.8%', { x: 450, y: 382, size: 9, font: bold, color: { type: 'RGB', red: 0.08, green: 0.6, blue: 0.25 } });

  p2.drawText('Global Wholesale Portal', { x: 55, y: 355, size: 9, font, color: { type: 'RGB', red: 0.2, green: 0.2, blue: 0.2 } });
  p2.drawText('Amber Sunset', { x: 230, y: 355, size: 9, font, color: { type: 'RGB', red: 0.85, green: 0.45, blue: 0.1 } });
  p2.drawText('+28.4%', { x: 450, y: 355, size: 9, font: bold, color: { type: 'RGB', red: 0.08, green: 0.6, blue: 0.25 } });

  p2.drawText('Page 2 of 3 — Full-Color Analytics & Visual Charts', { x: 45, y: 40, size: 8.5, font, color: { type: 'RGB', red: 0.5, green: 0.5, blue: 0.5 } });

  // --- Page 3: Brand Guidelines & Official Seals ---
  const p3 = pdfDoc.addPage([595, 842]);
  p3.drawRectangle({ x: 0, y: 745, width: 595, height: 97, color: { type: 'RGB', red: 0.15, green: 0.22, blue: 0.35 } });
  p3.drawText('BRAND SPECIFICATIONS & COLOR SYSTEM', { x: 45, y: 795, size: 17, font: bold, color: { type: 'RGB', red: 1, green: 1, blue: 1 } });
  p3.drawText('Approved Hex Swatches, Typography & Print Verification', { x: 45, y: 768, size: 10.5, font, color: { type: 'RGB', red: 0.75, green: 0.85, blue: 0.95 } });

  p3.drawText('3. Primary Color Swatches', { x: 45, y: 705, size: 13, font: bold, color: { type: 'RGB', red: 0.12, green: 0.16, blue: 0.28 } });

  // 4 Big Swatch Boxes
  const swatches = [
    { name: 'Royal Indigo', hex: '#4F46E5', color: { type: 'RGB', red: 0.31, green: 0.27, blue: 0.90 } },
    { name: 'Bright Rose', hex: '#F43F5E', color: { type: 'RGB', red: 0.96, green: 0.25, blue: 0.37 } },
    { name: 'Amber Gold', hex: '#F59E0B', color: { type: 'RGB', red: 0.96, green: 0.62, blue: 0.04 } },
    { name: 'Emerald Mint', hex: '#10B981', color: { type: 'RGB', red: 0.06, green: 0.73, blue: 0.51 } }
  ];
  swatches.forEach((s, idx) => {
    const x = 45 + idx * 128;
    p3.drawRectangle({ x, y: 580, width: 120, height: 100, color: s.color });
    p3.drawRectangle({ x, y: 550, width: 120, height: 30, color: { type: 'RGB', red: 0.96, green: 0.97, blue: 0.99 } });
    p3.drawText(s.name, { x: x + 8, y: 566, size: 8.5, font: bold, color: { type: 'RGB', red: 0.15, green: 0.2, blue: 0.3 } });
    p3.drawText(s.hex, { x: x + 8, y: 554, size: 8, font, color: { type: 'RGB', red: 0.45, green: 0.5, blue: 0.55 } });
  });

  // Official Seal
  p3.drawRectangle({ x: 180, y: 370, width: 235, height: 80, color: { type: 'RGB', red: 0.95, green: 0.98, blue: 0.95 }, borderColor: { type: 'RGB', red: 0.1, green: 0.65, blue: 0.3 }, borderWidth: 2 });
  p3.drawText('★ VERIFIED COLOR ASSET ★', { x: 215, y: 425, size: 10.5, font: bold, color: { type: 'RGB', red: 0.1, green: 0.65, blue: 0.3 } });
  p3.drawText('Print Ready CMYK & DeviceRGB Compatible', { x: 205, y: 405, size: 8.5, font, color: { type: 'RGB', red: 0.2, green: 0.4, blue: 0.3 } });
  p3.drawText('Cert ID: CLR-2026-981', { x: 245, y: 385, size: 8, font: bold, color: { type: 'RGB', red: 0.1, green: 0.55, blue: 0.25 } });

  p3.drawText('Page 3 of 3 — Color Swatches & Regulatory Seal', { x: 45, y: 40, size: 8.5, font, color: { type: 'RGB', red: 0.5, green: 0.5, blue: 0.5 } });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    name: 'Sample_Vibrant_Color_Portfolio.pdf',
    size: pdfBytes.byteLength,
    formattedSize: formatBytes(pdfBytes.byteLength),
    pageCount: 3,
    buffer: pdfBytes.buffer
  };
}

/**
 * Grayscale History Storage Handlers
 */
export function getGrayscaleHistory() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_GRAYSCALE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGrayscaleHistory(item) {
  if (typeof localStorage === 'undefined' || !item) return;
  try {
    const history = getGrayscaleHistory();
    const updated = [
      {
        id: `gray_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...item
      },
      ...history
    ].slice(0, 15);
    localStorage.setItem(STORAGE_GRAYSCALE_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota
  }
}

export function clearGrayscaleHistory() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_GRAYSCALE_HISTORY_KEY);
  } catch {
    // Ignore
  }
}
