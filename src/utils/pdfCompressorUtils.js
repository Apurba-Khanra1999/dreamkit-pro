import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker for Vite browser bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const STORAGE_HISTORY_KEY = 'dreamkit_pdf_compressor_history';

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

// Standard preset options
export const COMPRESSION_PRESETS = {
  balanced: {
    id: 'balanced',
    name: 'Balanced (Recommended)',
    description: 'Optimal balance of crisp visual clarity and significant size reduction (50% - 75% savings).',
    scale: 1.5,
    quality: 0.72,
    colorMode: 'color',
    stripMetadata: true,
    isRaster: true,
    badge: 'Popular',
    badgeVariant: 'emerald'
  },
  extreme: {
    id: 'extreme',
    name: 'Extreme Compression',
    description: 'Maximum size reduction for strict email attachments & portal upload limits (<1MB / <500KB).',
    scale: 1.0,
    quality: 0.45,
    colorMode: 'color',
    stripMetadata: true,
    isRaster: true,
    badge: 'Max Savings',
    badgeVariant: 'amber'
  },
  lossless: {
    id: 'lossless',
    name: 'Lossless Vector & Stream',
    description: 'Compresses cross-reference tables & object streams. Keeps all selectable text & vector sharpness 100% intact.',
    scale: 1.0,
    quality: 1.0,
    colorMode: 'color',
    stripMetadata: true,
    isRaster: false,
    badge: 'Vector Sharp',
    badgeVariant: 'blue'
  },
  grayscale: {
    id: 'grayscale',
    name: 'Grayscale & B/W Scan',
    description: 'Converts color pages to clean monochrome. Drastically shrinks scanned invoices, forms, and contracts.',
    scale: 1.25,
    quality: 0.52,
    colorMode: 'grayscale',
    stripMetadata: true,
    isRaster: true,
    badge: 'Scans & Forms',
    badgeVariant: 'purple'
  },
  custom: {
    id: 'custom',
    name: 'Custom Fine-Tuning',
    description: 'Customize DPI resolution, JPEG compression factor, color space, and metadata filters.',
    scale: 1.5,
    quality: 0.70,
    colorMode: 'color',
    stripMetadata: true,
    isRaster: true,
    badge: 'Pro Tuning',
    badgeVariant: 'indigo'
  }
};

/**
 * Format bytes to readable human string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calculate reduction percentage and saved bytes
 */
export function getCompressionMetrics(originalSize, compressedSize) {
  const orig = Math.max(originalSize, 1);
  const comp = Math.max(compressedSize, 0);
  const savedBytes = Math.max(orig - comp, 0);
  const percent = ((savedBytes / orig) * 100);
  return {
    savedBytes,
    formattedSaved: formatBytes(savedBytes),
    percentReduction: percent.toFixed(1),
    isSmaller: comp < orig
  };
}

/**
 * Inspect PDF metadata and basic page count
 */
export async function loadPdfMetadata(arrayBuffer) {
  const safeBuffer = cloneBuffer(arrayBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  const title = pdfDoc.getTitle() || '';
  const author = pdfDoc.getAuthor() || '';
  const producer = pdfDoc.getProducer() || '';
  const creator = pdfDoc.getCreator() || '';
  const creationDate = pdfDoc.getCreationDate() ? pdfDoc.getCreationDate().toISOString() : null;
  const modificationDate = pdfDoc.getModificationDate() ? pdfDoc.getModificationDate().toISOString() : null;

  let firstPageDimensions = null;
  if (pageCount > 0) {
    const p1 = pdfDoc.getPage(0);
    firstPageDimensions = {
      width: Math.round(p1.getWidth()),
      height: Math.round(p1.getHeight())
    };
  }

  return {
    pageCount,
    title,
    author,
    producer,
    creator,
    creationDate,
    modificationDate,
    dimensions: firstPageDimensions,
    sizeBytes: arrayBuffer.byteLength,
    formattedSize: formatBytes(arrayBuffer.byteLength)
  };
}

/**
 * Convert canvas image data to grayscale in-place
 */
function applyGrayscale(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    // Luminance formula
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = gray;
    d[i + 1] = gray;
    d[i + 2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Parse page range string (e.g. "1-3, 5, 7") into 0-indexed array of page numbers
 */
export function parsePageRange(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = new Set();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          pages.add(p - 1);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pages.add(num - 1);
      }
    }
  }

  const result = Array.from(pages).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i);
}

/**
 * Core PDF Compression Runner
 */
export async function compressPdf({
  arrayBuffer,
  mode = 'balanced',
  customOptions = {},
  onProgress = null
}) {
  const safeBuffer = cloneBuffer(arrayBuffer);
  const originalSize = safeBuffer.byteLength;
  const preset = COMPRESSION_PRESETS[mode] || COMPRESSION_PRESETS.balanced;

  const scale = mode === 'custom' ? (customOptions.scale || 1.5) : preset.scale;
  const quality = mode === 'custom' ? (customOptions.quality || 0.70) : preset.quality;
  const colorMode = mode === 'custom' ? (customOptions.colorMode || 'color') : preset.colorMode;
  const stripMetadata = mode === 'custom' ? (customOptions.stripMetadata ?? true) : preset.stripMetadata;
  const isRaster = mode === 'custom' ? (customOptions.isRaster ?? true) : preset.isRaster;
  const pageRangeStr = customOptions.pageRange || '';

  // Mode 1: Pure Lossless Structural & Stream Compression
  if (!isRaster || mode === 'lossless') {
    if (onProgress) {
      onProgress({ current: 1, total: 1, stage: 'Packing object streams & optimizing cross-references...', percent: 50 });
    }

    const pdfDoc = await PDFDocument.load(cloneBuffer(safeBuffer), { ignoreEncryption: true });

    if (stripMetadata) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('DreamKit PDF Optimizer');
      pdfDoc.setCreator('DreamKit');
    }

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });

    const metrics = getCompressionMetrics(originalSize, compressedBytes.byteLength);

    return {
      compressedBytes,
      originalSize,
      compressedSize: compressedBytes.byteLength,
      ...metrics,
      pageCount: pdfDoc.getPageCount(),
      mode,
      isLossless: true
    };
  }

  // Mode 2: Multi-Page Rasterization & High-Efficiency Re-encoding
  const loadingTask = pdfjsLib.getDocument({ data: toTransferableUint8Array(safeBuffer) });
  const pdfJsDoc = await loadingTask.promise;
  const totalPages = pdfJsDoc.numPages;

  const targetPages = parsePageRange(pageRangeStr, totalPages);
  const newPdfDoc = await PDFDocument.create();

  if (stripMetadata) {
    newPdfDoc.setProducer('DreamKit PDF Optimizer');
    newPdfDoc.setCreator('DreamKit');
  }

  const pagePreviews = [];

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx] + 1;
    if (onProgress) {
      const pct = Math.round(((idx) / targetPages.length) * 100);
      onProgress({
        current: idx + 1,
        total: targetPages.length,
        stage: `Rendering & compressing Page ${pageNum} of ${totalPages}...`,
        percent: pct
      });
    }

    const page = await pdfJsDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });

    // Fill white background for transparent pages
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    if (colorMode === 'grayscale') {
      applyGrayscale(ctx, canvas.width, canvas.height);
    }

    // Convert to compressed JPEG data
    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);

    // Keep first 2 page previews for side-by-side comparison
    if (idx < 3) {
      pagePreviews.push(jpegDataUrl);
    }

    // Embed into the new PDF
    const jpegBytes = await fetch(jpegDataUrl).then(r => r.arrayBuffer());
    const embeddedImage = await newPdfDoc.embedJpg(jpegBytes);

    const newPage = newPdfDoc.addPage([unscaledViewport.width, unscaledViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: unscaledViewport.width,
      height: unscaledViewport.height
    });

    // Clean up canvas
    canvas.width = 0;
    canvas.height = 0;
  }

  if (onProgress) {
    onProgress({
      current: targetPages.length,
      total: targetPages.length,
      stage: 'Finalizing compressed PDF package...',
      percent: 95
    });
  }

  let compressedBytes = await newPdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false
  });

  // Safety fallback: If raster compression somehow grew the file, compare with lossless
  if (compressedBytes.byteLength > originalSize) {
    try {
      const fallbackDoc = await PDFDocument.load(cloneBuffer(safeBuffer), { ignoreEncryption: true });
      const losslessBytes = await fallbackDoc.save({ useObjectStreams: true });
      if (losslessBytes.byteLength < compressedBytes.byteLength) {
        compressedBytes = losslessBytes;
      }
    } catch {
      // Keep rasterized version
    }
  }

  const metrics = getCompressionMetrics(originalSize, compressedBytes.byteLength);

  return {
    compressedBytes,
    originalSize,
    compressedSize: compressedBytes.byteLength,
    ...metrics,
    pageCount: targetPages.length,
    previews: pagePreviews,
    mode,
    isLossless: false
  };
}

/**
 * Render a single page thumbnail for visual comparison or gallery
 */
export async function renderPageThumbnail(arrayBuffer, pageNum = 1, scale = 0.4) {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: toTransferableUint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    if (pageNum < 1 || pageNum > pdf.numPages) return null;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } catch {
    return null;
  }
}

/**
 * Generate built-in sample PDFs for instant user testing
 */
export async function generateSamplePdf(type = 'invoice') {
  const doc = await PDFDocument.create();

  if (type === 'invoice') {
    // 2-page Business Invoice & Service Contract
    const p1 = doc.addPage([595.28, 841.89]);
    p1.drawRectangle({ x: 0, y: 760, width: 595.28, height: 81.89, color: { type: 'RGB', red: 0.08, green: 0.12, blue: 0.22 } });
    
    // Draw some high-contrast structural shapes
    p1.drawRectangle({ x: 40, y: 550, width: 515, height: 180, color: { type: 'RGB', red: 0.95, green: 0.96, blue: 0.98 } });
    p1.drawRectangle({ x: 40, y: 220, width: 515, height: 300, color: { type: 'RGB', red: 0.98, green: 0.98, blue: 0.99 } });

    const p2 = doc.addPage([595.28, 841.89]);
    p2.drawRectangle({ x: 40, y: 400, width: 515, height: 380, color: { type: 'RGB', red: 0.96, green: 0.97, blue: 0.98 } });
  } else {
    // 3-page Illustrated Report
    for (let i = 0; i < 3; i++) {
      const p = doc.addPage([595.28, 841.89]);
      p.drawRectangle({ x: 30, y: 30, width: 535.28, height: 781.89, color: { type: 'RGB', red: 0.96 + (i * 0.01), green: 0.97, blue: 0.99 } });
    }
  }

  const bytes = await doc.save({ useObjectStreams: false });
  return cloneBuffer(bytes);
}

/**
 * Trigger local browser download for compressed PDF
 */
export function downloadPdfBlob(bytes, filename = 'compressed_document.pdf') {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Open PDF in a new browser tab for instant review
 */
export function openPdfInNewTab(bytes) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Compression History Management
 */
export function getCompressionHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCompressionHistory(item) {
  try {
    const history = getCompressionHistory();
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      filename: item.filename || 'document.pdf',
      originalSize: item.originalSize,
      compressedSize: item.compressedSize,
      percentReduction: item.percentReduction,
      savedBytes: item.savedBytes,
      mode: item.mode,
      pageCount: item.pageCount,
      timestamp: new Date().toISOString()
    };
    const updated = [entry, ...history.filter(h => h.filename !== entry.filename || h.timestamp !== entry.timestamp)].slice(0, 15);
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearCompressionHistory() {
  try {
    localStorage.removeItem(STORAGE_HISTORY_KEY);
  } catch {
    // ignore
  }
}
