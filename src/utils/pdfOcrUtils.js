import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker for Vite browser bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const STORAGE_OCR_HISTORY_KEY = 'dreamkit_pdf_ocr_history';

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
 * Inspect PDF document metadata, page count, and detect if pages have embedded text
 */
export async function getPdfOcrInfo(rawBuffer, filename = 'document.pdf') {
  const safeBuffer = cloneBuffer(rawBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data: toTransferableUint8Array(safeBuffer)
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  const pagesInfo = [];
  let totalCharsInDoc = 0;

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str || '').join(' ').trim();
    const charCount = pageText.length;
    totalCharsInDoc += charCount;

    // If a page has very few characters (e.g. < 25), it is likely a scanned photo or image
    const isLikelyScanned = charCount < 25;

    pagesInfo.push({
      pageNumber: i,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      charCount,
      isLikelyScanned
    });
  }

  return {
    name: filename,
    size: safeBuffer.byteLength,
    formattedSize: formatBytes(safeBuffer.byteLength),
    pageCount,
    pages: pagesInfo,
    hasDigitalText: totalCharsInDoc > 50,
    buffer: safeBuffer
  };
}

/**
 * Pre-process canvas image data for optimal OCR character clarity
 */
export function preprocessCanvas(sourceCanvas, filter = 'contrast') {
  if (typeof document === 'undefined' || filter === 'none') return sourceCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  if (filter === 'grayscale') {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  } else if (filter === 'contrast') {
    // Increase contrast & brightness to clean up background scanner shadows
    const contrast = 1.35; // factor
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      let adjusted = factor * (gray - 128) + 128;
      adjusted = Math.max(0, Math.min(255, adjusted));
      data[i] = adjusted;
      data[i + 1] = adjusted;
      data[i + 2] = adjusted;
    }
  } else if (filter === 'binarize') {
    // Sharp high-contrast thresholding
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const binary = gray < 165 ? 0 : 255;
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Render a single page thumbnail using PDF.js without detaching source buffer
 */
export async function renderPageToCanvas(arrayBuffer, pageNum = 1, scale = 2.0) {
  if (typeof document === 'undefined') return null;
  try {
    const safeBuffer = cloneBuffer(arrayBuffer);
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

    return { canvas, viewport, width: canvas.width, height: canvas.height };
  } catch (err) {
    console.error('Failed to render page to canvas:', err);
    return null;
  }
}

/**
 * Extract structured text layer from a PDF.js page with Y-coordinate grouping and bounding boxes
 */
export async function extractTextLayerFromPage(pdfPage, scale = 1.0) {
  const textContent = await pdfPage.getTextContent({ normalizeWhitespace: true });
  const viewport = pdfPage.getViewport({ scale });

  const rawItems = textContent.items.map((item) => {
    const transform = item.transform; // [scaleX, skewY, skewX, scaleY, tx, ty]
    const x = transform[4];
    const y = transform[5];
    const width = item.width || 0;
    const height = item.height || Math.abs(transform[3]) || 12;

    // Convert PDF coordinates (origin bottom-left) to Viewport (origin top-left)
    const viewY = viewport.height - y - height;

    return {
      text: item.str,
      x: Math.round(x),
      y: Math.round(viewY),
      width: Math.round(width),
      height: Math.round(height),
      fontSize: Math.round(Math.abs(transform[3]))
    };
  }).filter((i) => i.text && i.text.trim().length > 0);

  // Group text items by line using Y-coordinate clustering (within 4px threshold)
  rawItems.sort((a, b) => a.y - b.y || a.x - b.x);

  const lines = [];
  let currentLine = null;

  for (const item of rawItems) {
    if (!currentLine) {
      currentLine = {
        text: item.text,
        y: item.y,
        x: item.x,
        maxX: item.x + item.width,
        height: item.height,
        words: [{ text: item.text, x: item.x, y: item.y, width: item.width, height: item.height }]
      };
    } else if (Math.abs(item.y - currentLine.y) <= 6) {
      // Same line
      const space = item.x > currentLine.maxX + 4 ? ' ' : '';
      currentLine.text += space + item.text;
      currentLine.maxX = Math.max(currentLine.maxX, item.x + item.width);
      currentLine.height = Math.max(currentLine.height, item.height);
      currentLine.words.push({ text: item.text, x: item.x, y: item.y, width: item.width, height: item.height });
    } else {
      lines.push(currentLine);
      currentLine = {
        text: item.text,
        y: item.y,
        x: item.x,
        maxX: item.x + item.width,
        height: item.height,
        words: [{ text: item.text, x: item.x, y: item.y, width: item.width, height: item.height }]
      };
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  const fullText = lines.map((l) => l.text).join('\n');
  const words = [];
  lines.forEach((l) => {
    l.words.forEach((w) => words.push(w));
  });

  return {
    text: fullText,
    lines,
    words,
    charCount: fullText.length,
    wordCount: fullText.split(/\s+/).filter(Boolean).length,
    confidence: 100 // Vector digital text has 100% confidence
  };
}

/**
 * Execute Tesseract.js OCR on a Canvas with error recovery and progress updates
 */
export async function performOcrOnCanvas(canvas, onProgress = null) {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');

    if (onProgress) {
      onProgress({ status: 'Recognizing text...', progress: 0.5 });
    }

    const ret = await worker.recognize(canvas);
    await worker.terminate();

    const data = ret.data;
    const extractedText = data.text || '';
    const confidence = Math.round(data.confidence || 85);

    // Format lines and word bounding boxes
    const lines = (data.lines || []).map((l) => ({
      text: l.text.trim(),
      confidence: Math.round(l.confidence || 0),
      bbox: l.bbox,
      words: (l.words || []).map((w) => ({
        text: w.text,
        confidence: Math.round(w.confidence || 0),
        x: w.bbox?.x0 || 0,
        y: w.bbox?.y0 || 0,
        width: (w.bbox?.x1 || 0) - (w.bbox?.x0 || 0),
        height: (w.bbox?.y1 || 0) - (w.bbox?.y0 || 0)
      }))
    }));

    const words = [];
    lines.forEach((l) => {
      l.words.forEach((w) => words.push(w));
    });

    return {
      text: extractedText,
      lines,
      words,
      confidence,
      charCount: extractedText.length,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length
    };
  } catch (err) {
    console.warn('Tesseract OCR worker unavailable or offline:', err);
    throw new Error('Tesseract OCR engine encountered an issue: ' + (err.message || 'Worker failure'));
  }
}

/**
 * Convert extracted plain text lines into structured Markdown
 */
export function formatAsMarkdown(pageResults, documentName = 'Document') {
  let md = `# OCR Extracted Text: ${documentName}\n\n`;

  pageResults.forEach((page) => {
    md += `## Page ${page.pageNumber}\n`;
    if (page.extractionMethod) {
      md += `*Method: ${page.extractionMethod} • Confidence: ${page.confidence}%*\n\n`;
    }

    const lines = page.text.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        md += '\n';
        return;
      }
      // Detect heading-like short lines or uppercase
      if (trimmed.length < 50 && (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed))) {
        md += `### ${trimmed}\n\n`;
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed)) {
        md += `${trimmed}\n`;
      } else {
        md += `${trimmed}\n\n`;
      }
    });

    md += '\n---\n\n';
  });

  return md.trim();
}

/**
 * Detect and convert columnar tabular lines into structured CSV
 */
export function formatAsCsv(pageResults) {
  const allLines = [];
  pageResults.forEach((page) => {
    const lines = page.text.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) allLines.push(trimmed);
    });
  });

  const csvRows = [];
  for (const line of allLines) {
    // If line contains multiple spaces, tabs, or colons
    let cells = [];
    if (line.includes('\t')) {
      cells = line.split('\t');
    } else if (/\s{2,}/.test(line)) {
      cells = line.split(/\s{2,}/);
    } else if (line.includes('|')) {
      cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    } else {
      cells = [line];
    }

    const escaped = cells.map((c) => {
      const clean = c.trim().replace(/"/g, '""');
      return `"${clean}"`;
    });
    csvRows.push(escaped.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Main Pipeline: Extract text and run OCR across selected pages of PDF
 *
 * @param {ArrayBuffer} rawBuffer - Source PDF buffer
 * @param {Object} config - { engineMode: 'auto'|'ocr'|'native', filter: 'contrast'|'grayscale'|'binarize'|'none', pageRange: 'all'|'first'|'custom', customPages: '1-3' }
 * @param {Function} onProgress - Progress reporter callback
 */
export async function extractPdfWithOcr(rawBuffer, config = {}, onProgress = null) {
  const safeBuffer = cloneBuffer(rawBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data: toTransferableUint8Array(safeBuffer)
  });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const {
    engineMode = 'auto', // 'auto' | 'ocr' | 'native'
    filter = 'contrast', // 'contrast' | 'grayscale' | 'binarize' | 'none'
    pageRange = 'all', // 'all' | 'first' | 'last' | 'custom'
    customPages = ''
  } = config;

  // Determine target pages
  let targetPages = [];
  if (pageRange === 'first') {
    targetPages = [1];
  } else if (pageRange === 'last') {
    targetPages = [totalPages];
  } else if (pageRange === 'custom' && customPages.trim()) {
    const parts = customPages.split(/[,;]/);
    const set = new Set();
    for (const part of parts) {
      const clean = part.trim();
      if (clean.includes('-')) {
        const [s, e] = clean.split('-');
        const start = parseInt(s.trim(), 10);
        const end = parseInt(e.trim(), 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(totalPages, Math.max(start, end));
          for (let p = from; p <= to; p++) set.add(p);
        }
      } else {
        const num = parseInt(clean, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages) set.add(num);
      }
    }
    targetPages = Array.from(set).sort((a, b) => a - b);
  } else {
    targetPages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (targetPages.length === 0) {
    targetPages = [1];
  }

  const pageResults = [];
  let totalWordsCount = 0;
  let totalCharsCount = 0;
  let totalConfidenceSum = 0;

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];
    const page = await pdf.getPage(pageNum);

    if (onProgress) {
      const percent = Math.round(((idx + 1) / targetPages.length) * 100);
      onProgress({
        current: idx + 1,
        total: targetPages.length,
        percent,
        stage: `Processing Page ${pageNum} of ${totalPages}...`
      });
    }

    let extractedData = null;
    let extractionMethod = 'Native Text Layer';

    // 1. Try native text layer first
    const nativeExtraction = await extractTextLayerFromPage(page, 1.0);

    const shouldRunOcr =
      engineMode === 'ocr' ||
      (engineMode === 'auto' && nativeExtraction.charCount < 30);

    if (shouldRunOcr) {
      // Scanned image page or explicit OCR mode: Render to high-DPI canvas
      try {
        const renderRes = await renderPageToCanvas(safeBuffer, pageNum, 2.0);
        if (renderRes?.canvas) {
          const processedCanvas = preprocessCanvas(renderRes.canvas, filter);
          const ocrRes = await performOcrOnCanvas(processedCanvas, (p) => {
            if (onProgress) {
              onProgress({
                current: idx + 1,
                total: targetPages.length,
                percent: Math.round(((idx + 0.5) / targetPages.length) * 100),
                stage: `Running OCR on Page ${pageNum} (${Math.round((p.progress || 0) * 100)}%)...`
              });
            }
          });
          extractedData = ocrRes;
          extractionMethod = 'Tesseract OCR Engine';
        }
      } catch (ocrErr) {
        console.warn(`OCR fallback for page ${pageNum}:`, ocrErr);
        // Graceful fallback to native text layer
        extractedData = nativeExtraction;
        extractionMethod = 'Native Text Layer (OCR Fallback)';
      }
    } else {
      extractedData = nativeExtraction;
      extractionMethod = 'Native Vector Character Layer';
    }

    if (!extractedData) {
      extractedData = nativeExtraction;
    }

    totalWordsCount += extractedData.wordCount || 0;
    totalCharsCount += extractedData.charCount || 0;
    totalConfidenceSum += extractedData.confidence || 90;

    pageResults.push({
      pageNumber: pageNum,
      extractionMethod,
      ...extractedData
    });
  }

  // Combined full text with page dividers
  const fullDocumentText = pageResults
    .map((p) => `--- Page ${p.pageNumber} (${p.extractionMethod}) ---\n${p.text}`)
    .join('\n\n');

  const avgConfidence = Math.round(totalConfidenceSum / pageResults.length);
  const readingTimeMinutes = Math.max(1, Math.round(totalWordsCount / 220));

  // Structured Exports
  const markdownContent = formatAsMarkdown(pageResults, 'Document');
  const csvContent = formatAsCsv(pageResults);
  const jsonExport = JSON.stringify(
    {
      document: 'Extracted PDF OCR',
      totalPages,
      processedPages: targetPages,
      metrics: {
        totalWords: totalWordsCount,
        totalCharacters: totalCharsCount,
        avgConfidence: avgConfidence + '%',
        readingTimeMinutes
      },
      pages: pageResults
    },
    null,
    2
  );

  return {
    fullText: fullDocumentText,
    markdown: markdownContent,
    csv: csvContent,
    json: jsonExport,
    pages: pageResults,
    pageCount: totalPages,
    processedPagesCount: targetPages.length,
    wordCount: totalWordsCount,
    charCount: totalCharsCount,
    avgConfidence,
    readingTimeMinutes
  };
}

/**
 * Generate a 2-page Scanned Document (Invoice & Tax Audit) for instant 1-click testing
 */
export async function generateSampleScannedInvoicePdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  // --- Page 1: Commercial Invoice & Bill of Lading ---
  const p1 = pdfDoc.addPage([595, 842]);
  p1.drawRectangle({ x: 0, y: 740, width: 595, height: 102, color: rgb(0.1, 0.15, 0.25) });
  p1.drawText('COMMERCIAL INVOICE & EXPENSE AUDIT', { x: 45, y: 795, size: 18, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Invoice Number: INV-2026-9482 • Billed Date: Nov 02, 2026', { x: 45, y: 765, size: 11, font, color: rgb(0.7, 0.8, 0.95) });

  // Vendor & Customer Blocks
  p1.drawRectangle({ x: 45, y: 645, width: 240, height: 80, color: rgb(0.97, 0.98, 1) });
  p1.drawText('VENDOR INFORMATION:', { x: 55, y: 705, size: 9.5, font: bold, color: rgb(0.15, 0.23, 0.38) });
  p1.drawText('DreamKit Global Systems Ltd.\n742 Silicon Parkway, Suite 900\nSan Francisco, CA 94107', { x: 55, y: 685, size: 9, font, lineHeight: 14, color: rgb(0.3, 0.35, 0.4) });

  p1.drawRectangle({ x: 310, y: 645, width: 240, height: 80, color: rgb(0.97, 0.98, 1) });
  p1.drawText('CLIENT / BILL TO:', { x: 320, y: 705, size: 9.5, font: bold, color: rgb(0.15, 0.23, 0.38) });
  p1.drawText('Acme Corporation Enterprises\nAttn: Accounts Payable\n100 Enterprise Boulevard, NY', { x: 320, y: 685, size: 9, font, lineHeight: 14, color: rgb(0.3, 0.35, 0.4) });

  // Table Header
  p1.drawRectangle({ x: 45, y: 600, width: 505, height: 28, color: rgb(0.15, 0.23, 0.38) });
  p1.drawText('Item Description', { x: 55, y: 610, size: 10, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Qty', { x: 320, y: 610, size: 10, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Unit Price', { x: 380, y: 610, size: 10, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Total Amount', { x: 460, y: 610, size: 10, font: bold, color: rgb(1, 1, 1) });

  const lineItems = [
    { desc: 'High-Performance WebAssembly OCR Processing Core', qty: '1', price: '$4,500.00', total: '$4,500.00' },
    { desc: 'Vector Text Stream Layout Recovery Pipeline', qty: '2', price: '$1,850.00', total: '$3,700.00' },
    { desc: 'Optical Character Recognition Traineddata Bundle', qty: '1', price: '$2,200.00', total: '$2,200.00' },
    { desc: 'Multi-threaded Canvas Pre-processing Shaders', qty: '3', price: '$650.00', total: '$1,950.00' },
    { desc: 'Client-side Privacy Architecture Implementation', qty: '1', price: '$3,400.00', total: '$3,400.00' }
  ];

  lineItems.forEach((item, idx) => {
    const rowY = 570 - idx * 30;
    p1.drawRectangle({
      x: 45,
      y: rowY - 5,
      width: 505,
      height: 26,
      color: idx % 2 === 0 ? rgb(0.97, 0.98, 0.99) : rgb(1, 1, 1)
    });
    p1.drawText(item.desc, { x: 55, y: rowY + 3, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    p1.drawText(item.qty, { x: 325, y: rowY + 3, size: 9, font: courier, color: rgb(0.2, 0.2, 0.2) });
    p1.drawText(item.price, { x: 380, y: rowY + 3, size: 9, font: courier, color: rgb(0.2, 0.2, 0.2) });
    p1.drawText(item.total, { x: 465, y: rowY + 3, size: 9, font: courier, color: rgb(0.1, 0.2, 0.4) });
  });

  // Financial Subtotals Box
  p1.drawRectangle({ x: 330, y: 350, width: 220, height: 100, color: rgb(0.96, 0.97, 0.99) });
  p1.drawText('Subtotal:', { x: 345, y: 425, size: 9.5, font, color: rgb(0.3, 0.3, 0.3) });
  p1.drawText('$15,750.00', { x: 465, y: 425, size: 9.5, font: courier, color: rgb(0.2, 0.2, 0.2) });

  p1.drawText('Sales Tax (8.25%):', { x: 345, y: 400, size: 9.5, font, color: rgb(0.3, 0.3, 0.3) });
  p1.drawText('$1,299.38', { x: 465, y: 400, size: 9.5, font: courier, color: rgb(0.2, 0.2, 0.2) });

  p1.drawLine({ start: { x: 345, y: 385 }, end: { x: 535, y: 385 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  p1.drawText('TOTAL DUE:', { x: 345, y: 365, size: 11, font: bold, color: rgb(0.1, 0.2, 0.4) });
  p1.drawText('$17,049.38', { x: 450, y: 365, size: 11, font: bold, color: rgb(0.08, 0.55, 0.25) });

  // Paid Stamp
  p1.drawRectangle({ x: 55, y: 355, width: 180, height: 65, color: rgb(0.95, 0.98, 0.95), borderColor: rgb(0.15, 0.65, 0.25), borderWidth: 2 });
  p1.drawText('AUDITED & VERIFIED', { x: 75, y: 395, size: 11, font: bold, color: rgb(0.15, 0.65, 0.25) });
  p1.drawText('Payment Authorized #9482', { x: 75, y: 375, size: 8.5, font, color: rgb(0.2, 0.5, 0.3) });

  p1.drawText('Page 1 of 2 — Commercial Expense Voucher (Scannable Grid)', { x: 45, y: 40, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });

  // --- Page 2: Regulatory Tax Compliance & Audit Certificate ---
  const p2 = pdfDoc.addPage([595, 842]);
  p2.drawRectangle({ x: 0, y: 750, width: 595, height: 92, color: rgb(0.12, 0.16, 0.28) });
  p2.drawText('REGULATORY COMPLIANCE & CERTIFICATE OF AUDIT', { x: 45, y: 800, size: 16, font: bold, color: rgb(1, 1, 1) });
  p2.drawText('ISO-27001 & SOC-2 Type II Automated Document Extraction Certificate', { x: 45, y: 772, size: 10, font, color: rgb(0.7, 0.8, 0.95) });

  p2.drawText('1. Executive Certification Statement', { x: 45, y: 710, size: 13, font: bold, color: rgb(0.12, 0.16, 0.28) });
  p2.drawText(
    'The computational extraction pipeline verifies that all line items, tax distributions, and customer identities\n' +
    'conform to federal GAAP reporting guidelines. Optical character extraction occurred entirely in memory\n' +
    'without transmission across public communications or external cloud services.',
    { x: 45, y: 680, size: 9.5, font, lineHeight: 15, color: rgb(0.25, 0.28, 0.35) }
  );

  p2.drawText('2. Key Extraction Benchmarks', { x: 45, y: 610, size: 13, font: bold, color: rgb(0.12, 0.16, 0.28) });
  const points = [
    '• Native Vector Extraction Speed: Under 45 milliseconds per page',
    '• Deep OCR Optical Recognition: Adaptive image thresholding with 98.4% mean character confidence',
    '• Tabular Reconstruction: Multi-space column separation into valid RFC-4180 CSV formats',
    '• Structural Preservation: Headings, bullet items, and paragraph breaks preserved in clean Markdown'
  ];
  points.forEach((pt, i) => {
    p2.drawText(pt, { x: 55, y: 580 - i * 24, size: 9, font, color: rgb(0.2, 0.25, 0.35) });
  });

  p2.drawText('Page 2 of 2 — Commercial Expense Voucher (Scannable Grid)', { x: 45, y: 40, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    name: 'Sample_Invoice_Audit.pdf',
    size: pdfBytes.byteLength,
    formattedSize: formatBytes(pdfBytes.byteLength),
    pageCount: 2,
    buffer: pdfBytes.buffer
  };
}

/**
 * OCR History Storage Handlers
 */
export function getOcrHistory() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_OCR_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOcrHistory(item) {
  if (typeof localStorage === 'undefined' || !item) return;
  try {
    const history = getOcrHistory();
    const updated = [
      {
        id: `ocr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...item
      },
      ...history
    ].slice(0, 15);
    localStorage.setItem(STORAGE_OCR_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }
}

export function clearOcrHistory() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_OCR_HISTORY_KEY);
  } catch {
    // Ignore
  }
}
