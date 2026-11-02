import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker for Vite browser bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const STORAGE_MERGE_HISTORY_KEY = 'dreamkit_pdf_merger_history';

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
 * Render a single page thumbnail using PDF.js without detaching source buffer
 */
export async function renderPdfThumbnail(arrayBuffer, pageNum = 1, scale = 0.35) {
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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } catch {
    return null;
  }
}

/**
 * Load PDF file information, page count, and cover thumbnail
 */
export async function loadPdfFileInfo(rawBuffer, filename = 'document.pdf') {
  const safeBuffer = cloneBuffer(rawBuffer);
  const pdfDoc = await PDFDocument.load(cloneBuffer(safeBuffer), { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  let firstPageDimensions = null;
  if (pageCount > 0) {
    const p1 = pdfDoc.getPage(0);
    firstPageDimensions = {
      width: Math.round(p1.getWidth()),
      height: Math.round(p1.getHeight())
    };
  }

  // Render thumbnail
  const thumbnail = await renderPdfThumbnail(cloneBuffer(safeBuffer), 1, 0.4);

  return {
    id: generateUniqueId(),
    name: filename,
    size: safeBuffer.byteLength,
    formattedSize: formatBytes(safeBuffer.byteLength),
    pageCount,
    dimensions: firstPageDimensions,
    buffer: safeBuffer,
    thumbnail,
    pageRange: '', // '' represents all pages
    rotation: 0 // 0, 90, 180, 270 degrees
  };
}

/**
 * Parse page range string (e.g. "1-3, 5, 7") into 0-indexed array of page indices
 */
export function parsePageIndices(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set();
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
          indices.add(p - 1);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        indices.add(num - 1);
      }
    }
  }

  const result = Array.from(indices).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i);
}

/**
 * Calculate expected page count for a file given its range
 */
export function getSelectedPageCount(file) {
  if (!file) return 0;
  return parsePageIndices(file.pageRange, file.pageCount).length;
}

/**
 * Core PDF Merge Runner
 */
export async function mergePdfs({
  files = [],
  options = {},
  onProgress = null
}) {
  if (!files || files.length === 0) {
    throw new Error('Please add at least one PDF file to merge.');
  }

  const {
    addPageNumbers = false,
    pageNumberPos = 'bottom_center', // 'bottom_center' | 'bottom_right' | 'top_right'
    pageNumberFormat = 'x_of_y', // 'x_of_y' | 'x'
    title = 'Merged Document',
    author = 'DreamKit PDF Studio'
  } = options;

  const mergedDoc = await PDFDocument.create();
  mergedDoc.setTitle(title);
  mergedDoc.setAuthor(author);
  mergedDoc.setProducer('DreamKit PDF Merger');
  mergedDoc.setCreator('DreamKit');

  const filePageMap = [];
  let totalCumulativePages = 0;

  // Step 1: Copy and append pages from each file
  for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
    const file = files[fileIdx];
    const targetIndices = parsePageIndices(file.pageRange, file.pageCount);

    if (onProgress) {
      const pct = Math.round(((fileIdx) / files.length) * 80);
      onProgress({
        current: fileIdx + 1,
        total: files.length,
        stage: `Importing pages from "${file.name}" (${fileIdx + 1}/${files.length})...`,
        percent: pct
      });
    }

    const srcDoc = await PDFDocument.load(cloneBuffer(file.buffer), { ignoreEncryption: true });
    const copiedPages = await mergedDoc.copyPages(srcDoc, targetIndices);

    for (const page of copiedPages) {
      if (file.rotation && file.rotation !== 0) {
        const currentAngle = page.getRotation().angle;
        page.setRotation(degrees((currentAngle + file.rotation) % 360));
      }
      mergedDoc.addPage(page);
    }

    filePageMap.push({
      fileName: file.name,
      pageCount: copiedPages.length,
      startPage: totalCumulativePages + 1,
      endPage: totalCumulativePages + copiedPages.length
    });

    totalCumulativePages += copiedPages.length;
  }

  // Step 2: Add Page Numbers (if enabled)
  if (addPageNumbers && totalCumulativePages > 0) {
    if (onProgress) {
      onProgress({
        current: files.length,
        total: files.length,
        stage: 'Stamping page numbers...',
        percent: 85
      });
    }

    const font = await mergedDoc.embedFont(StandardFonts.Helvetica);
    const pages = mergedDoc.getPages();
    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];
      const pageNumStr = pageNumberFormat === 'x_of_y' ? `Page ${i + 1} of ${total}` : `${i + 1}`;
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

  // Step 3: Serialize merged PDF with object streams for compact size
  if (onProgress) {
    onProgress({
      current: files.length,
      total: files.length,
      stage: 'Compressing and finalizing merged PDF...',
      percent: 95
    });
  }

  const mergedBytes = await mergedDoc.save({
    useObjectStreams: true,
    addDefaultPage: false
  });

  return {
    mergedBytes: cloneBuffer(mergedBytes),
    totalPages: totalCumulativePages,
    totalSize: mergedBytes.byteLength,
    formattedSize: formatBytes(mergedBytes.byteLength),
    filePageMap
  };
}

/**
 * Generate 3 realistic sample PDFs for instant one-click testing
 */
export async function generateSamplePdfs() {
  // Document 1: Project Proposal & Executive Summary (2 pages)
  const doc1 = await PDFDocument.create();
  const font1 = await doc1.embedFont(StandardFonts.Helvetica);
  const bold1 = await doc1.embedFont(StandardFonts.HelveticaBold);

  const d1p1 = doc1.addPage([595.28, 841.89]);
  d1p1.drawRectangle({ x: 0, y: 760, width: 595.28, height: 81.89, color: rgb(0.08, 0.16, 0.28) });
  d1p1.drawText('PART 1: PROJECT PROPOSAL & CHARTER', { x: 40, y: 795, size: 18, font: bold1, color: rgb(1, 1, 1) });
  d1p1.drawText('Document Version: 2.4 | Status: Approved', { x: 40, y: 775, size: 10, font: font1, color: rgb(0.8, 0.85, 0.9) });

  d1p1.drawText('1. Executive Scope & Strategic Objectives', { x: 40, y: 720, size: 13, font: bold1, color: rgb(0.1, 0.2, 0.35) });
  d1p1.drawText(`This initiative delivers high-performance client-side document processing capabilities.
By leveraging modern web standards, zero-telemetry client execution guarantees
uncompromising security, instant response times, and reduced infrastructure overhead.`, {
    x: 40,
    y: 690,
    size: 10,
    font: font1,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  // Table graphic
  d1p1.drawRectangle({ x: 40, y: 550, width: 515, height: 100, color: rgb(0.96, 0.97, 0.99), borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 1 });
  d1p1.drawText('Key Milestones', { x: 55, y: 625, size: 11, font: bold1, color: rgb(0.1, 0.15, 0.25) });
  d1p1.drawText('Phase 1: Architecture Review & Engine Benchmarks', { x: 55, y: 600, size: 9.5, font: font1, color: rgb(0.35, 0.35, 0.35) });
  d1p1.drawText('Phase 2: High-DPI Rendering & Stream Serialization', { x: 55, y: 575, size: 9.5, font: font1, color: rgb(0.35, 0.35, 0.35) });

  const d1p2 = doc1.addPage([595.28, 841.89]);
  d1p2.drawText('2. Stakeholder Approvals', { x: 40, y: 800, size: 14, font: bold1, color: rgb(0.1, 0.2, 0.35) });
  d1p2.drawText('Lead Architect: Dr. Sarah Jenkins (Approved on Nov 1, 2026)', { x: 40, y: 770, size: 10, font: font1, color: rgb(0.3, 0.3, 0.3) });
  d1p2.drawText('Security Compliance: ISO-27001 Validated', { x: 40, y: 745, size: 10, font: font1, color: rgb(0.3, 0.3, 0.3) });

  const bytes1 = await doc1.save({ useObjectStreams: false });

  // Document 2: Financial Budget & Allocation (1 page)
  const doc2 = await PDFDocument.create();
  const font2 = await doc2.embedFont(StandardFonts.Helvetica);
  const bold2 = await doc2.embedFont(StandardFonts.HelveticaBold);

  const d2p1 = doc2.addPage([595.28, 841.89]);
  d2p1.drawRectangle({ x: 0, y: 760, width: 595.28, height: 81.89, color: rgb(0.06, 0.22, 0.15) });
  d2p1.drawText('PART 2: FINANCIAL BUDGET & CAPITAL EXPENDITURE', { x: 40, y: 795, size: 16, font: bold2, color: rgb(1, 1, 1) });
  d2p1.drawText('Fiscal Year 2026-2027 | Audit Reference: FIN-8892', { x: 40, y: 775, size: 10, font: font2, color: rgb(0.8, 0.95, 0.85) });

  d2p1.drawRectangle({ x: 40, y: 480, width: 515, height: 240, color: rgb(0.96, 0.99, 0.97), borderColor: rgb(0.82, 0.92, 0.85), borderWidth: 1 });
  d2p1.drawText('Department', { x: 60, y: 690, size: 11, font: bold2, color: rgb(0.1, 0.2, 0.15) });
  d2p1.drawText('Allocation', { x: 280, y: 690, size: 11, font: bold2, color: rgb(0.1, 0.2, 0.15) });
  d2p1.drawText('Variance', { x: 430, y: 690, size: 11, font: bold2, color: rgb(0.1, 0.2, 0.15) });

  const rows = [
    ['Core Engineering & Frontend', '$450,000', '+2.4%'],
    ['Security Audits & Hardening', '$180,000', '-1.1%'],
    ['DevOps & Infrastructure CI/CD', '$220,000', '0.0%'],
    ['QA & Multi-Browser Benchmarking', '$95,000', '+0.5%'],
    ['Total Capital Budget', '$945,000', '+1.2%']
  ];

  rows.forEach((row, i) => {
    const y = 650 - i * 32;
    d2p1.drawText(row[0], { x: 60, y, size: 10, font: i === 4 ? bold2 : font2, color: rgb(0.2, 0.2, 0.2) });
    d2p1.drawText(row[1], { x: 280, y, size: 10, font: i === 4 ? bold2 : font2, color: rgb(0.2, 0.2, 0.2) });
    d2p1.drawText(row[2], { x: 430, y, size: 10, font: i === 4 ? bold2 : font2, color: rgb(0.1, 0.5, 0.2) });
  });

  const bytes2 = await doc2.save({ useObjectStreams: false });

  // Document 3: Technical Appendix & Sign-Off (2 pages)
  const doc3 = await PDFDocument.create();
  const font3 = await doc3.embedFont(StandardFonts.Helvetica);
  const bold3 = await doc3.embedFont(StandardFonts.HelveticaBold);

  const d3p1 = doc3.addPage([595.28, 841.89]);
  d3p1.drawRectangle({ x: 0, y: 760, width: 595.28, height: 81.89, color: rgb(0.25, 0.1, 0.25) });
  d3p1.drawText('PART 3: TECHNICAL APPENDIX & SIGNATURES', { x: 40, y: 795, size: 16, font: bold3, color: rgb(1, 1, 1) });
  d3p1.drawText('Legal Compliance & Terms of Deployment', { x: 40, y: 775, size: 10, font: font3, color: rgb(0.9, 0.8, 0.9) });

  d3p1.drawText('A. Verification Standards & Protocol', { x: 40, y: 720, size: 13, font: bold3, color: rgb(0.3, 0.1, 0.3) });
  d3p1.drawText(`All merged artifacts meet PDF 1.7 standards with object stream optimization.
Client browser isolation ensures complete privacy conformance with GDPR and HIPAA mandates.`, {
    x: 40,
    y: 690,
    size: 10,
    font: font3,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  const d3p2 = doc3.addPage([595.28, 841.89]);
  d3p2.drawText('B. Signatures and Execution', { x: 40, y: 800, size: 14, font: bold3, color: rgb(0.3, 0.1, 0.3) });
  d3p2.drawRectangle({ x: 40, y: 680, width: 240, height: 70, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
  d3p2.drawText('Authorized Signature: Executive Director', { x: 45, y: 660, size: 9, font: font3, color: rgb(0.4, 0.4, 0.4) });

  d3p2.drawRectangle({ x: 315, y: 680, width: 240, height: 70, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
  d3p2.drawText('Authorized Signature: Lead Counsel', { x: 320, y: 660, size: 9, font: font3, color: rgb(0.4, 0.4, 0.4) });

  const bytes3 = await doc3.save({ useObjectStreams: false });

  return [
    { name: '1_Project_Proposal_Charter.pdf', buffer: cloneBuffer(bytes1) },
    { name: '2_Financial_Budget_Allocation.pdf', buffer: cloneBuffer(bytes2) },
    { name: '3_Technical_Appendix_Signatures.pdf', buffer: cloneBuffer(bytes3) }
  ];
}

/**
 * Trigger local browser download for merged PDF
 */
export function downloadPdfBlob(bytes, filename = 'merged_document.pdf') {
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
 * Merge History Storage Management
 */
export function getMergeHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_MERGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMergeHistory(entry) {
  try {
    const history = getMergeHistory();
    const item = {
      id: generateUniqueId(),
      title: entry.title || 'Merged Document.pdf',
      fileCount: entry.fileCount,
      totalPages: entry.totalPages,
      totalSize: entry.totalSize,
      formattedSize: formatBytes(entry.totalSize),
      timestamp: new Date().toISOString()
    };
    const updated = [item, ...history].slice(0, 15);
    localStorage.setItem(STORAGE_MERGE_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearMergeHistory() {
  try {
    localStorage.removeItem(STORAGE_MERGE_HISTORY_KEY);
  } catch {
    // ignore
  }
}
