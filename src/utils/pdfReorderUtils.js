import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker for Vite browser bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const STORAGE_REORDER_HISTORY_KEY = 'dreamkit_pdf_reorder_history';

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
 * Format bytes to human readable format
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
 * Generate a unique ID
 */
export function generateUniqueId() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Strip extension from filename
 */
export function getBaseFileName(filename = 'document.pdf') {
  return filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Render a single page thumbnail using PDF.js without detaching source buffer
 */
export async function renderPageThumbnail(arrayBuffer, pageNum = 1, scale = 0.35) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: toTransferableUint8Array(arrayBuffer)
    });
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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } catch {
    return null;
  }
}

/**
 * Load PDF file information, inspect each page, and generate thumbnails
 */
export async function loadPdfForReorder(rawBuffer, filename = 'document.pdf', onProgress = null) {
  const safeBuffer = cloneBuffer(rawBuffer);
  const pdfDoc = await PDFDocument.load(cloneBuffer(safeBuffer), { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  if (pageCount === 0) {
    throw new Error('This PDF document contains no pages.');
  }

  const pagesInfo = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const width = Math.round(page.getWidth());
    const height = Math.round(page.getHeight());
    const originalRotation = page.getRotation().angle;
    const isLandscape = (originalRotation === 90 || originalRotation === 270) ? height > width : width > height;

    pagesInfo.push({
      id: `page_${i + 1}_${generateUniqueId()}`,
      originalIndex: i, // 0-based index in the source PDF
      originalPageNumber: i + 1, // 1-based page number in the source PDF
      width,
      height,
      orientation: isLandscape ? 'Landscape' : 'Portrait',
      rotation: 0, // Additional user rotation in degrees (0, 90, 180, 270)
      isBlank: false,
      thumbnail: null
    });
  }

  // Render thumbnails in parallel/chunks with progress reporting
  for (let i = 0; i < pageCount; i++) {
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: pageCount,
        stage: `Generating thumbnail for Page ${i + 1} of ${pageCount}...`,
        percent: Math.round(((i + 1) / pageCount) * 100)
      });
    }
    const thumb = await renderPageThumbnail(cloneBuffer(safeBuffer), i + 1, 0.4);
    pagesInfo[i].thumbnail = thumb;
  }

  return {
    id: generateUniqueId(),
    name: filename,
    baseName: getBaseFileName(filename),
    size: safeBuffer.byteLength,
    formattedSize: formatBytes(safeBuffer.byteLength),
    pageCount,
    pages: pagesInfo,
    buffer: safeBuffer
  };
}

/**
 * Parse a custom sequence string (e.g. "3, 1, 2, 5, 4" or "5-1") into 0-indexed page indices
 */
export function parseCustomSequence(sequenceStr, totalPages) {
  if (!sequenceStr || !sequenceStr.trim()) return [];

  const parts = sequenceStr.split(/[,;]/);
  const result = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);

      if (!isNaN(start) && !isNaN(end)) {
        if (start <= end) {
          const from = Math.max(1, start);
          const to = Math.min(totalPages, end);
          for (let p = from; p <= to; p++) {
            result.push(p - 1);
          }
        } else {
          // Reverse range like "5-1"
          const from = Math.min(totalPages, start);
          const to = Math.max(1, end);
          for (let p = from; p >= to; p--) {
            result.push(p - 1);
          }
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        result.push(num - 1);
      }
    }
  }

  return result;
}

/**
 * Execute PDF Reordering according to current page list and options
 */
export async function reorderPdf({
  buffer,
  pageList = [],
  options = {},
  onProgress = null
}) {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Invalid PDF buffer.');
  }
  if (!pageList || pageList.length === 0) {
    throw new Error('Cannot export empty document. Please keep at least one page.');
  }

  const {
    addPageNumbers = false,
    pageNumberPos = 'bottom_center', // 'bottom_center' | 'bottom_right' | 'top_right'
    pageNumberFormat = 'x_of_y', // 'x_of_y' | 'x'
    title = 'Reordered Document'
  } = options;

  const srcDoc = await PDFDocument.load(cloneBuffer(buffer), { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();
  newDoc.setTitle(title);
  newDoc.setProducer('DreamKit PDF Page Reorder Studio');
  newDoc.setCreator('DreamKit');

  const total = pageList.length;

  for (let i = 0; i < total; i++) {
    const item = pageList[i];

    if (onProgress) {
      const pct = Math.round(((i + 1) / total) * 85);
      onProgress({
        current: i + 1,
        total,
        stage: `Composing page ${i + 1} of ${total}...`,
        percent: pct
      });
    }

    if (item.isBlank) {
      // Add standard A4 blank page
      const blankPage = newDoc.addPage([item.width || 595.28, item.height || 841.89]);
      if (item.rotation && item.rotation !== 0) {
        blankPage.setRotation(degrees(item.rotation % 360));
      }
    } else {
      // Copy page from source
      const [copiedPage] = await newDoc.copyPages(srcDoc, [item.originalIndex]);
      if (item.rotation && item.rotation !== 0) {
        const currentAngle = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((currentAngle + item.rotation) % 360));
      }
      newDoc.addPage(copiedPage);
    }
  }

  // Stamp page numbers if requested
  if (addPageNumbers && total > 0) {
    if (onProgress) {
      onProgress({
        current: total,
        total,
        stage: 'Stamping sequential page numbers...',
        percent: 90
      });
    }

    const font = await newDoc.embedFont(StandardFonts.Helvetica);
    const pages = newDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageNumStr = pageNumberFormat === 'x_of_y' ? `Page ${i + 1} of ${pages.length}` : `${i + 1}`;
      const textWidth = font.widthOfTextAtSize(pageNumStr, 9);
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();

      let x = (pageWidth - textWidth) / 2; // bottom_center default
      let y = 20;

      if (pageNumberPos === 'bottom_right') {
        x = pageWidth - textWidth - 36;
        y = 20;
      } else if (pageNumberPos === 'top_right') {
        x = pageWidth - textWidth - 36;
        y = pageHeight - 25;
      }

      page.drawText(pageNumStr, {
        x,
        y,
        size: 9,
        font,
        color: rgb(0.35, 0.35, 0.35)
      });
    }
  }

  // Serialize with object streams for clean compact size
  if (onProgress) {
    onProgress({
      current: total,
      total,
      stage: 'Compressing and finalizing PDF...',
      percent: 98
    });
  }

  const savedBytes = await newDoc.save({
    useObjectStreams: true,
    addDefaultPage: false
  });

  const finalBytes = cloneBuffer(savedBytes);

  return {
    reorderedBytes: finalBytes,
    totalPages: total,
    totalSize: finalBytes.byteLength,
    formattedSize: formatBytes(finalBytes.byteLength)
  };
}

/**
 * Generate a 5-page sample PDF presentation deck with deliberately shuffled pages
 */
export async function generateSampleReorderPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const a4 = [595.28, 841.89];

  // Deliberate out-of-order sequence:
  // Page 1 in file: Slide 3
  // Page 2 in file: Slide 1
  // Page 3 in file: Slide 4
  // Page 4 in file: Slide 2
  // Page 5 in file: Slide 5

  // File Page 1: SLIDE 3
  const p1 = doc.addPage(a4);
  p1.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.08, 0.16, 0.28) });
  p1.drawText('SLIDE 3: SYSTEM ARCHITECTURE & DATA FLOW', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Notice: This page is currently placed as Page 1 in the document.', { x: 45, y: 770, size: 10, font, color: rgb(0.9, 0.7, 0.3) });

  p1.drawText('High-Performance WebAssembly Pipelines', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.1, 0.2, 0.35) });
  p1.drawText(`The compute kernel operates entirely in local device memory with zero network latency.
Linear buffers eliminate thread contention and ensure maximum throughput for document manipulation.`, {
    x: 45,
    y: 670,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });
  p1.drawRectangle({ x: 45, y: 500, width: 505, height: 140, color: rgb(0.96, 0.98, 1.0), borderColor: rgb(0.85, 0.9, 0.98), borderWidth: 1 });
  p1.drawText('Data Flow Pipeline', { x: 60, y: 615, size: 11, font: bold, color: rgb(0.1, 0.2, 0.4) });
  p1.drawText('1. Browser File Picker -> ArrayBuffer Transfer', { x: 60, y: 585, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });
  p1.drawText('2. Local Page Tree Indexing & Copying', { x: 60, y: 555, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });
  p1.drawText('3. Lossless Stream Packing -> Instant Download', { x: 60, y: 525, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });

  // File Page 2: SLIDE 1 (The true cover!)
  const p2 = doc.addPage(a4);
  p2.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.25, 0.12, 0.35) });
  p2.drawText('SLIDE 1: WELCOME & EXECUTIVE MISSION', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p2.drawText('Note: This is the actual Cover Slide! Reorder to Page 1.', { x: 45, y: 770, size: 10, font: bold, color: rgb(0.95, 0.85, 0.4) });

  p2.drawText('DreamKit Document Suite 2026', { x: 45, y: 700, size: 14, font: bold, color: rgb(0.25, 0.12, 0.35) });
  p2.drawText(`Empowering developers and power users with completely client-side browser tools.
All PDF rendering, splitting, merging, and page reordering happens on your CPU.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });
  p2.drawRectangle({ x: 45, y: 480, width: 505, height: 150, color: rgb(0.98, 0.96, 0.99), borderColor: rgb(0.88, 0.82, 0.92), borderWidth: 1 });
  p2.drawText('Core Tenets', { x: 60, y: 600, size: 11, font: bold, color: rgb(0.25, 0.12, 0.35) });
  p2.drawText('• 100% Privacy by Design: Zero server file uploads', { x: 60, y: 570, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });
  p2.drawText('• Instant Speed: Native memory operations', { x: 60, y: 540, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });
  p2.drawText('• Full Fidelity: Pure vector preservation', { x: 60, y: 510, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });

  // File Page 3: SLIDE 4
  const p3 = doc.addPage(a4);
  p3.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.06, 0.22, 0.15) });
  p3.drawText('SLIDE 4: SECURITY & CLIENT-SIDE PRIVACY', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p3.drawText('Notice: This page is currently placed as Page 3 in the document.', { x: 45, y: 770, size: 10, font, color: rgb(0.8, 0.95, 0.85) });

  p3.drawText('Zero Exfiltration Architecture', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.06, 0.22, 0.15) });
  p3.drawText(`Documents never leave the user workstation. No cloud databases, remote queues,
or external parsers are ever contacted during execution.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  // File Page 4: SLIDE 2
  const p4 = doc.addPage(a4);
  p4.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.35, 0.08, 0.15) });
  p4.drawText('SLIDE 2: MARKET OPPORTUNITY & USER METRICS', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p4.drawText('Note: This slide should logically follow Slide 1.', { x: 45, y: 770, size: 10, font: bold, color: rgb(0.95, 0.85, 0.88) });

  p4.drawText('Global Adoption Benchmarks', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.35, 0.08, 0.15) });
  p4.drawText(`14 million active developers trust DreamKit tools for daily workflows.
Average user session satisfaction scores exceed 98.4% globally.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  // File Page 5: SLIDE 5
  const p5 = doc.addPage(a4);
  p5.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.32, 0.2, 0.05) });
  p5.drawText('SLIDE 5: ROADMAP & STRATEGIC PRIORITIES', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p5.drawText('Conclusion Slide: Final summary and next steps.', { x: 45, y: 770, size: 10, font, color: rgb(0.95, 0.9, 0.8) });

  p5.drawText('Strategic Horizon 2026-2027', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.32, 0.2, 0.05) });
  p5.drawText(`1. Advanced client-side OCR for scanned documents
2. Lossless SVG rasterizer & vector optimizer integration
3. Extended multi-file batch pipelines with ZIP bundle archives`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 18,
    color: rgb(0.3, 0.3, 0.3)
  });

  const bytes = await doc.save({ useObjectStreams: false });

  return {
    name: 'Shuffled_Presentation_Deck_5_Pages.pdf',
    buffer: cloneBuffer(bytes)
  };
}

/**
 * Trigger local browser download for PDF bytes
 */
export function downloadPdfBlob(bytes, filename = 'reordered_document.pdf') {
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
 * Open PDF in a new browser tab for immediate preview
 */
export function openPdfInNewTab(bytes) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Reorder History Management
 */
export function getReorderHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_REORDER_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReorderHistory(entry) {
  try {
    const history = getReorderHistory();
    const item = {
      id: generateUniqueId(),
      title: entry.title || 'Reordered Document',
      originalPages: entry.originalPages,
      reorderedPages: entry.reorderedPages,
      totalSize: entry.totalSize,
      formattedSize: formatBytes(entry.totalSize),
      timestamp: new Date().toISOString()
    };
    const updated = [item, ...history].slice(0, 15);
    localStorage.setItem(STORAGE_REORDER_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearReorderHistory() {
  try {
    localStorage.removeItem(STORAGE_REORDER_HISTORY_KEY);
  } catch {
    // ignore
  }
}
