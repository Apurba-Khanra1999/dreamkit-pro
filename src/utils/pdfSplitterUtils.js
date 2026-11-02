import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { createZipArchive } from './imageCompressorUtils';

// Configure pdfjs worker for Vite browser bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const STORAGE_SPLIT_HISTORY_KEY = 'dreamkit_pdf_splitter_history';

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
 * Format bytes to human-readable format
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
 * Load PDF file information, inspect all pages, and generate thumbnails
 */
export async function loadPdfDocumentForSplit(rawBuffer, filename = 'document.pdf', onProgress = null) {
  const safeBuffer = cloneBuffer(rawBuffer);
  const pdfDoc = await PDFDocument.load(cloneBuffer(safeBuffer), { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  if (pageCount === 0) {
    throw new Error('This PDF contains no pages.');
  }

  const pagesInfo = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const width = Math.round(page.getWidth());
    const height = Math.round(page.getHeight());
    const rotation = page.getRotation().angle;
    const isLandscape = (rotation === 90 || rotation === 270) ? height > width : width > height;

    pagesInfo.push({
      pageNumber: i + 1,
      pageIndex: i,
      width,
      height,
      orientation: isLandscape ? 'Landscape' : 'Portrait',
      thumbnail: null
    });
  }

  // Render thumbnails in parallel/chunks with progress reporting
  for (let i = 0; i < pageCount; i++) {
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: pageCount,
        stage: `Rendering thumbnail for Page ${i + 1} of ${pageCount}...`,
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
 * Parse range string (e.g. "1-3, 4-6, 7") into separate group definitions
 * Returns array of { label: string, pageIndices: number[], count: number }
 */
export function parseRangeGroups(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) return [];

  const rawGroups = rangeStr.split(/[,;]/);
  const groups = [];

  for (let gIdx = 0; gIdx < rawGroups.length; gIdx++) {
    const part = rawGroups[gIdx].trim();
    if (!part) continue;

    const indicesSet = new Set();

    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);

      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          indicesSet.add(p - 1);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        indicesSet.add(num - 1);
      }
    }

    const sortedIndices = Array.from(indicesSet).sort((a, b) => a - b);
    if (sortedIndices.length > 0) {
      const label = sortedIndices.length === 1
        ? `Page ${sortedIndices[0] + 1}`
        : `Pages ${sortedIndices[0] + 1}-${sortedIndices[sortedIndices.length - 1] + 1}`;

      groups.push({
        id: `range_group_${gIdx + 1}`,
        rawText: part,
        label,
        pageIndices: sortedIndices,
        count: sortedIndices.length
      });
    }
  }

  return groups;
}

/**
 * Calculate the split plan according to chosen mode and configuration
 */
export function calculateSplitPlan({
  mode = 'all', // 'all' | 'range' | 'fixed' | 'extract_selected' | 'split_at'
  totalPages = 1,
  config = {},
  selectedPages = [] // 1-indexed numbers e.g. [1, 2, 4]
}) {
  const parts = [];

  switch (mode) {
    case 'all': {
      // Each page becomes an individual 1-page PDF
      for (let i = 0; i < totalPages; i++) {
        parts.push({
          id: `page_${i + 1}`,
          label: `Page ${i + 1}`,
          pageIndices: [i],
          suffix: `page_${i + 1}`
        });
      }
      break;
    }

    case 'fixed': {
      // Split into chunks of N pages (default: 2)
      const chunkSize = Math.max(1, parseInt(config.chunkSize || 2, 10));
      let currentPart = 1;
      for (let i = 0; i < totalPages; i += chunkSize) {
        const indices = [];
        const end = Math.min(i + chunkSize, totalPages);
        for (let j = i; j < end; j++) {
          indices.push(j);
        }
        const startNum = i + 1;
        const endNum = end;
        const label = startNum === endNum ? `Page ${startNum}` : `Pages ${startNum}-${endNum}`;

        parts.push({
          id: `part_${currentPart}`,
          label,
          pageIndices: indices,
          suffix: `part_${currentPart}_pages_${startNum}-${endNum}`
        });
        currentPart++;
      }
      break;
    }

    case 'range': {
      // Split by custom comma-separated range groups
      const groups = parseRangeGroups(config.rangeString || '', totalPages);
      if (groups.length === 0) {
        return {
          parts: [],
          error: 'Please enter valid page ranges (e.g., "1-2, 3-5, 6").'
        };
      }
      groups.forEach((grp, idx) => {
        parts.push({
          id: `range_${idx + 1}`,
          label: grp.label,
          pageIndices: grp.pageIndices,
          suffix: `part_${idx + 1}_${grp.label.toLowerCase().replace(/\s+/g, '_')}`
        });
      });
      break;
    }

    case 'extract_selected': {
      // User selected specific pages via visual page grid
      const validSelected = Array.from(new Set(selectedPages))
        .filter((p) => p >= 1 && p <= totalPages)
        .sort((a, b) => a - b);

      if (validSelected.length === 0) {
        return {
          parts: [],
          error: 'No pages selected. Please select at least one page from the grid.'
        };
      }

      if (config.combineSelected) {
        // Output 1 consolidated PDF with all selected pages
        const indices = validSelected.map((p) => p - 1);
        parts.push({
          id: 'selected_consolidated',
          label: `Selected Pages (${validSelected.length} pages)`,
          pageIndices: indices,
          suffix: `selected_${validSelected.length}_pages`
        });
      } else {
        // Output separate 1-page PDF for each selected page
        validSelected.forEach((pageNum) => {
          parts.push({
            id: `selected_page_${pageNum}`,
            label: `Page ${pageNum}`,
            pageIndices: [pageNum - 1],
            suffix: `page_${pageNum}`
          });
        });
      }
      break;
    }

    case 'split_at': {
      // Split at cut points (e.g. cut before page 3, 5)
      const rawCuts = (config.cutPoints || '')
        .split(/[,;]/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 1 && n <= totalPages);

      const uniqueCuts = Array.from(new Set(rawCuts)).sort((a, b) => a - b);

      if (uniqueCuts.length === 0) {
        return {
          parts: [],
          error: `Enter cut boundaries between 2 and ${totalPages} (e.g. "3, 5").`
        };
      }

      const boundaries = [1, ...uniqueCuts, totalPages + 1];
      for (let b = 0; b < boundaries.length - 1; b++) {
        const start = boundaries[b];
        const end = boundaries[b + 1] - 1;
        if (start <= end) {
          const indices = [];
          for (let p = start; p <= end; p++) {
            indices.push(p - 1);
          }
          const label = start === end ? `Page ${start}` : `Pages ${start}-${end}`;
          parts.push({
            id: `cut_part_${b + 1}`,
            label,
            pageIndices: indices,
            suffix: `part_${b + 1}_pages_${start}-${end}`
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return { parts, error: null };
}

/**
 * Execute PDF Splitting according to split plan
 */
export async function splitPdf({
  buffer,
  filename = 'document.pdf',
  splitPlan = [],
  customPrefix = '',
  onProgress = null
}) {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Invalid PDF buffer.');
  }
  if (!splitPlan || splitPlan.length === 0) {
    throw new Error('Split plan is empty.');
  }

  const baseName = customPrefix.trim() ? customPrefix.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : getBaseFileName(filename);
  const srcDoc = await PDFDocument.load(cloneBuffer(buffer), { ignoreEncryption: true });

  const outputFiles = [];
  let totalBytes = 0;
  let totalPagesCount = 0;

  for (let i = 0; i < splitPlan.length; i++) {
    const part = splitPlan[i];
    if (onProgress) {
      const pct = Math.round(((i + 1) / splitPlan.length) * 100);
      onProgress({
        current: i + 1,
        total: splitPlan.length,
        stage: `Generating "${part.label}" (${i + 1}/${splitPlan.length})...`,
        percent: pct
      });
    }

    const destDoc = await PDFDocument.create();
    destDoc.setTitle(`${baseName} - ${part.label}`);
    destDoc.setProducer('DreamKit PDF Splitter Studio');
    destDoc.setCreator('DreamKit');

    const copiedPages = await destDoc.copyPages(srcDoc, part.pageIndices);
    copiedPages.forEach((page) => destDoc.addPage(page));

    const savedBytes = await destDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });

    const fileBytes = cloneBuffer(savedBytes);
    const outFileName = `${baseName}_${part.suffix}.pdf`;
    const blob = new Blob([fileBytes], { type: 'application/pdf' });

    totalBytes += fileBytes.byteLength;
    totalPagesCount += copiedPages.length;

    outputFiles.push({
      id: generateUniqueId(),
      name: outFileName,
      label: part.label,
      pageCount: copiedPages.length,
      pageIndices: part.pageIndices,
      bytes: fileBytes,
      blob,
      size: fileBytes.byteLength,
      formattedSize: formatBytes(fileBytes.byteLength)
    });
  }

  return {
    files: outputFiles,
    totalOutputFiles: outputFiles.length,
    totalOutputPages: totalPagesCount,
    totalOutputBytes: totalBytes,
    formattedTotalOutputSize: formatBytes(totalBytes)
  };
}

/**
 * Bundle all split PDF files into a single ZIP archive
 */
export async function createSplitZipBlob(splitFiles = []) {
  if (!splitFiles || splitFiles.length === 0) {
    throw new Error('No files to archive.');
  }

  const zipItems = splitFiles.map((file) => ({
    name: file.name,
    blob: file.blob || new Blob([file.bytes], { type: 'application/pdf' })
  }));

  return await createZipArchive(zipItems);
}

/**
 * Generate a rich, realistic 6-page Corporate Annual Report for 1-click testing
 */
export async function generateSampleSplitPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Common Page Setup (A4: 595.28 x 841.89)
  const a4 = [595.28, 841.89];

  // ================= PAGE 1: Executive Cover & Overview =================
  const p1 = doc.addPage(a4);
  // Header Banner
  p1.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.08, 0.16, 0.28) });
  p1.drawText('DREAMKIT GLOBAL ENTERPRISES', { x: 45, y: 800, size: 20, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('ANNUAL PERFORMANCE REPORT & FISCAL AUDIT 2026', { x: 45, y: 775, size: 11, font: font, color: rgb(0.75, 0.85, 0.95) });
  p1.drawText('CONFIDENTIAL | SECTION 1 OF 6', { x: 45, y: 755, size: 9, font: bold, color: rgb(0.9, 0.7, 0.2) });

  p1.drawText('1. Executive Scope & Strategic Milestones', { x: 45, y: 700, size: 14, font: bold, color: rgb(0.1, 0.2, 0.35) });
  p1.drawText(`During fiscal year 2026, DreamKit expanded its privacy-first suite of document processing
utilities to over 14 million daily active users worldwide. All computational pipelines
operate entirely client-side using browser-native WebAssembly, WebGL, and canvas primitives,
ensuring complete data confidentiality with 0% data exfiltration risk.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  // KPI Highlights Grid
  p1.drawRectangle({ x: 45, y: 480, width: 505, height: 120, color: rgb(0.96, 0.98, 1.0), borderColor: rgb(0.85, 0.9, 0.98), borderWidth: 1 });
  p1.drawText('Key Operating Metrics', { x: 60, y: 575, size: 11, font: bold, color: rgb(0.1, 0.2, 0.4) });

  p1.drawText('Revenue Growth: +42.8% YoY', { x: 60, y: 545, size: 10, font: bold, color: rgb(0.15, 0.5, 0.25) });
  p1.drawText('Net Retention Rate: 134%', { x: 60, y: 520, size: 10, font, color: rgb(0.35, 0.35, 0.35) });

  p1.drawText('Documents Processed: 1.2B', { x: 300, y: 545, size: 10, font: bold, color: rgb(0.1, 0.3, 0.7) });
  p1.drawText('Cloud Latency: 0ms (Local In-Memory)', { x: 300, y: 520, size: 10, font, color: rgb(0.35, 0.35, 0.35) });

  p1.drawText('Table of Contents', { x: 45, y: 430, size: 13, font: bold, color: rgb(0.1, 0.2, 0.35) });
  const toc = [
    'Page 1: Executive Summary & Corporate Highlights',
    'Page 2: Consolidated Financial Performance & Revenue Matrix',
    'Page 3: Global Infrastructure & Edge Scalability',
    'Page 4: Sustainability & Environmental Stewardship',
    'Page 5: Regulatory Compliance, GDPR & Risk Framework',
    'Page 6: Board of Directors Sign-Off & Approvals'
  ];
  toc.forEach((item, idx) => {
    p1.drawText(item, { x: 55, y: 395 - idx * 24, size: 9.5, font, color: rgb(0.25, 0.25, 0.25) });
  });

  // Footer
  p1.drawText('DreamKit PDF Splitter Sample | Page 1 of 6', { x: 45, y: 35, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });

  // ================= PAGE 2: Financial Performance =================
  const p2 = doc.addPage(a4);
  p2.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.06, 0.22, 0.15) });
  p2.drawText('SECTION 2: CONSOLIDATED FINANCIAL PERFORMANCE', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p2.drawText('Quarterly Revenue, Capital Allocations & Operational Margins', { x: 45, y: 770, size: 10, font, color: rgb(0.8, 0.95, 0.85) });

  p2.drawText('Financial Overview Table (USD in Millions)', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.1, 0.2, 0.15) });

  p2.drawRectangle({ x: 45, y: 480, width: 505, height: 200, color: rgb(0.97, 0.99, 0.97), borderColor: rgb(0.8, 0.9, 0.82), borderWidth: 1 });

  // Headers
  p2.drawText('Division', { x: 60, y: 655, size: 10.5, font: bold, color: rgb(0.1, 0.25, 0.15) });
  p2.drawText('Q1 2026', { x: 190, y: 655, size: 10.5, font: bold, color: rgb(0.1, 0.25, 0.15) });
  p2.drawText('Q2 2026', { x: 280, y: 655, size: 10.5, font: bold, color: rgb(0.1, 0.25, 0.15) });
  p2.drawText('Q3 2026', { x: 370, y: 655, size: 10.5, font: bold, color: rgb(0.1, 0.25, 0.15) });
  p2.drawText('Total FY26', { x: 460, y: 655, size: 10.5, font: bold, color: rgb(0.1, 0.25, 0.15) });

  const finRows = [
    ['Enterprise Tooling', '$18.4M', '$22.1M', '$25.8M', '$66.3M'],
    ['Developer API SDK', '$12.0M', '$14.3M', '$16.9M', '$43.2M'],
    ['Pro Subscriptions', '$8.5M', '$9.8M', '$11.2M', '$29.5M'],
    ['Security Services', '$5.2M', '$6.0M', '$7.1M', '$18.3M'],
    ['Consolidated Revenue', '$44.1M', '$52.2M', '$61.0M', '$157.3M']
  ];

  finRows.forEach((row, i) => {
    const y = 620 - i * 28;
    const isTotal = i === 4;
    p2.drawText(row[0], { x: 60, y, size: 9.5, font: isTotal ? bold : font, color: rgb(0.2, 0.2, 0.2) });
    p2.drawText(row[1], { x: 190, y, size: 9.5, font: isTotal ? bold : font, color: rgb(0.2, 0.2, 0.2) });
    p2.drawText(row[2], { x: 280, y, size: 9.5, font: isTotal ? bold : font, color: rgb(0.2, 0.2, 0.2) });
    p2.drawText(row[3], { x: 370, y, size: 9.5, font: isTotal ? bold : font, color: rgb(0.2, 0.2, 0.2) });
    p2.drawText(row[4], { x: 460, y, size: 9.5, font: bold, color: isTotal ? rgb(0.1, 0.5, 0.2) : rgb(0.2, 0.2, 0.2) });
  });

  p2.drawText('DreamKit PDF Splitter Sample | Page 2 of 6', { x: 45, y: 35, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });

  // ================= PAGE 3: Technology Infrastructure =================
  const p3 = doc.addPage(a4);
  p3.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.25, 0.12, 0.35) });
  p3.drawText('SECTION 3: GLOBAL INFRASTRUCTURE & SCALABILITY', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p3.drawText('Edge Delivery, Memory Efficiency & Zero-Cloud Compute Architecture', { x: 45, y: 770, size: 10, font, color: rgb(0.9, 0.8, 0.95) });

  p3.drawText('Zero-Server Client Architecture', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.25, 0.12, 0.35) });
  p3.drawText(`By executing parsing, rasterization, and compression routines locally on modern browser
v8 and JavaScript engines, server operating expenses remain near zero regardless of traffic surges.
System elasticity benchmarks verify sub-50ms execution times across 99.8% of user transactions.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  p3.drawRectangle({ x: 45, y: 460, width: 505, height: 160, color: rgb(0.98, 0.96, 0.99), borderColor: rgb(0.88, 0.82, 0.92), borderWidth: 1 });
  p3.drawText('Core Architectural Pillars', { x: 60, y: 595, size: 11, font: bold, color: rgb(0.25, 0.12, 0.35) });
  p3.drawText('• WebAssembly PDF Matrix: Linear memory pooling with zero buffer detachment', { x: 60, y: 565, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });
  p3.drawText('• Object Stream Serialization: Lossless flate stream compaction compliant with PDF 1.7', { x: 60, y: 535, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });
  p3.drawText('• High-DPI Canvas Virtualization: Viewport rasterization matching native device pixels', { x: 60, y: 505, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });
  p3.drawText('• Asynchronous Event Loop: Zero main-thread blocking during large file transformations', { x: 60, y: 475, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });

  p3.drawText('DreamKit PDF Splitter Sample | Page 3 of 6', { x: 45, y: 35, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });

  // ================= PAGE 4: Sustainability & ESG =================
  const p4 = doc.addPage(a4);
  p4.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.04, 0.28, 0.25) });
  p4.drawText('SECTION 4: SUSTAINABILITY & ESG COMMITMENT', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p4.drawText('Environmental Impact, Carbon Neutral Edge & Energy Metrics', { x: 45, y: 770, size: 10, font, color: rgb(0.8, 0.95, 0.92) });

  p4.drawText('Sustainable Edge Computing', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.04, 0.28, 0.25) });
  p4.drawText(`Traditional centralized cloud document processing consumes megawatt hours of energy in server farms.
DreamKit eliminates 94% of datacenter cooling and compute power by shifting transformation logic
directly to client CPUs. In 2026 alone, our users prevented an estimated 1,420 metric tons of CO2 emissions.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  p4.drawRectangle({ x: 45, y: 490, width: 505, height: 130, color: rgb(0.96, 0.99, 0.98), borderColor: rgb(0.8, 0.9, 0.88), borderWidth: 1 });
  p4.drawText('Carbon Reduction Benchmarks', { x: 60, y: 595, size: 11, font: bold, color: rgb(0.04, 0.28, 0.25) });
  p4.drawText('Net Zero Datacenter Footprint: 100% achieved for client-side tool suites', { x: 60, y: 565, size: 9.5, font, color: rgb(0.3, 0.45, 0.35) });
  p4.drawText('Renewable Edge Power: All CDN assets served via 100% renewable energy nodes', { x: 60, y: 535, size: 9.5, font, color: rgb(0.3, 0.45, 0.35) });
  p4.drawText('Hardware Life Extension: Low memory footprint maintains responsiveness on older hardware', { x: 60, y: 505, size: 9.5, font, color: rgb(0.3, 0.45, 0.35) });

  p4.drawText('DreamKit PDF Splitter Sample | Page 4 of 6', { x: 45, y: 35, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });

  // ================= PAGE 5: Regulatory Compliance & Security =================
  const p5 = doc.addPage(a4);
  p5.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.32, 0.2, 0.05) });
  p5.drawText('SECTION 5: REGULATORY COMPLIANCE & SECURITY', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p5.drawText('GDPR, HIPAA, ISO-27001 & SOC-2 Type II Certification Standards', { x: 45, y: 770, size: 10, font, color: rgb(0.95, 0.9, 0.8) });

  p5.drawText('Zero-Telemetry Privacy Guarantee', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.32, 0.2, 0.05) });
  p5.drawText(`Because documents never transit the internet, organizations in healthcare, legal, and banking
can freely use DreamKit for sensitive contracts, patient records, and financial disclosures.
No logs, cookies, or remote analytics track document contents or filenames.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  p5.drawRectangle({ x: 45, y: 470, width: 505, height: 150, color: rgb(0.99, 0.98, 0.95), borderColor: rgb(0.92, 0.88, 0.8), borderWidth: 1 });
  p5.drawText('Compliance Matrix', { x: 60, y: 595, size: 11, font: bold, color: rgb(0.32, 0.2, 0.05) });
  p5.drawText('• HIPAA Safe Harbor: No Protected Health Information (PHI) stored or transmitted', { x: 60, y: 565, size: 9.5, font, color: rgb(0.4, 0.35, 0.25) });
  p5.drawText('• GDPR Article 25: Data protection by design and default validated by independent counsel', { x: 60, y: 535, size: 9.5, font, color: rgb(0.4, 0.35, 0.25) });
  p5.drawText('• SOC-2 Type II: Annual third-party penetration and security controls audit passed', { x: 60, y: 505, size: 9.5, font, color: rgb(0.4, 0.35, 0.25) });
  p5.drawText('• CCPA / CPRA: Zero sale or retention of consumer personal information', { x: 60, y: 475, size: 9.5, font, color: rgb(0.4, 0.35, 0.25) });

  p5.drawText('DreamKit PDF Splitter Sample | Page 5 of 6', { x: 45, y: 35, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });

  // ================= PAGE 6: Board Approvals & Signatures =================
  const p6 = doc.addPage(a4);
  p6.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.35, 0.08, 0.15) });
  p6.drawText('SECTION 6: BOARD APPROVALS & SIGNATURES', { x: 45, y: 795, size: 16, font: bold, color: rgb(1, 1, 1) });
  p6.drawText('Final Executive Sign-Off & Corporate Authorization', { x: 45, y: 770, size: 10, font, color: rgb(0.95, 0.85, 0.88) });

  p6.drawText('Formal Executive Resolution', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.35, 0.08, 0.15) });
  p6.drawText(`The undersigned officers and board members of DreamKit Global Enterprises hereby certify
that the financial representations, infrastructural designs, and compliance statements contained
within this 6-page comprehensive report are accurate and approved for fiscal deployment.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  // Signature Block 1
  p6.drawRectangle({ x: 45, y: 510, width: 235, height: 100, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1, color: rgb(0.99, 0.99, 0.99) });
  p6.drawText('Chief Executive Officer', { x: 55, y: 590, size: 10, font: bold, color: rgb(0.2, 0.2, 0.2) });
  p6.drawText('Dr. Elena Vance, Ph.D.', { x: 55, y: 565, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  p6.drawText('Status: Approved & Sealed', { x: 55, y: 530, size: 9, font: bold, color: rgb(0.1, 0.5, 0.2) });

  // Signature Block 2
  p6.drawRectangle({ x: 315, y: 510, width: 235, height: 100, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1, color: rgb(0.99, 0.99, 0.99) });
  p6.drawText('Chief Financial Officer', { x: 325, y: 590, size: 10, font: bold, color: rgb(0.2, 0.2, 0.2) });
  p6.drawText('Marcus Thorne, CPA', { x: 325, y: 565, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  p6.drawText('Status: Validated & Audited', { x: 325, y: 530, size: 9, font: bold, color: rgb(0.1, 0.5, 0.2) });

  // Corporate Seal graphic box
  p6.drawRectangle({ x: 45, y: 390, width: 505, height: 80, color: rgb(0.98, 0.96, 0.96), borderColor: rgb(0.9, 0.8, 0.85), borderWidth: 1 });
  p6.drawText('OFFICIAL SEAL OF VERIFICATION', { x: 60, y: 445, size: 10.5, font: bold, color: rgb(0.35, 0.08, 0.15) });
  p6.drawText('Verification Hash: 8F92-A41C-77B0-90E4-2026 | Document Integrity: Cryptographically Verified', { x: 60, y: 420, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  p6.drawText('DreamKit PDF Splitter Sample | Page 6 of 6', { x: 45, y: 35, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });

  const bytes = await doc.save({ useObjectStreams: false });

  return {
    name: 'DreamKit_Corporate_Annual_Report_2026.pdf',
    buffer: cloneBuffer(bytes)
  };
}

/**
 * Trigger browser download of PDF bytes
 */
export function downloadPdfBlob(bytes, filename = 'split_document.pdf') {
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
 * Trigger browser download of ZIP Blob
 */
export function downloadZipBlob(zipBlob, filename = 'split_documents.zip') {
  const url = URL.createObjectURL(zipBlob);
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
 * Split History Management
 */
export function getSplitHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_SPLIT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSplitHistory(entry) {
  try {
    const history = getSplitHistory();
    const item = {
      id: generateUniqueId(),
      title: entry.title || 'Split Document',
      mode: entry.mode,
      modeLabel: entry.modeLabel,
      originalPages: entry.originalPages,
      outputFilesCount: entry.outputFilesCount,
      totalSize: entry.totalSize,
      formattedSize: formatBytes(entry.totalSize),
      timestamp: new Date().toISOString()
    };
    const updated = [item, ...history].slice(0, 15);
    localStorage.setItem(STORAGE_SPLIT_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearSplitHistory() {
  try {
    localStorage.removeItem(STORAGE_SPLIT_HISTORY_KEY);
  } catch {
    // ignore
  }
}
